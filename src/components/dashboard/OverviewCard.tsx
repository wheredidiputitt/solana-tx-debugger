"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Hash,
  Clock,
  Coins,
  Cpu,
  UserCircle,
  CheckCircle2,
  XCircle,
  Activity,
  Loader2,
} from "lucide-react";
import type { TransactionReport } from "@/lib/solana/types";
import { shortenAddress } from "@/lib/solana/analyze";
import { cn } from "@/lib/utils";

interface OverviewCardProps {
  report: TransactionReport | null;
  loading?: boolean;
}

const PLACEHOLDER_METRICS = [
  { label: "Signature", icon: Hash },
  { label: "Slot", icon: Activity },
  { label: "Block Time", icon: Clock },
  { label: "Fee Paid", icon: Coins },
  { label: "Compute Units", icon: Cpu },
  { label: "Signer", icon: UserCircle },
];

export function OverviewCard({ report, loading }: OverviewCardProps) {
  const isEmpty = !report && !loading;

  return (
    <Card className="dark-card border-0 text-white p-6 sm:p-7 shadow-xl relative overflow-hidden min-h-[280px]">
      {/* Decorative gradient blobs */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-solana-purple/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-12 w-64 h-64 rounded-full bg-solana-green/10 blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-white">
              Transaction Overview
            </h3>
            <p className="text-xs text-white/60 mt-0.5">
              {report
                ? report.source === "demo"
                  ? "Demo data"
                  : "Live from Solana RPC"
                : "Awaiting input"}
            </p>
          </div>
          {report && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
                report.status === "success"
                  ? "bg-solana-green/20 text-solana-green"
                  : "bg-danger/20 text-danger"
              )}
            >
              {report.status === "success" ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              {report.status === "success" ? "Success" : "Failed"}
            </span>
          )}
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-2 gap-4">
            {PLACEHOLDER_METRICS.map((m) => (
              <div key={m.label} className="space-y-1.5">
                <div className="shimmer h-3 w-16 rounded" />
                <div className="shimmer h-5 w-24 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="grid grid-cols-2 gap-4">
            {PLACEHOLDER_METRICS.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="space-y-1"
                >
                  <div className="flex items-center gap-1.5 text-white/50 text-[11px] uppercase tracking-wide font-medium">
                    <Icon className="w-3 h-3" />
                    {m.label}
                  </div>
                  <div className="text-sm font-mono text-white/30">—</div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Populated */}
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-4"
          >
            <Metric
              icon={Hash}
              label="Signature"
              value={shortenAddress(report.signature, 8, 6)}
              mono
              title={report.signature}
            />
            <Metric
              icon={Activity}
              label="Slot"
              value={report.slot.toLocaleString()}
              mono
            />
            <Metric
              icon={Clock}
              label="Block Time"
              value={
                report.blockTime
                  ? new Date(report.blockTime * 1000).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"
              }
            />
            <Metric
              icon={Coins}
              label="Fee Paid"
              value={`${report.feeSol} SOL`}
              mono
            />
            <Metric
              icon={Cpu}
              label="Compute Units"
              value={
                report.computeUnits > 0
                  ? `${report.computeUnits.toLocaleString()} / ${report.computeBudget.toLocaleString()}`
                  : "—"
              }
              mono
            />
            <Metric
              icon={UserCircle}
              label="Signer"
              value={shortenAddress(report.signer, 6, 4)}
              mono
              title={report.signer}
            />
          </motion.div>
        )}
      </div>
    </Card>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  mono,
  title,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
  title?: string;
}) {
  return (
    <div className="space-y-1" title={title}>
      <div className="flex items-center gap-1.5 text-white/50 text-[11px] uppercase tracking-wide font-medium">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div
        className={cn(
          "text-sm font-semibold text-white truncate",
          mono && "font-mono"
        )}
      >
        {value}
      </div>
    </div>
  );
}
