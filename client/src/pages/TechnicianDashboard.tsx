import React, { useState, useEffect, useCallback } from 'react';
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
  const { token } = useAuth();

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

  useEffect(() => {
    fetchAvailableJobs();
    fetchMyJobs();
  }, [fetchAvailableJobs, fetchMyJobs]);

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
        <div className="dashboard-header">
          <h1>Technician Dashboard</h1>
        </div>

        <div className="dashboard-sections">
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
