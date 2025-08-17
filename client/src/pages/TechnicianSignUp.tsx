import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { useAuth } from '../contexts/AuthContext';

const TechnicianSignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | ''>('');
  const [status, setStatus] = useState<'idle'|'submitting'>('idle');
  const [message, setMessage] = useState<string>('');
  const { token, user } = useAuth();
  const [checking, setChecking] = useState(false);
  const [hasBadge, setHasBadge] = useState<boolean>(false);

  const requiredBadgeKey = 'spare-tire';

  const fetchBadges = async () => {
    if (!token) { setHasBadge(false); return; }
    try {
      setChecking(true);
      const res = await fetch(`${API_BASE || ''}/api/profile/badges`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const badges = Array.isArray(data?.badges) ? data.badges : [];
        setHasBadge(badges.some((b: any) => b?.key === requiredBadgeKey));
      } else {
        setHasBadge(false);
      }
    } catch {
      setHasBadge(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Prefill email from logged-in user and check badges
    if (user?.email) setEmail(user.email);
    fetchBadges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.email]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');
    try {
      const body = {
        name,
        email,
        phone,
        experienceYears: typeof experienceYears === 'number' ? experienceYears : undefined,
      };
  const res = await fetch(`${API_BASE || ''}/api/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(()=>({}));
      if (res.ok) {
        setMessage('Application received. We will review shortly.');
        setName(''); setEmail(''); setPhone(''); setExperienceYears('');
      } else {
        setMessage(data?.message || 'Failed to submit application');
      }
    } catch (err) { console.error(err); setMessage('Failed to submit application'); }
    finally { setStatus('idle'); }
  };

  return (
    <div className="container" style={{ padding: '1.5rem' }}>
      <h1>Technician Sign-Up</h1>
      <div style={{ margin:'0 0 1rem 0', padding: '.75rem', background:'#fff', border:'1px solid #e5e7eb', borderRadius:8 }}>
        <div><strong>Requirement:</strong> Score 100% on the Spare Tire knowledge check to apply.</div>
        <div style={{ marginTop: '.35rem', display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <a className="btn btn-outline" href="/guides/spare-tire-power">Open guide</a>
          {!token && <a className="btn btn-outline" href="/login">Log in</a>}
          <button type="button" className="btn" onClick={fetchBadges} disabled={checking}>Refresh status</button>
          <span style={{ fontSize: '.9rem', opacity: .85 }}>
            Status: {checking ? 'Checking…' : hasBadge ? 'Badge earned ✓' : 'Badge required'}
          </span>
        </div>
      </div>
      <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap: '.75rem', maxWidth: '420px' }}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" required />
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" required disabled={!!user?.email} />
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone" required />
        <input type="number" min={0} max={50} value={experienceYears} onChange={e=>setExperienceYears(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Years of experience (optional)" />
        <button className="btn btn-primary" disabled={status==='submitting' || !hasBadge}>Submit application</button>
      </form>
      {message && <div style={{ marginTop: '.75rem', fontSize: '.95rem' }}>{message}</div>}
    </div>
  );
};
export default TechnicianSignUp;
