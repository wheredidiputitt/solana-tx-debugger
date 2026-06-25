"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, GitCompare } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAnalyzeTransaction } from "@/lib/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import type { TransactionReport } from "@/lib/solana/types";
import { shortenAddress } from "@/lib/solana/analyze";

export function CompareView() {
  const { goToReport } = useAppStore();
  const analyze = useAnalyzeTransaction();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [reports, setReports] = useState<{
    a?: TransactionReport;
    b?: TransactionReport;
  }>({});
  const [loading, setLoading] = useState<"a" | "b" | null>(null);

  const fetchOne = async (sig: string, key: "a" | "b") => {
    if (!sig.trim()) return;
    setLoading(key);
    try {
      const r = await analyze.mutateAsync(sig.trim());
      if (r?.report) {
        setReports((p) => ({ ...p, [key]: r.report }));
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setLoading(null);
    }
  };

  const Cell = ({
    label,
    sig,
    setSig,
    report,
    which,
  }: {
    label: string;
    sig: string;
    setSig: (s: string) => void;
    report?: TransactionReport;
    which: "a" | "b";
  }) => (
    <Card className="p-5 bg-card border-border shadow-sm flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md solana-gradient text-white text-xs font-bold flex items-center justify-center">
          {label}
        </div>
        <span className="text-sm font-semibold text-foreground">
          Transaction {label}
        </span>
      </div>

      <div className="flex gap-2 mb-3">
        <Input
          value={sig}
          onChange={(e) => setSig(e.target.value)}
          placeholder="Paste signature…"
          className="h-9 font-mono text-xs"
          onKeyDown={(e) => e.key === "Enter" && fetchOne(sig, which)}
        />
        <Button
          size="sm"
          className="h-9 solana-gradient text-white border-0"
          onClick={() => fetchOne(sig, which)}
          disabled={loading === which || !sig.trim()}
        >
          {loading === which ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>

      {report ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2 text-xs"
        >
          <Row label="Status">
            <span
              className={
                report.status === "success" ? "text-success" : "text-danger"
              }
            >
              {report.status}
            </span>
          </Row>
          <Row label="Signer">{shortenAddress(report.signer, 6, 4)}</Row>
          <Row label="Fee">{report.feeSol} SOL</Row>
          <Row label="Compute">
            {report.computeUnits.toLocaleString()} CU
          </Row>
          <Row label="Instructions">{report.instructions.length}</Row>
          <Row label="Transfers">{report.transfers.length}</Row>
          <Row label="Programs">{report.programs.length}</Row>
          <Row label="Accounts">{report.accountsCount}</Row>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 text-xs"
            onClick={() => goToReport(report.signature)}
          >
            Open full report
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </motion.div>
      ) : (
        <div className="text-center py-8 text-xs text-muted-foreground">
          Paste a signature and click search to compare.
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <GitCompare className="w-6 h-6 text-accent" />
          Compare Transactions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Side-by-side comparison of two Solana transactions.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Cell label="A" sig={a} setSig={setA} report={reports.a} which="a" />
        <Cell label="B" sig={b} setSig={setB} report={reports.b} which="b" />
      </div>

      {reports.a && reports.b && (
        <Card className="p-5 bg-card border-border shadow-sm">
          <h3 className="text-sm font-semibold mb-3">Differences</h3>
          <div className="space-y-1.5 text-xs">
            <DiffRow
              label="Fee"
              a={reports.a.feeSol}
              b={reports.b.feeSol}
              unit="SOL"
            />
            <DiffRow
              label="Compute units"
              a={String(reports.a.computeUnits)}
              b={String(reports.b.computeUnits)}
            />
            <DiffRow
              label="Instructions"
              a={String(reports.a.instructions.length)}
              b={String(reports.b.instructions.length)}
            />
            <DiffRow
              label="Programs"
              a={String(reports.a.programs.length)}
              b={String(reports.b.programs.length)}
            />
          </div>
        </Card>
      )}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground text-right truncate max-w-[60%]">
        {children}
      </span>
    </div>
  );
}

function DiffRow({
  label,
  a,
  b,
  unit,
}: {
  label: string;
  a: string;
  b: string;
  unit?: string;
}) {
  const na = parseFloat(a.replace(/[^0-9.\-]/g, "")) || 0;
  const nb = parseFloat(b.replace(/[^0-9.\-]/g, "")) || 0;
  const delta = nb - na;
  const pct = na ? ((delta / na) * 100).toFixed(1) : "—";
  const positive = delta > 0;
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3 font-mono">
        <span className="text-foreground">{a}{unit ? ` ${unit}` : ""}</span>
        <span className="text-muted-foreground">→</span>
        <span className="text-foreground">{b}{unit ? ` ${unit}` : ""}</span>
        <span
          className={
            positive ? "text-success" : delta < 0 ? "text-danger" : "text-muted-foreground"
          }
        >
          ({pct}%)
        </span>
      </div>
    </div>
  );
}
