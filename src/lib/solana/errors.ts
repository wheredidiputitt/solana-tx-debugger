import type { DecodedError } from "./types";

/**
 * Decode raw Solana transaction errors into human-readable explanations.
 *
 * Sources:
 *  - meta.err object (InstructionError, Custom, etc.)
 *  - Program logged error strings ("Program log: Error: ...")
 *  - "failed: custom program error: 0x1" hex codes
 */

const PROGRAM_ERROR_CODES: Record<number, string> = {
  0: "Generic failure",
  1: "Insufficient funds",
  2: "Invalid account",
  3: "Invalid instruction data",
  4: "Invalid instruction",
  5: "No signer",
  6: "Insufficient account space",
  7: "Address already in use",
  8: "Address not found",
  9: "Borsh serialization error",
  10: "Borsh deserialization error",
  11: "Not owned by system program",
  12: "Not owned by BPF loader",
  13: "Insufficient rent",
  14: "Account not rent-exempt",
  15: "Instruction fallback",
  16: "Computational budget exceeded",
  17: "Program failed to complete",
  18: "Program failed to compile",
  19: "Immutable account",
  20: "Incorrect authority",
  21: "Incorrect program id",
  22: "Account already initialized",
  23: "Uninitialized account",
  24: "Unbalanced instruction",
  25: "Incorrect program id for account",
  26: "Missing required signature",
  27: "Account not executable",
  28: "Account already in use",
  29: "Account data too small",
  30: "Account not upgradeable",
  31: "Program already at latest version",
  32: "Duplicate instruction index",
  33: "Program is not executable",
};

const SUGGESTED_FIXES: Record<string, string> = {
  "insufficient funds":
    "Top up the signer's SOL balance and retry. Rent + fee needs at least 0.01 SOL headroom.",
  "insufficient account space":
    "Reallocate or recreate the account with enough space for the data being written.",
  "custom program error: 0x1":
    "This is program-specific code 1. Often means 'insufficient funds' or 'unauthorized' — check program docs.",
  "0x1": "Common program error — usually insufficient funds or unauthorized signer.",
  "not rent-exempt":
    "The account's lamports fell below rent-exempt minimum (890,880 lamports). Fund it before closing.",
  "computational budget exceeded":
    "Add a ComputeBudgetProgram.setComputeUnitLimit instruction, or reduce inner instruction count.",
  "incorrect authority":
    "The signer is not the authority/owner of the account being modified.",
  "invalid account":
    "An account passed in is not the one the program expected. Re-check account ordering.",
  "address not found":
    "A required derived address (PDA) does not exist yet. Initialize it before this instruction.",
  "program failed to complete":
    "The program panicked. Often caused by a runtime constraint (e.g. overflow, division by zero).",
};

const KEYWORD_EXPLANATIONS: Array<{ test: RegExp; explanation: string; hint?: string }> = [
  {
    test: /insufficient\s*funds|InsufficientFunds/i,
    explanation:
      "The signer did not have enough SOL (or token balance) to cover the transfer + transaction fee.",
    hint: SUGGESTED_FIXES["insufficient funds"],
  },
  {
    test: /insufficient account space/i,
    explanation:
      "The on-chain account is too small to hold the new data being written.",
    hint: SUGGESTED_FIXES["insufficient account space"],
  },
  {
    test: /custom program error: 0x([0-9a-f]+)/i,
    explanation:
      "The invoked program returned a custom error code. The hex value identifies the specific failure inside that program.",
    hint: "Look up the code in the program's source (often an Anchor `ErrorCode` enum).",
  },
  {
    test: /not rent-exempt/i,
    explanation:
      "After this instruction the account would fall below the rent-exempt minimum and be garbage-collected.",
    hint: SUGGESTED_FIXES["not rent-exempt"],
  },
  {
    test: /computational budget exceeded|exceeded.*compute|out of compute/i,
    explanation:
      "The transaction used more compute units than its budget allowed.",
    hint: SUGGESTED_FIXES["computational budget exceeded"],
  },
  {
    test: /incorrect authority|incorrect.*owner|missing required signature/i,
    explanation:
      "A signer was missing or did not match the account authority required by the program.",
    hint: SUGGESTED_FIXES["incorrect authority"],
  },
  {
    test: /address not found|account not found/i,
    explanation:
      "A derived address (PDA) the program expected does not exist on-chain yet.",
    hint: SUGGESTED_FIXES["address not found"],
  },
  {
    test: /program failed to complete|panic/i,
    explanation:
      "The program panicked at runtime. Usually an arithmetic overflow, failed assert, or div-by-zero.",
    hint: SUGGESTED_FIXES["program failed to complete"],
  },
  {
    test: /slippage tolerance exceeded/i,
    explanation:
      "The swap output fell below the minimum amount you set as slippage tolerance.",
    hint: "Increase slippage tolerance, or wait for lower volatility before retrying.",
  },
  {
    test: /insufficient liquidity/i,
    explanation:
      "The pool did not have enough liquidity to fulfil this swap at the requested size.",
    hint: "Try a smaller amount, or route through a different pool/aggregator.",
  },
];

