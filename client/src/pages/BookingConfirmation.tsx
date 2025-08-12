import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';
import { useAuth } from '../contexts/AuthContext';

const BookingConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as any;
  const { token } = useAuth();
  const [secondsLeft, setSecondsLeft] = useState(15 * 60); // 15 min
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!state) return;
  timerRef.current = setInterval(() => setSecondsLeft(s => s - 1), 1000);
  return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      alert('No technician found');
      navigate('/');
    }
  }, [secondsLeft, navigate]);

  const confirmBooking = async () => {
    try {
      const res = await fetch(`${API_BASE || ''}/api/services/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          serviceType: state.serviceType,
          location: { address: 'Mock Address' },
          description: 'Auto-created from booking confirmation',
        })
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/job-verification', { state: { jobId: data.request._id } });
      } else {
        alert(data.message || 'Failed to create job');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!state) return <div className="container">Missing readiness data.</div>;
  const m = Math.floor(secondsLeft / 60); const s = secondsLeft % 60;
  return (
    <div className="container" style={{ padding: '1.5rem' }}>
      <h1>Booking Confirmation</h1>
      <p>Searching for technician...</p>
      <p>Time left: {m}:{s.toString().padStart(2,'0')}</p>
      <button className="btn btn-primary" onClick={confirmBooking}>Confirm Booking ($20 mock)</button>
    </div>
  );
};
export default BookingConfirmation;
