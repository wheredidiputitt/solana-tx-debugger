"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ListTree, CheckCircle2, XCircle } from "lucide-react";
import type { TransactionReport } from "@/lib/solana/types";
import { programIcon, lookupProgram } from "@/lib/solana/programs";
import { shortenAddress } from "@/lib/solana/analyze";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function InstructionViewer({ report }: { report: TransactionReport }) {
  const instructions = report.instructions;
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
            <ListTree className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Instructions
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {instructions.length} instruction{instructions.length === 1 ? "" : "s"}
        </span>
      </div>

      {instructions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No instructions found.
        </p>
      ) : (
        <div className="space-y-2">
          {instructions.map((ix, i) => {
            const meta = lookupProgram(ix.programId);
            const isOpen = openIdx === i;
            return (
              <Collapsible
                key={i}
                open={isOpen}
                onOpenChange={(o) => setOpenIdx(o ? i : null)}
              >
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                      isOpen
                        ? "bg-muted/80"
                        : "bg-muted/40 hover:bg-muted/60"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
                      <span className="text-base">{programIcon(meta.category)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-mono text-muted-foreground">
                          #{ix.index}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {ix.programName}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-mono"
                        >
                          {ix.type}
                        </Badge>
                        {ix.inner > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-accent/30 text-accent"
                          >
                            {ix.inner} inner
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
                        {shortenAddress(ix.programId, 8, 6)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ix.status === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <XCircle className="w-4 h-4 text-danger" />
                      )}
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform",
                          isOpen && "rotate-180"
                        )}
                      />
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1 ml-11 mr-3 p-3 rounded-lg border border-border bg-background/50 overflow-hidden"
                  >
                    {ix.description && (
                      <p className="text-xs text-foreground leading-relaxed mb-3 pb-2 border-b border-border/60">
                        {ix.description}
                      </p>
                    )}
                    {ix.data && Object.keys(ix.data).length > 0 ? (
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                          Parsed args
                        </div>
                        {Object.entries(ix.data).slice(0, 12).map(([k, v]) => (
                          <div
                            key={k}
                            className="flex items-start justify-between gap-3 text-xs"
                          >
                            <span className="text-muted-foreground font-mono shrink-0">
                              {k}:
                            </span>
                            <span className="font-mono text-foreground text-right break-all">
                              {v}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      !ix.description && (
                        <p className="text-xs text-muted-foreground">
                          No parsed args available for this instruction.
                        </p>
                      )
                    )}
                  </motion.div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}
    </Card>
  );
}
