import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import JobDetails from '../components/JobDetails';
import './Dashboard.css';
import { API_BASE } from '../config';

interface ServiceRequest {
  _id: string;
  customerId: {
    username: string;
  };
  serviceType: string;
  location: {
    address: string;
  };
  description: string;
  status: string;
  createdAt: string;
}

const TechnicianDashboard: React.FC = () => {
  const [availableJobs, setAvailableJobs] = useState<ServiceRequest[]>([]);
  const [myJobs, setMyJobs] = useState<ServiceRequest[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { token, user, toggleAvailability } = useAuth();
  const isOnline = !!user?.isAvailable;

  const fetchAvailableJobs = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE || ''}/api/services/available`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableJobs(data);
      }
    } catch (error) {
      console.error('Failed to fetch available jobs:', error);
    }
  }, [token]);

  const fetchMyJobs = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE || ''}/api/services/my-jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMyJobs(data);
      }
    } catch (error) {
      console.error('Failed to fetch my jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial + availability-change fetch
  useEffect(() => {
    if (isOnline) fetchAvailableJobs(); else setAvailableJobs([]);
    fetchMyJobs();
  }, [fetchAvailableJobs, fetchMyJobs, isOnline]);

  // Polling to keep statuses fresh (similar to online count pattern)
  const pollRef = useRef<number | null>(null);
  useEffect(() => {
    // Clear any existing
    if (pollRef.current) window.clearInterval(pollRef.current);
    // Only poll if online or has active jobs
    const runner = async () => {
      if (isOnline) fetchAvailableJobs();
      fetchMyJobs();
    };
    runner();
    pollRef.current = window.setInterval(runner, 10000); // 10s cadence
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, [isOnline, fetchAvailableJobs, fetchMyJobs]);

  const handleToggleAvailability = async () => {
    const prev = isOnline;
    const ok = await toggleAvailability();
    if (!ok) {
      // revert UI (user state not updated) – in current implementation toggleAvailability updates state only on success
      console.warn('Availability toggle failed');
    } else if (!prev) {
      // Went online -> refresh jobs immediately
      fetchAvailableJobs();
    }
  };

  const handleClaimJob = async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE || ''}/api/services/claim/${jobId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchAvailableJobs();
        fetchMyJobs();
      } else {
        console.error('Failed to claim job');
      }
    } catch (error) {
      console.error('Error claiming job:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading jobs...</div>;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header" style={{ flexDirection:'column', alignItems:'stretch', gap:'1rem' }}>
          <div className="dashboard-topbar">
            <h1>Technician Dashboard</h1>
            <div className="topbar-right">
              <button
                type="button"
                className={`availability-pill ${isOnline ? 'online' : 'offline'}`}
                onClick={handleToggleAvailability}
                aria-pressed={isOnline}
                aria-label={isOnline ? 'Go Offline' : 'Go Online'}
              >
                <span className={`status-dot ${isOnline ? 'on' : 'off'}`}></span>
                {isOnline ? 'Online' : 'Offline'}
              </button>
              <Link to="/profile" className="avatar-chip" aria-label="Profile">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="avatar" />
                ) : (
                  <span>{user?.name?.charAt(0) || 'P'}</span>
                )}
              </Link>
            </div>
          </div>
          {!isOnline && (
            <div className="availability-hint">
              <strong>You are currently offline.</strong> Switch to <button onClick={handleToggleAvailability} className="link-btn">Online</button> to view and claim new jobs.
            </div>
          )}
        </div>

        <div className="dashboard-sections">
          <section className="jobs-section">
            <h2 style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'.75rem' }}>
              <span>Available Jobs {isOnline && `(${availableJobs.length})`}</span>
              {isOnline && <button className="btn btn-outline" style={{ padding:'0.4rem .9rem' }} onClick={fetchAvailableJobs}>↻ Refresh</button>}
            </h2>
            {!isOnline ? (
              <p style={{ margin:'0.25rem 0 0' }}>Go online to see available jobs.</p>
            ) : availableJobs.length === 0 ? (
              <p>No available jobs right now. Keep the app open — new requests will appear here.</p>
            ) : (
              <div className="jobs-list">
                {availableJobs.map(job => (
                  <div key={job._id} className="job-card available-job">
                    <div className="job-header">
                      <div className="service-type">
                        {job.serviceType === 'air-inflation' && '💨 Air Inflation'}
                        {job.serviceType === 'spare-replacement' && '🔧 Spare Replacement'}
                        {job.serviceType === 'shop-pickup' && '🏪 Shop Coordination'}
                      </div>
                    </div>
                    <p><strong>Location:</strong> {job.location.address}</p>
                    <p><strong>Description:</strong> {job.description}</p>
                    <p><strong>Customer:</strong> {job.customerId.username}</p>
                    <button
                      onClick={() => handleClaimJob(job._id)}
                      className="btn btn-primary"
                    >
                      Claim Job
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="jobs-section">
            <h2>My Jobs ({myJobs.length})</h2>
            {myJobs.length === 0 ? (
              <p>No active jobs.</p>
            ) : (
              <div className="jobs-list">
                {myJobs.map(job => (
                  <div key={job._id} className="job-card my-job">
                    <div className="job-header">
                      <div className="service-type">
                        {job.serviceType === 'air-inflation' && '💨 Air Inflation'}
                        {job.serviceType === 'spare-replacement' && '🔧 Spare Replacement'}
                        {job.serviceType === 'shop-pickup' && '🏪 Shop Coordination'}
                      </div>
                    </div>
                    <p><strong>Location:</strong> {job.location.address}</p>
                    <p><strong>Customer:</strong> {job.customerId.username}</p>
                    <p><strong>Status:</strong> {job.status}</p>
                    <button 
                      onClick={() => setSelectedJobId(job._id)}
                      className="btn btn-primary"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {selectedJobId && (
        <JobDetails 
          jobId={selectedJobId} 
          onClose={() => setSelectedJobId(null)}
          onJobUpdate={() => {
            fetchMyJobs();
            fetchAvailableJobs();
          }}
        />
      )}
    </div>
  );
};

export default TechnicianDashboard;
