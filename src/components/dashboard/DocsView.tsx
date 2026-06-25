"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Zap,
  ListChecks,
  ShieldAlert,
  Share2,
  Database,
  Clock,
  Map,
  CheckCircle2,
  Circle,
  Sparkles,
} from "lucide-react";
import { DEMO_SIGNATURES } from "@/lib/solana/demo-fixtures";
import { useAppStore } from "@/lib/store";
import { useAnalyzeTransaction } from "@/lib/hooks";
import { toast } from "sonner";

const STEPS = [
  {
    icon: Search,
    title: "1. Paste a signature",
    body: "Drop any Solana mainnet transaction signature into the search box on the dashboard.",
  },
  {
    icon: Database,
    title: "2. We fetch on-chain data",
    body: "The backend calls Solana RPC: getTransaction, getBlockTime, pre/post balances, and inner instructions.",
  },
  {
    icon: ListChecks,
    title: "3. We decode instructions",
    body: "Each instruction is parsed and labelled (Transfer, Swap, Mint, etc.) with all arguments surfaced.",
  },
  {
    icon: Zap,
    title: "4. Get the report",
    body: "A plain-English summary, balance diffs, token transfers, programs invoked, compute units, and decoded errors.",
  },
];

const FAQ = [
  {
    q: "Where does the data come from?",
    a: "We use the public Solana RPC by default, with optional Helius and QuickNode fallbacks. If the RPC is unreachable, the tool falls back to a built-in demo transaction so you can still explore the UI.",
  },
  {
    q: "What kinds of transactions are supported?",
    a: "Any mainnet-beta transaction with on-chain data: SOL transfers, SPL token movements, Jupiter swaps, NFT mints, staking operations, program deployments, and more.",
  },
  {
    q: "How are errors decoded?",
    a: "We pattern-match raw error strings — 'InstructionError(N, Custom(1))', 'failed: custom program error: 0x1', keyword logs like 'insufficient funds' — and map them to plain-English explanations with suggested fixes.",
  },
  {
    q: "Are my searches private?",
    a: "Yes. Recent searches are stored only in your browser's localStorage. They never leave your machine.",
  },
  {
    q: "Can I share a report?",
    a: "Every analysis can be shared via its URL. Hit the Share button to copy a link that re-opens the same report.",
  },
];

const ROADMAP = [
  {
    phase: "Shipped",
    status: "done" as const,
    items: [
      "Transaction analyzer (System, SPL Token, ATA, Compute Budget, Jupiter, Raydium, Orca, Metaplex, Memo, Stake)",
      "Human-readable summary generator",
      "Token transfer detection (native + SPL, parsed + balance-diff fallback)",
      "SOL balance changes per account",
      "Programs invoked registry (30+ well-known programs)",
      "Execution logs viewer with filtering",
      "Error decoder (InstructionError, custom program errors, keyword patterns)",
      "Recent searches + saved reports (localStorage)",
      "Shareable report URLs",
      "Anchor-style instruction decoder with plain-English descriptions",
      "USD values via Birdeye → CoinGecko → local price registry",
      "CSV export (full report / balances / transfers)",
      "Watch Address via WebSocket (mini-service on port 3005)",
      "Compare two transactions side-by-side",
    ],
  },
  {
    phase: "Next up",
    status: "next" as const,
    items: [
      "Helius DAS API integration for full token metadata (logos, names, all mints)",
      "Address labels (known exchanges, validators, programs)",
      "Per-token USD value history chart on the report page",
      "Anchor error code database (cover common Anchor programs)",
      "Settings UI to paste Helius API key (saved to localStorage)",
      "Bundle replay — modify params and re-simulate a transaction",
    ],
  },
  {
    phase: "Later",
    status: "later" as const,
    items: [
      "Custom program IDL upload (paste your Anchor IDL, decode your own instructions)",
      "Live transaction streaming via Helius websockets / Yellowstone geyser",
      "Multi-signature wallet support (Squads, Realms)",
      "Solana FM + Solscan enrichment (cross-reference with their metadata)",
      "Transaction simulation preview (Campfire / Helius simulate endpoint)",
      "Mobile app (React Native + Expo)",
      "Public REST API for programmatic access",
      "Discord / Telegram bot integration for Watch alerts",
    ],
  },
];

