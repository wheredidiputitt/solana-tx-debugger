import { NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";
import { analyzeTransaction } from "@/lib/solana/analyze";
import { findDemoTx, DEMO_SIGNATURES } from "@/lib/solana/demo-fixtures";
import { lookupMint } from "@/lib/solana/programs";
import type { TransactionReport, Transfer, BalanceChange } from "@/lib/solana/types";

// Rotate between public RPC endpoints.
const RPC_ENDPOINTS = [
  "https://api.mainnet-beta.solana.com",
  "https://solana-rpc.publicnode.com",
  "https://rpc.ankr.com/solana",
];

function getRpcUrl(): string {
  if (process.env.SOLANA_RPC_URL) return process.env.SOLANA_RPC_URL;
  if (process.env.HELIUS_API_KEY)
    return `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
  const idx = Math.floor(Math.random() * RPC_ENDPOINTS.length);
  return RPC_ENDPOINTS[idx];
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory price cache (5 min)
interface PriceCache {
  prices: Record<string, { usd: number; source: string }>;
  solUsd: number;
  expires: number;
}
let priceCache: PriceCache | null = null;
const PRICE_TTL = 5 * 60 * 1000;

async function fetchPrices(
  mints: string[]
): Promise<{ prices: Record<string, { usd: number; source: string }>; solUsd: number }> {
  if (priceCache && Date.now() < priceCache.expires) {
    return { prices: filterRequested(priceCache.prices, mints), solUsd: priceCache.solUsd };
  }

  // Always fetch SOL price + any requested mints
  const allMints = Array.from(
    new Set(["So11111111111111111111111111111111111111112", ...mints])
  ).filter(Boolean);

  const prices: Record<string, { usd: number; source: string }> = {};

  // 1) Try Birdeye multi_price for everything (works without key, low rate limit)
  try {
    const url = `https://public-api.birdeye.so/defi/multi_price?list_address=${allMints.join(",")}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "x-chain": "solana",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json: any = await res.json();
      if (json?.data) {
        for (const mint of Object.keys(json.data)) {
          const p = json.data[mint]?.value;
          if (typeof p === "number" && p > 0) {
            prices[mint] = { usd: p, source: "birdeye" };
          }
        }
      }
    }
  } catch {
    // ignore — try next source
  }

  // 2) If SOL price is still missing, try CoinGecko
  let solUsd = prices["So11111111111111111111111111111111111111112"]?.usd ?? 0;
  if (!solUsd) {
    try {
      const cg = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
        { signal: AbortSignal.timeout(5000) }
      );
      if (cg.ok) {
        const cgJson: any = await cg.json();
        solUsd = cgJson?.solana?.usd ?? 0;
        if (solUsd) {
          prices["So11111111111111111111111111111111111111112"] = {
            usd: solUsd,
            source: "coingecko",
          };
        }
      }
    } catch {
      // ignore
    }
  }

  // 3) Fill in any still-missing mints from local registry
  for (const m of allMints) {
    if (!prices[m]) {
      const meta = lookupMint(m);
      if (meta?.usdPrice) {
        prices[m] = { usd: meta.usdPrice, source: "registry" };
      }
    }
  }

  if (!solUsd) {
    solUsd = prices["So11111111111111111111111111111111111111112"]?.usd ?? 145;
  }

  priceCache = {
    prices,
    solUsd,
    expires: Date.now() + PRICE_TTL,
  };
  return { prices: filterRequested(prices, mints), solUsd };
}

function filterRequested(
  all: Record<string, { usd: number; source: string }>,
  requested: string[]
): Record<string, { usd: number; source: string }> {
  if (!requested.length) return all;
  const out: Record<string, { usd: number; source: string }> = {};
  for (const m of requested) {
    if (all[m]) out[m] = all[m];
  }
  return out;
}

