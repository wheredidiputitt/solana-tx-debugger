import { NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RPC_URL =
  process.env.SOLANA_RPC_URL ??
  "https://api.mainnet-beta.solana.com";

export async function GET() {
  const started = Date.now();
  try {
    const conn = new Connection(RPC_URL, "confirmed");
    const slot = await conn.getSlot();
    // getHealth isn't always available; use getEpochInfo as a liveness check.
    const epochInfo = await conn.getEpochInfo("confirmed").catch(() => null);

    return NextResponse.json({
      ok: true,
      slot,
      epoch: epochInfo?.epoch,
      rpc: RPC_URL.replace(/api-key=[^&]+/, "api-key=***"),
      latencyMs: Date.now() - started,
      ts: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "RPC unreachable",
        latencyMs: Date.now() - started,
        ts: Date.now(),
      },
      { status: 200 }
    );
  }
}
