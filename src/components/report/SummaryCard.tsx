"use client";

import { Card } from "@/components/ui/card";
import { FileText, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import type { TransactionReport } from "@/lib/solana/types";
import { motion } from "framer-motion";

export function SummaryCard({ report }: { report: TransactionReport }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report.summary);
      setCopied(true);
      toast.success("Summary copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-accent" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Human Readable Summary
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-xs h-8 gap-1.5"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-success" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </Button>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[15px] leading-relaxed text-foreground/90"
      >
        {report.summary}
      </motion.p>

      {report.source === "demo" && (
        <div className="mt-3 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-md px-2.5 py-1.5 inline-block">
          Demo data — RPC unreachable from sandbox. Try a real signature in production.
        </div>
      )}
    </Card>
  );
}
