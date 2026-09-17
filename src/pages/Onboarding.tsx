import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Check,
  Zap,
  Building2,
  Sprout,
  ShieldCheck,
  Globe,
  Database,
  ArrowRight,
  ChevronLeft,
  Sparkles,
  CreditCard
} from "lucide-react";
import logo from "@/assets/kisan-logo.png";
import farmerImg from "@/assets/farmer.jpg";
import agribusinessImg from "@/assets/agribusiness.jpg";
import { toast } from "sonner";

export interface SubscriptionPlan {
  id: string;
  name: string;
  category: "farmer" | "industry" | "enterprise";
  monthlyPrice: string;
  annualPrice: string;
  period: string;
  description: string;
  popular?: boolean;
  features: string[];
  cta: string;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "plan-farmer",
    name: "Individual Farmer",
    category: "farmer",
    monthlyPrice: "Free",
    annualPrice: "Free",
    period: "Forever",
    description: "Essential real-time crop disease alerts and leaf scan diagnostics for local growers.",
    features: [
      "Real-time local mandal disease alerts",
      "AI mobile leaf scan diagnostic tool",
      "Recommended chemical & organic remedies",
      "Severe outbreak SMS & Push notifications"
    ],
    cta: "Continue Free"
  },
  {
    id: "plan-agribusiness",
    name: "Agribusiness Standard",
    category: "industry",
    monthlyPrice: "$49",
    annualPrice: "$39",
    period: "/ month",
    popular: true,
    description: "Built for seed suppliers, pesticide distributors, and regional agritech startups.",
    features: [
      "Everything in Farmer Free",
      "Mandal-level disease heatmaps & outbreak risk trends",
      "14-day predictive yield & disease spread forecasting",
      "Regional pesticide demand & inventory telemetry",
      "Up to 5 team member accounts",
      "Priority email & phone support"
    ],
    cta: "Start 14-Day Free Trial"
  },
  {
    id: "plan-enterprise",
    name: "Government & Enterprise API",
    category: "enterprise",
    monthlyPrice: "$199",
    annualPrice: "$159",
    period: "/ month",
    description: "Designed for state agricultural departments, crop insurers, and corporate processors.",
    features: [
      "Everything in Agribusiness Standard",
      "Real-time Esri Satellite GIS stream & NDVI crop stress overlay",
      "Snowflake Data Warehouse Direct SQL & REST API Access",
      "Early warning outbreak webhooks & telemetry feeds",
      "Unlimited team seat licenses",
      "Dedicated Agronomist & Technical Account Manager"
    ],
    cta: "Activate Enterprise Plan"
  }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStep = searchParams.get("step") === "plans" ? 2 : 1;

  const [step, setStep] = useState<number>(initialStep);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [selectedRole, setSelectedRole] = useState<"farmer" | "partner">("partner");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("plan-agribusiness");

  const handleRoleChoice = (role: "farmer" | "partner") => {
    setSelectedRole(role);
    if (role === "farmer") {
      localStorage.setItem("kisan_user_role", "farmer");
      localStorage.setItem("kisan_user_plan", "Free Farmer");
      toast.success("Set up as Individual Farmer");
      navigate("/");
    } else {
      setStep(2);
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlanId(plan.id);
    localStorage.setItem("kisan_user_role", plan.category);
    localStorage.setItem("kisan_user_plan", plan.name);
    localStorage.setItem("kisan_billing_cycle", billingCycle);

    toast.success(`Selected ${plan.name} (${billingCycle} billing)`);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="p-6 md:p-8 flex items-center justify-between border-b border-border/40">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 group">
          <img src={logo} alt="Kisan Farming" className="w-10 h-10 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform" />
          <span className="text-xl font-heading font-semibold text-primary">Kisan Farming</span>
        </button>

        {step === 2 && (
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Account Type
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 py-12">
        <div className="w-full max-w-6xl mx-auto">
          {/* STEP 1: ACCOUNT TYPE SELECTION */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <span className="eyebrow">Account Setup</span>
                <h1 className="text-3xl md:text-5xl font-heading font-medium text-foreground mt-2">
                  Welcome to Kisan Farming. <span className="italic-display text-primary-deep">Select your role:</span>
                </h1>
                <p className="text-muted-foreground text-sm mt-3 max-w-xl mx-auto">
                  Whether you cultivate fields or manage regional agricultural operations, we provide tailored intelligence for your needs.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                {/* Farmer Card */}
                <div
                  onClick={() => handleRoleChoice("farmer")}
                  className="bg-card p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-border flex flex-col hover:shadow-xl hover:border-primary/40 transition-all duration-300 cursor-pointer group hover:-translate-y-1"
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6 shadow-md group-hover:scale-105 transition-transform">
                    <img src={farmerImg} alt="Farmer" className="w-full h-full object-cover object-top" />
                  </div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Individual Grower</span>
                  <h3 className="text-2xl font-heading font-semibold mb-3 text-foreground">I am a Farmer</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-1">
                    Get real-time disease alerts, scan crop leaves with AI, and view recommended chemical & organic remedies.
                  </p>
                  <button className="w-full bg-primary text-primary-foreground py-3.5 rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <span>Continue as Farmer</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* B2B / Industry Card */}
                <div
                  onClick={() => handleRoleChoice("partner")}
                  className="bg-card p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-border flex flex-col hover:shadow-xl hover:border-primary/40 transition-all duration-300 cursor-pointer group hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="absolute top-4 right-4 px-3 py-1 bg-accent/20 text-accent-foreground rounded-full text-[10px] font-bold uppercase tracking-wider">
                    B2B & Enterprise
                  </div>
                  <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6 shadow-md group-hover:scale-105 transition-transform">
                    <img src={agribusinessImg} alt="Partner" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-semibold text-primary-deep uppercase tracking-wider mb-1">Industry & Agribusiness</span>
                  <h3 className="text-2xl font-heading font-semibold mb-3 text-foreground">I am an Industry Partner</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-1">
                    Access predictive yield forecasts, satellite heatmaps, inventory telemetry, and Snowflake SQL APIs.
                  </p>
                  <button className="w-full bg-primary text-primary-foreground py-3.5 rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <span>View Industry Plans</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: INDUSTRY SUBSCRIPTION MATRIX */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-center mb-10">
                <span className="eyebrow">Industry Subscription Plans</span>
                <h1 className="text-3xl md:text-5xl font-heading font-medium text-foreground mt-2">
                  Choose a Plan Built for <span className="italic-display text-primary-deep">Agribusiness Scale</span>
                </h1>
                <p className="text-muted-foreground text-sm mt-3 max-w-xl mx-auto">
                  Power your agricultural decisions with predictive heatmaps, satellite GIS layers, and automated outbreak APIs.
                </p>

                {/* MONTHLY / ANNUAL BILLING TOGGLE */}
                <div className="mt-8 inline-flex items-center gap-3 bg-secondary/80 p-1.5 rounded-full border border-border shadow-inner">
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                      billingCycle === "monthly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Monthly Billing
                  </button>

                  <button
                    onClick={() => setBillingCycle("annual")}
                    className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      billingCycle === "annual" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>Annual Billing</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                      SAVE 20%
                    </span>
                  </button>
                </div>
              </div>

              {/* SUBSCRIPTION CARDS MATRIX */}
              <div className="grid md:grid-cols-3 gap-8 items-stretch">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const isPopular = plan.popular;
                  const price = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;

                  return (
                    <div
                      key={plan.id}
                      className={`bg-card rounded-[2.2rem] p-8 border ${
                        isPopular ? "border-primary glow-green shadow-xl relative scale-102" : "border-border shadow-sm"
                      } flex flex-col justify-between transition-all duration-300 hover:shadow-2xl`}
                    >
                      {isPopular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold tracking-wider uppercase shadow-md flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Most Popular for Agribusiness
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-heading font-semibold text-2xl text-foreground">{plan.name}</h3>
                          {plan.category === "enterprise" && <Building2 className="w-6 h-6 text-primary" />}
                          {plan.category === "industry" && <Zap className="w-6 h-6 text-amber-500" />}
                          {plan.category === "farmer" && <Sprout className="w-6 h-6 text-emerald-500" />}
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                          {plan.description}
                        </p>

                        <div className="mb-6 pb-6 border-b border-border/60 flex items-baseline gap-1">
                          <span className="text-4xl font-heading font-bold text-foreground">{price}</span>
                          <span className="text-xs text-muted-foreground font-medium">{plan.period}</span>
                        </div>

                        {/* FEATURE LIST */}
                        <div className="space-y-3 mb-8">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">What's included:</span>
                          {plan.features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs text-foreground/90">
                              <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectPlan(plan)}
                        className={`w-full py-3.5 rounded-full font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                          isPopular
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                            : "bg-secondary hover:bg-secondary/80 text-foreground border border-border"
                        }`}
                      >
                        <span>{plan.cta}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* B2B FOOTER TRUST BADGE */}
              <div className="mt-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-6">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary" /> 14-Day Free Trial</span>
                <span className="flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-primary" /> No Credit Card Required for Demo</span>
                <span className="flex items-center gap-1.5"><Database className="w-4 h-4 text-primary" /> Snowflake SQL API Included</span>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-border/40 text-center text-xs text-muted-foreground max-w-3xl mx-auto px-6">
        <p className="mb-2">
          By continuing, you agree to Kisan Farming's Industry Terms of Service and Privacy Policy.
        </p>
      </footer>
    </div>
  );
}
