import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import JobTracking from '../components/JobTracking';
import JobDetails from '../components/JobDetails';
import './Dashboard.css';

interface ServiceRequest {
  _id: string;
  customerId: {
    name: string;
    phone: string;
    location: {
      address: string;
    };
  };
  serviceType: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  description: string;
  pricing: {
    totalAmount: number;
  };
  status: string;
  createdAt: string;
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

const TechnicianDashboard: React.FC = () => {
  const [availableJobs, setAvailableJobs] = useState<ServiceRequest[]>([]);
  const [myJobs, setMyJobs] = useState<ServiceRequest[]>([]);
  const [activeTrackingJob, setActiveTrackingJob] = useState<ServiceRequest | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<{[key: string]: number}>({});
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { socket } = useSocket();

  const handleNewServiceRequest = (newRequest: ServiceRequest) => {
    setAvailableJobs(prev => [newRequest, ...prev]);
  };

  const handleAssignmentApproved = useCallback((data: any) => {
    // Move job from available to my jobs
    const approvedJob = availableJobs.find(job => job._id === data.requestId);
    if (approvedJob) {
      setMyJobs(prev => [approvedJob, ...prev]);
      setAvailableJobs(prev => prev.filter(job => job._id !== data.requestId));
    }
  }, [availableJobs]);

  useEffect(() => {
    if (socket) {
      socket.on('service-request-available', handleNewServiceRequest);
      socket.on('assignment-approved', handleAssignmentApproved);

      return () => {
        socket.off('service-request-available');
        socket.off('assignment-approved');
      };
    }
  }, [socket, handleAssignmentApproved]);

  const fetchAvailableJobs = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/services/available', {
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

  const fetchUnreadCount = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/services/unread-messages/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCounts(prev => ({
          ...prev,
          [jobId]: data.unreadCount
        }));
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [token]);

  const fetchMyJobs = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/services/my-jobs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMyJobs(data);
        
        // Check for active tracking job
        const trackingJob = data.find((job: ServiceRequest) => 
          job.tracking?.isTracking || job.status === 'in-progress'
        );
        setActiveTrackingJob(trackingJob || null);
        
        // Fetch unread message counts for assigned/in-progress jobs
        data.forEach((job: ServiceRequest) => {
          if (job.status === 'assigned' || job.status === 'in-progress') {
            fetchUnreadCount(job._id);
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch my jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [token, fetchUnreadCount]);

  const toggleAvailability = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/availability', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isAvailable: !isAvailable })
      });

