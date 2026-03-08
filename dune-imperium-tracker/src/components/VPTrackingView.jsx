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
            setSelectedPlayerIndex(0);
        }
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
                            borderBottom: space > 0 ? '2px solid #555' : 'none',
                            position: 'relative',
                            gap: '2px',
                        }}>
                            {/* Space number */}
                            <span style={{
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                color: '#ccc',
                                lineHeight: 1,
                                userSelect: 'none',
                                position: 'absolute',
                                top: '5px',
                                left: '5px',
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

            <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '2rem', paddingLeft: '80px', paddingRight: '20px' }}>

                {/* Top Section: Alliance Track, Round Control, Players */}
                <div style={{
                    position: 'sticky',
                    top: '0',
                    zIndex: 100,
                    backgroundColor: '#111',
                    paddingTop: '0.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: '1rem',
                }}>
                    {/* Left Column (Alliance Track) */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        marginRight: '1rem'
                    }}>
                        {['Emperor', 'Spacing Guild', 'Bene Gesserit', 'Fremen'].map(faction => {
                            const ownerName = alliances ? alliances[faction] : null;
                            const ownerIndex = activePlayers.findIndex(p => p.name === ownerName);
                            const ownerPlayer = ownerIndex !== -1 ? activePlayers[ownerIndex] : null;
                            const col = ownerPlayer ? (COLOUR_MAP[ownerPlayer.colour] || { bg: '#888', glow: '#aaa' }) : null;

                            return (
                                <div key={faction} style={{
                                    minWidth: '76px',
                                    height: '44px',
                                    backgroundColor: '#222',
                                    border: '2px solid #444',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0 4px',
                                }}>
                                    <img
                                        src={`/assets/${encodeURIComponent(faction)}.png?v=2`}
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
                    </div>

                    {/* Right Column (Round & Players) */}
                    <div style={{ flex: 1 }}>
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
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', minWidth: '80px', textAlign: 'center', textTransform: 'uppercase', color: 'var(--color-accent-gold)' }}>
                                ROUND {round}
                            </span>
                        </div>

                        {/* Players Scroll Row */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${activePlayers.length}, 1fr)`,
                            gap: '0.5rem',
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
                    </div>

                    {/* Right Column (Upgrades Track) */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        marginLeft: '1rem'
                    }}>
                        {[
                            { id: 'High Council', type: 'boolean' },
                            { id: 'Swordmaster', type: 'boolean' },
                            { id: 'Sardaukar', type: 'tally' }
                        ].map(upgrade => {
                            // Find all players that have this upgrade
                            const attainingPlayers = activePlayers.filter(p => {
                                if (upgrade.type === 'boolean') {
                                    return upgrade.id === 'High Council' ? p.highCouncil : p.swordmaster;
                                } else {
                                    return p.sardaukar > 0;
                                }
                            });

                            return (
                                <div key={upgrade.id} style={{
                                    minWidth: '76px',
                                    height: '44px',
                                    backgroundColor: '#222',
                                    border: '2px solid #444',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0 4px',
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
                                        src={`/assets/${encodeURIComponent(upgrade.id)}.png?v=2`}
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
                            verticalAlign: 'top',
                            width: actions.length === 1 ? 'calc(50% - 0.25rem)' : '100%',
                            marginRight: actions.length === 1 ? '0.25rem' : '0'
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
                                gridTemplateColumns: actions.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                                gap: '0.5rem'
                            }}>
                                {actions.map((act, i) => {
                                    const key = `${category}-${i}`;
                                    const isFlashing = flashedKey === key;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handleActionClick(act, key)}
                                            style={{
                                                backgroundColor: isFlashing ? '#4a4' : (act.hexcode || '#2a2a2a'),
                                                border: isFlashing ? '2px solid #8f8' : (act.hexcode ? `1px solid ${act.hexcode}` : '1px solid #444'),
                                                borderRadius: '6px',
                                                padding: '0.6rem 0.2rem',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                                transition: isFlashing ? 'none' : 'background-color 0.3s, border 0.3s',
                                                minHeight: '80px',
                                                transform: isFlashing ? 'scale(0.96)' : 'scale(1)',
                                                textShadow: act.hexcode ? '0 1px 2px rgba(0,0,0,0.6)' : 'none',
                                            }}
                                            onMouseOver={(e) => { if (!isFlashing) e.currentTarget.style.filter = 'brightness(1.2)'; }}
                                            onMouseOut={(e) => { if (!isFlashing) e.currentTarget.style.filter = 'brightness(1)'; }}
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
                                                        src={`/assets/${encodeURIComponent(act.imageAsset)}${act.imageAsset.includes('.') ? '' : '.png'}?v=2`}
                                                        alt={act.imageAsset}
                                                        style={{
                                                            width: '70px',
                                                            height: '70px',
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
                    marginTop: '2rem',
                    borderTop: '1px solid #333',
                    paddingTop: '2rem'
                }}>
                    {/* Advance Round Button */}
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
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(212,175,55,0.6)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(212,175,55,0.4)'; }}
                    >
                        Advance Round
                    </button>
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
