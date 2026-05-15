import React, { useState } from 'react';
import { useCricket } from '../context/CricketContext';
import { Trophy, Phone, Lock, LogIn, User } from 'lucide-react';

const Login = () => {
  const { login, signup } = useCricket();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mobile.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!password) {
      alert("Please enter a password.");
      return;
    }

    if (isLogin) {
      login(mobile, password);
    } else {
      if (!name.trim()) {
        alert("Please enter your name.");
        return;
      }
      signup(name.trim(), mobile, password);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '40px 32px', textAlign: 'center' }}>
        <div style={{ 
          width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(255, 215, 0, 0.1)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <Trophy size={36} color="var(--accent-primary)" />
        </div>
        
        <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.9rem' }}>
          {isLogin ? 'Login to manage your tournaments' : 'Sign up as a tournament organizer'}
        </p>
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group" style={{ textAlign: 'left', marginBottom: '16px' }}>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={14} /> Full Name
              </label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Sachin Balar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                autoFocus={!isLogin}
              />
            </div>
          )}

          <div className="input-group" style={{ textAlign: 'left', marginBottom: '16px' }}>
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
              autoFocus={isLogin}
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
            {isLogin ? <LogIn size={20} /> : <User size={20} />} 
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        
        <div style={{ marginTop: '24px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', marginLeft: '6px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
