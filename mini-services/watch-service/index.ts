import { createServer } from "http";
import { Server } from "socket.io";
import { Connection, PublicKey } from "@solana/web3.js";

// ============================================================
// SolanaTx Debugger — Watch Address mini-service
// ============================================================
// Watches Solana addresses for new transactions via long-polling
// getSignaturesForAddress, and emits WatchEvent payloads to clients
// subscribed to that address.
// ============================================================

const RPC_URL =
  process.env.SOLANA_RPC_URL ??
  (process.env.HELIUS_API_KEY
    ? `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
    : "https://api.mainnet-beta.solana.com");

const connection = new Connection(RPC_URL, "confirmed");

const httpServer = createServer();
const io = new Server(httpServer, {
  path: "/",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

interface WatchSubscription {
  address: string;
  lastSignature?: string;
  lastSlot?: number;
}

// Map: address -> Set<socketId>
const addressSubs = new Map<string, Set<string>>();
// Map: socketId -> WatchSubscription
const socketSubs = new Map<string, WatchSubscription>();

async function pollAddress(address: string) {
  try {
    const pubkey = new PublicKey(address);
    const sigs = await connection.getSignaturesForAddress(pubkey, {
      limit: 3,
    });
    if (!sigs || sigs.length === 0) return;

    const sub = addressSubs.get(address);
    if (!sub || sub.size === 0) return;

    // Find any sigs newer than the last seen one
    const lastSig = getLastSeenSignature(address);
    let newOnes = sigs;
    if (lastSig) {
      const idx = sigs.findIndex((s) => s.signature === lastSig);
      newOnes = idx >= 0 ? sigs.slice(0, idx) : sigs;
    }

    if (newOnes.length === 0) return;

    // Update last-seen
    setLastSeenSignature(address, newOnes[0].signature);

    // Fetch the tx for the newest one to enrich the event
    for (const sig of newOnes) {
      const event = {
        address,
        signature: sig.signature,
        blockTime: sig.blockTime ?? Math.floor(Date.now() / 1000),
        slot: sig.slot ?? 0,
        memo: sig.memo ?? undefined,
        fee: undefined as number | undefined,
        status: (sig.err ? "failed" : "success") as "success" | "failed",
      };

      // Notify all subscribers of this address
      const subscribers = addressSubs.get(address);
      if (subscribers) {
        for (const socketId of subscribers) {
          io.to(socketId).emit("watch:event", event);
        }
      }
    }
  } catch (err: any) {
    console.error(`[poll] ${address} failed:`, err?.message ?? err);
  }
}

// Last seen signature per address (shared across subscribers)
const lastSeenMap = new Map<string, string>();
function getLastSeenSignature(address: string): string | undefined {
  return lastSeenMap.get(address);
}
function setLastSeenSignature(address: string, sig: string) {
  lastSeenMap.set(address, sig);
}

// Poll every 15 seconds (well within public RPC rate limits)
const POLL_INTERVAL = 15_000;
const polledAddresses = new Set<string>();

function startPolling(address: string) {
  if (polledAddresses.has(address)) return;
  polledAddresses.add(address);
  console.log(`[watch] started polling ${address}`);

  // Immediate first poll
  setTimeout(() => pollAddress(address), 500);

  // Recurring poll
  const handle = setInterval(() => {
    // Only poll if we still have subscribers
    const subs = addressSubs.get(address);
    if (!subs || subs.size === 0) {
      clearInterval(handle);
      polledAddresses.delete(address);
      console.log(`[watch] stopped polling ${address} (no subscribers)`);
      return;
    }
    pollAddress(address);
  }, POLL_INTERVAL);
}

io.on("connection", (socket) => {
  console.log(`[io] connected: ${socket.id}`);

  socket.on("watch:subscribe", (data: { address: string; label?: string }) => {
    const address = String(data.address || "").trim();
    if (!address) {
      socket.emit("watch:error", { error: "Missing address" });
      return;
    }

    try {
      // Validate address
      new PublicKey(address);
    } catch {
      socket.emit("watch:error", {
        error: "Invalid Solana address",
        address,
      });
      return;
    }

    // Unsubscribe from any previous address
    const prevSub = socketSubs.get(socket.id);
    if (prevSub) {
      const subs = addressSubs.get(prevSub.address);
      if (subs) {
        subs.delete(socket.id);
        if (subs.size === 0) addressSubs.delete(prevSub.address);
      }
    }

    // Add new subscription
    if (!addressSubs.has(address)) {
      addressSubs.set(address, new Set());
    }
    addressSubs.get(address)!.add(socket.id);
    socketSubs.set(socket.id, { address });

    socket.emit("watch:subscribed", { address, label: data.label });
    startPolling(address);
    console.log(`[io] ${socket.id} subscribed to ${address}`);
  });

  socket.on("watch:unsubscribe", () => {
    const sub = socketSubs.get(socket.id);
    if (sub) {
      const subs = addressSubs.get(sub.address);
      if (subs) {
        subs.delete(socket.id);
        if (subs.size === 0) addressSubs.delete(sub.address);
      }
      socketSubs.delete(socket.id);
      console.log(`[io] ${socket.id} unsubscribed from ${sub.address}`);
    }
  });

  socket.on("watch:status", () => {
    const sub = socketSubs.get(socket.id);
    socket.emit("watch:status", {
      subscribed: !!sub,
      address: sub?.address,
      lastSignature: sub ? getLastSeenSignature(sub.address) : undefined,
    });
  });

  socket.on("disconnect", () => {
    const sub = socketSubs.get(socket.id);
    if (sub) {
      const subs = addressSubs.get(sub.address);
      if (subs) {
        subs.delete(socket.id);
        if (subs.size === 0) addressSubs.delete(sub.address);
      }
      socketSubs.delete(socket.id);
    }
    console.log(`[io] disconnected: ${socket.id}`);
  });

  socket.on("error", (error) => {
    console.error(`[io] socket error (${socket.id}):`, error);
  });
});

const PORT = 3005;
httpServer.listen(PORT, () => {
  console.log(`[watch-service] listening on port ${PORT}`);
  console.log(`[watch-service] RPC: ${RPC_URL.replace(/api-key=[^&]+/, "api-key=***")}`);
});

process.on("SIGTERM", () => {
  console.log("[watch-service] SIGTERM received");
  httpServer.close(() => process.exit(0));
});
process.on("SIGINT", () => {
  console.log("[watch-service] SIGINT received");
  httpServer.close(() => process.exit(0));
});
