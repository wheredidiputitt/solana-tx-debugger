"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Blocks, Repeat, Users, Cpu } from "lucide-react";
import type { TransactionReport } from "@/lib/solana/types";

interface StatsCardsProps {
  report: TransactionReport | null;
}

const CARDS = [
  {
    key: "instructions",
    title: "Instructions",
    icon: Blocks,
    gradient: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-400",
  },
  {
    key: "transfers",
    title: "Token Transfers",
    icon: Repeat,
    gradient: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
  },
  {
    key: "accounts",
    title: "Accounts Involved",
    icon: Users,
    gradient: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
  },
  {
    key: "programs",
    title: "Programs Invoked",
    icon: Cpu,
    gradient: "from-rose-500/20 to-rose-500/5",
    iconColor: "text-rose-400",
  },
] as const;

export function StatsCards({ report }: StatsCardsProps) {
  const values: Record<string, number> = {
    instructions: report?.instructions.length ?? 0,
    transfers: report?.transfers.length ?? 0,
    accounts: report?.accountsCount ?? 0,
    programs: report?.programs.length ?? 0,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {CARDS.map((card, i) => {
        const Icon = card.icon;
        const value = values[card.key];
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            whileHover={{ y: -2 }}
          >
            <Card className="relative p-4 sm:p-5 overflow-hidden hover:shadow-md transition-shadow">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} pointer-events-none`}
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {card.title}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-lg bg-card/80 flex items-center justify-center ${card.iconColor}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground tabular-nums">
                  {value.toLocaleString()}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {value === 0
                    ? "No data yet"
                    : value === 1
                    ? "1 item"
                    : `${value} items`}
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
