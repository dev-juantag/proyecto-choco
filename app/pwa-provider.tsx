"use client";

import { useEffect, useState } from "react";
import SyncManager from "@/lib/sync-manager";
import { toast } from "sonner";
import { Wifi, WifiOff } from "lucide-react";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      toast("Conexión restaurada", {
        icon: <Wifi className="h-5 w-5 text-emerald-500" />,
        description: "Intentando sincronizar datos pendientes..."
      });
      SyncManager.processQueue().catch(console.error);
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast("Modo fuera de línea", {
        icon: <WifiOff className="h-5 w-5 text-amber-500" />,
        description: "El sistema continuará guardando la información localmente."
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Register Service Worker (Solo en producción para evitar conflictos de caché HMR en desarrollo)
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Service Worker registrado con éxito:", reg.scope);
          })
          .catch((err) => {
            console.error("Error al registrar el Service Worker:", err);
          });
      } else {
        // Desregistrar service workers activos en desarrollo para limpiar la caché de Turbopack/HMR
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().then((success) => {
              if (success) console.log("Service Worker des-registrado para desarrollo para evitar conflictos HMR.");
            });
          }
        });
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return <>{children}</>;
}
export default PWAProvider;
