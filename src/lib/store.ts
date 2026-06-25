"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppView, RecentSearchItem, TransactionReport, WatchedAddress } from "@/lib/solana/types";

interface AppState {
  // Navigation
  view: AppView;
  setView: (view: AppView) => void;
  goToReport: (signature: string) => void;
  goToDashboard: () => void;

  // Last analyzed report (kept in memory for cross-view sharing)
  currentReport: TransactionReport | null;
  setCurrentReport: (r: TransactionReport | null) => void;

  // Recent searches (localStorage-persisted)
  recent: RecentSearchItem[];
  addRecent: (item: RecentSearchItem) => void;
  clearRecent: () => void;

  // Saved reports (localStorage-persisted)
  saved: string[]; // signatures
  toggleSaved: (signature: string) => void;
  isSaved: (signature: string) => boolean;

  // Watched addresses (localStorage-persisted)
  watched: WatchedAddress[];
  addWatched: (address: string, label: string) => void;
  removeWatched: (address: string) => void;
  updateWatchedActivity: (address: string, sig: string, ts: number) => void;

  // Theme (handled by next-themes; we only track sidebar collapsed state)
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Cluster
  cluster: "mainnet-beta" | "devnet" | "testnet";
  setCluster: (c: "mainnet-beta" | "devnet" | "testnet") => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      view: { kind: "dashboard" },
      setView: (view) => set({ view }),
      goToReport: (signature) =>
        set({ view: { kind: "report", signature } }),
      goToDashboard: () => set({ view: { kind: "dashboard" } }),

      currentReport: null,
      setCurrentReport: (r) => set({ currentReport: r }),

      recent: [],
      addRecent: (item) =>
        set((s) => {
          const deduped = s.recent.filter((r) => r.signature !== item.signature);
          return { recent: [item, ...deduped].slice(0, 25) };
        }),
      clearRecent: () => set({ recent: [] }),

      saved: [],
      toggleSaved: (signature) =>
        set((s) => {
          const exists = s.saved.includes(signature);
          return {
            saved: exists
              ? s.saved.filter((s) => s !== signature)
              : [...s.saved, signature],
          };
        }),
      isSaved: (signature) => get().saved.includes(signature),

      watched: [],
      addWatched: (address, label) =>
        set((s) => {
          if (s.watched.some((w) => w.address === address)) return s;
          return {
            watched: [
              ...s.watched,
              {
                address,
                label: label || `${address.slice(0, 4)}…${address.slice(-4)}`,
                addedAt: Date.now(),
              },
            ],
          };
        }),
      removeWatched: (address) =>
        set((s) => ({
          watched: s.watched.filter((w) => w.address !== address),
        })),
      updateWatchedActivity: (address, sig, ts) =>
        set((s) => ({
          watched: s.watched.map((w) =>
            w.address === address
              ? { ...w, lastSignature: sig, lastActivity: ts }
              : w
          ),
        })),

      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      cluster: "mainnet-beta",
      setCluster: (c) => set({ cluster: c }),
    }),
    {
      name: "solana-tx-debugger",
      partialize: (s) => ({
        recent: s.recent,
        saved: s.saved,
        watched: s.watched,
        sidebarCollapsed: s.sidebarCollapsed,
        cluster: s.cluster,
      }),
    }
  )
);
