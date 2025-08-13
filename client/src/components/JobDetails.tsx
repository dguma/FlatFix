import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../config';
import './JobDetails.css';

interface JobDetailsProps {
  jobId: string;
  onClose: () => void;
  onJobUpdate: () => void;
}

interface JobDoc { _id:string; status:string; serviceType:string; location?:{ address?:string }; customerId?: { name?:string }; completion?: { customerSignature?:string; customerName?:string }; }

const JobDetails: React.FC<JobDetailsProps> = ({ jobId, onClose, onJobUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<JobDoc | null>(null);
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const { token, user } = useAuth();

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
    setErrorMsg('');
    const prev = job?.status;
    if (job) setJob({ ...job, status }); // optimistic
    try {
  console.log('[JobDetails] PATCH status ->', status, 'jobId', jobId);
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
        // Auto-close only if cancelled OR completed and there is already a signature present
        if (status === 'cancelled') {
          setTimeout(() => { onClose(); }, 400);
        }
      } else {
        let detail = '';
        try { detail = await response.text(); } catch {}
        console.error('Failed to update status', detail);
        setErrorMsg(`Status update failed: ${response.status} ${detail || ''}`.trim());
        if (prev && job) setJob({ ...job, status: prev });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setErrorMsg('Network or server error while updating status');
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
        <div style={{ position:'absolute', top:8, right:48 }}>
          <button style={{ fontSize:10, padding:'2px 6px' }} onClick={async () => {
            try {
              const r = await fetch(`${API_BASE || ''}/api/services/status-allowed/debug`, { headers: { Authorization:`Bearer ${token}` }});
              const j = await r.json();
              console.log('[JobDetails] server-reported statuses', j);
              alert('Server statuses: ' + JSON.stringify(j));
            } catch(e) { alert('Debug fetch failed'); }
          }}>Status Debug</button>
        </div>
        
        {job && (
          <div style={{ marginBottom:'.75rem' }}>
            <div style={{ fontSize:'.9rem', fontWeight:600 }}>Current Status: <span style={{ textTransform:'capitalize' }}>{job.status}</span></div>
            {job.location?.address && <div style={{ fontSize:'.8rem', opacity:.8 }}>{job.location.address}</div>}
          </div>
        )}
        <p style={{ marginTop:0 }}>Manage the status of this job.</p>

        <div className="job-actions" style={{ display:'flex', flexWrap:'wrap', gap:'.5rem' }}>
          <button
            disabled={updating || job?.status!=='assigned'}
            onClick={() => handleUpdateStatus('en-route')}
            className="btn btn-outline"
            title={job?.status!=='assigned' ? 'You must claim the job first (status assigned) before going en-route.' : ''}
          >En Route</button>
          <button
            disabled={updating || (job?.status!=='en-route')}
            onClick={() => handleUpdateStatus('on-location')}
            className="btn btn-outline"
          >On Location</button>
          <button
            disabled={updating || (job?.status!=='on-location')}
            onClick={() => handleUpdateStatus('in-progress')}
            className="btn btn-primary"
          >Start Job</button>
          <button
            disabled={updating || (job?.status!=='in-progress')}
            onClick={() => handleUpdateStatus('completed')}
            className="btn btn-success"
          >Complete Job</button>
          <button
            disabled={updating || job?.status==='completed'}
            onClick={() => handleUpdateStatus('cancelled')}
            className="btn btn-danger"
          >Cancel Job</button>
        </div>
        {errorMsg && <div style={{ color:'#b00020', fontSize:'.8rem', marginTop:'.25rem' }}>{errorMsg}</div>}
        {job && user?.userType==='technician' && job.status==='pending' && (
          <div style={{ marginTop:'.5rem', fontSize:'.75rem', color:'#666' }}>
            Tip: Claim this job from the available jobs list first. Once claimed, status becomes 'assigned' and you can press En Route.
          </div>
        )}

        {job?.status==='completed' && !job?.completion?.customerSignature && (
          <SignatureCapture
            customerName={job?.customerId?.name || ''}
            jobId={job._id}
            onDone={() => { fetchJobDetails(); onJobUpdate(); /* Close after capture */ setTimeout(() => onClose(), 500); }} />
        )}
      </div>
    </div>
  );
};

export default JobDetails;

// Lightweight inline signature capture (canvas) placeholder
const SignatureCapture: React.FC<{ jobId:string; onDone: () => void; customerName?:string }> = ({ jobId, onDone, customerName }) => {
  const { token } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState(customerName || '');
  const [font, setFont] = useState('Brush Script MT, cursive');
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Setup drawing canvas
  useEffect(() => {
    if (mode !== 'draw') return;
    const canvas = drawCanvasRef.current; if (!canvas) return;
    canvas.width = 500; canvas.height = 200;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.lineWidth = 2; ctx.lineCap='round'; ctx.strokeStyle='#222';
    let drawing = false;
    const pos = (e:PointerEvent) => { const rect = canvas.getBoundingClientRect(); return { x: e.clientX - rect.left, y: e.clientY - rect.top }; };
    const start = (e:PointerEvent) => { drawing=true; ctx.beginPath(); const p=pos(e); ctx.moveTo(p.x,p.y); };
    const move = (e:PointerEvent) => { if(!drawing) return; const p=pos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); };
    const end = () => { drawing=false; };
    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    return () => { canvas.removeEventListener('pointerdown', start); canvas.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); };
  }, [mode]);

  // Prepare a hidden canvas ref for typed signature rendering
  useEffect(() => {
    if (mode !== 'type') return;
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.width = 500; canvas.height = 200;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#111';
    ctx.textBaseline = 'middle';
    ctx.font = `64px ${font}`;
    const text = typedName || '';
    const metrics = ctx.measureText(text);
    const x = (canvas.width - metrics.width) / 2;
    const y = canvas.height / 2;
    ctx.fillText(text, x, y);
  }, [mode, typedName, font]);

  const saveSignature = async () => {
    setSubmitting(true);
    try {
      let dataUrl: string | null = null;
      let customer = typedName || customerName || 'Customer';
      if (mode === 'draw') {
        const c = drawCanvasRef.current; if (!c) return; dataUrl = c.toDataURL('image/png');
      } else {
        const c = canvasRef.current; if (!c) return; dataUrl = c.toDataURL('image/png');
      }
      const res = await fetch(`${API_BASE || ''}/api/services/${jobId}/signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ signatureData: dataUrl, customerName: customer })
      });
      if (res.ok) onDone();
    } finally { setSubmitting(false); }
  };

  const clearDrawing = () => {
    if (mode !== 'draw') return;
    const c = drawCanvasRef.current; if (!c) return; const ctx = c.getContext('2d'); if (!ctx) return; ctx.fillStyle = '#fff'; ctx.fillRect(0,0,c.width,c.height);
  };

  const fonts = [
    'Brush Script MT, cursive',
    'Lucida Handwriting, cursive',
    'Segoe Script, cursive',
    'Comic Sans MS, cursive',
    'Georgia, serif',
    'Times New Roman, serif'
  ];

  return (
    <div style={{ marginTop:'1rem' }}>
      <h3 style={{ fontSize:'1rem', marginBottom:'.5rem' }}>Customer Signature</h3>
      <div style={{ display:'flex', gap:'.75rem', marginBottom:'.5rem' }}>
        <button type="button" className={`btn btn-sm ${mode==='draw' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMode('draw')}>Draw</button>
        <button type="button" className={`btn btn-sm ${mode==='type' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMode('type')}>Type</button>
      </div>
      {mode === 'draw' && (
        <>
          <canvas ref={drawCanvasRef} style={{ border:'1px solid #ccc', borderRadius:4, touchAction:'none', background:'#fff', width:'100%', maxWidth:'520px', height:'200px' }} />
          <div style={{ marginTop:'.5rem', display:'flex', gap:'.5rem' }}>
            <button type="button" className="btn btn-primary" disabled={submitting} onClick={saveSignature}>{submitting ? 'Saving...' : 'Save Signature'}</button>
            <button type="button" className="btn btn-outline" onClick={clearDrawing}>Clear</button>
          </div>
        </>
      )}
      {mode === 'type' && (
        <div style={{ maxWidth:'520px' }}>
          <div className="form-group" style={{ marginBottom:'.5rem' }}>
            <label style={{ fontSize:'.75rem', fontWeight:600 }}>Customer Name</label>
            <input type="text" value={typedName} onChange={e => setTypedName(e.target.value)} placeholder="Enter printed name" style={{ width:'100%' }} />
          </div>
          <div className="form-group" style={{ marginBottom:'.5rem' }}>
            <label style={{ fontSize:'.75rem', fontWeight:600 }}>Signature Style</label>
            <select value={font} onChange={e => setFont(e.target.value)} style={{ width:'100%' }}>
              {fonts.map(f => <option key={f} value={f}>{f.split(',')[0]}</option>)}
            </select>
          </div>
          <div style={{ border:'1px solid #ccc', borderRadius:4, background:'#fff', padding:'1.25rem', textAlign:'center', fontSize:'2.75rem', fontFamily: font, minHeight:'120px' }}>
            {typedName || 'Sample'}
          </div>
          <canvas ref={canvasRef} style={{ display:'none' }} />
          <div style={{ marginTop:'.75rem' }}>
            <button type="button" className="btn btn-primary" disabled={submitting || !typedName} onClick={saveSignature}>{submitting ? 'Saving...' : 'Save Signature'}</button>
          </div>
        </div>
      )}
    </div>
  );
};
