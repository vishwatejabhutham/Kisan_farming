import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type UserType = "farmer" | "consumer" | "none";

export default function AdminRoles() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [q, setQ] = useState("");

  const { data: profiles = [] } = useQuery({
    queryKey: ["roles-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, user_type")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["roles-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data;
    },
  });

  const rolesByUser = useMemo(() => {
    const m = new Map<string, Set<string>>();
    roles.forEach((r: any) => {
      if (!m.has(r.user_id)) m.set(r.user_id, new Set());
      m.get(r.user_id)!.add(r.role);
    });
    return m;
  }, [roles]);

  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      if (userId === user?.id && !makeAdmin) throw new Error("You cannot revoke your own admin role");
      if (makeAdmin) {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-list"] });
      toast.success("Admin role updated");
    },
    onError: (e: any) => toast.error(e.message || "Failed to update role"),
  });

  const setUserType = useMutation({
    mutationFn: async ({ userId, type }: { userId: string; type: UserType }) => {
      // Update profile.user_type
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ user_type: type === "none" ? null : type })
        .eq("user_id", userId);
      if (pErr) throw pErr;
      // Sync role: remove old farmer/consumer, add new
      await supabase.from("user_roles").delete().eq("user_id", userId).in("role", ["farmer", "consumer"]);
      if (type !== "none") {
        const { error: rErr } = await supabase.from("user_roles").insert({ user_id: userId, role: type });
        if (rErr) throw rErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["roles-list"] });
      toast.success("User type updated");
    },
    onError: (e: any) => toast.error(e.message || "Failed to update type"),
  });

  const filtered = profiles.filter((p: any) =>
    !q || (p.display_name || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <span className="eyebrow">Access control</span>
        <h1 className="text-3xl md:text-4xl font-heading font-medium tracking-tight mt-2">
          Manage <span className="italic-display text-primary-deep">roles</span>
        </h1>
      </div>

      <Input
        placeholder="Search by name…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-sm"
      />

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>User type</TableHead>
              <TableHead className="text-center">Admin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No users</TableCell></TableRow>
            ) : filtered.map((p: any) => {
              const userRoles = rolesByUser.get(p.user_id) || new Set();
              const isAdmin = userRoles.has("admin");
              const currentType: UserType = p.user_type || "none";
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.display_name || "—"}</TableCell>
                  <TableCell>
                    <Select
                      value={currentType}
                      onValueChange={(v) => setUserType.mutate({ userId: p.user_id, type: v as UserType })}
                    >
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unclassified</SelectItem>
                        <SelectItem value="farmer">Farmer</SelectItem>
                        <SelectItem value="consumer">Consumer</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={isAdmin}
                      onCheckedChange={(v) => toggleAdmin.mutate({ userId: p.user_id, makeAdmin: v })}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
