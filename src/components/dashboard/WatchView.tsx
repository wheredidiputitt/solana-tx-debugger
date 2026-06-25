"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Trash2,
  Bell,
  BellRing,
  Activity,
  Inbox,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { WatchEvent } from "@/lib/solana/types";
import { shortenAddress } from "@/lib/solana/analyze";
import { cn } from "@/lib/utils";
import { getWatchClient } from "@/lib/watch-client";

export function WatchView() {
  const {
    watched,
    addWatched,
    removeWatched,
    updateWatchedActivity,
    goToReport,
  } = useAppStore();

  const [addrInput, setAddrInput] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [events, setEvents] = useState<Record<string, WatchEvent[]>>({});
  const clientRef = useRef(getWatchClient());
  const client = clientRef.current;

  // Subscribe to connection state via useSyncExternalStore (stable across remounts)
  const connectionState = useSyncExternalStore(
    (cb) => client.subscribe(cb),
    () => client.getState(),
    () => "disconnected" as const
  );
  const connected = connectionState === "connected";

  // Connect on mount + subscribe to events
  useEffect(() => {
    client.connect();

    const offSubscribed = client.onSubscribed((address) => {
      toast.success(`Watching ${shortenAddress(address, 6, 4)}`);
    });
    const offError = client.onError((error, address) => {
      toast.error(`${error}${address ? `: ${shortenAddress(address, 4, 4)}` : ""}`);
    });
    const offEvent = client.onEvent((event) => {
      setEvents((prev) => {
        const list = prev[event.address] ?? [];
        const next = [event, ...list].slice(0, 50);
        return { ...prev, [event.address]: next };
      });
      updateWatchedActivity(event.address, event.signature, event.blockTime);

      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          new Notification("New Solana transaction", {
            body: `${shortenAddress(event.address, 4, 4)} — ${shortenAddress(event.signature, 8, 6)}`,
          });
        } catch {
          /* ignore */
        }
      }
    });

    // Initial subscribe to any existing watched addresses (from localStorage)
    for (const w of watched) {
      client.watchAddress(w.address, w.label);
    }

    return () => {
      offSubscribed();
      offError();
      offEvent();
      // Note: we don't disconnect — the singleton survives component unmount
    };
  }, []);

  const handleAdd = () => {
    const addr = addrInput.trim();
    if (!addr) {
      toast.error("Enter a Solana address");
      return;
    }
    if (addr.length < 32) {
      toast.error("That address looks too short");
      return;
    }
    if (watched.some((w) => w.address === addr)) {
      toast.warning("Already watching this address");
      return;
    }
    addWatched(addr, labelInput.trim());
    client.watchAddress(addr, labelInput.trim());
    setAddrInput("");
    setLabelInput("");

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  };

  const handleRemove = (address: string) => {
    removeWatched(address);
    client.unwatchAddress(address);
    setEvents((prev) => {
      const next = { ...prev };
      delete next[address];
      return next;
    });
    toast.success("Removed from watch list");
  };

  const totalEvents = Object.values(events).reduce((sum, e) => sum + e.length, 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Eye className="w-6 h-6 text-accent" />
          Watch Addresses
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Get notified when a Solana wallet sends or receives a transaction.
          Live polling via WebSocket.
        </p>
      </div>

      {/* Connection status */}
      <div className="flex items-center gap-2 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium",
            connected
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
              : connectionState === "connecting"
              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
              : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              connected
                ? "bg-emerald-500 animate-pulse"
                : connectionState === "connecting"
                ? "bg-amber-500 animate-pulse"
                : "bg-rose-500"
            )}
          />
          {connected
            ? "WebSocket connected"
            : connectionState === "connecting"
            ? "Connecting…"
            : "Disconnected"}
        </span>
        {totalEvents > 0 && (
          <Badge variant="secondary" className="text-[10px] gap-1">
            <BellRing className="w-3 h-3" />
            {totalEvents} new event{totalEvents === 1 ? "" : "s"}
          </Badge>
        )}
      </div>

      {/* Add new watch */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold">Add a wallet to watch</h3>
          </div>
          <div className="grid sm:grid-cols-[1fr_auto_1fr_auto] gap-2">
            <Input
              value={addrInput}
              onChange={(e) => setAddrInput(e.target.value)}
              placeholder="Wallet address (e.g. 9aF2Qx…)"
              className="font-mono text-sm h-10"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Input
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="Label (optional)"
              className="text-sm h-10 sm:max-w-[180px]"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button
              onClick={handleAdd}
              disabled={!addrInput.trim() || !connected}
              className="h-10 solana-gradient text-white border-0"
            >
              <Eye className="w-4 h-4 mr-1.5" />
              Watch
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Polls Solana RPC every 15 seconds for new signatures on the watched
            address. Notifications appear here + in your browser.
          </p>
        </div>
      </Card>

      {/* Watched list */}
      {watched.length === 0 ? (
        <Card className="p-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Inbox className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No addresses watched</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Add a Solana wallet above to start receiving notifications when it
            sends or receives transactions.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {watched.map((w) => {
            const evs = events[w.address] ?? [];
            return (
              <Card
                key={w.address}
                className="p-4 sm:p-5 bg-card border-border shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                        evs.length > 0 ? "bg-accent/15" : "bg-muted"
                      )}
                    >
                      {evs.length > 0 ? (
                        <BellRing className="w-4 h-4 text-accent" />
                      ) : (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          {w.label}
                        </span>
                        {evs.length > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-accent/30 text-accent"
                          >
                            {evs.length} new
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
                        {shortenAddress(w.address, 10, 8)}
                      </div>
                      {w.lastActivity && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Last activity:{" "}
                          {new Date(w.lastActivity * 1000).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:text-danger shrink-0"
                    onClick={() => handleRemove(w.address)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {evs.length > 0 ? (
                  <div className="space-y-1.5 mt-3 border-t border-border/60 pt-3">
                    <AnimatePresence>
                      {evs.slice(0, 8).map((ev, i) => (
                        <motion.button
                          key={ev.signature + i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          onClick={() => goToReport(ev.signature)}
                          className="w-full flex items-center justify-between gap-3 p-2.5 rounded-md bg-muted/40 hover:bg-muted transition-colors text-left group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Activity
                              className={cn(
                                "w-3.5 h-3.5 shrink-0",
                                ev.status === "success"
                                  ? "text-emerald-500"
                                  : "text-rose-500"
                              )}
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-mono text-foreground truncate">
                                {shortenAddress(ev.signature, 12, 8)}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {new Date(ev.blockTime * 1000).toLocaleString()}
                                {ev.memo && ` · ${ev.memo.slice(0, 40)}`}
                              </div>
                            </div>
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent shrink-0" />
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="mt-3 border-t border-border/60 pt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Watching for new transactions…
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