export function DocsView() {
  const { goToReport, addRecent, setCurrentReport } = useAppStore();
  const analyze = useAnalyzeTransaction();

  const tryDemo = async (sig: string) => {
    try {
      const result = await analyze.mutateAsync(sig);
      if (result?.report) {
        setCurrentReport(result.report);
        addRecent({
          signature: result.report.signature,
          status: result.report.status,
          timestamp: result.report.blockTime || Date.now() / 1000,
          summary: result.report.summary,
          cluster: result.report.cluster,
        });
        goToReport(result.report.signature);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Documentation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Everything you need to know about how SolanaTx Debugger works.
        </p>
      </div>

      {/* Hero */}
      <Card className="p-6 sm:p-8 dark-card text-white border-0 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-solana-purple/20 blur-3xl" />
        <div className="relative">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            Solana transactions, finally readable.
          </h2>
          <p className="text-sm text-white/70 leading-relaxed max-w-xl">
            SolanaTx Debugger converts raw transaction signatures into clean,
            human-readable reports — no more squinting at JSON logs in Solscan.
            Paste a signature, get the full story in seconds.
          </p>
        </div>
      </Card>

      {/* How it works */}
      <Card className="p-6 sm:p-8 bg-card border-border shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">How it works</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {s.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {s.body}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Features */}
      <Card className="p-6 sm:p-8 bg-card border-border shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <ListChecks className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Features</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: Zap, label: "Instant analysis", body: "Sub-second reports for cached transactions." },
            { icon: ShieldAlert, label: "Error decoder", body: "Custom program errors translated to plain English." },
            { icon: Share2, label: "Shareable URLs", body: "Send any report to a teammate with a single link." },
            { icon: Database, label: "Local history", body: "Recent searches stored in your browser only." },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="flex gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
              >
                <Icon className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {f.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{f.body}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Demo signatures */}
      <Card className="p-6 sm:p-8 bg-card border-border shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">
            Try a demo transaction
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Each demo showcases a different transaction type — click to load it
          instantly.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {DEMO_SIGNATURES.map((sig, i) => {
            const labels = [
              "SOL transfer (System Program)",
              "Jupiter swap (SOL → USDC)",
              "Failed tx (insufficient funds)",
              "BONK token transfer",
              "Complex multi-program swap",
            ];
            return (
              <button
                key={sig}
                onClick={() => tryDemo(sig)}
                disabled={analyze.isPending}
                className="text-left p-3 rounded-lg border border-border bg-background hover:bg-muted/60 hover:border-accent/40 transition-all group"
              >
                <div className="text-sm font-medium text-foreground group-hover:text-accent transition-colors mb-1">
                  {labels[i] ?? `Demo #${i + 1}`}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono truncate">
                  {sig}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Roadmap */}
      <Card className="p-6 sm:p-8 bg-card border-border shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Map className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Roadmap</h2>
        </div>

        <div className="space-y-6">
          {ROADMAP.map((section) => (
            <div key={section.phase}>
              <div className="flex items-center gap-2 mb-3">
                {section.status === "done" && (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {section.phase}
                  </Badge>
                )}
                {section.status === "next" && (
                  <Badge
                    variant="outline"
                    className="border-accent/40 text-accent gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    {section.phase}
                  </Badge>
                )}
                {section.status === "later" && (
                  <Badge
                    variant="outline"
                    className="border-muted-foreground/30 text-muted-foreground gap-1"
                  >
                    <Circle className="w-3 h-3" />
                    {section.phase}
                  </Badge>
                )}
              </div>
              <ul className="space-y-1.5 ml-1">
                {section.items.map((item, i) => (
                  <motion.li
                    key={item + i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3) }}
                    className="flex items-start gap-2.5 text-sm"
                  >
                    {section.status === "done" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : section.status === "next" ? (
                      <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <span
                      className={
                        section.status === "later"
                          ? "text-muted-foreground"
                          : "text-foreground"
                      }
                    >
                      {item}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
          Want to upvote or request a feature? Open an issue on the{" "}
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            GitHub repo
          </a>
          .
        </div>
      </Card>

      {/* FAQ */}
      <Card className="p-6 sm:p-8 bg-card border-border shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Frequently asked questions
        </h2>
        <div className="space-y-4">
          {FAQ.map((item) => (
            <div key={item.q} className="border-b border-border pb-4 last:border-0">
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                {item.q}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
