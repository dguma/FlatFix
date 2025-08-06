import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import './ServiceRequest.css';

const ServiceRequest: React.FC = () => {
  const [formData, setFormData] = useState({
    serviceType: 'air-inflation',
    description: '',
    location: {
      address: '',
      latitude: 0,
      longitude: 0
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationError, setLocationError] = useState('');
  
  const { token } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const serviceTypes = [
    {
      value: 'air-inflation',
      label: 'Air Inflation',
      description: 'Quick tire inflation service',
      price: 20,
      icon: '💨'
    },
    {
      value: 'spare-replacement',
      label: 'Spare Tire Replacement',
      description: 'Replace flat tire with spare and inflate',
      price: 35,
      icon: '🔧'
    },
    {
      value: 'shop-pickup',
      label: 'Shop Coordination',
      description: 'Help coordinate with local tire shops',
      price: 45,
      icon: '🏪'
    }
  ];

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocoding to get address
          try {
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_OPENCAGE_API_KEY`
            );
            const data = await response.json();
            const address = data.results[0]?.formatted || `${latitude}, ${longitude}`;
            
            setFormData(prev => ({
              ...prev,
              location: { latitude, longitude, address }
            }));
            setLocationError('');
          } catch (error) {
            // Fallback to coordinates if geocoding fails
            setFormData(prev => ({
              ...prev,
              location: { 
                latitude, 
                longitude, 
                address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
              }
            }));
          }
        },
        (error) => {
          setLocationError('Unable to get your location. Please enter manually.');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.location.address) {
      setLocationError('Please provide your location.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/services/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const serviceRequest = await response.json();
        
        // Emit new service request to technicians via socket
        if (socket) {
          socket.emit('new-service-request', serviceRequest.serviceRequest);
        }

        navigate('/customer-dashboard');
      } else {
        throw new Error('Failed to create service request');
      }
    } catch (error) {
      console.error('Error creating service request:', error);
      alert('Failed to create service request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedService = serviceTypes.find(s => s.value === formData.serviceType);

  return (
    <div className="service-request-page">
      <div className="container">
        <div className="service-request-card">
          <h2>Request Tire Service</h2>
          <p>Get help with your tire emergency</p>

          <form onSubmit={handleSubmit} className="service-form">
            <div className="form-group">
              <label>Service Type</label>
              <div className="service-options">
                {serviceTypes.map(service => (
                  <label key={service.value} className="service-option">
                    <input
                      type="radio"
                      name="serviceType"
                      value={service.value}
                      checked={formData.serviceType === service.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                    />
                    <div className="service-card">
                      <div className="service-icon">{service.icon}</div>
                      <div className="service-info">
                        <h3>{service.label}</h3>
                        <p>{service.description}</p>
                        <div className="service-price">${service.price}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description of Problem</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your tire problem (e.g., flat tire, low pressure, etc.)"
                rows={4}
                required
              />
            </div>

            <div className="form-group">
              <label>Your Location</label>
              <div className="location-input">
                <input
                  type="text"
                  value={formData.location.address}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, address: e.target.value }
                  }))}
                  placeholder="Enter your address or use current location"
                  required
                />
                <button 
                  type="button" 
                  onClick={getCurrentLocation}
                  className="btn btn-secondary location-btn"
                >
                  📍 Use Current Location
                </button>
              </div>
              {locationError && <div className="error-message">{locationError}</div>}
            </div>

            <div className="service-summary">
              <h3>Service Summary</h3>
              <div className="summary-item">
                <span>Service: {selectedService?.label}</span>
                <span>${selectedService?.price}</span>
              </div>
              <div className="summary-total">
                <span>Total: ${selectedService?.price}</span>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-large"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Requesting Service...' : 'Request Service'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ServiceRequest;
