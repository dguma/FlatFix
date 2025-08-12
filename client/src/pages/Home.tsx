import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../config';
import './Home.css';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [onlineTechs, setOnlineTechs] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const res = await fetch(`${API_BASE || ''}/api/profile/technicians/online-count`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setOnlineTechs(data.onlineTechnicians);
        }
      } catch {}
    };
    fetchCount();
    const id = setInterval(fetchCount, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className="home">
      <section className="hero" style={{ position:'relative', overflow:'hidden' }}>
  <div style={{position:'absolute', inset:0, zIndex:0, backgroundImage:"url(https://cdn.pixabay.com/photo/2015/05/31/12/08/reparing-791413_1280.jpg)", backgroundSize:'cover', backgroundPosition:'center', backgroundRepeat:'no-repeat', filter:'brightness(0.55)'}} />
        <div className="container" style={{ position:'relative', zIndex:1 }}>
          <h1 className="hero-title">
            Tire Problems? We'll Fix It!
          </h1>
          <p className="hero-subtitle">
            On-demand tire services at your location. Available 24/7 for emergencies.
          </p>
          {onlineTechs !== null && <p style={{marginTop:'-.5rem', fontWeight:600}}>Technicians Online: <span style={{color:'#2ecc71'}}>{onlineTechs}</span></p>}
          
          {!user && (
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-large">
                Get Started
              </Link>
              <Link to="/login" className="btn btn-outline btn-large">
                Sign In
              </Link>
            </div>
          )}

          {user && user.userType === 'customer' && (
            <div className="hero-actions">
              <Link to="/request-service" className="btn btn-primary btn-large">
                Request Service
              </Link>
              <Link to="/customer-dashboard" className="btn btn-outline btn-large">
                My Requests
              </Link>
            </div>
          )}

          {user && user.userType === 'technician' && (
            <div className="hero-actions">
              <Link to="/technician-dashboard" className="btn btn-primary btn-large">
                View Jobs
              </Link>
            </div>
          )}
        </div>
      </section>

  <section className="services">
        <div className="container">
          <h2>Our Services</h2>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">💨</div>
              <h3>Air Inflation</h3>
              <p>Quick tire inflation service when you're running low on air.</p>
              <div className="price">$20 base fee</div>
            </div>
            
            <div className="service-card">
              <div className="service-icon">🔧</div>
              <h3>Spare Tire Replacement</h3>
              <p>Replace your flat tire with your spare and inflate it properly.</p>
              <div className="price">$20 base + $15 service</div>
            </div>
            
            <div className="service-card">
              <div className="service-icon">🏪</div>
              <h3>Shop Coordination</h3>
              <p>Customer pays the tire shop directly. Tech handles wheel removal, leaves car safely on a jack stand, returns with mounted tire, and reinstalls.</p>
              <div className="price">$20 base + labor + distance</div>
            </div>
            <div className="service-card">
              <div className="service-icon">🔑</div>
              <h3>Lockout Assistance</h3>
              <p>Locked out? Get back in your vehicle fast and safely.</p>
              <div className="price">$20 base + service</div>
            </div>
            <div className="service-card">
              <div className="service-icon">⚡</div>
              <h3>Jumpstart</h3>
              <p>Dead battery? A boost to get you moving again.</p>
              <div className="price">$20 base; up to 3 jumps capped at $45</div>
            </div>
            <div className="service-card">
              <div className="service-icon">⛽</div>
              <h3>Fuel Delivery</h3>
              <p>Ran out of gas? Up to 2 gallons delivered to get you moving.</p>
              <div className="price">$20 base + $10/gal (max 2)</div>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="container">
          <h2>How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Request Help</h3>
              <p>Post your tire emergency with your location</p>
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <h3>Get Matched</h3>
              <p>Available technicians compete to help you</p>
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <h3>Get Fixed</h3>
              <p>Professional service at your location</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
