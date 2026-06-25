"use client";

import { Card } from "@/components/ui/card";
import { Lightbulb, Share2, Search, Zap } from "lucide-react";
import { motion } from "framer-motion";

const TIPS = [
  {
    icon: Share2,
    title: "Shareable reports",
    body: "Every analysis lives at /report/[signature] — share the URL with your team.",
  },
  {
    icon: Search,
    title: "Decode errors instantly",
    body: "Raw 'InstructionError(0, Custom(1))' becomes 'Insufficient funds' in plain English.",
  },
  {
    icon: Zap,
    title: "Compute budget insights",
    body: "See exactly how many compute units a tx consumed vs. the limit you set.",
  },
];

export function QuickTipCard() {
  return (
    <Card className="p-5 sm:p-6 bg-card border-border shadow-sm h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-amber-500" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Quick Tips</h3>
      </div>

      <div className="space-y-4">
        {TIPS.map((tip, i) => {
          const Icon = tip.icon;
          return (
            <motion.div
              key={tip.title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-muted group-hover:bg-accent/10 flex items-center justify-center shrink-0 transition-colors">
                <Icon className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-sm font-medium text-foreground">
                  {tip.title}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tip.body}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
