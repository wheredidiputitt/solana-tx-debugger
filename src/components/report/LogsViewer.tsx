"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Terminal,
  ChevronDown,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { TransactionReport } from "@/lib/solana/types";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function LogsViewer({ report }: { report: TransactionReport }) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<"all" | "errors" | "success">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return report.logs;
    if (filter === "errors")
      return report.logs.filter(
        (l) => /error|failed|panic/i.test(l)
      );
    return report.logs.filter((l) => /success/i.test(l));
  }, [report.logs, filter]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report.logs.join("\n"));
      setCopied(true);
      toast.success(`Copied ${report.logs.length} log lines`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  const getLogColor = (line: string) => {
    if (/error|failed|panic/i.test(line)) return "text-rose-600 dark:text-rose-400";
    if (/success/i.test(line)) return "text-emerald-600 dark:text-emerald-400";
    if (/invoke/i.test(line)) return "text-purple-600 dark:text-purple-400";
    if (/consumed.*compute/i.test(line))
      return "text-amber-600 dark:text-amber-400";
    return "text-muted-foreground";
  };

  return (
    <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700/40 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              Execution Logs
            </h3>
            <span className="text-xs text-muted-foreground">
              {report.logs.length} line{report.logs.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 gap-1.5"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-success" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              Copy
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronDown
                  className={cn("w-4 h-4 transition-transform", open && "rotate-180")}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <div className="flex gap-1 mb-3">
          {(["all", "errors", "success"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-md font-medium capitalize transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <CollapsibleContent>
          {report.logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No logs available.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No logs match this filter.
            </p>
          ) : (
            <div className="bg-slate-950 dark:bg-black/40 rounded-lg p-4 max-h-96 overflow-y-auto scroll-area-thin font-mono text-[12px] leading-relaxed">
              {filtered.map((line, i) => (
                <div key={i} className="flex gap-3 hover:bg-white/5 px-2 -mx-2 rounded">
                  <span className="text-slate-600 select-none shrink-0 w-8 text-right">
                    {i + 1}
                  </span>
                  <span className={cn("break-all", getLogColor(line))}>
                    {line}
                  </span>
                </div>
              ))}
            </div>
          )}

          {report.status === "failed" && (
            <div className="mt-3 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-md p-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                This transaction failed. Look for{" "}
                <code className="font-mono text-amber-700 dark:text-amber-300">
                  failed:
                </code>{" "}
                lines above to find the root cause.
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
