"use client";

import { Card } from "@/components/ui/card";
import { Wallet, TrendingDown, TrendingUp } from "lucide-react";
import type { TransactionReport } from "@/lib/solana/types";
import { shortenAddress, lamportsToSol, formatSol } from "@/lib/solana/analyze";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function BalanceChangesCard({ report }: { report: TransactionReport }) {
  const changes = report.balanceChanges;
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? changes : changes.slice(0, 6);

  return (
    <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            SOL Balance Changes
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {changes.length} account{changes.length === 1 ? "" : "s"} changed
        </span>
      </div>

      {changes.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No SOL balance changes detected.
        </p>
      ) : (
        <>
          <div className="grid gap-2">
            {visible.map((c, i) => {
              const positive = c.rawChange > 0;
              return (
                <motion.div
                  key={c.account + i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        positive
                          ? "bg-emerald-100 dark:bg-emerald-500/15"
                          : "bg-rose-100 dark:bg-rose-500/15"
                      )}
                    >
                      {positive ? (
                        <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-mono text-foreground truncate">
                        {shortenAddress(c.account, 6, 6)}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Pre: {formatSol(lamportsToSol(c.preBalance ?? 0), 4)} SOL
                        {c.usdValue !== undefined && c.usdValue !== 0 && (
                          <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                            ({c.usdValue > 0 ? "+" : ""}{c.usdValue < 0 || c.usdValue > 0 ? `$${Math.abs(c.usdValue).toFixed(2)}` : "$0.00"})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "text-sm font-mono font-semibold tabular-nums shrink-0",
                      positive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {c.change}
                  </div>
                </motion.div>
              );
            })}
          </div>
          {changes.length > 6 && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="mt-3 text-xs text-accent hover:underline w-full text-center"
            >
              {showAll
                ? "Show less"
                : `Show all ${changes.length} accounts`}
            </button>
          )}
        </>
      )}
    </Card>
  );
}
