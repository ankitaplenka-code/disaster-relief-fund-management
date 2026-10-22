import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, ExternalLink } from 'lucide-react';
import type { ToastMessage } from '../types';
import { EXPECTED_CHAIN } from '../config/contract';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '420px',
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              backgroundColor: '#13261c',
              border: '1px solid',
              borderColor: isSuccess
                ? '#236943'
                : isError
                ? '#78232c'
                : isWarning
                ? '#784d14'
                : '#784524',
              borderRadius: '12px',
              padding: '1rem',
              boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.85), 0 0 15px rgba(180, 83, 9, 0.2)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              animation: 'slideUp 0.2s ease-out',
            }}
          >
            <div style={{ marginTop: '0.1rem', flexShrink: 0 }}>
              {isSuccess && <CheckCircle2 size={20} color="#34d399" />}
              {isError && <AlertCircle size={20} color="#fb7185" />}
              {isWarning && <AlertTriangle size={20} color="#fbbf24" />}
              {toast.type === 'info' && <Info size={20} color="#f6c492" />}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fdfbf7' }}>
                {toast.title}
              </div>
              {toast.message && (
                <div style={{ fontSize: '0.8rem', color: '#d4ded6', marginTop: '0.2rem' }}>
                  {toast.message}
                </div>
              )}
              {toast.txHash && (
                <div style={{ marginTop: '0.4rem' }}>
                  <a
                    href={`${EXPECTED_CHAIN.blockExplorerUrl}/tx/${toast.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono"
                    style={{
                      fontSize: '0.75rem',
                      color: '#f6c492',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      textDecoration: 'none',
                    }}
                  >
                    View transaction on Etherscan
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#9cb0a1',
                cursor: 'pointer',
                padding: '0.2rem',
              }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
