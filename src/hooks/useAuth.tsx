import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "viewer" | null;

type AuthCtx = {
  session: Session | null;
  role: Role;
  isAdmin: boolean;
  ready: boolean;
};

const AuthContext = createContext<AuthCtx>({
  session: null,
  role: null,
  isAdmin: false,
  ready: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      if (!next) setRole(null);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setReady(true);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    let active = true;
    supabase.rpc("ensure_my_role").then(({ data, error }) => {
      if (!active || error) return;
      setRole((data as Role) ?? "viewer");
    });
    return () => {
      active = false;
    };
  }, [session]);

  const value = useMemo<AuthCtx>(
    () => ({ session, role, isAdmin: role === "admin", ready }),
    [session, role, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
