import { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';

export default function VPTrackingView({ players, alliances, round = 1, vpActions, onAction, onRoundChange, onUndo, onEndGame }) {
    const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
    const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);
    const [flashedKey, setFlashedKey] = useState(null);

    // Ensure we have a valid index if players array changes
    const activePlayers = players.filter(p => p.name && p.name.trim() !== '');

    useEffect(() => {
        if (selectedPlayerIndex >= activePlayers.length && activePlayers.length > 0) {
            setTimeout(() => setSelectedPlayerIndex(0), 0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePlayers.length]);

    const activePlayer = activePlayers[selectedPlayerIndex];

    const handlePlayerClick = (index) => {
        setSelectedPlayerIndex(index);
    };

    const handleActionClick = (action, key) => {
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

        // Flash feedback
        setFlashedKey(key);
        setTimeout(() => setFlashedKey(null), 350);
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
    const TRACK_SPACES = 15; // spaces 0–14
    const startPos = activePlayers.length === 4 ? 1 : 0;

    return (
        <>
            {/* Fixed vertical score track on the far left */}
            <div style={{
                position: 'fixed',
                left: '0',
                top: '0',
                bottom: '0',
                width: '70px',
                backgroundColor: '#111',
                borderRight: '2px solid #333',
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
                    const playersHere = activePlayers.filter(p => {
                        const effectiveVp = (p.vp || 0) + startPos;
                        return effectiveVp === space;
                    });
                    const isGolden = space >= 10 && space <= 14;
                    return (
                        <div key={space} style={{
                            width: '100%',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isGolden ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                            borderBottom: space > 0 ? (space >= 10 && space < 14 ? '2px solid rgba(212, 175, 55, 0.4)' : '2px solid #555') : 'none',
                            boxShadow: isGolden ? 'inset 0 0 10px rgba(212, 175, 55, 0.05)' : 'none',
                            position: 'relative',
                            gap: '2px',
                            overflow: 'hidden',
                        }}>
                            <span style={{
                                fontSize: '3.5rem',
                                fontWeight: 'bold',
                                color: isGolden ? 'rgba(212, 175, 55, 0.4)' : 'rgba(255, 255, 255, 0.15)',
                                textShadow: isGolden ? '0 0 5px rgba(212, 175, 55, 0.5)' : 'none',
                                lineHeight: 1,
                                userSelect: 'none',
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 0,
                            }}>{space}</span>
                            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                {playersHere.map(p => {
                                    const col = COLOUR_MAP[p.colour] || { bg: '#888', glow: '#aaa' };
                                    return (
                                        <div key={p.name} title={`${p.name}: ${p.vp || 0} VP`} style={{
                                            width: '56px',
                                            height: '28px',
                                            borderRadius: '50% / 40%',
                                            backgroundColor: col.bg,
                                            boxShadow: `0 0 8px ${col.glow}aa, inset 0 3px 6px rgba(255,255,255,0.3)`,
                                            border: `2px solid ${col.glow}`,
                                            flexShrink: 0,
                                        }} />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ padding: '1rem', paddingLeft: '80px', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto', boxSizing: 'border-box' }}>
                {/* Round Number module */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#1a1a1a',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', color: 'var(--color-accent-gold)' }}>
                        ROUND {round}
                    </span>
                </div>

                {/* Alliance Tracker module + Upgrades combined in a responsive grid */}
                <div style={{
                     display: 'grid',
                     gridTemplateColumns: 'repeat(auto-fit, minmax(76px, 1fr))',
                     gap: '0.5rem',
                     width: '100%'
                }}>
                    {/* Alliances */}
                    {['Emperor', 'Spacing Guild', 'Bene Gesserit', 'Fremen'].map(faction => {
                        const ownerName = alliances ? alliances[faction] : null;
                        const ownerIndex = activePlayers.findIndex(p => p.name === ownerName);
                        const ownerPlayer = ownerIndex !== -1 ? activePlayers[ownerIndex] : null;
                        const col = ownerPlayer ? (COLOUR_MAP[ownerPlayer.colour] || { bg: '#888', glow: '#aaa' }) : null;

                        return (
                            <div key={faction} style={{
                                backgroundColor: '#222',
                                border: '2px solid #444',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0 4px',
                                height: '44px',
                            }}>
                                <img
                                    src={`/assets/${encodeURIComponent(faction)}.png?v=3`}
                                    alt={faction}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        objectFit: 'contain',
                                        opacity: 0.5,
                                        borderRadius: '4px',
                                        flexShrink: 0
                                    }}
                                />
                                <div style={{ width: '26px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {col && (
                                        <div style={{
                                            width: '18px',
                                            height: '10px',
                                            borderRadius: '50% / 40%',
                                            backgroundColor: col.bg,
                                            boxShadow: `0 0 4px ${col.glow}88, inset 0 2px 2px rgba(255,255,255,0.2)`,
                                            border: `1px solid ${col.glow}`
                                        }} />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* Upgrades */}
                    {[
                        { id: 'High Council', type: 'boolean' },
                        { id: 'Swordmaster', type: 'boolean' },
                        { id: 'Sardaukar', type: 'tally' }
                    ].map(upgrade => {
                        const attainingPlayers = activePlayers.filter(p => {
                            if (upgrade.type === 'boolean') {
                                return upgrade.id === 'High Council' ? p.highCouncil : p.swordmaster;
                            } else {
                                return p.sardaukar > 0;
                            }
                        });

                        return (
                            <div key={upgrade.id} style={{
                                backgroundColor: '#222',
                                border: '2px solid #444',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0 4px',
                                height: '44px',
                            }}>
                                {/* Render discs for attaining players on the left */}
                                <div style={{ width: '30px', display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                                    {attainingPlayers.map(p => {
                                        const col = COLOUR_MAP[p.colour] || { bg: '#888', glow: '#aaa' };
                                        return (
                                            <div key={p.name} style={{
                                                width: upgrade.type === 'tally' ? '14px' : '18px',
                                                height: upgrade.type === 'tally' ? '14px' : '10px',
                                                borderRadius: upgrade.type === 'tally' ? '50%' : '50% / 40%',
                                                backgroundColor: col.bg,
                                                boxShadow: `0 0 4px ${col.glow}88, inset 0 2px 2px rgba(255,255,255,0.2)`,
                                                border: `1px solid ${col.glow}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.6rem',
                                                fontWeight: 'bold',
                                                color: '#fff',
                                                lineHeight: 1
                                            }}>
                                                {upgrade.type === 'tally' && p.sardaukar}
                                            </div>
                                        );
                                    })}
                                </div>
                                <img
                                    src={`/assets/${encodeURIComponent(upgrade.id)}.png?v=3`}
                                    alt={upgrade.id}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        objectFit: 'contain',
                                        opacity: 0.5,
                                        borderRadius: '4px',
                                        flexShrink: 0
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Players Selection Module */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(auto-fit, minmax(60px, 1fr))`,
                    gap: '0.5rem',
                    width: '100%',
                }}>
                    {activePlayers.map((p, idx) => {
                        const isSelected = idx === selectedPlayerIndex;
                        const col = COLOUR_MAP[p.colour] || { bg: '#888', glow: '#aaa' };

                        return (
                            <button
                                key={p.name}
                                onClick={() => handlePlayerClick(idx)}
                                style={{
                                    backgroundColor: col.bg,
                                    color: '#fff',
                                    border: isSelected ? `3px solid #fff` : `2px solid transparent`,
                                    boxShadow: isSelected ? `0 4px 12px ${col.glow}` : 'none',
                                    opacity: isSelected ? 1 : 0.6,
                                    borderRadius: '6px',
                                    padding: '0.5rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.1rem',
                                    transition: 'all 0.1s',
                                    transform: isSelected ? 'translateY(-2px)' : 'none'
                                }}
                            >
                                <span style={{ fontWeight: 'bold', fontSize: '0.9rem', lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{p.name}</span>
                                <div style={{
                                    fontSize: '1.4rem',
                                    fontWeight: 'bold',
                                    fontFamily: 'var(--font-heading)',
                                }}>
                                    {p.vp || 0}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Agent Actions Tracker module */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        Adding VP to <strong style={{ color: 'var(--color-accent-gold)' }}>{activePlayer.name}</strong>
                    </div>

                    {Object.entries(actionsByCategory).map(([category, actions]) => (
                        <div key={category} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                        }}>
                            <h3 style={{
                                color: 'var(--color-text-muted)',
                                textTransform: 'uppercase',
                                fontSize: '0.8rem',
                                borderBottom: '1px solid #333',
                                paddingBottom: '0.2rem',
                                margin: 0
                            }}>
                                {category}
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                gap: '0.5rem'
                            }}>
                                {actions.map((act, i) => {
                                    const key = `${category}-${i}`;
                                    const isFlashing = flashedKey === key;
                                    const isDisabled = (act.action === 'High Council' && activePlayer.highCouncil) || (act.action === 'Swordmaster' && activePlayer.swordmaster);
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => !isDisabled && handleActionClick(act, key)}
                                            disabled={isDisabled}
                                            style={{
                                                backgroundColor: isFlashing ? '#4a4' : (act.hexcode || '#2a2a2a'),
                                                border: isFlashing ? '2px solid #8f8' : (act.hexcode ? `1px solid ${act.hexcode}` : '1px solid #444'),
                                                borderRadius: '6px',
                                                padding: '0.6rem 0.2rem',
                                                color: '#fff',
                                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                                transition: isFlashing ? 'none' : 'background-color 0.3s, border 0.3s',
                                                minHeight: '80px',
                                                transform: isFlashing ? 'scale(0.96)' : 'scale(1)',
                                                textShadow: act.hexcode ? '0 1px 2px rgba(0,0,0,0.6)' : 'none',
                                                opacity: isDisabled ? 0.4 : 1,
                                                width: '100%'
                                            }}
                                            onMouseOver={(e) => { if (!isFlashing && !isDisabled) e.currentTarget.style.filter = 'brightness(1.2)'; }}
                                            onMouseOut={(e) => { if (!isFlashing && !isDisabled) e.currentTarget.style.filter = 'brightness(1)'; }}
                                        >
                                            <span style={{
                                                textAlign: 'center',
                                                textTransform: 'capitalize',
                                                fontSize: '0.8rem',
                                                lineHeight: '1.1',
                                                marginBottom: '0.2rem'
                                            }}>
                                                {act.action}
                                            </span>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                {act.imageAsset && (
                                                    <img
                                                        src={`/assets/${encodeURIComponent(act.imageAsset)}${act.imageAsset.includes('.') ? '' : '.png'}?v=3`}
                                                        alt={act.imageAsset}
                                                        style={{
                                                            width: '50px',
                                                            height: '50px',
                                                            objectFit: 'contain',
                                                            borderRadius: '4px',
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                )}
                                                <span style={{
                                                    color: act.points >= 0 ? 'var(--color-accent-gold)' : '#d44',
                                                    fontWeight: 'bold',
                                                    fontSize: '1.1rem'
                                                }}>
                                                    {act.points >= 0 ? `+${act.points}` : act.points}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Action Area */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem',
                    marginTop: '1rem',
                    borderTop: '1px solid #333',
                    paddingTop: '2rem'
                }}>
                    <button
                        onClick={() => {
                            if (onRoundChange) onRoundChange(round + 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{
                            background: 'var(--color-accent-gold)',
                            border: '2px solid #fff',
                            color: '#000',
                            padding: '1rem 3rem',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            boxShadow: '0 0 20px rgba(212,175,55,0.4)',
                            transition: 'transform 0.1s, box-shadow 0.1s',
                            width: '100%',
                            maxWidth: '400px'
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(212,175,55,0.6)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(212,175,55,0.4)'; }}
                    >
                        Advance Round
                    </button>
                </div>

                {/* Footer Actions */}
                <div style={{ marginTop: '1rem', borderTop: '1px solid #333', paddingTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button
                        onClick={onUndo}
                        style={{
                            backgroundColor: '#333',
                            color: '#aaa',
                            border: '1px solid #555',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            flex: 1,
                            maxWidth: '150px'
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
                            fontSize: '0.9rem',
                            flex: 1,
                            maxWidth: '150px'
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
