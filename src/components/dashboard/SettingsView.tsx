"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Trash2, Github, Network } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useNetworkStatus } from "@/lib/hooks";
import { toast } from "sonner";
import { useTheme } from "next-themes";

export function SettingsView() {
  const { recent, clearRecent, saved, cluster, setCluster } = useAppStore();
  const net = useNetworkStatus();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your SolanaTx Debugger experience.
        </p>
      </div>

      {/* Network */}
      <Card className="p-6 bg-card border-border shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Network className="w-5 h-5 text-accent" />
          <h2 className="text-base font-semibold">Network</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div>
              <div className="text-sm font-medium text-foreground">RPC Status</div>
              <div className="text-xs text-muted-foreground">
                {net.status === "online"
                  ? `Connected · ${net.latencyMs}ms · slot #${net.slot?.toLocaleString()}`
                  : net.status === "checking"
                  ? "Checking…"
                  : "Offline — using demo data"}
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                net.status === "online"
                  ? "border-success/30 text-success"
                  : net.status === "offline"
                  ? "border-danger/30 text-danger"
                  : "border-muted-foreground/30 text-muted-foreground"
              }
            >
              {net.status}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div>
              <div className="text-sm font-medium text-foreground">Cluster</div>
              <div className="text-xs text-muted-foreground">
                Which Solana cluster to query
              </div>
            </div>
            <div className="flex gap-1">
              {(["mainnet-beta", "devnet", "testnet"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCluster(c);
                    toast.success(`Switched to ${c}`);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                    cluster === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {c === "mainnet-beta" ? "Mainnet" : c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-6 bg-card border-border shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-accent" />
          <h2 className="text-base font-semibold">Appearance</h2>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
          <div>
            <div className="text-sm font-medium text-foreground">Theme</div>
            <div className="text-xs text-muted-foreground">
              Light or dark mode
            </div>
          </div>
          <div className="flex gap-1">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium capitalize ${
                  theme === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Data */}
      <Card className="p-6 bg-card border-border shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-5 h-5 text-accent" />
          <h2 className="text-base font-semibold">Local Data</h2>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div>
              <div className="text-sm font-medium text-foreground">
                Recent reports
              </div>
              <div className="text-xs text-muted-foreground">
                {recent.length} stored locally
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:text-danger"
              onClick={() => {
                clearRecent();
                toast.success("Recent reports cleared");
              }}
              disabled={recent.length === 0}
            >
              Clear
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div>
              <div className="text-sm font-medium text-foreground">
                Saved reports
              </div>
              <div className="text-xs text-muted-foreground">
                {saved.length} bookmarked
              </div>
            </div>
            <Badge variant="secondary">{saved.length}</Badge>
          </div>
        </div>
      </Card>

      {/* About */}
      <Card className="p-6 bg-card border-border shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Github className="w-5 h-5 text-accent" />
          <h2 className="text-base font-semibold">About</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          SolanaTx Debugger is a developer tool that converts raw Solana
          transaction signatures into clean, human-readable reports. Built with
          Next.js, @solana/web3.js, TanStack Query, Zustand, Tailwind CSS and
          shadcn/ui.
        </p>
        <p className="text-xs text-muted-foreground mt-3">Version 1.0 · MVP</p>
      </Card>
    </div>
  );
}
