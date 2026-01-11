import React from 'react';

export default function ActionLog({ history }) {
    if (!history || history.length === 0) return null;

    return (
        <div style={{
            marginTop: '2rem',
            textAlign: 'left',
            borderTop: '1px solid #333',
            paddingTop: '1rem',
            maxHeight: '200px',
            overflowY: 'auto'
        }}>
            <h4 style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Recent Actions</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {history.slice().reverse().map((entry, idx) => (
                    <li key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>
                        <strong style={{ color: 'var(--color-accent-gold)' }}>{entry.playerName}</strong>: {entry.action}
                        <span style={{ color: '#666', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                            (Round {entry.round})
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
