import React, { useState } from 'react';
import { useCricket } from '../context/CricketContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, User, ArrowLeftRight, Trophy, RefreshCcw } from 'lucide-react';

const LiveScorer = () => {
  const { 
    activeMatch, scoreBall, endMatchAndSave, cancelActiveMatch,
    setOpeningPlayers, setNextBatsman, setNextBowler, retireBatter, endInningsBreak, swapStrike, changeBowler, 
    isSyncing, isAuthorized, authorize, deauthorize
  } = useCricket();
  const navigate = useNavigate();
  const [pinInput, setPinInput] = useState('');

  // Local state for prompts
  const [selStriker, setSelStriker] = useState('');
  const [selNonStriker, setSelNonStriker] = useState('');
  const [selBowler, setSelBowler] = useState('');
  const [activeExtra, setActiveExtra] = useState(null);
  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [wicketModalOpen, setWicketModalOpen] = useState(false);
  const [wType, setWType] = useState('Caught');
  const [wFielder, setWFielder] = useState('');
  const [wOutPlayerId, setWOutPlayerId] = useState('');

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

  const handleAuth = (e) => {
    e.preventDefault();
    if (!authorize(pinInput)) {
      alert("Incorrect PIN!");
      setPinInput('');
    }
  };

  if (!activeMatch) {
    return (
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <h2 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>No Active Match</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go to Dashboard</button>
      </div>
    );
  }

  // Note: Removed full-page authorization lock here to allow public viewing

  const isBattingFirst = activeMatch.currentInnings === 1;
  const battingTeam = isBattingFirst ? activeMatch.team1 : activeMatch.team2;
  const bowlingTeam = isBattingFirst ? activeMatch.team2 : activeMatch.team1;

  // Prompts Handling
  if (activeMatch.promptForBatsmen || activeMatch.promptForBowler) {
    const handleSetOpeners = (e) => {
      e.preventDefault();
      if (selStriker && selNonStriker && selStriker !== selNonStriker && selBowler) {
        setOpeningPlayers(selStriker, selNonStriker, selBowler);
        setSelStriker(''); setSelNonStriker(''); setSelBowler('');
      } else {
        alert("Please select distinct Striker, Non-Striker and Bowler.");
      }
    };

    const handleSetNextBowler = (e) => {
      e.preventDefault();
      if (selBowler) {
        setNextBowler(selBowler);
        setSelBowler('');
      }
    };

    return (
      <div className="page-container">
        <h2 className="page-title">Innings {activeMatch.currentInnings} Start</h2>
        <form onSubmit={activeMatch.promptForBatsmen ? handleSetOpeners : handleSetNextBowler} className="glass-panel" style={{ padding: '20px' }}>
          
          {activeMatch.promptForBatsmen && (
            <>
              <h3 style={{ marginBottom: '16px' }}>Select Opening Batsmen ({battingTeam.name})</h3>
              <div className="input-group">
                <label className="input-label">Striker</label>
                <select className="input-field" value={selStriker} onChange={e => setSelStriker(e.target.value)} style={{ background: 'var(--bg-secondary)' }}>
                  <option value="">Select Player</option>
                  {battingTeam.players.filter(p => !p.isOut).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Non-Striker</label>
                <select className="input-field" value={selNonStriker} onChange={e => setSelNonStriker(e.target.value)} style={{ background: 'var(--bg-secondary)' }}>
                  <option value="">Select Player</option>
                  {battingTeam.players.filter(p => !p.isOut).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </>
          )}

          {activeMatch.promptForBowler && (
            <>
              <h3 style={{ marginBottom: '16px', marginTop: activeMatch.promptForBatsmen ? '24px' : '0' }}>
                Select Bowler ({bowlingTeam.name})
              </h3>
              <div className="input-group">
                <select className="input-field" value={selBowler} onChange={e => setSelBowler(e.target.value)} style={{ background: 'var(--bg-secondary)' }}>
                  <option value="">Select Player</option>
                  {/* Normally bowler can't bowl consecutive overs, but keeping simple for now */}
                  {bowlingTeam.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }}>
            Continue
          </button>
        </form>
      </div>
    );
  }

  if (activeMatch.promptForNextBatsman) {
    const handleSetNextBatsman = (e) => {
      e.preventDefault();
      if (selStriker) {
        setNextBatsman(selStriker);
        setSelStriker('');
      }
    };

    return (
      <div className="page-container">
        <h2 className="page-title" style={{ color: 'var(--accent-danger)' }}>Wicket!</h2>
        <form onSubmit={handleSetNextBatsman} className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>Select Next Batsman ({battingTeam.name})</h3>
          <div className="input-group">
            <select className="input-field" value={selStriker} onChange={e => setSelStriker(e.target.value)} style={{ background: 'var(--bg-secondary)' }}>
              <option value="">Select Player</option>
              {battingTeam.players.filter(p => !p.isOut && p.id !== activeMatch.strikerId && p.id !== activeMatch.nonStrikerId).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }}>
            Batsman to Crease
          </button>
        </form>
      </div>
    );
  }

  if (activeMatch.isInningsBreak) {
    return (
      <div className="page-container" style={{ textAlign: 'center' }}>
        <h1 style={{ color: 'var(--accent-primary)', margin: '40px 0 20px', fontSize: '2rem' }}>Innings Break</h1>
        
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '40px' }}>
          <h3 style={{ marginBottom: '12px' }}>{activeMatch.team1.name}</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>
            {activeMatch.team1.runs}/{activeMatch.team1.wickets}
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            Overs: {Math.floor(activeMatch.team1.balls / 6)}.{activeMatch.team1.balls % 6} / {activeMatch.overs}
          </p>
        </div>
        
        <h3 style={{ marginBottom: '24px' }}>Target: {activeMatch.target} runs</h3>

        <div className="glass-panel" style={{ padding: '20px', marginBottom: '40px' }}>
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '16px', textAlign: 'left', fontSize: '1rem', color: 'var(--text-secondary)' }}>
            {activeMatch.team1.name} Batting
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', textAlign: 'left' }}>
            {activeMatch.team1.players.filter(p => p.matchBalls > 0 || p.matchRuns > 0 || p.isOut || p.id === activeMatch.strikerId || p.id === activeMatch.nonStrikerId).map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span>{p.name} {p.isOut ? '' : '*'}</span>
                <span style={{ fontWeight: 600 }}>{p.matchRuns} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({p.matchBalls})</span></span>
              </div>
            ))}
          </div>

          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '16px', textAlign: 'left', fontSize: '1rem', color: 'var(--text-secondary)' }}>
            {activeMatch.team2.name} Bowling
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
            {activeMatch.team2.players.filter(p => p.matchBallsBowled > 0).map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span>{p.name}</span>
                <span style={{ fontWeight: 600 }}>
                  {p.matchWickets}-{p.matchRunsConceded} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({Math.floor(p.matchBallsBowled/6)}.{p.matchBallsBowled%6})</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%' }}
          onClick={() => endInningsBreak()}
        >
          <CheckCircle size={20} /> Start Innings 2
        </button>
      </div>
    );
  }

  // Active Scoring UI variables
  const oversBowled = Math.floor(battingTeam.balls / 6);
  const ballsInOver = battingTeam.balls % 6;
  const currentRunRate = battingTeam.balls > 0 ? ((battingTeam.runs / battingTeam.balls) * 6).toFixed(2) : '0.00';
  
  let requiredRunRate = '0.00';
  if (activeMatch.currentInnings === 2) {
    const ballsRemaining = (activeMatch.overs * 6) - battingTeam.balls;
    const runsRequired = activeMatch.target - battingTeam.runs;
    requiredRunRate = ballsRemaining > 0 ? ((runsRequired / ballsRemaining) * 6).toFixed(2) : '0.00';
  }

  const striker = battingTeam.players.find(p => p.id === activeMatch.strikerId);
  const nonStriker = battingTeam.players.find(p => p.id === activeMatch.nonStrikerId);
  const bowler = bowlingTeam.players.find(p => p.id === activeMatch.currentBowlerId);

  const handleScore = (runs) => {
    scoreBall(runs, false, activeExtra);
    setActiveExtra(null);
  };
  const handleExtra = (type) => scoreBall(0, false, type);
  
  const handleWicket = () => {
    setWOutPlayerId(activeMatch.strikerId);
    setWicketModalOpen(true);
  };

  const confirmWicket = () => {
    scoreBall(0, true, null, {
      type: wType,
      fielderName: wFielder,
      outPlayerId: wOutPlayerId
    });
    setWicketModalOpen(false);
    setWType('Caught');
    setWFielder('');
  };

  if (showScorecardModal) {
    return (
      <div className="page-container" style={{ paddingBottom: '80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="page-title" style={{ margin: 0 }}>Match Scorecard</h2>
          <button className="btn-outline" style={{ padding: '8px', border: 'none' }} onClick={() => setShowScorecardModal(false)}>
            <XCircle size={24} />
          </button>
        </div>

        {/* Team 1 Scorecard */}
        <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
            <h3 style={{ color: 'var(--accent-primary)', fontSize: '1.25rem' }}>{activeMatch.team1.name}</h3>
            <span style={{ fontWeight: 700 }}>{activeMatch.team1.runs}/{activeMatch.team1.wickets} <span style={{fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 400}}>({Math.floor(activeMatch.team1.balls / 6)}.{activeMatch.team1.balls % 6} ov)</span></span>
          </div>

          <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Batting</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {activeMatch.team1.players.filter(p => p.matchBalls > 0 || p.matchRuns > 0 || p.isOut || (activeMatch.currentInnings === 1 && (p.id === activeMatch.strikerId || p.id === activeMatch.nonStrikerId))).map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 500 }}>{p.name} {p.isOut ? '' : (activeMatch.currentInnings === 1 && (p.id === activeMatch.strikerId || p.id === activeMatch.nonStrikerId) ? '*' : '')}</span>
                  {p.isOut && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{p.dismissal}</span>}
                  {!p.isOut && activeMatch.currentInnings === 1 && (p.id === activeMatch.strikerId || p.id === activeMatch.nonStrikerId) && <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)' }}>not out</span>}
                </div>
                <span style={{ fontWeight: 600 }}>{p.matchRuns} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({p.matchBalls})</span></span>
              </div>
            ))}
          </div>
          
          <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Bowling (by {activeMatch.team2.name})</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeMatch.team2.players.filter(p => p.matchBallsBowled > 0).map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span>{p.name}</span>
                <span style={{ fontWeight: 600 }}>{p.matchWickets}-{p.matchRunsConceded} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({Math.floor(p.matchBallsBowled/6)}.{p.matchBallsBowled%6})</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Team 2 Scorecard */}
        {activeMatch.currentInnings === 2 && (
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
              <h3 style={{ color: 'var(--accent-primary)', fontSize: '1.25rem' }}>{activeMatch.team2.name}</h3>
              <span style={{ fontWeight: 700 }}>{activeMatch.team2.runs}/{activeMatch.team2.wickets} <span style={{fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 400}}>({Math.floor(activeMatch.team2.balls / 6)}.{activeMatch.team2.balls % 6} ov)</span></span>
            </div>

            <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Batting</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {activeMatch.team2.players.filter(p => p.matchBalls > 0 || p.matchRuns > 0 || p.isOut || p.id === activeMatch.strikerId || p.id === activeMatch.nonStrikerId).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500 }}>{p.name} {p.isOut ? '' : (p.id === activeMatch.strikerId || p.id === activeMatch.nonStrikerId ? '*' : '')}</span>
                    {p.isOut && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{p.dismissal}</span>}
                    {!p.isOut && (p.id === activeMatch.strikerId || p.id === activeMatch.nonStrikerId) && <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)' }}>not out</span>}
                  </div>
                  <span style={{ fontWeight: 600 }}>{p.matchRuns} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({p.matchBalls})</span></span>
                </div>
              ))}
            </div>
            
            <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Bowling (by {activeMatch.team1.name})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeMatch.team1.players.filter(p => p.matchBallsBowled > 0).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span>{p.name}</span>
                  <span style={{ fontWeight: 600 }}>{p.matchWickets}-{p.matchRunsConceded} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({Math.floor(p.matchBallsBowled/6)}.{p.matchBallsBowled%6})</span></span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeMatch.isComplete) {
    let resultText = "Match Tied";
    if (activeMatch.team1.runs > activeMatch.team2.runs) {
      resultText = `${activeMatch.team1.name} Won!`;
    } else if (activeMatch.team2.runs >= activeMatch.target) {
      resultText = `${activeMatch.team2.name} Won!`;
    }

    const { manOfTheMatch, bestBowler } = getMatchAwards(activeMatch);

    return (
      <div className="page-container" style={{ textAlign: 'center' }}>
        <h1 style={{ color: 'var(--accent-primary)', margin: '40px 0 20px', fontSize: '2rem' }}>Match Complete</h1>
        <h2 style={{ marginBottom: '40px' }}>{resultText}</h2>

        <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.02))', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
          <h3 style={{ marginBottom: '16px', color: '#ffd700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Trophy size={20} /> Match Awards
          </h3>
          
          {manOfTheMatch && (
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Player of the Match</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{manOfTheMatch.name} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>({manOfTheMatch.matchRuns} runs, {manOfTheMatch.matchWickets} wkts)</span></span>
            </div>
          )}
          
          {bestBowler && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Best Bowler</span>
              <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--accent-secondary)' }}>{bestBowler.name} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>({bestBowler.matchWickets}-{bestBowler.matchRunsConceded})</span></span>
            </div>
          )}
        </div>
        
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '40px' }}>
          <h3 style={{ marginBottom: '12px', color: 'var(--accent-primary)' }}>{activeMatch.team1.name}</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px' }}>
            {activeMatch.team1.runs}/{activeMatch.team1.wickets} ({Math.floor(activeMatch.team1.balls / 6)}.{activeMatch.team1.balls % 6} ov)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', textAlign: 'left', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            {activeMatch.team1.players.filter(p => p.matchBalls > 0 || p.matchRuns > 0 || p.isOut || p.id === activeMatch.strikerId || p.id === activeMatch.nonStrikerId).map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span>{p.name} {p.isOut ? '' : '*'}</span>
                <span style={{ fontWeight: 600 }}>{p.matchRuns} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({p.matchBalls})</span></span>
              </div>
            ))}
          </div>

          <h3 style={{ marginBottom: '12px', color: 'var(--accent-primary)' }}>{activeMatch.team2.name}</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px' }}>
            {activeMatch.team2.runs}/{activeMatch.team2.wickets} ({Math.floor(activeMatch.team2.balls / 6)}.{activeMatch.team2.balls % 6} ov)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            {activeMatch.team2.players.filter(p => p.matchBalls > 0 || p.matchRuns > 0 || p.isOut || (activeMatch.currentInnings === 2 && (p.id === activeMatch.strikerId || p.id === activeMatch.nonStrikerId))).map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span>{p.name} {p.isOut ? '' : '*'}</span>
                <span style={{ fontWeight: 600 }}>{p.matchRuns} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({p.matchBalls})</span></span>
              </div>
            ))}
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%' }}
          onClick={() => {
            endMatchAndSave();
            navigate(`/tournaments/${activeMatch.tournamentId}`);
          }}
        >
          <CheckCircle size={20} /> Save Match & Update Points Table
        </button>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ paddingBottom: '120px' }}>
      {/* Score Header */}
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', marginBottom: '16px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600, padding: '4px 8px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isSyncing ? (
            <>
              <div className="live-dot" style={{ width: '6px', height: '6px' }}></div>
              Saving...
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span>Innings {activeMatch.currentInnings}</span>
              {activeMatch.isCompulsoryChase && (
                <span style={{ fontSize: '0.65rem', color: '#ffd700', border: '1px solid #ffd700', padding: '2px 4px', borderRadius: '2px' }}>
                  COMPULSORY CHASE
                </span>
              )}
            </div>
          )}
        </div>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '8px' }}>
          {battingTeam.name} Batting
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1 }}>{battingTeam.runs}</span>
          <span style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>-</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-danger)' }}>{battingTeam.wickets}</span>
        </div>
        
        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Overs: {oversBowled}.{ballsInOver} <span style={{ fontSize: '0.875rem', fontWeight: 400 }}>/ {activeMatch.overs}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginBottom: activeMatch.currentInnings === 2 ? '12px' : 0 }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>CRR</p>
            <p style={{ fontWeight: 600 }}>{currentRunRate}</p>
          </div>
          {activeMatch.currentInnings === 2 && (
            <>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Target</p>
                <p style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{activeMatch.target}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>RRR</p>
                <p style={{ fontWeight: 600 }}>{requiredRunRate}</p>
              </div>
            </>
          )}
        </div>

        {activeMatch.currentInnings === 2 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
            {activeMatch.target - battingTeam.runs > 0 ? (
              <>Need {activeMatch.target - battingTeam.runs} runs from {(activeMatch.overs * 6) - battingTeam.balls} balls</>
            ) : (
              <span style={{ color: '#ffd700' }}>Target Reached! Leading by {battingTeam.runs - (activeMatch.target - 1)} runs</span>
            )}
            {activeMatch.isCompulsoryChase && (
              <div style={{ fontSize: '0.7rem', color: '#ffd700', marginTop: '4px', fontWeight: 500 }}>
                ★ Compulsory Chase: Full overs or All Out required
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button 
          className="btn btn-outline" 
          style={{ flex: 1, fontSize: '0.875rem', padding: '8px', background: 'rgba(255,255,255,0.03)' }}
          onClick={() => setShowScorecardModal(true)}
        >
          View Full Scorecard
        </button>
        <button 
          className="btn btn-outline" 
          style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', color: 'var(--accent-danger)' }}
          onClick={() => { deauthorize(); navigate('/'); }}
          title="Lock Scoring"
        >
          <XCircle size={18} />
        </button>
      </div>

      {/* Players Dashboard */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', position: 'relative' }}>
        
        <button 
          className="btn btn-outline" 
          style={{ position: 'absolute', top: '16px', right: '16px', padding: '6px', borderRadius: '50%' }}
          onClick={swapStrike}
          title="Swap Strike"
        >
          <ArrowLeftRight size={16} />
        </button>

        {/* Batsmen */}
        <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingRight: '40px' }}>
          {striker && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                <User size={16} /> {striker.name} *
                {isAuthorized && (
                  <button 
                    onClick={() => { if(window.confirm(`${striker.name} is injured/retired hurt?`)) retireBatter(striker.id); }}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--accent-danger)', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Injured
                  </button>
                )}
              </div>
              <div style={{ fontWeight: 600 }}>{striker.matchRuns} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({striker.matchBalls})</span></div>
            </div>
          )}
          {nonStriker && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <User size={16} /> {nonStriker.name}
                {isAuthorized && (
                  <button 
                    onClick={() => { if(window.confirm(`${nonStriker.name} is injured/retired hurt?`)) retireBatter(nonStriker.id); }}
                    style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Injured
                  </button>
                )}
              </div>
              <div>{nonStriker.matchRuns} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({nonStriker.matchBalls})</span></div>
            </div>
          )}
        </div>

        {/* Bowler */}
        <div>
          {bowler && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-secondary)' }}></div>
                {bowler.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontWeight: 600 }}>
                  {bowler.matchWickets}-{bowler.matchRunsConceded} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({Math.floor(bowler.matchBallsBowled/6)}.{bowler.matchBallsBowled%6})</span>
                </div>
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }}
                  onClick={changeBowler}
                  title="Change Bowler (Injury)"
                >
                  <RefreshCcw size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Partnership Tracker */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Partnership</p>
          <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {activeMatch.partnership.runs} <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-secondary)' }}>runs</span>
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Balls</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{activeMatch.partnership.balls}</p>
        </div>
      </div>

      {/* Over History */}
      <div className="glass-panel" style={{ padding: '12px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', minWidth: 'fit-content' }}>This Over:</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(activeMatch.currentOverHistory || []).map((ball, idx) => (
            <div key={idx} style={{ 
              minWidth: '28px', height: '28px', borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: '0.75rem', fontWeight: 700,
              background: ball === '6' ? 'var(--accent-primary)' : 
                          ball === '4' ? 'var(--accent-secondary)' : 
                          ball === 'W' ? 'var(--accent-danger)' : 'rgba(255,255,255,0.1)',
              color: (ball === '6' || ball === '4' || ball === 'W') ? '#000' : 'var(--text-primary)',
              border: (ball === 'Wd' || ball === 'Nb') ? '1px solid var(--accent-secondary)' : 'none'
            }}>
              {ball}
            </div>
          ))}
          {(!activeMatch.currentOverHistory || activeMatch.currentOverHistory.length === 0) && <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Waiting for first ball...</span>}
        </div>
      </div>

      {/* Scoring Buttons */}
      {!isAuthorized ? (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', marginBottom: '40px', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Trophy size={32} style={{ marginBottom: '16px', color: 'var(--accent-primary)', opacity: 0.5 }} />
          <h3 style={{ marginBottom: '8px' }}>View Only Mode</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px' }}>Enter Admin PIN to start scoring this match.</p>
          <form onSubmit={handleAuth} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="password" 
              placeholder="PIN" 
              maxLength={4}
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              style={{ flex: 1, padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', textAlign: 'center', letterSpacing: '4px' }}
            />
            <button type="submit" className="btn btn-primary">Unlock</button>
          </form>
        </div>
      ) : (
        <div>
          <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Runs</h3>
          {activeExtra && (
            <p style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', marginBottom: '12px', fontWeight: 600 }}>
              Scoring as: {activeExtra === 'bye' ? 'Byes' : 'Leg Byes'}
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
            <button className="btn btn-outline" style={{ height: '64px', fontSize: '1.25rem' }} onClick={() => handleScore(0)}>0</button>
            <button className="btn btn-outline" style={{ height: '64px', fontSize: '1.25rem' }} onClick={() => handleScore(1)}>1</button>
            <button className="btn btn-outline" style={{ height: '64px', fontSize: '1.25rem' }} onClick={() => handleScore(2)}>2</button>
            <button className="btn btn-outline" style={{ height: '64px', fontSize: '1.25rem' }} onClick={() => handleScore(3)}>3</button>
            <button className="btn btn-outline" style={{ height: '64px', fontSize: '1.25rem', borderColor: 'var(--accent-secondary)', color: 'var(--accent-secondary)' }} onClick={() => handleScore(4)}>4</button>
            <button className="btn btn-outline" style={{ height: '64px', fontSize: '1.25rem', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }} onClick={() => handleScore(6)}>6</button>
          </div>

          <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Extras & Wickets</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <button 
              className={`btn ${activeExtra === 'bye' ? 'btn-primary' : 'btn-outline'}`} 
              style={{ height: '48px' }} 
              onClick={() => setActiveExtra(prev => prev === 'bye' ? null : 'bye')}
            >
              Byes
            </button>
            <button 
              className={`btn ${activeExtra === 'lb' ? 'btn-primary' : 'btn-outline'}`} 
              style={{ height: '48px' }} 
              onClick={() => setActiveExtra(prev => prev === 'lb' ? null : 'lb')}
            >
              Leg Byes
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
            <button className="btn btn-outline" style={{ height: '56px' }} onClick={() => handleExtra('wd')}>Wide</button>
            <button className="btn btn-outline" style={{ height: '56px' }} onClick={() => handleExtra('nb')}>No Ball</button>
            <button className="btn btn-danger" style={{ gridColumn: 'span 2', height: '64px', fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '2px' }} onClick={handleWicket}>
              Wicket
            </button>
          </div>
        </div>
      )}

      {/* Admin Actions */}
      <div style={{ textAlign: 'center' }}>
        <button 
          className="btn" 
          style={{ background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.875rem' }}
          onClick={() => {
            if (window.confirm("Are you sure you want to cancel this match? No data will be saved.")) {
              cancelActiveMatch();
              navigate('/');
            }
          }}
        >
          <XCircle size={16} style={{ marginRight: '4px' }} /> Cancel Match
        </button>
      </div>

      {/* Wicket Details Modal */}
      {wicketModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '24px' }}>
            <h2 style={{ marginBottom: '20px', color: 'var(--accent-danger)' }}>Wicket Details</h2>
            
            <div className="input-group">
              <label className="input-label">Who is out?</label>
              <select className="input-field" value={wOutPlayerId} onChange={e => setWOutPlayerId(e.target.value)} style={{ background: 'var(--bg-secondary)' }}>
                <option value={activeMatch.strikerId}>{striker?.name} (Striker)</option>
                <option value={activeMatch.nonStrikerId}>{nonStriker?.name} (Non-Striker)</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Wicket Type</label>
              <select className="input-field" value={wType} onChange={e => setWType(e.target.value)} style={{ background: 'var(--bg-secondary)' }}>
                <option value="Caught">Caught</option>
                <option value="Bowled">Bowled</option>
                <option value="LBW">LBW</option>
                <option value="Run Out">Run Out</option>
                <option value="Stumped">Stumped</option>
                <option value="Hit Wicket">Hit Wicket</option>
              </select>
            </div>

            {(wType === 'Caught' || wType === 'Run Out' || wType === 'Stumped') && (
              <div className="input-group">
                <label className="input-label">Fielder Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Rahul" 
                  value={wFielder}
                  onChange={e => setWFielder(e.target.value)}
                  style={{ background: 'var(--bg-secondary)' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setWicketModalOpen(false)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 2 }} onClick={confirmWicket}>Confirm Wicket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveScorer;
