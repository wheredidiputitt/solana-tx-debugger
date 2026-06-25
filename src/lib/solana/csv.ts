// CSV export utilities — generates CSV strings from TransactionReport data
// and triggers a browser download.

import type { TransactionReport } from "@/lib/solana/types";

function csvEscape(s: string | number | undefined | null): string {
  if (s === null || s === undefined) return "";
  const str = String(s);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportBalanceChangesCsv(report: TransactionReport) {
  const rows: string[][] = [];
  rows.push(["Account", "Change (SOL)", "Change (USD)", "Pre-balance (lamports)", "Post-balance (lamports)"]);
  for (const c of report.balanceChanges) {
    rows.push([
      c.account,
      c.change,
      c.usdValue !== undefined ? c.usdValue.toFixed(4) : "",
      c.preBalance?.toString() ?? "",
      c.postBalance?.toString() ?? "",
    ]);
  }
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const sig = report.signature.slice(0, 12);
  downloadCsv(`solana-balance-${sig}.csv`, csv);
}

export function exportTransfersCsv(report: TransactionReport) {
  const rows: string[][] = [];
  rows.push(["Token", "Amount", "USD Value", "Mint", "From", "To", "Type"]);
  for (const t of report.transfers) {
    rows.push([
      t.token,
      t.amount,
      t.usdValue !== undefined ? t.usdValue.toFixed(4) : "",
      t.mint,
      t.from,
      t.to,
      t.type,
    ]);
  }
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const sig = report.signature.slice(0, 12);
  downloadCsv(`solana-transfers-${sig}.csv`, csv);
}

export function exportFullReportCsv(report: TransactionReport) {
  const rows: string[][] = [];

  // Header section
  rows.push(["SolanaTx Debugger — Full Report"]);
  rows.push([]);
  rows.push(["Signature", report.signature]);
  rows.push(["Status", report.status]);
  rows.push(["Slot", report.slot]);
  rows.push(["Block Time (ISO)", report.blockTimeIso]);
  rows.push(["Fee (SOL)", report.feeSol]);
  rows.push(["Compute Units", report.computeUnits]);
  rows.push(["Compute Budget", report.computeBudget]);
  rows.push(["Signer", report.signer]);
  rows.push(["Cluster", report.cluster]);
  rows.push(["Source", report.source]);
  if (report.solPriceUsd) rows.push(["SOL Price (USD)", report.solPriceUsd.toFixed(2)]);
  if (report.totalUsdValue) rows.push(["Total Transfer USD", report.totalUsdValue.toFixed(2)]);
  rows.push([]);

  // Balance changes
  rows.push(["SOL BALANCE CHANGES"]);
  rows.push(["Account", "Change (SOL)", "Change (USD)", "Pre-balance (lamports)", "Post-balance (lamports)"]);
  for (const c of report.balanceChanges) {
    rows.push([
      c.account,
      c.change,
      c.usdValue !== undefined ? c.usdValue.toFixed(4) : "",
      c.preBalance?.toString() ?? "",
      c.postBalance?.toString() ?? "",
    ]);
  }
  rows.push([]);

  // Transfers
  rows.push(["TOKEN TRANSFERS"]);
  rows.push(["Token", "Amount", "USD Value", "Mint", "From", "To", "Type"]);
  for (const t of report.transfers) {
    rows.push([
      t.token,
      t.amount,
      t.usdValue !== undefined ? t.usdValue.toFixed(4) : "",
      t.mint,
      t.from,
      t.to,
      t.type,
    ]);
  }
  rows.push([]);

  // Programs
  rows.push(["PROGRAMS INVOKED"]);
  rows.push(["Program", "Program ID", "Category", "Invocations"]);
  for (const p of report.programs) {
    rows.push([p.name, p.programId, p.category ?? "", p.invocations.toString()]);
  }
  rows.push([]);

  // Instructions
  rows.push(["INSTRUCTIONS"]);
  rows.push(["#", "Program", "Program ID", "Type", "Description", "Inner Count", "Status"]);
  for (const ix of report.instructions) {
    rows.push([
      ix.index.toString(),
      ix.programName,
      ix.programId,
      ix.type,
      ix.description ?? "",
      ix.inner?.toString() ?? "0",
      ix.status,
    ]);
  }
  rows.push([]);

  // Logs
  rows.push(["EXECUTION LOGS"]);
  for (const log of report.logs) {
    rows.push([log]);
  }

  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const sig = report.signature.slice(0, 12);
  downloadCsv(`solana-full-report-${sig}.csv`, csv);
}
