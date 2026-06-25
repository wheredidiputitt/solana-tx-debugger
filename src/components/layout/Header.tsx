"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Wifi, WifiOff, Activity, Wallet, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { useNetworkStatus } from "@/lib/hooks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { setView } = useAppStore();
  const { status, latencyMs, slot, epoch } = useNetworkStatus();

  useEffect(() => setMounted(true), []);

  return (
    <header className="h-[72px] border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 gap-4">
      {/* Left: network badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView({ kind: "dashboard" })}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-solana-green opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-solana-green" />
              </span>
              Mainnet Beta
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Network Status
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2 py-2">
              {status === "online" ? (
                <Wifi className="w-4 h-4 text-success" />
              ) : (
                <WifiOff className="w-4 h-4 text-danger" />
              )}
              <span className="text-sm">
                {status === "online" ? "RPC Online" : "RPC Offline (demo mode)"}
              </span>
            </DropdownMenuItem>
            {status === "online" && (
              <>
                <DropdownMenuItem className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                  <Activity className="w-3.5 h-3.5" />
                  Slot #{slot?.toLocaleString()}
                </DropdownMenuItem>
                {epoch !== undefined && (
                  <DropdownMenuItem className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                    Epoch #{epoch.toLocaleString()}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                  Latency: {latencyMs}ms
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs text-muted-foreground"
              onSelect={(e) => e.preventDefault()}
            >
              Using public Solana RPC
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {status === "online" && (
          <Badge
            variant="outline"
            className="hidden sm:inline-flex border-success/30 text-success gap-1.5 font-medium"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            {latencyMs}ms
          </Badge>
        )}
      </div>

      {/* Right: theme toggle + connect */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          className="rounded-full"
        >
          {mounted && theme === "dark" ? (
            <Sun className="w-[18px] h-[18px]" />
          ) : (
            <Moon className="w-[18px] h-[18px]" />
          )}
        </Button>

        <Button
          variant="default"
          className={cn(
            "rounded-full h-9 px-4 text-sm font-medium gap-2",
            "bg-primary hover:bg-primary/90"
          )}
          onClick={() => {
            // Demo: wallet connect not implemented in MVP — show a toast.
            import("sonner").then(({ toast }) =>
              toast.info(
                "Wallet connect is optional in this MVP. Paste any signature to analyze."
              )
            );
          }}
        >
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">Connect Wallet</span>
          <span className="sm:hidden">Connect</span>
        </Button>
      </div>
    </header>
  );
}
