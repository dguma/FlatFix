import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CustomerServiceView from '../components/CustomerServiceView';
import { API_BASE } from '../config';
import './Dashboard.css';

interface ServiceRequest {
  _id: string;
  serviceType: string;
  status: string;
  location: {
    address: string;
  };
  createdAt: string;
  technicianId?: {
    username: string;
  };
}

const CustomerDashboard: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchMyRequests = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE || ''}/api/services/my-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffa500';
      case 'assigned': return '#2196f3';
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
                  <p><strong>Location:</strong> {request.location.address}</p>
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
                      <p><strong>Name:</strong> {request.technicianId.username}</p>
                    </div>
                  )}

                  <div className="pending-actions">
                    <button 
                      onClick={() => setSelectedRequestId(request._id)}
                      className="btn btn-primary"
                    >
                      📋 View Request Details
                    </button>
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
