import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import { supabase } from "@/integrations/supabase/client";
import "leaflet/dist/leaflet.css";

const districtCoords: Record<string, [number, number]> = {
  "Warangal": [17.9689, 79.5941],
  "Karimnagar": [18.4386, 79.1288],
  "Khammam": [17.2473, 80.1514],
  "Nalgonda": [17.0583, 79.2671],
  "Nizamabad": [18.6725, 78.0940],
  "Medak": [18.0538, 78.2620],
  "Adilabad": [19.6640, 78.5320],
  "Mahabubnagar": [16.7488, 77.9855],
  "Rangareddy": [17.2543, 78.2286],
  "Hyderabad": [17.3850, 78.4867],
  "Siddipet": [18.1019, 78.8520],
};

const COLOR_LOW = "#5fa848";
const COLOR_MED = "#ea7c1e";
const COLOR_HIGH = "#dc2626";

function getColor(cases: number): string {
  if (cases > 100) return COLOR_HIGH;
  if (cases > 20) return COLOR_MED;
  return COLOR_LOW;
}
function getRadius(cases: number): number {
  if (cases > 100) return 18;
  if (cases > 20) return 13;
  return 8;
}

type DistrictAgg = { name: string; cases: number; topDisease: string; trend: string; trendPct: number };

export default function MapPanel() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  const { data: districts = [] } = useQuery<DistrictAgg[]>({
    queryKey: ["map-districts"],
    queryFn: async () => {
      const { data } = await supabase.from("disease_reports").select("*");
      if (!data || data.length === 0) return [];
      const agg: Record<string, { cases: number; diseases: Record<string, number>; trends: string[]; trendPcts: number[] }> = {};
      data.forEach(r => {
        if (!agg[r.district]) agg[r.district] = { cases: 0, diseases: {}, trends: [], trendPcts: [] };
        agg[r.district].cases += r.cases;
        agg[r.district].diseases[r.disease] = (agg[r.district].diseases[r.disease] || 0) + r.cases;
        agg[r.district].trends.push(r.trend);
        agg[r.district].trendPcts.push(Number(r.trend_pct) || 0);
      });
      return Object.entries(agg).map(([name, d]) => ({
        name,
        cases: d.cases,
        topDisease: Object.entries(d.diseases).sort((a, b) => b[1] - a[1])[0]?.[0] || "",
        trend: d.trends.filter(t => t === "rising").length > d.trends.length / 2 ? "rising" : "falling",
        trendPct: Math.round(d.trendPcts.reduce((s, v) => s + v, 0) / d.trendPcts.length),
      }));
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    const map = L.map(mapRef.current, { center: [17.8, 78.8], zoom: 7, zoomControl: false, attributionControl: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    leafletMap.current = map;
    return () => { map.remove(); leafletMap.current = null; };
  }, []);

  useEffect(() => {
    if (!leafletMap.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    districts.forEach(d => {
      const coords = districtCoords[d.name];
      if (!coords) return;
      const color = getColor(d.cases);
      const circle = L.circleMarker(coords, { radius: getRadius(d.cases), color, fillColor: color, fillOpacity: 0.55, weight: 2 }).addTo(leafletMap.current!);
      const trendColor = d.trend === "rising" ? "#dc2626" : "#5fa848";
      const trendArrow = d.trend === "rising" ? "↑" : "↓";
      circle.bindTooltip(
        `<div style="font-family:Inter,sans-serif;background:#ffffff;border:1px solid #e5e2db;border-radius:10px;padding:8px 12px;color:#1c2c1f;box-shadow:0 8px 24px rgba(20,30,15,0.12)">
          <p style="font-weight:600;font-size:13px;margin:0">${d.name}</p>
          <p style="font-size:11px;color:#6b7568;margin:2px 0 0">${d.topDisease}</p>
          <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
            <span style="font-size:13px;font-weight:700">${d.cases} cases</span>
            <span style="font-size:11px;color:${trendColor}">${trendArrow} ${d.trendPct}%</span>
          </div>
        </div>`,
        { direction: "top", className: "leaflet-tooltip-custom", offset: [0, -8] }
      );
      markersRef.current.push(circle);
    });
  }, [districts]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="eyebrow">Live Map</span>
          <h3 className="font-heading text-2xl font-medium mt-1 tracking-tight">Telangana <span className="italic-display text-primary-deep">overview</span></h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="live-dot" />
          <span>Real-time • {districts.length} districts</span>
        </div>
      </div>
      <div ref={mapRef} className="relative z-0 rounded-xl overflow-hidden border border-border" style={{ height: 400 }} />
      <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: COLOR_LOW }} /><span>0–20 cases</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: COLOR_MED }} /><span>21–100 cases</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: COLOR_HIGH }} /><span>100+ cases</span></div>
      </div>
    </motion.div>
  );
}
