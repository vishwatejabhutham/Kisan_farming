import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchFromBackend } from "@/lib/api";

const urgencyColors: Record<string, { bg: string; text: string }> = {
  CRITICAL: { bg: "bg-destructive/10", text: "text-destructive" },
  HIGH: { bg: "bg-warning/10", text: "text-warning" },
  MEDIUM: { bg: "bg-accent", text: "text-primary-deep" },
  LOW: { bg: "bg-muted", text: "text-muted-foreground" },
};

type InventoryItem = {
  id: string;
  product: string;
  district: string;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  stock_units: number;
  estimated_demand: number;
  confidence: number;
  mandal?: string;
};

export default function InventoryRow() {
  const { data: inventory = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["inventory-status"],
    queryFn: async () => {
      const data = await fetchFromBackend("/inventory");
      return data || [];
    },
    refetchInterval: 60000,
  });

  const items = inventory;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6">
      <div className="mb-1">
        <span className="eyebrow">Inventory</span>
        <h3 className="font-heading text-2xl font-medium mt-1 tracking-tight">Pre-positioning <span className="italic-display text-primary-deep">recommendations</span></h3>
        <p className="text-sm text-muted-foreground mt-1">Based on 7-day outbreak forecast — act before peak.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        {items.slice(0, 3).map((rec, i) => {
          const colors = urgencyColors[rec.urgency] || urgencyColors.MEDIUM;
          const confidence = Number(rec.confidence) || 0;
          return (
            <motion.div key={rec.id || rec.product} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 + i * 0.1 }}
              className="glass-card-hover p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{rec.product}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rec.district} — {rec.mandal}</p>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${colors.bg} ${colors.text}`}>{rec.urgency}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Stock Units</span><p className="font-semibold font-mono">{rec.stock_units.toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">Est. Demand</span><p className="font-semibold font-mono">{rec.estimated_demand.toLocaleString()}</p></div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Forecast confidence</span><span className="font-medium text-foreground">{confidence}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${confidence}%` }} transition={{ delay: 0.8 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-primary" />
                </div>
              </div>
              <button className="pill-cta justify-center w-full !py-2 mt-auto">Brief Field Rep</button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
