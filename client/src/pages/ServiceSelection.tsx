import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const services = [
  { key: 'air-inflation', label: 'Air Inflation', price: '$20 base' },
  { key: 'spare-replacement', label: 'Spare Replacement', price: '$20 base + $15 service' },
  { key: 'shop-pickup', label: 'Shop Coordination', price: '$20 base + labor + distance' },
  { key: 'lockout', label: 'Lockout Assistance', price: '$20 base + service' },
  { key: 'jumpstart', label: 'Jumpstart', price: '$20 base; up to 3 jumps capped at $45' },
  { key: 'fuel-delivery', label: 'Fuel Delivery', price: '$20 base + $10/gal (max 2)' }
];

const ServiceSelection: React.FC = () => {
  const navigate = useNavigate();
  const [hasSpare, setHasSpare] = React.useState(false);
  const handleSelect = (service: string) => {
    navigate('/readiness-check', { state: { serviceType: service, hasSpare } });
  };
  return (
    <div className="container" style={{ padding: '1.5rem' }}>
      <h1>Select Service</h1>
      <div style={{ margin: '1rem 0' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <input type="checkbox" checked={hasSpare} onChange={e => setHasSpare(e.target.checked)} /> Have spare?
        </label>
      </div>
      <div className="services-grid">
        {services.map(s => (
          <button key={s.key} onClick={() => handleSelect(s.key)} className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
            {s.label} <span style={{ opacity: .7, marginLeft: '.5rem' }}>{s.price}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
export default ServiceSelection;
