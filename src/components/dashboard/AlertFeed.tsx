import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const severityIcons: Record<string, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🟢",
};

export default function AlertFeed() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: alerts = [] } = useQuery({
    queryKey: ["feed-alerts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      return data || [];
    },
    refetchInterval: 15000,
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <div>
          <span className="eyebrow">Live Alerts</span>
          <h3 className="font-heading text-xl font-medium mt-1 tracking-tight">Latest <span className="italic-display text-primary-deep">signals</span></h3>
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{alerts.length}</span>
      </div>
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {alerts.map((alert, i) => (
          <motion.div key={alert.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.06 }}
            className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
              alert.severity === "critical"
                ? "border-l-2 border-l-destructive bg-destructive/5 border-destructive/30"
                : "border-border bg-secondary/40 hover:bg-secondary"
            }`}
            onClick={() => setExpanded(expanded === alert.id ? null : alert.id)}>
            <div className="flex items-start gap-2">
              <span className="text-sm mt-0.5">{severityIcons[alert.severity] || "🟡"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">{alert.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(alert.created_at).toLocaleString()}
                  {alert.district && ` • 📍 ${alert.district}`}
                </p>
              </div>
            </div>
            <AnimatePresence>
              {expanded === alert.id && alert.message && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <p className="text-xs text-muted-foreground mt-2 pl-6 leading-relaxed">{alert.message}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
