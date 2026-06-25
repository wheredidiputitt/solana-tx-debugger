import type {
  BalanceChange,
  DecodedError,
  InstructionDetail,
  ProgramCall,
  TransactionReport,
  Transfer,
  TxStatus,
} from "./types";
import { lookupMint, lookupProgram, programName } from "./programs";
import { decodeError, errorsFromLogs } from "./errors";
import { decodeInstruction } from "./anchor-decoder";

const LAMPORTS_PER_SOL = 1_000_000_000;

function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

function formatSol(sol: number, dp = 6): string {
  return sol.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: dp,
  });
}

function shorten(addr: string, head = 4, tail = 4): string {
  if (!addr) return "";
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

function formatTokenAmount(raw: string | number, decimals: number): string {
  const bn = typeof raw === "number" ? BigInt(raw) : BigInt(raw);
  const negative = bn < 0n;
  const abs = negative ? -bn : bn;
  const divisor = 10n ** BigInt(decimals);
  const whole = abs / divisor;
  const fraction = abs % divisor;

  let fracStr = fraction.toString().padStart(decimals, "0");
  // Trim trailing zeros, but keep at least 2 digits if decimals > 0
  fracStr = fracStr.replace(/0+$/, "");
  if (fracStr.length < 2 && decimals > 0) fracStr = fracStr.padEnd(2, "0");

  const wholeStr = whole.toLocaleString("en-US");
  const sign = negative ? "-" : "";
  return fracStr ? `${sign}${wholeStr}.${fracStr}` : `${sign}${wholeStr}`;
}

// Type for the Solana RPC JSON shape — we only read what we need.
type RpcTransaction = any;

export interface AnalyzeOptions {
  /** Override cluster — defaults to "mainnet-beta" */
  cluster?: "mainnet-beta" | "devnet" | "testnet" | "demo";
  /** Mark as demo data */
  source?: "live" | "demo";
}

export function analyzeTransaction(
  sig: string,
  tx: RpcTransaction,
  opts: AnalyzeOptions = {}
): TransactionReport {
  const cluster = opts.cluster ?? "mainnet-beta";
  const source = opts.source ?? "live";

  const meta = tx?.meta ?? {};
  const message = tx?.transaction?.message ?? tx?.transaction?.message ?? {};
  const instructions = message.instructions ?? [];
  const innerInstructions = meta.innerInstructions ?? [];
  const logMessages: string[] = meta.logMessages ?? [];
  const preTokenBalances = meta.preTokenBalances ?? [];
  const postTokenBalances = meta.postTokenBalances ?? [];
  const preBalances: number[] = meta.preBalances ?? [];
  const postBalances: number[] = meta.postBalances ?? [];
  const accountKeys: string[] = message.accountKeys ?? [];
  const fee: number = meta.fee ?? 0;
  const computeUnits: number = extractComputeUnits(logMessages);
  const computeBudget: number = extractComputeBudget(instructions, accountKeys, message);
  const status: TxStatus = meta.err ? "failed" : "success";

  const slot: number = tx?.slot ?? 0;
  const blockTime: number = tx?.blockTime ?? 0;
  const blockTimeIso = blockTime
    ? new Date(blockTime * 1000).toISOString()
    : "";

  const signer = accountKeys[0] ?? "";

  // --- Compute programs invoked ---
  const programCounts = new Map<string, number>();
  for (const ix of instructions) {
    const progId = resolveProgramId(ix, accountKeys);
    programCounts.set(progId, (programCounts.get(progId) ?? 0) + 1);
  }
  for (const inner of innerInstructions) {
    for (const ix of inner.instructions ?? []) {
      const progId = resolveProgramId(ix, accountKeys);
      programCounts.set(progId, (programCounts.get(progId) ?? 0) + 1);
    }
  }

  const programs: ProgramCall[] = Array.from(programCounts.entries()).map(
    ([programId, invocations]) => {
      const meta = lookupProgram(programId);
      return {
        programId,
        name: meta.name,
        invocations,
        category: meta.category,
      };
    }
  );

  // --- Compute balance changes (SOL) ---
  const balanceChanges: BalanceChange[] = [];
  for (let i = 0; i < accountKeys.length; i++) {
    const pre = preBalances[i] ?? 0;
    const post = postBalances[i] ?? 0;
    const delta = post - pre;
    if (delta === 0) continue;
    balanceChanges.push({
      account: accountKeys[i],
      change: `${delta > 0 ? "+" : ""}${formatSol(lamportsToSol(delta), 9)} SOL`,
      rawChange: delta,
      postBalance: post,
      preBalance: pre,
    });
  }

  // --- Token transfers (SPL + native) ---
  const transfers: Transfer[] = [];

  // Native SOL transfers: derived from balance changes excluding fee payer burn.
  // Simpler approach: walk inner instructions looking for System Program Transfer / TransferWithSeed.
  for (const inner of innerInstructions) {
    for (const ix of inner.instructions ?? []) {
      const progId = resolveProgramId(ix, accountKeys);
      if (progId === "11111111111111111111111111111111") {
        // System Program
        const parsed = ix.parsed;
        if (parsed?.type === "transfer" || parsed?.type === "transferWithSeed") {
          const info = parsed.info;
          if (info?.source && info?.destination && info?.lamports) {
            transfers.push({
              token: "SOL",
              amount: formatTokenAmount(info.lamports, 9),
              rawAmount: String(info.lamports),
              mint: "",
              from: info.source,
              to: info.destination,
              type: "native",
              decimals: 9,
            });
          }
        }
      } else if (progId === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") {
        const parsed = ix.parsed;
        if (
          parsed?.type === "transfer" ||
          parsed?.type === "transferChecked" ||
          parsed?.type === "mintTo" ||
          parsed?.type === "burn"
        ) {
          const info = parsed.info;
          if (info) {
            const mint = info.mint ?? "";
            const meta = mint ? lookupMint(mint) : undefined;
            const symbol = meta?.symbol ?? "UNKNOWN";
            const decimals =
              meta?.decimals ??
              info.decimals ??
              (parsed.type === "transferChecked" ? info.decimals : 6);
            let from = info.authority ?? info.source ?? "";
            let to = info.destination ?? info.mint ?? "";
            const rawAmount = info.amount ?? info.tokenAmount?.amount ?? "0";

            if (parsed.type === "mintTo") {
              from = "Mint";
              to = info.account ?? info.destination ?? "";
            } else if (parsed.type === "burn") {
              to = "Burn";
            }

            if (from && to && rawAmount && rawAmount !== "0") {
              transfers.push({
                token: symbol,
                amount: formatTokenAmount(rawAmount, decimals),
                rawAmount: String(rawAmount),
                mint,
                from,
                to,
                type: "spl",
                decimals,
              });
            }
          }
        }
      }
    }
  }

  // Fallback: derive SPL transfers from token balance diffs when no parsed inner instructions.
  if (transfers.filter((t) => t.type === "spl").length === 0) {
    const byAccount = new Map<
      string,
      { mint: string; pre: string; post: string; owner?: string; decimals: number }
    >();
    for (const b of preTokenBalances) {
      byAccount.set(b.accountIndex + ":" + b.mint, {
        mint: b.mint,
        pre: b.uiTokenAmount.amount ?? "0",
        post: "0",
        owner: b.owner,
        decimals: b.uiTokenAmount.decimals ?? 0,
      });
    }
    for (const b of postTokenBalances) {
      const key = b.accountIndex + ":" + b.mint;
      const existing = byAccount.get(key);
      if (existing) {
        existing.post = b.uiTokenAmount.amount ?? "0";
        existing.owner = b.owner ?? existing.owner;
      } else {
        byAccount.set(key, {
          mint: b.mint,
          pre: "0",
          post: b.uiTokenAmount.amount ?? "0",
          owner: b.owner,
          decimals: b.uiTokenAmount.decimals ?? 0,
        });
      }
    }
    const diffs: Array<{
      mint: string;
      delta: bigint;
      owner?: string;
      decimals: number;
    }> = [];
    for (const v of byAccount.values()) {
      const delta = BigInt(v.post) - BigInt(v.pre);
      if (delta !== 0n) {
        diffs.push({ mint: v.mint, delta, owner: v.owner, decimals: v.decimals });
      }
    }
    // Pair net-positive with net-negative per mint to form transfers.
    const byMint = new Map<string, typeof diffs>();
    for (const d of diffs) {
      const arr = byMint.get(d.mint) ?? [];
      arr.push(d);
      byMint.set(d.mint, arr);
    }
    for (const [mint, list] of byMint) {
      const meta = lookupMint(mint);
      const symbol = meta?.symbol ?? "UNKNOWN";
      const decimals = meta?.decimals ?? list[0]?.decimals ?? 6;
      const senders = list.filter((d) => d.delta < 0n);
      const receivers = list.filter((d) => d.delta > 0n);
      for (const s of senders) {
        for (const r of receivers) {
          const amt = -s.delta > r.delta ? r.delta : -s.delta;
          if (amt <= 0n) continue;
          transfers.push({
            token: symbol,
            amount: formatTokenAmount(amt, decimals),
            rawAmount: amt.toString(),
            mint,
            from: s.owner ?? "",
            to: r.owner ?? "",
            type: "spl",
            decimals,
          });
          s.delta += amt;
          r.delta -= amt;
        }
      }
    }
  }

  // --- Instruction-level breakdown (with Anchor IDL decoder) ---
  const instructionDetails: InstructionDetail[] = instructions.map(
    (ix: any, idx: number) => {
      const progId = resolveProgramId(ix, accountKeys);
      const decoded = decodeInstruction(ix, accountKeys, idx);
      const innerCount = innerInstructions.filter(
        (inner: any) => inner.index === idx
      ).length;
      return {
        index: idx,
        programId: progId,
        programName: programName(progId),
        type: decoded.type,
        data: decoded.data,
        description: decoded.description,
        inner: innerCount,
        status,
      };
    }
  );

  // --- Decoded errors ---
  const errors: DecodedError[] = [];
  if (meta.err) {
    errors.push(decodeError(JSON.stringify(meta.err)));
  }
  for (const e of errorsFromLogs(logMessages)) {
    errors.push(decodeError(e));
  }

  // --- Accounts involved ---
  const accountsCount = accountKeys.length;

  // --- Human-readable summary ---
  const summary = buildSummary({
    status,
    signer,
    transfers,
    programs,
    fee,
    instructionCount: instructions.length,
    failedCount: status === "failed" ? 1 : 0,
  });

  return {
    signature: sig,
    status,
    slot,
    blockTime,
    blockTimeIso,
    fee,
    feeSol: formatSol(lamportsToSol(fee), 9),
    computeUnits,
    computeBudget,
    signer,
    summary,
    transfers,
    balanceChanges,
    programs,
    instructions: instructionDetails,
    logs: logMessages,
    errors,
    accountsCount,
    cluster,
    source,
  };
}

function resolveProgramId(ix: any, accountKeys: string[]): string {
  if (typeof ix.programId === "string") return ix.programId;
  if (typeof ix.program === "string") return ix.program;
  if (typeof ix.programIdIndex === "number") {
    return accountKeys[ix.programIdIndex] ?? "unknown";
  }
  return "unknown";
}

function extractComputeUnits(logs: string[]): number {
  for (const l of logs.slice().reverse()) {
    const m = l.match(/consumed\s+(\d+)\s+of\s+\d+\s+compute units/i);
    if (m) return parseInt(m[1], 10);
  }
  // Try total pattern
  for (const l of logs) {
    const m = l.match(/consumed\s+(\d+)\s+compute units/i);
    if (m) return parseInt(m[1], 10);
  }
  return 0;
}

function extractComputeBudget(
  instructions: any[],
  accountKeys: string[],
  message: any
): number {
  const COMPUTE_BUDGET_ID = "ComputeBudget111111111111111111111111111111";
  for (const ix of instructions) {
    const progId = resolveProgramId(ix, accountKeys);
    if (progId === COMPUTE_BUDGET_ID && ix.data) {
      // First byte = instruction tag. 0=RequestHeapFrame, 1=SetComputeUnitLimit, 2=SetComputeUnitPrice, 3=LoadedAccountsDataSizeLimit
      try {
        const raw = Buffer.from(ix.data, "base64");
        const tag = raw[0];
        if (tag === 1 && raw.length >= 5) {
          const limit = raw.readUInt32LE(1);
          return limit;
        }
      } catch {
        /* ignore */
      }
    }
  }
  return 200_000; // default Solana budget
}

function buildSummary(args: {
  status: TxStatus;
  signer: string;
  transfers: Transfer[];
  programs: ProgramCall[];
  fee: number;
  instructionCount: number;
  failedCount: number;
}): string {
  const { status, signer, transfers, programs, fee, instructionCount, failedCount } =
    args;

  const signerShort = signer ? `${signer.slice(0, 4)}…${signer.slice(-4)}` : "the signer";

  const lines: string[] = [];

  if (status === "failed") {
    lines.push(
      `This transaction FAILED after executing ${instructionCount} instruction${
        instructionCount === 1 ? "" : "s"
      }.`
    );
  } else {
    lines.push(
      `This transaction SUCCEEDED — signer ${signerShort} executed ${instructionCount} instruction${
        instructionCount === 1 ? "" : "s"
      } successfully.`
    );
  }

  // Token movements
  if (transfers.length > 0) {
    const native = transfers.filter((t) => t.type === "native");
    const spl = transfers.filter((t) => t.type === "spl");

    if (native.length > 0) {
      const t = native[0];
      lines.push(
        `${shorten(t.from)} transferred ${t.amount} SOL to ${shorten(t.to)}.`
      );
    }

    if (spl.length > 0) {
      const groups = new Map<string, { amount: number; token: string }>();
      for (const t of spl) {
        const cur = groups.get(t.token) ?? { amount: 0, token: t.token };
        cur.amount += parseFloat(t.amount.replace(/,/g, "")) || 0;
        groups.set(t.token, cur);
      }
      const parts = Array.from(groups.values()).map(
        (g) =>
          `${g.amount.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${
            g.token
          }`
      );
      lines.push(`Token transfers detected: ${parts.join(", ")}.`);
    }
  } else {
    lines.push("No token transfers detected.");
  }

  // Programs
  if (programs.length > 0) {
    const names = programs
      .slice(0, 4)
      .map((p) => p.name)
      .join(", ");
    const extra =
      programs.length > 4 ? ` and ${programs.length - 4} other program(s)` : "";
    lines.push(`Interacted with ${names}${extra}.`);
  }

  // Fee
  lines.push(
    `Network fee paid: ${(fee / LAMPORTS_PER_SOL).toLocaleString("en-US", {
      minimumFractionDigits: 6,
      maximumFractionDigits: 9,
    })} SOL.`
  );

  return lines.join(" ");
}

export { shorten as shortenAddress };
export { lamportsToSol, formatSol, formatTokenAmount };
