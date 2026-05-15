import React, { useState } from 'react';
import { useCricket } from '../context/CricketContext';
import { Trophy, Phone, Lock, LogIn } from 'lucide-react';

const Login = () => {
  const { login } = useCricket();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mobile.length >= 10 && password) {
      login(mobile, password);
    } else {
      alert("Please enter a valid mobile number and password.");
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '40px 32px', textAlign: 'center' }}>
        <div style={{ 
          width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255, 215, 0, 0.1)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <Trophy size={40} color="var(--accent-primary)" />
        </div>
        
        <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Organizer Login</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Enter credentials to manage tournaments</p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ textAlign: 'left', marginBottom: '20px' }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={14} /> Mobile Number
            </label>
            <input 
              type="tel" 
              className="input-field" 
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              required
              autoFocus
            />
          </div>

          <div className="input-group" style={{ textAlign: 'left', marginBottom: '24px' }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={14} /> Password
            </label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <LogIn size={20} /> Login / Sign Up
          </button>
        </form>
        
        <p style={{ marginTop: '32px', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.5 }}>
          New users will be registered automatically on first login.
        </p>
      </div>
    </div>
  );
};

export default Login;
