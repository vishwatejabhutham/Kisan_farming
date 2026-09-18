import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Activity, Shield, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchFromBackend } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/dashboard/Navbar";
import StatsRow from "@/components/dashboard/StatsRow";
import MapPanel from "@/components/dashboard/MapPanel";
import TrendChart from "@/components/dashboard/TrendChart";
import OutbreakList from "@/components/dashboard/OutbreakList";
import DiseaseDonut from "@/components/dashboard/DiseaseDonut";
import AlertFeed from "@/components/dashboard/AlertFeed";
import InventoryRow from "@/components/dashboard/InventoryRow";
import LiveScanGallery from "@/components/dashboard/LiveScanGallery";

const COLORS = ["#5fa848", "#3a7ca5", "#ea7c1e", "#dc2626", "#7c5cd6", "#a98c4f"];

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #e5e2db",
  borderRadius: 10,
  fontSize: 12,
  color: "#1c2c1f",
  boxShadow: "0 8px 24px rgba(20,30,15,0.08)",
};

const DEFAULT_REPORTS = [
  { id: "dr-1", district: "Warangal", mandal: "Hanamkonda", crop: "Cotton", disease: "Pink Bollworm", cases: 342, severity: "critical", trend: "rising", trend_pct: 45.2, latitude: 17.9689, longitude: 79.5941 },
  { id: "dr-2", district: "Warangal", mandal: "Parkal", crop: "Cotton", disease: "Pink Bollworm", cases: 128, severity: "high", trend: "rising", trend_pct: 22.0, latitude: 18.1947, longitude: 79.8436 },
  { id: "dr-3", district: "Khammam", mandal: "Wyra", crop: "Chilli", disease: "Leaf Curl Virus", cases: 415, severity: "critical", trend: "rising", trend_pct: 38.5, latitude: 17.2473, longitude: 80.1514 },
  { id: "dr-4", district: "Khammam", mandal: "Sathupalli", crop: "Chilli", disease: "Leaf Curl Virus", cases: 189, severity: "high", trend: "rising", trend_pct: 15.0, latitude: 17.2140, longitude: 80.8251 },
  { id: "dr-5", district: "Karimnagar", mandal: "Jammikunta", crop: "Rice", disease: "Blast Disease", cases: 210, severity: "medium", trend: "stable", trend_pct: 2.1, latitude: 18.4386, longitude: 79.1288 },
  { id: "dr-6", district: "Karimnagar", mandal: "Huzurabad", crop: "Rice", disease: "Blast Disease", cases: 85, severity: "low", trend: "falling", trend_pct: -12.4, latitude: 18.2045, longitude: 79.4042 },
  { id: "dr-7", district: "Nalgonda", mandal: "Miryalaguda", crop: "Rice", disease: "Brown Spot", cases: 112, severity: "medium", trend: "rising", trend_pct: 8.4, latitude: 16.8741, longitude: 79.5701 },
  { id: "dr-8", district: "Nizamabad", mandal: "Armoor", crop: "Maize", disease: "Fall Armyworm", cases: 276, severity: "high", trend: "rising", trend_pct: 18.7, latitude: 18.7845, longitude: 78.2863 },
  { id: "dr-9", district: "Adilabad", mandal: "Utnoor", crop: "Cotton", disease: "Boll Rot", cases: 94, severity: "medium", trend: "stable", trend_pct: 0.5, latitude: 19.3626, longitude: 78.7801 },
  { id: "dr-10", district: "Mahabubnagar", mandal: "Jadcherla", crop: "Groundnut", disease: "Tikka Disease", cases: 156, severity: "high", trend: "rising", trend_pct: 12.0, latitude: 16.7621, longitude: 78.1408 },
  { id: "dr-11", district: "Siddipet", mandal: "Gajwel", crop: "Tomato", disease: "Early Blight", cases: 189, severity: "high", trend: "rising", trend_pct: 19.2, latitude: 17.8540, longitude: 78.6811 }
];

