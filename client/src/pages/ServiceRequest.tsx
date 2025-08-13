import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../config';
import './ServiceRequest.css';
import { useGeolocation } from '../hooks/useGeolocation';

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
  const { coords, loading: geoLoading, error: geoError, request: requestGeo } = useGeolocation(false);
  const [shopSuggestions, setShopSuggestions] = useState<Array<{name:string; phone:string; address:string; latitude?: number; longitude?: number}> | null>(null);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [selectedShop, setSelectedShop] = useState<{name:string; phone:string; address:string; latitude?: number; longitude?: number} | null>(null);
  const [estimatedMiles, setEstimatedMiles] = useState<number>(5);
  const [jumpExtras, setJumpExtras] = useState<number>(0); // extra jumps beyond first (0-2)
  
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
    },
    {
      value: 'lockout',
      label: 'Vehicle Lockout',
      description: 'Assist unlocking car when keys are inside',
      icon: '🔑'
    },
    {
      value: 'jumpstart',
      label: 'Jumpstart',
      description: 'Get your car started with a battery boost',
      icon: '⚡'
    },
    {
      value: 'fuel-delivery',
      label: 'Fuel Delivery',
      description: 'Emergency fuel delivered to you',
      icon: '⛽'
    }
  ];

  // If we obtained coordinates and no manual address yet, pre-fill a placeholder (reverse geocode not implemented yet)
  useEffect(() => {
    if (!coords) return;
    setFormData(prev => {
      if (prev.location.address) return prev; // don't override manual entry
      return { ...prev, location: { address: `Lat ${coords.latitude.toFixed(5)}, Lng ${coords.longitude.toFixed(5)}` } };
    });
  }, [coords]);

  // Load shop suggestions when shop coordination selected
  useEffect(() => {
    const load = async () => {
      if (formData.serviceType !== 'shop-pickup') return;
      setShopsLoading(true);
      try {
        const qs = coords
          ? `lat=${encodeURIComponent(coords.latitude)}&lon=${encodeURIComponent(coords.longitude)}&radius=50`
          : `postal=10019&radius=50`;
        const res = await fetch(`${API_BASE || ''}/api/services/shops/suggestions?${qs}`);
        if (res.ok) {
          const data = await res.json();
          setShopSuggestions(data.suggestions || []);
        } else {
          setShopSuggestions([]);
        }
      } catch {
        setShopSuggestions([]);
      } finally {
        setShopsLoading(false);
      }
    };
    load();
  }, [formData.serviceType, coords]);

  const haversineMiles = (aLat: number, aLon: number, bLat: number, bLon: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 3958.8; // miles
    const dLat = toRad(bLat - aLat);
    const dLon = toRad(bLon - aLon);
    const lat1 = toRad(aLat);
    const lat2 = toRad(bLat);
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.location.address) {
      setLocationError('Please provide your location.');
      return;
    }

  setSubmitError(null);
  setIsSubmitting(true);

    try {
      const body: any = { ...formData };
      if (coords) {
        body.location = { ...body.location, latitude: coords.latitude, longitude: coords.longitude };
      }
      if (formData.serviceType === 'shop-pickup') {
        if (selectedShop) body.selectedShop = selectedShop;
        if (estimatedMiles >= 0) body.estimatedMiles = estimatedMiles;
      }
      if (formData.serviceType === 'jumpstart') {
        body.jumpExtras = Math.max(0, Math.min(2, Number.isFinite(jumpExtras) ? jumpExtras : 0));
      }

      const response = await fetch(`${API_BASE || ''}/api/services/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        navigate('/customer-dashboard');
      } else {
        let msg = 'Failed to create service request';
        try {
          const data = await response.json();
          if (data && data.message) msg = data.message;
        } catch {}
        setSubmitError(msg);
        return;
      }
    } catch (error) {
      console.error('Error creating service request:', error);
      setSubmitError('Network or server error. Please try again.');
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
              {formData.serviceType === 'shop-pickup' && (
                <div style={{ marginTop: '.5rem', fontSize: '.9rem', color: '#555' }}>
                  Note: You pay your chosen shop directly for the tire. Your payment here covers technician labor and distance.
                </div>
              )}
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
              <div className="location-input" style={{ display:'flex', gap:'.5rem', alignItems:'center' }}>
                <input
                  type="text"
                  value={formData.location.address}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, address: e.target.value }
                  }))}
                  placeholder="Enter your address or use GPS"
                  required
                  style={{ flex:1 }}
                />
                <button type="button" className="btn btn-outline" onClick={requestGeo} disabled={geoLoading}>
                  {geoLoading ? 'Locating...' : 'Use GPS'}
                </button>
              </div>
              {geoError && <div className="error-message">{geoError}</div>}
              {locationError && <div className="error-message">{locationError}</div>}
            </div>

            {formData.serviceType === 'jumpstart' && (
              <div className="form-group">
                <label><strong>How many jump attempts do you want included?</strong></label>
                <div style={{ fontSize: '.9rem', color: '#555', marginBottom: '.35rem' }}>
                  $20 base covers one jump. You can add up to 2 extra attempts at $12.50 each, capped at $45 total.
                </div>
                <div>
                  <label htmlFor="jumpExtras">Extra jumps (0-2): </label>
                  <input id="jumpExtras" type="number" min={0} max={2} step={1} value={jumpExtras} onChange={e => setJumpExtras(parseInt(e.target.value || '0', 10))} style={{ width:'80px', marginLeft: '.5rem' }} />
                </div>
                <div style={{ fontSize: '.85rem', marginTop: '.35rem' }}>
                  Estimate: <strong>{(() => {
                    const extras = Math.max(0, Math.min(2, Number.isFinite(jumpExtras) ? jumpExtras : 0));
                    const est = 20 + 12.5 * extras;
                    const capped = Math.min(45, est);
                    return `$${capped.toFixed(2)}`;
                  })()}</strong>
                </div>
              </div>
            )}

            {formData.serviceType === 'shop-pickup' && (
              <div className="form-group">
                <label>Choose a Nearby Shop (optional)</label>
                {shopsLoading && <div>Loading suggestions…</div>}
                {!shopsLoading && shopSuggestions && shopSuggestions.length > 0 && (
                  <ul style={{ listStyle:'none', padding:0, margin:0, display:'grid', gap:'.5rem' }}>
                    {shopSuggestions.map((s, idx) => (
                      <li key={idx} style={{ border:'1px solid #eee', borderRadius:8, padding:'.5rem .75rem' }}>
                        <label style={{ display:'flex', gap:'.5rem', alignItems:'center' }}>
                          <input type="radio" name="shop" onChange={() => {
                            setSelectedShop(s);
                            if (coords && s.latitude != null && s.longitude != null) {
                              const oneWay = haversineMiles(coords.latitude, coords.longitude, s.latitude, s.longitude);
                              const roundTrip = Math.round(oneWay * 2 * 10) / 10;
                              setEstimatedMiles(roundTrip);
                            }
                          }} checked={selectedShop?.name===s.name && selectedShop?.phone===s.phone} />
                          <div>
                            <div style={{ fontWeight:600 }}>{s.name}</div>
                            <div style={{ fontSize:'.9rem', opacity:.8 }}>
                              {s.address} • {s.phone}
                              {coords && s.latitude != null && s.longitude != null && (
                                <>
                                  {' '}• {haversineMiles(coords.latitude, coords.longitude, s.latitude, s.longitude).toFixed(1)} mi away
                                </>
                              )}
                            </div>
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}

                <div style={{ marginTop:'.75rem' }}>
                  <label htmlFor="miles"><strong>Estimated round-trip distance (miles)</strong></label>
                  <input id="miles" type="number" min={0} step={0.1} value={estimatedMiles} onChange={e => setEstimatedMiles(parseFloat(e.target.value))} style={{ width:'140px', marginLeft:'.5rem' }} />
                  <div style={{ fontSize:'.85rem', marginTop:'.35rem' }}>
                    Estimate: $20 base + $30 labor + $1.50/mi × {isNaN(estimatedMiles)?0:estimatedMiles.toFixed(1)} = <strong>${(() => {
                      const miles = isNaN(estimatedMiles)?0:estimatedMiles;
                      const est = 20 + 30 + 1.5 * miles;
                      return est.toFixed(2);
                    })()}</strong>
                  </div>
                  {coords && selectedShop?.latitude != null && selectedShop?.longitude != null && (
                    <div style={{ fontSize:'.8rem', color:'#666', marginTop:'.25rem' }}>
                      Auto-calculated from your GPS to the shop (round-trip). You can adjust if needed.
                    </div>
                  )}
                </div>
              </div>
            )}

            {submitError && <div className="error-message" role="alert" style={{ marginTop:'-.5rem' }}>{submitError}</div>}

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
