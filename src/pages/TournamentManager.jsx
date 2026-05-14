import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCricket } from '../context/CricketContext';
import { Users, Play, Plus, ArrowLeft, UserPlus, XCircle, Trophy, Medal, Award } from 'lucide-react';

const getMatchAwards = (match) => {
  const allPlayers = [...match.team1.players, ...match.team2.players];
  let bestBowler = null;
  const bowlers = allPlayers.filter(p => p.matchWickets > 0);
  if (bowlers.length > 0) {
    bestBowler = bowlers.reduce((prev, curr) => {
      if (curr.matchWickets > prev.matchWickets) return curr;
      if (curr.matchWickets === prev.matchWickets && curr.matchRunsConceded < prev.matchRunsConceded) return curr;
      return prev;
    });
  }
  let manOfTheMatch = null;
  if (allPlayers.length > 0) {
    manOfTheMatch = allPlayers.reduce((prev, curr) => {
      const currScore = curr.matchRuns + (curr.matchWickets * 20);
      const prevScore = prev.matchRuns + (prev.matchWickets * 20);
      return (currScore > prevScore) ? curr : prev;
    });
  }
  return { manOfTheMatch, bestBowler };
};
+
+const AdminLock = ({ onUnlock, pinInput, setPinInput }) => {
+  const handleSubmit = (e) => {
+    e.preventDefault();
+    onUnlock(pinInput);
+  };
+
+  return (
+    <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', marginBottom: '40px', border: '1px dashed rgba(255,255,255,0.1)' }}>
+      <div style={{ background: 'rgba(255,255,255,0.05)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
+        <Play size={24} style={{ color: 'var(--accent-primary)', opacity: 0.8 }} />
+      </div>
+      <h3 style={{ marginBottom: '8px' }}>Management Locked</h3>
+      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px' }}>Enter Admin PIN to manage teams or schedule matches.</p>
+      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', maxWidth: '240px', margin: '0 auto' }}>
+        <input 
+          type="password" 
+          placeholder="PIN" 
+          maxLength={4}
+          value={pinInput}
+          onChange={e => setPinInput(e.target.value)}
+          style={{ flex: 1, padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', textAlign: 'center', letterSpacing: '4px' }}
+        />
+        <button type="submit" className="btn btn-primary">Unlock</button>
+      </form>
+    </div>
+  );
+};

const TournamentManager = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tournaments, addTeamToTournament, addPlayer, removePlayer, startMatch, activeMatch, deleteMatch, resetTournamentStats, isLoading, isSyncing, isAuthorized, authorize } = useCricket();
  
  const tournament = tournaments.find(t => t.id === id);
  
  const [newTeamName, setNewTeamName] = useState('');
  const [playerInputs, setPlayerInputs] = useState({});
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');
  const [team1PlayingIds, setTeam1PlayingIds] = useState([]);
  const [team2PlayingIds, setTeam2PlayingIds] = useState([]);
  const [isCompulsoryChase, setIsCompulsoryChase] = useState(false);
  const [overs, setOvers] = useState('5');
  const [activeTab, setActiveTab] = useState('points'); 
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [pinInput, setPinInput] = useState('');

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

  if (!tournament) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
          <p>Tournament not found.</p>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/')}>Back Home</button>
        </div>
      </div>
    );
  }

  const sortedTeams = [...tournament.teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.netRunRate - a.netRunRate;
  });

  const handleAddTeam = (e) => {
    e.preventDefault();
    if (newTeamName.trim()) {
      addTeamToTournament(tournament.id, newTeamName.trim());
      setNewTeamName('');
    }
  };

  const handleAddPlayer = (teamId) => {
    const pName = playerInputs[teamId];
    if (pName && pName.trim()) {
      addPlayer(tournament.id, teamId, pName.trim());
      setPlayerInputs({ ...playerInputs, [teamId]: '' });
    }
  };

  const handleTeam1Change = (e) => {
    const tId = e.target.value;
    setTeam1Id(tId);
    if (tId) {
      const t = tournament.teams.find(tm => tm.id === tId);
      setTeam1PlayingIds(t.players.map(p => p.id));
    } else {
      setTeam1PlayingIds([]);
    }
  };

  const handleTeam2Change = (e) => {
    const tId = e.target.value;
    setTeam2Id(tId);
    if (tId) {
      const t = tournament.teams.find(tm => tm.id === tId);
      setTeam2PlayingIds(t.players.map(p => p.id));
    } else {
      setTeam2PlayingIds([]);
    }
  };

  const togglePlayer = (teamNumber, playerId) => {
    if (teamNumber === 1) {
      setTeam1PlayingIds(prev => prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]);
    } else {
      setTeam2PlayingIds(prev => prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]);
    }
  };

  const handleStartMatch = (e) => {
    e.preventDefault();
    if (activeMatch) {
      alert("A match is already in progress!");
      return;
    }
    if (team1Id && team2Id && team1Id !== team2Id && overs) {
      if (team1PlayingIds.length < 2 || team2PlayingIds.length < 2) {
        alert("Both teams must select at least 2 playing squad members.");
        return;
      }
      
      startMatch(tournament.id, team1Id, team2Id, overs, team1PlayingIds, team2PlayingIds, isCompulsoryChase);
      navigate('/match');
    } else {
      alert("Please select two different teams and set overs.");
    }
  };

  const renderPlayingSquadSelection = (teamId, playingIds, teamNumber) => {
    if (!teamId) return null;
    const team = tournament.teams.find(t => t.id === teamId);
    if (!team || team.players.length === 0) return <p style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>No players in roster.</p>;

    return (
      <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--border-radius)' }}>
        <p style={{ fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
          Playing Squad ({playingIds.length} selected)
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {team.players.map(p => (
            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={playingIds.includes(p.id)}
                onChange={() => togglePlayer(teamNumber, p.id)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
              />
              {p.name}
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="page-container" style={{ paddingBottom: '100px' }}>
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="btn-outline" style={{ padding: '8px', border: 'none' }} onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{tournament.name}</div>
          {isSyncing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--accent-primary)', marginTop: '2px', fontWeight: 400 }}>
              <div className="live-dot" style={{ width: '6px', height: '6px' }}></div>
              Cloud Syncing...
            </div>
          )}
        </div>
      </div>

      {selectedMatch && (
        <div className="glass-panel" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000, overflowY: 'auto', background: 'var(--bg-primary)', padding: '20px', paddingBottom: '80px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 className="page-title" style={{ margin: 0 }}>Match Scorecard</h2>
            <button className="btn-outline" style={{ padding: '8px', border: 'none' }} onClick={() => setSelectedMatch(null)}>
              <XCircle size={24} />
            </button>
          </div>

          {/* Match Awards */}
          {(() => {
            const { manOfTheMatch, bestBowler } = getMatchAwards(selectedMatch);
            return (manOfTheMatch || bestBowler) && (
              <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.02))', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
                <h3 style={{ marginBottom: '12px', color: '#ffd700', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                  <Trophy size={16} /> Match Awards
                </h3>
                {manOfTheMatch && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Player of the Match</span>
                    <span style={{ fontWeight: 600 }}>{manOfTheMatch.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({manOfTheMatch.matchRuns}r, {manOfTheMatch.matchWickets}w)</span></span>
                  </div>
                )}
                {bestBowler && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Best Bowler</span>
                    <span style={{ fontWeight: 600 }}>{bestBowler.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({bestBowler.matchWickets}-{bestBowler.matchRunsConceded})</span></span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Team 1 Scorecard */}
          <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
              <h3 style={{ color: 'var(--accent-primary)', fontSize: '1.25rem' }}>{selectedMatch.team1.name}</h3>
              <span style={{ fontWeight: 700 }}>{selectedMatch.team1.runs}/{selectedMatch.team1.wickets} <span style={{fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 400}}>({Math.floor(selectedMatch.team1.balls / 6)}.{selectedMatch.team1.balls % 6} ov)</span></span>
            </div>

            <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Batting</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {selectedMatch.team1.players.filter(p => p.matchBalls > 0 || p.matchRuns > 0 || p.isOut || (selectedMatch.currentInnings === 1 && (p.id === selectedMatch.strikerId || p.id === selectedMatch.nonStrikerId))).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span>{p.name} {p.isOut ? '' : (selectedMatch.currentInnings === 1 && (p.id === selectedMatch.strikerId || p.id === selectedMatch.nonStrikerId) ? '*' : '')}</span>
                  <span style={{ fontWeight: 600 }}>{p.matchRuns} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({p.matchBalls})</span></span>
                </div>
              ))}
            </div>
            
            <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Bowling (by {selectedMatch.team2.name})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedMatch.team2.players.filter(p => p.matchBallsBowled > 0).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span>{p.name}</span>
                  <span style={{ fontWeight: 600 }}>{p.matchWickets}-{p.matchRunsConceded} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({Math.floor(p.matchBallsBowled/6)}.{p.matchBallsBowled%6})</span></span>
                </div>
              ))}
            </div>
          </div>

          {/* Team 2 Scorecard */}
          {selectedMatch.currentInnings === 2 && (
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <h3 style={{ color: 'var(--accent-primary)', fontSize: '1.25rem' }}>{selectedMatch.team2.name}</h3>
                <span style={{ fontWeight: 700 }}>{selectedMatch.team2.runs}/{selectedMatch.team2.wickets} <span style={{fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 400}}>({Math.floor(selectedMatch.team2.balls / 6)}.{selectedMatch.team2.balls % 6} ov)</span></span>
              </div>

              <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Batting</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {selectedMatch.team2.players.filter(p => p.matchBalls > 0 || p.matchRuns > 0 || p.isOut || p.id === selectedMatch.strikerId || p.id === selectedMatch.nonStrikerId).map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span>{p.name} {p.isOut ? '' : (p.id === selectedMatch.strikerId || p.id === selectedMatch.nonStrikerId ? '*' : '')}</span>
                    <span style={{ fontWeight: 600 }}>{p.matchRuns} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({p.matchBalls})</span></span>
                  </div>
                ))}
              </div>
              
              <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Bowling (by {selectedMatch.team1.name})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedMatch.team1.players.filter(p => p.matchBallsBowled > 0).map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span>{p.name}</span>
                    <span style={{ fontWeight: 600 }}>{p.matchWickets}-{p.matchRunsConceded} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({Math.floor(p.matchBallsBowled/6)}.{p.matchBallsBowled%6})</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="tab-bar">
        {[
          { key: 'points',      label: 'Table'    },
          { key: 'teams',       label: 'Teams'    },
          { key: 'history',     label: 'History'  },
          { key: 'leaderboard', label: 'Leaders'  },
          { key: 'match',       label: '+ Match'  },
        ].map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'points' && (
        <>
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <th style={{ padding: '12px 16px' }}>Team</th>
                    <th style={{ padding: '12px 8px' }}>P</th>
                    <th style={{ padding: '12px 8px' }}>W</th>
                    <th style={{ padding: '12px 8px' }}>L</th>
                    <th style={{ padding: '12px 8px' }}>Pts</th>
                    <th style={{ padding: '12px 16px' }}>NRR</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTeams.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No teams added yet.
                      </td>
                    </tr>
                  )}
                  {sortedTeams.map((team, index) => (
                    <tr key={team.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                        <span style={{ color: 'var(--text-secondary)', marginRight: '8px', fontSize: '0.875rem' }}>{index + 1}</span>
                        {team.name}
                      </td>
                      <td style={{ padding: '12px 8px' }}>{team.played}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--accent-primary)' }}>{team.won}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--accent-danger)' }}>{team.lost}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 700 }}>{team.points}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>{team.netRunRate > 0 ? `+${team.netRunRate}` : team.netRunRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {isAuthorized && (
            <button
              className="btn btn-outline"
              style={{ width: '100%', marginTop: '16px', color: 'var(--accent-danger)', borderColor: 'var(--accent-danger)', background: 'rgba(239,68,68,0.05)', fontSize: '0.875rem' }}
              onClick={() => {
                if (window.confirm('This will clear ALL match history, points, wins/losses, NRR, and player stats. Team rosters will be kept. This cannot be undone.')) {
                  resetTournamentStats(tournament.id);
                }
              }}
            >
              Reset All Tournament Stats
            </button>
          )}
        </>
      )}


      {activeTab === 'teams' && (
        !isAuthorized ? (
          <AdminLock onUnlock={authorize} pinInput={pinInput} setPinInput={setPinInput} />
        ) : (
          <div>
            <form onSubmit={handleAddTeam} className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>Add New Team</h3>
              <div className="input-group">
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Team Name (e.g. Mumbai Indians)" 
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
                <Plus size={20} /> Add Team
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tournament.teams.map(team => (
                <div key={team.id} className="glass-panel" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <Users size={20} style={{ marginRight: '8px', color: 'var(--accent-secondary)' }} />
                    <h4 style={{ fontSize: '1.1rem' }}>{team.name}</h4>
                    <span style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {team.players.length} Players
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input 
                      type="text"
                      className="input-field"
                      style={{ padding: '8px 12px', fontSize: '0.875rem' }}
                      placeholder="Player Name"
                      value={playerInputs[team.id] || ''}
                      onChange={(e) => setPlayerInputs({ ...playerInputs, [team.id]: e.target.value })}
                    />
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '8px 12px' }}
                      onClick={() => handleAddPlayer(team.id)}
                    >
                      <UserPlus size={16} />
                    </button>
                  </div>

                  {team.players.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {team.players.map(p => (
                        <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', padding: '5px 10px 5px 12px', borderRadius: 'var(--border-radius-pill)', fontSize: '0.8125rem' }}>
                          {p.name}
                          <button
                            onClick={() => removePlayer(tournament.id, team.id, p.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 0, lineHeight: 1 }}
                            title="Remove player"
                          >
                            <XCircle size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!tournament.matches || tournament.matches.length === 0 ? (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No matches have been played yet.
            </div>
          ) : (
            [...tournament.matches].reverse().map((match, idx) => {
              let resultText = "Match Tied";
              if (match.team1.runs > match.team2.runs) {
                resultText = `${match.team1.name} Won!`;
              } else if (match.team2.runs >= match.target) {
                resultText = `${match.team2.name} Won!`;
              }

              return (
                <div key={match.id || idx} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-primary)' }}>{match.team1.name}</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{match.team1.runs}/{match.team1.wickets} <span style={{fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-secondary)'}}>({Math.floor(match.team1.balls / 6)}.{match.team1.balls % 6})</span></span>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--text-secondary)', padding: '0 8px' }}>VS</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right', flex: 1 }}>
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-primary)' }}>{match.team2.name}</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{match.team2.runs}/{match.team2.wickets} <span style={{fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-secondary)'}}>({Math.floor(match.team2.balls / 6)}.{match.team2.balls % 6})</span></span>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                    {resultText}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: isAuthorized ? '1fr auto' : '1fr', gap: '8px' }}>
                    <button 
                      className="btn btn-outline" 
                      style={{ fontSize: '0.875rem', padding: '8px', background: 'rgba(255,255,255,0.03)' }}
                      onClick={() => setSelectedMatch(match)}
                    >
                      View Scorecard
                    </button>
                    {isAuthorized && (
                      <button 
                        className="btn btn-outline" 
                        style={{ fontSize: '0.875rem', padding: '8px', color: 'var(--accent-danger)', borderColor: 'var(--accent-danger)', background: 'rgba(239,68,68,0.05)' }}
                        onClick={() => {
                          if (window.confirm('Delete this match record? This cannot be undone.')) {
                            deleteMatch(tournament.id, match.id);
                          }
                        }}
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {(() => {
            const allPlayers = tournament.teams.flatMap(t => t.players.map(p => ({ ...p, teamName: t.name })));
            
            const mosRanking = [...allPlayers]
              .filter(p => p.totalRuns > 0 || p.totalWickets > 0)
              .sort((a, b) => {
                const scoreA = a.totalRuns + (a.totalWickets * 20);
                const scoreB = b.totalRuns + (b.totalWickets * 20);
                return scoreB - scoreA;
              }).slice(0, 5);

            const batRanking = [...allPlayers]
              .filter(p => p.totalRuns > 0)
              .sort((a, b) => b.totalRuns - a.totalRuns)
              .slice(0, 5);
            
            const bowlRanking = [...allPlayers]
              .filter(p => p.totalWickets > 0)
              .sort((a, b) => {
                if (b.totalWickets !== a.totalWickets) return b.totalWickets - a.totalWickets;
                return a.totalRunsConceded - b.totalRunsConceded;
              }).slice(0, 5);

            const noData = mosRanking.length === 0 && batRanking.length === 0 && bowlRanking.length === 0;
            if (noData) {
              return <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No match data yet. Play some matches to see leaderboards!</div>;
            }

            return (
              <>
                <div className="glass-panel" style={{ padding: '20px', borderTop: '4px solid #ffd700' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#ffd700' }}>
                    <Award size={20} /> Player of the Series (MVP)
                  </h3>
                  {mosRanking.map((p, i) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < mosRanking.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>#{i + 1}</span>
                        <div>
                          <div style={{ fontWeight: i === 0 ? 700 : 500, color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.teamName}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{p.totalRuns + (p.totalWickets * 20)} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>pts</span></div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.totalRuns}r, {p.totalWickets}w</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="glass-panel" style={{ padding: '20px', borderTop: '4px solid #f97316' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#f97316' }}>
                    <Medal size={20} /> Top Batsmen
                  </h3>
                  {batRanking.map((p, i) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < batRanking.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>#{i + 1}</span>
                        <span style={{ fontWeight: i === 0 ? 700 : 500 }}>{p.name}</span>
                      </div>
                      <div style={{ fontWeight: 700 }}>{p.totalRuns} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>runs</span></div>
                    </div>
                  ))}
                </div>

                <div className="glass-panel" style={{ padding: '20px', borderTop: '4px solid #a855f7' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#a855f7' }}>
                    <Medal size={20} /> Top Bowlers
                  </h3>
                  {bowlRanking.map((p, i) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < bowlRanking.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>#{i + 1}</span>
                        <span style={{ fontWeight: i === 0 ? 700 : 500 }}>{p.name}</span>
                      </div>
                      <div style={{ fontWeight: 700 }}>{p.totalWickets} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>wkts</span></div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {activeTab === 'match' && (
        !isAuthorized ? (
          <AdminLock onUnlock={authorize} pinInput={pinInput} setPinInput={setPinInput} />
        ) : (
          <form onSubmit={handleStartMatch} className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px' }}>Start New Match</h3>
            
            <div className="input-group">
              <label className="input-label">Team 1 (Batting First)</label>
              <select 
                className="input-field" 
                value={team1Id} 
                onChange={handleTeam1Change}
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <option value="">Select Team</option>
                {tournament.teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.players.length} players)</option>
                ))}
              </select>
              {renderPlayingSquadSelection(team1Id, team1PlayingIds, 1)}
            </div>

            <div className="input-group" style={{ alignItems: 'center', margin: '8px 0' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>VS</span>
            </div>

            <div className="input-group">
              <label className="input-label">Team 2 (Bowling First)</label>
              <select 
                className="input-field" 
                value={team2Id} 
                onChange={handleTeam2Change}
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <option value="">Select Team</option>
                {tournament.teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.players.length} players)</option>
                ))}
              </select>
              {renderPlayingSquadSelection(team2Id, team2PlayingIds, 2)}
            </div>

            <div className="input-group" style={{ marginTop: '16px' }}>
              <label className="input-label">Total Overs</label>
              <input 
                type="number" 
                className="input-field" 
                min="1" 
                max="50" 
                value={overs} 
                onChange={(e) => setOvers(e.target.value)}
              />
            </div>

            <div className="input-group" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                id="compulsoryChase"
                checked={isCompulsoryChase} 
                onChange={(e) => setIsCompulsoryChase(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
              />
              <label htmlFor="compulsoryChase" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                Compulsory Chase Rule
              </label>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '24px' }}
              disabled={tournament.teams.length < 2}
            >
              <Play size={20} /> Start Match
            </button>
            
            {tournament.teams.length < 2 && (
              <p style={{ color: 'var(--accent-danger)', fontSize: '0.75rem', marginTop: '12px', textAlign: 'center' }}>
                Need at least 2 teams to start a match.
              </p>
            )}
          </form>
        )
      )}

    </div>
  );
};

export default TournamentManager;
