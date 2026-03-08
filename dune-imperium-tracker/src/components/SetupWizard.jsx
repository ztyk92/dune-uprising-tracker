import { useState } from 'react';

export default function SetupWizard({ onComplete, leaders, availablePlayers }) {
    const [step, setStep] = useState(1);
    const [draftLeaders, setDraftLeaders] = useState([]);
    const [players, setPlayers] = useState([
        { id: 1, name: '', leader: '', isFirstPlayer: false, colour: '' },
        { id: 2, name: '', leader: '', isFirstPlayer: false, colour: '' },
        { id: 3, name: '', leader: '', isFirstPlayer: false, colour: '' },
        { id: 4, name: '', leader: '', isFirstPlayer: false, colour: '' },
    ]);

    const PLAYER_COLOURS = [
        { name: 'Red', hex: '#c0392b', border: '#e74c3c', text: '#fff' },
        { name: 'Blue', hex: '#2471a3', border: '#5dade2', text: '#fff' },
        { name: 'Green', hex: '#1e8449', border: '#52be80', text: '#fff' },
        { name: 'Yellow', hex: '#b7950b', border: '#f4d03f', text: '#fff' },
    ];

    // Index of the next player waiting to be assigned a colour
    const colourAssignIndex = players.filter(p => p.name.trim() !== '' && p.colour !== '').length;

    const activePlayers = players.filter(p => p.name && p.name.trim() !== '');

    const handlePlayerChange = (id, field, value) => {
        setPlayers(players.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleNameSelect = (name) => {
        const isTaken = players.some(p => p.name === name);
        if (isTaken) {
            const existingPlayerIndex = players.findIndex(p => p.name === name);
            if (existingPlayerIndex !== -1) {
                handlePlayerChange(players[existingPlayerIndex].id, 'name', '');
            }
            return;
        }
        const firstEmpty = players.find(p => p.name === '');
        if (firstEmpty) {
            handlePlayerChange(firstEmpty.id, 'name', name);
        }
    };

    const goToColours = () => {
        const activeInfo = players.filter(p => p.name.trim() !== '');
        if (activeInfo.length < 2) {
            alert("Need at least 2 players!");
            return;
        }
        // Reset any previously assigned colours when going back to this step
        setPlayers(players.map(p => ({ ...p, colour: '' })));
        setStep(2);
    };

    const goToLeaders = () => {
        if (!leaders || leaders.length === 0) {
            alert("Loading leaders... please wait.");
            return;
        }
        const shuffled = [...leaders].sort(() => 0.5 - Math.random());
        setDraftLeaders(shuffled.slice(0, 7));
        setStep(3);
    };

    const handleColourSelect = (colourName) => {
        const activePlayers = players.filter(p => p.name.trim() !== '');
        // Guard: colour already taken
        if (activePlayers.some(p => p.colour === colourName)) return;
        // Guard: all players already have a colour
        if (colourAssignIndex >= activePlayers.length) return;
        const targetPlayer = activePlayers[colourAssignIndex];
        handlePlayerChange(targetPlayer.id, 'colour', colourName);
    };

    const resetColours = () => {
        setPlayers(players.map(p => ({ ...p, colour: '' })));
    };

    const handleLeaderSelect = (leaderId) => {
        const assignedPlayer = players.find(p => p.leader === leaderId);
        if (assignedPlayer) {
            handlePlayerChange(assignedPlayer.id, 'leader', '');
            return;
        }
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

    const selectedFirstPlayerId = players.find(p => p.isFirstPlayer)?.id || '';
    const firstPlayerSelected = players.some(p => p.isFirstPlayer);

    const handleStartGame = () => {
        if (activePlayers.some(p => !p.leader)) {
            alert("All players must choose a leader!");
            return;
        }
        if (!firstPlayerSelected) {
            alert("Please select who goes first!");
            return;
        }
        onComplete(activePlayers, false, true);
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
                            onClick={goToColours}
                            disabled={activePlayers.length < 2}
                            style={{ opacity: activePlayers.length < 2 ? 0.5 : 1 }}
                        >
                            Next: Choose Colours
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (() => {
                const allColoursAssigned = activePlayers.length > 0 && activePlayers.every(p => p.colour !== '');
                return (
                    <div>
                        <h3>Step 2: Choose Player Colours</h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                            Each click assigns the next player's colour. Colours cannot be shared.
                        </p>

                        {/* Assignment progress */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            {activePlayers.map((p, idx) => (
                                <div key={p.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    marginBottom: '0.5rem',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '6px',
                                    background: '#222',
                                    border: '1px solid #333'
                                }}>
                                    <span style={{ fontWeight: 'bold', minWidth: '80px' }}>{p.name}</span>
                                    {p.colour ? (
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '0.2rem 0.75rem',
                                            borderRadius: '4px',
                                            backgroundColor: PLAYER_COLOURS.find(c => c.name === p.colour)?.hex || '#555',
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            fontSize: '0.9rem'
                                        }}>{p.colour}</span>
                                    ) : (
                                        <span style={{ color: '#666', fontStyle: 'italic', fontSize: '0.9rem' }}>
                                            {idx === colourAssignIndex ? '← pick a colour' : 'waiting...'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Colour buttons */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '1rem',
                            marginBottom: '1.5rem'
                        }}>
                            {PLAYER_COLOURS.map(colour => {
                                const isTaken = activePlayers.some(p => p.colour === colour.name);
                                const takenBy = activePlayers.find(p => p.colour === colour.name);
                                const isDisabled = isTaken || allColoursAssigned;
                                return (
                                    <button
                                        key={colour.name}
                                        onClick={() => handleColourSelect(colour.name)}
                                        disabled={isDisabled}
                                        style={{
                                            padding: '1.5rem',
                                            fontSize: '1.3rem',
                                            fontWeight: 'bold',
                                            fontFamily: 'var(--font-heading)',
                                            backgroundColor: isTaken ? '#2a2a2a' : colour.hex,
                                            color: isTaken ? '#555' : colour.text,
                                            border: isTaken
                                                ? `2px solid #444`
                                                : `2px solid ${colour.border}`,
                                            borderRadius: '10px',
                                            cursor: isDisabled ? 'default' : 'pointer',
                                            opacity: isDisabled ? 0.45 : 1,
                                            transition: 'transform 0.1s, opacity 0.2s',
                                            boxShadow: isTaken ? 'none' : `0 4px 15px ${colour.hex}55`,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.3rem'
                                        }}
                                    >
                                        {colour.name}
                                        {takenBy && (
                                            <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>
                                                ({takenBy.name})
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                                    onClick={resetColours}
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
                                    Reset
                                </button>
                                <button
                                    onClick={goToLeaders}
                                    disabled={!allColoursAssigned}
                                    style={{
                                        padding: '0.8rem 1.5rem',
                                        fontSize: '1rem',
                                        backgroundColor: allColoursAssigned ? 'var(--color-accent-gold)' : '#555',
                                        color: allColoursAssigned ? '#000' : '#999',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: allColoursAssigned ? 'pointer' : 'not-allowed',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Next: Leaders →
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {step === 3 && (
                <div>
                    <h3>Step 3: Assign Leaders</h3>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                        Select a leader for each player (Draft Pool of 7).
                    </p>

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
                        <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>
                            <span style={{ color: 'var(--color-accent-gold)' }}>Who goes first?</span>
                            {' '}
                            <span style={{ color: '#e55', fontSize: '0.85rem' }}>* required</span>
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
                                            backgroundColor: isSelected ? '#c0392b' : '#333',
                                            color: '#fff',
                                            border: isSelected ? '2px solid #e74c3c' : '1px solid #555',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontFamily: 'var(--font-heading)',
                                        }}
                                    >
                                        {p.name}
                                        {isSelected && ' 🥇'}
                                    </button>
                                );
                            })}
                        </div>

                        {!firstPlayerSelected && (
                            <p style={{ color: '#e55', fontSize: '0.85rem', textAlign: 'center', marginTop: '0.5rem' }}>
                                ⚠ Select who goes first before starting
                            </p>
                        )}
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
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
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => {
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
                                onClick={handleStartGame}
                                disabled={!firstPlayerSelected}
                                style={{
                                    padding: '0.8rem 1.5rem',
                                    fontSize: '1rem',
                                    backgroundColor: firstPlayerSelected ? 'var(--color-accent-gold)' : '#555',
                                    color: firstPlayerSelected ? '#000' : '#999',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: firstPlayerSelected ? 'pointer' : 'not-allowed',
                                    fontWeight: 'bold'
                                }}
                            >
                                Start Game
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{
                position: 'fixed',
                bottom: '5px',
                right: '5px',
                fontSize: '0.7rem',
                color: '#444',
                pointerEvents: 'none'
            }}>
                v1.4-FIRST-PLAYER-REQUIRED
            </div>
        </div>
    );
}
