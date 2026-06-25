"use client";

import { Card } from "@/components/ui/card";
import { AlertTriangle, AlertOctagon, Lightbulb, CheckCircle2 } from "lucide-react";
import type { TransactionReport } from "@/lib/solana/types";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export function ErrorCard({ report }: { report: TransactionReport }) {
  if (report.errors.length === 0) {
    return (
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Decoded Errors
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No errors — transaction executed cleanly
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            All instructions returned successfully.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6 bg-card border-rose-200 dark:border-rose-500/30 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center">
            <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Decoded Errors
          </h3>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] border-rose-500/30 text-rose-600 dark:text-rose-400"
        >
          {report.errors.length} error{report.errors.length === 1 ? "" : "s"}
        </Badge>
      </div>

      <div className="space-y-3">
        {report.errors.map((err, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/5 p-4"
          >
            <div className="flex items-start gap-3 mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground leading-relaxed flex-1">
                {err.explanation}
              </p>
            </div>

            {err.hint && (
              <div className="ml-7 mb-2 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 rounded-md p-2.5">
                <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{err.hint}</span>
              </div>
            )}

            <div className="ml-7">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                Raw error
              </div>
              <code className="text-[11px] font-mono text-rose-700 dark:text-rose-300 bg-rose-100/50 dark:bg-rose-500/10 px-2 py-1 rounded break-all">
                {err.raw}
              </code>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
