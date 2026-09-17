import { useState } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { fetchFromBackend } from "@/lib/api";

const COLORS = ["#1c2c1f", "#5fa848", "#ea7c1e", "#dc2626", "#a0aec0", "#e2e8f0"];
const crops = ["All", "Tomato", "Chilli", "Cotton", "Rice", "Groundnut"] as const;
type Crop = (typeof crops)[number];

export default function DiseaseDonut() {
  const [activeCrop, setActiveCrop] = useState<string>("All");

  const { data: reports = [] } = useQuery({
    queryKey: ["disease-donut"],
    queryFn: async () => {
      const data = await fetchFromBackend("/disease-reports");
      return data || [];
    },
    refetchInterval: 60000,
  });

  const filtered = activeCrop === "All" ? reports : reports.filter(r => r.crop === activeCrop);
  const total = filtered.reduce((s, r) => s + r.cases, 0);

  const distribution = Object.entries(
    filtered.reduce<Record<string, number>>((acc, r) => { acc[r.disease] = (acc[r.disease] || 0) + r.cases; return acc; }, {})
  ).map(([name, value], i) => ({ name, value: Math.round((value / Math.max(total, 1)) * 100), color: COLORS[i % COLORS.length] }))
   .sort((a, b) => b.value - a.value);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-6">
      <div className="mb-4">
        <span className="eyebrow">Distribution</span>
        <h3 className="font-heading text-xl font-medium mt-1 tracking-tight">Disease <span className="italic-display text-primary-deep">breakdown</span></h3>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {crops.map((crop) => (
          <button key={crop} onClick={() => setActiveCrop(crop)}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-all duration-200 ${activeCrop === crop ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70 hover:text-foreground"}`}>
            {crop}
          </button>
        ))}
      </div>
      <div className="relative h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={distribution} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" stroke="none" animationBegin={200} animationDuration={1200}>
              {distribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-heading font-medium tracking-tight">{total.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground italic-display">total cases</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {distribution.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
            <span className="text-muted-foreground truncate">{d.name}</span>
            <span className="ml-auto font-medium">{d.value}%</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
