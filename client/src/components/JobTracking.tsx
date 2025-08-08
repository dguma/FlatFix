import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import MapComponent from './MapComponent';
import './JobTracking.css';
import { API_BASE } from '../config';

interface Job {
  _id: string;
  customerId: {
    name: string;
    phone: string;
  };
  serviceType: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  pricing: {
    totalAmount: number;
  };
  status: string;
  tracking?: {
    startedAt?: string;
    arrivedAt?: string;
    completedAt?: string;
    totalDistanceMiles: number;
    totalTimeMinutes: number;
    technicianStartLocation?: {
      latitude: number;
      longitude: number;
      address: string;
    };
    isTracking: boolean;
  };
}

interface JobTrackingProps {
  job: Job;
  onJobUpdate: () => void;
}

const JobTracking: React.FC<JobTrackingProps> = ({ job, onJobUpdate }) => {
  const [technicianLocation, setTechnicianLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isTracking, setIsTracking] = useState(job.tracking?.isTracking || false);
  const [distance, setDistance] = useState(job.tracking?.totalDistanceMiles || 0);
  const [duration, setDuration] = useState(job.tracking?.totalTimeMinutes || 0);
  const [seconds, setSeconds] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [trackingStartTime, setTrackingStartTime] = useState<Date | null>(
    job.tracking?.startedAt ? new Date(job.tracking.startedAt) : null
  );
  
  const { token } = useAuth();
  const { socket } = useSocket();

  // Timer effect - updates duration every second when tracking
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isTracking && (trackingStartTime || job.tracking?.startedAt)) {
      timer = setInterval(() => {
        const startTime = trackingStartTime || new Date(job.tracking!.startedAt!);
        const currentTime = new Date();
        const elapsedSeconds = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
        const elapsedMinutes = Math.floor(elapsedSeconds / 60);
        setDuration(elapsedMinutes);
        setSeconds(elapsedSeconds % 60);
      }, 1000); // Update every second for real-time display
      
      // Also update immediately
      const startTime = trackingStartTime || new Date(job.tracking!.startedAt!);
      const currentTime = new Date();
      const elapsedSeconds = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      setDuration(elapsedMinutes);
      setSeconds(elapsedSeconds % 60);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isTracking, job.tracking, trackingStartTime]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const updateJobTracking = useCallback(async (trackingData: any) => {
    try {
      const response = await fetch(`${API_BASE || ''}/api/services/tracking/${job._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(trackingData)
      });

      if (response.ok) {
        // Immediately set tracking to true for responsive UI
        setIsTracking(true);
        onJobUpdate();
      }
    } catch (error) {
      console.error('Failed to update tracking:', error);
    }
  }, [job._id, token, onJobUpdate]);

  const startJob = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    // Set local tracking start time for immediate timer response
    const now = new Date();
    setTrackingStartTime(now);
    setLastUpdate(now);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setTechnicianLocation({ latitude, longitude });

        // Update job status and start tracking
        await updateJobTracking({
          status: 'in-progress',
          tracking: {
            startedAt: now.toISOString(),
            technicianStartLocation: {
              latitude,
              longitude,
              address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            },
            isTracking: true
          }
        });

        // Notify customer
        if (socket) {
          socket.emit('job-started', {
            requestId: job._id,
            customerId: job.customerId,
            technicianLocation: { latitude, longitude }
          });
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please check your location settings.');
      }
    );
  };

  const arriveAtLocation = async () => {
    if (!technicianLocation) return;

    await updateJobTracking({
      tracking: {
        arrivedAt: new Date().toISOString(),
        isTracking: false
      }
    });

    setIsTracking(false);

    // Notify customer
    if (socket) {
      socket.emit('technician-arrived', {
        requestId: job._id,
        customerId: job.customerId
      });
    }
  };

  const completeJob = async () => {
    const completionTime = new Date();
    const startTime = job.tracking?.startedAt ? new Date(job.tracking.startedAt) : new Date();
    const totalMinutes = Math.round((completionTime.getTime() - startTime.getTime()) / (1000 * 60));

    await updateJobTracking({
      status: 'completed',
      tracking: {
        completedAt: completionTime.toISOString(),
        totalTimeMinutes: totalMinutes
      }
    });

    // Notify customer
    if (socket) {
      socket.emit('job-completed', {
        requestId: job._id,
        customerId: job.customerId,
        totalTime: totalMinutes,
        totalDistance: distance
      });
    }
  };

  const handleLocationUpdate = useCallback(async (location: { latitude: number; longitude: number }) => {
    setTechnicianLocation(location);

    let newDistance = distance;
    // Calculate distance traveled
    if (technicianLocation) {
      const distanceTraveled = calculateDistance(
        technicianLocation.latitude,
        technicianLocation.longitude,
        location.latitude,
        location.longitude
      );
      newDistance += distanceTraveled;
      setDistance(newDistance);
    }

    const now = new Date();
    // Throttle updates to customer and database to every 10 seconds
    const timeDiffSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;

    if (timeDiffSeconds > 10) {
      setLastUpdate(now);

      // Send location update to customer
      if (socket) {
        socket.emit('location-update', {
          requestId: job._id,
          customerId: job.customerId,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: now.toISOString()
        });
      }

      // Save location and distance to database
      await updateJobTracking({
        tracking: {
          locationHistory: {
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: now.toISOString()
          },
          totalDistanceMiles: newDistance,
        }
      });
    }
  }, [technicianLocation, distance, lastUpdate, socket, job._id, job.customerId, updateJobTracking]);

  const formatTime = (minutes: number, secs: number = 0): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const getJobStatusDisplay = () => {
    if (job.status === 'completed') return 'Completed';
    if (job.tracking?.arrivedAt) return 'At Location';
    if (isTracking) return 'En Route';
    return 'Ready to Start';
  };

  const getStatusClass = () => {
    if (job.status === 'completed') return 'completed';
    if (job.tracking?.arrivedAt) return 'arrived';
    if (isTracking) return 'en-route';
    return 'ready';
  };

  return (
    <div className="job-tracking">
      <div className="job-header">
        <h3>
          {job.serviceType === 'air-inflation' && '💨 Air Inflation'}
          {job.serviceType === 'spare-replacement' && '🔧 Spare Replacement'}
          {job.serviceType === 'shop-pickup' && '🏪 Shop Coordination'}
        </h3>
        <div className={`job-status-indicator ${getStatusClass()}`}>
          <span className="status-dot"></span>
          {getJobStatusDisplay()}
        </div>
      </div>

      <div className="customer-info">
        <p><strong>Customer:</strong> {job.customerId.name}</p>
        <p><strong>Phone:</strong> {job.customerId.phone}</p>
        <p><strong>Location:</strong> {job.location.address}</p>
        <p><strong>Pay:</strong> ${job.pricing.totalAmount}</p>
      </div>

      <div className="job-metrics">
        <div className="metrics-grid">
          <div className="metric-item distance">
            <span className="metric-value">{distance.toFixed(1)}</span>
            <span className="metric-label">Miles</span>
          </div>
          <div className="metric-item time">
            <span className="metric-value">{formatTime(duration, seconds)}</span>
            <span className="metric-label">Duration</span>
          </div>
          <div className="metric-item earnings">
            <span className="metric-value">${job.pricing.totalAmount}</span>
            <span className="metric-label">Earnings</span>
          </div>
        </div>
      </div>

      <MapComponent
        customerLocation={job.location}
        technicianLocation={technicianLocation || undefined}
        isTracking={isTracking}
        onLocationUpdate={handleLocationUpdate}
        showRoute={isTracking}
        height="300px"
        zoom={13}
      />

      <div className="location-controls">
        {job.status === 'assigned' && !isTracking && (
          <button onClick={startJob} className="location-btn success">
            🚗 Start Job & Begin Tracking
          </button>
        )}
        
        {isTracking && !job.tracking?.arrivedAt && (
          <button onClick={arriveAtLocation} className="location-btn">
            📍 I've Arrived
          </button>
        )}
        
        {job.tracking?.arrivedAt && job.status !== 'completed' && (
          <button onClick={completeJob} className="location-btn success">
            ✅ Complete Job
          </button>
        )}
        
        {isTracking && (
          <button 
            onClick={() => setIsTracking(false)} 
            className="location-btn danger"
          >
            ⏸️ Pause Tracking
          </button>
        )}
      </div>
    </div>
  );
};

export default JobTracking;