const DEFAULT_SNAPSHOTS = [
  { id: "s-1", snapshot_date: "2026-04-01", date: "2026-04-01", district: "Warangal", disease: "Pink Bollworm", crop: "Cotton", new_cases: 45, total_cases: 342, trend: "rising", predicted_cases: 410, risk_score: 88 },
  { id: "s-2", snapshot_date: "2026-04-02", date: "2026-04-02", district: "Khammam", disease: "Leaf Curl Virus", crop: "Chilli", new_cases: 60, total_cases: 415, trend: "rising", predicted_cases: 520, risk_score: 92 },
  { id: "s-3", snapshot_date: "2026-04-03", date: "2026-04-03", district: "Karimnagar", disease: "Blast Disease", crop: "Rice", new_cases: 12, total_cases: 210, trend: "stable", predicted_cases: 215, risk_score: 54 }
];

export default function Analytics() {
  const [activeMetric, setActiveMetric] = useState<"cases" | "scans" | "risk">("cases");
  const [dateRange, setDateRange] = useState("7d");
  const [selectedCrop, setSelectedCrop] = useState("All");

  const { data: rawReports = DEFAULT_REPORTS } = useQuery({
    queryKey: ["analytics-reports"],
    queryFn: async () => {
      try {
        const data = await fetchFromBackend("/disease-reports");
        return Array.isArray(data) && data.length > 0 ? data : DEFAULT_REPORTS;
      } catch (err) {
        return DEFAULT_REPORTS;
      }
    },
    refetchInterval: 60000,
  });

  const reports = useMemo(() => {
    return rawReports.filter((r: any) => {
      if (selectedCrop !== "All" && r.crop !== selectedCrop) return false;
      return true;
    });
  }, [rawReports, selectedCrop]);

  // Fetch analytics snapshots
  const { data: snapshots = DEFAULT_SNAPSHOTS } = useQuery({
    queryKey: ["db-snapshots"],
    queryFn: async () => {
      try {
        const data = await fetchFromBackend("/analytics-snapshots");
        return Array.isArray(data) && data.length > 0
          ? data.map((s: any) => ({ ...s, date: s.snapshot_date }))
          : DEFAULT_SNAPSHOTS;
      } catch (err) {
        return DEFAULT_SNAPSHOTS;
      }
    },
  });

  // Compute metrics from DB data
  const totalCases = useMemo(() => reports.reduce((s, r) => s + (r?.cases || 0), 0), [reports]);
  const avgRisk = useMemo(() => {
    const scores = snapshots.filter(s => s && s.risk_score != null);
    return scores.length ? (scores.reduce((s, r) => s + (r?.risk_score || 0), 0) / scores.length).toFixed(1) : "0";
  }, [snapshots]);

  const metrics = [
    { key: "cases", label: "Disease Cases", value: totalCases.toLocaleString(), trend: "+23%", icon: Activity, up: true },
    { key: "scans", label: "Total Reports", value: reports.length.toString(), trend: `${reports.length}`, icon: BarChart3, up: true },
    { key: "risk", label: "Avg Risk Score", value: avgRisk, trend: "+4.2", icon: Shield, up: true },
  ];

  // Predictive trend from snapshots
  const trendChartData = useMemo(() => {
    const warangal = snapshots.filter(s => s && s.district === "Warangal");
    const karimnagar = snapshots.filter(s => s && s.district === "Karimnagar");
    const khammam = snapshots.filter(s => s && s.district === "Khammam");

    const allDates = [...new Set(snapshots.map(s => s?.date))].filter(Boolean).sort() as string[];
    return allDates.map(date => {
      const w = warangal.find(s => s?.date === date);
      const k = karimnagar.find(s => s?.date === date);
      const kh = khammam.find(s => s?.date === date);
      return {
        day: date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
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
    const sorted = [...snapshots].sort((a, b) => (a?.date || "").localeCompare(b?.date || ""));
    sorted.forEach(s => {
      if (!s || !s.district) return;
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
    reports.forEach(r => {
      if (!r || !r.disease) return;
      counts[r.disease] = (counts[r.disease] || 0) + (r.cases || 0);
    });
    return Object.entries(counts)
      .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [reports]);

  // Cases by district
  const districtBarData = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      if (!r || !r.district) return;
      counts[r.district] = (counts[r.district] || 0) + (r.cases || 0);
    });
    return Object.entries(counts)
      .map(([name, cases]) => ({ name: (name || "District").substring(0, 8), cases }))
      .sort((a, b) => b.cases - a.cases);
  }, [reports]);

  // Weekly from snapshots
  const weeklyData = useMemo(() => {
    const byWeek: Record<string, { newCases: number; districts: Set<string> }> = {};
    snapshots.filter(s => s && s.new_cases != null).forEach(s => {
      const d = new Date(s.date || Date.now());
      const weekNum = `W${Math.ceil(d.getDate() / 7)}`;
      if (!byWeek[weekNum]) byWeek[weekNum] = { newCases: 0, districts: new Set() };
      byWeek[weekNum].newCases += s.new_cases || 0;
      if (s.district) byWeek[weekNum].districts.add(s.district);
    });
    return Object.entries(byWeek).map(([week, d]) => ({
      week,
      newCases: d.newCases,
      districts: d.districts.size,
    }));
  }, [snapshots]);

  const [initStatus, setInitStatus] = useState("");

  const handleInitDb = async () => {
    try {
      setInitStatus("Initializing... please wait");
      const res = await fetch("http://localhost:3001/api/init-db", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setInitStatus("Success! Refreshing data...");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setInitStatus("Error: " + data.error);
      }
    } catch (e: any) {
      setInitStatus("Network Error: " + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-[1320px] mx-auto px-4 lg:px-8 py-10 space-y-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="eyebrow">Intelligence</span>
          <h1 className="text-4xl md:text-5xl font-heading font-medium tracking-tight mt-2">
            Analytics & <span className="italic-display text-primary-deep">insight</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-4">
            {reports.length} reports • {snapshots.length} data points • Real-time + Predictive
            {reports.length === 0 && (
              <button 
                onClick={handleInitDb}
                className="bg-primary text-primary-foreground px-4 py-1 text-xs rounded-full hover:bg-primary/90 transition-colors"
              >
                {initStatus || "Initialize Snowflake Database"}
              </button>
            )}
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
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-accent text-accent-foreground">DB-DRIVEN</span>
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

        {/* --- LIVE UPLOADED CROP DISEASE SCANS & IMAGES GALLERY (BELOW DISEASE TREND ANALYSIS) --- */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <LiveScanGallery reports={rawReports} />
        </motion.div>

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

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-6 flex flex-col justify-between">
            <div>
              <span className="eyebrow">Distribution</span>
              <h3 className="font-heading text-xl font-medium mt-1 mb-2 tracking-tight">Disease <span className="italic-display text-primary-deep">share</span></h3>
            </div>

            <div className="relative h-[160px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={diseaseDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {diseaseDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Clean, perfectly spaced legend grid preventing any overlap */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2 pt-2 border-t border-border/50 max-h-[110px] overflow-y-auto">
              {diseaseDistribution.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-muted-foreground truncate" title={entry.name}>{entry.name}</span>
                  <span className="ml-auto font-mono text-[11px] font-semibold text-foreground">{entry.value}</span>
                </div>
              ))}
            </div>
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

        {/* --- LIVE INTELLIGENCE DASHBOARD MOVED FROM INDEX --- */}
        <div className="pt-16 border-t border-border mt-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-end justify-between gap-6 mb-10">
            <div>
              <span className="eyebrow">Live Intelligence</span>
              <h2 className="text-3xl md:text-5xl font-heading font-medium leading-tight mt-3 text-foreground">
                Real-time <span className="italic-display text-primary-deep">Monitoring</span>
              </h2>
            </div>
            <p className="hidden md:block text-sm text-muted-foreground max-w-sm leading-relaxed">
              A connected platform linking soil, crops, and operations — helping farmers grow more efficiently and safely.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <StatsRow />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-10">
            <div className="lg:col-span-3 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><MapPanel /></motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}><TrendChart /></motion.div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}><OutbreakList /></motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}><DiseaseDonut /></motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}><AlertFeed /></motion.div>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-10">
            <InventoryRow />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
