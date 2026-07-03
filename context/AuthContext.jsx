"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    console.log("fetchUser started");

    try {
      const res = await api.get("/auth/me");
      console.log("/auth/me SUCCESS", res.data);

      setUser(res.data.user);
    } catch (err) {
      console.log(
        "/auth/me FAILED",
        err?.response?.status,
        err?.response?.data,
      );
      setUser(null);
    } finally {
      console.log("fetchUser finished");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (_) {}
    setUser(null);
    sessionStorage.removeItem("smarterp_company");
    window.location.href = "/login";
  };

  console.log("AuthProvider", {
    loading,
    user,
  });
  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, logout, refetch: fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
