import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(o => !o);
  const close = () => setOpen(false);

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
        <nav id="primary-nav" className={`nav ${open ? 'open' : ''}`}> 
          {user ? (
            <>
              <span className="welcome">Hi {user.name.split(' ')[0]}</span>
              <Link to={user.userType === 'customer' ? '/customer-dashboard' : '/technician-dashboard'} className="nav-link" onClick={close}>
                Dashboard
              </Link>
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
    </header>
  );
};

export default Header;
