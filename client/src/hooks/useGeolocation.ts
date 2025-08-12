import { useEffect, useState, useCallback } from 'react';

interface GeoState {
  loading: boolean;
  error: string | null;
  coords: { latitude: number; longitude: number } | null;
  address: string | null; // Placeholder for future reverse geocode
}

export function useGeolocation(active: boolean = true) {
  const [state, setState] = useState<GeoState>({ loading: false, error: null, coords: null, address: null });

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState(s => ({ ...s, error: 'Geolocation not supported by this browser.' }));
      return;
    }
    setState(s => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        // Reverse geocoding can be added later. For now we just store coords.
        setState({ loading: false, error: null, coords: { latitude, longitude }, address: null });
      },
      err => {
        setState(s => ({ ...s, loading: false, error: err.message }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  useEffect(() => { if (active) request(); }, [active, request]);

  return { ...state, request };
}

export default useGeolocation;
