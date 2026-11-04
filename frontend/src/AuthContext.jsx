import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!getToken()) {
        setReady(true);
        return;
      }
      try {
        const data = await api("/api/auth/me");
        if (!cancelled) setUser(data.user);
      } catch {
        setToken(null);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      async login(username, password) {
        const data = await api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        });
        setToken(data.token);
        setUser(data.user);
        return data.user;
      },
      logout() {
        setToken(null);
        setUser(null);
      },
    }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
