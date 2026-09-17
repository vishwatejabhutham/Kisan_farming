import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  X,
  MapPin,
  ArrowRight
} from "lucide-react";

export interface PlantDiseaseItem {
  id: string;
  title: string;
  crop: string;
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
  imageUrl: string;
  district: string;
  symptoms: string[];
  treatment: string[];
  description: string;
}

export const PLANT_DISEASES: PlantDiseaseItem[] = [
  {
    id: "pd-1",
    title: "Late Blight (Phytophthora infestans)",
    crop: "Tomato",
    severity: "critical",
    confidence: 98,
    imageUrl: "/images/plant-diseases/1.jpg",
    district: "Warangal",
    symptoms: [
      "Dark brown, water-soaked spots on foliage and stems",
      "White fungal growth on undersides during wet weather",
      "Rapid rot of infected plant tissue"
    ],
    treatment: [
      "Apply copper-based fungicides or Mancozeb immediately",
      "Ensure proper plant spacing and crop rotation",
      "Remove and destroy infected plant debris"
    ],
    description: "Devastating fungal-like pathogen affecting nightshade crops. High humidity accelerates spread across leaf surfaces."
  },
  {
    id: "pd-2",
    title: "Chilli Yellow Leaf Curl Virus",
    crop: "Chilli",
    severity: "high",
    confidence: 94,
    imageUrl: "/images/plant-diseases/2.jpg",
    district: "Karimnagar",
    symptoms: [
      "Upward cupping and puckering of young leaves",
      "Severe stunting of shoots and bushy appearance",
      "Yellowing along leaf veins and reduced pod yield"
    ],
    treatment: [
      "Control whitefly vector using sticky yellow traps & Neem oil",
      "Remove virus-infected plants to prevent field spread",
      "Plant vector-resistant seed varieties"
    ],
    description: "Vector-transmitted viral disease causing severe leaf curling and yield suppression in spice regions."
  },
  {
    id: "pd-3",
    title: "Paddy Brown Spot (Helminthosporium)",
    crop: "Paddy",
    severity: "medium",
    confidence: 91,
    imageUrl: "/images/plant-diseases/3.jpeg",
    district: "Nalgonda",
    symptoms: [
      "Oval or cylindrical brown spots on leaves with yellow halo",
      "Unfilled or discolored grains on panicles",
      "Seedling blight under nutrient deficient conditions"
    ],
    treatment: [
      "Apply balanced N-P-K fertilizers with adequate Potash",
      "Seed treatment with Carbendazim before sowing",
      "Foliar spray of Propiconazole if spot severity exceeds 10%"
    ],
    description: "Fungus prevalent in nutrient-deficient paddy fields, causing grain discoloration and foliar lesions."
  },
  {
    id: "pd-4",
    title: "Cotton Bacterial Blight (Xanthomonas)",
    crop: "Cotton",
    severity: "high",
    confidence: 95,
    imageUrl: "/images/plant-diseases/4.jpeg",
    district: "Adilabad",
    symptoms: [
      "Angular, dark green water-soaked spots on leaves",
      "Black arm symptoms on main stems and bolls",
      "Premature leaf drop and damaged cotton lint"
    ],
    treatment: [
      "Spray Streptocycline mixed with Copper Oxychloride",
      "Use acid-delinted certified disease-free seeds",
      "Avoid overhead sprinkler irrigation"
    ],
    description: "Bacterial infection causing angular leaf spots and black stem rot across rainfed cotton tracts."
  },
  {
    id: "pd-5",
    title: "Groundnut Rust (Puccinia arachidis)",
    crop: "Groundnut",
    severity: "critical",
    confidence: 97,
    imageUrl: "/images/plant-diseases/6.jpg",
    district: "Khammam",
    symptoms: [
      "Orange-red pustules on lower leaf surfaces",
      "Necrotic spots leading to premature defoliation",
      "Reduced pod weight and oil content"
    ],
    treatment: [
      "Apply Chlorothalonil or Tebuconazole foliar spray",
      "Maintain crop hygiene and remove volunteer plants",
      "Implement 3-year crop rotation with non-host cereals"
    ],
    description: "Fungal rust causing rapid defoliation and severe pod loss under warm, humid conditions."
  },
  {
    id: "pd-6",
    title: "Wheat Yellow Rust (Puccinia striiformis)",
    crop: "Wheat",
    severity: "high",
    confidence: 92,
    imageUrl: "/images/plant-diseases/7.jpg",
    district: "Nizamabad",
    symptoms: [
      "Bright yellow stripes of uredinia parallel to leaf veins",
      "Powdery yellow spores rubbing off on touch",
      "Shriveled grains and early plant senescence"
    ],
    treatment: [
      "Foliar spray of Propiconazole or Azoxystrobin",
      "Grow rust-resistant wheat cultivars",
      "Monitor early morning dew formation for early warnings"
    ],
    description: "Airborne fungal spore outbreak spreading in linear yellow stripes on leaves during cool mornings."
  },
  {
    id: "pd-7",
    title: "Maize Turcicum Leaf Blight",
    crop: "Maize",
    severity: "medium",
    confidence: 89,
    imageUrl: "/images/plant-diseases/9.webp",
    district: "Mahbubnagar",
    symptoms: [
      "Long elliptical greyish-brown lesions on leaves",
      "Charcoal-like dark fungal spores inside mature spots",
      "Premature drying of husks and reduced ear filling"
    ],
    treatment: [
      "Spray Mancozeb 75 WP at initial disease appearance",
      "Practice deep summer plowing to bury crop residues",
      "Avoid high plant population densities"
    ],
    description: "Elliptical leaf lesion disease common in humid maize growing micro-climates."
  },
  {
    id: "pd-8",
    title: "High-Resolution Leaf Diagnostic Scan",
    crop: "Paddy",
    severity: "low",
    confidence: 99,
    imageUrl: "/images/plant-diseases/leaf.jpeg",
    district: "Medak",
    symptoms: [
      "Multi-spectral leaf surface analysis",
      "Early chlorophyll degradation detection",
      "Microscopic lesion pattern mapping"
    ],
    treatment: [
      "Field monitoring recommended every 7 days",
      "Maintain optimum water depth of 2-5 cm",
      "No chemical intervention required at current stage"
    ],
    description: "AI-assisted multi-spectral leaf scan pinpointing early physiological stress prior to visual symptoms."
  }
];

