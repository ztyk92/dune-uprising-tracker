import { useState, useEffect } from 'react';
import ActionLog from './ActionLog';
import ConfirmationModal from './ConfirmationModal';


export default function GameDashboard({ gameData, onAction, onEndGame, onUndo, canUndo }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);

    // Sync currentIndex with First Player when round changes or game loads
    useEffect(() => {
        const firstPlayerIndex = gameData.players.findIndex(p => p.isFirstPlayer);
        if (firstPlayerIndex !== -1) {
            setTimeout(() => setCurrentIndex(firstPlayerIndex), 0);
        } else {
            setTimeout(() => setCurrentIndex(0), 0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameData.round, gameData.players.length]); // Only reset on round change or setup load


    // Effect to sync currentIndex with "who has ability to play" or "who is first player"
    // For now, simpler: Just ensure we point to a valid player.

    // Logic to SKIP players with 0 agents?
    // The user says "round should advance once the 2 agents are used up".
    // This implies if I have 0 agents, my turn is skipped until reset.

    // We need a way to find the "Next Eligible Player".
    // If everyone is 0, App.jsx resets them.
    // So we just need to ensure we don't land on someone with 0 agents if there are others with > 0.

    // Simple fix for "Undo" affecting current player index:
    // When generic undo happens, we might need to step back the index.
    // But since `onUndo` reverts `gameData`, `gameData` changes trigger re-render.
    // We might NOT automatically sync `currentIndex`.
    // Ideally, the "Undo" should also revert currentIndex? Or we just manually decrement?
    // Let's rely on standard rotation: Undo reverts gameData. The user might need to manually adjust if rotation is complex,
    // OR we just perform a naive "rotate back" if Undo is clicked.

    // For now, let's wrap onUndo to also decrement index properly.
    const handleUndoClick = () => {
        onUndo();
        // Rotate index BACKWARDS to find previous player who is NOT revealed.
        if (gameData.players.length > 0) {
            let prevIndex = (currentIndex - 1 + gameData.players.length) % gameData.players.length;
            // Note: If we just undid a Reveal, the current player WAS revealed but now is NOT.
            // But we don't have the NEW gameData yet. 
            // The safest is just a simple step back, or let the user adjust.
            // Given the complexity of predicting state after undo, a simple step back is usually best.
            setCurrentIndex(prevIndex);
        }
    };


    const activePlayersCount = gameData.players.length;
    let safeIndex = currentIndex;
    if (safeIndex >= activePlayersCount && activePlayersCount > 0) {
        safeIndex = 0;
    }
    const currentPlayer = gameData.players[safeIndex] || { name: 'Unknown', leader: '', agents: 0 };

    // Safety check just in case persistence loaded index out of bounds or empty players
    if (!currentPlayer && gameData.players.length > 0) {
        setCurrentIndex(0);
        return null; // Re-render will fix
    }
    if (gameData.players.length === 0) return <div>Loading...</div>;

    const findNextActivePlayer = (startIndex, direction = 1) => {
        const numPlayers = gameData.players.length;
        let nextIndex = startIndex;

        // Try all players once
        for (let i = 0; i < numPlayers; i++) {
            nextIndex = (nextIndex + direction + numPlayers) % numPlayers;
            const p = gameData.players[nextIndex];
            // Must have a name AND not be revealed
            if (p.name && p.name.trim() !== '' && !p.revealed) {
                return nextIndex;
            }
        }
        return nextIndex;
    };

    const handleBtnClick = (actionName) => {
        // Validation: Cannot take map actions without agents
        if (actionName !== 'Reveal Turn' && currentPlayer.agents <= 0) {
            alert("You have no agents remaining!");
            return;
        }

        // Validation: Cannot do anything if already revealed
        if (currentPlayer.revealed) {
            alert("You have already revealed for this round!");
            return;
        }

        // 1. Log action
        const actionDetails = {
            round: gameData.round,
            playerName: currentPlayer.name,
            action: actionName,
            timestamp: new Date().toISOString()
        };

        // Optimistic Update / Pass to parent
        onAction(actionDetails);

        // 2. Rotate to next player
        // If the action was "Reveal Turn", we SPECIFICALLY want to skip this player now.
        // Even for normal actions, we check who is next and NOT revealed.
        let nextIndex = findNextActivePlayer(currentIndex);
        setCurrentIndex(nextIndex);
    };

    const handlePass = () => {
        // Just rotate to next player without logging an action
        let nextIndex = findNextActivePlayer(currentIndex);
        setCurrentIndex(nextIndex);
    };




    // Check if Esmar is in the game
    const isEsmarInGame = gameData.players.some(p => p.leader === 'esmar');

    const boardSections = {
        'Emperor': {
            color: '#8B0000', // Dark Red
            actions: ['Sardaukar', 'Dutiful Service']
        },
        'Spacing Guild': {
            color: '#B22222', // FireBrick
            actions: ['Heighliner', 'Deliver Supplies']
        },
        'Bene Gesserit': {
            color: '#4B0082', // Indigo
            actions: ['Espionage', 'Secrets']
        },
        'Fremen': {
            color: '#8B4513', // SaddleBrown
            actions: ['Desert Tactics', 'Fremkit']
        },
        'Landsraad': {
            color: '#2F4F4F', // DarkSlateGray
            actions: ['High Council', 'Imperial Privilege', 'Swordmaster', 'Assembly Hall', 'Gather Support']
        },
        'CHOAM': {
            color: '#DAA520', // GoldenRod
            actions: ['Shipping', 'Accept Contract']
        },
        'City': {
            color: '#808000', // Olive
            actions: ['Arrakeen', 'Spice Refinery', 'Research Station', 'Sietch Tabr']
        },
        'Desert': {
            color: '#DEB887', // BurlyWood
            actions: ['Imperial Basin', 'Hagga Basin', 'Deep Desert']
        }
    };

    const columnsLayout = [
        ['Emperor', 'Spacing Guild', 'Bene Gesserit', 'Fremen'], // Column 1
        ['Landsraad', 'City'],                                   // Column 2
        ['CHOAM', 'Desert']                                      // Column 3
    ];

    // Conditional Sections/Actions
    const specialActions = [];
    if (isEsmarInGame) {
        specialActions.push({ label: "Tuek's Sietch", color: '#556B2F' }); // DarkOliveGreen
    }

    return (
        <div className="dashboard" style={{ paddingBottom: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Top Bar: Round & Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'min-content 1fr min-content',
                gap: '1rem',
                marginBottom: '0.5rem',
                alignItems: 'stretch'
            }}>
                {/* Round Counter - Large & Highlighted */}
                <div style={{
                    backgroundColor: gameData.round % 2 === 0 ? 'var(--color-accent-gold)' : '#000',
                    border: `4px solid ${gameData.round % 2 === 0 ? '#000' : 'var(--color-accent-gold)'}`,
                    color: gameData.round % 2 === 0 ? '#000' : 'var(--color-accent-gold)',
                    borderRadius: '8px',
                    padding: '0.5rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)',
                    minWidth: '120px',
                    transition: 'all 0.5s ease'
                }}>
                    <span style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Round</span>
                    <span style={{ fontSize: '3.5rem', lineHeight: '1', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>
                        {gameData.round}
                    </span>
                </div>

                {/* Active Player Banner - Compressed */}
                <div className="hero-player" style={{
                    padding: '0.5rem 1rem',
                    border: '2px solid var(--color-accent-gold)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                }}>
                    <div style={{ textAlign: 'left' }}>
                        <h2 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0 }}>CURRENT PLAYER</h2>
                        <h1 style={{ fontSize: '2rem', margin: 0, color: 'var(--color-accent-gold)', lineHeight: '1.2' }}>{currentPlayer.name || 'Anonymous'}</h1>
                        <p style={{ fontSize: '1rem', margin: 0, fontStyle: 'italic' }}>
                            {currentPlayer.leader || 'No Leader'}
                        </p>
                    </div>

                    <div style={{
                        textAlign: 'right',
                        borderLeft: '1px solid #555',
                        paddingLeft: '1rem'
                    }}>
                        <div style={{ fontSize: '0.9rem', color: '#888' }}>AGENTS</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: '1', color: currentPlayer.agents > 0 ? '#0f0' : '#f00' }}>
                            {currentPlayer.agents}
                        </div>
                    </div>
                </div>

                {/* Stats / Total Agents */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 1rem',
                    backgroundColor: '#222',
                    borderRadius: '8px',
                    border: '1px solid #444',
                    fontSize: '0.9rem',
                    color: '#aaa',
                    textAlign: 'center'
                }}>
                    <span>Total Agents: <strong style={{ color: '#fff' }}>{gameData.players.reduce((acc, p) => acc + p.agents, 0)}</strong></span>

                    {/* Undo Button */}
                    <button
                        onClick={handleUndoClick}
                        disabled={!canUndo}
                        style={{
                            marginTop: '0.5rem',
                            padding: '0.4rem 0.8rem',
                            backgroundColor: canUndo ? '#444' : '#222',
                            color: canUndo ? '#fff' : '#555',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            cursor: canUndo ? 'pointer' : 'default',
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            fontWeight: 'bold'
                        }}
                    >
                        ↩ Undo
                    </button>
                </div>
            </div>


            {currentPlayer.revealed ? (
                <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                    <h3 style={{ color: 'var(--color-accent-gold)', marginBottom: '1rem' }}>YOU HAVE REVEALED</h3>
                    <button
                        onClick={handlePass}
                        style={{
                            backgroundColor: '#444',
                            color: '#fff',
                            fontSize: '2rem',
                            padding: '2rem 4rem',
                            fontWeight: 'bold',
                            border: '2px solid #666',
                            borderRadius: '8px',
                            fontFamily: 'var(--font-heading)',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                        }}
                    >
                        PASS TURN
                    </button>
                </div>
            ) : (
                <>
                    {currentPlayer.agents === 0 && (
                        <div style={{ color: '#ff6b6b', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                            ⚠️ No agents left! (Click Reveal)
                        </div>
                    )}

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.8rem' // Tighter gap
                    }}>

                        {/* Special Actions Row */}
                        {specialActions.length > 0 && (
                            <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                                {specialActions.map(act => (
                                    <button
                                        key={act.label}
                                        onClick={() => handleBtnClick(act.label)}
                                        disabled={currentPlayer.agents <= 0}
                                        style={{
                                            backgroundColor: act.color,
                                            color: '#fff',
                                            fontSize: '1.2rem',
                                            padding: '0.8rem',
                                            fontWeight: 'bold',
                                            border: '2px solid #FFD700',
                                            borderRadius: '6px',
                                            fontFamily: 'var(--font-heading)',
                                            textTransform: 'uppercase',
                                            cursor: currentPlayer.agents > 0 ? 'pointer' : 'not-allowed',
                                            opacity: currentPlayer.agents > 0 ? 1 : 0.5
                                        }}
                                    >
                                        {act.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* 3-COLUMN BOARD GRID */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '0.6rem',
                            alignItems: 'start'
                        }}>
                            {columnsLayout.map((column, colIndex) => (
                                <div key={colIndex} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {column.map(sectionTitle => {
                                        const section = boardSections[sectionTitle];
                                        return (
                                            <div key={sectionTitle} style={{
                                                backgroundColor: 'rgba(255,255,255,0.03)',
                                                padding: '0.5rem',
                                                borderRadius: '6px',
                                                borderTop: `3px solid ${section.color}`,
                                            }}>
                                                <h4 style={{
                                                    textAlign: 'center',
                                                    color: section.color,
                                                    marginBottom: '0.5rem',
                                                    textTransform: 'uppercase',
                                                    fontSize: '0.85rem',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {sectionTitle}
                                                </h4>
                                                <div style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.4rem'
                                                }}>
                                                    {section.actions.map(label => (
                                                        <button
                                                            key={label}
                                                            onClick={() => handleBtnClick(label)}
                                                            disabled={
                                                                currentPlayer.agents <= 0 ||
                                                                (label === 'Swordmaster' && currentPlayer.swordmaster)
                                                            }
                                                            style={{
                                                                backgroundColor: section.color,
                                                                color: '#fff',
                                                                padding: '0.6rem 0.2rem',
                                                                fontSize: '0.9rem',
                                                                fontWeight: '600',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                fontFamily: 'var(--font-heading)',
                                                                textTransform: 'uppercase',
                                                                cursor: (currentPlayer.agents > 0 && !(label === 'Swordmaster' && currentPlayer.swordmaster)) ? 'pointer' : 'not-allowed',
                                                                opacity: (currentPlayer.agents > 0 && !(label === 'Swordmaster' && currentPlayer.swordmaster)) ? 0.95 : 0.4,
                                                                transition: 'filter 0.1s',
                                                                whiteSpace: 'normal',
                                                                lineHeight: '1.1',
                                                                minHeight: '40px'
                                                            }}
                                                        >
                                                            {label}
                                                            {label === 'Swordmaster' && currentPlayer.swordmaster && <span style={{ display: 'block', fontSize: '0.7rem' }}>(Claimed)</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        {/* REVEAL BUTTON - Large but not too tall */}
                        <button
                            onClick={() => handleBtnClick('Reveal Turn')}
                            style={{
                                backgroundColor: '#006400', // DarkGreen
                                color: '#fff',
                                fontSize: '1.5rem',
                                padding: '1rem',
                                marginTop: '0.5rem',
                                fontWeight: 'bold',
                                border: 'none',
                                borderRadius: '8px',
                                fontFamily: 'var(--font-heading)',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                width: '100%',
                                letterSpacing: '2px'
                            }}
                        >
                            REVEAL TURN
                        </button>

                    </div>
                </>
            )}

            <ActionLog history={gameData.history} />

            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #333', paddingTop: '1rem', textAlign: 'center' }}>
                <button
                    onClick={() => setShowEndGameConfirm(true)}
                    style={{
                        backgroundColor: 'transparent',
                        color: '#666',
                        padding: '0.5rem 1rem',
                        fontSize: '0.8rem',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    End Game
                </button>
            </div>

            <ConfirmationModal
                isOpen={showEndGameConfirm}
                title="End Game?"
                message="Are you sure you want to end the game and proceed to scoring? This will conclude the current session."
                confirmText="End Game"
                isDanger={true}
                onConfirm={() => {
                    setShowEndGameConfirm(false);
                    onEndGame();
                }}
                onCancel={() => setShowEndGameConfirm(false)}
            />
        </div>
    );
}
