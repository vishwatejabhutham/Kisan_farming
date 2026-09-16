export type District = {
  name: string;
  cases: number;
  topDisease: string;
  trend: "rising" | "falling" | "stable";
  trendPct: number;
  mandal?: string;
};

export type OutbreakZone = {
  district: string;
  mandal: string;
  disease: string;
  cases: number;
  trend: "rising" | "falling";
  daysLead: number;
  crop: string;
};

export type Alert = {
  id: string;
  severity: "critical" | "high" | "medium";
  text: string;
  timestamp: string;
  details?: string;
};

export type InventoryRec = {
  product: string;
  district: string;
  mandal: string;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM";
  stockUnits: number;
  estimatedDemand: number;
  confidence: number;
};

export const districts: District[] = [
  { name: "Warangal", cases: 312, topDisease: "Late Blight", trend: "rising", trendPct: 34 },
  { name: "Karimnagar", cases: 245, topDisease: "Leaf Curl", trend: "rising", trendPct: 18 },
  { name: "Khammam", cases: 189, topDisease: "Whitefly Infestation", trend: "falling", trendPct: 7 },
  { name: "Nalgonda", cases: 156, topDisease: "Stem Rot", trend: "rising", trendPct: 12 },
  { name: "Nizamabad", cases: 134, topDisease: "Rust", trend: "falling", trendPct: 5 },
  { name: "Medak", cases: 98, topDisease: "Late Blight", trend: "stable", trendPct: 2 },
  { name: "Adilabad", cases: 87, topDisease: "Leaf Curl", trend: "falling", trendPct: 11 },
  { name: "Mahabubnagar", cases: 67, topDisease: "Whitefly Infestation", trend: "rising", trendPct: 22 },
  { name: "Rangareddy", cases: 45, topDisease: "Stem Rot", trend: "falling", trendPct: 3 },
  { name: "Hyderabad", cases: 34, topDisease: "Rust", trend: "stable", trendPct: 1 },
  { name: "Siddipet", cases: 19, topDisease: "Late Blight", trend: "falling", trendPct: 9 },
];

export const outbreakZones: OutbreakZone[] = [
  { district: "Warangal", mandal: "Hanamkonda", disease: "Late Blight", cases: 312, trend: "rising", daysLead: 7, crop: "Tomato" },
  { district: "Karimnagar", mandal: "Jagtial", disease: "Leaf Curl", cases: 245, trend: "rising", daysLead: 5, crop: "Chilli" },
  { district: "Khammam", mandal: "Kothagudem", disease: "Whitefly Infestation", cases: 189, trend: "falling", daysLead: 3, crop: "Cotton" },
  { district: "Nalgonda", mandal: "Miryalaguda", disease: "Stem Rot", cases: 156, trend: "rising", daysLead: 6, crop: "Rice" },
  { district: "Nizamabad", mandal: "Bodhan", disease: "Rust", cases: 134, trend: "falling", daysLead: 4, crop: "Groundnut" },
  { district: "Medak", mandal: "Sangareddy", disease: "Late Blight", cases: 98, trend: "rising", daysLead: 2, crop: "Tomato" },
];

export const alerts: Alert[] = [
  { id: "1", severity: "critical", text: "Late blight crossed 200 cases in Warangal", timestamp: "14 min ago", details: "Rapid spread detected in Hanamkonda mandal. Mancozeb stocks running low at 3 distribution centers." },
  { id: "2", severity: "critical", text: "Whitefly resistance detected in Khammam district", timestamp: "28 min ago", details: "Imidacloprid showing <40% efficacy. Recommend switching to Spiromesifen-based formulations." },
  { id: "3", severity: "high", text: "Leaf curl spreading rapidly in Karimnagar — Jagtial mandal", timestamp: "1 hr ago", details: "124 new cases in last 48 hours. Wind patterns suggest eastward spread." },
  { id: "4", severity: "high", text: "Stem rot risk elevated in Nalgonda paddy fields", timestamp: "2 hr ago", details: "Soil moisture levels above threshold. Preventive Carbendazim application recommended." },
  { id: "5", severity: "medium", text: "Rust early signs observed in Nizamabad groundnut crops", timestamp: "3 hr ago", details: "Low severity currently. Monitoring recommended for next 72 hours." },
];

export const inventoryRecs: InventoryRec[] = [
  { product: "Mancozeb 75% WP", district: "Warangal", mandal: "Hanamkonda", urgency: "CRITICAL", stockUnits: 2400, estimatedDemand: 3100, confidence: 87 },
  { product: "Imidacloprid 17.8% SL", district: "Khammam", mandal: "Kothagudem", urgency: "HIGH", stockUnits: 1800, estimatedDemand: 2200, confidence: 79 },
  { product: "Carbendazim 50% WP", district: "Nalgonda", mandal: "Miryalaguda", urgency: "MEDIUM", stockUnits: 950, estimatedDemand: 1100, confidence: 72 },
];

export const diseaseDistribution = [
  { name: "Late Blight", value: 34, color: "#00FF88" },
  { name: "Leaf Curl", value: 28, color: "#00B4D8" },
  { name: "Whitefly", value: 18, color: "#F5A623" },
  { name: "Stem Rot", value: 12, color: "#FF4D4D" },
  { name: "Other", value: 8, color: "#6366F1" },
];

export const crops = ["All", "Tomato", "Chilli", "Cotton", "Rice", "Groundnut"] as const;
export type Crop = (typeof crops)[number];

const days = ["Apr 7","Apr 8","Apr 9","Apr 10","Apr 11","Apr 12","Apr 13","Today","Apr 15","Apr 16","Apr 17","Apr 18","Apr 19","Apr 20"];

export const trendData = days.map((day, i) => ({
  day,
  lateBlight: i < 8 ? 40 + Math.round(Math.sin(i * 0.8) * 15 + i * 4) : 40 + Math.round(Math.sin(i * 0.8) * 15 + i * 4.5),
  leafCurl: i < 8 ? 25 + Math.round(Math.cos(i * 0.6) * 10 + i * 3) : 25 + Math.round(Math.cos(i * 0.6) * 10 + i * 3.2),
  stemRot: i < 8 ? 15 + Math.round(Math.sin(i * 0.4) * 8 + i * 2) : 15 + Math.round(Math.sin(i * 0.4) * 8 + i * 1.5),
  isForecast: i >= 8,
}));

export const heroStats = [
  { label: "Total Scans This Week", value: 12847, prefix: "", suffix: "", trend: 23, trendDir: "up" as const },
  { label: "Active Disease Outbreaks", value: 34, prefix: "", suffix: "", trend: 8, trendDir: "up" as const, trendLabel: "new" },
  { label: "Districts Affected", value: 18, prefix: "", suffix: " / 33", trend: 0, trendDir: "up" as const, isWarning: true },
  { label: "Highest Risk Zone", value: 0, prefix: "", suffix: "", trend: 0, trendDir: "up" as const, textValue: "Warangal", isAlert: true },
];
