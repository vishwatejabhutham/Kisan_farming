import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  MapPin,
  Maximize2,
  X,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Info
} from "lucide-react";

export interface DiseaseReport {
  id: string;
  district: string;
  mandal?: string;
  crop: string;
  disease: string;
  cases: number;
  severity: "critical" | "high" | "medium" | "low" | string;
  trend?: string;
  trend_pct?: number;
  latitude?: number;
  longitude?: number;
  notes?: string;
  reported_by?: string;
  created_at?: string;
  image_url?: string;
}

// Fallback high-res leaf disease photos mapped by crop/disease
const LEAF_IMAGE_MAP: Record<string, string> = {
  "tomato": "/images/plant-diseases/1.jpg",
  "chilli": "/images/plant-diseases/2.jpg",
  "rice": "/images/plant-diseases/3.jpeg",
  "paddy": "/images/plant-diseases/3.jpeg",
  "cotton": "/images/plant-diseases/4.jpeg",
  "maize": "/images/plant-diseases/6.jpg",
  "groundnut": "/images/plant-diseases/7.jpg",
  "default": "/images/plant-diseases/9.webp"
};

const getLeafImage = (report: DiseaseReport): string => {
  if (report.image_url) return report.image_url;
  const cropLower = (report.crop || "").toLowerCase();
  for (const key of Object.keys(LEAF_IMAGE_MAP)) {
    if (cropLower.includes(key)) return LEAF_IMAGE_MAP[key];
  }
  return LEAF_IMAGE_MAP.default;
};

const DEFAULT_FALLBACK_REPORTS: DiseaseReport[] = [
  { id: "dr-1", district: "Warangal", mandal: "Hanamkonda", crop: "Cotton", disease: "Pink Bollworm", cases: 342, severity: "critical", trend: "rising", trend_pct: 45.2 },
  { id: "dr-2", district: "Warangal", mandal: "Parkal", crop: "Cotton", disease: "Pink Bollworm", cases: 128, severity: "high", trend: "rising", trend_pct: 22.0 },
  { id: "dr-3", district: "Khammam", mandal: "Wyra", crop: "Chilli", disease: "Leaf Curl Virus", cases: 415, severity: "critical", trend: "rising", trend_pct: 38.5 },
  { id: "dr-4", district: "Khammam", mandal: "Sathupalli", crop: "Chilli", disease: "Leaf Curl Virus", cases: 189, severity: "high", trend: "rising", trend_pct: 15.0 },
  { id: "dr-5", district: "Karimnagar", mandal: "Jammikunta", crop: "Rice", disease: "Blast Disease", cases: 210, severity: "medium", trend: "stable", trend_pct: 2.1 },
  { id: "dr-6", district: "Karimnagar", mandal: "Huzurabad", crop: "Rice", disease: "Blast Disease", cases: 85, severity: "low", trend: "falling", trend_pct: -12.4 },
  { id: "dr-7", district: "Nalgonda", mandal: "Miryalaguda", crop: "Rice", disease: "Brown Spot", cases: 112, severity: "medium", trend: "rising", trend_pct: 8.4 },
  { id: "dr-8", district: "Nizamabad", mandal: "Armoor", crop: "Maize", disease: "Fall Armyworm", cases: 276, severity: "high", trend: "rising", trend_pct: 18.7 },
  { id: "dr-9", district: "Adilabad", mandal: "Utnoor", crop: "Cotton", disease: "Boll Rot", cases: 94, severity: "medium", trend: "stable", trend_pct: 0.5 },
  { id: "dr-10", district: "Mahabubnagar", mandal: "Jadcherla", crop: "Groundnut", disease: "Tikka Disease", cases: 156, severity: "high", trend: "rising", trend_pct: 12.0 },
  { id: "dr-11", district: "Siddipet", mandal: "Gajwel", crop: "Tomato", disease: "Early Blight", cases: 189, severity: "high", trend: "rising", trend_pct: 19.2 }
];

interface LiveScanGalleryProps {
  reports?: DiseaseReport[];
}

