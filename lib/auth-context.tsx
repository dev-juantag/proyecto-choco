"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

interface User {
  id: string;
  nombre: string;
  apellidos: string;
  documento: string;
  email: string;
  rol: string;
  programaId?: string;
  territorioId?: string;
  territorioIds?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isFacturador: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const decodeToken = (tokenStr: string): User | null => {
    try {
      const base64Url = tokenStr.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const decoded = JSON.parse(jsonPayload);
      return {
        id: decoded.userId || decoded.id,
        nombre: decoded.nombre,
        apellidos: decoded.apellidos || "",
        documento: decoded.documento,
        email: decoded.email,
        rol: decoded.rol,
        programaId: decoded.programaId,
        territorioId: decoded.territorioId,
        territorioIds: decoded.territorioIds || []
      };
    } catch (e) {
      console.error("Error decoding token:", e);
      return null;
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("gestion-poblacional-token");
    if (savedToken) {
      const decodedUser = decodeToken(savedToken);
      if (decodedUser) {
        setToken(savedToken);
        setUser(decodedUser);
      } else {
        localStorage.removeItem("gestion-poblacional-token");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Error al iniciar sesión");
        return false;
      }

      if (data.token) {
        localStorage.setItem("gestion-poblacional-token", data.token);
        const decodedUser = decodeToken(data.token);
        setToken(data.token);
        setUser(decodedUser);
        toast.success("Sesión iniciada con éxito");
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.message || "Error en el servidor");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("gestion-poblacional-token");
    setToken(null);
    setUser(null);
    toast.success("Sesión cerrada");
  };

  const roleUpper = user?.rol?.toUpperCase() || "";
  const isAdmin = roleUpper === "ADMIN" || roleUpper === "SUPERADMIN";
  const isSuperAdmin = roleUpper === "SUPERADMIN";
  const isFacturador = roleUpper === "FACTURADOR";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAdmin,
        isSuperAdmin,
        isFacturador
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
