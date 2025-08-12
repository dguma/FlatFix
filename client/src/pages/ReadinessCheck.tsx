import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ReadinessCheck: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as any;
  const [lugIntact, setLugIntact] = React.useState(false);
  const [wheelKey, setWheelKey] = React.useState(false);
  const [policyAgree, setPolicyAgree] = React.useState(false);

  if (!state) return <div className="container">Missing service selection.</div>;

  const allOk = lugIntact && wheelKey && policyAgree;
  return (
    <div className="container" style={{ padding: '1.5rem' }}>
      <h1>Readiness Check</h1>
      <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2rem' }}>
        <li><label><input type="checkbox" checked={lugIntact} onChange={e=>setLugIntact(e.target.checked)} /> Lug nuts intact?</label></li>
        <li><label><input type="checkbox" checked={wheelKey} onChange={e=>setWheelKey(e.target.checked)} /> Have wheel lock key?</label></li>
        <li><label><input type="checkbox" checked={policyAgree} onChange={e=>setPolicyAgree(e.target.checked)} /> Agree to no DIY & refund policy</label></li>
      </ul>
      <button disabled={!allOk} className="btn btn-primary" onClick={()=>navigate('/booking-confirmation',{ state: { ...state, lugIntact, wheelKey, policyAgree } })}>Continue</button>
    </div>
  );
};
export default ReadinessCheck;
