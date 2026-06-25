"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { DocsView } from "@/components/dashboard/DocsView";
import { ReportsView } from "@/components/dashboard/ReportsView";
import { SavedView } from "@/components/dashboard/SavedView";
import { SettingsView } from "@/components/dashboard/SettingsView";
import { CompareView } from "@/components/dashboard/CompareView";
import { ReportView } from "@/components/report/ReportView";
import { WatchView } from "@/components/dashboard/WatchView";
import { TransactionInputCard } from "@/components/dashboard/TransactionInputCard";
import { useAppStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";

function SearchParamsReader() {
  const searchParams = useSearchParams();
  const { goToReport } = useAppStore();

  useEffect(() => {
    const sig = searchParams.get("sig");
    if (sig && sig.length >= 16) {
      // Small delay so the page mounts first
      const t = setTimeout(() => goToReport(sig), 100);
      return () => clearTimeout(t);
    }
  }, [searchParams, goToReport]);

  return null;
}

function CurrentView() {
  const { view } = useAppStore();

  switch (view.kind) {
    case "dashboard":
      return <DashboardView />;
    case "analyze":
      return (
        <div className="space-y-6 max-w-3xl">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Analyze Transaction
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Paste a Solana transaction signature to begin.
            </p>
          </div>
          <TransactionInputCard />
        </div>
      );
    case "report":
      return <ReportView signature={view.signature} />;
    case "reports":
      return <ReportsView />;
    case "saved":
      return <SavedView />;
    case "compare":
      return <CompareView />;
    case "watch":
      return <WatchView />;
    case "docs":
      return <DocsView />;
    case "settings":
      return <SettingsView />;
    default:
      return <DashboardView />;
  }
}

export default function Home() {
  const view = useAppStore((s) => s.view);
  // Build a stable key for transitions: kind + signature (for report view)
  const viewKey =
    view.kind === "report" ? `report:${view.signature}` : view.kind;

  return (
    <div className="min-h-screen flex bg-background">
      <Suspense fallback={null}>
        <SearchParamsReader />
      </Suspense>

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={viewKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <CurrentView />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
