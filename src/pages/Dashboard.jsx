import React, { useState } from 'react';
import { useCricket } from '../context/CricketContext';
import { Trophy, Plus, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { tournaments, addTournament, activeMatch, isLoading, isSyncing, appPin, setAppPin } = useCricket();
  const [newTName, setNewTName] = useState('');
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
    const p = prompt("Enter new 4-digit scoring PIN:", appPin);
    if (p && p.length === 4) {
      setAppPin(p);
      alert("PIN updated successfully!");
    } else if (p) {
      alert("PIN must be exactly 4 digits.");
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}><Trophy /> Tournaments</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            {isSyncing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                <div className="live-dot" style={{ width: '6px', height: '6px' }}></div>
                Cloud Syncing...
              </div>
            ) : (
              <button 
                onClick={handleSetPin}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
              >
                Set Scoring PIN (Current: {appPin})
              </button>
            )}
          </div>
        </div>
      </div>
      
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
                    {t.teams.length} Teams • {t.matches.length} Matches Played
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
