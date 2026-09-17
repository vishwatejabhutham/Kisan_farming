import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  Search,
  MapPin,
  ShieldAlert,
  Printer,
  Sparkles,
  Droplets,
  Sprout,
  CheckCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchFromBackend } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/dashboard/Navbar";
import { toast } from "sonner";

interface AlertItem {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  district: string;
  disease?: string;
  crop?: string;
  is_read: boolean;
  timestamp: string;
  imageUrl?: string;
  remedy?: string;
  symptoms?: string[];
  fromDb?: boolean;
}

const FALLBACK_ALERTS: AlertItem[] = [
  {
    id: "alert-1",
    severity: "critical",
    title: "Severe Late Blight Spore Outbreak Detected",
    message: "High relative humidity (>90%) and mild night temperatures have triggered rapid spore dispersal across nightshade fields in Warangal. Urgent preventive fungicide spray is advised.",
    district: "Warangal",
    disease: "Late Blight",
    crop: "Tomato",
    is_read: false,
    timestamp: "10 mins ago",
    imageUrl: "/images/plant-diseases/1.jpg",
    symptoms: ["Water-soaked leaf lesions", "White mold on leaf underside", "Rapid stem browning"],
    remedy: "Spray Mancozeb 75% WP @ 2.5g/L or Copper Oxychloride @ 3g/L immediately."
  },
  {
    id: "alert-2",
    severity: "high",
    title: "Chilli Yellow Leaf Curl Vector Surge",
    message: "Whitefly populations have exceeded economic threshold limits in Karimnagar spice belts. High risk of viral transmission over the next 48 hours.",
    district: "Karimnagar",
    disease: "Yellow Leaf Curl Virus",
    crop: "Chilli",
    is_read: false,
    timestamp: "45 mins ago",
    imageUrl: "/images/plant-diseases/2.jpg",
    symptoms: ["Upward leaf curling", "Stunted vegetative growth", "Vein clearing"],
    remedy: "Install sticky yellow traps (10/acre) and apply Imidacloprid 17.8 SL @ 0.5ml/L."
  },
  {
    id: "alert-3",
    severity: "high",
    title: "Cotton Bacterial Blight Early Warning",
    message: "Intermittent rainfall followed by warm sunshine has created ideal conditions for Xanthomonas bacterial expansion in Adilabad rainfed cotton tracts.",
    district: "Adilabad",
    disease: "Bacterial Blight",
    crop: "Cotton",
    is_read: false,
    timestamp: "2 hours ago",
    imageUrl: "/images/plant-diseases/4.jpeg",
    symptoms: ["Angular water-soaked leaf spots", "Black arm stem rot"],
    remedy: "Foliar application of Streptocycline (1g/10L) + Copper Oxychloride (30g/10L)."
  },
  {
    id: "alert-4",
    severity: "medium",
    title: "Paddy Brown Spot Warning - Soil Potassium Deficit",
    message: "Field soil moisture monitoring indicates low soil fertility exacerbating brown spot fungus in Nalgonda canal zones.",
    district: "Nalgonda",
    disease: "Brown Spot",
    crop: "Paddy",
    is_read: true,
    timestamp: "5 hours ago",
    imageUrl: "/images/plant-diseases/3.jpeg",
    symptoms: ["Oval brown leaf spots with yellow halo", "Grain discoloration"],
    remedy: "Top dress Muriate of Potash @ 25kg/acre and spray Propiconazole @ 1ml/L."
  },
  {
    id: "alert-5",
    severity: "critical",
    title: "Groundnut Rust Spores Spreading in Khammam",
    message: "Airborne fungal spores detected across 14 mandals. Early defoliation reported in unprotected kharif crops.",
    district: "Khammam",
    disease: "Groundnut Rust",
    crop: "Groundnut",
    is_read: true,
    timestamp: "1 day ago",
    imageUrl: "/images/plant-diseases/6.jpg",
    symptoms: ["Orange pustules on leaf underside", "Rapid leaf desiccation"],
    remedy: "Foliar spray of Chlorothalonil 75 WP @ 2g/L or Tebuconazole @ 1ml/L."
  },
  {
    id: "alert-6",
    severity: "low",
    title: "Wheat Yellow Rust Preventive Monitoring Active",
    message: "Cool morning dew levels elevated. Regular scout inspections recommended for wheat growers in Nizamabad.",
    district: "Nizamabad",
    disease: "Yellow Rust",
    crop: "Wheat",
    is_read: true,
    timestamp: "2 days ago",
    imageUrl: "/images/plant-diseases/7.jpg",
    symptoms: ["Yellow linear pustule stripes"],
    remedy: "Proactive field scouting; apply Propiconazole if yellow stripes emerge on upper leaves."
  },
  {
    id: "alert-7",
    severity: "medium",
    title: "Maize Turcicum Leaf Blight Spotting",
    message: "Elliptical grayish lesions observed on lower leaves across Mahbubnagar corn belts following high morning humidity.",
    district: "Mahbubnagar",
    disease: "Turcicum Leaf Blight",
    crop: "Maize",
    is_read: true,
    timestamp: "3 days ago",
    imageUrl: "/images/plant-diseases/9.webp",
    symptoms: ["Long elliptical greyish-brown lesions", "Husks drying prematurely"],
    remedy: "Spray Mancozeb 75 WP @ 2.5g/L at early lesion appearance."
  },
  {
    id: "alert-8",
    severity: "low",
    title: "Multi-Spectral Paddy Foliar Stress Scan",
    message: "AI satellite & drone sensors detected micro-chlorophyll stress index shift in Medak rice paddy blocks.",
    district: "Medak",
    disease: "Paddy Stress Diagnostic",
    crop: "Paddy",
    is_read: true,
    timestamp: "4 days ago",
    imageUrl: "/images/plant-diseases/leaf.jpeg",
    symptoms: ["Sub-clinical chlorophyll index variation"],
    remedy: "Maintain 3-5 cm standing water depth. No immediate chemical intervention required."
  }
];