const severityConfig = {
  critical: { label: "Critical", bg: "bg-red-500/10 text-red-600 border-red-500/30" },
  high: { label: "High Risk", bg: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
  medium: { label: "Moderate", bg: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  low: { label: "Low / Monitored", bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" }
};

export default function DiseaseImageScroller() {
  const [selectedCrop, setSelectedCrop] = useState<string>("All");
  const [activeModalItem, setActiveModalItem] = useState<PlantDiseaseItem | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const crops = ["All", ...Array.from(new Set(PLANT_DISEASES.map((item) => item.crop)))];

  const filteredItems = selectedCrop === "All"
    ? PLANT_DISEASES
    : PLANT_DISEASES.filter((item) => item.crop === selectedCrop);

  // Auto scroll effect
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollRef.current.scrollBy({ left: 340, behavior: "smooth" });
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -380 : 380;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="max-w-[1320px] mx-auto px-4 lg:px-8 py-12 my-6">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-xs tracking-wider uppercase mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>AI Field Diagnostics</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-semibold text-foreground tracking-tight">
            Identified Plant Diseases <span className="italic-display text-primary">& Scans</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-xl">
            Explore high-resolution field scans collected across Telangana. Scroll left or right to inspect disease profiles, AI confidence ratings, and field recommendations.
          </p>
        </div>

        {/* CONTROLS: Crop filter pills + Navigation arrows */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {crops.map((crop) => (
              <button
                key={crop}
                onClick={() => setSelectedCrop(crop)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  selectedCrop === crop
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary/80 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {crop}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
            <button
              onClick={() => handleScroll("left")}
              className="p-2.5 rounded-full bg-card hover:bg-secondary text-foreground border border-border shadow-sm hover:scale-105 active:scale-95 transition-all"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              className="p-2.5 rounded-full bg-card hover:bg-secondary text-foreground border border-border shadow-sm hover:scale-105 active:scale-95 transition-all"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* HORIZONTAL SCROLL TRACK */}
      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex items-stretch gap-6 overflow-x-auto pb-6 pt-2 scrollbar-none snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {filteredItems.map((item, index) => {
          const config = severityConfig[item.severity];

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => setActiveModalItem(item)}
              className="group flex-shrink-0 w-[300px] sm:w-[340px] snap-start bg-card rounded-[1.75rem] border border-border/80 hover:border-primary/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1.5"
            >
              {/* IMAGE CONTAINER */}
              <div className="relative h-56 w-full overflow-hidden bg-muted">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* BADGES ON IMAGE */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border backdrop-blur-md ${config.bg}`}>
                    {config.label}
                  </span>
                  <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-black/60 text-white backdrop-blur-md flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-primary" />
                    {item.district}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span className="p-2 rounded-full bg-black/50 text-white/90 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-4 h-4" />
                  </span>
                </div>

                {/* BOTTOM OVERLAY INFO ON IMAGE */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                  <span className="bg-primary text-primary-foreground font-semibold px-2.5 py-0.5 rounded-md text-[11px]">
                    {item.crop}
                  </span>
                  <span className="font-mono text-emerald-400 font-bold bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                    {item.confidence}% Match
                  </span>
                </div>
              </div>

              {/* CARD CONTENT */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-primary font-medium">
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Diagnostics <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[11px] text-muted-foreground font-normal">Tap to inspect</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* LIGHTBOX DIAGNOSTIC MODAL */}
      <AnimatePresence>
        {activeModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-card border border-border rounded-[2.2rem] max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              {/* CLOSE BUTTON */}
              <button
                onClick={() => setActiveModalItem(null)}
                className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                {/* MODAL LEFT: FULL IMAGE */}
                <div className="md:col-span-6 relative h-64 md:h-auto min-h-[280px] bg-muted overflow-hidden">
                  <img
                    src={activeModalItem.imageUrl}
                    alt={activeModalItem.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="px-3 py-1 bg-primary text-primary-foreground font-bold rounded-full text-xs uppercase tracking-wide">
                      {activeModalItem.crop} Crop
                    </span>
                    <h4 className="text-xl font-heading font-semibold mt-2 drop-shadow-md">
                      {activeModalItem.title}
                    </h4>
                  </div>
                </div>

                {/* MODAL RIGHT: DETAILS & REMEDIATION */}
                <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${severityConfig[activeModalItem.severity].bg}`}>
                        {severityConfig[activeModalItem.severity].label}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> {activeModalItem.district} District
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                      {activeModalItem.description}
                    </p>

                    {/* AI CONFIDENCE SCORE BAR */}
                    <div className="mt-4 p-3 bg-secondary/50 rounded-xl border border-border">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="flex items-center gap-1 text-foreground">
                          <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Identification Confidence
                        </span>
                        <span className="text-primary font-mono">{activeModalItem.confidence}%</span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${activeModalItem.confidence}%` }}
                        />
                      </div>
                    </div>

                    {/* SYMPTOMS LIST */}
                    <div className="mt-5">
                      <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" /> Observed Symptoms
                      </h5>
                      <ul className="space-y-1.5">
                        {activeModalItem.symptoms.map((symptom, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                            <span>{symptom}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* TREATMENT & ACTION PLAN */}
                    <div className="mt-5">
                      <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Recommended Action Plan
                      </h5>
                      <ul className="space-y-1.5">
                        {activeModalItem.treatment.map((treatment, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                            <span>{treatment}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex justify-end">
                    <button
                      onClick={() => setActiveModalItem(null)}
                      className="px-6 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                    >
                      Done Inspecting
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
