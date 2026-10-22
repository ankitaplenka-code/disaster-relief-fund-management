import React, { useState } from 'react';
import {
  HeartHandshake,
  Clock,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  QrCode,
  PlusCircle,
} from 'lucide-react';
import type { Campaign } from '../types';
import { useWallet } from '../context/WalletContext';
import { TrustBadges } from './TrustBadges';
import { formatINR, ethToInr } from '../utils/currency';
import { HeroScene } from './3d/HeroScene';
import { TiltCard } from './3d/TiltCard';

interface CampaignListProps {
  campaigns: Campaign[];
  loading: boolean;
  onDonateClick: (campaign: Campaign) => void;
  onSelectCampaignForAudit: (campaignId: number) => void;
  onOpenQR?: (campaign?: Campaign) => void;
  onOpenCreateCampaign?: () => void;
}

export const CampaignList: React.FC<CampaignListProps> = ({
  campaigns,
  loading,
  onDonateClick,
  onSelectCampaignForAudit,
  onOpenQR,
  onOpenCreateCampaign,
}) => {
  const { isConnected, connectWallet } = useWallet();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Ended' | 'Funded'>('All');

  // Filter campaigns
  const filtered = campaigns.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.category && c.category.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterStatus === 'All') return matchesSearch;
    if (filterStatus === 'Active') {
      return matchesSearch && (c.status === 'Active' || (!c.isEnded && c.active));
    }
    return matchesSearch && c.status === filterStatus;
  });

  // Calculate high-level stats
  const totalRaisedEth = campaigns.reduce((acc, c) => acc + parseFloat(c.amountRaised || '0'), 0);
  const activeCount = campaigns.filter((c) => c.status === 'Active').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero / Impact Banner with 3D Globe Centerpiece */}
      <div
        className="glass-card"
        style={{
          padding: '2rem',
          borderRadius: '24px',
          background:
            'linear-gradient(135deg, #162e22 0%, #1c382a 50%, #112319 100%)',
          border: '1px solid #784524',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2rem',
          alignItems: 'center',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 30px rgba(180, 83, 9, 0.2)',
        }}
      >
        <div style={{ flex: '1.2', minWidth: '320px', position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.8rem',
              borderRadius: '9999px',
              backgroundColor: '#26150b',
              border: '1px solid #784524',
              color: '#f6c492',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '1rem',
            }}
          >
            <ShieldCheck size={16} color="#fbbf24" />
            100% On-Chain Sovereign Giving
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.75rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              marginBottom: '1rem',
              color: '#fdfbf7',
            }}
          >
            Direct, Auditable Relief for <span className="text-gradient-signature">Humanitarian Crises</span>
          </h1>

          <p
            style={{
              fontSize: '1.05rem',
              color: '#d4ded6',
              lineHeight: 1.6,
              marginBottom: '1.75rem',
            }}
          >
            Every single donation and fund withdrawal is recorded immutably on the Ethereum
            blockchain. Track real-time fund allocations with verifiable proof on the testnet block explorer.
          </p>

          {/* Quick Metrics Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1rem',
              paddingTop: '0.5rem',
            }}
          >
            <div
              style={{
                backgroundColor: '#0f2017',
                padding: '1rem',
                borderRadius: '14px',
                border: '1px solid #2f4d3c',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#9cb0a1', fontWeight: 600 }}>
                Total Funds Raised (INR)
              </div>
              <div
                className="mono"
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#34d399',
                  marginTop: '0.2rem',
                }}
              >
                {formatINR(ethToInr(totalRaisedEth))}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#d4ded6', marginTop: '0.2rem' }}>
                ≈ {totalRaisedEth.toFixed(2)} ETH on Ethereum Testnet
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#0f2017',
                padding: '1rem',
                borderRadius: '14px',
                border: '1px solid #2f4d3c',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#9cb0a1', fontWeight: 600 }}>
                Active Relief Appeals
              </div>
              <div
                className="mono"
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#f6c492',
                  marginTop: '0.2rem',
                }}
              >
                {activeCount} Campaigns
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#0f2017',
                padding: '1rem',
                borderRadius: '14px',
                border: '1px solid #2f4d3c',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#9cb0a1', fontWeight: 600 }}>
                Smart Contract Audit
              </div>
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#fbbf24',
                  marginTop: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <CheckCircle2 size={18} color="#fbbf24" />
                Verified Logic
              </div>
            </div>
          </div>

          {/* Direct CTA Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '0.85rem',
              marginTop: '1.75rem',
              flexWrap: 'wrap',
            }}
          >
            {onOpenQR && (
              <button
                onClick={() => onOpenQR()}
                className="btn btn-primary"
                style={{
                  padding: '0.85rem 1.5rem',
                  fontSize: '1rem',
                  gap: '0.6rem',
                }}
              >
                <QrCode size={20} />
                Scan QR to Donate (Crypto / UPI)
              </button>
            )}

            <a
              href="#campaigns-grid"
              className="btn btn-secondary"
              style={{ padding: '0.85rem 1.35rem', fontSize: '0.95rem' }}
            >
              Browse Appeals ({campaigns.length})
              <ArrowRight size={18} />
            </a>
          </div>
        </div>

        {/* Right Column: Interactive 3D Relief Globe Centerpiece */}
        <div style={{ flex: '1', minWidth: '320px', width: '100%', position: 'relative', zIndex: 2 }}>
          <HeroScene campaigns={campaigns} onSelectCampaign={onSelectCampaignForAudit} />
        </div>
      </div>

      {/* Official Trust & Charity Credentials */}
      <TrustBadges />

      {/* Filter & Search Bar */}
      <div
        id="campaigns-grid"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 280px' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
            }}
          >
            <Search
              size={18}
              color="#9cb0a1"
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search relief campaigns by keyword, disaster, or region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
        </div>

        {/* Status Filter Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {(['All', 'Active', 'Funded', 'Ended'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                border: '1px solid',
                borderColor:
                  filterStatus === st ? '#8d5b2d' : '#264232',
                backgroundColor:
                  filterStatus === st ? '#26150b' : '#112319',
                color: filterStatus === st ? '#f6c492' : '#9cb0a1',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {st}
            </button>
          ))}

          {onOpenCreateCampaign && (
            <button
              onClick={onOpenCreateCampaign}
              className="btn btn-primary"
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.825rem',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
              }}
              title="Launch a new disaster relief campaign"
            >
              <PlusCircle size={15} />
              + Create Campaign
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-card"
              style={{ height: '420px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div className="skeleton" style={{ height: '180px', width: '100%', borderRadius: '12px' }} />
              <div className="skeleton" style={{ height: '24px', width: '70%' }} />
              <div className="skeleton" style={{ height: '16px', width: '90%' }} />
              <div className="skeleton" style={{ height: '16px', width: '85%' }} />
              <div className="skeleton" style={{ height: '36px', width: '100%', marginTop: 'auto' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            borderRadius: '20px',
            backgroundColor: '#162e22',
            border: '1px solid #5c3a21',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#0c1a13',
              border: '1px solid #264232',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <Filter size={28} color="#9cb0a1" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fdfbf7' }}>
            No campaigns match your filter
          </h3>
          <p style={{ color: '#d4ded6', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            Try adjusting your search criteria or switch to "All" to view all humanitarian appeals.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('All');
            }}
            className="btn btn-secondary"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Campaign Cards Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '1.75rem',
          }}
        >
          {filtered.map((campaign) => (
            <TiltCard key={campaign.id} maxTilt={6} scale={1.015}>
              <CampaignCard
                campaign={campaign}
                onDonateClick={() => {
                  if (!isConnected) {
                    connectWallet();
                  } else {
                    onDonateClick(campaign);
                  }
                }}
                onViewAudit={() => onSelectCampaignForAudit(campaign.id)}
                onOpenQR={onOpenQR ? () => onOpenQR(campaign) : undefined}
              />
            </TiltCard>
          ))}
        </div>
      )}
    </div>
  );
};

// Campaign Card Item
interface CampaignCardProps {
  campaign: Campaign;
  onDonateClick: () => void;
  onViewAudit: () => void;
  onOpenQR?: () => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  onDonateClick,
  onViewAudit,
  onOpenQR,
}) => {
  const isEnded = campaign.status === 'Ended';
  const isFunded = campaign.status === 'Funded';

  return (
    <div
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '20px',
        overflow: 'hidden',
        backgroundColor: '#162e22',
        border: '1px solid #5c3a21',
        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.borderColor = '#8d5b2d';
        e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.85), 0 0 25px -4px rgba(180, 83, 9, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = '#5c3a21';
        e.currentTarget.style.boxShadow = '0 10px 25px -8px rgba(0, 0, 0, 0.75)';
      }}
    >
      {/* Campaign Image Banner */}
      <div
        style={{
          position: 'relative',
          height: '180px',
          width: '100%',
          backgroundColor: '#0c1a13',
          overflow: 'hidden',
        }}
      >
        <img
          src={
            campaign.image ||
            'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80'
          }
          alt={campaign.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: isEnded ? 'grayscale(80%) opacity(0.7)' : 'brightness(0.9)',
            transition: 'transform 0.5s ease',
          }}
        />

        {/* Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, #162e22 0%, transparent 70%)',
          }}
        />

        {/* Status Badge */}
        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          {campaign.status === 'Active' && (
            <span className="badge badge-active">
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                }}
              />
              Active
            </span>
          )}
          {campaign.status === 'Funded' && (
            <span className="badge badge-funded">
              <CheckCircle2 size={12} />
              Goal Reached
            </span>
          )}
          {campaign.status === 'Ended' && (
            <span className="badge badge-ended">
              <Clock size={12} />
              Ended
            </span>
          )}
        </div>

        {/* Category & ID tag */}
        <div
          style={{
            position: 'absolute',
            bottom: '0.85rem',
            left: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              backgroundColor: '#0c1a13',
              color: '#f6c492',
              border: '1px solid #784524',
            }}
          >
            Campaign #{campaign.id}
          </span>
          {campaign.category && (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '0.2rem 0.5rem',
                borderRadius: '6px',
                backgroundColor: '#0c1a13',
                color: '#d4ded6',
                border: '1px solid #264232',
              }}
            >
              {campaign.category}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            lineHeight: 1.35,
            color: '#fdfbf7',
            marginBottom: '0.65rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {campaign.name}
        </h3>

        <p
          style={{
            fontSize: '0.875rem',
            color: '#d4ded6',
            lineHeight: 1.5,
            marginBottom: '1.25rem',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1,
          }}
        >
          {campaign.description}
        </p>

        {/* Funding Progress */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '0.5rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', flexWrap: 'wrap' }}>
                <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>
                  {formatINR(ethToInr(campaign.amountRaised))}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#d4ded6' }}>
                  raised of <strong style={{ color: '#fdfbf7' }}>{formatINR(ethToInr(campaign.target))}</strong>
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9cb0a1', marginTop: '0.15rem' }}>
                ({campaign.amountRaised} ETH of {campaign.target} ETH)
              </div>
            </div>
            <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f6c492' }}>
              {campaign.progressPercent}%
            </div>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#0f2017',
              borderRadius: '9999px',
              overflow: 'hidden',
              border: '1px solid #264232',
            }}
          >
            <div
              className="progress-fill"
              style={{
                height: '100%',
                width: `${Math.min(campaign.progressPercent, 100)}%`,
                background:
                  campaign.progressPercent >= 100
                    ? 'linear-gradient(90deg, #d97706, #10b981)'
                    : 'linear-gradient(90deg, #b45309, #34d399)',
                borderRadius: '9999px',
                transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </div>
        </div>

        {/* Deadline and Meta info */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: '#9cb0a1',
            marginBottom: '1.25rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #264232',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={14} />
            Deadline: {campaign.deadlineFormatted}
          </span>
          <button
            onClick={onViewAudit}
            style={{
              background: 'none',
              border: 'none',
              color: '#f6c492',
              fontSize: '0.775rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              padding: 0,
            }}
          >
            Audit Trail
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Card Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: onOpenQR ? '1.4fr 1fr' : '1fr', gap: '0.5rem' }}>
          <button
            onClick={onDonateClick}
            disabled={isEnded}
            className={isEnded ? 'btn btn-secondary' : 'btn btn-primary'}
            style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}
          >
            <HeartHandshake size={16} />
            {isEnded ? 'Ended' : isFunded ? 'Support' : 'Donate'}
          </button>

          {onOpenQR && (
            <button
              onClick={onOpenQR}
              className="btn"
              style={{
                padding: '0.75rem 0.5rem',
                fontSize: '0.85rem',
                border: '1px solid #784524',
                backgroundColor: '#1f160f',
                color: '#f6c492',
                fontWeight: 600,
              }}
              title="Scan QR Code to pay via Crypto or UPI"
            >
              <QrCode size={16} />
              UPI / QR (₹)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
