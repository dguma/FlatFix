import React, { useState, useEffect, useCallback } from 'react';
import './CustomerServiceView.css';
import { API_BASE } from '../config';
import { useAuth } from '../contexts/AuthContext';

interface CustomerServiceViewProps {
  requestId: string;
  onClose: () => void;
}

type Shop = { name?: string; phone?: string; address?: string; latitude?: number; longitude?: number; distanceMiles?: number };
type Pricing = { base?: number; service?: number; perUnit?: number; maxUnits?: number; perMile?: number; estimatedMiles?: number; estimate?: number; currency?: string };
type Request = {
  _id: string;
  serviceType: string;
  status: string;
  description: string;
  location: { address: string; latitude?: number; longitude?: number };
  selectedShop?: Shop;
  pricing?: Pricing;
  createdAt?: string;
};

const CustomerServiceView: React.FC<CustomerServiceViewProps> = ({ requestId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<Request | null>(null);
  const { token } = useAuth();

  const fetchServiceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE || ''}/api/services/${requestId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setRequest(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [requestId, token]);

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
        {error && <div className="error-message" style={{ marginBottom: '.5rem' }}>{error}</div>}
        {request && (
          <div className="service-view-body">
            <div className="row"><strong>Type:</strong> <span style={{ marginLeft: 6 }}>{request.serviceType}</span></div>
            <div className="row"><strong>Status:</strong> <span style={{ marginLeft: 6 }}>{request.status}</span></div>
            <div className="row"><strong>Location:</strong> <span style={{ marginLeft: 6 }}>{request.location?.address}</span></div>
            {request.selectedShop && (
              <div className="box" style={{ marginTop: '.5rem' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Selected Shop</div>
                <div>{request.selectedShop.name}</div>
                <div style={{ fontSize: '.9rem', opacity: .8 }}>{request.selectedShop.address} • {request.selectedShop.phone}</div>
                {typeof request.selectedShop.distanceMiles === 'number' && (
                  <div style={{ fontSize: '.85rem', marginTop: 4 }}>~{request.selectedShop.distanceMiles.toFixed(1)} mi one-way</div>
                )}
              </div>
            )}

            {request.pricing && (
              <div className="box" style={{ marginTop: '.75rem' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Pricing</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {typeof request.pricing.base === 'number' && (
                    <li>$ {request.pricing.base.toFixed(2)} base</li>
                  )}
                  {typeof request.pricing.service === 'number' && request.pricing.service > 0 && (
                    <li>$ {request.pricing.service.toFixed(2)} labor</li>
                  )}
                  {typeof request.pricing.perMile === 'number' && typeof request.pricing.estimatedMiles === 'number' && (
                    <li>$ {request.pricing.perMile.toFixed(2)}/mi × {request.pricing.estimatedMiles.toFixed(1)} mi</li>
                  )}
                  {typeof request.pricing.perUnit === 'number' && typeof request.pricing.maxUnits === 'number' && (
                    <li>$ {request.pricing.perUnit.toFixed(2)}/unit (max {request.pricing.maxUnits})</li>
                  )}
                </ul>
                {typeof request.pricing.estimate === 'number' && (
                  <div style={{ marginTop: '.35rem' }}>
                    Estimated total: <strong>$ {request.pricing.estimate.toFixed(2)}</strong>
                  </div>
                )}
                {request.serviceType === 'jumpstart' && (
                  <div style={{ fontSize: '.8rem', color: '#666', marginTop: '.25rem' }}>
                    First jump included in $20 base. Up to 2 extra attempts at $12.50 each; capped at $45 total.
                  </div>
                )}
                {request.serviceType === 'shop-pickup' && (
                  <div style={{ fontSize: '.85rem', color: '#666', marginTop: '.25rem' }}>
                    Note: Tire cost is paid directly to the shop. This estimate covers technician labor and distance only.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <button onClick={onClose} className="btn btn-secondary">Close</button>
      </div>
    </div>
  );
};

export default CustomerServiceView;
