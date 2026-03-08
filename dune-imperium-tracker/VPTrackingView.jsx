import { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';

export default function VPTrackingView({ players, round = 1, vpActions, onAction, onRoundChange, onUndo, onEndGame }) {
    const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
    const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);

    // Ensure we have a valid index if players array changes
    const activePlayers = players.filter(p => p.name && p.name.trim() !== '');

    useEffect(() => {
        if (selectedPlayerIndex >= activePlayers.length && activePlayers.length > 0) {
            setSelectedPlayerIndex(0);
        }
    }, [activePlayers.length]);

    const activePlayer = activePlayers[selectedPlayerIndex];

    const handlePlayerClick = (index) => {
        setSelectedPlayerIndex(index);
    };

    const handleActionClick = (action) => {
        if (!activePlayer) return;

        onAction({
            timestamp: new Date().toISOString(),
            playerName: activePlayer.name,
            action: 'VP_ADJUST', // Marker for history
            details: {
                category: action.category,
                actionName: action.action,
                points: action.points
            }
        });
    };

    if (!activePlayer) return <div>Loading players...</div>;

    // Group actions by category for cleaner UI
    const actionsByCategory = vpActions.reduce((acc, act) => {
        if (!acc[act.category]) acc[act.category] = [];
        acc[act.category].push(act);
        return acc;
    }, {});

    // --- Score Track ---
    const COLOUR_MAP = {
        'Red': { bg: '#c0392b', glow: '#e74c3c' },
        'Blue': { bg: '#2471a3', glow: '#5dade2' },
        'Green': { bg: '#1e8449', glow: '#52be80' },
        'Yellow': { bg: '#b7950b', glow: '#f4d03f' },
    };
    const TRACK_SPACES = 12; // spaces 0–11
    const startPos = activePlayers.length === 3 ? 1 : 0;

    return (
        <>
            {/* Fixed vertical score track on the far right */}
            <div style={{
                position: 'fixed',
                right: '0',
                top: '0',
                bottom: '0',
                width: '52px',
                backgroundColor: '#111',
                borderLeft: '1px solid #2a2a2a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '6px',
                paddingBottom: '6px',
                zIndex: 200,
            }}>
                {/* Track spaces from top (high VP) to bottom (low VP): render 11 down to 0 */}
                {Array.from({ length: TRACK_SPACES }, (_, i) => TRACK_SPACES - 1 - i).map(space => {
                    // Players whose current VP + startPos matches this space
                    const playersHere = activePlayers.filter(p => {
                        const effectiveVp = (p.vp || 0) + startPos;
                        return effectiveVp === space;
                    });
                    return (
                        <div key={space} style={{
                            width: '100%',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderBottom: space > 0 ? '1px solid #222' : 'none',
                            position: 'relative',
                            gap: '2px',
                        }}>
                            {/* Space number */}
                            <span style={{
                                fontSize: '0.55rem',
                                color: '#444',
                                lineHeight: 1,
                                userSelect: 'none',
                                position: 'absolute',
                                top: '2px',
                                left: '3px',
                            }}>{space}</span>
                            {/* Coloured cylinders for players at this space */}
                            {playersHere.map(p => {
                                const col = COLOUR_MAP[p.colour] || { bg: '#888', glow: '#aaa' };
                                return (
                                    <div key={p.name} title={`${p.name}: ${p.vp || 0} VP`} style={{
                                        width: '28px',
                                        height: '16px',
                                        borderRadius: '50% / 40%',
                                        backgroundColor: col.bg,
                                        boxShadow: `0 0 6px ${col.glow}88, inset 0 2px 4px rgba(255,255,255,0.2)`,
                                        border: `1px solid ${col.glow}`,
                                        flexShrink: 0,
                                    }} />
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '2rem', paddingRight: '60px' }}>

                {/* Top Section: Round Control & Players */}
                <div style={{
                    position: 'sticky',
                    top: '0',
                    zIndex: 100,
                    backgroundColor: '#111',
                    paddingTop: '0.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #333'
                }}>
                    {/* Round Counter */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        marginBottom: '1rem',
                        backgroundColor: '#1a1a1a',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        border: '1px solid #333',
                        width: 'fit-content',
                        margin: '0 auto 1rem auto'
                    }}>
                        <button
                            onClick={() => onRoundChange && onRoundChange(Math.max(1, round - 1))}
                            style={{
                                background: '#333', border: '1px solid #444', color: '#fff',
                                width: '30px', height: '30px', borderRadius: '4px', cursor: 'pointer'
                            }}
                        >
                            -
                        </button>
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', minWidth: '80px', textAlign: 'center' }}>
                            ROUND {round}
                        </span>
                        {/* Next Round button — 300% larger, gold circle */}
                        <button
                            onClick={() => onRoundChange && onRoundChange(round + 1)}
                            style={{
                                background: 'var(--color-accent-gold)',
                                border: '2px solid #fff',
                                color: '#000',
                                width: '90px',
                                height: '90px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 0 20px rgba(212,175,55,0.5)',
                                transition: 'transform 0.1s, box-shadow 0.1s',
                                flexShrink: 0,
                            }}
                            onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(212,175,55,0.8)'; }}
                            onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(212,175,55,0.5)'; }}
                        >
                            +
                        </button>
                    </div>

                    {/* Players Scroll Row */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${activePlayers.length}, 1fr)`,
                        gap: '0.5rem',
                    }}>
                        {activePlayers.map((p, idx) => (
                            <button
                                key={p.name}
                                onClick={() => handlePlayerClick(idx)}
                                style={{
                                    backgroundColor: idx === selectedPlayerIndex ? 'var(--color-accent-gold)' : '#222',
                                    color: idx === selectedPlayerIndex ? '#000' : '#888',
                                    border: idx === selectedPlayerIndex ? '2px solid #fff' : '1px solid #444',
                                    borderRadius: '6px',
                                    padding: '0.5rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.1rem',
                                    transition: 'all 0.1s',
                                    transform: idx === selectedPlayerIndex ? 'translateY(-2px)' : 'none'
                                }}
                            >
                                <span style={{ fontWeight: 'bold', fontSize: '0.8rem', lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{p.name}</span>
                                <div style={{
                                    fontSize: '1.4rem',
                                    fontWeight: 'bold',
                                    fontFamily: 'var(--font-heading)',
                                }}>
                                    {p.vp || 0}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions Grid */}
                <div style={{ columnWidth: '18rem', columnGap: '1rem', marginTop: '1rem' }}>
                    <div style={{ textAlign: 'center', color: '#666', fontSize: '0.8rem', columnSpan: 'all', marginBottom: '1rem' }}>
                        Adding VP to <strong style={{ color: 'var(--color-accent-gold)' }}>{activePlayer.name}</strong>
                    </div>

                    {Object.entries(actionsByCategory).map(([category, actions]) => (
                        <div key={category} style={{
                            breakInside: 'avoid',
                            marginBottom: '1rem',
                            breakBefore: actions.length > 4 ? 'column' : 'auto',
                            // Ensure it behaves as a block in columns
                            display: 'inline-block',
                            width: '100%'
                        }}>
                            <h3 style={{
                                color: 'var(--color-text-muted)',
                                textTransform: 'uppercase',
                                fontSize: '0.8rem',
                                borderBottom: '1px solid #333',
                                paddingBottom: '0.2rem',
                                marginBottom: '0.5rem',
                                marginTop: '0.5rem'
                            }}>
                                {category}
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                gap: '0.5rem'
                            }}>
                                {actions.map((act, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleActionClick(act)}
                                        style={{
                                            backgroundColor: '#2a2a2a',
                                            border: '1px solid #444',
                                            borderRadius: '6px',
                                            padding: '0.6rem 0.2rem',
                                            color: '#ddd',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column', // Vertical layout
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                            transition: 'background-color 0.1s',
                                            minHeight: '80px'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                                    >
                                        <span style={{
                                            textAlign: 'center',
                                            textTransform: 'capitalize',
                                            fontSize: '0.8rem',
                                            lineHeight: '1.1'
                                        }}>
                                            {act.action}
                                        </span>
                                        <span style={{
                                            color: act.points >= 0 ? 'var(--color-accent-gold)' : '#d44',
                                            fontWeight: 'bold',
                                            fontSize: '1.1rem'
                                        }}>
                                            {act.points >= 0 ? `+${act.points}` : act.points}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Actions */}
                <div style={{ marginTop: '2rem', borderTop: '1px solid #333', paddingTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button
                        onClick={onUndo}
                        style={{
                            backgroundColor: '#333',
                            color: '#aaa',
                            border: '1px solid #555',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        Undo
                    </button>
                    <button
                        onClick={() => setShowEndGameConfirm(true)}
                        style={{
                            backgroundColor: 'transparent',
                            color: '#d44',
                            border: '1px solid #d44',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        End Game
                    </button>
                </div>

                <ConfirmationModal
                    isOpen={showEndGameConfirm}
                    title="End Game?"
                    message="Proceed to scoring?"
                    confirmText="End Game"
                    isDanger={true}
                    onConfirm={() => {
                        setShowEndGameConfirm(false);
                        onEndGame();
                    }}
                    onCancel={() => setShowEndGameConfirm(false)}
                />
            </div>
        </>
    );
}
