import { useState, useEffect } from "react";

export function useGeolocation() {
  const [coords, setCoords] = useState<{ latitud: number | null; longitud: number | null }>({
    latitud: null,
    longitud: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }
    if (!navigator.geolocation) {
      setError("La geolocalización no está soportada por este navegador.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        let errorMsg = "Error desconocido de geolocalización.";
        if (err.code === 1) errorMsg = "Permiso de geolocalización denegado.";
        else if (err.code === 2) errorMsg = "Posición geográfica no disponible.";
        else if (err.code === 3) errorMsg = "Tiempo de espera agotado al obtener la ubicación.";
        
        console.error("Error getting geolocation:", { code: err.code, message: err.message });
        setError(errorMsg);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  return { coords, error, loading };
}
export default useGeolocation;
