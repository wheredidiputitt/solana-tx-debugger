"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ArrowUpRight, History, Inbox } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";
import { shortenAddress } from "@/lib/solana/analyze";

export function ReportsView() {
  const { recent, clearRecent, goToReport } = useAppStore();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recent Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Transactions you&apos;ve analyzed. Stored locally in your browser.
          </p>
        </div>
        {recent.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:text-danger"
            onClick={clearRecent}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Clear all
          </Button>
        )}
      </div>

      {recent.length === 0 ? (
        <Card className="p-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Inbox className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No reports yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Analyze a transaction to start building your history.
          </p>
        </Card>
      ) : (
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">
              {recent.length} report{recent.length === 1 ? "" : "s"}
            </h3>
          </div>
          <div className="grid gap-2">
            {recent.map((item, i) => (
              <motion.button
                key={item.signature + i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => goToReport(item.signature)}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted transition-colors text-left group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm text-foreground truncate">
                      {shortenAddress(item.signature, 12, 8)}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        item.status === "success"
                          ? "border-success/30 text-success text-[10px]"
                          : "border-danger/30 text-danger text-[10px]"
                      }
                    >
                      {item.status === "success" ? "Success" : "Failed"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {item.summary}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-accent shrink-0" />
              </motion.button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
