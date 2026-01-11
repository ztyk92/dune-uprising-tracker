import { useState, useEffect } from 'react'

import './App.css'
import SetupWizard from './components/SetupWizard';
import GameDashboard from './components/GameDashboard';
import ScoringView from './components/ScoringView';

const STORAGE_KEY = 'dune_imperium_tracker_state';


function RecentGamesList({ leaders, availablePlayers }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const SHEET_ID = '1W6QdQtyJ3LkjYPedZzc0dczB_ecYLPdM2VKuS1bhMA4';

  useEffect(() => {
    fetch(`/api/recent-games?spreadsheetId=${SHEET_ID}`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to load');
      })
      .then(data => {
        setGames(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateString) => {
    try {
      // Try standard parse
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) return date.toLocaleDateString();

      // Handle custom format: YYYY-MM-DDTHH-mm-ss
      if (dateString.includes('T')) {
        return dateString.split('T')[0];
      }
      return dateString;
    } catch (e) {
      return 'Unknown Date';
    }
  };

  const getPlayerName = (id) => {
    if (!availablePlayers) return id;
    const p = availablePlayers.find(ap => String(ap.id) === String(id));
    return p ? p.name : id;
  };

  const getLeaderName = (id) => {
    if (!leaders) return id;
    // Check if id is a name (legacy) or an id
    const l = leaders.find(ld => ld.id === id);
    return l ? l.name : id; // fallback to showing ID/Name as is
  };

  if (loading) return <div style={{ marginTop: '2rem', color: '#666' }}>Loading past games...</div>;
  if (games.length === 0) return null;

  return (
    <div style={{ marginTop: '3rem', borderTop: '1px solid #333', paddingTop: '1rem', textAlign: 'left' }}>
      <h4 style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Previous Matches</h4>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        {games.map(g => (
          <div key={g.id} style={{ backgroundColor: '#222', padding: '1rem', borderRadius: '8px', border: '1px solid #444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--color-accent-gold)', fontWeight: 'bold' }}>Game #{g.id}</span>
              <span style={{ fontSize: '0.8rem', color: '#888' }}>{formatDate(g.date)}</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {g.players
                .sort((a, b) => parseInt(b.vp) - parseInt(a.vp))
                .map((p, idx) => {
                  // p.playerId and p.leaderId come from server mapping logic
                  const pName = getPlayerName(p.playerId || p.name); // Handle both for backward compat
                  const lName = getLeaderName(p.leaderId || p.leader);
                  return (
                    <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                      <span>
                        {idx === 0 && <span style={{ marginRight: '0.3rem' }}>👑</span>}
                        {pName} <span style={{ color: '#666', fontStyle: 'italic' }}>({lName})</span>
                      </span>
                      <span style={{ fontWeight: 'bold' }}>{p.vp} VP</span>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  // Initialize state from local storage if available
  const [gameState, setGameState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).gameState : 'home';
  });

  const [gameData, setGameData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).gameData : {
      players: [],
      round: 1,
      phase: 'Agent',
      history: []
    };
  });

  // Load Leaders from API
  const [leaders, setLeaders] = useState([]);

  // Load Players from API
  const [availablePlayers, setAvailablePlayers] = useState([]);

  const SHEET_ID = '1W6QdQtyJ3LkjYPedZzc0dczB_ecYLPdM2VKuS1bhMA4';

  useEffect(() => {
    // Fetch Leaders
    fetch(`/api/leaders?spreadsheetId=${SHEET_ID}`)
      .then(res => res.json())
      .then(data => setLeaders(data))
      .catch(err => console.error("Failed to load leaders:", err));

    // Fetch Players
    fetch(`/api/players?spreadsheetId=${SHEET_ID}`)
      .then(res => res.json())
      .then(data => setAvailablePlayers(data)) // [{id, name}, ...]
      .catch(err => console.error("Failed to load players:", err));
  }, []);

  // Save to local storage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ gameState, gameData }));
  }, [gameState, gameData]);


  // State history for Undo functionality
  const [pastStates, setPastStates] = useState([]);

  const startSetup = () => setGameState('setup');

  const handleSetupComplete = (players, trackActions = true) => {
    // Initialize players with 2 agents
    const playersWithAgents = players.map(p => ({
      ...p,
      agents: 2,
      swordmaster: false,
      revealed: false
    }));

    setGameData({
      players: playersWithAgents,
      round: 1,
      phase: 'Agent',
      history: []
    });

    // Choose mode
    setGameState(trackActions ? 'active' : 'holding');
    setPastStates([]); // Reset history on new game
  };

  const handleUndo = () => {
    if (pastStates.length === 0) return;

    const previousState = pastStates[pastStates.length - 1];
    setGameData(previousState);
    setPastStates(prev => prev.slice(0, -1));
  };

  const handleGameAction = (actionDetails) => {
    // 1. Save current state for Undo
    setPastStates(prev => [...prev, gameData]);

    let newPhase = gameData.phase;
    let newRound = gameData.round;

    // 2. Update history and decrement agents
    const updatedPlayers = gameData.players.map(p => {
      if (p.name === actionDetails.playerName) {
        // Handle Swordmaster
        if (actionDetails.action === 'Swordmaster') {
          if (p.swordmaster) return p; // prevent duplicate claim
          return { ...p, swordmaster: true, agents: p.agents }; // Net change 0 (uses agent but gains swordmaster which is essentially +1 cap, logic handled in round reset)
        }

        // Handle Reveal Turn
        if (actionDetails.action === 'Reveal Turn') {
          // FIX: Set agents to 0 immediately upon reveal
          return { ...p, revealed: true, agents: 0 };
        }

        // Decrement for standard actions (excluding Reveal Turn)
        return { ...p, agents: Math.max(0, p.agents - 1) };
      }
      return p;
    });

    // 3. Check for Round End Condition
    // Round advances if EVERYONE has revealed.
    const allRevealed = updatedPlayers.every(p => p.revealed);

    if (allRevealed) {
      newRound += 1;

      // Rotate First Player Token
      const currentFirstIndex = updatedPlayers.findIndex(p => p.isFirstPlayer);
      let nextFirstIndex = 0;
      if (currentFirstIndex !== -1) {
        nextFirstIndex = (currentFirstIndex + 1) % updatedPlayers.length;
      }

      // Reset agents, reveal status, AND update First Player status
      updatedPlayers.forEach((p, index) => {
        p.agents = p.swordmaster ? 3 : 2;
        p.revealed = false;
        p.isFirstPlayer = (index === nextFirstIndex); // Rotate token
      });
    }

    setGameData(prev => ({
      ...prev,
      players: updatedPlayers,
      round: newRound,
      phase: newPhase,
      history: [...prev.history, actionDetails]
    }));
  };

  // Transition to Scoring Phase
  const handleEndGame = () => {
    setGameState('scoring');
  };

  // Finalize (invoked by ScoringView)
  const handleFinalizeGame = async (collectedScores) => {
    // 1. Generate Timestamp for ID
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    // 2. Generate Clean Date for Display
    const displayDate = new Date().toISOString(); // Standard ISO for easy parsing

    // Save to Google Sheets
    // Hardcoded Sheet ID as requested
    const sheetId = '1W6QdQtyJ3LkjYPedZzc0dczB_ecYLPdM2VKuS1bhMA4';

    // 1. Gather Scores (Victory Points)
    // collectedScores is { playerId: scoreString }
    const playerScores = gameData.players.map(p => {
      const vp = collectedScores[p.id] || "0";
      return {
        ...p,
        vp
      };
    });

    // 2. Prepare Data Payloads

    // Lookup Helper: Find IDs for saving
    // p.name is the name string. p.leader is leader ID or name.
    // We want to save IDs. availablePlayers map has {id, name}.

    // Tab 1: Score Data
    const scoreHeaders = ['Game ID', 'Game Date', 'Player ID', 'Leader ID', 'Victory Points'];
    const scoreRows = playerScores.map(p => {
      const playerObj = availablePlayers.find(ap => ap.name === p.name);
      const playerId = playerObj ? playerObj.id : p.name; // Fallback to name if not found? Or p.id? p.id in gameData is internal 1,2,3,4.

      return [
        timestamp, // Game ID
        displayDate, // Game Date
        playerId,   // Player ID
        p.leader,   // Leader ID
        p.vp
      ];
    });

    // Tab 2: Log Data
    const logHeaders = ['Game ID', 'Game Date', 'Round', 'Player ID', 'Action', 'Timestamp'];
    const logRows = gameData.history.map(h => {
      const playerObj = availablePlayers.find(ap => ap.name === h.playerName);
      const playerId = playerObj ? playerObj.id : h.playerName;

      return [
        timestamp,
        displayDate,
        h.round,
        playerId,
        h.action,
        h.timestamp
      ];
    });

    // 3. Send to Backend (Scores are always saved, Logs only if tracked)
    try {
      const sheetResp = await fetch('/api/save-to-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: sheetId,
          scoreHeaders,
          scoreRows,
          logHeaders,
          logRows
        })
      });

      if (sheetResp.ok) {
        alert("Game Saved! Data appended to persistent Sheets.");
      } else {
        const errMsg = await sheetResp.text();
        alert("Failed to save to Sheet: " + errMsg);
      }
    } catch (error) {
      console.error('Error saving to sheet:', error);
      alert('Error connecting to server.');
    }

    // 2. Clear Storage and Reset
    localStorage.removeItem(STORAGE_KEY);
    setGameState('home');
    setGameData({
      players: [],
      round: 1,
      phase: 'Agent',
      history: []
    });
  };

  return (
    <>
      <div>
        <h1>DUNE: IMPERIUM <br /> TRACKER</h1>
      </div>

      {gameState === 'home' && (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
            Track your spice, influence, and victory.
          </p>
          <button className="btn-primary" onClick={startSetup}>
            New Game
          </button>

          <RecentGamesList leaders={leaders} availablePlayers={availablePlayers} />
        </div>
      )}

      {gameState === 'setup' && (
        <SetupWizard onComplete={handleSetupComplete} leaders={leaders} availablePlayers={availablePlayers} />
      )}

      {gameState === 'active' && (
        <GameDashboard
          gameData={gameData}
          onAction={handleGameAction}
          onEndGame={handleEndGame}
          onUndo={handleUndo}
          canUndo={pastStates.length > 0}
        />
      )}

      {gameState === 'holding' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '80vh',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '4rem',
            fontFamily: 'var(--font-heading)',
            color: '#fff',
            textShadow: '0 0 20px rgba(255,255,255,0.2)',
            marginBottom: '1rem'
          }}>
            GAME IN PROGRESS
          </h1>
          <p style={{ color: '#aaa', fontSize: '1.2rem', marginBottom: '4rem' }}>
            Tracking is disabled. Enjoy the spice flow.
          </p>

          <button
            onClick={handleEndGame}
            style={{
              padding: '1.5rem 3rem',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              backgroundColor: '#d00', // Red for End Game
              color: '#fff',
              border: '2px solid #f00',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(220, 0, 0, 0.3)'
            }}
          >
            End Game
          </button>
        </div>
      )}

      {gameState === 'scoring' && (
        <ScoringView
          players={gameData.players}
          onComplete={handleFinalizeGame}
          onCancel={() => setGameState('active')}
        />
      )}
    </>
  )
}

export default App
