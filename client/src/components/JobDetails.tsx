import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './JobDetails.css';

interface JobDetailsProps {
  jobId: string;
  onClose: () => void;
  onJobUpdate: () => void;
}

const JobDetails: React.FC<JobDetailsProps> = ({ jobId, onClose, onJobUpdate }) => {
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchJobDetails = useCallback(async () => {
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  const handleUpdateStatus = async (status: string) => {
    try {
      const response = await fetch(`/api/services/status/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        onJobUpdate();
        onClose();
      } else {
        console.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <div className="job-details-modal">
        <div className="job-details-content">
          <div className="loading">Loading job details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="job-details-modal">
      <div className="job-details-content">
        <div className="job-details-header">
          <h2>Job Details</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <p>Manage the status of this job.</p>

        <div className="job-actions">
          <button onClick={() => handleUpdateStatus('in-progress')} className="btn btn-primary">
            Start Job
          </button>
          <button onClick={() => handleUpdateStatus('completed')} className="btn btn-success">
            Complete Job
          </button>
          <button onClick={() => handleUpdateStatus('cancelled')} className="btn btn-danger">
            Cancel Job
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
