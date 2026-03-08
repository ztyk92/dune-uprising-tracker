
export default function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isDanger = false }) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999, // Ensure it's on top of everything
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                backgroundColor: '#222',
                border: '1px solid #444',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '400px',
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 0 20px rgba(0,0,0,0.5)'
            }}>
                {title && <h3 style={{ color: isDanger ? '#ff6b6b' : '#fff', marginBottom: '1rem', marginTop: 0 }}>{title}</h3>}
                <p style={{ color: '#ccc', marginBottom: '2rem', lineHeight: '1.5' }}>
                    {message}
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '0.8rem 1.5rem',
                            backgroundColor: '#333',
                            color: '#fff',
                            border: '1px solid #555',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '0.8rem 1.5rem',
                            backgroundColor: isDanger ? '#d32f2f' : 'var(--color-accent-gold)',
                            color: isDanger ? '#fff' : '#000',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
