"use client";

import { useState, useCallback, useRef } from "react";
import {
  Search,
  ClipboardPaste,
  Loader2,
  Sparkles,
  ArrowRight,
  Play,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { useAnalyzeTransaction } from "@/lib/hooks";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { DEMO_SIGNATURES } from "@/lib/solana/demo-fixtures";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const DEMO_LABELS: Record<string, string> = {
  "5Nh6hM7J7YxNp3FbQFbQf2xQ5wQ5e7X2Y2k9z8s7t6r5p4":
    "SOL transfer (System Program)",
  "2vHqQ4mZ8t3XQ9zVjWf8QD2sPp9xQ5e7X2Y2k9z8s7t6r5p":
    "Jupiter swap (SOL → USDC)",
  "3xHqQ9mZ4t7XQ5zVjWf8QD2sPp9xQ5e7X2Y2k9z8s7t6r5p":
    "Failed tx (insufficient funds)",
  "4yHqQ8mZ5t6XQ4zVjWf8QD2sPp9xQ5e7X2Y2k9z8s7t6r5p":
    "BONK token transfer",
  "5xHqQ7mZ6t5XQ4zVjWf8QD2sPp9xQ5e7X2Y2k9z8s7t6r5p":
    "Complex multi-program swap",
};

export function TransactionInputCard() {
  const [sig, setSig] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { goToReport, addRecent, setCurrentReport } = useAppStore();
  const analyze = useAnalyzeTransaction();

  const handleAnalyze = useCallback(
    async (signatureOverride?: string) => {
      const signature = (signatureOverride ?? sig).trim();
      if (!signature) {
        toast.error("Please paste a transaction signature first.", {
          description: "Tip: click 'Try Example' to load a sample transaction.",
        });
        inputRef.current?.focus();
        return;
      }
      if (signature.length < 16) {
        toast.error("That signature looks too short — please double-check it.");
        return;
      }

      try {
        const result = await analyze.mutateAsync(signature);
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

          if (result.fallbackUsed) {
            toast.warning(
              "Live RPC unavailable — showing demo data for this signature.",
              { duration: 6000 }
            );
          } else if (result.report.source === "demo") {
            toast.success("Loaded demo transaction.", { duration: 4000 });
          } else {
            toast.success("Transaction analyzed.");
          }
        }
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to analyze transaction.");
      }
    },
    [sig, analyze, goToReport, addRecent, setCurrentReport]
  );

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSig(text.trim());
        toast.success("Pasted from clipboard");
      }
    } catch {
      toast.error("Clipboard access denied. Paste manually with Cmd/Ctrl+V.");
      inputRef.current?.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const loadDemo = (demoSig: string) => {
    setSig(demoSig);
    handleAnalyze(demoSig);
  };

  return (
    <Card className="p-6 sm:p-7 bg-card border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">
              Analyze Transaction
            </h2>
            <Badge variant="secondary" className="text-[10px] ml-auto">
              Mainnet
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Paste a Solana transaction signature to get a human-readable analysis.
          </p>
        </div>

        {/* Input + Analyze — Analyze is ALWAYS visible and clickable */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <Input
              ref={inputRef}
              type="text"
              value={sig}
              onChange={(e) => setSig(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter transaction signature…  (e.g. 5Nh6hM7J7YxN…)"
              className="h-12 pr-10 font-mono text-sm bg-background"
              spellCheck={false}
              autoComplete="off"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          <Button
            variant="secondary"
            size="default"
            className="h-12 px-4 gap-2 shrink-0"
            onClick={handlePaste}
            disabled={analyze.isPending}
          >
            <ClipboardPaste className="w-4 h-4" />
            <span className="hidden sm:inline">Paste</span>
          </Button>

          {/* Always-visible, always-enabled Analyze button */}
          <Button
            size="default"
            className="h-12 px-6 gap-2 solana-gradient text-white hover:opacity-90 border-0 shrink-0 font-semibold"
            onClick={() => handleAnalyze()}
            disabled={analyze.isPending}
          >
            {analyze.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Analyze
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Prominent Try Example dropdown */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 border-accent/30 text-accent hover:bg-accent/10"
              >
                <Play className="w-3.5 h-3.5 fill-accent" />
                Try Example
                <ChevronDown className="w-3 h-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Load a demo transaction
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {DEMO_SIGNATURES.map((s) => (
                <DropdownMenuItem
                  key={s}
                  className="cursor-pointer flex flex-col items-start gap-0.5 py-2"
                  onClick={() => loadDemo(s)}
                  disabled={analyze.isPending}
                >
                  <span className="text-sm font-medium text-foreground">
                    {DEMO_LABELS[s] ?? `Demo ${s.slice(0, 6)}`}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono truncate w-full">
                    {s}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="text-xs text-muted-foreground">
            or click any demo below to try it instantly
          </span>
        </div>

        {/* Quick demo chips — also visible */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {DEMO_SIGNATURES.slice(0, 3).map((s, i) => (
            <motion.button
              key={s}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              onClick={() => loadDemo(s)}
              disabled={analyze.isPending}
              className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-muted hover:bg-accent/10 hover:text-accent text-muted-foreground transition-colors max-w-[180px] truncate flex items-center gap-1.5"
              title={DEMO_LABELS[s] ?? s}
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              {DEMO_LABELS[s]?.split(" ")[0] ?? s.slice(0, 14)}…
            </motion.button>
          ))}
        </div>
      </div>
    </Card>
  );
}
