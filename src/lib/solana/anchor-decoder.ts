// Anchor IDL-style instruction decoder for well-known Solana programs.
//
// This is a hand-written subset — we don't load Anchor IDLs from RPC
// (too slow / unreliable), but we hardcode common instruction layouts
// for the most popular programs (System, SPL Token, Jupiter, Raydium, Orca).
//
// Each decoder receives the raw instruction (with parsed.info if available)
// and returns a { type, description, data } object.

import { programName } from "./programs";
import { shortenAddress, lamportsToSol, formatSol } from "./analyze";

export interface DecodedInstruction {
  /** Friendly instruction type label */
  type: string;
  /** Human-readable description */
  description: string;
  /** Parsed args (key → short value) */
  data: Record<string, string>;
}

type AnyIx = any;

export function decodeInstruction(
  ix: AnyIx,
  accountKeys: string[],
  idx: number
): DecodedInstruction {
  const progId = resolveProgramId(ix, accountKeys);
  const parsed = ix.parsed;

  // ====== System Program ======
  if (progId === "11111111111111111111111111111111") {
    if (parsed?.type === "transfer") {
      const info = parsed.info;
      const lamports = Number(info?.lamports ?? 0);
      return {
        type: "Transfer",
        description: `Transfer ${formatSol(lamportsToSol(lamports), 9)} SOL from ${shortenAddress(info?.source, 6, 4)} to ${shortenAddress(info?.destination, 6, 4)}.`,
        data: {
          from: shortenAddress(info?.source, 6, 6),
          to: shortenAddress(info?.destination, 6, 6),
          amount: `${formatSol(lamportsToSol(lamports), 9)} SOL`,
        },
      };
    }
    if (parsed?.type === "createAccount") {
      const info = parsed.info;
      return {
        type: "Create Account",
        description: `Allocate a new account owned by ${shortenAddress(info?.owner, 6, 4)} with ${formatSol(lamportsToSol(Number(info?.lamports ?? 0)), 4)} SOL rent balance.`,
        data: {
          owner: shortenAddress(info?.owner, 6, 6),
          lamports: `${formatSol(lamportsToSol(Number(info?.lamports ?? 0)))} SOL`,
          space: `${info?.space ?? 0} bytes`,
        },
      };
    }
    if (parsed?.type === "assign") {
      return {
        type: "Assign",
        description: `Reassign account ${shortenAddress(parsed.info?.account, 6, 4)} to a new owner.`,
        data: { account: shortenAddress(parsed.info?.account, 6, 6) },
      };
    }
    if (parsed?.type === "allocate") {
      return {
        type: "Allocate",
        description: `Allocate ${parsed.info?.space ?? 0} bytes for account ${shortenAddress(parsed.info?.account, 6, 4)}.`,
        data: { account: shortenAddress(parsed.info?.account, 6, 6) },
      };
    }
  }

  // ====== Compute Budget Program ======
  if (progId === "ComputeBudget111111111111111111111111111111") {
    if (parsed?.type === "setComputeUnitLimit" || /AQAA/.test(ix.data || "")) {
      try {
        const raw = Buffer.from(ix.data || "", "base64");
        const tag = raw[0];
        if (tag === 1 && raw.length >= 5) {
          const limit = raw.readUInt32LE(1);
          return {
            type: "Set Compute Unit Limit",
            description: `Request a compute budget of ${limit.toLocaleString()} units for this transaction.`,
            data: { limit: limit.toLocaleString() },
          };
        }
      } catch {
        /* ignore */
      }
    }
    if (parsed?.type === "setComputeUnitPrice" || /^Ad/.test(ix.data || "")) {
      try {
        const raw = Buffer.from(ix.data || "", "base64");
        const tag = raw[0];
        if (tag === 2 && raw.length >= 9) {
          const microLamports = raw.readBigUInt64LE(1);
          const lamportsPerCu = Number(microLamports) / 1_000_000;
          return {
            type: "Set Compute Unit Price",
            description: `Bid ${Number(microLamports).toLocaleString()} micro-lamports per CU (~${lamportsPerCu.toFixed(4)} lamports/CU).`,
            data: {
              microLamportsPerCu: Number(microLamports).toLocaleString(),
              priorityFeeEstimate: `${(Number(microLamports) * 200_000 / 1_000_000_000).toFixed(6)} SOL`,
            },
          };
        }
      } catch {
        /* ignore */
      }
    }
    if (parsed?.type === "requestHeapFrame") {
      return {
        type: "Request Heap Frame",
        description: "Request a larger heap frame for the program.",
        data: {},
      };
    }
  }

  // ====== SPL Token Program ======
  if (progId === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") {
    if (parsed?.type === "transfer" || parsed?.type === "transferChecked") {
      const info = parsed.info;
      const amount = info?.amount ?? info?.tokenAmount?.amount ?? "0";
      const decimals =
        info?.decimals ??
        info?.tokenAmount?.decimals ??
        (info?.mint ? 6 : 9);
      return {
        type: "Token Transfer",
        description: `Transfer ${formatTokenAmount(amount, decimals)} of token ${shortenAddress(info?.mint ?? "SPL", 4, 4)} from ${shortenAddress(info?.source ?? info?.authority, 4, 4)} to ${shortenAddress(info?.destination, 4, 4)}.`,
        data: {
          token: shortenAddress(info?.mint ?? "—", 4, 4),
          from: shortenAddress(info?.source ?? info?.authority, 6, 4),
          to: shortenAddress(info?.destination, 6, 4),
          amount: formatTokenAmount(amount, decimals),
        },
      };
    }
    if (parsed?.type === "mintTo" || parsed?.type === "mintToChecked") {
      const info = parsed.info;
      return {
        type: "Mint Tokens",
        description: `Mint ${formatTokenAmount(info?.amount ?? "0", 6)} tokens to ${shortenAddress(info?.account ?? info?.destination, 4, 4)}.`,
        data: {
          mint: shortenAddress(info?.mint, 4, 4),
          to: shortenAddress(info?.account ?? info?.destination, 6, 4),
          amount: formatTokenAmount(info?.amount ?? "0", 6),
        },
      };
    }
    if (parsed?.type === "burn" || parsed?.type === "burnChecked") {
      const info = parsed.info;
      return {
        type: "Burn Tokens",
        description: `Burn ${formatTokenAmount(info?.amount ?? "0", 6)} tokens from ${shortenAddress(info?.account, 4, 4)}.`,
        data: {
          mint: shortenAddress(info?.mint, 4, 4),
          account: shortenAddress(info?.account, 6, 4),
          amount: formatTokenAmount(info?.amount ?? "0", 6),
        },
      };
    }
    if (parsed?.type === "approve") {
      return {
        type: "Approve Delegate",
        description: `Approve a delegate to spend up to ${formatTokenAmount(parsed.info?.amount ?? "0", 6)} tokens.`,
        data: {
          source: shortenAddress(parsed.info?.source, 6, 4),
          delegate: shortenAddress(parsed.info?.delegate, 6, 4),
          amount: formatTokenAmount(parsed.info?.amount ?? "0", 6),
        },
      };
    }
    if (parsed?.type === "initializeAccount" || parsed?.type === "initializeAccount3") {
      return {
        type: "Initialize Token Account",
        description: `Initialize a new SPL token account for mint ${shortenAddress(parsed.info?.mint, 4, 4)}.`,
        data: {
          mint: shortenAddress(parsed.info?.mint, 4, 4),
          owner: shortenAddress(parsed.info?.owner, 6, 4),
        },
      };
    }
  }

  // ====== Associated Token Account Program ======
  if (progId === "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL") {
    if (parsed?.type === "create") {
      return {
        type: "Create Associated Token Account",
        description: `Create an Associated Token Account for ${shortenAddress(parsed.info?.wallet, 6, 4)} for mint ${shortenAddress(parsed.info?.mint, 4, 4)}.`,
        data: {
          wallet: shortenAddress(parsed.info?.wallet, 6, 4),
          mint: shortenAddress(parsed.info?.mint, 4, 4),
        },
      };
    }
    return {
      type: "Create ATA",
      description: "Create or recover an Associated Token Account.",
      data: {},
    };
  }

  // ====== Jupiter Aggregator ======
  if (progId.startsWith("JUP") || progId === "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4") {
    return {
      type: "Jupiter Route",
      description:
        "Execute a multi-hop swap routed through Jupiter's aggregator. The route plan is encoded in the instruction data; see logs for the actual swap path.",
      data: {
        program: "Jupiter v6",
        aggregator: "Jupiter",
        account: shortenAddress(accountKeys[0], 6, 4),
      },
    };
  }

  // ====== Raydium ======
  if (progId === "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM") {
    return {
      type: "Raydium Swap",
      description:
        "Execute a swap on Raydium AMM v4. Input and output amounts are in inner token transfers.",
      data: {
        program: "Raydium AMM v4",
      },
    };
  }
  if (progId === "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK") {
    return {
      type: "Raydium CLMM Swap",
      description:
        "Concentrated-liquidity swap on Raydium CLMM. Tick range and price impact depend on the pool's current state.",
      data: { program: "Raydium CLMM" },
    };
  }

  // ====== Orca Whirlpool ======
  if (progId === "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc") {
    return {
      type: "Orca Whirlpool Swap",
      description:
        "Concentrated-liquidity swap on Orca Whirlpool. Slippage tolerance is enforced via sqrt-price-limit.",
      data: { program: "Orca Whirlpool" },
    };
  }

  // ====== Metaplex ======
  if (progId === "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s") {
    return {
      type: "Metaplex Metadata",
      description:
        "Create or update Metaplex token metadata (name, symbol, URI) for an NFT or fungible token.",
      data: { program: "Metaplex Token Metadata" },
    };
  }
  if (progId === "cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK") {
    return {
      type: "Candy Machine Mint",
      description:
        "Mint an NFT from a Metaplex Candy Machine. The mint's metadata is loaded from the config URI.",
      data: { program: "Metaplex Candy Machine" },
    };
  }

  // ====== Memo Program ======
  if (progId === "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr") {
    const memo = ix.data ? Buffer.from(ix.data, "base64").toString("utf-8") : "";
    return {
      type: "Memo",
      description: `Attach a UTF-8 memo to this transaction: "${memo.slice(0, 80)}${memo.length > 80 ? "…" : ""}"`,
      data: { memo: memo.slice(0, 200) },
    };
  }

  // ====== Stake Program ======
  if (progId === "Stake11111111111111111111111111111111111111") {
    if (parsed?.type === "delegate") {
      return {
        type: "Delegate Stake",
        description: `Delegate stake from ${shortenAddress(parsed.info?.stakeAccount, 6, 4)} to validator ${shortenAddress(parsed.info?.voteAccount, 6, 4)}.`,
        data: {
          stake: shortenAddress(parsed.info?.stakeAccount, 6, 4),
          validator: shortenAddress(parsed.info?.voteAccount, 6, 4),
        },
      };
    }
    if (parsed?.type === "withdraw") {
      return {
        type: "Withdraw Stake",
        description: `Withdraw ${formatSol(lamportsToSol(Number(parsed.info?.lamports ?? 0)), 4)} SOL from stake account.`,
        data: { lamports: formatSol(lamportsToSol(Number(parsed.info?.lamports ?? 0))) },
      };
    }
    if (parsed?.type === "deactivate") {
      return {
        type: "Deactivate Stake",
        description: `Begin cooldown on stake account ${shortenAddress(parsed.info?.stakeAccount, 6, 4)}.`,
        data: { stake: shortenAddress(parsed.info?.stakeAccount, 6, 4) },
      };
    }
  }

  // ====== Generic fallback ======
  if (parsed?.type) {
    return {
      type: parsed.type,
      description: `${programName(progId)} → ${parsed.type}.`,
      data: extractInfo(parsed.info, idx),
    };
  }

  if (ix.data) {
    return {
      type: "Raw Instruction",
      description: `${programName(progId)} invoked with ${Buffer.from(ix.data, "base64").length} bytes of opaque data.`,
      data: { dataHex: Buffer.from(ix.data, "base64").toString("hex").slice(0, 24) + "…" },
    };
  }

  return {
    type: "Unknown",
    description: `${programName(progId)} instruction #${idx}.`,
    data: {},
  };
}

