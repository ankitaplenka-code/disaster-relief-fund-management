import React from 'react';
import { ShieldCheck, Award, Lock, Smartphone } from 'lucide-react';

export const TrustBadges: React.FC = () => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginTop: '2rem',
        marginBottom: '1rem',
      }}
    >
      {/* 80G Tax Exemption */}
      <div
        style={{
          backgroundColor: '#162e22',
          border: '1px solid #5c3a21',
          borderRadius: '14px',
          padding: '1.25rem',
          display: 'flex',
          gap: '0.85rem',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#133523',
            border: '1px solid #236943',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399',
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={22} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fdfbf7' }}>
            100% Tax Deductible (80G)
          </div>
          <div style={{ fontSize: '0.8rem', color: '#d4ded6', marginTop: '0.2rem' }}>
            Section 80G of the Indian Income Tax Act, 1961. Instant downloadable 80G digital receipt with Form 10BE filing compliance.
          </div>
        </div>
      </div>

      {/* NGO Darpan */}
      <div
        style={{
          backgroundColor: '#162e22',
          border: '1px solid #5c3a21',
          borderRadius: '14px',
          padding: '1.25rem',
          display: 'flex',
          gap: '0.85rem',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#26150b',
            border: '1px solid #784524',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f6c492',
            flexShrink: 0,
          }}
        >
          <Award size={22} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fdfbf7' }}>
            NITI Aayog Darpan Verified
          </div>
          <div style={{ fontSize: '0.8rem', color: '#d4ded6', marginTop: '0.2rem' }}>
            UID: <strong style={{ color: '#fdfbf7' }}>KA/2026/094218</strong> • Verified humanitarian non-profit partner for National Disaster Management Authority (NDMA).
          </div>
        </div>
      </div>

      {/* 0% Fees */}
      <div
        style={{
          backgroundColor: '#162e22',
          border: '1px solid #5c3a21',
          borderRadius: '14px',
          padding: '1.25rem',
          display: 'flex',
          gap: '0.85rem',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#34220b',
            border: '1px solid #784d14',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24',
            flexShrink: 0,
          }}
        >
          <Lock size={22} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fdfbf7' }}>
            Zero Intermediary Deductions
          </div>
          <div style={{ fontSize: '0.8rem', color: '#d4ded6', marginTop: '0.2rem' }}>
            Every ₹1 donated delivers direct emergency rations, clean water, and medicine kits on the ground without admin cuts.
          </div>
        </div>
      </div>

      {/* UPI & Indian Banking */}
      <div
        style={{
          backgroundColor: '#162e22',
          border: '1px solid #5c3a21',
          borderRadius: '14px',
          padding: '1.25rem',
          display: 'flex',
          gap: '0.85rem',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#26150b',
            border: '1px solid #784524',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f6c492',
            flexShrink: 0,
          }}
        >
          <Smartphone size={22} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fdfbf7' }}>
            Instant UPI & Netbanking
          </div>
          <div style={{ fontSize: '0.8rem', color: '#d4ded6', marginTop: '0.2rem' }}>
            Direct 0% fee payments via Google Pay, PhonePe, Paytm, BHIM, and SBI / ICICI Bank NEFT/RTGS accounts.
          </div>
        </div>
      </div>
    </div>
  );
};
