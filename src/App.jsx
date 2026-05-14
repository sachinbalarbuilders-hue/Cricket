import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Trophy, Activity, Home } from 'lucide-react';
import { CricketProvider } from './context/CricketContext';

import Dashboard from './pages/Dashboard';
import TournamentManager from './pages/TournamentManager';
import LiveScorer from './pages/LiveScorer';

import { useCricket } from './context/CricketContext';

const BottomNav = () => {
  const location = useLocation();
  const { activeMatch } = useCricket();
  
  return (
    <div className="bottom-nav">
      <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <Home className="nav-icon" />
        <span>Home</span>
      </Link>
      <Link to="/tournaments" className={`nav-item ${location.pathname.startsWith('/tournaments') ? 'active' : ''}`}>
        <Trophy className="nav-icon" />
        <span>Tournaments</span>
      </Link>
      <Link to="/match" className={`nav-item ${location.pathname === '/match' ? 'active' : ''}`} style={{ position: 'relative' }}>
        {activeMatch && !activeMatch.isComplete && (
          <span className="live-dot" style={{ position: 'absolute', top: 2, right: 14 }} />
        )}
        <Activity className="nav-icon" />
        <span>Live Match</span>
      </Link>
    </div>
  );
};

function App() {
  return (
    <CricketProvider>
      <Router>
        <div className="app-layout">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tournaments/:id" element={<TournamentManager />} />
            <Route path="/tournaments" element={<Dashboard />} />
            <Route path="/match" element={<LiveScorer />} />
          </Routes>
          <BottomNav />
        </div>
      </Router>
    </CricketProvider>
  );
}

export default App;
