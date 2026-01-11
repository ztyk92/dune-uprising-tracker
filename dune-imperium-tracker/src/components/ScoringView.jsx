import { useState } from 'react';

export default function ScoringView({ players, onComplete, onCancel }) {
    // Track scores for each player
    const [scores, setScores] = useState({});

    // Track which player we are currently scoring
    // We iterate through players array. 0 to players.length - 1
    const [currentIndex, setCurrentIndex] = useState(0);

    const currentPlayer = players[currentIndex];

    const handleScoreSelect = (score) => {
        // Save score for current player
        const newScores = { ...scores, [currentPlayer.id]: score.toString() };
        setScores(newScores);

        // Advance to next player or finish
        if (currentIndex < players.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            // Done!
            onComplete(newScores);
        }
    };

    const handleUndo = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // Generate buttons 14 down to 0
    const buttons = Array.from({ length: 15 }, (_, i) => 14 - i);

    return (
        <div className="card" style={{ maxWidth: '500px', margin: '2rem auto', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '0.5rem', color: 'var(--color-accent-gold)' }}>Final Scoring</h2>
            <p style={{ color: '#aaa', marginBottom: '2rem' }}>
                Select Victory Points for <br />
                <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>{currentPlayer.name}</span>
                <span style={{ display: 'block', fontSize: '0.9rem', fontStyle: 'italic', marginTop: '0.2rem' }}>
                    ({currentPlayer.leader})
                </span>
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr', // Single column
                gap: '0.4rem',
                marginBottom: '2rem',
                maxWidth: '150px', // Limit width for track look
                margin: '0 auto 2rem auto' // Center horizontally
            }}>
                {buttons.map(num => (
                    <button
                        key={num}
                        onClick={() => handleScoreSelect(num)}
                        style={{
                            padding: '0.6rem',
                            fontSize: '1.2rem',
                            backgroundColor: '#333',
                            color: '#fff',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 'bold',
                            width: '100%',
                            transition: 'background-color 0.2s',
                            // Optional: Highlight typical winning scores?
                            // No, keep uniform.
                        }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#444'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = '#333'}
                    >
                        {num}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                <button
                    onClick={onCancel}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#666',
                        textDecoration: 'underline',
                        cursor: 'pointer'
                    }}
                >
                    Cancel
                </button>

                <button
                    onClick={handleUndo}
                    disabled={currentIndex === 0}
                    style={{
                        backgroundColor: currentIndex === 0 ? '#222' : '#444',
                        color: currentIndex === 0 ? '#555' : '#fff',
                        border: '1px solid #555',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: currentIndex === 0 ? 'default' : 'pointer'
                    }}
                >
                    Back / Undo
                </button>
            </div>

            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
                Scoring {currentIndex + 1} of {players.length}
            </div>
        </div>
    );
}
