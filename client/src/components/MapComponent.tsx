import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import './MapComponent.css';

interface MapComponentProps {
  customerLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  technicianLocation?: {
    latitude: number;
    longitude: number;
  };
  isTracking?: boolean;
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
  showRoute?: boolean;
  height?: string;
  zoom?: number;
}

const MapComponent: React.FC<MapComponentProps> = ({
  customerLocation,
  technicianLocation,
  isTracking = false,
  onLocationUpdate,
  showRoute = false,
  height = '400px',
  zoom = 14
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [customerMarker, setCustomerMarker] = useState<google.maps.Marker | null>(null);
  const [technicianMarker, setTechnicianMarker] = useState<google.maps.Marker | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
        libraries: ['places', 'geometry']
      });

      try {
        await loader.load();
        
        if (mapRef.current) {
          const mapInstance = new google.maps.Map(mapRef.current, {
            center: customerLocation 
              ? { lat: customerLocation.latitude, lng: customerLocation.longitude }
              : { lat: 40.7128, lng: -74.0060 }, // Default to NYC
            zoom: zoom,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          });

          setMap(mapInstance);
          setDirectionsService(new google.maps.DirectionsService());
          setDirectionsRenderer(new google.maps.DirectionsRenderer({
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: '#3498db',
              strokeWeight: 4,
              strokeOpacity: 0.8
            }
          }));
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    initMap();
  }, [customerLocation, zoom]);

  // Set up customer marker
  useEffect(() => {
    if (map && customerLocation && !customerMarker) {
      const marker = new google.maps.Marker({
        position: { lat: customerLocation.latitude, lng: customerLocation.longitude },
        map: map,
        title: 'Customer Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"%3E%3Cpath fill="%23e74c3c" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/%3E%3C/svg%3E',
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32)
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="padding: 5px;"><strong>Customer Location</strong><br/>${customerLocation.address}</div>`
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      setCustomerMarker(marker);
    }

    return () => {
      if (customerMarker) {
        customerMarker.setMap(null);
      }
    };
  }, [map, customerLocation]);

  // Set up technician marker and tracking
  useEffect(() => {
    if (map && technicianLocation && !technicianMarker) {
      const marker = new google.maps.Marker({
        position: { lat: technicianLocation.latitude, lng: technicianLocation.longitude },
        map: map,
        title: 'Technician Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"%3E%3Cpath fill="%232ecc71" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/%3E%3C/svg%3E',
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32)
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: '<div style="padding: 5px;"><strong>Technician Location</strong><br/>Live tracking active</div>'
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      setTechnicianMarker(marker);

      // Auto-center map to show both markers
      if (customerLocation) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: customerLocation.latitude, lng: customerLocation.longitude });
        bounds.extend({ lat: technicianLocation.latitude, lng: technicianLocation.longitude });
        map.fitBounds(bounds);
      }
    } else if (map && technicianLocation && technicianMarker) {
      // Update existing marker position
      technicianMarker.setPosition({ lat: technicianLocation.latitude, lng: technicianLocation.longitude });
    }

    return () => {
      if (technicianMarker && !technicianLocation) {
        technicianMarker.setMap(null);
      }
    };
  }, [map, technicianLocation, customerLocation]);

  // Handle route display
  useEffect(() => {
    if (map && directionsService && directionsRenderer && showRoute && customerLocation && technicianLocation) {
      directionsRenderer.setMap(map);

      directionsService.route({
        origin: { lat: technicianLocation.latitude, lng: technicianLocation.longitude },
        destination: { lat: customerLocation.latitude, lng: customerLocation.longitude },
        travelMode: google.maps.TravelMode.DRIVING,
        avoidTolls: false,
        avoidHighways: false
      }, (response, status) => {
        if (status === 'OK' && response) {
          directionsRenderer.setDirections(response);
        } else {
          console.error('Directions request failed:', status);
        }
      });
    }

    return () => {
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
    };
  }, [map, directionsService, directionsRenderer, showRoute, customerLocation, technicianLocation]);

  // Start/stop location tracking
  useEffect(() => {
    if (isTracking && onLocationUpdate) {
      if (navigator.geolocation) {
        const id = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            onLocationUpdate({ latitude, longitude });
          },
          (error) => {
            console.error('Geolocation error:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000 // 1 minute
          }
        );
        setWatchId(id);
      }
    } else if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTracking, onLocationUpdate]);

  return (
    <div className="map-container">
      <div 
        ref={mapRef} 
        className="map"
        style={{ height, width: '100%' }}
      />
      {isTracking && (
        <div className="tracking-indicator">
          <span className="tracking-dot"></span>
          Live tracking active
        </div>
      )}
    </div>
  );
};

export default MapComponent;
