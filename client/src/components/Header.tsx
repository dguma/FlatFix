import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const { user, logout, toggleAvailability } = useAuth();
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(o => !o);
  const close = () => setOpen(false);

  // Add a class to body so we can apply JS-enhanced styles (progressive enhancement)
  useEffect(() => {
    document.body.classList.add('has-js');
    return () => { document.body.classList.remove('has-js'); };
  }, []);

  return (
    <header className="header">
      <div className="container">
        <div className="left">
          <button aria-label="Menu" aria-expanded={open} aria-controls="primary-nav" className={`hamburger ${open ? 'is-open' : ''}`} onClick={toggle}>
            <span />
            <span />
            <span />
          </button>
          <Link to="/" className="logo" onClick={close}>
            🔧 FlatFix
          </Link>
        </div>
        <nav id="primary-nav" className={`nav ${open ? 'open' : ''}`} role="navigation" aria-label="Primary"> 
          {user ? (
            <>
              <span className="welcome">Hi {user.name.split(' ')[0]}</span>
              <Link to={user.userType === 'customer' ? '/customer-dashboard' : '/technician-dashboard'} className="nav-link" onClick={close}>
                Dashboard
              </Link>
              <Link to="/profile" className="nav-link" onClick={close}>
                Profile
              </Link>
              {user.userType === 'technician' && (
                <button
                  className="nav-link"
                  style={{ textAlign:'left' }}
                  onClick={async () => { await toggleAvailability(); }}
                >
                  {user.isAvailable ? 'Go Offline' : 'Go Online'}
                </button>
              )}
              <Link to="/change-password" className="nav-link" onClick={close}>
                Change Password
              </Link>
              <button onClick={() => { logout(); close(); }} className="btn btn-outline full-width">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={close}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary full-width" onClick={close}>
                Sign Up
              </Link>
            </>
          )}
        </nav>
        {open && <div className="backdrop" onClick={close} />}
      </div>
      {user && (
        <div className="mobile-action-bar" role="toolbar" aria-label="Quick actions">
          <Link to={user.userType === 'customer' ? '/customer-dashboard' : '/technician-dashboard'} className="mab-link">🏠<span>Dashboard</span></Link>
          {user.userType === 'technician' && (
            <button
              className="mab-link"
              onClick={() => toggleAvailability()}
              aria-pressed={!!user.isAvailable}
            >
              {user.isAvailable ? '🟢' : '⚪'}
              <span>{user.isAvailable ? 'Online' : 'Offline'}</span>
            </button>
          )}
          <Link to="/profile" className="mab-link">👤<span>Profile</span></Link>
          <button className="mab-link" onClick={() => logout()}>🚪<span>Logout</span></button>
        </div>
      )}
    </header>
  );
};

export default Header;
