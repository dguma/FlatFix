import React, { useState } from 'react';
import { API_BASE } from '../config';

const TechnicianSignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [tools, setTools] = useState('');
  const [status, setStatus] = useState<'idle'|'submitting'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch(`${API_BASE || ''}/api/technicians`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tools: tools.split(',').map(t=>t.trim()), status: 'pending' })
      });
      if (res.ok) {
        alert('Sign-up submitted');
        setEmail(''); setTools('');
      } else {
        alert('Failed');
      }
    } catch (err) { console.error(err); }
    finally { setStatus('idle'); }
  };

  return (
    <div className="container" style={{ padding: '1.5rem' }}>
      <h1>Technician Sign-Up</h1>
      <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap: '.75rem', maxWidth: '400px' }}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" required />
        <input value={tools} onChange={e=>setTools(e.target.value)} placeholder="Tools (comma separated)" />
        <button className="btn btn-primary" disabled={status==='submitting'}>Submit</button>
      </form>
    </div>
  );
};
export default TechnicianSignUp;
