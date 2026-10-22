import React from 'react';
import { Globe, Sparkles } from 'lucide-react';

interface StaticGlobeFallbackProps {
  onExploreClick?: () => void;
}

export const StaticGlobeFallback: React.FC<StaticGlobeFallbackProps> = ({ onExploreClick: _onExploreClick }) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: '380px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderRadius: '24px',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 50%, #1c382a 0%, #162e22 55%, #0c1a13 100%)',
        border: '1px solid #784524',
      }}
      aria-label="2D Static representation of the global relief aid network"
    >
      {/* Background Geodesic Rings */}
      <div
        style={{
          position: 'absolute',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          border: '1px dashed #236943',
          animation: 'spin-slow 60s linear infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '230px',
          height: '230px',
          borderRadius: '50%',
          border: '1px solid #784524',
          boxShadow: '0 0 35px rgba(180, 83, 9, 0.25)',
        }}
      />

      {/* Central Hologram Icon */}
      <div
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #26150b 0%, #162e22 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid #8d5b2d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 35px rgba(180, 83, 9, 0.35)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Globe size={64} color="#f6c492" />
      </div>

      {/* Text Info */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', marginTop: '1.5rem', padding: '0 1rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: '#26150b',
            border: '1px solid #784524',
            color: '#f6c492',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem',
          }}
        >
          <Sparkles size={13} color="#fbbf24" />
          Global Sovereign Aid Grid
        </div>
        <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#fdfbf7' }}>
          Real-Time Relief Network
        </h3>
        <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#d4ded6', maxWidth: '320px' }}>
          Verifiable on-chain smart contracts connecting global donors with emergency field operations.
        </p>
      </div>
    </div>
  );
};
