import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

const C_GREEN = "#5fa848";
const C_BLUE = "#3a7ca5";
const C_AMBER = "#ea7c1e";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  
  // Deduplicate for boundary points where both hist and fcst exist
  const uniquePayload = payload.filter((p: any, index: number, self: any) =>
    index === self.findIndex((t: any) => t.name.replace(" (Forecast)", "") === p.name.replace(" (Forecast)", ""))
  );

  return (
    <div className="glass-card p-3 text-xs min-w-[150px]">
      <p className="font-heading font-semibold text-sm mb-1.5">{label}</p>
      {uniquePayload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span className="text-muted-foreground">{p.name}</span>
          <span style={{ color: p.color }} className="font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function TrendChart() {
  const { data: snapshots = [] } = useQuery({
    queryKey: ["trend-snapshots"],
    queryFn: async () => {
      const { data } = await supabase
        .from("analytics_snapshots")
        .select("*")
        .order("date", { ascending: true });
      return data || [];
    },
    refetchInterval: 30000,
  });

  const allDates = [...new Set(snapshots.map(s => s.date))].sort();
  const today = new Date().toISOString().split("T")[0];

  const trendData = allDates.map(date => {
    const daySnapshots = snapshots.filter(s => s.date === date);
    const lateBlight = daySnapshots.find(s => s.disease === "Late Blight");
    const leafCurl = daySnapshots.find(s => s.disease === "Leaf Curl");
    const stemRot = daySnapshots.find(s => s.disease === "Stem Rot");
    const label = new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const isToday = date === today;
    
    const lb = lateBlight?.total_cases ?? lateBlight?.predicted_cases ?? 0;
    const lc = leafCurl?.total_cases ?? leafCurl?.predicted_cases ?? 0;
    const sr = stemRot?.total_cases ?? stemRot?.predicted_cases ?? 0;

    const isPast = date <= today;
    const isFuture = date >= today;

    return {
      day: isToday ? "Today" : label,
      isForecast: !isPast,
      
      lb_hist: isPast ? lb : null,
      lb_fcst: isFuture ? lb : null,
      
      lc_hist: isPast ? lc : null,
      lc_fcst: isFuture ? lc : null,
      
      sr_hist: isPast ? sr : null,
      sr_fcst: isFuture ? sr : null,
    };
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="eyebrow">Trends</span>
          <h3 className="font-heading text-2xl font-medium mt-1 tracking-tight">
            Disease Trend <span className="italic-display text-primary-deep">real-time</span>
          </h3>
        </div>
        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-accent text-accent-foreground">DB-Driven</span>
      </div>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C_GREEN} stopOpacity={0.35} />
                <stop offset="100%" stopColor={C_GREEN} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C_BLUE} stopOpacity={0.25} />
                <stop offset="100%" stopColor={C_BLUE} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C_AMBER} stopOpacity={0.25} />
                <stop offset="100%" stopColor={C_AMBER} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,30,15,0.06)" />
            <XAxis dataKey="day" tick={{ fill: "#6b7568", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#6b7568", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x="Today" stroke="rgba(20,30,15,0.25)" strokeDasharray="4 4" label={{ value: "Today", fill: "#6b7568", fontSize: 11, position: "top" }} />
            <Area type="monotone" dataKey="lb_hist" name="Late Blight" stroke={C_GREEN} fill="url(#greenGrad)" strokeWidth={2} dot={false} connectNulls />
            <Area type="monotone" dataKey="lb_fcst" name="Late Blight (Forecast)" stroke={C_GREEN} fill="none" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
            
            <Area type="monotone" dataKey="lc_hist" name="Leaf Curl" stroke={C_BLUE} fill="url(#blueGrad)" strokeWidth={2} dot={false} connectNulls />
            <Area type="monotone" dataKey="lc_fcst" name="Leaf Curl (Forecast)" stroke={C_BLUE} fill="none" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
            
            <Area type="monotone" dataKey="sr_hist" name="Stem Rot" stroke={C_AMBER} fill="url(#amberGrad)" strokeWidth={2} dot={false} connectNulls />
            <Area type="monotone" dataKey="sr_fcst" name="Stem Rot (Forecast)" stroke={C_AMBER} fill="none" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-5 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded" style={{ background: C_GREEN }} />Late Blight</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded" style={{ background: C_BLUE }} />Leaf Curl</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded" style={{ background: C_AMBER }} />Stem Rot</div>
        <div className="ml-auto text-[10px]">Auto-refresh 30s</div>
      </div>
    </motion.div>
  );
}
