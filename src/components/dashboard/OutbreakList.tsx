import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchFromBackend } from "@/lib/api";

const diseaseColors: Record<string, string> = {
  "Late Blight": "#5fa848",
  "Leaf Curl": "#3a7ca5",
  "Whitefly Infestation": "#ea7c1e",
  "Stem Rot": "#dc2626",
  "Rust": "#7c5cd6",
};

type Zone = { district: string; mandal: string; disease: string; cases: number; trend: string; crop: string };

export default function OutbreakList() {
  const { data: zones = [] } = useQuery<Zone[]>({
    queryKey: ["outbreak-zones"],
    queryFn: async () => {
      const data = await fetchFromBackend("/disease-reports");
      return (data || []).map((d: any) => ({ ...d, mandal: d.mandal || "", trend: d.trend, crop: d.crop || "Unknown Crop" }));
    },
    refetchInterval: 30000,
  });

  const maxCases = Math.max(...zones.map(o => o.cases), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="eyebrow">Outbreaks</span>
          <h3 className="font-heading text-xl font-medium mt-1 tracking-tight">Active <span className="italic-display text-primary-deep">zones</span></h3>
        </div>
        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-destructive/10 text-destructive">{zones.length}</span>
      </div>
      <div className="space-y-2.5">
        {zones.map((zone, i) => (
          <motion.div key={zone.district + zone.mandal + zone.disease} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
            className="group p-3 rounded-xl border border-border bg-secondary/40 hover:bg-secondary hover:border-foreground/20 transition-all duration-200 cursor-pointer">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-sm">{zone.district} <span className="text-muted-foreground font-normal">— {zone.mandal}</span></p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: diseaseColors[zone.disease] || "#999" }} />
                  <span className="text-xs font-medium text-foreground/80">{zone.crop}</span>
                  <span className="text-xs text-muted-foreground">• {zone.disease}</span>
                </div>
              </div>
              <span className={`text-xs font-medium ${zone.trend === "rising" ? "text-destructive" : "text-primary-deep"}`}>
                {zone.trend === "rising" ? "↑ Rising" : zone.trend === "falling" ? "↓ Falling" : "— Stable"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-background overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(zone.cases / maxCases) * 100}%`, background: diseaseColors[zone.disease] || "#999" }} />
              </div>
              <span className="text-xs font-mono font-medium w-12 text-right">{zone.cases}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
