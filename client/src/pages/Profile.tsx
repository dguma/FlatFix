import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../config';
import './Dashboard.css';

const placeholderAvatars = [
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=60',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=200&q=60',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=200&q=60'
];

const Profile: React.FC = () => {
  const { user, token, logout } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || placeholderAvatars[0]);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [online, setOnline] = useState(!!user?.isAvailable);
  const [equipment, setEquipment] = useState({
    lockoutKit: !!user?.equipment?.lockoutKit,
    jumpStarter: !!user?.equipment?.jumpStarter,
    fuelCan: !!user?.equipment?.fuelCan
  });
  const [message, setMessage] = useState('');
  const [badges, setBadges] = useState<Array<{ key:string; name:string; issuedAt:string }>>([]);

  useEffect(() => { setOnline(!!user?.isAvailable); }, [user?.isAvailable]);

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE || ''}/api/profile/badges`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setBadges(data.badges || []);
        }
      } catch {}
    })();
  }, [token]);

  if (!user) return <div className="container"><p>Please log in.</p></div>;

  const updateAvatar = async () => {
    setSavingAvatar(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE || ''}/api/profile/avatar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatarUrl })
      });
      if (res.ok) setMessage('Avatar updated'); else setMessage('Failed to update avatar');
    } catch { setMessage('Error updating avatar'); }
    finally { setSavingAvatar(false); }
  };

  const toggleOnline = async () => {
    try {
      const res = await fetch(`${API_BASE || ''}/api/profile/online`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ online: !online })
      });
      if (res.ok) setOnline(!online);
    } catch {}
  };

  const updateEquipment = async (key: keyof typeof equipment) => {
    const newValue = !equipment[key];
    setEquipment(prev => ({ ...prev, [key]: newValue }));
    try {
      await fetch(`${API_BASE || ''}/api/profile/equipment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [key]: newValue })
      });
    } catch {}
  };

  const deleteAccount = async () => {
    if (!token) return;
    const sure = window.confirm('Delete your account? This will cancel active jobs and remove your data. This cannot be undone.');
    if (!sure) return;
    try {
      const res = await fetch(`${API_BASE || ''}/api/profile/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        logout();
        window.location.href = '/';
      } else {
        alert('Failed to delete account.');
      }
    } catch {
      alert('Error deleting account.');
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h2>Profile</h2>
      <div className="profile-grid" style={{ display:'grid', gap:'1.5rem', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div className="card" style={{ background:'#fff', padding:'1.25rem', borderRadius:8, boxShadow:'0 2px 4px rgba(0,0,0,0.08)' }}>
          <h3>Account</h3>
          <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.userType}</p>
          <a href="/change-password" className="btn btn-outline" style={{ marginTop:'.5rem', display:'inline-block' }}>Change Password</a>
        </div>

        <div className="card" style={{ background:'#fff', padding:'1.25rem', borderRadius:8, boxShadow:'0 2px 4px rgba(0,0,0,0.08)' }}>
            <h3>Avatar</h3>
            <img src={avatarUrl} alt="avatar" style={{ width:120, height:120, borderRadius:'50%', objectFit:'cover', display:'block', marginBottom:'.75rem' }} />
            <label style={{ fontSize:'.85rem', fontWeight:600 }}>Select Preset</label>
            <div style={{ display:'flex', gap:'.5rem', margin:'.5rem 0' }}>
              {placeholderAvatars.map(url => (
                <button key={url} type="button" onClick={() => setAvatarUrl(url)} style={{ border: avatarUrl===url? '2px solid #3498db':'2px solid transparent', padding:2, borderRadius:8, background:'transparent', cursor:'pointer' }}>
                  <img src={url} alt="option" style={{ width:48, height:48, borderRadius:'50%', objectFit:'cover' }} />
                </button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={updateAvatar} disabled={savingAvatar}>{savingAvatar? 'Saving...' : 'Save Avatar'}</button>
            {message && <div style={{ marginTop:'.5rem', fontSize:'.85rem' }}>{message}</div>}
        </div>

        {user.userType === 'technician' && (
          <div className="card" style={{ background:'#fff', padding:'1.25rem', borderRadius:8, boxShadow:'0 2px 4px rgba(0,0,0,0.08)' }}>
            <h3>Technician Status</h3>
            <p>Status: <strong style={{ color: online? '#27ae60':'#c0392b' }}>{online? 'Online':'Offline'}</strong></p>
            <button className="btn btn-primary" onClick={toggleOnline}>{online? 'Go Offline':'Go Online'}</button>
            <h4 style={{ marginTop:'1rem' }}>Equipment</h4>
            <ul style={{ listStyle:'none', padding:0, margin:0, display:'grid', gap:'.35rem' }}>
              <li><label><input type="checkbox" checked={equipment.lockoutKit} onChange={() => updateEquipment('lockoutKit')} /> Lockout Kit</label></li>
              <li><label><input type="checkbox" checked={equipment.jumpStarter} onChange={() => updateEquipment('jumpStarter')} /> Jump Starter</label></li>
              <li><label><input type="checkbox" checked={equipment.fuelCan} onChange={() => updateEquipment('fuelCan')} /> Fuel Can</label></li>
            </ul>
            <p style={{ fontSize:'.75rem', opacity:.7, marginTop:'.5rem' }}>Jobs shown to you depend on selected equipment.</p>
            {badges.length > 0 && (
              <div style={{ marginTop:'1rem' }}>
                <h4>Badges</h4>
                <ul style={{ listStyle:'none', padding:0, margin:0, display:'grid', gap:'.35rem' }}>
                  {badges.map((b) => (
                    <li key={b.key} style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                      <span role="img" aria-label="badge">🏅</span>
                      <span>{b.name || b.key} <span style={{ fontSize:'.75rem', opacity:.6 }}>({new Date(b.issuedAt).toLocaleDateString()})</span></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card" style={{ background:'#fff', padding:'1.25rem', borderRadius:8, boxShadow:'0 2px 4px rgba(0,0,0,0.08)' }}>
        <h3>Danger Zone</h3>
        <p style={{ fontSize: '.9rem', opacity: .85 }}>Deleting your account will cancel active jobs and remove your data. This cannot be undone.</p>
        <button className="btn" style={{ background:'#e11d48', color:'#fff' }} onClick={deleteAccount}>Delete Account</button>
      </div>
    </div>
  );
};

export default Profile;
