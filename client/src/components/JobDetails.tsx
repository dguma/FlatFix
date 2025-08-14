import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../config';
import './JobDetails.css';

interface JobDetailsProps {
  jobId: string;
  onClose: () => void;
  onJobUpdate: () => void;
}

interface JobDoc { _id:string; status:string; serviceType:string; location?:{ address?:string }; customerId?: { name?:string }; }

const JobDetails: React.FC<JobDetailsProps> = ({ jobId, onClose, onJobUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<JobDoc | null>(null);
  const [updating, setUpdating] = useState(false);
  const { token } = useAuth();

  const fetchJobDetails = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE || ''}/api/services/${jobId}`, { headers: { Authorization: `Bearer ${token}` }});
      if (res.ok) {
        const data = await res.json();
        setJob(data);
      }
    } catch (e) {
      console.error('Failed to load job', e);
    } finally {
      setLoading(false);
    }
  }, [jobId, token]);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  const handleUpdateStatus = async (status: string) => {
    if (updating) return; // guard
    setUpdating(true);
    const prev = job?.status;
    if (job) setJob({ ...job, status }); // optimistic
    try {
      const response = await fetch(`${API_BASE || ''}/api/services/status/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        onJobUpdate();
        fetchJobDetails();
        if (status === 'completed' || status === 'cancelled') {
          // Close shortly after final state
          setTimeout(() => { onClose(); }, 400);
        }
      } else {
        console.error('Failed to update status');
        if (prev && job) setJob({ ...job, status: prev });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      if (prev && job) setJob({ ...job, status: prev });
    } finally { setUpdating(false); }
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
        
        {job && (
          <div style={{ marginBottom:'.75rem' }}>
            <div style={{ fontSize:'.9rem', fontWeight:600 }}>Current Status: <span style={{ textTransform:'capitalize' }}>{job.status}</span></div>
            {job.location?.address && <div style={{ fontSize:'.8rem', opacity:.8 }}>{job.location.address}</div>}
          </div>
        )}
        <p style={{ marginTop:0 }}>Manage the status of this job.</p>

        <div className="job-actions">
          <button disabled={updating || job?.status==='in-progress' || job?.status==='completed'} onClick={() => handleUpdateStatus('in-progress')} className="btn btn-primary">
            Start Job
          </button>
          <button disabled={updating || job?.status==='completed'} onClick={() => handleUpdateStatus('completed')} className="btn btn-success">
            Complete Job
          </button>
          <button disabled={updating || job?.status==='completed'} onClick={() => handleUpdateStatus('cancelled')} className="btn btn-danger">
            Cancel Job
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
