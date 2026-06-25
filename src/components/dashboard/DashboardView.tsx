"use client";

import { useAppStore } from "@/lib/store";
import { useNetworkStatus } from "@/lib/hooks";
import { TransactionInputCard } from "@/components/dashboard/TransactionInputCard";
import { OverviewCard } from "@/components/dashboard/OverviewCard";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentTransactionsTable } from "@/components/dashboard/RecentTransactionsTable";
import { QuickTipCard } from "@/components/dashboard/QuickTipCard";
import { motion } from "framer-motion";

export function DashboardView() {
  const { currentReport } = useAppStore();
  useNetworkStatus(); // warm up

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl sm:text-2xl font-bold text-foreground"
        >
          Dashboard
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-sm text-muted-foreground mt-1"
        >
          Decode any Solana transaction into a clean, human-readable report.
        </motion.p>
      </div>

      {/* Hero split: input + overview */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <TransactionInputCard />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
        >
          <OverviewCard report={currentReport} />
        </motion.div>
      </div>

      {/* Stats */}
      {currentReport && <StatsCards report={currentReport} />}

      {/* Recent + Tips */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <RecentTransactionsTable />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <QuickTipCard />
        </motion.div>
      </div>
    </div>
  );
}