      if (response.ok) {
        setIsAvailable(!isAvailable);
      }
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    if (window.confirm('Are you sure you want to cancel this job? This cannot be undone.')) {
      try {
        const response = await fetch(`http://localhost:5000/api/services/cancel/${jobId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({}), // Ensure body is sent
        });

        if (response.ok) {
          alert('Job cancelled successfully.');
          fetchMyJobs();
          fetchAvailableJobs();
          setActiveTrackingJob(null);
        } else {
          const errorData = await response.json();
          alert(`Failed to cancel job: ${errorData.message}`);
        }
      } catch (error) {
        console.error('Error cancelling job:', error);
        alert('An error occurred while cancelling the job.');
      }
    }
  };

  useEffect(() => {
    fetchAvailableJobs();
    fetchMyJobs();
  }, [fetchAvailableJobs, fetchMyJobs]);

  if (loading) {
    return <div className="loading">Loading jobs...</div>;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Technician Dashboard</h1>
          <div className="availability-toggle">
            <label>
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={toggleAvailability}
              />
              {isAvailable ? '🟢 Available' : '🔴 Offline'}
            </label>
          </div>
        </div>

        <div className="dashboard-sections">
          {/* Active Job Tracking - Show if there's an active tracking job */}
          {activeTrackingJob && (
            <section className="active-tracking-section" style={{ gridColumn: '1 / -1', marginBottom: '2rem' }}>
              <h2>🚗 Active Job - Live Tracking</h2>
              <JobTracking 
                job={activeTrackingJob} 
                onJobUpdate={() => {
                  fetchMyJobs();
                  fetchAvailableJobs();
                }}
              />
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setSelectedJobId(activeTrackingJob._id)}
                  className="btn btn-primary"
                >
                  📋 Manage Job Details
                  {unreadCounts[activeTrackingJob._id] > 0 && (
                    <span className="message-count-badge">
                      {unreadCounts[activeTrackingJob._id]}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleCancelJob(activeTrackingJob._id)}
                  className="btn btn-danger"
                >
                  Cancel Accepted Job
                </button>
              </div>
            </section>
          )}

          <section className="jobs-section">
            <h2>Available Jobs ({availableJobs.length})</h2>
            {availableJobs.length === 0 ? (
              <p>No available jobs at the moment.</p>
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
                      <div className="job-pay">${job.pricing.totalAmount}</div>
                    </div>
                    <p><strong>Location:</strong> {job.location.address}</p>
                    <p><strong>Description:</strong> {job.description}</p>
                    <p><strong>Customer:</strong> {job.customerId.name}</p>
                    <button 
                      onClick={() => setSelectedJobId(job._id)}
                      className="btn btn-primary"
                      disabled={!!activeTrackingJob}
                    >
                      {activeTrackingJob ? 'Complete current job first' : '📋 View Details'}
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
                {myJobs.filter(job => !job.tracking?.isTracking && job.status !== 'in-progress').map(job => (
                  <div key={job._id} className="job-card my-job">
                    <div className="job-header">
                      <div className="service-type">
                        {job.serviceType === 'air-inflation' && '💨 Air Inflation'}
                        {job.serviceType === 'spare-replacement' && '🔧 Spare Replacement'}
                        {job.serviceType === 'shop-pickup' && '🏪 Shop Coordination'}
                      </div>
                      <div className="job-pay">${job.pricing.totalAmount}</div>
                    </div>
                    <p><strong>Location:</strong> {job.location.address}</p>
                    <p><strong>Customer:</strong> {job.customerId.name}</p>
                    <p><strong>Phone:</strong> {job.customerId.phone}</p>
                    
                    <div className="job-actions">
                      <button 
                        onClick={() => setSelectedJobId(job._id)}
                        className="btn btn-primary"
                      >
                        📋 Manage Job Details
                        {unreadCounts[job._id] > 0 && (
                          <span className="message-count-badge">
                            {unreadCounts[job._id]}
                          </span>
                        )}
                      </button>
                      
                      {/* Quick actions for assigned jobs */}
                      {job.status === 'assigned' && (
                        <div className="quick-actions">
                          <button 
                            onClick={() => setActiveTrackingJob(job)}
                            className="btn btn-success"
                            disabled={!!activeTrackingJob && activeTrackingJob._id !== job._id}
                          >
                            {activeTrackingJob && activeTrackingJob._id === job._id ? '🔄 Manage Tracking' : '🚗 Start Live Tracking'}
                          </button>
                          
                          <button 
                            onClick={() => window.open(`tel:${job.customerId.phone}`)}
                            className="btn btn-info"
                            style={{ marginTop: '4px' }}
                          >
                            📞 Call Customer
                          </button>
                        </div>
                      )}
                      
                      {/* Quick actions for in-progress jobs */}
                      {job.status === 'in-progress' && (
                        <div className="quick-actions">
                          <button 
                            onClick={() => setActiveTrackingJob(job)}
                            className="btn btn-warning"
                          >
                            🔄 Manage Live Tracking
                          </button>
                          
                          <button 
                            onClick={() => window.open(`tel:${job.customerId.phone}`)}
                            className="btn btn-info"
                            style={{ marginTop: '4px' }}
                          >
                            📞 Call Customer
                          </button>
                        </div>
                      )}
                      
                      {job.status === 'completed' && (
                        <div className="job-completed">
                          <span>✅ Completed</span>
                          {job.tracking && (
                            <div className="completion-stats">
                              <small>
                                Distance: {job.tracking.totalDistanceMiles.toFixed(1)} miles | 
                                Time: {Math.floor(job.tracking.totalTimeMinutes / 60)}h {job.tracking.totalTimeMinutes % 60}m
                              </small>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
