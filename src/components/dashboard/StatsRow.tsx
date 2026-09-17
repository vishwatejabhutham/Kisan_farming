import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchFromBackend } from "@/lib/api";

function useCounter(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

type Stat = { label: string; value: number; textValue?: string; suffix?: string; prefix?: string; trend: number; trendDir: "up"; trendLabel?: string; isWarning?: boolean; isAlert?: boolean };

function StatCard({ stat, index }: { stat: Stat; index: number }) {
  const count = useCounter(stat.value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08, duration: 0.5 }}
      className={`glass-card-hover p-6 flex flex-col gap-2 ${stat.isAlert ? "border-destructive/40" : ""}`}
    >
      <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.12em]">{stat.label}</span>
      <div className="flex items-end gap-2">
        {stat.textValue ? (
          <span className="text-3xl font-heading font-medium text-destructive italic-display">{stat.textValue}</span>
        ) : (
          <span className={`text-4xl font-heading font-medium tracking-tight ${stat.isWarning ? "text-warning" : "text-foreground"}`}>
            {stat.prefix}{count.toLocaleString()}{stat.suffix}
          </span>
        )}
      </div>
      {stat.trend > 0 && !stat.isAlert && (
        <div className={`flex items-center gap-1 text-xs ${stat.isWarning ? "text-warning" : "text-primary-deep"}`}>
          {stat.isWarning ? <AlertTriangle className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
          <span>↑ {stat.trend}{stat.trendLabel ? ` ${stat.trendLabel}` : "%"}</span>
        </div>
      )}
      {stat.isAlert && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertTriangle className="w-3 h-3" /><span>Critical outbreak zone</span>
        </div>
      )}
    </motion.div>
  );
}

export default function StatsRow() {
  const { data: reports = [] } = useQuery({
    queryKey: ["stats-reports"],
    queryFn: async () => {
      const data = await fetchFromBackend("/disease-reports");
      return data || [];
    },
    refetchInterval: 30000,
  });

  const { data: alertCount = 0 } = useQuery({
    queryKey: ["stats-alerts"],
    queryFn: async () => {
      const count = await fetchFromBackend("/alerts/unread-count");
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const totalCases = reports.reduce((s, r) => s + r.cases, 0);
  const uniqueDistricts = new Set(reports.map(r => r.district)).size;
  const topDistrict = Object.entries(
    reports.reduce<Record<string, number>>((acc, r) => { acc[r.district] = (acc[r.district] || 0) + r.cases; return acc; }, {})
  ).sort((a, b) => b[1] - a[1])[0];

  const heroStats: Stat[] = [
    { label: "Total Disease Cases", value: totalCases, prefix: "", suffix: "", trend: 23, trendDir: "up" },
    { label: "Active Alerts", value: alertCount, prefix: "", suffix: "", trend: alertCount, trendDir: "up", trendLabel: "unread" },
    { label: "Districts Affected", value: uniqueDistricts, prefix: "", suffix: " / 33", trend: 0, trendDir: "up", isWarning: true },
    { label: "Highest Risk Zone", value: 0, prefix: "", suffix: "", trend: 0, trendDir: "up", textValue: topDistrict?.[0] || "—", isAlert: true },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {heroStats.map((stat, i) => <StatCard key={stat.label} stat={stat} index={i} />)}
    </div>
  );
}
