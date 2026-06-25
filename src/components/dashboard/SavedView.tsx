"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Inbox, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";
import { shortenAddress } from "@/lib/solana/analyze";
import { useAnalyzeTransaction } from "@/lib/hooks";
import { useState } from "react";
import { toast } from "sonner";

export function SavedView() {
  const { saved, toggleSaved, goToReport, addRecent, setCurrentReport } =
    useAppStore();
  const analyze = useAnalyzeTransaction();
  const [loading, setLoading] = useState<string | null>(null);

  const open = async (sig: string) => {
    setLoading(sig);
    try {
      const r = await analyze.mutateAsync(sig);
      if (r?.report) {
        setCurrentReport(r.report);
        addRecent({
          signature: r.report.signature,
          status: r.report.status,
          timestamp: r.report.blockTime || Date.now() / 1000,
          summary: r.report.summary,
          cluster: r.report.cluster,
        });
        goToReport(r.report.signature);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Saved Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bookmarked transactions for later reference.
        </p>
      </div>

      {saved.length === 0 ? (
        <Card className="p-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Inbox className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Nothing saved</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Click the bookmark icon on any transaction report to save it for
            later.
          </p>
        </Card>
      ) : (
        <div className="grid gap-2">
          {saved.map((sig, i) => (
            <motion.div
              key={sig + i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Bookmark className="w-4 h-4 text-accent fill-accent" />
                </div>
                <button
                  onClick={() => open(sig)}
                  className="flex-1 text-left min-w-0"
                  disabled={loading === sig}
                >
                  <div className="font-mono text-sm text-foreground truncate">
                    {shortenAddress(sig, 14, 10)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {loading === sig ? "Loading…" : "Click to open"}
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:text-danger shrink-0"
                  onClick={() => {
                    toggleSaved(sig);
                    toast.success("Removed from saved");
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
