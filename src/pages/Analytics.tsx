import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Activity, Shield, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/dashboard/Navbar";

const COLORS = ["#5fa848", "#3a7ca5", "#ea7c1e", "#dc2626", "#7c5cd6", "#a98c4f"];

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #e5e2db",
  borderRadius: 10,
  fontSize: 12,
  color: "#1c2c1f",
  boxShadow: "0 8px 24px rgba(20,30,15,0.08)",
};

export default function Analytics() {
  const [activeMetric, setActiveMetric] = useState<"cases" | "scans" | "risk">("cases");

  // Fetch disease reports
  const { data: reports = [] } = useQuery({
    queryKey: ["db-reports"],
    queryFn: async () => {
      const { data } = await supabase.from("disease_reports").select("*");
      return data || [];
    },
  });

  // Fetch analytics snapshots
  const { data: snapshots = [] } = useQuery({
    queryKey: ["db-snapshots"],
    queryFn: async () => {
      const { data } = await supabase
        .from("analytics_snapshots")
        .select("*")
        .order("date", { ascending: true });
      return data || [];
    },
  });

  // Compute metrics from DB data
  const totalCases = useMemo(() => reports.reduce((s, r) => s + r.cases, 0), [reports]);
  const avgRisk = useMemo(() => {
    const scores = snapshots.filter(s => s.risk_score != null);
    return scores.length ? (scores.reduce((s, r) => s + (r.risk_score || 0), 0) / scores.length).toFixed(1) : "0";
  }, [snapshots]);

  const metrics = [
    { key: "cases", label: "Disease Cases", value: totalCases.toLocaleString(), trend: "+23%", icon: Activity, up: true },
    { key: "scans", label: "Total Reports", value: reports.length.toString(), trend: `${reports.length}`, icon: BarChart3, up: true },
    { key: "risk", label: "Avg Risk Score", value: avgRisk, trend: "+4.2", icon: Shield, up: true },
  ];

  // Predictive trend from snapshots (Warangal Late Blight as primary)
  const trendChartData = useMemo(() => {
    const warangal = snapshots.filter(s => s.district === "Warangal" && s.disease === "Late Blight");
    const karimnagar = snapshots.filter(s => s.district === "Karimnagar" && s.disease === "Leaf Curl");
    const khammam = snapshots.filter(s => s.district === "Khammam");

    const allDates = [...new Set(snapshots.map(s => s.date))].sort();
    return allDates.map(date => {
      const w = warangal.find(s => s.date === date);
      const k = karimnagar.find(s => s.date === date);
      const kh = khammam.find(s => s.date === date);
      const isForecast = w ? w.total_cases == null : false;
      return {
        day: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        actual: w?.total_cases ?? undefined,
        predicted: w?.predicted_cases ?? undefined,
        upper: w?.predicted_cases ? (w.predicted_cases + 20) : undefined,
        leafCurl: k?.total_cases ?? k?.predicted_cases ?? undefined,
        whitefly: kh?.total_cases ?? kh?.predicted_cases ?? undefined,
      };
    });
  }, [snapshots]);

  // Risk scores by district
  const riskScores = useMemo(() => {
    const latest: Record<string, { score: number; prev: number }> = {};
    const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
    sorted.forEach(s => {
      if (!latest[s.district]) latest[s.district] = { score: 0, prev: 0 };
      latest[s.district].prev = latest[s.district].score;
      latest[s.district].score = s.risk_score || 0;
    });
    return Object.entries(latest)
      .map(([district, { score, prev }]) => ({ district, score, change: Math.round(score - prev) }))
      .sort((a, b) => b.score - a.score);
  }, [snapshots]);

  // Disease distribution from reports
  const diseaseDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => { counts[r.disease] = (counts[r.disease] || 0) + r.cases; });
    return Object.entries(counts)
      .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [reports]);

  // Cases by district
  const districtBarData = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => { counts[r.district] = (counts[r.district] || 0) + r.cases; });
    return Object.entries(counts)
      .map(([name, cases]) => ({ name: name.substring(0, 8), cases }))
      .sort((a, b) => b.cases - a.cases);
  }, [reports]);

  // Weekly from snapshots
  const weeklyData = useMemo(() => {
    const byWeek: Record<string, { newCases: number; districts: Set<string> }> = {};
    snapshots.filter(s => s.new_cases != null).forEach(s => {
      const d = new Date(s.date);
      const weekNum = `W${Math.ceil(d.getDate() / 7)}`;
      if (!byWeek[weekNum]) byWeek[weekNum] = { newCases: 0, districts: new Set() };
      byWeek[weekNum].newCases += s.new_cases || 0;
      byWeek[weekNum].districts.add(s.district);
    });
    return Object.entries(byWeek).map(([week, d]) => ({
      week,
      newCases: d.newCases,
      districts: d.districts.size,
    }));
  }, [snapshots]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-[1320px] mx-auto px-4 lg:px-8 py-10 space-y-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="eyebrow">Intelligence</span>
          <h1 className="text-4xl md:text-5xl font-heading font-medium tracking-tight mt-2">
            Analytics & <span className="italic-display text-primary-deep">insight</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {reports.length} reports • {snapshots.length} data points • Real-time + Predictive
          </p>
        </motion.div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          {metrics.map((m, i) => (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setActiveMetric(m.key as any)}
              className={`glass-card-hover p-6 cursor-pointer ${activeMetric === m.key ? "border-primary/50 glow-green" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground uppercase tracking-[0.12em]">{m.label}</span>
                <m.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-4xl font-heading font-medium tracking-tight">{m.value}</span>
            </motion.div>
          ))}
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-5 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="col-span-3 glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="eyebrow">Forecast</span>
                <h3 className="font-heading text-2xl font-medium mt-1 tracking-tight">Disease Trend <span className="italic-display text-primary-deep">actual vs predicted</span></h3>
                <p className="text-xs text-muted-foreground mt-1">Warangal Late Blight with confidence band</p>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-accent text-accent-foreground">DB-DRIVEN</span>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={trendChartData}>
                <defs>
                  <linearGradient id="cActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5fa848" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#5fa848" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c5cd6" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#7c5cd6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,30,15,0.06)" />
                <XAxis dataKey="day" tick={{ fill: "#6b7568", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6b7568", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="upper" stroke="none" fill="url(#cBand)" name="Upper Bound" />
                <Area type="monotone" dataKey="actual" stroke="#5fa848" fill="url(#cActual)" strokeWidth={2} name="Actual Cases" />
                <Line type="monotone" dataKey="predicted" stroke="#7c5cd6" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Predicted" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="col-span-2 glass-card p-6">
            <span className="eyebrow">Risk</span>
            <h3 className="font-heading text-2xl font-medium mt-1 mb-4 tracking-tight">District <span className="italic-display text-primary-deep">scores</span></h3>
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {riskScores.map((d, i) => (
                <motion.div key={d.district} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }} className="flex items-center gap-3">
                  <span className="text-xs text-foreground/80 w-20 truncate">{d.district}</span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${d.score}%`, background: d.score > 70 ? "#dc2626" : d.score > 50 ? "#ea7c1e" : "#5fa848" }} />
                  </div>
                  <span className="text-sm font-mono font-bold w-8 text-right">{d.score}</span>
                  <span className={`text-[10px] w-10 text-right ${d.change > 0 ? "text-destructive" : "text-primary-deep"}`}>{d.change > 0 ? "+" : ""}{d.change}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
            <span className="eyebrow">Weekly</span>
            <h3 className="font-heading text-xl font-medium mt-1 mb-4 tracking-tight">New <span className="italic-display text-primary-deep">cases</span></h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,30,15,0.06)" />
                <XAxis dataKey="week" tick={{ fill: "#6b7568", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6b7568", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="newCases" fill="#3a7ca5" radius={[6, 6, 0, 0]} name="New Cases" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-6">
            <span className="eyebrow">Distribution</span>
            <h3 className="font-heading text-xl font-medium mt-1 mb-4 tracking-tight">Disease <span className="italic-display text-primary-deep">share</span></h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={diseaseDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {diseaseDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend formatter={(v: string) => <span className="text-xs text-muted-foreground">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
            <span className="eyebrow">By District</span>
            <h3 className="font-heading text-xl font-medium mt-1 mb-4 tracking-tight">Cases <span className="italic-display text-primary-deep">distribution</span></h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={districtBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,30,15,0.06)" />
                <XAxis type="number" tick={{ fill: "#6b7568", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#6b7568", fontSize: 10 }} width={60} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="cases" fill="#3a7ca5" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
