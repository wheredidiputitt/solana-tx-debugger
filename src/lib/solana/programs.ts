// Registry of well-known Solana program IDs → friendly names + categories.

export interface ProgramMeta {
  name: string;
  category: string;
  /** Optional Solana Explorer / registry URL slug */
  registry?: string;
}

const PROGRAM_REGISTRY: Record<string, ProgramMeta> = {
  // Core
  "11111111111111111111111111111111": {
    name: "System Program",
    category: "Core",
  },
  TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: {
    name: "SPL Token Program",
    category: "Tokens",
  },
  TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb: {
    name: "Token-2022 Program",
    category: "Tokens",
  },
  ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL: {
    name: "Associated Token Program",
    category: "Tokens",
  },
  "11111111111111111111111111111112": {
    name: "BPF Loader",
    category: "Core",
  },
  BPFLoaderUpgradeab1e11111111111111111111111: {
    name: "BPF Upgradeable Loader",
    category: "Core",
  },

  // Stake / Vote
  Stake11111111111111111111111111111111111111: {
    name: "Stake Program",
    category: "Staking",
  },
  Vote111111111111111111111111111111111111111: {
    name: "Vote Program",
    category: "Staking",
  },

  // Memos / identity
  MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr: {
    name: "Memo Program",
    category: "Utility",
  },
  Memo1UhkJRfZhvNWcQ3y4Zw2Rq5w4q9jF7h7q2Z2Z2Z2: {
    name: "Memo Program v2",
    category: "Utility",
  },

  // Compute Budget
  ComputeBudget111111111111111111111111111111: {
    name: "Compute Budget Program",
    category: "Core",
  },

  // DeFi / Aggregators
  JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4: {
    name: "Jupiter Aggregator v6",
    category: "DeFi",
  },
  JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiBDDyW9kNZyf9: {
    name: "Jupiter Aggregator v4",
    category: "DeFi",
  },
  JUP2jxvXaqu7NQY1GmFE4mYynT9NwQ3xoaMjVt3k7cM: {
    name: "Jupiter Limit Order",
    category: "DeFi",
  },
  PERPHjGBqRHArX4DytSxwGwEs3vNFfMFxFJiZgKZF5z: {
    name: "Perps Program",
    category: "DeFi",
  },

  // AMMs
  "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM": {
    name: "Raydium Liquidity Pool v4",
    category: "DeFi",
  },
  CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK: {
    name: "Raydium CLMM",
    category: "DeFi",
  },
  whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc: {
    name: "Orca Whirlpool",
    category: "DeFi",
  },
  srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX: {
    name: "OpenBook V2",
    category: "DeFi",
  },
  "2dwkEJpfJZQwMwnR4jovR2s8Vss7Gzs4Z2XnThm8JZ8p": {
    name: "Meteora DLMM",
    category: "DeFi",
  },

  // Lending
  So1endDq2YkqhipRh3WViPa8hdiSpxWy6u3ueuEfkJW: {
    name: "Solend Program",
    category: "Lending",
  },
  Kam1zVpLh4ttRFJaecZQ7nm5xaCm3aCkpvUQ5VxKQsH: {
    name: "Kamino Lending",
    category: "Lending",
  },

  // NFTs / Metaplex
  metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s: {
    name: "Metaplex Token Metadata",
    category: "NFT",
  },
  cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK: {
    name: "Metaplex Candy Machine",
    category: "NFT",
  },
  M2mx93ekt1fmX7kP3dJsHXYgez9PJ9L4gXw9J5LUV2m: {
    name: "Magic Eden V2",
    category: "NFT",
  },

  // Wormhole / Bridges
  WormT3NKhGEWfBSwZ4oGwZte6PtPhhLjBS2WHmQyvCr: {
    name: "Wormhole Bridge",
    category: "Bridge",
  },

  // Pyth
  gsPbWYX8h2bpvygfPRnU2w8m3nzWDeP8T7hatZqDV5r: {
    name: "Pyth Oracle",
    category: "Oracle",
  },
  EKtw5KXaTJ7B5c2Qk4m8Wf9YrZ8TbB7oXvV4sCw3p: {
    name: "Switchboard Oracle",
    category: "Oracle",
  },

  // Drift
  dRiftyHA39MWEi3m9tuncupz0HEMUyED6kjDQsphrJZ: {
    name: "Drift Perps",
    category: "DeFi",
  },

  // Mariana / Mango
  "9xQeWvG816bUx9EPa7XW5Q5Y6Y6Y6Y6Y6Y6Y6Y6Y6Y6": {
    name: "Mango Markets v3",
    category: "DeFi",
  },

  // Wallet adapter helpers
  "5ZfZAw2XQ9x9x9x9x9x9x9x9x9x9x9x9x9x9x9x9x9x9": {
    name: "Squads Program",
    category: "Wallet",
  },
};