export function decodeError(raw: string): DecodedError {
  const rawTrimmed = raw.trim();

  // 1a. Match JSON-stringified form: {"InstructionError":[3,{"Custom":1}]}
  const jsonInstrMatch = rawTrimmed.match(
    /\{\s*"InstructionError"\s*:\s*\[\s*(\d+)\s*,\s*(.+?)\s*\]\s*\}/
  );
  if (jsonInstrMatch) {
    const idx = parseInt(jsonInstrMatch[1], 10);
    const reasonRaw = jsonInstrMatch[2].trim();
    return decodeInstructionError(idx, reasonRaw, rawTrimmed);
  }

  // 1b. Match InstructionError(N, <reason>)
  const instrMatch = rawTrimmed.match(/InstructionError\((\d+),\s*(.+)\)/i);
  if (instrMatch) {
    const idx = parseInt(instrMatch[1], 10);
    const reason = instrMatch[2];
    return decodeInstructionError(idx, reason, rawTrimmed);
  }

  // 2. Match "custom program error: 0xNN"
  const hexMatch = rawTrimmed.match(/custom program error:\s*0x([0-9a-f]+)/i);
  if (hexMatch) {
    const code = parseInt(hexMatch[1], 16);
    const human = PROGRAM_ERROR_CODES[code] ?? `Custom program code ${code}`;
    return {
      raw: rawTrimmed,
      explanation: `Program returned error code 0x${hexMatch[1]} — ${human}.`,
      severity: "error",
      hint: SUGGESTED_FIXES[`0x${hexMatch[1]}`] ?? SUGGESTED_FIXES["0x1"],
    };
  }

  // 3. Match "failed: <message>"
  const failedMatch = rawTrimmed.match(/failed:\s*(.+)/i);
  if (failedMatch) {
    const reason = failedMatch[1].trim();
    const matched = KEYWORD_EXPLANATIONS.find((k) => k.test.test(reason));
    if (matched) {
      return {
        raw: rawTrimmed,
        explanation: matched.explanation,
        severity: "error",
        hint: matched.hint,
      };
    }
    return {
      raw: rawTrimmed,
      explanation: `Transaction failed: ${reason}`,
      severity: "error",
    };
  }

  // 4. Keyword scan
  for (const k of KEYWORD_EXPLANATIONS) {
    if (k.test.test(rawTrimmed)) {
      return {
        raw: rawTrimmed,
        explanation: k.explanation,
        severity: "error",
        hint: k.hint,
      };
    }
  }

  // 5. Fallback
  return {
    raw: rawTrimmed,
    explanation:
      "An error occurred during transaction execution. Inspect the raw logs above for program-specific details.",
    severity: "error",
  };
}

function decodeInstructionError(
  idx: number,
  reasonRaw: string,
  rawTrimmed: string
): DecodedError {
  // Try to parse Custom(N) (function-call form) — e.g. Custom(1)
  const customMatchFn = reasonRaw.match(/Custom\((\d+)\)/i);
  if (customMatchFn) {
    const code = parseInt(customMatchFn[1], 10);
    return buildCustomError(idx, code, rawTrimmed);
  }

  // Try to parse JSON form — e.g. {"Custom":1}
  const customMatchJson = reasonRaw.match(/\{\s*"Custom"\s*:\s*(\d+)\s*\}/i);
  if (customMatchJson) {
    const code = parseInt(customMatchJson[1], 10);
    return buildCustomError(idx, code, rawTrimmed);
  }

  // Reason could be a quoted string like "insufficient funds" or an enum name
  const cleaned = reasonRaw.replace(/[{}"]/g, "").trim();
  const lower = cleaned.toLowerCase();
  const hint = SUGGESTED_FIXES[lower];

  // Try keyword explanations
  const matched = KEYWORD_EXPLANATIONS.find((k) => k.test.test(cleaned));
  if (matched) {
    return {
      raw: rawTrimmed,
      explanation: `Instruction #${idx + 1} failed — ${matched.explanation}`,
      severity: "error",
      hint: matched.hint ?? hint,
    };
  }

  return {
    raw: rawTrimmed,
    explanation: `Instruction #${idx + 1} failed: ${cleaned}.`,
    severity: "error",
    hint,
  };
}

function buildCustomError(
  idx: number,
  code: number,
  rawTrimmed: string
): DecodedError {
  return {
    raw: rawTrimmed,
    explanation: `Instruction #${idx + 1} failed with a program-specific custom error code ${code}.`,
    severity: "error",
    hint: PROGRAM_ERROR_CODES[code]
      ? `${PROGRAM_ERROR_CODES[code]} — but for program-specific codes check the program's source.`
      : "Check the program's error enum (Anchor projects expose codes in their IDL).",
  };
}

/** Pull error strings out of an array of program logs */
export function errorsFromLogs(logs: string[]): string[] {
  const out: string[] = [];
  for (const line of logs) {
    if (/program log: error/i.test(line)) {
      out.push(line.replace(/^.*program log:\s*/i, ""));
    }
    if (/failed:/i.test(line) && !/program returned error/i.test(line)) {
      out.push(line);
    }
  }
  return out;
}
