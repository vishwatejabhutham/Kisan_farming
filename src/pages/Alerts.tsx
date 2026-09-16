import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Filter, CheckCircle, AlertTriangle, Clock, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/dashboard/Navbar";
import { useEffect } from "react";
import { toast } from "sonner";

const severityConfig = {
  critical: { icon: "🔴", bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive" },
  high: { icon: "🟠", bg: "bg-warning/10", border: "border-warning/30", text: "text-warning" },
  medium: { icon: "🟡", bg: "bg-primary/10", border: "border-primary/30", text: "text-primary" },
  low: { icon: "🟢", bg: "bg-primary/10", border: "border-primary/30", text: "text-primary" },
};

export default function Alerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: dbAlerts = [], isLoading } = useQuery({
    queryKey: ["alerts", filter],
    queryFn: async () => {
      let query = supabase.from("alerts").select("*").order("created_at", { ascending: false });
      if (filter !== "all" && filter !== "unread") {
        query = query.eq("severity", filter as any);
      }
      if (filter === "unread") {
        query = query.eq("is_read", false);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("alerts")
        .update({ is_read: true, acknowledged_by: user?.id })
        .eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alert acknowledged");
    },
  });

  // Realtime subscription — refetch on any alerts change
  useEffect(() => {
    const channel = supabase
      .channel("alerts-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => {
        queryClient.invalidateQueries({ queryKey: ["alerts"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const allAlerts = dbAlerts.map(a => ({
    id: a.id,
    severity: a.severity,
    title: a.title,
    message: a.message,
    district: a.district,
    disease: a.disease,
    is_read: a.is_read,
    timestamp: new Date(a.created_at).toLocaleString(),
    fromDb: true,
  }));

  const filters = ["all", "unread", "critical", "high", "medium", "low"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-[1320px] mx-auto px-4 lg:px-8 py-10 space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Notifications</span>
            <h1 className="text-4xl md:text-5xl font-heading font-medium tracking-tight mt-2">
              Alert <span className="italic-display text-primary-deep">center</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {allAlerts.filter(a => !a.is_read).length} unread alerts
            </p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-destructive/10">
            <Bell className="w-6 h-6 text-destructive" />
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground/70 hover:text-foreground"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Alert List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="glass-card p-8 text-center text-muted-foreground">Loading alerts...</div>
          ) : allAlerts.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">No alerts found</div>
          ) : (
            allAlerts.map((alert, i) => {
              const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.medium;

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`glass-card p-4 border-l-4 ${config.border} ${alert.is_read ? "opacity-60" : ""} cursor-pointer transition-all hover:bg-secondary/30`}
                  onClick={() => setExpanded(expanded === alert.id ? null : alert.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-lg mt-0.5">{config.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${config.bg} ${config.text} uppercase`}>
                            {alert.severity}
                          </span>
                          {alert.district && (
                            <span className="text-xs text-muted-foreground">📍 {alert.district}</span>
                          )}
                          {alert.disease && (
                            <span className="text-xs text-muted-foreground">🦠 {alert.disease}</span>
                          )}
                        </div>
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alert.timestamp}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {alert.fromDb && !alert.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            acknowledgeMutation.mutate(alert.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                          title="Mark as read"
                        >
                          <CheckCircle className="w-4 h-4 text-primary" />
                        </button>
                      )}
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded === alert.id ? "rotate-180" : ""}`} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {expanded === alert.id && alert.message && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs text-muted-foreground mt-3 pl-8 leading-relaxed border-t border-border/30 pt-3">
                          {alert.message}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
