"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import type { TransactionReport } from "@/lib/solana/types";

interface NetworkStatus {
  ok: boolean;
  slot?: number;
  epoch?: number;
  latencyMs?: number;
  rpc?: string;
  ts?: number;
  error?: string;
}

interface AnalyzeResponse {
  report?: TransactionReport;
  error?: string;
  rpcError?: string;
  fallbackUsed?: boolean;
  demoSignatures?: string[];
}

export function useAnalyzeTransaction() {
  return useMutation<AnalyzeResponse, Error, string>({
    mutationKey: ["analyze-tx"],
    mutationFn: async (signature: string) => {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature }),
      });
      const data = (await res.json()) as AnalyzeResponse;
      if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      return data;
    },
  });
}

export function useNetworkStatus() {
  const query = useQuery<NetworkStatus>({
    queryKey: ["network-status"],
    queryFn: async () => {
      const res = await fetch("/api/network", { cache: "no-store" });
      const data = await res.json();
      return data;
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const status: "online" | "offline" | "checking" = query.isLoading
    ? "checking"
    : query.data?.ok
    ? "online"
    : "offline";

  return {
    status,
    slot: query.data?.slot,
    epoch: query.data?.epoch,
    latencyMs: query.data?.latencyMs,
    refetch: query.refetch,
  };
}