const FALLBACK_PREFIXES: Array<{ prefix: string; meta: ProgramMeta }> = [
  {
    prefix: "JUP",
    meta: { name: "Jupiter Program", category: "DeFi" },
  },
];

export function lookupProgram(programId: string): ProgramMeta {
  if (PROGRAM_REGISTRY[programId]) return PROGRAM_REGISTRY[programId];

  for (const { prefix, meta } of FALLBACK_PREFIXES) {
    if (programId.startsWith(prefix)) return meta;
  }

  // Default: short-address label
  return {
    name: `Unknown Program (${programId.slice(0, 4)}…${programId.slice(-4)})`,
    category: "Unknown",
  };
}

export function programName(programId: string): string {
  return lookupProgram(programId).name;
}

/** Return a small emoji icon for a program category, used in the Programs table */
export function programIcon(category: string): string {
  switch (category) {
    case "Core":
      return "⚙️";
    case "Tokens":
      return "🪙";
    case "DeFi":
      return "💱";
    case "Lending":
      return "🏦";
    case "Staking":
      return "🔒";
    case "NFT":
      return "🖼️";
    case "Bridge":
      return "🌉";
    case "Oracle":
      return "📡";
    case "Wallet":
      return "👛";
    case "Utility":
      return "📝";
    default:
      return "📦";
  }
}

/** Well-known token mints → symbol + decimals (subset) */
export interface TokenMeta {
  symbol: string;
  decimals: number;
  logo?: string;
  name?: string;
  /** Approximate USD price (used as fallback when no live price) */
  usdPrice?: number;
}

const TOKEN_REGISTRY: Record<string, TokenMeta> = {
  So11111111111111111111111111111111111111112: {
    symbol: "wSOL",
    decimals: 9,
    name: "Wrapped SOL",
    usdPrice: 145, // approximate; live price fetched at runtime
  },
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
    symbol: "USDC",
    decimals: 6,
    name: "USD Coin",
    usdPrice: 1,
  },
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: {
    symbol: "USDT",
    decimals: 6,
    name: "Tether USD",
    usdPrice: 1,
  },
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: {
    symbol: "BONK",
    decimals: 5,
    name: "Bonk",
    usdPrice: 0.0000235,
  },
  J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn: {
    symbol: "JitoSOL",
    decimals: 9,
    name: "Jito Staked SOL",
    usdPrice: 165,
  },
  "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL5trYmLR2pdb": {
    symbol: "PYTH",
    decimals: 6,
    name: "Pyth Network",
    usdPrice: 0.42,
  },
  rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof: {
    symbol: "RNDR",
    decimals: 8,
    name: "Render",
    usdPrice: 8.2,
  },
  mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7yLFqcJm7So: {
    symbol: "mSOL",
    decimals: 9,
    name: "Marinade SOL",
    usdPrice: 175,
  },
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": {
    symbol: "RAY",
    decimals: 6,
    name: "Raydium",
    usdPrice: 2.3,
  },
  JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbHedAuSxreX: {
    symbol: "JUP",
    decimals: 6,
    name: "Jupiter",
    usdPrice: 0.85,
  },
};

export function lookupMint(mint: string): TokenMeta | undefined {
  return TOKEN_REGISTRY[mint];
}
