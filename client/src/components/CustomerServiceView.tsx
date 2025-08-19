import React, { useState, useEffect, useCallback, useRef } from 'react';
import './CustomerServiceView.css';
import { API_BASE } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

interface CustomerServiceViewProps {
  requestId: string;
  onClose: () => void;
}

type Shop = { name?: string; phone?: string; address?: string; latitude?: number; longitude?: number; distanceMiles?: number };
type Pricing = { base?: number; service?: number; perUnit?: number; maxUnits?: number; perMile?: number; estimatedMiles?: number; estimate?: number; currency?: string };
type Request = {
  _id: string;
  serviceType: string;
  status: 'pending' | 'assigned' | 'en-route' | 'on-location' | 'in-progress' | 'completed' | 'cancelled';
  description: string;
  location: { address: string; latitude?: number; longitude?: number };
  selectedShop?: Shop;
  pricing?: Pricing;
  createdAt?: string;
  technicianId?: { name?: string; badges?: string[] } | null;
  cancellation?: { cancelledBy?: 'technician' | 'customer' | 'system'; reason?: string; timestamp?: string };
};

const CustomerServiceView: React.FC<CustomerServiceViewProps> = ({ requestId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<Request | null>(null);
  const { token } = useAuth();
  const { socket, isConnected } = useSocket();

  // Scroll container ref for polished scrolling effects
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Prevent flicker and duplicate fetches
  const initialLoadedRef = useRef(false);
  const fetchingRef = useRef(false);
  const lastRefreshRef = useRef(0);

  const fetchServiceData = useCallback(async () => {
    if (fetchingRef.current) return; // avoid overlapping
    fetchingRef.current = true;
    const now = Date.now();
    lastRefreshRef.current = now;
    try {
      // Only show loading UI on first load
      if (!initialLoadedRef.current) setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE || ''}/api/services/${requestId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setRequest(data);
      if (!initialLoadedRef.current) initialLoadedRef.current = true;
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [requestId, token]);

  useEffect(() => {
    fetchServiceData();
  }, [fetchServiceData]);

  // Lock background page scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Manage gradient fades (top/bottom) based on scroll position
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const update = () => {
      const atTop = el.scrollTop <= 2;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 2;
      el.classList.toggle('at-top', atTop);
      el.classList.toggle('at-bottom', atBottom);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    return () => el.removeEventListener('scroll', update);
  }, []);

  // Live status updates: poll only when socket is not connected
  useEffect(() => {
    if (isConnected) return; // socket will push updates
    const id = window.setInterval(() => {
      fetchServiceData();
    }, 12000); // align with dashboard cadence
    return () => window.clearInterval(id);
  }, [isConnected, fetchServiceData]);

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!socket) return;
    const scheduleRefresh = (payload: any) => {
      if (payload?.request?._id !== requestId) return;
      const now = Date.now();
      // Debounce rapid updates within 1.5s
      if (now - lastRefreshRef.current < 1500) return;
      fetchServiceData();
    };
    const onCreated = (payload: any) => scheduleRefresh(payload);
    const onUpdated = (payload: any) => scheduleRefresh(payload);
    socket.on('service:created', onCreated);
    socket.on('service:updated', onUpdated);
    return () => {
      socket.off('service:created', onCreated);
      socket.off('service:updated', onUpdated);
    };
  }, [socket, requestId, fetchServiceData]);

  if (loading) {
    return (
      <div className="service-view-modal">
        <div className="service-view-content">
          <div className="loading">Loading service details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="service-view-modal">
      <div className="service-view-content" ref={contentRef}>
        <div className="service-view-header">
          <h2>Service Request Details</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        {error && <div className="error-message" style={{ margin: '12px 16px' }}>{error}</div>}
        {request && (
          <div className="service-overview">
            {/* Summary chips */}
            <div className="summary">
              <div className="chip"><span>Type</span><strong style={{ textTransform:'capitalize' }}>{request.serviceType.replace('-', ' ')}</strong></div>
              <div className="chip"><span>Status</span><StatusRow status={request.status} /></div>
              <div className="chip"><span>Requested</span><strong>{new Date(request.createdAt || Date.now()).toLocaleString()}</strong></div>
            </div>

            {/* Info grid */}
            <div className="info-grid">
              <div className="section-card">
                <h3>Location</h3>
                <p style={{ margin:0 }}>{request.location?.address}</p>
              </div>

              {request.selectedShop && (
                <div className="section-card">
                  <h3>Selected Shop</h3>
                  <div style={{ fontWeight: 600 }}>{request.selectedShop.name}</div>
                  <div style={{ fontSize: '.9rem', opacity: .8 }}>{request.selectedShop.address} • {request.selectedShop.phone}</div>
                  {typeof request.selectedShop.distanceMiles === 'number' && (
                    <div style={{ fontSize: '.85rem', marginTop: 4 }}>~{request.selectedShop.distanceMiles.toFixed(1)} mi one-way</div>
                  )}
                  {request.serviceType === 'shop-pickup' && (
                    <div style={{ fontSize: '.85rem', color: '#666', marginTop: '.5rem' }}>
                      Tire payment is made directly to the shop; ZipFix covers technician labor and distance only.
                    </div>
                  )}
                </div>
              )}

              {request.pricing && (
                <div className="section-card">
                  <h3>Pricing</h3>
                  <ul className="price-list">
                    {typeof request.pricing.base === 'number' && (
                      <li><span>Base</span><strong>$ {request.pricing.base.toFixed(2)}</strong></li>
                    )}
                    {typeof request.pricing.service === 'number' && request.pricing.service > 0 && (
                      <li><span>Labor</span><strong>$ {request.pricing.service.toFixed(2)}</strong></li>
                    )}
                    {typeof request.pricing.perMile === 'number' && typeof request.pricing.estimatedMiles === 'number' && (
                      <li><span>Distance</span><strong>$ {request.pricing.perMile.toFixed(2)}/mi × {request.pricing.estimatedMiles.toFixed(1)} mi</strong></li>
                    )}
                    {typeof request.pricing.perUnit === 'number' && typeof request.pricing.maxUnits === 'number' && (
                      <li><span>Units</span><strong>$ {request.pricing.perUnit.toFixed(2)}/unit (max {request.pricing.maxUnits})</strong></li>
                    )}
                  </ul>
                  {typeof request.pricing.estimate === 'number' && (
                    <div className="price-estimate">Estimated total <strong>$ {request.pricing.estimate.toFixed(2)}</strong></div>
                  )}
                  {request.serviceType === 'jumpstart' && (
                    <div style={{ fontSize: '.85rem', color: '#666', marginTop: '.35rem' }}>
                      First jump included in $20 base. Up to 2 extra attempts at $12.50 each; capped at $45 total.
                    </div>
                  )}
                </div>
              )}

              {request.technicianId && (
                <div className="section-card">
                  <h3>Assigned Technician</h3>
                  <div style={{ fontWeight:600 }}>{request.technicianId?.name || 'Technician'}</div>
                  {Array.isArray(request.technicianId?.badges) && request.technicianId!.badges!.length > 0 && (
                    <div style={{ marginTop: '.25rem', fontSize: '.85rem', opacity:.8 }}>
                      Badges: {request.technicianId!.badges!.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Progress timeline */}
            <div className="section-card progress-card">
              <h3>Progress</h3>
              <ol className="timeline">
                {['assigned','en-route','on-location','in-progress','completed'].map((st) => (
                  <li key={st} className={`tl-item ${st} ${['assigned','en-route','on-location','in-progress','completed'].indexOf(request.status) >= ['assigned','en-route','on-location','in-progress','completed'].indexOf(st) ? 'done' : ''}`}>
                    <span className="tl-dot" />
                    <span className="tl-label">{st.replace('-', ' ')}</span>
                  </li>
                ))}
              </ol>
              {(request.status === 'assigned' || request.status === 'en-route' || request.status === 'on-location' || request.status === 'in-progress') && (
                <div style={{ fontSize:'.9rem', color:'#495057', marginTop:'.25rem' }}>Your technician is currently <strong>{request.status.replace('-', ' ')}</strong>.</div>
              )}
              {request.status === 'cancelled' && (
                <div style={{ fontSize:'.9rem', color:'#a94442', marginTop:'.25rem' }}>
                  Cancelled by {request.cancellation?.cancelledBy || 'system'} — {request.cancellation?.reason || 'No reason provided'}
                </div>
              )}
            </div>
          </div>
        )}
        <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap', marginTop:'.75rem' }}>
          <button onClick={onClose} className="btn btn-secondary">Close</button>
          {request && request.status !== 'completed' && request.status !== 'cancelled' && (
            <CancelAction requestId={request._id} onChanged={fetchServiceData} />
          )}
        </div>
      </div>
    </div>
  );
};

const CancelAction: React.FC<{ requestId: string; onChanged: () => void }> = ({ requestId, onChanged }) => {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE || ''}/api/services/status/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'cancelled', reason })
      });
      if (res.ok) {
        onChanged();
        setOpen(false);
      }
    } finally { setBusy(false); }
  };
  return (
    <div>
      {!open ? (
        <button className="btn btn-danger" onClick={() => setOpen(true)}>Cancel Request</button>
      ) : (
        <div className="box" style={{ display:'grid', gap:'.5rem' }}>
          <div style={{ fontWeight:600 }}>Cancel Request</div>
          <label style={{ fontSize:'.9rem' }}>Please tell us why the job can’t be done:</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="e.g., Issue resolved, schedule conflict, etc." />
          <div style={{ display:'flex', gap:'.5rem', justifyContent:'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>Back</button>
            <button className="btn btn-danger" disabled={busy || reason.trim().length < 5} onClick={submit}>Confirm Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusRow: React.FC<{ status: Request['status'] }> = ({ status }) => {
  const pretty = status.replace('-', ' ');
  const color = (
    status === 'pending' ? '#f39c12' :
    status === 'assigned' ? '#3498db' :
    status === 'en-route' ? '#2d9cdb' :
    status === 'on-location' ? '#f1c40f' :
    status === 'in-progress' ? '#e67e22' :
    status === 'completed' ? '#27ae60' :
    '#7f8c8d'
  );
  return (
    <div className="row">
      <strong>Status:</strong>
      <span style={{ marginLeft: 6 }}>
        <span
          className="status-pill"
          style={{
            background: color,
            color: 'white',
            padding: '2px 10px',
            borderRadius: 999,
            fontSize: '.8rem',
            textTransform: 'uppercase',
            letterSpacing: .3,
            animation: 'pulseIn .3s ease'
          }}
        >
          {pretty}
        </span>
      </span>
    </div>
  );
};

export default CustomerServiceView;
