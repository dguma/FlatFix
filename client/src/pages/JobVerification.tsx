import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const JobVerification: React.FC = () => {
  const { state } = useLocation() as any;
  const navigate = useNavigate();
  if (!state) return <div className="container">No job to verify.</div>;
  return (
    <div className="container" style={{ padding: '1.5rem' }}>
      <h1>Job Verification</h1>
      <p>Job ID: {state.jobId}</p>
      <button className="btn btn-primary" onClick={()=>{ alert('Job approved!'); navigate('/'); }}>Approve</button>
    </div>
  );
};
export default JobVerification;
