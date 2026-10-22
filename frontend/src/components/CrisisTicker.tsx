import React from 'react';
import { QrCode, ShieldCheck, PhoneCall } from 'lucide-react';

interface CrisisTickerProps {
  onOpenQR: () => void;
}

export const CrisisTicker: React.FC<CrisisTickerProps> = ({ onOpenQR }) => {
  return (
    <div
      style={{
        backgroundColor: '#0e2017',
        borderBottom: '1px solid #784524',
        padding: '0.45rem 1.5rem',
        fontSize: '0.8rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '300px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.15rem 0.55rem',
            borderRadius: '9999px',
            backgroundColor: '#391419',
            border: '1px solid #78232c',
            color: '#fb7185',
            fontWeight: 800,
            fontSize: '0.7rem',
            letterSpacing: '0.04em',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#f43f5e',
              boxShadow: '0 0 8px #f43f5e',
            }}
          />
          NDRF EMERGENCY ALERT
        </span>

        <span style={{ color: '#d4ded6', fontWeight: 500 }}>
          Assam Monsoon Floods & Wayanad Landslide Relief Active: NDRF & SDRF teams on the ground.
          Every <strong style={{ color: '#fdfbf7' }}>₹500</strong> supplies emergency dry rations and water purification kits to stranded families.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span
          style={{
            color: '#d4ded6',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.75rem',
          }}
        >
          <PhoneCall size={13} color="#f6c492" />
          <span>NDRF Helpline: <strong style={{ color: '#fdfbf7' }}>1078</strong> / <strong style={{ color: '#fdfbf7' }}>112</strong></span>
        </span>

        <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
          <ShieldCheck size={14} />
          80G Tax Exempt
        </span>

        <button
          onClick={onOpenQR}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.3rem 0.75rem',
            borderRadius: '6px',
            backgroundColor: '#26150b',
            border: '1px solid #784524',
            color: '#f6c492',
            fontWeight: 700,
            fontSize: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <QrCode size={14} />
          Donate via UPI QR (₹)
        </button>
      </div>
    </div>
  );
};
