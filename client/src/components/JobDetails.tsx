import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import MapComponent from './MapComponent';
import './JobDetails.css';

interface JobDetailsProps {
  jobId: string;
  onClose: () => void;
  onJobUpdate: () => void;
}

interface JobData {
  _id: string;
  customerId: {
    _id: string;
    name: string;
    phone: string;
  };
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
  customerCarInfo?: {
    make?: string;
    model?: string;
    year?: string;
    color?: string;
    licensePlate?: string;
    additionalInfo?: string;
  };
  chat: Array<{
    _id: string;
    senderId: string;
    senderType: 'customer' | 'technician';
    message: string;
    timestamp: string;
    read: boolean;
  }>;
  tracking?: {
    jobStartTime?: string;
    jobEndTime?: string;
    jobDurationMinutes: number;
    isTracking: boolean;
  };
  confirmations: {
    customerConfirmedArrival: boolean;
    customerConfirmedCompletion: boolean;
    technicianConfirmedCompletion: boolean;
  };
  createdAt: string;
}

const JobDetails: React.FC<JobDetailsProps> = ({ jobId, onClose, onJobUpdate }) => {
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [technicianLocation, setTechnicianLocation] = useState<{
    latitude: number;
    longitude: number;
  } | undefined>(undefined);

  const { token, user } = useAuth();
  const { socket } = useSocket();

  const fetchJobDetails = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/services/job-details/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setJobData(data);
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error);
    } finally {
      setLoading(false);
    }
  }, [jobId, token]);

  const handleNewMessage = useCallback((data: any) => {
    if (data.requestId === jobId) {
      setJobData(prev => prev ? {
        ...prev,
        chat: [...prev.chat, data.message]
      } : null);
    }
  }, [jobId]);

  const handleArrivalConfirmation = useCallback((data: any) => {
    if (data.requestId === jobId) {
      setJobData(prev => prev ? {
        ...prev,
        confirmations: {
          ...prev.confirmations,
          customerConfirmedArrival: true
        }
      } : null);
    }
  }, [jobId]);

  const handleCompletionConfirmation = useCallback((data: any) => {
    if (data.requestId === jobId) {
      setJobData(prev => prev ? {
        ...prev,
        confirmations: {
          ...prev.confirmations,
          customerConfirmedCompletion: true
        }
      } : null);
    }
  }, [jobId]);

  const handleJobCancellation = useCallback((data: any) => {
    if (data.requestId === jobId) {
      onJobUpdate();
      onClose();
    }
  }, [jobId, onJobUpdate, onClose]);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  useEffect(() => {
    if (socket) {
      socket.on('new-chat-message', handleNewMessage);
      socket.on('customer-confirmed-arrival', handleArrivalConfirmation);
      socket.on('customer-confirmed-completion', handleCompletionConfirmation);
      socket.on('job-cancelled', handleJobCancellation);

      return () => {
        socket.off('new-chat-message');
        socket.off('customer-confirmed-arrival');
        socket.off('customer-confirmed-completion');
        socket.off('job-cancelled');
      };
    }
  }, [socket, handleNewMessage, handleArrivalConfirmation, handleCompletionConfirmation, handleJobCancellation]);

  const acceptJob = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/services/accept/${jobId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        if (socket) {
          socket.emit('claim-request', {
            requestId: jobId,
            customerId: jobData?.customerId._id,
            technicianId: user?.id || user?.userId,
            technician: {
              name: user?.name,
              phone: user?.phone || '',
              vehicleInfo: user?.vehicleInfo || { make: '', model: '', licensePlate: '' }
            }
          });
        }
        fetchJobDetails();
        onJobUpdate();
      }
    } catch (error) {
      console.error('Failed to accept job:', error);
    }
  };

  const startNavigation = () => {
    if (jobData) {
      const destination = `${jobData.location.latitude},${jobData.location.longitude}`;
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  const confirmArrival = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/services/confirm-arrival/${jobId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        if (socket) {
          socket.emit('technician-arrived-confirmation', {
            requestId: jobId,
            customerId: jobData?.customerId._id
          });
        }
        fetchJobDetails();
      }
    } catch (error) {
      console.error('Failed to confirm arrival:', error);
    }
  };

  const startJob = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/services/start-job/${jobId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchJobDetails();
      }
    } catch (error) {
      console.error('Failed to start job:', error);
    }
  };

  const completeJob = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/services/complete-job/${jobId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        if (socket) {
          socket.emit('technician-completed-job', {
            requestId: jobId,
            customerId: jobData?.customerId._id
          });
        }
        fetchJobDetails();
      }
    } catch (error) {
      console.error('Failed to complete job:', error);
    }
  };

  const sendMessage = async () => {
    if (!chatMessage.trim()) return;

    const messageToSend = chatMessage.trim();
    setChatMessage(''); // Clear input immediately

    try {
      const response = await fetch(`http://localhost:5000/api/services/send-message/${jobId}`, {
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
        setJobData(prev => prev ? {
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

  const cancelJob = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/services/cancel/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          reason: cancellationReason,
          cancelledBy: 'technician'
        })
      });

      if (response.ok) {
        if (socket) {
          socket.emit('job-cancelled', {
            requestId: jobId,
            customerId: jobData?.customerId._id,
            cancelledBy: 'technician',
            reason: cancellationReason
          });
        }
        onJobUpdate();
        onClose();
      } else {
        const errorData = await response.json();
        alert(`Failed to cancel job: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Failed to cancel job:', error);
      alert('An error occurred while cancelling the job.');
    }
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

  if (!jobData) {
    return (
      <div className="job-details-modal">
        <div className="job-details-content">
          <div className="error">Failed to load job details</div>
          <button onClick={onClose} className="btn btn-secondary">Close</button>
        </div>
      </div>
    );
  }

  const canComplete = jobData.confirmations?.customerConfirmedArrival && 
                     jobData.tracking?.jobStartTime && 
                     !jobData.confirmations?.technicianConfirmedCompletion;

  const isCompleted = jobData.confirmations?.customerConfirmedCompletion && 
                      jobData.confirmations?.technicianConfirmedCompletion;

  return (
    <div className="job-details-modal">
      <div className="job-details-content">
        <div className="job-details-header">
          <h2>Job Details</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="job-overview">
          <div className="service-info">
            <h3>
              {jobData.serviceType === 'air-inflation' && '💨 Air Inflation Service'}
              {jobData.serviceType === 'spare-replacement' && '🔧 Spare Tire Replacement'}
              {jobData.serviceType === 'shop-pickup' && '🏪 Shop Coordination'}
            </h3>
            <div className="job-status">
              Status: <span className={`status ${jobData.status}`}>{jobData.status}</span>
            </div>
            <div className="job-pay">Payment: ${jobData.pricing.totalAmount}</div>
          </div>

          <div className="customer-info">
            <h4>Customer Information</h4>
            <p><strong>Name:</strong> {jobData.customerId.name}</p>
            <p><strong>Phone:</strong> {jobData.customerId.phone}</p>
            <p><strong>Location:</strong> {jobData.location.address}</p>
            <p><strong>Description:</strong> {jobData.description}</p>
          </div>

          {jobData.customerCarInfo && (
            <div className="car-info">
              <h4>Vehicle Information</h4>
              {jobData.customerCarInfo.make && <p><strong>Make:</strong> {jobData.customerCarInfo.make}</p>}
              {jobData.customerCarInfo.model && <p><strong>Model:</strong> {jobData.customerCarInfo.model}</p>}
              {jobData.customerCarInfo.year && <p><strong>Year:</strong> {jobData.customerCarInfo.year}</p>}
              {jobData.customerCarInfo.color && <p><strong>Color:</strong> {jobData.customerCarInfo.color}</p>}
              {jobData.customerCarInfo.licensePlate && <p><strong>License:</strong> {jobData.customerCarInfo.licensePlate}</p>}
              {jobData.customerCarInfo.additionalInfo && <p><strong>Notes:</strong> {jobData.customerCarInfo.additionalInfo}</p>}
            </div>
          )}
        </div>

        <div className="map-section">
          <h4>Location</h4>
          <MapComponent
            customerLocation={jobData.location}
            technicianLocation={technicianLocation}
            height="250px"
            zoom={14}
          />
        </div>

        <div className="job-actions">
          {jobData.status === 'pending' && (
            <>
              <button onClick={acceptJob} className="btn btn-success">
                ✅ Accept Job
              </button>
              <button onClick={() => setShowCancelModal(true)} className="btn btn-danger">
                ❌ Decline
              </button>
            </>
          )}

          {jobData.status === 'assigned' && (
            <>
              <button onClick={startNavigation} className="btn btn-primary">
                🧭 Start Navigation
              </button>
              <button onClick={confirmArrival} className="btn btn-warning">
                📍 Confirm Arrival
              </button>
              <button onClick={() => setShowCancelModal(true)} className="btn btn-danger">
                ❌ Cancel Job
              </button>
            </>
          )}

          {jobData.confirmations?.customerConfirmedArrival && !jobData.tracking?.jobStartTime && (
            <button onClick={startJob} className="btn btn-success">
              🚀 Start Job Timer
            </button>
          )}

          {canComplete && (
            <button onClick={completeJob} className="btn btn-success">
              ✅ Complete Job
            </button>
          )}

          {isCompleted && (
            <div className="completion-message">
              ✅ Job completed successfully! 
              {jobData.tracking?.jobDurationMinutes && (
                <span> Duration: {jobData.tracking.jobDurationMinutes} minutes</span>
              )}
            </div>
          )}
        </div>

        {/* Chat section - only show for accepted jobs */}
        {(jobData.status === 'assigned' || jobData.status === 'in-progress') && (
          <div className="chat-section">
            <h4>Chat with Customer</h4>
            <div className="chat-messages">
              {jobData.chat.map(msg => (
                <div key={msg._id} className={`message ${msg.senderType === 'technician' ? 'own' : 'other'}`}>
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

        {showCancelModal && (
          <div className="cancel-modal">
            <div className="cancel-content">
              <h3>Cancel Job</h3>
              <p>Are you sure you want to cancel this job?</p>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Reason for cancellation (optional)"
                rows={3}
              />
              <div className="cancel-actions">
                <button onClick={() => setShowCancelModal(false)} className="btn btn-secondary">
                  Keep Job
                </button>
                <button onClick={cancelJob} className="btn btn-danger">
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetails;
