import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b border-border/60 px-4 bg-card/40 backdrop-blur">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <button onClick={() => navigate("/")} className="text-sm font-heading font-medium tracking-tight hover:text-primary-deep transition-colors">
                Kisan Farming <span className="text-muted-foreground">/ Admin</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full hover:bg-secondary text-foreground/70 hover:text-foreground transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>
          </header>
          <main className="flex-1 p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
