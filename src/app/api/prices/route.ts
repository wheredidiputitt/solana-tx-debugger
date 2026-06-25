import { NextResponse } from "next/server";
import { lookupMint } from "@/lib/solana/programs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PriceResponse {
  prices: Record<string, { usd: number; source: string; symbol?: string }>;
  solUsd: number;
  ts: number;
}

// In-memory cache (5 min TTL) so we don't hit the API repeatedly.
interface CacheEntry {
  data: PriceResponse;
  expires: number;
}
let cache: CacheEntry | null = null;
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Birdeye free tier (no API key required for /defi/price endpoint, but rate-limited).
 * Falls back to a local registry of approximate prices.
 *
 * Birdeye API: https://docs.birdeye.so/
 * Free tier: 50 req/min without API key, 100 req/min with free API key.
 */
async function fetchBirdeyePrices(
  mints: string[]
): Promise<Record<string, { usd: number; source: string; symbol?: string }>> {
  const out: Record<string, { usd: number; source: string; symbol?: string }> = {};

  // Try Birdeye's public price endpoint (no key required, low rate limit)
  // https://docs.birdeye.so/reference/get_defi-price
  try {
    const url = `https://public-api.birdeye.so/defi/multi_price?list_address=${mints
      .slice(0, 50)
      .join(",")}`;

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
            out[mint] = {
              usd: p,
              source: "birdeye",
              symbol: lookupMint(mint)?.symbol,
            };
          }
        }
      }
    }
  } catch {
    // Birdeye unreachable — fall through to registry
  }

  // Fill in any missing mints from local registry
  for (const mint of mints) {
    if (!out[mint]) {
      const meta = lookupMint(mint);
      if (meta?.usdPrice) {
        out[mint] = {
          usd: meta.usdPrice,
          source: "registry",
          symbol: meta.symbol,
        };
      }
    }
  }

  return out;
}

async function fetchSolPrice(): Promise<number> {
  // Try Birdeye for SOL price first
  try {
    const res = await fetch(
      "https://public-api.birdeye.so/defi/price?address=So11111111111111111111111111111111111111112",
      {
        headers: { "x-chain": "solana" },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (res.ok) {
      const json: any = await res.json();
      const p = json?.data?.value;
      if (typeof p === "number" && p > 0) return p;
    }
  } catch {
    // ignore
  }

  // Fallback to CoinGecko simple price API (free, no key)
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const json: any = await res.json();
      const p = json?.solana?.usd;
      if (typeof p === "number" && p > 0) return p;
    }
  } catch {
    // ignore
  }

  // Final fallback — approximate
  return 145;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const mints: string[] = Array.isArray(body.mints) ? body.mints : [];

    // Always include wSOL so we can derive SOL price
    const allMints = Array.from(
      new Set(["So11111111111111111111111111111111111111112", ...mints])
    ).filter(Boolean);

    if (cache && Date.now() < cache.expires) {
      return NextResponse.json({
        ...cache.data,
        prices: filterPrices(cache.data.prices, mints),
        cached: true,
      });
    }

    const [prices, solUsd] = await Promise.all([
      fetchBirdeyePrices(allMints),
      fetchSolPrice(),
    ]);

    // Ensure SOL price is set explicitly
    if (!prices["So11111111111111111111111111111111111111112"] || prices["So11111111111111111111111111111111111111112"].usd === 0) {
      prices["So11111111111111111111111111111111111111112"] = {
        usd: solUsd,
        source: "birdeye",
        symbol: "wSOL",
      };
    }

    const data: PriceResponse = {
      prices,
      solUsd,
      ts: Date.now(),
    };

    cache = { data, expires: Date.now() + CACHE_TTL };

    return NextResponse.json({
      ...data,
      prices: filterPrices(prices, mints),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch prices" },
      { status: 500 }
    );
  }
}

function filterPrices(
  prices: PriceResponse["prices"],
  requested: string[]
): PriceResponse["prices"] {
  if (!requested.length) return prices;
  const out: PriceResponse["prices"] = {};
  for (const m of requested) {
    if (prices[m]) out[m] = prices[m];
  }
  return out;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "solana-prices",
    note: "POST { mints: string[] } to fetch prices.",
  });
}
