# SolanaTx Debugger

> Paste a Solana transaction signature → get a clean, human-readable report in seconds.

A developer tool that converts raw Solana transaction data into structured, plain-English reports. No more squinting at JSON logs in Solscan - SolanaTx Debugger decodes instructions, token transfers, balance changes, programs invoked, compute units, and error messages into a single readable view.

![SolanaTx Debugger](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Solana](https://img.shields.io/badge/Solana-web3.js-9945FF) ![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

### Core analyzer
- **Transaction status** - Success / Failed with one-click Explorer link
- **Human-readable summary** - Plain-English explanation of what the transaction did
- **Token transfer detection** - Native SOL + SPL tokens (parsed instructions + balance-diff fallback)
- **SOL balance changes** - Per-account deltas with pre/post balances
- **Programs invoked** - Registry of 30+ well-known programs (System, SPL Token, Jupiter, Raydium, Orca, Metaplex, etc.) with category icons
- **Compute units** - Consumed vs. requested budget
- **Error decoder** - Translates `InstructionError(N, Custom(M))`, `failed: custom program error: 0x1`, and keyword patterns like "insufficient funds" into plain English with suggested fixes
- **Execution logs** - Color-coded, filterable (all / errors / success)

### Beyond the basics
- **Anchor-style instruction decoder** - Plain-English descriptions for System Program, SPL Token, ATA, Compute Budget, Jupiter, Raydium, Orca, Metaplex, Memo, Stake (e.g. *"Transfer 2.5 SOL from 9aF2…mQ8Z to 5pXv…6r5p."*)
- **USD values** - Live token prices via Birdeye → CoinGecko → local registry fallback. 5-minute cache.
- **CSV export** - Full report, balance changes, or token transfers as CSV
- **Watch addresses** - Real-time notifications when a wallet sends or receives a transaction (WebSocket mini-service, polls every 15s)
- **Compare transactions** - Side-by-side view of two transactions with delta calculations
- **Shareable URLs** - `/?sig=<signature>` re-opens the same report
- **Recent + saved reports** - Persisted in `localStorage`
- **Dark mode** - Full light/dark theme support via `next-themes`
- **Mobile-responsive** - Sidebar collapses, bottom navigation appears on small screens

---

## 🛠 Tech stack

| Layer | Tech |
|------|------|
| Framework | Next.js 16 (App Router) + TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Blockchain | `@solana/web3.js` |
| State | Zustand (client) + TanStack Query (server) |
| Animations | Framer Motion |
| Real-time | Socket.IO (mini-service on port 3005) |
| Toasts | Sonner |
| Storage | `localStorage` (no backend database) |

---

## 🚀 Quick start

### Prerequisites
- Node.js 20+ or [Bun](https://bun.sh) 1.1+
- A Solana RPC URL (the public endpoint works, but rate-limited - see [Environment variables](#-environment-variables))

### Install & run

```bash
git clone https://github.com/wheredidiputitt/solana-tx-debugger.git
cd solana-tx-debugger
bun install   # or npm install
bun run dev   # or npm run dev
```

Open `http://localhost:3000` - you should see the dashboard.

### Start the Watch service (optional, for Watch Address feature)

In a separate terminal:

```bash
cd mini-services/watch-service
bun install
bun run dev   # listens on port 3005
```

The main Next.js app automatically connects to it via the Caddy gateway.

---

## 🔑 Environment variables

All optional. The app works out-of-the-box with public RPC + demo fallbacks.

```bash
# .env

# Recommended: get a free Helius API key at https://www.helius.dev/
# Free tier = 100k credits/month, no credit card required
HELIUS_API_KEY=your_helius_key_here

# OR: any custom Solana RPC URL (QuickNode, Alchemy, Triton, etc.)
SOLANA_RPC_URL=https://your-rpc-url.example.com/
```

Without these, the app uses `https://api.mainnet-beta.solana.com` (rate-limited to ~40 req/sec per IP).

---

## 📁 Project structure

```
solana-tx-debugger/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/        # POST - fetch + analyze transaction
│   │   │   ├── network/        # GET - live RPC status (slot, epoch, latency)
│   │   │   └── prices/         # POST - token price lookup
│   │   ├── globals.css         # Solana-themed design tokens
│   │   ├── layout.tsx          # Root layout + providers
│   │   └── page.tsx            # SPA view router (Dashboard / Report / Watch / etc.)
│   ├── components/
│   │   ├── dashboard/          # DashboardView, TransactionInputCard, OverviewCard, etc.
│   │   ├── report/             # SummaryCard, BalanceChangesCard, TokenTransferTable, etc.
│   │   ├── layout/             # Sidebar, Header, MobileNav
│   │   └── shared/             # ThemeProvider, QueryProvider
│   └── lib/
│       ├── solana/
│       │   ├── types.ts        # TransactionReport + related types
│       │   ├── programs.ts     # Well-known program + token registries
│       │   ├── errors.ts       # Error decoder
│       │   ├── anchor-decoder.ts  # Per-program instruction decoders
│       │   ├── analyze.ts      # Main analyzer (turns RPC tx → TransactionReport)
│       │   ├── demo-fixtures.ts   # 5 built-in demo transactions
│       │   └── csv.ts          # CSV export utilities
│       ├── store.ts            # Zustand store (view, recent, saved, watched)
│       ├── hooks.ts            # useAnalyzeTransaction, useNetworkStatus
│       └── watch-client.ts     # Singleton WebSocket client
├── mini-services/
│   └── watch-service/          # Socket.IO server on port 3005
├── prisma/                     # Prisma schema (unused in MVP, ready for future)
├── public/
└── README.md
```

---

## ⚠️ Common issues & troubleshooting

This section covers the most likely issues users will hit, why they happen, and how to fix them.

### 1. "Transaction not found" error

**Why:** The public Solana RPC (`api.mainnet-beta.solana.com`) rate-limits to ~40 requests per second per IP. During high network activity or shared IP ranges (offices, hackathons, cloud providers), requests get rejected with 429 errors. The transaction may also not be finalized yet (it takes ~2 seconds for a tx to be confirmed but ~13 seconds for it to be finalized).

**Fix:**
- Wait 10-15 seconds and try again (the tx may not be finalized)
- Set `HELIUS_API_KEY` in `.env` (free tier = 100k credits/month)
- Or set `SOLANA_RPC_URL` to a paid provider (QuickNode, Alchemy, Triton)

### 2. "Demo data" badge on a report

**Why:** When the live RPC is unreachable (sandboxed environments, rate-limited IPs, offline dev), the app falls back to built-in demo transactions so the UI remains explorable. The badge explicitly marks these as demo data.

**Fix:** This is expected behavior in sandboxed preview environments. Deploy to a platform with proper network egress (Vercel, Netlify, Railway) and the badge will disappear for real signatures.

### 3. USD values show as "$0.00" or "—"

**Why:** The app fetches prices from three sources in order: Birdeye public API → CoinGecko → local registry. Birdeye's free tier is rate-limited to ~50 requests/minute without an API key, and CoinGecko's free API is also rate-limited. When both fail, only tokens in the local registry (SOL, USDC, USDT, BONK, JitoSOL, PYTH, RNDR, mSOL, RAY, JUP) get prices.

**Fix:**
- Wait 5 minutes (prices are cached for 5 min, so retry after cache expiry)
- The local registry has approximate prices for the 10 most common tokens — those will always show some value
- For full coverage of any SPL token, we'd need a Birdeye API key (planned: Settings UI to paste your key)

### 4. Watch Address shows "Disconnected" or "Connecting…"

**Why:** The Watch feature requires a separate WebSocket service running on port 3005. In serverless deployments (Vercel, Netlify), WebSockets aren't supported - the service needs a long-running process.

**Fix:**
- **Local dev:** Run `cd mini-services/watch-service && bun run dev` in a separate terminal
- **Production:** Deploy the watch service to Railway, Render, Fly.io, or any platform that supports long-running Node.js processes. Update the port in `src/lib/watch-client.ts` if you change it.
- **Alternative:** If you don't need Watch, you can safely delete `mini-services/` and remove the Watch nav item - the rest of the app works fine without it.

### 5. "Invalid Solana address" error in Watch

**Why:** The Watch feature validates addresses using `PublicKey()` from `@solana/web3.js`. Solana addresses are 32-44 character base58 strings. Transaction signatures (88 characters) and private keys will fail validation.

**Fix:** Make sure you're pasting a wallet address, not a transaction signature. Wallet addresses look like `9aF2QxWzMZvWJFkVR6gMhDqT5nq3v7s8r2xK4pN1mQ8Z` (typically 32-44 chars).

### 6. Hydration mismatch warnings in console

**Why:** The theme (dark/light) is read from `localStorage` on the client, but the server renders with the default theme. This is a known `next-themes` pattern and is harmless - the `suppressHydrationWarning` attribute on `<html>` handles it.

**Fix:** No action needed. The warning is purely cosmetic and doesn't affect functionality.

### 7. CORS errors when calling Solana RPC directly from the browser

**Why:** Solana RPC endpoints don't send CORS headers, so browser-side `fetch()` calls fail. This is why the app routes all RPC calls through Next.js API routes (`/api/analyze`, `/api/network`, `/api/prices`) which run server-side.

**Fix:** This is by design. If you're adding new RPC calls, always do them server-side in `src/app/api/*/route.ts`. Never call Solana RPC directly from a client component.

### 8. Build fails with "Cannot find module '@solana/web3.js'"

**Why:** Dependencies weren't installed, or the install was interrupted.

**Fix:**
```bash
rm -rf node_modules bun.lock
bun install   # or npm install
```

### 9. "Compute units" shows 0

**Why:** The analyzer extracts compute units from the program log line `"Program X consumed N of M compute units"`. This line is missing for:
- Transactions that failed before any program logged
- Very old transactions (pre-2022)
- Transactions on devnet/testnet where the runtime didn't log

**Fix:** None - this is a best-effort field. The transaction's metadata is still complete; only the compute breakdown is unavailable.

### 10. Token transfers show "UNKNOWN" symbol

**Why:** The token's mint address isn't in our local registry of 10 well-known tokens, and the price API didn't return metadata. There are tens of thousands of SPL tokens on Solana - we can't ship them all in the bundle.

**Fix:** The mint address is still shown so you can look it up on Solscan. For full metadata coverage, we're planning to integrate the Helius DAS API (see Roadmap).

### 11. WebSocket connection fails on deployed Vercel

**Why:** Vercel is a serverless platform - it doesn't support long-running WebSocket connections. The Caddy gateway used in local dev also isn't available.

**Fix:** The Watch feature requires a long-running Node.js process. Options:
1. Deploy the watch service separately to Railway / Render / Fly.io
2. Replace the polling architecture with Helius webhooks (paid)
3. Remove the Watch feature for Vercel deployments (delete `mini-services/` and the Watch nav item)

### 12. App shows "demo transaction" toast even for real signatures

**Why:** When the live RPC fails (rate limit, timeout, network issue), the app falls back to a demo transaction that matches the user's signature. The toast explicitly says "Live RPC unreachable - showing demo data for this signature."

**Fix:** Set `HELIUS_API_KEY` or `SOLANA_RPC_URL` in `.env` to use a paid RPC with higher rate limits.

### 13. CSV export doesn't download

**Why:** Some browsers block blob downloads from sandboxed iframes. This can happen if the app is embedded in another page.

**Fix:** Open the app in its own tab (not embedded in an iframe). The "Open in New Tab" button in the preview panel does this.

### 14. Pasting a signature doesn't auto-analyze

**Why:** The "Paste" button only fills the input - it doesn't auto-submit, because the user might want to edit the signature first.

**Fix:** Click "Analyze" or press Enter after pasting.

### 15. App is slow / takes a long time to analyze

**Why:** The analyzer fetches the transaction, then fetches token prices, then enriches the report. Each step can fail and timeout (5s per fetch). On a slow connection or with rate-limited RPC, this can take 10-15 seconds.

**Fix:**
- Use a paid RPC (Helius / QuickNode) - 10x faster than public RPC
- The price fetch is cached for 5 minutes, so subsequent analyses of the same tx are fast

---

## 🗺 Roadmap

### ✅ Shipped
- Transaction analyzer (System, SPL Token, ATA, Compute Budget, Jupiter, Raydium, Orca, Metaplex, Memo, Stake)
- Human-readable summary generator
- Token transfer detection (native + SPL, parsed + balance-diff fallback)
- SOL balance changes per account
- Programs invoked registry (30+ well-known programs)
- Execution logs viewer with filtering
- Error decoder (InstructionError, custom program errors, keyword patterns)
- Recent searches + saved reports (localStorage)
- Shareable report URLs
- Anchor-style instruction decoder with plain-English descriptions
- USD values via Birdeye → CoinGecko → local price registry
- CSV export (full report / balances / transfers)
- Watch Address via WebSocket (mini-service on port 3005)
- Compare two transactions side-by-side

### 🔮 Next up
- Helius DAS API integration for full token metadata (logos, names, all mints)
- Address labels (known exchanges, validators, programs)
- Per-token USD value history chart on the report page
- Anchor error code database (cover common Anchor programs)
- Settings UI to paste Helius API key (saved to localStorage)
- Bundle replay — modify params and re-simulate a transaction

### 🔧 Later
- Custom program IDL upload (paste your Anchor IDL, decode your own instructions)
- Live transaction streaming via Helius websockets / Yellowstone geyser
- Multi-signature wallet support (Squads, Realms)
- Solana FM + Solscan enrichment (cross-reference with their metadata)
- Transaction simulation preview (Campfire / Helius simulate endpoint)
- Mobile app (React Native + Expo)
- Public REST API for programmatic access
- Discord / Telegram bot integration for Watch alerts

Want to upvote or request a feature? [Open an issue](../../issues/new).

---

## 🤝 Contributing

Pull requests welcome! Areas that especially need help:

- **Anchor IDL coverage** - add more program decoders in `src/lib/solana/anchor-decoder.ts`
- **Token registry** - add more well-known mints in `src/lib/solana/programs.ts`
- **Error decoder patterns** - add more error patterns in `src/lib/solana/errors.ts`
- **UI polish** - better mobile layouts, accessibility improvements

### Development setup

```bash
bun install
bun run dev      # Next.js app on port 3000
bun run lint     # ESLint check
```

In a separate terminal for the Watch service:
```bash
cd mini-services/watch-service
bun install
bun run dev      # Socket.IO on port 3005
```

---

## 📜 License

MIT © 2026 SolanaTx Debugger

Built with:
- [Next.js](https://nextjs.org)
- [@solana/web3.js](https://github.com/solana-labs/solana-web3.js)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://github.com/pmndrs/zustand)
- [Socket.IO](https://socket.io)
- [Birdeye](https://birdeye.so) (price data)
- [CoinGecko](https://coingecko.com) (price fallback)

---

## 🙏 Acknowledgments

- The [Solana](https://solana.com) team for the protocol and web3.js library
- [Helius](https://www.helius.dev) for their excellent Solana developer infrastructure (and free tier)
- [Birdeye](https://birdeye.so) for free public price API access
- The shadcn/ui community for the component library
- Everyone who's ever squinted at a raw Solana transaction log and thought "there has to be a better way"
