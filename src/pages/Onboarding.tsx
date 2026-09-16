import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/kisan-logo.png";
import farmerImg from "@/assets/farmer.jpg";
import agribusinessImg from "@/assets/agribusiness.jpg";

export default function Onboarding() {
  const navigate = useNavigate();

  const handleRoleSelect = (role: string) => {
    // In a real app, we'd update user profile in Supabase here
    console.log("Selected role:", role);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <header className="p-6 md:p-8 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <img src={logo} alt="Kisan Farming" className="w-10 h-10 rounded-full object-cover shadow-sm" />
          <span className="text-xl font-heading font-semibold text-primary">Kisan Farming</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl mx-auto"
        >
          <h1 className="text-3xl md:text-5xl font-heading font-medium text-center text-foreground mb-12">
            Let's get started. Choose an option:
          </h1>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-3xl mx-auto">
            {/* Farmer Card */}
            <div className="bg-card p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-border flex flex-col hover:shadow-lg hover:border-primary/20 transition-all duration-300">
              <div className="w-24 h-24 rounded-2xl overflow-hidden mb-8 shadow-sm">
                <img src={farmerImg} alt="Farmer" className="w-full h-full object-cover object-top" />
              </div>
              <h3 className="text-2xl font-heading font-semibold mb-3">I am a Farmer</h3>
              <p className="text-muted-foreground text-lg mb-10 flex-1">
                Get real-time disease alerts, scan your crops, and find the right treatments.
              </p>
              <button 
                onClick={() => handleRoleSelect("farmer")}
                className="w-full bg-primary text-primary-foreground py-4 rounded-full font-semibold text-lg hover:bg-primary/90 transition-colors"
              >
                Continue as Farmer
              </button>
            </div>

            {/* B2B Card */}
            <div className="bg-card p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-border flex flex-col hover:shadow-lg hover:border-primary/20 transition-all duration-300">
              <div className="w-24 h-24 rounded-2xl overflow-hidden mb-8 shadow-sm">
                <img src={agribusinessImg} alt="Partner" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-2xl font-heading font-semibold mb-3">I am a Partner</h3>
              <p className="text-muted-foreground text-lg mb-10 flex-1">
                Access predictive B2B forecasts, monitor regional heatmaps, and manage inventory.
              </p>
              <button 
                onClick={() => handleRoleSelect("partner")}
                className="w-full bg-primary text-primary-foreground py-4 rounded-full font-semibold text-lg hover:bg-primary/90 transition-colors"
              >
                Continue as Partner
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground max-w-3xl mx-auto px-6">
        <p className="mb-4">
          By continuing, you agree to Kisan Farming's Terms of Use and acknowledge you've read our Privacy Policy.
        </p>
        <div className="flex items-center justify-center gap-6">
          <a href="#" className="hover:text-foreground transition-colors">Terms of Use</a>
          <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-foreground transition-colors">Safety</a>
        </div>
      </footer>
    </div>
  );
}
