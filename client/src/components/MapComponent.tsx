import React, { useEffect, useRef, useState } from 'react';
import './MapComponent.css';

interface MapComponentProps {
  customerLocation: { latitude: number; longitude: number; address?: string };
  technicianLocation?: { latitude: number; longitude: number; address?: string } | null;
  onTechnicianLocationUpdate?: (location: { latitude: number; longitude: number; address?: string }) => void;
  isTracking?: boolean;
  onStartNavigation?: () => void;
  height?: string | number;
  zoom?: number;
}

declare global {
  interface Window { google?: any; }
}

const loadGoogleMaps = (apiKey: string): Promise<typeof window.google> => {
  if (window.google && window.google.maps) return Promise.resolve(window.google);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-gmaps]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-gmaps','1');
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const MapComponent: React.FC<MapComponentProps> = ({
  customerLocation,
  technicianLocation,
  height = 300,
  zoom = 13
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const techMarkerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_KEY;

  useEffect(() => {
    if (!apiKey) { setError('Google Maps API key missing'); return; }
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(g => {
        if (cancelled) return;
        if (!ref.current) return;
        mapRef.current = new g.maps.Map(ref.current, {
          center: { lat: customerLocation.latitude, lng: customerLocation.longitude },
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });
        customerMarkerRef.current = new g.maps.Marker({
          map: mapRef.current,
            position: { lat: customerLocation.latitude, lng: customerLocation.longitude },
            icon: { path: g.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#34cfa8', fillOpacity:1, strokeColor:'#137b60', strokeWeight:2 }
        });
        if (technicianLocation) {
          techMarkerRef.current = new g.maps.Marker({
            map: mapRef.current,
            position: { lat: technicianLocation.latitude, lng: technicianLocation.longitude },
            icon: { path: g.maps.SymbolPath.BACKWARD_CLOSED_ARROW, scale: 6, fillColor:'#2c3e50', fillOpacity:1, strokeColor:'#fff', strokeWeight:1 }
          });
        }
      })
      .catch(() => setError('Failed to load map'));
    return () => { cancelled = true; };
  }, [apiKey, customerLocation.latitude, customerLocation.longitude, technicianLocation, zoom]);

  // Update positions on prop change
  useEffect(() => {
    if (!window.google || !mapRef.current) return;
    if (customerMarkerRef.current) customerMarkerRef.current.setPosition({ lat: customerLocation.latitude, lng: customerLocation.longitude });
    if (technicianLocation) {
      if (!techMarkerRef.current) {
        techMarkerRef.current = new window.google.maps.Marker({ map: mapRef.current });
      }
      techMarkerRef.current.setPosition({ lat: technicianLocation.latitude, lng: technicianLocation.longitude });
    }
  }, [customerLocation, technicianLocation]);

  if (error) return <div className="map-error" role="alert">{error}</div>;
  return <div className="map" style={{ width:'100%', height }} ref={ref} aria-label="Service map" />;
};

export default MapComponent;