const IMAGE_POOL = [
  "/images/plant-diseases/1.jpg",
  "/images/plant-diseases/2.jpg",
  "/images/plant-diseases/3.jpeg",
  "/images/plant-diseases/4.jpeg",
  "/images/plant-diseases/6.jpg",
  "/images/plant-diseases/7.jpg",
  "/images/plant-diseases/9.webp",
  "/images/plant-diseases/leaf.jpeg",
];

const DISEASE_TO_IMAGE: Record<string, string> = {
  "late blight": "/images/plant-diseases/1.jpg",
  "yellow leaf curl": "/images/plant-diseases/2.jpg",
  "brown spot": "/images/plant-diseases/3.jpeg",
  "bacterial blight": "/images/plant-diseases/4.jpeg",
  "groundnut rust": "/images/plant-diseases/6.jpg",
  "yellow rust": "/images/plant-diseases/7.jpg",
  "turcicum": "/images/plant-diseases/9.webp",
  "paddy stress": "/images/plant-diseases/leaf.jpeg",
};

function getAlertImage(diseaseOrTitle?: string, index = 0): string {
  if (diseaseOrTitle) {
    const lower = diseaseOrTitle.toLowerCase();
    for (const key of Object.keys(DISEASE_TO_IMAGE)) {
      if (lower.includes(key)) return DISEASE_TO_IMAGE[key];
    }
  }
  return IMAGE_POOL[index % IMAGE_POOL.length];
}

const severityConfig = {
  critical: { label: "Critical", icon: "🔴", bg: "bg-red-500/10", border: "border-red-500", text: "text-red-600" },
  high: { label: "High Risk", icon: "🟠", bg: "bg-orange-500/10", border: "border-orange-500", text: "text-orange-600" },
  medium: { label: "Moderate", icon: "🟡", bg: "bg-amber-500/10", border: "border-amber-500", text: "text-amber-600" },
  low: { label: "Low / Info", icon: "🟢", bg: "bg-emerald-500/10", border: "border-emerald-500", text: "text-emerald-600" },
};

