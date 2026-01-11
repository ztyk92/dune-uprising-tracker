import { useState, useEffect } from 'react';

export default function SetupWizard({ onComplete, leaders, availablePlayers }) {
    const [step, setStep] = useState(1);
    const [draftLeaders, setDraftLeaders] = useState([]); // Array of 7 random leaders
    const [players, setPlayers] = useState([
        { id: 1, name: '', leader: '', isFirstPlayer: false },
        { id: 2, name: '', leader: '', isFirstPlayer: false },
        { id: 3, name: '', leader: '', isFirstPlayer: false },
        { id: 4, name: '', leader: '', isFirstPlayer: false },
    ]);


    const handlePlayerChange = (id, field, value) => {
        setPlayers(players.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleNameSelect = (name) => {
        // Is this name already taken?
        const isTaken = players.some(p => p.name === name);
        if (isTaken) {
            // Toggle off: find who has it and clear it
            const existingPlayerIndex = players.findIndex(p => p.name === name);
            if (existingPlayerIndex !== -1) {
                handlePlayerChange(players[existingPlayerIndex].id, 'name', '');
            }
            return;
        }

        // Find first empty slot
        const firstEmpty = players.find(p => p.name === '');
        if (firstEmpty) {
            handlePlayerChange(firstEmpty.id, 'name', name);
        }
    };

    const goToLeaders = () => {
        const activeInfo = players.filter(p => p.name.trim() !== '');
        if (activeInfo.length < 2) {
            alert("Need at least 2 players!");
            return;
        }

        if (!leaders || leaders.length === 0) {
            alert("Loading leaders... please wait.");
            return;
        }

        // Randomly select 7 leaders for the draft
        const shuffled = [...leaders].sort(() => 0.5 - Math.random());
        setDraftLeaders(shuffled.slice(0, 7));

        setStep(2);
    };

    // ... (rest of component) ...

    const renderNameSelection = () => (
        <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'var(--color-accent-gold)', marginBottom: '1rem' }}>Select Players</h2>
            <p style={{ marginBottom: '2rem', color: '#aaa' }}>Select who is playing today.</p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                {availablePlayers.map(pObj => {
                    const name = pObj.name;
                    const isSelected = players.some(p => p.name === name);
                    return (
                        <button
                            key={pObj.id}
                            onClick={() => handleNameSelect(name)}
                            style={{
                                padding: '1rem',
                                fontSize: '1rem',
                                backgroundColor: isSelected ? 'var(--color-accent-gold)' : '#333',
                                color: isSelected ? '#000' : '#fff',
                                border: isSelected ? '2px solid #fff' : '1px solid #555',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontFamily: 'var(--font-heading)',
                                opacity: isSelected ? 1 : 0.8
                            }}
                        >
                            {name}
                        </button>
                    )
                })}
            </div>
        </div>
    );


    const handleLeaderSelect = (leaderId) => {
        // Is this leader already assigned?
        const assignedPlayer = players.find(p => p.leader === leaderId);

        if (assignedPlayer) {
            // Unassign (toggle off)
            handlePlayerChange(assignedPlayer.id, 'leader', '');
            return;
        }

        // Assign to first active player without a leader
        const activePlayersList = players.filter(p => p.name.trim() !== '');
        const playerNeedingLeader = activePlayersList.find(p => !p.leader);

        if (playerNeedingLeader) {
            handlePlayerChange(playerNeedingLeader.id, 'leader', leaderId);
        }
    };

    const setFirstPlayer = (playerId) => {
        setPlayers(players.map(p => ({
            ...p,
            isFirstPlayer: p.id === parseInt(playerId)
        })));
    };

    const activePlayers = players.filter(p => p.name.trim() !== '');
    const selectedFirstPlayerId = players.find(p => p.isFirstPlayer)?.id || '';

    const finishSetup = () => {
        if (activePlayers.length < 2) {
            alert("Need at least 2 players!");
            return;
        }
        // Check if all active players have a leader
        const missingLeader = activePlayers.some(p => !p.leader);
        if (missingLeader) {
            alert("Every player needs a leader!");
            return;
        }

        if (!players.some(p => p.isFirstPlayer)) {
            alert("Please select a First Player!");
            return;
        }

        onComplete(activePlayers);
    };

    return (
        <div className="card" style={{ textAlign: 'left', maxWidth: '600px', margin: '2rem auto' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Game Setup</h2>

            {step === 1 && (
                <div>
                    <h3>Step 1: Who is playing?</h3>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                        Tap names to join the game (Player 1 to 4).
                    </p>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1rem',
                        marginBottom: '2rem'
                    }}>
                        {availablePlayers.map(pObj => {
                            const name = pObj.name;
                            // allocated to which player?
                            const allocatedPlayer = players.find(p => p.name === name);
                            const isSelected = !!allocatedPlayer;

                            return (
                                <button
                                    key={pObj.id}
                                    onClick={() => handleNameSelect(name)}
                                    style={{
                                        padding: '1.5rem',
                                        fontSize: '1.2rem',
                                        backgroundColor: isSelected ? 'var(--color-accent-gold)' : '#333',
                                        color: isSelected ? '#000' : '#fff',
                                        border: isSelected ? '2px solid #fff' : '1px solid #555',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontFamily: 'var(--font-heading)',
                                        opacity: (!isSelected && players.every(p => p.name !== '')) ? 0.5 : 1
                                    }}
                                    disabled={!isSelected && players.every(p => p.name !== '')}
                                >
                                    {name}
                                    {isSelected && (
                                        <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                                            (Player {allocatedPlayer.id})
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <div style={{ marginBottom: '1rem', fontStyle: 'italic', color: '#888' }}>
                            {activePlayers.length} players selected
                        </div>
                        <button
                            className="btn-primary"
                            onClick={goToLeaders}
                            disabled={activePlayers.length < 2}
                            style={{ opacity: activePlayers.length < 2 ? 0.5 : 1 }}
                        >
                            Next: Leaders
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div>
                    <h3>Step 2: Assign Leaders</h3>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                        Select a leader for each player (Draft Pool of 7).
                    </p>

                    {/* Leader Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1rem',
                        marginBottom: '2rem'
                    }}>
                        {draftLeaders.map(leader => {
                            const assignedPlayer = players.find(p => p.leader === leader.id);
                            const isSelected = !!assignedPlayer;
                            const isFullyAssigned = activePlayers.every(p => p.leader);

                            return (
                                <button
                                    key={leader.id}
                                    onClick={() => handleLeaderSelect(leader.id)}
                                    // Disable if not selected AND everyone already has a leader (unless we want to support swapping, but simple fill is better)
                                    // Actually, if everyone has a leader, we can't assign new ones. Toggle only.
                                    disabled={!isSelected && isFullyAssigned}
                                    style={{
                                        padding: '1rem',
                                        fontSize: '1rem',
                                        backgroundColor: isSelected ? 'var(--color-accent-gold)' : '#333',
                                        color: isSelected ? '#000' : '#fff',
                                        border: isSelected ? '2px solid #fff' : '1px solid #555',
                                        borderRadius: '8px',
                                        cursor: (!isSelected && isFullyAssigned) ? 'default' : 'pointer',
                                        fontWeight: 'bold',
                                        fontFamily: 'var(--font-heading)',
                                        opacity: (!isSelected && isFullyAssigned) ? 0.5 : 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: '100px'
                                    }}
                                >
                                    <span style={{ marginBottom: '0.5rem' }}>{leader.name}</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'normal', fontStyle: 'italic' }}>({leader.game})</span>
                                    {isSelected && (
                                        <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 'bold' }}>
                                            — {assignedPlayer.name} —
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid #333' }}>
                        <h3 style={{ color: 'var(--color-accent-gold)', marginBottom: '1rem', textAlign: 'center' }}>
                            Who goes first?
                        </h3>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '1rem',
                            marginBottom: '1rem'
                        }}>
                            {activePlayers.map(p => {
                                const isSelected = p.id === parseInt(selectedFirstPlayerId);
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => setFirstPlayer(p.id)}
                                        style={{
                                            padding: '1rem',
                                            fontSize: '1rem',
                                            backgroundColor: isSelected ? 'var(--color-accent-gold)' : '#333',
                                            color: isSelected ? '#000' : '#fff',
                                            border: isSelected ? '2px solid #fff' : '1px solid #555',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontFamily: 'var(--font-heading)',
                                            opacity: 1
                                        }}
                                    >
                                        {p.name}
                                        {isSelected && " (1st)"}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                        <button
                            onClick={() => setStep(1)}
                            style={{
                                padding: '0.8rem 1.5rem',
                                fontSize: '1rem',
                                backgroundColor: '#333',
                                color: '#fff',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Back
                        </button>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => {
                                    // Re-roll drafts? Just clear selection?
                                    // For simplicity, just clearing draft leaders
                                    const shuffled = [...leaders].sort(() => 0.5 - Math.random());
                                    setDraftLeaders(shuffled.slice(0, 7));
                                    setPlayers(players.map(p => ({ ...p, leader: '' })));
                                }}
                                style={{
                                    padding: '0.8rem 1.5rem',
                                    fontSize: '1rem',
                                    backgroundColor: '#444',
                                    color: '#fff',
                                    border: '1px solid #666',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Re-Roll Leaders
                            </button>

                            <button
                                onClick={() => {
                                    // Validate all have leaders
                                    const activePlayers = players.filter(p => p.name !== '');
                                    if (activePlayers.some(p => !p.leader)) {
                                        alert("All players must choose a leader!");
                                        return;
                                    }
                                    setStep(3); // Go to Mode Selection
                                }}
                                style={{
                                    padding: '0.8rem 1.5rem',
                                    fontSize: '1rem',
                                    backgroundColor: 'var(--color-accent-gold)',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s' }}>
                    <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent-gold)', marginBottom: '2rem' }}>
                        Select Game Mode
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                        <button
                            onClick={() => onComplete(players, true)} // Track Actions = True
                            style={{
                                padding: '2rem',
                                backgroundColor: '#222',
                                border: '2px solid var(--color-accent-gold)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1rem',
                                transition: 'transform 0.2s',
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-accent-gold)' }}>Track Actions</span>
                            <span style={{ fontSize: '0.9rem', color: '#aaa' }}>
                                Full dashboard. Track agents, board spaces, combat, and detailed game history.
                            </span>
                        </button>

                        <button
                            onClick={() => onComplete(players, false)} // Track Actions = False (Simple)
                            style={{
                                padding: '2rem',
                                backgroundColor: '#222',
                                border: '2px solid #666',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1rem',
                                transition: 'transform 0.2s',
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>Simple Mode</span>
                            <span style={{ fontSize: '0.9rem', color: '#aaa' }}>
                                Just play. App holds the state until you are ready to enter scores at the end.
                            </span>
                        </button>
                    </div>

                    <div style={{ marginTop: '3rem', textAlign: 'left' }}>
                        <button
                            onClick={() => setStep(2)}
                            style={{
                                padding: '0.8rem 1.5rem',
                                fontSize: '1rem',
                                backgroundColor: '#333',
                                color: '#fff',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Back
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
