import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            Tire Problems? We'll Fix It!
          </h1>
          <p className="hero-subtitle">
            On-demand tire services at your location. Available 24/7 for emergencies.
          </p>
          
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
              <div className="price">$20 + $15 service fee</div>
            </div>
            
            <div className="service-card">
              <div className="service-icon">🏪</div>
              <h3>Shop Coordination</h3>
              <p>We'll help coordinate with local tire shops for new tire installation.</p>
              <div className="price">$20 + $25 coordination fee</div>
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
