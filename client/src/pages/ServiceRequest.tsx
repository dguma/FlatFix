import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ServiceRequest.css';

const ServiceRequest: React.FC = () => {
  const [formData, setFormData] = useState({
    serviceType: 'air-inflation',
    description: '',
    location: {
      address: ''
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationError, setLocationError] = useState('');
  
  const { token } = useAuth();
  const navigate = useNavigate();

  const serviceTypes = [
    {
      value: 'air-inflation',
      label: 'Air Inflation',
      description: 'Quick tire inflation service',
      icon: '💨'
    },
    {
      value: 'spare-replacement',
      label: 'Spare Tire Replacement',
      description: 'Replace flat tire with spare and inflate',
      icon: '🔧'
    },
    {
      value: 'shop-pickup',
      label: 'Shop Coordination',
      description: 'Help coordinate with local tire shops',
      icon: '🏪'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.location.address) {
      setLocationError('Please provide your location.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/services/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
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
                  placeholder="Enter your address"
                  required
                />
              </div>
              {locationError && <div className="error-message">{locationError}</div>}
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
