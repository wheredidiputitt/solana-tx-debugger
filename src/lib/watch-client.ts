// Singleton WebSocket client for the watch service.
// Lives outside React so it survives component remounts.

import { io, Socket } from "socket.io-client";
import type { WatchEvent } from "@/lib/solana/types";

const WATCH_PORT = 3005;

type ConnectionState = "disconnected" | "connecting" | "connected";
type Listener = () => void;
type EventListener = (event: WatchEvent) => void;
type SubscribedListener = (address: string) => void;
type ErrorListener = (error: string, address?: string) => void;

function getSocketUrl(): string {
  if (typeof window === "undefined") return "";
  const { protocol, hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}//${hostname}:81`;
  }
  return "";
}

class WatchSocketClient {
  private socket: Socket | null = null;
  private state: ConnectionState = "disconnected";
  private listeners = new Set<Listener>();
  private eventListeners = new Set<EventListener>();
  private subscribedListeners = new Set<SubscribedListener>();
  private errorListeners = new Set<ErrorListener>();
  private subscriptions = new Set<string>(); // addresses we want to watch
  private connecting = false;

  getState(): ConnectionState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onEvent(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  onSubscribed(listener: SubscribedListener): () => void {
    this.subscribedListeners.add(listener);
    return () => this.subscribedListeners.delete(listener);
  }

  onError(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  private notify() {
    for (const l of this.listeners) l();
  }

  private setState(s: ConnectionState) {
    if (this.state === s) return;
    this.state = s;
    this.notify();
  }

  connect() {
    if (this.socket || this.connecting) return;
    this.connecting = true;
    this.setState("connecting");

    const socket = io(`${getSocketUrl()}/?XTransformPort=${WATCH_PORT}`, {
      transports: ["polling", "websocket"],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
      timeout: 10_000,
    });
    this.socket = socket;

    socket.on("connect", () => {
      this.connecting = false;
      this.setState("connected");
      // Re-subscribe to all known addresses
      for (const addr of this.subscriptions) {
        socket.emit("watch:subscribe", { address: addr });
      }
    });

    socket.on("disconnect", () => {
      this.setState("connecting"); // will auto-reconnect
    });

    socket.on("connect_error", () => {
      this.connecting = false;
      this.setState("disconnected");
    });

    socket.on("watch:subscribed", ({ address }: { address: string }) => {
      for (const l of this.subscribedListeners) l(address);
    });

    socket.on("watch:error", ({ error, address }: { error: string; address?: string }) => {
      for (const l of this.errorListeners) l(error, address);
    });

    socket.on("watch:event", (event: WatchEvent) => {
      for (const l of this.eventListeners) l(event);
    });
  }

  watchAddress(address: string, label?: string) {
    this.subscriptions.add(address);
    if (this.socket && this.socket.connected) {
      this.socket.emit("watch:subscribe", { address, label });
    }
    // If not yet connected, the connect handler will subscribe
    if (!this.socket) this.connect();
  }

  unwatchAddress(address: string) {
    this.subscriptions.delete(address);
    // The server stops polling when no subscribers remain
    if (this.socket && this.socket.connected) {
      this.socket.emit("watch:unsubscribe", { address });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connecting = false;
    this.setState("disconnected");
  }
}

// Singleton
let _instance: WatchSocketClient | null = null;
export function getWatchClient(): WatchSocketClient {
  if (!_instance) _instance = new WatchSocketClient();
  return _instance;
}
