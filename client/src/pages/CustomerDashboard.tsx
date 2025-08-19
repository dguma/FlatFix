import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CustomerServiceView from '../components/CustomerServiceView';
import { API_BASE } from '../config';
import './Dashboard.css';
import { getCachedJson, usePageVisible } from '../utils/net';

interface ServiceRequest {
  _id: string;
  serviceType: string;
  status: 'pending' | 'assigned' | 'en-route' | 'on-location' | 'in-progress' | 'completed' | 'cancelled';
  location?: { address?: string };
  createdAt: string;
  technicianId?: { name?: string };
}

const CustomerDashboard: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const { token } = useAuth();
  const pageVisible = usePageVisible();

  const fetchMyRequests = useCallback(async () => {
    try {
      const data = await getCachedJson(`${API_BASE || ''}/api/services/my-requests`, {
        ttlMs: 8000,
        keyExtra: token || '',
        init: { headers: { 'Authorization': `Bearer ${token}` } }
      });
      if (Array.isArray(data)) setRequests(data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchMyRequests(); }, [fetchMyRequests]);

  // Polling for status changes (driver assignment/progress)
  const pollRef = useRef<number | null>(null);
  useEffect(() => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    if (!pageVisible) return; // no polling when tab hidden
    const runner = () => fetchMyRequests();
    pollRef.current = window.setInterval(runner, 12000); // 12s cadence
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, [fetchMyRequests, pageVisible]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffa500';
      case 'assigned': return '#2196f3';
      case 'en-route': return '#3f51b5';
      case 'on-location': return '#9c27b0';
      case 'in-progress': return '#ff9800';
      case 'completed': return '#4caf50';
      case 'cancelled': return '#f44336';
      default: return '#757575';
    }
  };

  if (loading) {
    return <div className="loading">Loading your requests...</div>;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>My Service Requests</h1>
          <Link to="/request-service" className="btn btn-primary">
            Request New Service
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="empty-state">
            <h3>No service requests yet</h3>
            <p>When you need tire help, request a service and we'll connect you with nearby technicians.</p>
            <Link to="/request-service" className="btn btn-primary">
              Request Your First Service
            </Link>
          </div>
        ) : (
          <div className="requests-list">
            {requests.map(request => (
              <div key={request._id} className="request-card">
                <div className="request-header">
                  <div className="service-type">
                    {request.serviceType === 'air-inflation' && '💨 Air Inflation'}
                    {request.serviceType === 'spare-replacement' && '🔧 Spare Replacement'}
                    {request.serviceType === 'shop-pickup' && '🏪 Shop Coordination'}
                  </div>
                  <div 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(request.status) }}
                  >
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </div>
                </div>

                <div className="request-details">
                  <p><strong>Location:</strong> {request.location?.address || 'Near provided location'}</p>
                  {request.serviceType === 'shop-pickup' && (
                    <div style={{ fontSize: '.9rem', marginTop: '.25rem' }}>
                      You pay your chosen shop directly for the tire. Your ZipFix.ai payment covers technician labor and round-trip distance.
                    </div>
                  )}
                  <p><strong>Requested:</strong> {new Date(request.createdAt).toLocaleString()}</p>
                  
                  {request.status === 'pending' && (
                    <div className="status-message">
                      <p>⏳ <strong>Looking for available technicians...</strong></p>
                    </div>
                  )}

                  {request.technicianId && (
                    <div className="technician-info">
                      <h4>Assigned Technician</h4>
                      <p><strong>Name:</strong> {request.technicianId.name || 'Technician'}</p>
                    </div>
                  )}

                  <div className="pending-actions" style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
                    <button 
                      onClick={() => setSelectedRequestId(request._id)}
                      className="btn btn-primary"
                    >
                      📋 View Request Details
                    </button>
                    {request.status !== 'completed' && request.status !== 'cancelled' && (
                      <button
                        onClick={() => setSelectedRequestId(request._id)}
                        className="btn btn-outline"
                      >Track Progress</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedRequestId && (
          <CustomerServiceView
            requestId={selectedRequestId}
            onClose={() => setSelectedRequestId(null)}
          />
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
