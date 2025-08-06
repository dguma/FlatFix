import React, { useState, useEffect, useCallback } from 'react';
import './CustomerServiceView.css';

interface CustomerServiceViewProps {
  requestId: string;
  onClose: () => void;
}

const CustomerServiceView: React.FC<CustomerServiceViewProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(true);

  const fetchServiceData = useCallback(async () => {
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServiceData();
  }, [fetchServiceData]);

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
      <div className="service-view-content">
        <div className="service-view-header">
          <h2>Service Request Details</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        <p>This is a simplified view. More details would be available in a full implementation.</p>
        <button onClick={onClose} className="btn btn-secondary">Close</button>
      </div>
    </div>
  );
};

export default CustomerServiceView;
