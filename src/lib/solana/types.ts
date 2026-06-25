// Core types for the SolanaTx Debugger

export type TxStatus = "success" | "failed";

export interface TokenPrice {
  /** USD price per token (0 if unknown) */
  usd: number;
  /** 24h change percentage (0 if unknown) */
  usd24hChange?: number;
  /** Where the price came from */
  source: "birdeye" | "registry" | "estimate" | "none";
}

export interface TokenMeta {
  /** Token symbol (SOL, USDC, BONK, ...) */
  symbol: string;
  /** Decimals used for formatting */
  decimals: number;
  /** Token logo URL (optional) */
  logo?: string;
  /** Token name (e.g. "USD Coin") */
  name?: string;
  /** USD price info, if available */
  price?: TokenPrice;
}

export interface Transfer {
  /** Token symbol (SOL, USDC, BONK, ...) — "UNKNOWN" if not resolvable */
  token: string;
  /** Human-readable amount (already formatted with decimals) */
  amount: string;
  /** Raw amount (lamports / smallest token unit) */
  rawAmount: string;
  /** Mint address (empty for native SOL) */
  mint: string;
  /** Source wallet */
  from: string;
  /** Destination wallet */
  to: string;
  /** "native" | "spl" */
  type: "native" | "spl";
  /** Decimals used for formatting */
  decimals: number;
  /** USD value of this transfer (if price available) */
  usdValue?: number;
}

export interface ProgramCall {
  /** Program ID */
  programId: string;
  /** Friendly name (e.g. "System Program") */
  name: string;
  /** How many times the program was invoked */
  invocations: number;
  /** Logo / category emoji */
  category?: string;
}

export interface InstructionDetail {
  /** Index in the tx (0-based) */
  index: number;
  /** Program ID invoked */
  programId: string;
  /** Friendly program name */
  programName: string;
  /** Short instruction type label (e.g. "Transfer", "Swap") */
  type: string;
  /** Parsed args (key → short value) */
  data?: Record<string, string>;
  /** Inner instructions, if any */
  inner?: number;
  /** Status — "success" | "failed" */
  status: TxStatus;
  /** Optional human-readable description (from Anchor IDL decoder) */
  description?: string;
}

export interface BalanceChange {
  /** Wallet address */
  account: string;
  /** Change in SOL (human-readable, signed) */
  change: string;
  /** Raw change in lamports (signed) */
  rawChange: number;
  /** Post-balance in lamports, if available */
  postBalance?: number;
  /** Pre-balance in lamports, if available */
  preBalance?: number;
  /** USD value of the SOL delta (if SOL price available) */
  usdValue?: number;
}

export interface DecodedError {
  /** Raw error string (from logs / meta.err) */
  raw: string;
  /** Human readable explanation */
  explanation: string;
  /** Severity */
  severity: "error" | "warning";
  /** Suggested fix */
  hint?: string;
}

export interface TransactionReport {
  signature: string;
  status: TxStatus;
  slot: number;
  blockTime: number; // unix seconds
  blockTimeIso: string;
  fee: number; // lamports
  feeSol: string;
  computeUnits: number;
  computeBudget: number;
  signer: string;

  /** Human readable plain-English summary */
  summary: string;

  /** Token / SOL transfers detected */
  transfers: Transfer[];

  /** SOL balance changes per account */
  balanceChanges: BalanceChange[];

  /** Programs invoked (deduped) */
  programs: ProgramCall[];

  /** Instruction-level breakdown */
  instructions: InstructionDetail[];

  /** Raw execution logs */
  logs: string[];

  /** Decoded errors (empty if success) */
  errors: DecodedError[];

  /** Number of accounts involved */
  accountsCount: number;

  /** Network/cluster that produced the data */
  cluster: "mainnet-beta" | "devnet" | "testnet" | "demo";

  /** Whether this report was generated from live RPC or a demo fixture */
  source: "live" | "demo";

  /** Total USD value of all token transfers (if prices available) */
  totalUsdValue?: number;

  /** SOL USD price at time of report */
  solPriceUsd?: number;
}

export interface RecentSearchItem {
  signature: string;
  status: TxStatus;
  timestamp: number;
  summary: string;
  cluster: string;
}

export interface WatchedAddress {
  /** Solana wallet address */
  address: string;
  /** Friendly label (user-provided) */
  label: string;
  /** When the watch started (unix ms) */
  addedAt: number;
  /** Last signature seen (if any) */
  lastSignature?: string;
  /** Last activity timestamp (unix seconds) */
  lastActivity?: number;
}

export interface WatchEvent {
  /** Address that received the event */
  address: string;
  /** New signature detected */
  signature: string;
  /** Block time of the new signature */
  blockTime: number;
  /** Slot of the new signature */
  slot: number;
  /** Memo (if found in tx) */
  memo?: string;
  /** Fee paid (lamports) */
  fee?: number;
  /** Status: success or failed */
  status?: TxStatus;
}

export type AppView =
  | { kind: "dashboard" }
  | { kind: "report"; signature: string }
  | { kind: "analyze" }
  | { kind: "reports" }
  | { kind: "compare" }
  | { kind: "saved" }
  | { kind: "watch" }
  | { kind: "docs" }
  | { kind: "settings" };
