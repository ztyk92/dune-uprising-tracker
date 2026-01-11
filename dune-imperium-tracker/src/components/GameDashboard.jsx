import { useState, useEffect } from 'react';
import ActionLog from './ActionLog';


export default function GameDashboard({ gameData, onAction, onEndGame, onUndo, canUndo }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Sync currentIndex with First Player when round changes or game loads
    useEffect(() => {
        const firstPlayerIndex = gameData.players.findIndex(p => p.isFirstPlayer);
        if (firstPlayerIndex !== -1) {
            setCurrentIndex(firstPlayerIndex);
        } else {
            setCurrentIndex(0);
        }
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
        // Rotate index BACKWARDS.
        // (current - 1 + length) % length
        // But only if we want to reverse turn order?
        // Yes, usually "Undo" means "Previous player made a mistake".
        if (gameData.players.length > 0) {
            setCurrentIndex((currentIndex - 1 + gameData.players.length) % gameData.players.length);
        }
    };


    const currentPlayer = gameData.players[currentIndex];

    // Safety check just in case persistence loaded index out of bounds or empty players
    if (!currentPlayer && gameData.players.length > 0) {
        setCurrentIndex(0);
        return null; // Re-render will fix
    }
    if (gameData.players.length === 0) return <div>Loading...</div>;

    const handleBtnClick = (actionName) => {
        // Validation: Cannot take map actions without agents
        if (actionName !== 'Reveal Turn' && currentPlayer.agents <= 0) {
            alert("You have no agents remaining!");
            return;
        }

        // Validation: Cannot do anything if already revealed (shouldn't happen with auto-skip, but for safety)
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
        // Calculate the NEXT index based on the CURRENT players array. 
        // *Important*: gameData.players in THIS render still has the OLD agent count.
        // However, we know we just used one.

        // We can't easily predict the next state of gameData.players inside here without duplication.
        // Instead, let's just do a naive rotation, and let the `useEffect` below fix it if we land on a 0-agent player?
        // Or just compute it here assuming decrement.

        // Simply rotate to the immediate next player
        let nextIndex = (currentIndex + 1) % gameData.players.length;
        setCurrentIndex(nextIndex);
    };

    const handlePass = () => {
        // Just rotate to next player without logging an action
        let nextIndex = (currentIndex + 1) % gameData.players.length;
        setCurrentIndex(nextIndex);
    };




    // Check if Esmar is in the game
    const isEsmarInGame = gameData.players.some(p => p.leader === 'esmar');

    const boardSections = [
        {
            title: 'Emperor',
            color: '#8B0000', // Dark Red
            // Emperor spaces verified: Dutiful Service, Sardaukar
            actions: ['Dutiful Service', 'Sardaukar']
        },
        {
            title: 'Spacing Guild',
            color: '#B22222', // FireBrick
            // Guild spaces verified: Deliver Supplies (was roughly "Shipping"), Heighliner. 
            // Note: "Interstellar Shipping" is arguably the card effect, but board space is "Deliver Supplies"? 
            // Subagent found "Deliver Supplies" and "Heighliner".
            // Let's use specific names found: Deliver Supplies, Heighliner.
            actions: ['Deliver Supplies', 'Heighliner']
        },
        {
            title: 'Bene Gesserit',
            color: '#4B0082', // Indigo
            // BG spaces verified: Secrets, Espionage.
            actions: ['Secrets', 'Espionage']
        },
        {
            title: 'Fremen',
            color: '#8B4513', // SaddleBrown
            actions: ['Fremkit', 'Desert Tactics']
        },
        {
            title: 'Landsraad',
            color: '#2F4F4F', // DarkSlateGray
            // Landsraad spaces verified: Assembly Hall, Gather Support, High Council, Imperial Privilege, Swordmaster.
            actions: ['Imperial Privilege', 'High Council', 'Gather Support', 'Assembly Hall', 'Swordmaster']
        },
        {
            title: 'CHOAM',
            color: '#DAA520', // GoldenRod
            // CHOAM Module spaces: Accept Contract, Shipping (requires Guild influence).
            // "Contracts" -> "Accept Contract"
            actions: ['Accept Contract', 'Shipping']
        },
        {
            title: 'City',
            color: '#808000', // Olive
            // Carthag REMOVED. Added Sietch Tabr (Reserved) and Spice Refinery.
            actions: ['Arrakeen', 'Sietch Tabr', 'Spice Refinery', 'Research Station']
        },
        {
            title: 'Desert',
            color: '#DEB887', // BurlyWood
            // Desert spaces: Imperial Basin, Hagga Basin, Deep Desert (replaces Great Flat).
            // Note: Great Flat is GONE. Deep Desert is new.
            actions: ['Imperial Basin', 'Hagga Basin', 'Deep Desert']
        }
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
                        <h1 style={{ fontSize: '2rem', margin: 0, color: 'var(--color-accent-gold)', lineHeight: '1.2' }}>{currentPlayer.name}</h1>
                        <p style={{ fontSize: '1rem', margin: 0, fontStyle: 'italic' }}>
                            {currentPlayer.leader}
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

                        {/* COMPACT BOARD GRID */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)', // 4 Columns for dense layout
                            gap: '0.6rem',
                            alignItems: 'start'
                        }}>
                            {boardSections.map((section) => (
                                <div key={section.title} style={{
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    padding: '0.5rem',
                                    borderRadius: '6px',
                                    borderTop: `3px solid ${section.color}`,
                                    height: '100%'
                                }}>
                                    <h4 style={{
                                        textAlign: 'center',
                                        color: section.color,
                                        marginBottom: '0.5rem',
                                        textTransform: 'uppercase',
                                        fontSize: '0.85rem',
                                        letterSpacing: '0.5px'
                                    }}>
                                        {section.title}
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
                    onClick={() => {
                        if (confirm('Are you sure you want to end the game?')) {
                            onEndGame();
                        }
                    }}
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
        </div>
    );
}
