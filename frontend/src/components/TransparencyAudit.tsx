import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Search,
  ArrowDownLeft,
  ShieldCheck,
  X,
  Clock,
} from 'lucide-react';
import type { DonationRecord, Campaign } from '../types';
import { EXPECTED_CHAIN } from '../config/contract';
import { formatINR, ethToInr } from '../utils/currency';

interface TransparencyAuditProps {
  donations: DonationRecord[];
  campaigns: Campaign[];
  selectedCampaignId?: number | null;
  onClearFilter: () => void;
}

export const TransparencyAudit: React.FC<TransparencyAuditProps> = ({
  donations,
  campaigns,
  selectedCampaignId,
  onClearFilter,
}) => {
  const [filterCampaign, setFilterCampaign] = useState<number | 'ALL'>(
    selectedCampaignId !== undefined && selectedCampaignId !== null ? selectedCampaignId : 'ALL'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter public donations
  const filteredDonations = donations.filter((d) => {
    const matchesCampaign = filterCampaign === 'ALL' || d.campaignId === filterCampaign;
    const matchesSearch =
      d.donor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.transactionHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.campaignName && d.campaignName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCampaign && matchesSearch;
  });

  const totalDonatedEth = donations.reduce((acc, d) => acc + parseFloat(d.amount || '0'), 0);
  const uniqueDonorsCount = new Set(donations.map((d) => d.donor.toLowerCase())).size;

  const formatRelativeTime = (timestampSeconds: number) => {
    const diffSeconds = Math.floor(Date.now() / 1000) - timestampSeconds;
    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${Math.floor(diffSeconds / 86400)}d ago`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Overview Card */}
      <div
        className="glass-card"
        style={{
          padding: '2rem',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #1c382a 0%, #162e22 100%)',
          border: '1px solid #784524',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                color: '#34d399',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '0.4rem',
              }}
            >
              <ShieldCheck size={16} />
              Immutable Public Donations Ledger
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fdfbf7', margin: 0 }}>
              Transparency & Verified Donations Audit
            </h2>
            <p style={{ color: '#d4ded6', fontSize: '0.95rem', maxWidth: '650px', margin: '0.5rem 0 0 0' }}>
              Real-time audit trail of public contributions received across all disaster relief campaigns,
              decoded directly from on-chain smart contract events.
            </p>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                backgroundColor: '#0f2017',
                border: '1px solid #236943',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#9cb0a1', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Verified Raised
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>
                +{totalDonatedEth.toFixed(3)} ETH
              </div>
              <div style={{ fontSize: '0.75rem', color: '#d4ded6' }}>
                ≈ {formatINR(ethToInr(totalDonatedEth.toString()))}
              </div>
            </div>

            <div
              style={{
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                backgroundColor: '#0f2017',
                border: '1px solid #5c3a21',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#9cb0a1', textTransform: 'uppercase', fontWeight: 600 }}>
                Unique Donors
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fdfbf7' }}>
                {uniqueDonorsCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#d4ded6' }}>
                {donations.length} total contributions
              </div>
            </div>
          </div>
        </div>

        {/* Search & Campaign Filters */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #5c3a21',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 700, fontSize: '0.9rem' }}>
            <ArrowDownLeft size={18} />
            Public Contribution Ledger ({filteredDonations.length} records)
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Filter by campaign dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                value={filterCampaign}
                onChange={(e) => {
                  const val = e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value, 10);
                  setFilterCampaign(val);
                }}
                className="form-select"
                style={{ width: 'auto', minWidth: '180px', fontSize: '0.85rem' }}
              >
                <option value="ALL">All Campaigns</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id}: {c.name.slice(0, 32)}...
                  </option>
                ))}
              </select>

              {filterCampaign !== 'ALL' && (
                <button
                  onClick={() => {
                    setFilterCampaign('ALL');
                    onClearFilter();
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem', borderRadius: '8px' }}
                  title="Clear Campaign Filter"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search
                size={16}
                color="#9cb0a1"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Filter by hash or donor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Public Donations History Table */}
      <div
        className="glass-card"
        style={{
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#162e22',
          border: '1px solid #5c3a21',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.875rem',
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#0f2017',
                  borderBottom: '1px solid #5c3a21',
                  color: '#f6c492',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '1rem 1.25rem' }}>Type & Amount</th>
                <th style={{ padding: '1rem 1.25rem' }}>Campaign</th>
                <th style={{ padding: '1rem 1.25rem' }}>Donor Address</th>
                <th style={{ padding: '1rem 1.25rem' }}>Date & Time</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Tx Verification</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: '3rem 1rem',
                      textAlign: 'center',
                      color: '#d4ded6',
                    }}
                  >
                    No donation records found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredDonations.map((item) => {
                  const shortDonor = `${item.donor.substring(0, 6)}...${item.donor.substring(
                    item.donor.length - 4
                  )}`;
                  const shortHash = `${item.transactionHash.substring(
                    0,
                    8
                  )}...${item.transactionHash.substring(item.transactionHash.length - 6)}`;

                  const dateObj = new Date(item.timestamp * 1000);
                  const humanDate = dateObj.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  });
                  const utcString = dateObj.toUTCString();
                  const relativeTime = formatRelativeTime(item.timestamp);

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #264232',
                        backgroundColor: '#162e22',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      {/* Amount: Green Tone, + prefix */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              backgroundColor: '#133523',
                              border: '1px solid #236943',
                              color: '#34d399',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            <ArrowDownLeft size={13} />
                            + Donation
                          </span>
                          <span
                            style={{
                              fontWeight: 800,
                              color: '#34d399',
                              fontSize: '1rem',
                              fontFamily: 'monospace',
                            }}
                          >
                            +{item.amount} ETH
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#d4ded6', marginTop: '0.2rem' }}>
                          ≈ {formatINR(ethToInr(item.amount))}
                        </div>
                      </td>

                      {/* Campaign */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.45rem',
                              borderRadius: '4px',
                              backgroundColor: '#26150b',
                              border: '1px solid #784524',
                              color: '#f6c492',
                              fontWeight: 700,
                            }}
                          >
                            #{item.campaignId}
                          </span>
                          <span style={{ color: '#fdfbf7', fontWeight: 500 }}>
                            {item.campaignName || `Campaign #${item.campaignId}`}
                          </span>
                        </div>
                      </td>

                      {/* Donor Address */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontFamily: 'monospace', color: '#f6c492', fontSize: '0.85rem' }}>
                            {shortDonor}
                          </span>
                          <button
                            onClick={() => copyToClipboard(item.donor, `donor-${item.id}`)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: copiedId === `donor-${item.id}` ? '#34d399' : '#9cb0a1',
                              cursor: 'pointer',
                              padding: '0.2rem',
                            }}
                            title="Copy full address"
                          >
                            {copiedId === `donor-${item.id}` ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div
                          title={`Exact UTC: ${utcString}\nBlock Number: ${item.blockNumber || 'N/A'}`}
                          style={{ cursor: 'help', display: 'inline-flex', flexDirection: 'column' }}
                        >
                          <span style={{ color: '#fdfbf7', fontWeight: 500 }}>{humanDate}</span>
                          <span style={{ fontSize: '0.75rem', color: '#9cb0a1', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} />
                            {relativeTime}
                          </span>
                        </div>
                      </td>

                      {/* Tx Verification */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <a
                          href={`${EXPECTED_CHAIN.blockExplorerUrl}/tx/${item.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontFamily: 'monospace',
                          }}
                        >
                          {shortHash}
                          <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
