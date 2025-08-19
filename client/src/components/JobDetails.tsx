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
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
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

  const confirmCancel = async () => {
    if (!cancelReason || cancelReason.trim().length < 5) return;
    await handleUpdateStatusWithReason('cancelled', cancelReason.trim());
  };

  const handleUpdateStatusWithReason = async (status: string, reason?: string) => {
    if (updating) return;
    setUpdating(true);
    const prev = job?.status;
    if (job) setJob({ ...job, status });
    try {
      const response = await fetch(`${API_BASE || ''}/api/services/status/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status, ...(reason ? { reason } : {}) })
      });
      if (response.ok) {
        onJobUpdate();
        fetchJobDetails();
        if (status === 'completed' || status === 'cancelled') setTimeout(() => { onClose(); }, 400);
      } else {
        console.error('Failed to update status');
        if (prev && job) setJob({ ...job, status: prev });
      }
    } catch (e) {
      console.error('update with reason failed', e);
      if (prev && job) setJob({ ...job, status: prev });
    } finally {
      setUpdating(false);
      setCancelOpen(false);
      setCancelReason('');
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
        
        {job && (
          <div style={{ marginBottom:'.75rem' }}>
            <div style={{ fontSize:'.9rem', fontWeight:600 }}>Current Status: <span style={{ textTransform:'capitalize' }}>{job.status}</span></div>
            {job.location?.address && <div style={{ fontSize:'.8rem', opacity:.8 }}>{job.location.address}</div>}
          </div>
        )}
        <p style={{ marginTop:0 }}>Manage the status of this job.</p>

        <div className="job-actions">
          <button
            disabled={updating || !job || ['en-route','on-location','in-progress','completed','cancelled'].includes(job.status)}
            onClick={() => handleUpdateStatus('en-route')}
            className="btn btn-primary"
          >
            En Route
          </button>
          <button
            disabled={updating || !job || ['on-location','in-progress','completed','cancelled'].includes(job.status)}
            onClick={() => handleUpdateStatus('on-location')}
            className="btn btn-warning"
          >
            On Location
          </button>
          <button
            disabled={updating || !job || job.status!=='on-location'}
            onClick={() => handleUpdateStatus('in-progress')}
            className="btn btn-primary"
          >
            Start Job
          </button>
          <button
            disabled={updating || !job || job.status!=='in-progress'}
            onClick={() => handleUpdateStatus('completed')}
            className="btn btn-success"
          >
            Complete Job
          </button>
          <button
            disabled={updating || !job || job.status==='completed' || job.status==='cancelled'}
            onClick={() => setCancelOpen(true)}
            className="btn btn-danger"
          >
            Cancel Job
          </button>
        </div>

        {/* Simple progress timeline */}
        {job && (
          <div className="map-section" style={{ borderTop: '2px solid #ecf0f1' }}>
            <h4>Progress</h4>
            <ol className="timeline">
              {['assigned','en-route','on-location','in-progress','completed'].map((st) => (
                <li key={st} className={`tl-item ${st} ${['assigned','en-route','on-location','in-progress','completed'].indexOf(job.status) >= ['assigned','en-route','on-location','in-progress','completed'].indexOf(st) ? 'done' : ''}`}>
                  <span className="tl-dot" />
                  <span className="tl-label">{st.replace('-', ' ')}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {cancelOpen && (
          <div className="cancel-modal">
            <div className="cancel-content">
              <h3>Cancel Job</h3>
              <p>Please provide a reason. This will be visible to the customer.</p>
              <textarea rows={3} value={cancelReason} onChange={e=>setCancelReason(e.target.value)} placeholder="e.g., Vehicle not found, unsafe location, etc." />
              <div className="cancel-actions">
                <button className="btn btn-secondary" onClick={()=>{setCancelOpen(false); setCancelReason('');}}>Back</button>
                <button className="btn btn-danger" disabled={cancelReason.trim().length < 5 || updating} onClick={confirmCancel}>Confirm Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetails;
