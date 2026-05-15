import React, { useState } from 'react';
import { useCricket } from '../context/CricketContext';
import { Trophy, Plus, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { 
    tournaments, addTournament, activeMatch, isLoading, isSyncing, 
    appPin, setAppPin, isAuthorized, authorize, deauthorize,
    currentUser, logout 
  } = useCricket();
  const [newTName, setNewTName] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loader" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading Cloud Data...</p>
        </div>
      </div>
    );
  }

  const handleCreate = (e) => {
    e.preventDefault();
    if (newTName.trim()) {
      addTournament(newTName.trim());
      setNewTName('');
    }
  };

  const handleSetPin = () => {
    const p = prompt("Enter NEW 4-digit scoring PIN:");
    if (p && p.length === 4) {
      setAppPin(p);
      alert("PIN updated successfully!");
    } else if (p) {
      alert("PIN must be exactly 4 digits.");
    }
  };

  const handleAuth = (e) => {
    e.preventDefault();
    if (authorize(pinInput)) {
      setShowAuth(false);
      setPinInput('');
    } else {
      alert("Invalid PIN!");
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', background: 'rgba(255, 215, 0, 0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>ORGANIZER</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Welcome, {currentUser?.name}</span>
            <button 
              onClick={logout}
              style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', fontSize: '0.75rem', cursor: 'pointer', padding: 0, marginLeft: '8px', textDecoration: 'underline', opacity: 0.7 }}
            >
              (Switch)
            </button>
          </div>
          <h1 className="page-title" style={{ margin: 0 }}><Trophy /> Tournaments</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            {isSyncing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                <div className="live-dot" style={{ width: '6px', height: '6px' }}></div>
                Cloud Syncing...
              </div>
            ) : isAuthorized ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={handleSetPin}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  Change PIN
                </button>
                <button 
                  onClick={deauthorize}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', fontSize: '0.75rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  Lock Scoring
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuth(!showAuth)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
              >
                Unlock Scoring
              </button>
            )}
          </div>
        </div>
      </div>
      
      {showAuth && !isAuthorized && (
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', border: '1px solid var(--accent-primary)' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '1rem' }}>Scorer Authentication</h3>
          <form onSubmit={handleAuth} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="password" 
              placeholder="Enter PIN" 
              maxLength={4}
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              style={{ flex: 1, padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', textAlign: 'center', letterSpacing: '4px' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 20px' }}>Login</button>
          </form>
        </div>
      )}
      
      {activeMatch && (
        <div 
          className="glass-panel" 
          style={{ padding: '16px', marginBottom: '24px', cursor: 'pointer', borderLeft: '4px solid var(--accent-primary)' }}
          onClick={() => navigate('/match')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>🔴 Live Match in Progress</p>
              <h3 style={{ fontSize: '1.1rem' }}>{activeMatch.team1.name} vs {activeMatch.team2.name}</h3>
            </div>
            <ChevronRight />
          </div>
        </div>
      )}

      {isAuthorized && (
        <form onSubmit={handleCreate} className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Create New Tournament</h3>
          <div className="input-group">
            <input 
              type="text" 
              className="input-field" 
              placeholder="Tournament Name (e.g. Summer Cup)" 
              value={newTName}
              onChange={(e) => setNewTName(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            <Plus size={20} /> Create Tournament
          </button>
        </form>
      )}

      <div className="tournaments-list">
        <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Your Tournaments</h3>
        {tournaments.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
            No tournaments yet. Create one to get started!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tournaments.map(t => (
              <div 
                key={t.id} 
                className="glass-panel" 
                style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => navigate(`/tournaments/${t.id}`)}
              >
                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{t.name}</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {t.teams.length} Teams • {t.matches.length} Matches • By {t.organizer || 'Anonymous'}
                  </p>
                </div>
                <ChevronRight color="var(--text-secondary)" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
