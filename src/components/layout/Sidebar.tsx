"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Search,
  History,
  GitCompare,
  Bookmark,
  Eye,
  FileText,
  Settings,
  ChevronLeft,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, kind: "dashboard" },
  { id: "analyze", label: "Analyze", icon: Search, kind: "analyze" },
  { id: "reports", label: "Recent Reports", icon: History, kind: "reports" },
  { id: "compare", label: "Compare", icon: GitCompare, kind: "compare" },
  { id: "saved", label: "Saved", icon: Bookmark, kind: "saved" },
  { id: "watch", label: "Watch", icon: Eye, kind: "watch" },
  { id: "docs", label: "Docs", icon: FileText, kind: "docs" },
  { id: "settings", label: "Settings", icon: Settings, kind: "settings" },
] as const;

export function Sidebar() {
  const { view, setView, sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300 sticky top-0 h-screen z-30",
        sidebarCollapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Brand */}
      <div className="h-[72px] flex items-center px-4 border-b border-border">
        <Link
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setView({ kind: "dashboard" });
          }}
          className="flex items-center gap-2.5 group"
        >
          <div className="relative w-9 h-9 rounded-xl solana-gradient flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <div className="font-bold text-[15px] leading-tight text-foreground">
                  SolanaTx
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Debugger
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scroll-area-thin">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = view.kind === item.kind;
          return (
            <button
              key={item.id}
              onClick={() => setView({ kind: item.kind } as any)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={item.label}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && !sidebarCollapsed && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full solana-gradient"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-border">
        <button
          onClick={toggleSidebar}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            sidebarCollapsed && "px-0"
          )}
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 transition-transform",
              sidebarCollapsed && "rotate-180"
            )}
          />
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
