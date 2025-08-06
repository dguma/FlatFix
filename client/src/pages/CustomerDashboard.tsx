import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import CustomerTracking from '../components/CustomerTracking';
import CustomerServiceView from '../components/CustomerServiceView';
import './Dashboard.css';

interface ServiceRequest {
  _id: string;
  serviceType: string;
  status: string;
  location: {
    address: string;
  };
  pricing: {
    totalAmount: number;
  };
  createdAt: string;
  technicianId?: {
    name: string;
    phone: string;
    vehicleInfo: {
      make: string;
      model: string;
      licensePlate: string;
    };
  };
}

const CustomerDashboard: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingRequestId, setTrackingRequestId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const { token } = useAuth();
  const { socket } = useSocket();

  const fetchMyRequests = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/services/my-requests', {
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

  useEffect(() => {
    if (socket) {
      const handleTechnicianAssigned = (data: any) => {
        setRequests(prev => prev.map(req => 
          req._id === data.requestId 
            ? { ...req, status: 'assigned', technicianId: data.technician }
            : req
        ));
      };

      const handleLocationUpdate = (data: any) => {
        console.log('Technician location update:', data);
      };

      const handleServiceCompleted = (data: any) => {
        setRequests(prev => prev.map(req => 
          req._id === data.requestId 
            ? { ...req, status: 'completed' }
            : req
        ));
      };

      socket.on('technician-assigned', handleTechnicianAssigned);
      socket.on('technician-location', handleLocationUpdate);
      socket.on('service-completed', handleServiceCompleted);

      return () => {
        socket.off('technician-assigned');
        socket.off('technician-location');
        socket.off('service-completed');
      };
    }
  }, [socket]);

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
                  <p><strong>Total:</strong> ${request.pricing.totalAmount}</p>
                  <p><strong>Requested:</strong> {new Date(request.createdAt).toLocaleString()}</p>
                  
                  {/* Status-specific messages */}
                  {request.status === 'pending' && (
                    <div className="status-message">
                      <p>⏳ <strong>Looking for available technicians...</strong></p>
                      <p>We're finding the best technician for your service. You'll be notified when one accepts your request.</p>
                    </div>
                  )}
                  
                  {request.technicianId && (
                    <div className="technician-info">
                      <h4>Assigned Technician</h4>
                      <p><strong>Name:</strong> {request.technicianId.name}</p>
                      <p><strong>Phone:</strong> {request.technicianId.phone}</p>
                      <p><strong>Vehicle:</strong> {request.technicianId.vehicleInfo.make} {request.technicianId.vehicleInfo.model} ({request.technicianId.vehicleInfo.licensePlate})</p>
                      
                      {/* Status-specific messages for assigned technician */}
                      {request.status === 'assigned' && (
                        <div className="status-message">
                          <p>👤 <strong>Technician assigned!</strong></p>
                          <p>Your technician will start the service shortly. You can chat with them and track their progress.</p>
                        </div>
                      )}
                      
                      {request.status === 'in-progress' && (
                        <div className="status-message">
                          <p>🚗 <strong>Service in progress!</strong></p>
                          <p>Your technician is on the way or working on your tire. Track their live location below.</p>
                        </div>
                      )}
                      
                      <div className="service-actions">
                        <button 
                          onClick={() => setSelectedRequestId(request._id)}
                          className="btn btn-primary"
                        >
                          📋 View Service Details
                        </button>
                        
                        {/* Only show live tracking for in-progress jobs */}
                        {request.status === 'in-progress' && (
                          <button 
                            onClick={() => setTrackingRequestId(request._id)}
                            className="btn btn-secondary tracking-btn"
                          >
                            📍 Track Live Location
                          </button>
                        )}
                        
                        {/* Show call button for assigned or in-progress jobs */}
                        {(request.status === 'assigned' || request.status === 'in-progress') && (
                          <button 
                            onClick={() => window.open(`tel:${request.technicianId?.phone}`)}
                            className="btn btn-success"
                          >
                            📞 Call Technician
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {!request.technicianId && request.status === 'pending' && (
                    <div className="pending-actions">
                      <button 
                        onClick={() => setSelectedRequestId(request._id)}
                        className="btn btn-primary"
                      >
                        📋 View Request Details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {trackingRequestId && (
          <CustomerTracking
            requestId={trackingRequestId}
            onClose={() => setTrackingRequestId(null)}
          />
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
