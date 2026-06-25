"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useAnalyzeTransaction } from "@/lib/hooks";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ExternalLink,
  Share2,
  Bookmark,
  BookmarkCheck,
  Loader2,
  AlertCircle,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  exportBalanceChangesCsv,
  exportTransfersCsv,
  exportFullReportCsv,
} from "@/lib/solana/csv";
import { OverviewCard } from "@/components/dashboard/OverviewCard";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { SummaryCard } from "@/components/report/SummaryCard";
import { BalanceChangesCard } from "@/components/report/BalanceChangesCard";
import { TokenTransferTable } from "@/components/report/TokenTransferTable";
import { ProgramCallsTable } from "@/components/report/ProgramCallsTable";
import { InstructionViewer } from "@/components/report/InstructionViewer";
import { LogsViewer } from "@/components/report/LogsViewer";
import { ErrorCard } from "@/components/report/ErrorCard";

export function ReportView({ signature }: { signature: string }) {
  const { goToDashboard, addRecent, setCurrentReport, toggleSaved, saved } =
    useAppStore();
  const analyze = useAnalyzeTransaction();

  useEffect(() => {
    analyze.mutate(signature);
  }, [signature]);

  useEffect(() => {
    if (analyze.data?.report) {
      setCurrentReport(analyze.data.report);
      addRecent({
        signature: analyze.data.report.signature,
        status: analyze.data.report.status,
        timestamp: analyze.data.report.blockTime || Date.now() / 1000,
        summary: analyze.data.report.summary,
        cluster: analyze.data.report.cluster,
      });
    }
  }, [analyze.data, setCurrentReport, addRecent]);

  const report = analyze.data?.report ?? null;
  const isSaved = saved.includes(signature);

  const handleShare = async () => {
    const url = `${window.location.origin}/?sig=${encodeURIComponent(signature)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Shareable URL copied to clipboard");
    } catch {
      toast.error("Couldn't copy URL");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={goToDashboard}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-foreground">
                Transaction Report
              </h1>
              {report && (
                <Badge
                  variant="outline"
                  className={
                    report.status === "success"
                      ? "border-success/30 text-success text-[10px]"
                      : "border-danger/30 text-danger text-[10px]"
                  }
                >
                  {report.status === "success" ? "Success" : "Failed"}
                </Badge>
              )}
              {report?.source === "demo" && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400"
                >
                  Demo
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate mt-0.5 max-w-[60vw]">
              {signature}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              toggleSaved(signature);
              toast.success(
                isSaved ? "Removed from saved" : "Saved for later"
              );
            }}
          >
            {isSaved ? (
              <BookmarkCheck className="w-4 h-4 text-accent" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isSaved ? "Saved" : "Save"}
            </span>
          </Button>
          {report && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Export to CSV
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    exportFullReportCsv(report);
                    toast.success("Full report exported");
                  }}
                >
                  Full report (all sections)
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    exportBalanceChangesCsv(report);
                    toast.success("Balance changes exported");
                  }}
                >
                  SOL balance changes
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    exportTransfersCsv(report);
                    toast.success("Token transfers exported");
                  }}
                >
                  Token transfers
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              window.open(
                `https://explorer.solana.com/tx/${signature}`,
                "_blank"
              )
            }
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Explorer</span>
          </Button>
        </div>
      </div>

      {/* Error state */}
      {analyze.isError && (
        <div className="rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/5 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Couldn&apos;t analyze this transaction
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {(analyze.error as Error)?.message ??
                "Network or RPC error. Try a demo signature instead."}
            </p>
          </div>
        </div>
      )}

      {/* Overview + Stats */}
      <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <OverviewCard report={report} loading={analyze.isPending} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-3"
        >
          <StatsCards report={report} />
          {report && (
            <div className="mt-4">
              <SummaryCard report={report} />
            </div>
          )}
        </motion.div>
      </div>

      {/* Loading state for body */}
      {analyze.isPending && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <p className="text-sm text-muted-foreground">
              Fetching transaction from Solana…
            </p>
          </div>
        </div>
      )}

      {/* Body */}
      {report && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4 sm:space-y-6"
        >
          {report.errors.length > 0 && <ErrorCard report={report} />}

          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            <BalanceChangesCard report={report} />
            <TokenTransferTable report={report} />
          </div>

          <ProgramCallsTable report={report} />
          <InstructionViewer report={report} />
          <LogsViewer report={report} />
        </motion.div>
      )}
    </div>
  );
}