/** Enrich a report with USD values for transfers + balance changes */
function enrichReportWithPrices(
  report: TransactionReport,
  priceData: { prices: Record<string, { usd: number; source: string }>; solUsd: number }
): TransactionReport {
  const solUsd = priceData.solUsd;
  let totalUsdValue = 0;

  // Transfers
  const transfers: Transfer[] = report.transfers.map((t) => {
    let price = 0;
    let usdValue: number | undefined;
    if (t.type === "native") {
      price = solUsd;
    } else if (t.mint && priceData.prices[t.mint]) {
      price = priceData.prices[t.mint].usd;
    } else {
      // Try registry
      const meta = lookupMint(t.mint);
      if (meta?.usdPrice) price = meta.usdPrice;
    }
    if (price > 0) {
      const amount = parseFloat(t.amount.replace(/,/g, ""));
      if (!isNaN(amount)) {
        usdValue = amount * price;
        totalUsdValue += usdValue;
      }
    }
    return { ...t, usdValue };
  });

  // Balance changes (SOL only)
  const balanceChanges: BalanceChange[] = report.balanceChanges.map((c) => {
    const solDelta = c.rawChange / 1_000_000_000;
    const usdValue = solUsd > 0 ? solDelta * solUsd : undefined;
    return { ...c, usdValue };
  });

  return {
    ...report,
    transfers,
    balanceChanges,
    totalUsdValue,
    solPriceUsd: solUsd,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const signature: string = (body.signature ?? "").toString().trim();
    const cluster: "mainnet-beta" | "devnet" | "testnet" | "demo" =
      body.cluster ?? "mainnet-beta";

    if (!signature) {
      return NextResponse.json(
        { error: "Missing 'signature' in request body." },
        { status: 400 }
      );
    }

    // 1) Demo fixtures first
    const demo = findDemoTx(signature);
    if (demo) {
      let report = analyzeTransaction(signature, demo, {
        cluster: "mainnet-beta",
        source: "demo",
      });

      // Enrich with prices
      const mints = Array.from(
        new Set(
          report.transfers
            .filter((t) => t.type === "spl" && t.mint)
            .map((t) => t.mint!)
        )
      );
      try {
        const priceData = await fetchPrices(mints);
        report = enrichReportWithPrices(report, priceData);
      } catch {
        // prices are best-effort
      }

      return NextResponse.json({
        report,
        demoSignatures: DEMO_SIGNATURES,
      });
    }

    // 2) Live RPC
    let url = getRpcUrl();
    if (cluster === "devnet") url = "https://api.devnet.solana.com";
    if (cluster === "testnet") url = "https://api.testnet.solana.com";

    try {
      const conn = new Connection(url, "confirmed");
      const tx = await conn.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });

      if (!tx) {
        return NextResponse.json(
          {
            error:
              "Transaction not found. It may not be finalized yet, or the signature was mistyped.",
            demoSignatures: DEMO_SIGNATURES,
          },
          { status: 404 }
        );
      }

      let report = analyzeTransaction(signature, tx, {
        cluster,
        source: "live",
      });

      // Enrich with prices
      const mints = Array.from(
        new Set(
          report.transfers
            .filter((t) => t.type === "spl" && t.mint)
            .map((t) => t.mint!)
        )
      );
      try {
        const priceData = await fetchPrices(mints);
        report = enrichReportWithPrices(report, priceData);
      } catch {
        // best-effort
      }

      return NextResponse.json({ report });
    } catch (rpcErr: any) {
      const fallback = findDemoTx("default");
      if (fallback) {
        let report = analyzeTransaction(signature, fallback, {
          cluster: "mainnet-beta",
          source: "demo",
        });
        const mints = Array.from(
          new Set(
            report.transfers
              .filter((t) => t.type === "spl" && t.mint)
              .map((t) => t.mint!)
          )
        );
        try {
          const priceData = await fetchPrices(mints);
          report = enrichReportWithPrices(report, priceData);
        } catch {
          // best-effort
        }
        return NextResponse.json({
          report,
          rpcError: rpcErr?.message ?? "RPC unreachable",
          fallbackUsed: true,
          demoSignatures: DEMO_SIGNATURES,
        });
      }
      throw rpcErr;
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "solana-analyze",
    demoSignatures: DEMO_SIGNATURES,
  });
}
