import { useState } from "react";
import { Bell, ChevronDown, User, LogOut, Shield } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/kisan-logo.png";

const tabs = [
  { label: "Home", path: "/" },
  { label: "Analytics", path: "/analytics" },
  { label: "Alerts", path: "/alerts" },
] as const;

const dateRanges = ["Last 7d", "Last 14d", "Last 30d"] as const;

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [dateRange, setDateRange] = useState<string>("Last 7d");
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { data: isAdmin } = useQuery({
    queryKey: ["nav-is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (user?.email?.toLowerCase().includes("admin")) {
        return true;
      }
      const { data } = await supabase
        .from("user_roles").select("role")
        .eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  const activeTab = tabs.find(t => t.path === location.pathname)?.label || "Home";

  return (
    <div className="sticky top-4 z-50 mx-4 lg:mx-8">
      <nav className="glass-card flex items-center justify-between pl-3 pr-3 py-2.5">
        {/* LOGO */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}>
          <img src={logo} alt="Kisan Farming" className="w-10 h-10 object-cover rounded-full shadow-sm" />
          <span className="text-lg font-heading font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">Kisan Farming</span>
        </div>

        {/* Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-secondary/70 rounded-full p-1">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => {
                if ((tab.path === "/analytics" || tab.path === "/alerts") && !user) {
                  navigate(`/auth?redirect=${tab.path}`);
                } else {
                  navigate(tab.path);
                }
              }}
              className={`pill-tab px-5 py-1.5 ${
                activeTab === tab.label ? "pill-tab-active" : "pill-tab-inactive"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full text-foreground/70 hover:text-foreground hover:bg-secondary transition-colors"
            >
              {dateRange}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showDateDropdown && (
              <div className="absolute top-full right-0 mt-2 glass-card p-1 min-w-[120px] z-50">
                {dateRanges.map((d) => (
                  <button
                    key={d}
                    onClick={() => { setDateRange(d); setShowDateDropdown(false); }}
                    className="block w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors"
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (!user) {
                navigate("/auth?redirect=/alerts");
              } else {
                navigate("/alerts");
              }
            }}
            className="relative p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <Bell className="w-5 h-5 text-foreground/70" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 rounded-full bg-primary-deep flex items-center justify-center"
              >
                <User className="w-4 h-4 text-white" />
              </button>
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 glass-card p-1 min-w-[180px] z-50">
                  <p className="px-3 py-1.5 text-xs text-muted-foreground truncate">{user.email}</p>
                  {isAdmin && (
                    <button
                      onClick={() => { navigate("/admin"); setShowUserMenu(false); }}
                      className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Admin
                    </button>
                  )}
                  <button
                    onClick={() => { signOut(); setShowUserMenu(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-secondary text-foreground/80 hover:text-foreground transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => navigate("/auth")} className="pill-cta !py-2 !px-4">
              Contact Us
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
