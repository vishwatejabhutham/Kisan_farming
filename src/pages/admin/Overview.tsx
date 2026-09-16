import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sprout, ShoppingBasket, Users, Shield } from "lucide-react";

function Kpi({ label, value, icon: Icon, tone = "primary" }: { label: string; value: number | string; icon: any; tone?: string }) {
  return (
    <div className="glass-card p-5 flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-3xl font-heading font-medium mt-2">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${tone}/10`}>
        <Icon className={`w-5 h-5 text-${tone}`} />
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const queryClient = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-roles-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role");
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles-recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, user_type, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("admin-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-roles-all"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-profiles-recent"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [queryClient]);

  const farmerCount = roles.filter((r: any) => r.role === "farmer").length;
  const consumerCount = roles.filter((r: any) => r.role === "consumer").length;
  const adminCount = roles.filter((r: any) => r.role === "admin").length;
  const totalUsers = new Set(roles.map((r: any) => (r as any).user_id)).size || profiles.length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <span className="eyebrow">Overview</span>
        <h1 className="text-3xl md:text-4xl font-heading font-medium tracking-tight mt-2">
          Platform <span className="italic-display text-primary-deep">activity</span>
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Active farmers" value={farmerCount} icon={Sprout} tone="primary" />
        <Kpi label="Active consumers" value={consumerCount} icon={ShoppingBasket} tone="warning" />
        <Kpi label="Total users" value={totalUsers} icon={Users} tone="primary" />
        <Kpi label="Admins" value={adminCount} icon={Shield} tone="destructive" />
      </div>

      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold mb-3">Recent signups</h2>
        {profiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No profiles yet.</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {profiles.map((p: any) => (
              <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium">{p.display_name || "—"}</span>
                <span className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-foreground/70">
                    {p.user_type || "unclassified"}
                  </span>
                  <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
