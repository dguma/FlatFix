import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import CustomerTracking from './CustomerTracking';
import './CustomerServiceView.css';

interface CustomerServiceViewProps {
  requestId: string;
  onClose: () => void;
}

interface ServiceData {
  _id: string;
  serviceType: string;
  status: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  description: string;
  pricing: {
    totalAmount: number;
  };
  technicianId?: {
    _id: string;
    name: string;
    phone: string;
    vehicleInfo: {
      make: string;
      model: string;
      licensePlate: string;
    };
  };
  chat: Array<{
    _id: string;
    senderId: string;
    senderType: 'customer' | 'technician';
    message: string;
    timestamp: string;
    read: boolean;
  }>;
  confirmations?: {
    customerConfirmedArrival: boolean;
    customerConfirmedCompletion: boolean;
    technicianConfirmedCompletion: boolean;
  };
  tracking?: {
    jobStartTime?: string;
    jobEndTime?: string;
    jobDurationMinutes: number;
    isTracking: boolean;
  };
  reviews?: {
    customerReview?: {
      rating: number;
      comment: string;
    };
    technicianReview?: {
      rating: number;
      comment: string;
    };
  };
  createdAt: string;
}

const CustomerServiceView: React.FC<CustomerServiceViewProps> = ({ requestId, onClose }) => {
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [showTracking, setShowTracking] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const { token } = useAuth();
  const { socket } = useSocket();

  const fetchServiceData = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/services/tracking/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setServiceData(data);
      }
    } catch (error) {
      console.error('Failed to fetch service data:', error);
    } finally {
      setLoading(false);
    }
  }, [requestId, token]);

  const handleNewMessage = useCallback((data: any) => {
    if (data.requestId === requestId) {
      setServiceData(prev => prev ? {
        ...prev,
        chat: [...prev.chat, data.message]
      } : null);
    }
  }, [requestId]);

  const handleTechnicianArrival = useCallback((data: any) => {
    if (data.requestId === requestId) {
      // Show arrival notification
      alert('Your technician has arrived! Please confirm their arrival.');
      fetchServiceData();
    }
  }, [requestId, fetchServiceData]);

  const handleTechnicianCompletion = useCallback((data: any) => {
    if (data.requestId === requestId) {
      // Show completion notification
      alert('Technician has completed the service! Please confirm completion.');
      fetchServiceData();
    }
  }, [requestId, fetchServiceData]);

  const handleJobCancellation = useCallback((data: any) => {
    if (data.requestId === requestId) {
      alert('This service has been cancelled by the technician.');
      onClose();
    }
  }, [requestId, onClose]);

  useEffect(() => {
    fetchServiceData();
  }, [fetchServiceData]);

  useEffect(() => {
    if (socket) {
      socket.on('new-chat-message', handleNewMessage);
      socket.on('technician-arrived-confirmation', handleTechnicianArrival);
      socket.on('technician-completed-job', handleTechnicianCompletion);
      socket.on('job-cancelled', handleJobCancellation);

      return () => {
        socket.off('new-chat-message');
        socket.off('technician-arrived-confirmation');
        socket.off('technician-completed-job');
        socket.off('job-cancelled');
      };
    }
  }, [socket, handleNewMessage, handleTechnicianArrival, handleTechnicianCompletion, handleJobCancellation]);

  const confirmArrival = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/services/confirm-customer-arrival/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        if (socket) {
          socket.emit('customer-confirmed-arrival', {
            requestId: requestId,
            technicianId: serviceData?.technicianId?._id
          });
        }
        fetchServiceData();
      }
    } catch (error) {
      console.error('Failed to confirm arrival:', error);
    }
  };

  const confirmCompletion = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/services/confirm-customer-completion/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        if (socket) {
          socket.emit('customer-confirmed-completion', {
            requestId: requestId,
            technicianId: serviceData?.technicianId?._id
          });
        }
        fetchServiceData();
        setShowReviewModal(true);
      }
    } catch (error) {
      console.error('Failed to confirm completion:', error);
    }
  };

  const sendMessage = async () => {
    if (!chatMessage.trim()) return;

    const messageToSend = chatMessage.trim();
    setChatMessage(''); // Clear input immediately

    try {
      const response = await fetch(`http://localhost:5000/api/services/send-message/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: messageToSend })
      });

      if (response.ok) {
        const data = await response.json();
        // Add message immediately to our own chat
        setServiceData(prev => prev ? {
          ...prev,
          chat: [...prev.chat, data.message]
        } : null);
      } else {
        // Restore message in input on error
        setChatMessage(messageToSend);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message in input on error
      setChatMessage(messageToSend);
    }
  };

  const cancelService = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/services/cancel/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          reason: cancellationReason,
          cancelledBy: 'customer'
        })
      });

      if (response.ok) {
        if (socket && serviceData?.technicianId) {
          socket.emit('job-cancelled', {
            requestId: requestId,
            technicianId: serviceData.technicianId._id,
            cancelledBy: 'customer',
            reason: cancellationReason
          });
        }
        onClose();
      }
    } catch (error) {
      console.error('Failed to cancel service:', error);
    }
  };

  const submitReview = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/services/review/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          rating,
          comment: reviewComment,
          reviewType: 'customer'
        })
      });

      if (response.ok) {
        setShowReviewModal(false);
        fetchServiceData();
        alert('Thank you for your review!');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  if (loading) {
    return (
      <div className="service-view-modal">
        <div className="service-view-content">
          <div className="loading">Loading service details...</div>
        </div>
      </div>
    );
  }

  if (!serviceData) {
    return (
      <div className="service-view-modal">
        <div className="service-view-content">
          <div className="error">Failed to load service details</div>
          <button onClick={onClose} className="btn btn-secondary">Close</button>
        </div>
      </div>
    );
  }

  const canCancel = serviceData.status === 'pending' || 
                   (serviceData.status === 'assigned' && !serviceData.confirmations?.customerConfirmedArrival);

  const canConfirmArrival = serviceData.status === 'assigned' && 
                           serviceData.technicianId && 
                           !serviceData.confirmations?.customerConfirmedArrival;

  const canConfirmCompletion = serviceData.confirmations?.technicianConfirmedCompletion && 
                              !serviceData.confirmations?.customerConfirmedCompletion;

  const isCompleted = serviceData.confirmations?.customerConfirmedCompletion && 
                      serviceData.confirmations?.technicianConfirmedCompletion;

  return (
    <div className="service-view-modal">
      <div className="service-view-content">
        <div className="service-view-header">
          <h2>Service Details</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="service-overview">
          <div className="service-info">
            <h3>
              {serviceData.serviceType === 'air-inflation' && '💨 Air Inflation Service'}
              {serviceData.serviceType === 'spare-replacement' && '🔧 Spare Tire Replacement'}
              {serviceData.serviceType === 'shop-pickup' && '🏪 Shop Coordination'}
            </h3>
            <div className="service-status">
              Status: <span className={`status ${serviceData.status}`}>{serviceData.status}</span>
            </div>
            <div className="service-cost">Total: ${serviceData.pricing.totalAmount}</div>
            <div className="service-location">Location: {serviceData.location.address}</div>
          </div>

          {serviceData.technicianId && (
            <div className="technician-info">
              <h4>Your Technician</h4>
              <p><strong>Name:</strong> {serviceData.technicianId.name}</p>
              <p><strong>Phone:</strong> {serviceData.technicianId.phone}</p>
              <p><strong>Vehicle:</strong> {serviceData.technicianId.vehicleInfo.make} {serviceData.technicianId.vehicleInfo.model}</p>
              <p><strong>License:</strong> {serviceData.technicianId.vehicleInfo.licensePlate}</p>
            </div>
          )}
        </div>

        {serviceData.tracking?.jobStartTime && (
          <div className="job-timer">
            <h4>Service Progress</h4>
            <p><strong>Started:</strong> {new Date(serviceData.tracking.jobStartTime).toLocaleTimeString()}</p>
            {serviceData.tracking.jobEndTime && (
              <p><strong>Completed:</strong> {new Date(serviceData.tracking.jobEndTime).toLocaleTimeString()}</p>
            )}
            {serviceData.tracking.jobDurationMinutes > 0 && (
              <p><strong>Duration:</strong> {serviceData.tracking.jobDurationMinutes} minutes</p>
            )}
          </div>
        )}

        <div className="service-actions">
          {canConfirmArrival && (
            <button onClick={confirmArrival} className="btn btn-warning">
              ✅ Confirm Technician Arrival
            </button>
          )}

          {serviceData.technicianId && serviceData.status !== 'pending' && (
            <>
              <button onClick={() => setShowTracking(true)} className="btn btn-primary">
                📍 Track Live Location
              </button>
              <button 
                onClick={() => window.open(`tel:${serviceData.technicianId?.phone}`)}
                className="btn btn-success"
              >
                📞 Call Technician
              </button>
            </>
          )}

          {canConfirmCompletion && (
            <button onClick={confirmCompletion} className="btn btn-success">
              ✅ Confirm Service Completion
            </button>
          )}

          {canCancel && (
            <button onClick={() => setShowCancelModal(true)} className="btn btn-danger">
              ❌ Cancel Service
            </button>
          )}

          {isCompleted && !serviceData.reviews?.customerReview && (
            <button onClick={() => setShowReviewModal(true)} className="btn btn-primary">
              ⭐ Rate Service
            </button>
          )}
        </div>

        {serviceData.technicianId && (
          <div className="chat-section">
            <h4>Chat with Technician</h4>
            <div className="chat-messages">
              {serviceData.chat.map(msg => (
                <div key={msg._id} className={`message ${msg.senderType === 'customer' ? 'own' : 'other'}`}>
                  <div className="message-content">{msg.message}</div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} className="btn btn-primary">Send</button>
            </div>
          </div>
        )}

        {showTracking && (
          <CustomerTracking
            requestId={requestId}
            onClose={() => setShowTracking(false)}
          />
        )}

        {showCancelModal && (
          <div className="cancel-modal">
            <div className="cancel-content">
              <h3>Cancel Service</h3>
              <p>Are you sure you want to cancel this service?</p>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Reason for cancellation (optional)"
                rows={3}
              />
              <div className="cancel-actions">
                <button onClick={() => setShowCancelModal(false)} className="btn btn-secondary">
                  Keep Service
                </button>
                <button onClick={cancelService} className="btn btn-danger">
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showReviewModal && (
          <div className="review-modal">
            <div className="review-content">
              <h3>Rate Your Service</h3>
              <div className="rating-section">
                <p>How was your experience?</p>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`star ${star <= rating ? 'active' : ''}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Tell us about your experience (optional)"
                rows={4}
              />
              <div className="review-actions">
                <button onClick={() => setShowReviewModal(false)} className="btn btn-secondary">
                  Skip Review
                </button>
                <button onClick={submitReview} className="btn btn-primary">
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerServiceView;
