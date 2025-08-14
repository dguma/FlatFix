// Placeholder MapComponent for MVP build (no Google Maps)
import React from 'react';
import './MapComponent.css';

interface MapComponentProps {
  customerLocation: { latitude: number; longitude: number; address?: string };
  technicianLocation?: { latitude: number; longitude: number; address?: string } | null;
  onTechnicianLocationUpdate?: (location: { latitude: number; longitude: number; address?: string }) => void;
  isTracking?: boolean;
  onStartNavigation?: () => void;
}

const MapComponent: React.FC<MapComponentProps> = () => {
  return null;
};

export default MapComponent;
