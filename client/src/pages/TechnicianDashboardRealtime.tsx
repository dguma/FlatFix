import React, { useEffect, useState, useCallback } from 'react';
import { API_BASE } from '../config';
import { useAuth } from '../contexts/AuthContext';

interface Job { _id: string; serviceType: string; location: { address: string }; status: string; description?: string; }

// Polling based realtime-like dashboard
const TechnicianDashboardRealtime: React.FC = () => {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE || ''}/api/services/available`, { headers: { 'Authorization': `Bearer ${token}` }});
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
        setError(null);
      }
    } catch (e:any) { setError(e.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    fetchJobs();
    const id = setInterval(fetchJobs, 5000); // 5s polling
    return () => clearInterval(id);
  }, [fetchJobs]);

  if (loading) return <div className="container">Loading...</div>;
  return (
    <div className="container" style={{ padding: '1.5rem' }}>
      <h1>Realtime Jobs (Polling)</h1>
      {error && <div style={{ color:'red' }}>{error}</div>}
      {jobs.length === 0 ? <p>No jobs right now.</p> : (
        <ul style={{ padding:0, listStyle:'none' }}>
          {jobs.map(j => <li key={j._id} style={{ border:'1px solid #ddd', padding:'.75rem', marginBottom:'.5rem' }}>{j.serviceType} - {j.location.address} - {j.status}</li>)}
        </ul>
      )}
    </div>
  );
};
export default TechnicianDashboardRealtime;
