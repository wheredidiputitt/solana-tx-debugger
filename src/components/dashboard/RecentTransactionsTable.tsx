"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, Trash2, ArrowUpRight, Inbox } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";
import { shortenAddress } from "@/lib/solana/analyze";

function timeAgo(unix: number): string {
  const s = Math.floor(Date.now() / 1000 - unix);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function RecentTransactionsTable() {
  const { recent, clearRecent, goToReport, setView } = useAppStore();

  return (
    <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-base font-semibold text-foreground">
            Recent Transactions
          </h3>
          {recent.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {recent.length}
            </Badge>
          )}
        </div>
        {recent.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-danger"
            onClick={() => clearRecent()}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Inbox className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No searches yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Transactions you analyze will appear here for quick re-access.
            They&apos;re stored locally in your browser.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6 scroll-area-thin">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                  Signature
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                  Time
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wide text-muted-foreground">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.slice(0, 10).map((item, i) => (
                <motion.tr
                  key={item.signature + i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="group cursor-pointer hover:bg-muted/60 transition-colors"
                  onClick={() => goToReport(item.signature)}
                >
                  <TableCell className="font-mono text-xs py-3">
                    {shortenAddress(item.signature, 10, 6)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground py-3">
                    {timeAgo(item.timestamp)}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      variant="outline"
                      className={
                        item.status === "success"
                          ? "border-success/30 text-success text-[10px] font-medium"
                          : "border-danger/30 text-danger text-[10px] font-medium"
                      }
                    >
                      {item.status === "success" ? "Success" : "Failed"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <span className="inline-flex items-center text-xs text-muted-foreground group-hover:text-accent transition-colors">
                      View
                      <ArrowUpRight className="w-3 h-3 ml-1" />
                    </span>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {recent.length > 5 && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setView({ kind: "reports" })}
          >
            View all {recent.length} reports
          </Button>
        </div>
      )}
    </Card>
  );
}
