import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("edushare_token"));
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("edushare_token");
  }, []);

  const bootstrap = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
    } catch (error) {
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth, token]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback((payload) => {
    const nextToken = payload?.token;
    if (!nextToken) {
      return;
    }

    localStorage.setItem("edushare_token", nextToken);
    setToken(nextToken);
    setUser(payload.user || null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      // Ignore backend logout failures and clear local auth anyway.
    }
    clearAuth();
  }, [clearAuth]);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === "admin",
      setUser,
      login,
      logout,
    }),
    [isLoading, login, logout, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
