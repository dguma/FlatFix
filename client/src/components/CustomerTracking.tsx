import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import MapComponent from './MapComponent';
import './CustomerTracking.css';
import { API_BASE } from '../config';

interface CustomerTrackingProps {
  requestId: string;
  onClose: () => void;
}

interface TrackingData {
  _id: string;
  serviceType: string;
  status: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  technicianId: {
    name: string;
    phone: string;
    vehicleInfo: {
      make: string;
      model: string;
      licensePlate: string;
    };
  };
  pricing: {
    totalAmount: number;
  };
  tracking?: {
    startedAt?: string;
    arrivedAt?: string;
    totalDistanceMiles: number;
    totalTimeMinutes: number;
    isTracking: boolean;
  };
}

const CustomerTracking: React.FC<CustomerTrackingProps> = ({ requestId, onClose }) => {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [technicianLocation, setTechnicianLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date>(new Date());

  const { token } = useAuth();
  const { socket } = useSocket();

  useEffect(() => {
    fetchTrackingData();
  }, [requestId]);

  useEffect(() => {
    if (socket) {
      socket.on('technician-location', handleLocationUpdate);
      socket.on('technician-arrived', handleTechnicianArrived);
      socket.on('job-completed', handleJobCompleted);

      return () => {
        socket.off('technician-location');
        socket.off('technician-arrived');
        socket.off('job-completed');
      };
    }
  }, [socket]);

  const fetchTrackingData = async () => {
    try {
      const response = await fetch(`${API_BASE || ''}/api/services/tracking/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTrackingData(data);
      }
    } catch (error) {
      console.error('Failed to fetch tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationUpdate = (data: any) => {
    if (data.requestId === requestId) {
      setTechnicianLocation({
        latitude: data.latitude,
        longitude: data.longitude
      });
      setLastLocationUpdate(new Date());

      // Calculate estimated arrival using Google Maps if available
      if (trackingData && window.google) {
        calculateETA(data.latitude, data.longitude);
      }
    }
  };

  const handleTechnicianArrived = (data: any) => {
    if (data.requestId === requestId) {
      setEstimatedArrival('Technician has arrived!');
      fetchTrackingData(); // Refresh data
    }
  };

  const handleJobCompleted = (data: any) => {
    if (data.requestId === requestId) {
      fetchTrackingData(); // Refresh data
    }
  };

  const calculateETA = async (techLat: number, techLng: number) => {
    if (!trackingData) return;

    try {
      const service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix({
        origins: [{ lat: techLat, lng: techLng }],
        destinations: [{ lat: trackingData.location.latitude, lng: trackingData.location.longitude }],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
        avoidHighways: false,
        avoidTolls: false
      }, (response, status) => {
        if (status === 'OK' && response) {
          const element = response.rows[0].elements[0];
          if (element.status === 'OK') {
            setEstimatedArrival(element.duration?.text || 'Calculating...');
          }
        }
      });
    } catch (error) {
      console.error('Failed to calculate ETA:', error);
    }
  };

  const getStatusMessage = () => {
    if (!trackingData) return '';
    
    if (trackingData.status === 'completed') {
      return '✅ Service completed successfully!';
    }
    if (trackingData.tracking?.arrivedAt) {
      return '📍 Technician has arrived at your location';
    }
    if (trackingData.tracking?.isTracking) {
      return '🚗 Technician is on the way to your location';
    }
    if (trackingData.status === 'assigned') {
      return '⏳ Technician will start shortly';
    }
    return 'Preparing for service...';
  };

  const getLastUpdateText = () => {
    const timeDiff = Math.floor((new Date().getTime() - lastLocationUpdate.getTime()) / 1000);
    if (timeDiff < 60) return 'Just now';
    if (timeDiff < 3600) return `${Math.floor(timeDiff / 60)} minutes ago`;
    return `${Math.floor(timeDiff / 3600)} hours ago`;
  };

  if (loading) {
    return (
      <div className="tracking-modal">
        <div className="tracking-content">
          <div className="loading">Loading tracking information...</div>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="tracking-modal">
        <div className="tracking-content">
          <div className="error">Failed to load tracking information</div>
          <button onClick={onClose} className="btn btn-secondary">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="tracking-modal">
      <div className="tracking-content">
        <div className="tracking-header">
          <h2>Live Service Tracking</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="status-banner">
          <div className="status-message">{getStatusMessage()}</div>
          {estimatedArrival && trackingData.tracking?.isTracking && (
            <div className="eta">ETA: {estimatedArrival}</div>
          )}
        </div>

        <div className="service-details">
          <div className="service-info">
            <h3>
              {trackingData.serviceType === 'air-inflation' && '💨 Air Inflation Service'}
              {trackingData.serviceType === 'spare-replacement' && '🔧 Spare Tire Replacement'}
              {trackingData.serviceType === 'shop-pickup' && '🏪 Shop Coordination'}
            </h3>
            <p><strong>Location:</strong> {trackingData.location.address}</p>
            <p><strong>Total Cost:</strong> ${trackingData.pricing.totalAmount}</p>
          </div>

          <div className="technician-info">
            <h4>Your Technician</h4>
            <p><strong>Name:</strong> {trackingData.technicianId.name}</p>
            <p><strong>Phone:</strong> {trackingData.technicianId.phone}</p>
            <p><strong>Vehicle:</strong> {trackingData.technicianId.vehicleInfo.make} {trackingData.technicianId.vehicleInfo.model}</p>
            <p><strong>License:</strong> {trackingData.technicianId.vehicleInfo.licensePlate}</p>
          </div>
        </div>

        {(technicianLocation || trackingData.tracking?.isTracking) && (
          <div className="map-section">
            <div className="map-header">
              <h4>Live Location</h4>
              {technicianLocation && (
                <span className="last-update">
                  Updated: {getLastUpdateText()}
                </span>
              )}
            </div>
            <MapComponent
              customerLocation={trackingData.location}
              technicianLocation={technicianLocation || undefined}
              showRoute={!!technicianLocation}
              height="350px"
              zoom={12}
            />
          </div>
        )}

        {trackingData.tracking && (
          <div className="tracking-stats">
            <h4>Service Progress</h4>
            <div className="stats-grid">
              {trackingData.tracking.startedAt && (
                <div className="stat-item">
                  <span className="stat-label">Started</span>
                  <span className="stat-value">
                    {new Date(trackingData.tracking.startedAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
              {trackingData.tracking.arrivedAt && (
                <div className="stat-item">
                  <span className="stat-label">Arrived</span>
                  <span className="stat-value">
                    {new Date(trackingData.tracking.arrivedAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
              {trackingData.tracking.totalDistanceMiles > 0 && (
                <div className="stat-item">
                  <span className="stat-label">Distance</span>
                  <span className="stat-value">
                    {trackingData.tracking.totalDistanceMiles.toFixed(1)} miles
                  </span>
                </div>
              )}
              {trackingData.tracking.totalTimeMinutes > 0 && (
                <div className="stat-item">
                  <span className="stat-label">Duration</span>
                  <span className="stat-value">
                    {Math.floor(trackingData.tracking.totalTimeMinutes / 60)}h {trackingData.tracking.totalTimeMinutes % 60}m
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="tracking-actions">
          <button onClick={onClose} className="btn btn-secondary">
            Close Tracking
          </button>
          <button 
            onClick={() => window.open(`tel:${trackingData.technicianId.phone}`)} 
            className="btn btn-primary"
          >
            📞 Call Technician
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerTracking;