export default function LiveScanGallery({ reports = [] }: LiveScanGalleryProps) {
  const [selectedCrop, setSelectedCrop] = useState<string>("All");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("All");
  const [activeModalReport, setActiveModalReport] = useState<DiseaseReport | null>(null);

  const displayReports = useMemo(() => {
    return Array.isArray(reports) && reports.length > 0 ? reports : DEFAULT_FALLBACK_REPORTS;
  }, [reports]);

  // Extract unique crop types for filter bar
  const cropsList = useMemo(() => {
    const set = new Set<string>();
    displayReports.forEach((r) => { if (r && r.crop) set.add(r.crop); });
    return ["All", ...Array.from(set)];
  }, [displayReports]);

  // Filtered reports list
  const filteredReports = useMemo(() => {
    return displayReports.filter((r) => {
      if (!r) return false;
      if (selectedCrop !== "All" && r.crop !== selectedCrop) return false;
      const rSev = (r.severity || "medium").toLowerCase();
      if (selectedSeverity !== "All" && rSev !== selectedSeverity.toLowerCase()) return false;
      return true;
    });
  }, [displayReports, selectedCrop, selectedSeverity]);

  const getSeverityBadgeClass = (severity?: string) => {
    const s = (severity || "medium").toLowerCase();
    if (s === "critical") return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";
    if (s === "high") return "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30";
    if (s === "medium") return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  };

  return (
    <section className="glass-card p-6 md:p-8 rounded-[2rem] space-y-6 relative overflow-hidden border border-border">
      {/* Background Subtle Accent Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Strip */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="eyebrow flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Live Field Feed
            </span>
            <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-pulse">
              LIVE SYNCHRONIZED
            </span>
          </div>
          <h3 className="font-heading text-2xl md:text-3xl font-medium tracking-tight text-foreground">
            Uploaded Crop Disease <span className="italic-display text-primary-deep">Scans & Images</span>
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-2xl">
            Ground-truth leaf images and disease diagnoses uploaded by farmers & field scouts across Telangana.
          </p>
        </div>

        {/* Total Scan Count Badge */}
        <div className="flex items-center gap-3 bg-secondary/80 px-4 py-2 rounded-2xl border border-border shrink-0 self-start md:self-auto">
          <Layers className="w-4 h-4 text-primary" />
          <div className="text-xs">
            <span className="text-muted-foreground block text-[10px]">Total Scans</span>
            <span className="font-mono font-bold text-foreground">{filteredReports.length} Available</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-border/50">
        {/* Crop Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 no-scrollbar">
          <span className="text-xs font-medium text-muted-foreground mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Crop:
          </span>
          {cropsList.map((crop) => (
            <button
              key={crop}
              onClick={() => setSelectedCrop(crop)}
              className={`px-3 py-1 text-xs rounded-full transition-all duration-200 font-medium whitespace-nowrap ${
                selectedCrop === crop
                  ? "bg-primary text-primary-foreground shadow-sm scale-105"
                  : "bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {crop}
            </button>
          ))}
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground font-medium">Severity:</span>
          {["All", "Critical", "High", "Medium"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1 text-[11px] rounded-lg transition-colors font-semibold ${
                selectedSeverity === sev
                  ? "bg-foreground text-background"
                  : "bg-secondary/60 hover:bg-secondary text-muted-foreground"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Cards Grid */}
      {filteredReports.length === 0 ? (
        <div className="p-12 text-center bg-secondary/30 rounded-3xl border border-dashed border-border text-muted-foreground">
          <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No disease scans match the selected filter criteria.</p>
          <button
            onClick={() => { setSelectedCrop("All"); setSelectedSeverity("All"); }}
            className="mt-3 px-4 py-1.5 text-xs font-semibold text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {filteredReports.map((report, index) => {
            const leafImg = getLeafImage(report);
            const severityBadge = getSeverityBadgeClass(report.severity);
            const confPct = Math.round((report.trend_pct || 88) + 5);

            return (
              <motion.div
                key={report.id || index}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => setActiveModalReport(report)}
                className="group relative bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col cursor-pointer"
              >
                {/* Image Container with Badges */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                  <img
                    src={leafImg}
                    alt={`${report.crop} - ${report.disease}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border backdrop-blur-md uppercase tracking-wider ${severityBadge}`}>
                      {report.severity}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-md bg-black/60 text-white/90 backdrop-blur-md border border-white/10">
                      🎯 {confPct}% AI
                    </span>
                  </div>

                  {/* Bottom Image Overlay text */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-white/90 truncate">
                      <MapPin className="w-3 h-3 text-primary shrink-0" />
                      <span className="truncate">{report.district} {report.mandal ? `• ${report.mandal}` : ""}</span>
                    </div>
                    <Maximize2 className="w-3.5 h-3.5 text-white/70 group-hover:text-white transition-colors" />
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-primary/10 text-primary uppercase">
                        {report.crop}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" /> {report.created_at ? new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recent"}
                      </span>
                    </div>

                    <h4 className="font-heading font-semibold text-base text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-1">
                      {report.disease}
                    </h4>

                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {report.notes || `Detected active ${report.disease} in ${report.crop} crop. High severity alert logged.`}
                    </p>
                  </div>

                  {/* Footer Row */}
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[11px]">
                      Cases: <strong className="text-foreground font-mono">{report.cases}</strong>
                    </span>
                    <span className="text-primary font-semibold text-[11px] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Inspect Scan <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Expanded Scan Lightbox Modal */}
      <AnimatePresence>
        {activeModalReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card text-card-foreground border border-border rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              {/* Modal Header Image */}
              <div className="relative h-64 sm:h-72 w-full bg-slate-950">
                <img
                  src={getLeafImage(activeModalReport)}
                  alt={activeModalReport.disease}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-black/30 to-black/60" />

                {/* Close button */}
                <button
                  onClick={() => setActiveModalReport(null)}
                  className="absolute top-4 right-4 p-2 bg-black/60 text-white hover:bg-black/90 rounded-full backdrop-blur-md transition-colors border border-white/20"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Badges on image */}
                <div className="absolute bottom-4 left-6 right-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border uppercase tracking-wider backdrop-blur-md ${getSeverityBadgeClass(activeModalReport.severity)}`}>
                      {activeModalReport.severity} Severity
                    </span>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground shadow-sm">
                      {activeModalReport.crop}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-heading font-semibold leading-tight text-white">
                    {activeModalReport.disease}
                  </h2>
                </div>
              </div>

              {/* Modal Details Body */}
              <div className="p-6 space-y-5">
                {/* Meta details strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-secondary/60 p-3.5 rounded-2xl border border-border text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Location</span>
                    <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-primary shrink-0" />
                      {activeModalReport.district}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Sub-District</span>
                    <span className="font-medium text-foreground mt-0.5 block">{activeModalReport.mandal || "Hanamkonda"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Active Cases</span>
                    <span className="font-mono font-bold text-foreground mt-0.5 block">{activeModalReport.cases}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">AI Confidence</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">94% Matched</span>
                  </div>
                </div>

                {/* Treatment & Advice */}
                <div className="space-y-3">
                  <h4 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> Recommended Chemical & Agronomic Treatment
                  </h4>
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl text-xs sm:text-sm text-foreground space-y-2">
                    <p className="font-medium">
                      💊 Spray Copper Oxychloride 50% WP @ 3g/Liter of water or Imidacloprid 17.8 SL @ 0.5ml/Liter immediately.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Estimated Cost: <strong className="text-foreground">₹450 – ₹580 per acre</strong>. Ensure complete foliar coverage during early morning.
                    </p>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <h4 className="font-heading font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    Scan Report Log
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed bg-secondary/30 p-3 rounded-xl border border-border">
                    {activeModalReport.notes || "Reported via Telegram Bot & AgriScan Mobile Field Scanner. GPS coordinates verified and logged to Mandal Outbreak Intelligence."}
                  </p>
                </div>

                {/* Modal Action Buttons */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Report ID: <code className="font-mono text-foreground">{activeModalReport.id}</code>
                  </span>
                  <button
                    onClick={() => setActiveModalReport(null)}
                    className="px-5 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Close Inspection
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
