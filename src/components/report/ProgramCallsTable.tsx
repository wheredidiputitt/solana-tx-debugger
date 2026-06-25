"use client";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Cpu, ExternalLink } from "lucide-react";
import type { TransactionReport } from "@/lib/solana/types";
import { programIcon, lookupProgram } from "@/lib/solana/programs";
import { shortenAddress } from "@/lib/solana/analyze";
import { motion } from "framer-motion";

export function ProgramCallsTable({ report }: { report: TransactionReport }) {
  const programs = report.programs;

  return (
    <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Programs Invoked
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {programs.length} program{programs.length === 1 ? "" : "s"}
        </span>
      </div>

      {programs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No programs detected.
        </p>
      ) : (
        <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6 scroll-area-thin">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                  Program
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                  Program ID
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                  Category
                </TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wide text-muted-foreground">
                  Invocations
                </TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wide text-muted-foreground">
                  Explorer
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((p, i) => {
                const meta = lookupProgram(p.programId);
                return (
                  <motion.tr
                    key={p.programId + i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.05, 0.4) }}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg leading-none">
                          {programIcon(meta.category)}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {p.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                      {shortenAddress(p.programId, 6, 4)}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        {meta.category}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <span className="text-sm font-semibold tabular-nums">
                        {p.invocations}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <a
                        href={`https://explorer.solana.com/address/${p.programId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-xs text-accent hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
