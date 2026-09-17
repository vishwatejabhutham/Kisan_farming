import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Layers, Globe, Sparkles, Navigation, Maximize2, Minimize2, X } from "lucide-react";
import { fetchFromBackend } from "@/lib/api";

const districtCoords: Record<string, [number, number]> = {
  Warangal: [17.9689, 79.5941],
  Karimnagar: [18.4386, 79.1288],
  Khammam: [17.2473, 80.1514],
  Nalgonda: [17.0583, 79.2671],
  Nizamabad: [18.6725, 78.0940],
  Medak: [18.0538, 78.2620],
  Adilabad: [19.6640, 78.5320],
  Mahabubnagar: [16.7488, 77.9855],
  Rangareddy: [17.2543, 78.2286],
  Hyderabad: [17.3850, 78.4867],
  Siddipet: [18.1019, 78.8520],
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
  return 9;
}

type DistrictAgg = {
  name: string;
  cases: number;
  topDisease: string;
  trend: string;
  trendPct: number;
};

// Tile Servers
const TILE_SERVERS = {
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  labels: "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  streets: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
};

export default function MapPanel() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const [mapMode, setMapMode] = useState<"satellite" | "hybrid" | "heatmap" | "streets">("satellite");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: districts = [] } = useQuery<DistrictAgg[]>({
    queryKey: ["map-districts"],
    queryFn: async () => {
      const data = await fetchFromBackend("/disease-reports");
      if (!data || data.length === 0) {
        // Fallback default districts if offline
        return [
          { name: "Warangal", cases: 145, topDisease: "Late Blight", trend: "rising", trendPct: 24 },
          { name: "Karimnagar", cases: 88, topDisease: "Yellow Leaf Curl", trend: "rising", trendPct: 18 },
          { name: "Adilabad", cases: 62, topDisease: "Bacterial Blight", trend: "stable", trendPct: 5 },
          { name: "Nalgonda", cases: 19, topDisease: "Brown Spot", trend: "falling", trendPct: -12 },
          { name: "Khammam", cases: 112, topDisease: "Groundnut Rust", trend: "rising", trendPct: 31 },
          { name: "Nizamabad", cases: 14, topDisease: "Yellow Rust", trend: "falling", trendPct: -8 },
          { name: "Medak", cases: 8, topDisease: "Chlorophyll Stress", trend: "stable", trendPct: 2 },
          { name: "Mahabubnagar", cases: 35, topDisease: "Turcicum Blight", trend: "rising", trendPct: 11 }
        ];
      }
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
        topDisease: Object.entries(d.diseases).sort((a, b) => b[1] - a[1])[0]?.[0] || "Crop Disease",
        trend: d.trends.filter(t => t === "rising").length > d.trends.length / 2 ? "rising" : "falling",
        trendPct: Math.round(d.trendPcts.reduce((s, v) => s + v, 0) / Math.max(d.trendPcts.length, 1)),
      }));
    },
    refetchInterval: 30000,
  });

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: [17.9, 78.9],
      zoom: 7,
      zoomControl: true,
      attributionControl: false,
    });

    // Default: Satellite Imagery Layer
    const baseTile = L.tileLayer(TILE_SERVERS.satellite, {
      maxZoom: 19,
      attribution: "Esri World Imagery"
    }).addTo(map);

    baseTileLayerRef.current = baseTile;
    markersRef.current = L.layerGroup().addTo(map);
    leafletMap.current = map;

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  // Update Map Tiles when mapMode changes
  useEffect(() => {
    if (!leafletMap.current) return;

    const map = leafletMap.current;

    // Remove existing tile layers
    if (baseTileLayerRef.current) map.removeLayer(baseTileLayerRef.current);
    if (labelsTileLayerRef.current) map.removeLayer(labelsTileLayerRef.current);

    if (mapMode === "satellite") {
      baseTileLayerRef.current = L.tileLayer(TILE_SERVERS.satellite, { maxZoom: 19 }).addTo(map);
    } else if (mapMode === "hybrid") {
      baseTileLayerRef.current = L.tileLayer(TILE_SERVERS.satellite, { maxZoom: 19 }).addTo(map);
      labelsTileLayerRef.current = L.tileLayer(TILE_SERVERS.labels, { maxZoom: 19 }).addTo(map);
    } else if (mapMode === "heatmap") {
      baseTileLayerRef.current = L.tileLayer(TILE_SERVERS.dark, { maxZoom: 19 }).addTo(map);
    } else {
      baseTileLayerRef.current = L.tileLayer(TILE_SERVERS.streets, { maxZoom: 19 }).addTo(map);
    }
  }, [mapMode]);

  // Update Markers & Heatmap Overlay
  useEffect(() => {
    if (!leafletMap.current || !markersRef.current) return;

    const group = markersRef.current;
    group.clearLayers();

    districts.forEach((d) => {
      const coords = districtCoords[d.name];
      if (!coords) return;

      const color = getColor(d.cases);
      const isCritical = d.cases > 100 || d.trend === "rising";

      // 1. Heat Halo / Gradient Disk
      const heatRadius = mapMode === "heatmap" ? Math.max(30, d.cases * 0.35) : 32;
      const heatHalo = L.circleMarker(coords, {
        radius: heatRadius,
        color: "transparent",
        fillColor: color,
        fillOpacity: mapMode === "heatmap" ? 0.45 : 0.25,
      });
      group.addLayer(heatHalo);

      // 2. Pulse Ring for Critical Outbreak Hotspots
      if (isCritical) {
        const pulseRing = L.circleMarker(coords, {
          radius: getRadius(d.cases) + 8,
          color: color,
          fill: false,
          weight: 1.5,
          opacity: 0.8,
        });
        group.addLayer(pulseRing);
      }

      // 3. Core Disease Outbreak Marker
      const coreMarker = L.circleMarker(coords, {
        radius: getRadius(d.cases),
        color: "#ffffff",
        fillColor: color,
        fillOpacity: 0.9,
        weight: 2,
      });

      const trendColor = d.trend === "rising" ? "#dc2626" : "#10b981";
      const trendArrow = d.trend === "rising" ? "↑" : "↓";

      coreMarker.bindTooltip(
        `<div style="font-family:Inter,sans-serif;background:#ffffff;border:1px solid #e5e2db;border-radius:12px;padding:10px 14px;color:#1c2c1f;box-shadow:0 10px 30px rgba(0,0,0,0.15);min-width:160px">
          <div style="display:flex;align-items:center;justify-between;gap:8px">
            <span style="font-weight:700;font-size:14px;color:#111827">${d.name} District</span>
            <span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:10px;background:${color}20;color:${color}">${d.cases > 100 ? "CRITICAL" : d.cases > 20 ? "MODERATE" : "LOW"}</span>
          </div>
          <p style="font-size:11px;color:#4b5563;margin:4px 0 0;font-weight:500">🦠 ${d.topDisease}</p>
          <div style="display:flex;align-items:center;justify-between;gap:8px;margin-top:6px;padding-top:6px;border-top:1px solid #f3f4f6">
            <span style="font-size:13px;font-weight:800;color:#111827">${d.cases} Reported Cases</span>
            <span style="font-size:11px;font-weight:700;color:${trendColor}">${trendArrow} ${d.trendPct}%</span>
          </div>
          <p style="font-size:10px;color:#9ca3af;margin-top:4px;font-style:italic">Coordinates: ${coords[0].toFixed(2)}°N, ${coords[1].toFixed(2)}°E</p>
        </div>`,
        { direction: "top", className: "leaflet-tooltip-custom", offset: [0, -10] }
      );

      group.addLayer(coreMarker);
    });
  }, [districts, mapMode]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
        setTimeout(() => {
          leafletMap.current?.invalidateSize();
        }, 150);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    setTimeout(() => {
      leafletMap.current?.invalidateSize();
    }, 150);
  };

  // Handle District Quick Jump
  const handleDistrictChange = (name: string) => {
    setSelectedDistrict(name);
    if (!leafletMap.current) return;

    if (name === "all") {
      leafletMap.current.flyTo([17.9, 78.9], 7, { duration: 1.2 });
    } else {
      const coords = districtCoords[name];
      if (coords) {
        leafletMap.current.flyTo(coords, 10, { duration: 1.2 });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={
        isFullscreen
          ? "fixed inset-0 z-50 p-4 sm:p-6 bg-background/95 backdrop-blur-2xl flex flex-col justify-between overflow-hidden shadow-2xl"
          : "glass-card p-6 flex flex-col gap-4 shadow-xl border border-border/80"
      }
    >
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-xs tracking-wider uppercase mb-1">
            <Globe className="w-4 h-4" />
            <span>High-Res Satellite Intelligence</span>
          </div>
          <h3 className="font-heading text-2xl font-medium tracking-tight text-foreground">
            Telangana Outbreak <span className="italic-display text-primary-deep">Satellite GIS Map</span>
          </h3>
        </div>

        {/* LAYER SWITCHER & FULLSCREEN CONTROLS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* MAP MODE PILLS */}
          <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl border border-border text-xs font-medium">
            <button
              onClick={() => setMapMode("satellite")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                mapMode === "satellite" ? "bg-primary text-primary-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Satellite
            </button>

            <button
              onClick={() => setMapMode("hybrid")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                mapMode === "hybrid" ? "bg-primary text-primary-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Hybrid
            </button>

            <button
              onClick={() => setMapMode("heatmap")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                mapMode === "heatmap" ? "bg-destructive text-destructive-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Heatmap
            </button>
          </div>

          {/* DISTRICT SELECTOR DROPDOWN */}
          <div className="flex items-center gap-1.5 bg-secondary/80 px-3 py-1.5 rounded-xl border border-border text-xs">
            <Navigation className="w-3.5 h-3.5 text-primary" />
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="bg-transparent border-none font-medium text-foreground focus:outline-none cursor-pointer"
            >
              <option value="all">Entire State (Telangana)</option>
              {Object.keys(districtCoords).map((d) => (
                <option key={d} value={d}>{d} District</option>
              ))}
            </select>
          </div>

          {/* FULLSCREEN TOGGLE BUTTON */}
          <button
            onClick={toggleFullscreen}
            className="px-3.5 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border shadow-sm transition-all flex items-center gap-1.5"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand Fullscreen"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Fullscreen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* LEAFLET SATELLITE MAP CONTAINER */}
      <div className="relative rounded-2xl overflow-hidden border border-border shadow-inner flex-1">
        <div ref={mapRef} className="z-0 w-full h-full" style={{ height: isFullscreen ? "calc(100vh - 175px)" : 420 }} />

        {/* MAP OVERLAY LIVE BADGE */}
        <div className="absolute top-3 left-3 z-10 bg-black/75 text-white backdrop-blur-md px-3 py-1.5 rounded-full text-xs flex items-center gap-2 border border-white/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold tracking-wide">ESRI Satellite Stream Active</span>
          <span className="text-white/60 font-mono text-[11px]">| {districts.length} Hotspots</span>
        </div>
      </div>

      {/* HEATMAP RISK LEGEND */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/60 text-xs text-muted-foreground">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm" />
            <span>Low Outbreak (0–20 cases)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-sm" />
            <span>Moderate Outbreak (21–100 cases)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-red-600 shadow-sm animate-pulse" />
            <span>Critical Outbreak (100+ cases)</span>
          </div>
        </div>

        <span className="text-[11px] text-muted-foreground/80 italic">
          🛰️ Esri High-Resolution Farmland Satellite Constellation
        </span>
      </div>
    </motion.div>
  );
}
