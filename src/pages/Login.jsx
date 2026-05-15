import React, { useState } from 'react';
import { useCricket } from '../context/CricketContext';
import { Trophy, User, LogIn } from 'lucide-react';

const Login = () => {
  const { login } = useCricket();
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      login(name.trim());
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
        
        <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Cricket Organizer</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Enter your name to start managing tournaments</p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ textAlign: 'left' }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={14} /> Organizer Name
            </label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Sachin Balar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <LogIn size={20} /> Get Started
          </button>
        </form>
        
        <p style={{ marginTop: '32px', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.5 }}>
          Your session will be saved locally for quick access.
        </p>
      </div>
    </div>
  );
};

export default Login;
