import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const CricketContext = createContext();

export const useCricket = () => useContext(CricketContext);

export const CricketProvider = ({ children }) => {
  const [tournaments, setTournaments] = useState([]);
  const [activeMatch, setActiveMatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [appPin, setAppPinState] = useState('0000');
  const [currentUser, setCurrentUser] = useState(null);

  // Load from Cloud on Start
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch Tournaments - try 'data' column first, if fails, it's fine
        const { data: tData, error: tErr } = await supabase
          .from('tournaments')
          .select('*') // Select all to be safe
          .order('updated_at', { ascending: false });
        
        if (!tErr && tData) {
          // If we used the 'data' column schema
          if (tData.length > 0 && tData[0].data) {
            setTournaments(tData.map(item => item.data));
          } else {
            // If we used the 'id, name, teams' column schema
            setTournaments(tData);
          }
        }

        // Fetch Active Match
        const { data: mData, error: mErr } = await supabase
          .from('active_match')
          .select('*')
          .eq('id', 'current')
          .maybeSingle();
        
        if (!mErr && mData) {
          // If the data column exists and is explicitly null, it means no active match
          if ('data' in mData && mData.data === null) {
            setActiveMatch(null);
          } else {
            setActiveMatch(mData.data || mData);
          }
        }

        // Fetch Settings
        const { data: sData, error: sErr } = await supabase
          .from('app_settings')
          .select('scoring_pin')
          .eq('id', 'global')
          .maybeSingle();
        
        if (!sErr && sData) {
          setAppPinState(sData.scoring_pin);
        }

        const savedAuth = localStorage.getItem('isAuthorized');
        if (savedAuth === 'true') setIsAuthorized(true);

        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) setCurrentUser(JSON.parse(savedUser));

      } catch (err) {
        console.error('Initial load error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const setAppPin = async (newPin) => {
    setIsSyncing(true);
    setAppPinState(newPin);
    await supabase.from('app_settings').upsert({ id: 'global', scoring_pin: newPin, updated_at: new Date().toISOString() });
    setIsSyncing(false);
  };

  const authorize = (pin) => {
    if (pin === appPin) {
      setIsAuthorized(true);
      localStorage.setItem('isAuthorized', 'true');
      return true;
    }
    return false;
  };

  const deauthorize = () => {
    setIsAuthorized(false);
    localStorage.removeItem('isAuthorized');
  };

  const login = (mobile, password) => {
    const users = JSON.parse(localStorage.getItem('cricket_users') || '[]');
    let user = users.find(u => u.mobile === mobile);
    
    if (!user) {
      alert("Mobile number not found. Please sign up first.");
      return false;
    }

    if (user.password !== password) {
      alert("Incorrect password!");
      return false;
    }

    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    return true;
  };

  const signup = (name, mobile, password) => {
    const users = JSON.parse(localStorage.getItem('cricket_users') || '[]');
    if (users.some(u => u.mobile === mobile)) {
      alert("Mobile number already registered!");
      return false;
    }

    const newUser = { name, mobile, password, loggedInAt: new Date().toISOString() };
    users.push(newUser);
    localStorage.setItem('cricket_users', JSON.stringify(users));
    
    setCurrentUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    deauthorize(); // Log out of scoring too
  };

  // Cloud Sync Helpers
  const syncTournaments = async (updatedList) => {
    setIsSyncing(true);
    try {
      for (const t of updatedList) {
        await supabase.from('tournaments').upsert({ id: t.id, data: t, updated_at: new Date().toISOString() });
      }
    } finally { setIsSyncing(false); }
  };

  const syncActiveMatch = async (match) => {
    setIsSyncing(true);
    try {
      if (match === null) {
        await supabase.from('active_match').delete().eq('id', 'current');
      } else {
        await supabase.from('active_match').upsert({ id: 'current', data: match, updated_at: new Date().toISOString() });
      }
    } finally { setIsSyncing(false); }
  };

  // Actions
  const addTournament = async (name) => {
    const newTournament = { 
      id: Date.now().toString(), 
      name, 
      organizer: currentUser?.name || 'Anonymous',
      teams: [], 
      matches: [] 
    };
    const updated = [...tournaments, newTournament];
    setTournaments(updated);
    await syncTournaments([newTournament]);
  };

  const addTeamToTournament = async (tournamentId, teamName) => {
    const updated = tournaments.map(t => {
      if (t.id === tournamentId) {
        return {
          ...t,
          teams: [...t.teams, { 
            id: Date.now().toString(), name: teamName, players: [], played: 0, won: 0, lost: 0, points: 0, netRunRate: 0,
            runsScored: 0, ballsFaced: 0, runsConceded: 0, ballsBowled: 0
          }]
        };
      }
      return t;
    });
    setTournaments(updated);
    const target = updated.find(t => t.id === tournamentId);
    await syncTournaments([target]);
  };

  const addPlayer = async (tournamentId, teamId, playerName) => {
    const newPlayer = {
      id: Date.now().toString(), name: playerName,
      totalRuns: 0, totalBalls: 0, totalWickets: 0, totalOvers: 0, totalRunsConceded: 0
    };

    const updated = tournaments.map(t => {
      if (t.id !== tournamentId) return t;
      return {
        ...t,
        teams: t.teams.map(team => {
          if (team.id !== teamId) return team;
          return { ...team, players: [...team.players, newPlayer] };
        })
      };
    });
    setTournaments(updated);
    await syncTournaments([updated.find(t => t.id === tournamentId)]);

    if (activeMatch && activeMatch.tournamentId === tournamentId) {
      const matchPlayerEntry = { ...newPlayer, matchRuns: 0, matchBalls: 0, matchWickets: 0, matchRunsConceded: 0, matchBallsBowled: 0, isOut: false };
      const teamKey = activeMatch.team1.id === teamId ? 'team1' : activeMatch.team2.id === teamId ? 'team2' : null;
      if (teamKey) {
        const updatedMatch = { ...activeMatch, [teamKey]: { ...activeMatch[teamKey], players: [...activeMatch[teamKey].players, matchPlayerEntry] } };
        setActiveMatch(updatedMatch);
        await syncActiveMatch(updatedMatch);
      }
    }
  };

  const removePlayer = async (tournamentId, teamId, playerId) => {
    const updated = tournaments.map(t => {
      if (t.id !== tournamentId) return t;
      return {
        ...t,
        teams: t.teams.map(team => {
          if (team.id !== teamId) return team;
          return { ...team, players: team.players.filter(p => p.id !== playerId) };
        })
      };
    });
    setTournaments(updated);
    await syncTournaments([updated.find(t => t.id === tournamentId)]);
  };

  const startMatch = async (tournamentId, team1Id, team2Id, overs, team1PlayingIds, team2PlayingIds, isCompulsoryChase = false) => {
    const t = tournaments.find(t => t.id === tournamentId);
    const cloneTeam = (team, playingIds) => {
      const playingRoster = team.players.filter(p => playingIds.includes(p.id));
      return {
        ...team, runs: 0, wickets: 0, balls: 0,
        players: playingRoster.map(p => ({
          ...p, matchRuns: 0, matchBalls: 0, matchWickets: 0, matchRunsConceded: 0, matchBallsBowled: 0, isOut: false, dismissal: ''
        }))
      };
    };

    const team1 = cloneTeam(t.teams.find(tm => tm.id === team1Id), team1PlayingIds);
    const team2 = cloneTeam(t.teams.find(tm => tm.id === team2Id), team2PlayingIds);

    const match = {
      id: Date.now().toString(), tournamentId, overs: parseInt(overs, 10), team1, team2, currentInnings: 1,
      isCompulsoryChase,
      battingTeamId: team1Id, bowlingTeamId: team2Id, partnership: { runs: 0, balls: 0 }, isComplete: false,
      target: null, strikerId: null, nonStrikerId: null, currentBowlerId: null,
      promptForBatsmen: true, promptForBowler: true, promptForNextBatsman: false, isInningsBreak: false,
      currentOverHistory: []
    };

    setActiveMatch(match);
    await syncActiveMatch(match);
  };

  const setOpeningPlayers = async (strikerId, nonStrikerId, bowlerId) => {
    const updated = { ...activeMatch, strikerId, nonStrikerId, currentBowlerId: bowlerId, promptForBatsmen: false, promptForBowler: false };
    setActiveMatch(updated);
    await syncActiveMatch(updated);
  };

  const setNextBatsman = (batsmanId) => {
    setActiveMatch(prev => {
      const match = { ...prev };
      if (match.strikerId === null) match.strikerId = batsmanId;
      else if (match.nonStrikerId === null) match.nonStrikerId = batsmanId;
      else match.strikerId = batsmanId; 
      match.promptForNextBatsman = false;
      return match;
    });
  };

  const setNextBowler = (bowlerId) => {
    setActiveMatch(prev => {
      const battingKey = prev.currentInnings === 1 ? 'team1' : 'team2';
      const isMidOver = prev[battingKey].balls % 6 !== 0;
      
      return {
        ...prev,
        currentBowlerId: bowlerId,
        promptForBowler: false,
        currentOverHistory: isMidOver ? prev.currentOverHistory : [] // Only clear if starting a brand new over
      };
    });
  };

  const retireBatter = async (playerId) => {
    if (!activeMatch) return;
    const match = JSON.parse(JSON.stringify(activeMatch));
    const battingKey = match.currentInnings === 1 ? 'team1' : 'team2';
    
    const player = match[battingKey].players.find(p => p.id === playerId);
    if (!player) return;

    player.isOut = true;
    player.isRetired = true;

    if (match.strikerId === playerId) {
      match.strikerId = null;
    } else if (match.nonStrikerId === playerId) {
      match.nonStrikerId = null;
    }

    // Check if anyone left to bat
    const playersOut = match[battingKey].players.filter(p => p.isOut).length;
    const isAllOut = playersOut >= match[battingKey].players.length - 1;

    if (isAllOut) {
      match.promptForNextBatsman = false;
      // Trigger end innings logic
      if (match.currentInnings === 1) {
        match.isInningsBreak = true; match.currentInnings = 2; match.target = match.team1.runs + 1;
        match.battingTeamId = match.team2.id; match.bowlingTeamId = match.team1.id;
        match.partnership = { runs: 0, balls: 0 }; match.promptForBatsmen = true;
        match.promptForBowler = true; match.strikerId = null; match.nonStrikerId = null; match.currentBowlerId = null;
      } else { match.isComplete = true; }
    } else {
      match.promptForNextBatsman = true;
    }

    setActiveMatch(match);
    await syncActiveMatch(match);
  };

  const undoLastAction = async () => {
    if (!activeMatch || !activeMatch.undoStack || activeMatch.undoStack.length === 0) return;
    const match = JSON.parse(JSON.stringify(activeMatch));
    const previousStateString = match.undoStack.pop();
    const previousState = JSON.parse(previousStateString);
    previousState.undoStack = match.undoStack; // restore the remaining stack
    setActiveMatch(previousState);
    await syncActiveMatch(previousState);
  };

  const scoreBall = async (runs, isWicket = false, extra = null, wicketData = null) => {
    if (!activeMatch) return;

    // Save history snapshot before modifying state
    const historyState = JSON.parse(JSON.stringify(activeMatch));
    delete historyState.undoStack;
    
    const match = JSON.parse(JSON.stringify(activeMatch));
    match.undoStack = activeMatch.undoStack || [];
    match.undoStack.push(JSON.stringify(historyState));
    if (match.undoStack.length > 20) match.undoStack.shift(); // Keep last 20 balls

    let runsScored = runs;
    let ballCounted = true;
    if (extra === 'wd' || extra === 'nb') { runsScored += 1; ballCounted = false; }

    const battingKey = match.currentInnings === 1 ? 'team1' : 'team2';
    const bowlingKey = match.currentInnings === 1 ? 'team2' : 'team1';
    
    const striker = match[battingKey].players.find(p => p.id === match.strikerId);
    const bowler = match[bowlingKey].players.find(p => p.id === match.currentBowlerId);

    match[battingKey].runs += runsScored;
    match.partnership.runs += runsScored;

    if (striker) {
      if (extra !== 'wd' && extra !== 'bye' && extra !== 'lb') striker.matchRuns += runs;
      if (ballCounted) striker.matchBalls += 1;
    }
    
    if (bowler) {
      if (extra !== 'bye' && extra !== 'lb') bowler.matchRunsConceded += runsScored;
      if (ballCounted) bowler.matchBallsBowled += 1;
      // Wicket logic moved below to handle wicketData
    }

    if (ballCounted) {
      match[battingKey].balls += 1;
      match.partnership.balls += 1;
    }

    if (!match.currentOverHistory) match.currentOverHistory = [];

    // Track ball in over history
    let ballLabel = runs.toString();
    if (extra === 'wd') ballLabel = 'Wd';
    else if (extra === 'nb') ballLabel = 'Nb';
    else if (isWicket) ballLabel = 'W';
    else if (runs === 0) ballLabel = '.';
    
    match.currentOverHistory.push(ballLabel);

    let strikeRotated = false;
    if (runs % 2 !== 0 && extra !== 'wd') strikeRotated = true;

    const maxBalls = match.overs * 6;
    let playersOutCount = match[battingKey].players.filter(p => p.isOut).length;
    let isAllOut = playersOutCount >= match[battingKey].players.length - 1;
    const isOversDone = match[battingKey].balls >= maxBalls;
    
    if (isWicket) {
      match[battingKey].wickets += 1;
      
      const outPlayerId = wicketData?.outPlayerId || match.strikerId;
      const outPlayer = match[battingKey].players.find(p => p.id === outPlayerId);
      
      if (outPlayer) {
        outPlayer.isOut = true;
        const wType = wicketData?.type || 'Out';
        const fName = wicketData?.fielderName || '';
        
        if (wType === 'Caught') outPlayer.dismissal = `c ${fName} b ${bowler?.name || 'Bowler'}`;
        else if (wType === 'Bowled') outPlayer.dismissal = `b ${bowler?.name || 'Bowler'}`;
        else if (wType === 'LBW') outPlayer.dismissal = `lbw b ${bowler?.name || 'Bowler'}`;
        else if (wType === 'Run Out') outPlayer.dismissal = `run out (${fName})`;
        else if (wType === 'Stumped') outPlayer.dismissal = `st ${fName} b ${bowler?.name || 'Bowler'}`;
        else if (wType === 'Hit Wicket') outPlayer.dismissal = `hit wicket b ${bowler?.name || 'Bowler'}`;
        else outPlayer.dismissal = 'Out';

        if (wType !== 'Run Out' && bowler) {
          bowler.matchWickets += 1;
        }

        // Update isAllOut after current wicket
        playersOutCount = match[battingKey].players.filter(p => p.isOut).length;
        isAllOut = playersOutCount >= match[battingKey].players.length - 1;
      }

      if (match.strikerId === outPlayerId) match.strikerId = null;
      else if (match.nonStrikerId === outPlayerId) match.nonStrikerId = null;

      match.partnership = { runs: 0, balls: 0 };
      
      // Re-calculate isAllOut after incrementing wickets
      const playersOutNow = match[battingKey].players.filter(p => p.isOut).length;
      const stillAlive = playersOutNow < match[battingKey].players.length - 1;
      if (stillAlive) {
        match.promptForNextBatsman = true;
      }
    }

    const isOverComplete = ballCounted && (match[battingKey].balls % 6 === 0);
    if (isOverComplete && !match.isComplete) {
      strikeRotated = !strikeRotated;
      match.promptForBowler = true;
    }

    if (strikeRotated && !match.promptForNextBatsman) {
      const temp = match.strikerId;
      match.strikerId = match.nonStrikerId;
      match.nonStrikerId = temp;
    }

    let endInnings = isAllOut || isOversDone || (match[battingKey].wickets >= match[battingKey].players.length - 1);
    
    // If NOT compulsory chase, end match as soon as target is reached
    if (match.currentInnings === 2 && !match.isCompulsoryChase && match[battingKey].runs >= match.target) {
      endInnings = true;
    }
    
    // If compulsory chase, only end if all out or overs done (already covered by endInnings),
    // but we should still mark match as complete if target was reached and it's the end of innings.
    // The existing logic below handles this.

    if (endInnings) {
      match.promptForNextBatsman = false;
      match.promptForBowler = false;
      if (match.currentInnings === 1) {
        match.isInningsBreak = true; match.currentInnings = 2; match.target = match.team1.runs + 1;
        match.battingTeamId = match.team2.id; match.bowlingTeamId = match.team1.id;
        match.partnership = { runs: 0, balls: 0 }; match.promptForBatsmen = true;
        match.promptForBowler = true; match.strikerId = null; match.nonStrikerId = null; match.currentBowlerId = null;
        match.currentOverHistory = [];
      } else { match.isComplete = true; }
    }

    setActiveMatch(match);
    await syncActiveMatch(match);
  };

  const endInningsBreak = () => {
    setActiveMatch(prev => ({ ...prev, isInningsBreak: false }));
  };

  const changeBowler = () => {
    if (!activeMatch) return;
    setActiveMatch(prev => ({ ...prev, promptForBowler: true }));
  };

  const swapStrike = async () => {
    if (!activeMatch) return;
    const match = JSON.parse(JSON.stringify(activeMatch));
    const temp = match.strikerId;
    match.strikerId = match.nonStrikerId;
    match.nonStrikerId = temp;
    setActiveMatch(match);
    await syncActiveMatch(match);
  };

  const endMatchAndSave = async () => {
    if (!activeMatch || !activeMatch.isComplete) return;

    const tId = activeMatch.tournamentId;
    let winnerId = null;
    let isTie = false;

    if (activeMatch.team2.runs >= activeMatch.target) winnerId = activeMatch.team2.id;
    else if (activeMatch.team1.runs > activeMatch.team2.runs) winnerId = activeMatch.team1.id;
    else isTie = true;

    let targetTournament;
    const updatedTournaments = tournaments.map(t => {
      if (t.id === tId) {
        // Safeguard: Check if match already saved
        if (t.matches && t.matches.some(m => m.id === activeMatch.id)) {
          return t;
        }

        const updatedTeams = t.teams.map(team => {
          const isTeam1 = team.id === activeMatch.team1.id;
          const isTeam2 = team.id === activeMatch.team2.id;
          if (!isTeam1 && !isTeam2) return team;

          const matchTeamData = isTeam1 ? activeMatch.team1 : activeMatch.team2;
          const matchOpponentData = isTeam1 ? activeMatch.team2 : activeMatch.team1;

          const played = team.played + 1;
          let won = team.won;
          let lost = team.lost;
          let points = team.points;

          if (team.id === winnerId) { won += 1; points += 2; }
          else if (!isTie) lost += 1;
          else points += 1;

          const runsScored = team.runsScored + matchTeamData.runs;
          const ballsFaced = team.ballsFaced + matchTeamData.balls;
          const runsConceded = team.runsConceded + matchOpponentData.runs;
          const ballsBowled = team.ballsBowled + matchOpponentData.balls;
          
          const oversFaced = Math.max(ballsFaced / 6, 1);
          const oversBowled = Math.max(ballsBowled / 6, 1);
          const nrr = (runsScored / oversFaced) - (runsConceded / oversBowled);

          const updatedPlayers = team.players.map(p => {
            const matchPlayer = matchTeamData.players.find(mp => mp.id === p.id);
            if (matchPlayer) {
              return {
                ...p,
                totalRuns: p.totalRuns + matchPlayer.matchRuns,
                totalBalls: p.totalBalls + matchPlayer.matchBalls,
                totalWickets: p.totalWickets + matchPlayer.matchWickets,
                totalRunsConceded: p.totalRunsConceded + matchPlayer.matchRunsConceded,
                totalOvers: p.totalOvers + (matchPlayer.matchBallsBowled / 6)
              };
            }
            return p;
          });

          return {
            ...team, players: updatedPlayers,
            played, won, lost, points,
            runsScored, ballsFaced, runsConceded, ballsBowled,
            netRunRate: parseFloat(nrr.toFixed(3))
          };
        });

        targetTournament = { ...t, teams: updatedTeams, matches: [...t.matches, activeMatch] };
        return targetTournament;
      }
      return t;
    });

    setTournaments(updatedTournaments);
    if (targetTournament) await syncTournaments([targetTournament]);
    
    setActiveMatch(null);
    await syncActiveMatch(null);
  };

  const cancelActiveMatch = async () => {
    setActiveMatch(null);
    await syncActiveMatch(null);
  };

  const resetTournamentStats = async (tournamentId) => {
    const updated = tournaments.map(t => {
      if (t.id !== tournamentId) return t;
      return {
        ...t, matches: [],
        teams: t.teams.map(team => ({
          ...team, played: 0, won: 0, lost: 0, points: 0, netRunRate: 0,
          runsScored: 0, ballsFaced: 0, runsConceded: 0, ballsBowled: 0,
          players: team.players.map(p => ({
            ...p, totalRuns: 0, totalBalls: 0, totalWickets: 0, totalOvers: 0, totalRunsConceded: 0
          }))
        }))
      };
    });
    setTournaments(updated);
    const target = updated.find(t => t.id === tournamentId);
    await syncTournaments([target]);
  };

  const deleteMatch = async (tournamentId, matchId) => {
    const t = tournaments.find(curr => curr.id === tournamentId);
    const match = t.matches.find(m => m.id === matchId);
    if (!match) return;

    let winnerId = null;
    let isTie = false;
    if (match.team2.runs >= match.target) winnerId = match.team2.id;
    else if (match.team1.runs > match.team2.runs) winnerId = match.team1.id;
    else isTie = true;

    const updated = tournaments.map(t => {
      if (t.id !== tournamentId) return t;
      const updatedTeams = t.teams.map(team => {
        const isTeam1 = team.id === match.team1.id;
        const isTeam2 = team.id === match.team2.id;
        if (!isTeam1 && !isTeam2) return team;

        const matchTeamData = isTeam1 ? match.team1 : match.team2;
        const matchOpponentData = isTeam1 ? match.team2 : match.team1;

        const played = team.played - 1;
        let won = team.won;
        let lost = team.lost;
        let points = team.points;

        if (team.id === winnerId) { won -= 1; points -= 2; }
        else if (!isTie) lost -= 1;
        else points -= 1;

        const runsScored = team.runsScored - matchTeamData.runs;
        const ballsFaced = team.ballsFaced - matchTeamData.balls;
        const runsConceded = team.runsConceded - matchOpponentData.runs;
        const ballsBowled = team.ballsBowled - matchOpponentData.balls;

        const oversFaced = Math.max(ballsFaced / 6, 1);
        const oversBowled = Math.max(ballsBowled / 6, 1);
        const nrr = played > 0 ? (runsScored / oversFaced) - (runsConceded / oversBowled) : 0;

        const updatedPlayers = team.players.map(p => {
          const matchPlayer = matchTeamData.players.find(mp => mp.id === p.id);
          if (matchPlayer) {
            return {
              ...p,
              totalRuns: Math.max(0, p.totalRuns - matchPlayer.matchRuns),
              totalBalls: Math.max(0, p.totalBalls - matchPlayer.matchBalls),
              totalWickets: Math.max(0, p.totalWickets - matchPlayer.matchWickets),
              totalRunsConceded: Math.max(0, p.totalRunsConceded - matchPlayer.matchRunsConceded),
              totalOvers: Math.max(0, p.totalOvers - (matchPlayer.matchBallsBowled / 6))
            };
          }
          return p;
        });

        return {
          ...team, players: updatedPlayers,
          played: Math.max(0, played), won: Math.max(0, won), lost: Math.max(0, lost), points: Math.max(0, points),
          runsScored: Math.max(0, runsScored), ballsFaced: Math.max(0, ballsFaced),
          runsConceded: Math.max(0, runsConceded), ballsBowled: Math.max(0, ballsBowled),
          netRunRate: parseFloat(nrr.toFixed(3))
        };
      });

      return { ...t, teams: updatedTeams, matches: t.matches.filter(m => m.id !== matchId) };
    });

    setTournaments(updated);
    const target = updated.find(t => t.id === tournamentId);
    await syncTournaments([target]);
  };

  return (
    <CricketContext.Provider value={{
      tournaments, activeMatch, isLoading, isSyncing,
      isAuthorized, appPin, setAppPin, authorize, deauthorize,
      currentUser, login, logout,
      addTournament, addTeamToTournament, addPlayer, removePlayer,
      startMatch, setOpeningPlayers, setNextBatsman, setNextBowler, retireBatter,
      scoreBall, swapStrike, changeBowler, endInningsBreak,
      endMatchAndSave, cancelActiveMatch, deleteMatch, resetTournamentStats,
      undoLastAction
    }}>
      {children}
    </CricketContext.Provider>
  );
};
