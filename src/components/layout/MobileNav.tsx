"use client";

import { LayoutDashboard, Search, History, Eye, Settings } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const ITEMS = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard, kind: "dashboard" },
  { id: "analyze", label: "Analyze", icon: Search, kind: "analyze" },
  { id: "reports", label: "Reports", icon: History, kind: "reports" },
  { id: "watch", label: "Watch", icon: Eye, kind: "watch" },
  { id: "settings", label: "Settings", icon: Settings, kind: "settings" },
] as const;

export function MobileNav() {
  const { view, setView } = useAppStore();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border">
      <div className="grid grid-cols-5 h-16">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = view.kind === item.kind;
          return (
            <button
              key={item.id}
              onClick={() => setView({ kind: item.kind } as any)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="mobile-active"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full solana-gradient"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
