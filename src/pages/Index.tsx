import { motion } from "framer-motion";
import { ArrowUpRight, Users, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/dashboard/Navbar";
import StatsRow from "@/components/dashboard/StatsRow";
import MapPanel from "@/components/dashboard/MapPanel";
import TrendChart from "@/components/dashboard/TrendChart";
import OutbreakList from "@/components/dashboard/OutbreakList";
import DiseaseDonut from "@/components/dashboard/DiseaseDonut";
import AlertFeed from "@/components/dashboard/AlertFeed";
import InventoryRow from "@/components/dashboard/InventoryRow";
import heroWheat from "@/assets/hero-wheat.jpg";
import farmer from "@/assets/farmer-field.jpg";
import logo from "@/assets/kisan-logo.png";
import agribusinessImg from "@/assets/agribusiness.jpg";
import governmentImg from "@/assets/government.jpg";
import farmerImg from "@/assets/farmer.jpg";
import dataInsightsImg from "@/assets/data-insights.jpg";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="px-4 lg:px-8 mt-4">
        <div className="relative rounded-[2rem] overflow-hidden shadow-xl">
          <img
            src={heroWheat}
            alt="Wheat field at golden hour"
            width={1920}
            height={1280}
            className="w-full h-[78vh] min-h-[560px] object-cover"
          />
          {/* Subtle gradient for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/10" />

          {/* Hero copy */}
          <div className="absolute inset-0 flex flex-col justify-end p-8 lg:p-14">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="max-w-3xl"
            >
              <motion.h1 variants={fadeUp} className="text-white text-5xl md:text-7xl font-heading font-medium leading-[0.95] tracking-tight">
                Smart Farming for
                <br />
                <span className="italic-display">Future Generations</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-white/85 text-base md:text-lg max-w-xl mt-6 leading-relaxed">
                Real-time crop disease intelligence built on satellite scans, field
                reports, and predictive AI — protecting harvests across Telangana.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8 bg-white p-2 rounded-[1.25rem] flex items-center w-full max-w-md shadow-2xl">
                <input type="text" placeholder="Enter Mandal or District" className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 px-4 text-foreground placeholder:text-muted-foreground font-medium" />
                <button onClick={() => navigate("/analytics")} className="bg-accent text-accent-foreground px-8 py-3.5 rounded-xl font-semibold hover:bg-accent/90 transition-colors shadow-sm">
                  Search
                </button>
              </motion.div>
            </motion.div>

            {/* bottom hero strip */}
            <div className="flex items-end justify-between mt-10 text-white/90 text-xs">
              <div className="flex items-center gap-2 tracking-widest">
                <span>SCROLL</span>
                <span className="inline-block w-3 h-[1px] bg-white/60" />
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-4 h-4 fill-primary stroke-primary" />
                <span className="font-semibold text-sm">4.9</span>
                <span className="hidden sm:flex items-center gap-1.5 ml-3">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">10k+ Farmers</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES STRIP */}
      <section className="max-w-[1320px] mx-auto px-4 lg:px-8 mt-16 text-center">
        <h2 className="text-2xl md:text-3xl font-heading font-semibold mb-10 text-foreground">One platform for every agricultural need</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { title: "For Farmers", icon: farmerImg, desc: "Live disease alerts", imgClass: "object-top" },
            { title: "Agribusiness", icon: agribusinessImg, desc: "Predictive forecasts", imgClass: "object-center" },
            { title: "Government", icon: governmentImg, desc: "Early-warning API", imgClass: "object-contain p-2" },
            { title: "Data Insights", icon: dataInsightsImg, desc: "Mandal-level heatmaps", imgClass: "object-center" },
          ].map((cat, i) => (
            <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="bg-card p-6 rounded-[2rem] shadow-sm border border-border hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center gap-4 cursor-pointer overflow-hidden">
              <div className="w-full h-32 rounded-xl overflow-hidden mb-2 bg-white">
                <img src={cat.icon} alt={cat.title} className={`w-full h-full ${cat.imgClass === 'object-contain p-2' ? 'object-contain p-2' : 'object-cover ' + cat.imgClass}`} />
              </div>
              <div>
                <h4 className="font-heading font-semibold text-lg text-foreground">{cat.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{cat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* DASHBOARD */}
      <motion.main
        className="max-w-[1320px] mx-auto px-4 lg:px-8 py-16 space-y-10"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.div variants={fadeUp} className="flex items-end justify-between gap-6">
          <div>
            <span className="eyebrow">Live Intelligence</span>
            <h2 className="text-3xl md:text-5xl font-heading font-medium leading-tight mt-3 text-foreground">
              Smart Farming Made
              <br />
              <span className="italic-display">Simple and Efficient</span>
            </h2>
          </div>
          <p className="hidden md:block text-sm text-muted-foreground max-w-sm leading-relaxed">
            A connected platform linking soil, crops, and operations — helping farmers grow more efficiently and safely.
          </p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <StatsRow />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <motion.div variants={fadeUp}><MapPanel /></motion.div>
            <motion.div variants={fadeUp}><TrendChart /></motion.div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <motion.div variants={fadeUp}><OutbreakList /></motion.div>
            <motion.div variants={fadeUp}><DiseaseDonut /></motion.div>
            <motion.div variants={fadeUp}><AlertFeed /></motion.div>
          </div>
        </div>

        <motion.div variants={fadeUp}>
          <InventoryRow />
        </motion.div>
      </motion.main>

      {/* CLOSING IMAGE BAND */}
      <section className="max-w-[1320px] mx-auto px-4 lg:px-8 pb-20">
        <div className="relative rounded-[2rem] overflow-hidden">
          <img
            src={farmer}
            alt="Farmer surveying their field at sunset"
            width={1280}
            height={896}
            loading="lazy"
            className="w-full h-[420px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center p-10 lg:p-16 max-w-xl">
            <span className="text-white/80 eyebrow !text-white/70 before:!bg-primary">Real Stories</span>
            <h3 className="text-white text-3xl md:text-5xl font-heading font-medium leading-tight mt-4">
              Real Stories Shared
              <br />
              <span className="italic-display">by Our Farmers</span>
            </h3>
            <p className="text-white/80 mt-4 max-w-md leading-relaxed">
              Hear from farmers who use Kisan Farming every day to protect their fields and harvests.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-[1320px] mx-auto px-4 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" width={20} height={20} className="w-5 h-5 opacity-70 rounded-full" />
            <span>© {new Date().getFullYear()} Kisan Farming. Cultivating clarity.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
