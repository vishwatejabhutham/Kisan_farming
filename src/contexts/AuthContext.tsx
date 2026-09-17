import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkDemoUser = () => {
      try {
        const stored = localStorage.getItem("kisan_demo_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed.user as User);
          setSession((parsed.session || { user: parsed.user }) as Session);
          return true;
        }
      } catch (e) {
        console.error("Demo user parse error", e);
      }
      return false;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setSession(session);
          setUser(session.user);
        } else {
          checkDemoUser();
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
      } else {
        checkDemoUser();
      }
      setLoading(false);
    }).catch(() => {
      checkDemoUser();
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem("kisan_demo_user");
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.log("Supabase signout error ignored", e);
    }
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
