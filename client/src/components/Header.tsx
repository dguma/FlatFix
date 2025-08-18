import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const { user, logout, toggleAvailability } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const toggle = () => setOpen(o => !o);
  const close = () => setOpen(false);

  // Add a class to body so we can apply JS-enhanced styles (progressive enhancement)
  useEffect(() => {
    document.body.classList.add('hasjs');
    // Ensure technician mobile quick nav is not shown
    const applyMobileNavClass = () => {
      document.body.classList.remove('with-mobile-nav');
    };
    applyMobileNavClass();
    window.addEventListener('resize', applyMobileNavClass);
    return () => {
      document.body.classList.remove('hasjs');
      document.body.classList.remove('with-mobile-nav');
      window.removeEventListener('resize', applyMobileNavClass);
    };
  }, [user]);

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
            ⚡ ZipFix.ai
          </Link>
        </div>
        {!user && (
          <Link
            to="/login"
            onClick={close}
            className="nav-link-btn mobile-auth-btn"
            aria-label="Sign in or create an account"
          >Sign In / Up</Link>
        )}
        <nav id="primary-nav" className={`nav ${open ? 'open' : ''}`} role="navigation" aria-label="Primary"> 
          {user ? (
            <ul className="nav-items">
              <li className="nav-meta">
                <div className="nav-user">
                  <Link to="/profile" onClick={close} className="avatar-mini" aria-label="Profile">
                    {user.avatarUrl ? <img src={user.avatarUrl} alt="avatar" /> : <span>{user.name.charAt(0)}</span>}
                  </Link>
                  <Link to="/profile" onClick={close} className={`welcome-name ${location.pathname === '/profile' ? 'active' : ''}`} aria-current={location.pathname === '/profile' ? 'page' : undefined}>{user.name.split(' ')[0]}</Link>
                  {user.userType === 'technician' && (
                    <button
                      type="button"
                      className={`status-chip ${user.isAvailable ? 'online' : 'offline'}`}
                      onClick={async () => { await toggleAvailability(); }}
                      aria-pressed={!!user.isAvailable}
                    >
                      <span className="dot" /> {user.isAvailable ? 'Online' : 'Offline'}
                    </button>
                  )}
                </div>
              </li>
              <li>
                <Link
                  to={user.userType === 'customer' ? '/customer-dashboard' : '/technician-dashboard'}
                  onClick={close}
                  className={`nav-link-btn ${location.pathname.includes('dashboard') ? 'active' : ''}`}
                >Dashboard</Link>
              </li>
              {/* Removed redundant standalone Profile link; avatar/name act as profile entry */}
              <li>
                <Link to="/change-password" onClick={close} className={`nav-link-btn ${location.pathname === '/change-password' ? 'active' : ''}`}>Password</Link>
              </li>
              <li className="nav-divider" aria-hidden="true" />
              <li>
                <button onClick={() => { logout(); close(); }} className="nav-link-btn danger">Logout</button>
              </li>
            </ul>
          ) : (
            <ul className="nav-items">
              <li>
                <Link to="/login" className={`nav-link-btn ${location.pathname === '/login' ? 'active' : ''}`} onClick={close}>Login</Link>
              </li>
              <li>
                <Link to="/register" className="nav-link-btn primary" onClick={close}>Sign Up</Link>
              </li>
            </ul>
          )}
        </nav>
        {open && <div className="backdrop" onClick={close} />}
      </div>

    </header>
  );
};

export default Header;