export default function Alerts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/alerts", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Fetch alerts from backend
  const { data: dbAlerts = [], isLoading } = useQuery({
    queryKey: ["alerts", filter],
    queryFn: async () => {
      let data = await fetchFromBackend("/alerts");
      if (filter === "unread" && data) {
        data = data.filter((a: any) => !a.is_read);
      } else if (filter !== "all" && data) {
        data = data.filter((a: any) => a.severity === filter);
      }
      return data || [];
    },
    refetchInterval: 15000,
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

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("alerts-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => {
        queryClient.invalidateQueries({ queryKey: ["alerts"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Combine DB alerts and fallback items cleanly
  const allAlerts: AlertItem[] = useMemo(() => {
    const mappedDb: AlertItem[] = dbAlerts.map((a: any, idx: number) => ({
      id: a.id,
      severity: a.severity || "medium",
      title: a.title,
      message: a.message,
      district: a.district || "Warangal",
      disease: a.disease || "Crop Stress",
      crop: a.crop || "General Crop",
      is_read: !!a.is_read,
      timestamp: new Date(a.created_at).toLocaleString(),
      imageUrl: getAlertImage(a.disease || a.title, idx),
      fromDb: true,
    }));

    const combined = mappedDb.length > 0 ? mappedDb : FALLBACK_ALERTS;

    return combined.filter((item) => {
      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchMsg = item.message.toLowerCase().includes(q);
        const matchDistrict = item.district.toLowerCase().includes(q);
        const matchDisease = item.disease?.toLowerCase().includes(q);
        if (!matchTitle && !matchMsg && !matchDistrict && !matchDisease) return false;
      }

      // Filter by district
      if (districtFilter !== "all" && item.district !== districtFilter) {
        return false;
      }

      // Filter by severity / unread
      if (filter === "unread") return !item.is_read;
      if (filter !== "all") return item.severity === filter;

      return true;
    });
  }, [dbAlerts, filter, districtFilter, searchQuery]);

  // Unique list of districts for filter dropdown
  const districtsList = useMemo(() => {
    const set = new Set(FALLBACK_ALERTS.map((a) => a.district));
    return ["all", ...Array.from(set)];
  }, []);

  // Summary Metrics
  const totalCount = allAlerts.length;
  const unreadCount = allAlerts.filter((a) => !a.is_read).length;
  const criticalCount = allAlerts.filter((a) => a.severity === "critical").length;
  const impactedDistricts = new Set(allAlerts.map((a) => a.district)).size;

  const handlePrintAdvisory = () => {
    window.print();
  };

  const handleAcknowledgeAll = () => {
    toast.success("All visible alerts marked as read");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-[1320px] mx-auto px-4 lg:px-8 py-10 space-y-8">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-2 text-destructive font-semibold text-xs tracking-wider uppercase mb-1">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
              <span>Real-Time Outbreak Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-medium tracking-tight text-foreground">
              Alert <span className="italic-display text-primary-deep">Center & Advisories</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              Live disease warnings, vector expansion alerts, and recommended chemical remedies for agricultural officers & farmers across Telangana.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrintAdvisory}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" /> Export Advisory
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleAcknowledgeAll}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:bg-primary/90 transition-all"
              >
                <CheckCheck className="w-4 h-4" /> Mark All Read
              </button>
            )}
          </div>
        </motion.div>

        {/* SUMMARY STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-destructive/10 text-destructive">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase font-medium">Active Alerts</span>
              <p className="text-2xl font-heading font-bold text-foreground mt-0.5">{totalCount}</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-red-500/10 text-red-600 relative">
              <AlertTriangle className="w-6 h-6" />
              {criticalCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              )}
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase font-medium">Critical Threats</span>
              <p className="text-2xl font-heading font-bold text-red-600 mt-0.5">{criticalCount}</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase font-medium">Unread Alerts</span>
              <p className="text-2xl font-heading font-bold text-foreground mt-0.5">{unreadCount}</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase font-medium">Districts Affected</span>
              <p className="text-2xl font-heading font-bold text-foreground mt-0.5">{impactedDistricts}</p>
            </div>
          </motion.div>
        </div>

        {/* SEARCH AND FILTERS TOOLBAR */}
        <div className="glass-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* SEARCH INPUT */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search alert by disease, crop or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary/80 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* DISTRICT FILTER */}
            <div className="flex items-center gap-1.5 bg-secondary/80 px-3 py-1.5 rounded-xl border border-border">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-medium text-foreground focus:outline-none cursor-pointer"
              >
                <option value="all">All Districts</option>
                {districtsList.filter((d) => d !== "all").map((d) => (
                  <option key={d} value={d}>{d} District</option>
                ))}
              </select>
            </div>

            {/* SEVERITY PILLS */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {["all", "unread", "critical", "high", "medium", "low"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                    filter === f
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ALERT CARDS LIST */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="glass-card p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
              <span>Fetching live agricultural alerts...</span>
            </div>
          ) : allAlerts.length === 0 ? (
            <div className="glass-card p-12 text-center text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-base font-semibold text-foreground">No alerts match your search or filter</p>
              <p className="text-xs text-muted-foreground mt-1">Try resetting the district or severity filter</p>
            </div>
          ) : (
            allAlerts.map((alert, i) => {
              const config = severityConfig[alert.severity] || severityConfig.medium;
              const isExpanded = expanded === alert.id;

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`glass-card p-5 border-l-4 ${config.border} ${
                    alert.is_read ? "opacity-75 bg-card/60" : "bg-card shadow-md"
                  } transition-all duration-200 hover:border-primary/50 cursor-pointer overflow-hidden`}
                  onClick={() => setExpanded(isExpanded ? null : alert.id)}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* DISEASE THUMBNAIL IF PRESENT */}
                      {alert.imageUrl ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border shadow-sm">
                          <img src={alert.imageUrl} alt={alert.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0 text-xl`}>
                          {config.icon}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase ${config.bg} ${config.text} border-current/20`}>
                            {config.label}
                          </span>

                          <span className="text-xs font-semibold text-foreground/80 flex items-center gap-1 bg-secondary/80 px-2 py-0.5 rounded-md">
                            <MapPin className="w-3 h-3 text-primary" /> {alert.district}
                          </span>

                          {alert.crop && (
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Sprout className="w-3 h-3" /> {alert.crop}
                            </span>
                          )}

                          {alert.disease && (
                            <span className="text-xs font-medium text-muted-foreground">
                              🦠 {alert.disease}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-heading font-semibold text-foreground">
                          {alert.title}
                        </h3>

                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Issued {alert.timestamp}</span>
                          {!alert.is_read && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground">
                              UNREAD
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {alert.fromDb && !alert.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            acknowledgeMutation.mutate(alert.id);
                          }}
                          className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors flex items-center gap-1 text-xs font-medium"
                          title="Acknowledge alert"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Acknowledge</span>
                        </button>
                      )}
                      <div className="p-1.5 rounded-full bg-secondary text-muted-foreground">
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                  </div>

                  {/* EXPANDABLE DETAILS DRAWER */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                          {/* DESCRIPTION */}
                          <div className="md:col-span-6 space-y-2">
                            <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">Field Advisory Summary</span>
                            <p className="text-muted-foreground leading-relaxed bg-secondary/40 p-3 rounded-xl border border-border/50">
                              {alert.message}
                            </p>
                          </div>

                          {/* REMEDY / ACTION */}
                          <div className="md:col-span-6 space-y-2">
                            <span className="font-semibold text-emerald-600 uppercase tracking-wider text-[11px] flex items-center gap-1">
                              <Droplets className="w-3.5 h-3.5" /> Recommended Remediation
                            </span>
                            <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20 text-foreground leading-relaxed">
                              {alert.remedy || "Apply recommended systemic fungicide and maintain field drainage. Inspect surrounding mandal plots within 24 hours."}
                            </div>
                          </div>
                        </div>
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