function resolveProgramId(ix: AnyIx, accountKeys: string[]): string {
  if (typeof ix.programId === "string") return ix.programId;
  if (typeof ix.program === "string") return ix.program;
  if (typeof ix.programIdIndex === "number") {
    return accountKeys[ix.programIdIndex] ?? "unknown";
  }
  return "unknown";
}

function extractInfo(info: any, idx: number): Record<string, string> {
  if (!info || typeof info !== "object") return {};
  const out: Record<string, string> = {};
  let count = 0;
  for (const [k, v] of Object.entries<any>(info)) {
    if (count > 8) break;
    if (typeof v === "string") {
      out[k] = shortenAddress(v, 6, 4);
    } else if (typeof v === "number" || typeof v === "bigint") {
      out[k] = String(v);
    }
    count++;
  }
  return out;
}

function formatTokenAmount(raw: string | number, decimals: number): string {
  const bn = typeof raw === "number" ? BigInt(raw) : BigInt(raw);
  const negative = bn < 0n;
  const abs = negative ? -bn : bn;
  const divisor = 10n ** BigInt(decimals);
  const whole = abs / divisor;
  const fraction = abs % divisor;
  let fracStr = fraction.toString().padStart(decimals, "0");
  fracStr = fracStr.replace(/0+$/, "");
  if (fracStr.length < 2 && decimals > 0) fracStr = fracStr.padEnd(2, "0");
  const wholeStr = whole.toLocaleString("en-US");
  const sign = negative ? "-" : "";
  return fracStr ? `${sign}${wholeStr}.${fracStr}` : `${sign}${wholeStr}`;
}
