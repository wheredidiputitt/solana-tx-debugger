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
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Coins, DollarSign } from "lucide-react";
import type { TransactionReport } from "@/lib/solana/types";
import { shortenAddress } from "@/lib/solana/analyze";
import { motion } from "framer-motion";

function formatUsd(v: number): string {
  if (!v || v === 0) return "";
  if (v < 0.01) return `$${v.toFixed(6)}`;
  if (v < 1) return `$${v.toFixed(4)}`;
  if (v < 1000) return `$${v.toFixed(2)}`;
  return `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function TokenTransferTable({ report }: { report: TransactionReport }) {
  const transfers = report.transfers;
  const hasUsd = transfers.some((t) => t.usdValue !== undefined);
  const totalUsd = transfers.reduce((sum, t) => sum + (t.usdValue ?? 0), 0);

  return (
    <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center">
            <Coins className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Token Transfers
          </h3>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">
            {transfers.length} transfer{transfers.length === 1 ? "" : "s"}
          </div>
          {hasUsd && totalUsd > 0 && (
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Total: {formatUsd(totalUsd)}
            </div>
          )}
        </div>
      </div>

      {transfers.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No token transfers detected.
        </p>
      ) : (
        <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6 scroll-area-thin">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                  Token
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                  Amount
                </TableHead>
                {hasUsd && (
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                    USD Value
                  </TableHead>
                )}
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                  From
                </TableHead>
                <TableHead className="w-8 p-0"></TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                  To
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground text-right">
                  Type
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((t, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.05, 0.4) }}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/30 to-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-foreground">
                        {t.token.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground">
                          {t.token}
                        </div>
                        {t.mint && (
                          <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                            {shortenAddress(t.mint, 5, 4)}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 font-mono text-sm font-semibold tabular-nums">
                    {t.amount}
                  </TableCell>
                  {hasUsd && (
                    <TableCell className="py-3 font-mono text-xs">
                      {t.usdValue !== undefined && t.usdValue > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <DollarSign className="w-3 h-3" />
                          {formatUsd(t.usdValue).replace("$", "")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                    {t.from === "Mint" ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-purple-500/30 text-purple-600 dark:text-purple-400"
                      >
                        Mint
                      </Badge>
                    ) : t.from === "Burn" ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-rose-500/30 text-rose-600 dark:text-rose-400"
                      >
                        Burn
                      </Badge>
                    ) : (
                      shortenAddress(t.from, 6, 4)
                    )}
                  </TableCell>
                  <TableCell className="p-0">
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                    {t.to === "Burn" ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-rose-500/30 text-rose-600 dark:text-rose-400"
                      >
                        Burn
                      </Badge>
                      ) : t.to === "Mint" ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-purple-500/30 text-purple-600 dark:text-purple-400"
                      >
                        Mint
                      </Badge>
                    ) : (
                      shortenAddress(t.to, 6, 4)
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-medium"
                    >
                      {t.type === "native" ? "SOL" : "SPL"}
                    </Badge>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
