import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Search,
  Download,
  FileText,
  Copy,
  Check,
  CreditCard,
  Building,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  ExternalLink,
} from 'lucide-react';
import { apiService, type DatabasePayment, type PaymentStats } from '../services/apiService';
import type { Campaign } from '../types';
import { formatINR, ethToInr } from '../utils/currency';
import { EXPECTED_CHAIN } from '../config/contract';

interface DatabaseLedgerProps {
  campaigns: Campaign[];
  onViewReceipt: (receiptData: any) => void;
}

export const DatabaseLedger: React.FC<DatabaseLedgerProps> = ({ campaigns, onViewReceipt }) => {
  const [payments, setPayments] = useState<DatabasePayment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'DONATION' | 'DISBURSEMENT'>('ALL');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [filterCampaign, setFilterCampaign] = useState<number | 'ALL'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Receipt lookup input
  const [lookupReceiptId, setLookupReceiptId] = useState<string>('');
  const [lookupError, setLookupError] = useState<string | null>(null);

  const loadDatabaseData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [pRes, sRes] = await Promise.all([
        apiService.getPayments({
          campaignId: filterCampaign,
          method: filterMethod,
          type: filterType,
          search: search.trim() || undefined,
        }),
        apiService.getStats(),
      ]);

      setPayments(pRes.payments);
      setStats(sRes);
    } catch (err) {
      console.error('Error loading database records:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterCampaign, filterMethod, filterType, search]);

  useEffect(() => {
    loadDatabaseData();
  }, [loadDatabaseData]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLookupReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    if (!lookupReceiptId.trim()) return;

    const receipt = await apiService.getReceipt(lookupReceiptId.trim());
    if (receipt) {
      onViewReceipt({
        receiptId: receipt.receipt_id,
        campaignName: receipt.campaign_name || `Campaign #${receipt.campaign_id}`,
        donorAddress: receipt.donor_wallet_address || receipt.donor_name || 'Anonymous',
        amountEth: receipt.amount_eth.toString(),
        txHash: receipt.transaction_hash || 'Recorded in SQLite DB',
        timestamp: new Date(receipt.created_at * 1000).toLocaleString(),
      });
      setLookupReceiptId('');
    } else {
      setLookupError('No tax receipt found matching this ID. Please check the receipt number.');
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'WEB3_METAMASK':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              backgroundColor: '#133523',
              color: '#34d399',
              fontSize: '0.75rem',
              fontWeight: 700,
              border: '1px solid #236943',
            }}
          >
            <Smartphone size={13} />
            Web3 ETH
          </span>
        );
      case 'QR_UPI':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              backgroundColor: '#26150b',
              color: '#f6c492',
              fontSize: '0.75rem',
              fontWeight: 700,
              border: '1px solid #784524',
            }}
          >
            <CreditCard size={13} />
            UPI / GPay
          </span>
        );
      case 'BANK_WIRE':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              backgroundColor: '#34220b',
              color: '#fbbf24',
              fontSize: '0.75rem',
              fontWeight: 700,
              border: '1px solid #784d14',
            }}
          >
            <Building size={13} />
            Bank Wire
          </span>
        );
      case 'WITHDRAWAL_DISBURSEMENT':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              backgroundColor: '#34220b',
              color: '#fbbf24',
              fontSize: '0.75rem',
              fontWeight: 700,
              border: '1px solid #784d14',
            }}
          >
            <Coins size={13} />
            Relief Outflow
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              backgroundColor: '#112319',
              border: '1px solid #264232',
              color: '#d4ded6',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {method}
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Overview Hero Card */}
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
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.75rem',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                color: '#f6c492',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '0.4rem',
              }}
            >
              <Database size={16} />
              SQLite Native Payments Database
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fdfbf7' }}>
              Relational Payments Ledger & Withdrawal DB
            </h2>
            <p style={{ color: '#d4ded6', fontSize: '0.95rem', maxWidth: '680px' }}>
              Complete dual-entry ledger tracking all financial flows: inbound contributions (MetaMask ETH,
              QR UPI, Bank Wire) and all outbound relief disbursements with full justification milestones.
            </p>
          </div>

          {/* Quick Actions: CSV Download & Refresh */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a
              href={apiService.getCsvDownloadUrl()}
              download
              className="btn btn-primary"
              style={{
                padding: '0.55rem 1.1rem',
                fontSize: '0.85rem',
                gap: '0.5rem',
                textDecoration: 'none',
              }}
            >
              <Download size={16} />
              Export Full Audit CSV
            </a>

            <button
              onClick={loadDatabaseData}
              disabled={refreshing}
              className="btn btn-secondary"
              style={{ padding: '0.55rem 0.9rem', fontSize: '0.85rem', gap: '0.4rem' }}
            >
              <RefreshCw size={15} className={refreshing ? 'spin-animate' : ''} />
              Sync DB
            </button>
          </div>
        </div>

        {/* Aggregate Database Statistics Cards */}
        {stats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* 1. Total Raised (Inflow) */}
            <div
              style={{
                backgroundColor: '#0f2017',
                padding: '1.25rem',
                borderRadius: '14px',
                border: '1px solid #236943',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
                <ArrowDownLeft size={14} />
                Total Raised (Inflows)
              </div>
              <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>
                {formatINR(stats.total_raised_inr)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#d4ded6', marginTop: '0.25rem' }}>
                {stats.total_raised_eth.toFixed(3)} ETH • {stats.total_donations_count} Donations
              </div>
            </div>

            {/* 2. Total Disbursed (Outflow) */}
            <div
              style={{
                backgroundColor: '#0f2017',
                padding: '1.25rem',
                borderRadius: '14px',
                border: '1px solid #784524',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>
                <ArrowUpRight size={14} />
                Disbursed / Withdrawn (Outflows)
              </div>
              <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.2rem' }}>
                {formatINR(stats.total_disbursed_inr || 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#d4ded6', marginTop: '0.25rem' }}>
                {(stats.total_disbursed_eth || 0).toFixed(3)} ETH • {stats.total_withdrawals_count || 0} Withdrawals
              </div>
            </div>

            {/* 3. Net Reserve Pool */}
            <div
              style={{
                backgroundColor: '#0f2017',
                padding: '1.25rem',
                borderRadius: '14px',
                border: '1px solid #8d5b2d',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#f6c492', fontWeight: 700, textTransform: 'uppercase' }}>
                Net Treasury Reserve
              </div>
              <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f6c492', marginTop: '0.2rem' }}>
                {formatINR(stats.net_balance_inr || 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#d4ded6', marginTop: '0.25rem' }}>
                {(stats.net_balance_eth || 0).toFixed(3)} ETH Remaining Escrow
              </div>
            </div>

            {/* 4. Active Rails & Ledger Count */}
            <div
              style={{
                backgroundColor: '#0f2017',
                padding: '1.25rem',
                borderRadius: '14px',
                border: '1px solid #264232',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#9cb0a1', fontWeight: 600 }}>
                Ledger Activity Rails
              </div>
              <div style={{ fontSize: '0.8rem', color: '#fdfbf7', fontWeight: 600, marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: '#d4ded6' }}>Total Indexed Records:</span>
                  <strong className="mono" style={{ color: '#fdfbf7' }}>{payments.length}</strong>
                </div>
                {stats.methods.slice(0, 3).map((m) => (
                  <div key={m.payment_method} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem' }}>
                    <span style={{ color: '#9cb0a1' }}>{m.payment_method.replace(/_/g, ' ')}:</span>
                    <span className="mono" style={{ color: '#f6c492' }}>{m.total_eth} ETH ({m.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tax Receipt Finder Bar */}
      <div
        className="glass-card"
        style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          backgroundColor: '#162e22',
          border: '1px solid #5c3a21',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FileText size={20} color="#34d399" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fdfbf7' }}>
              Verify Receipts & Disbursement Vouchers
            </div>
            <div style={{ fontSize: '0.75rem', color: '#d4ded6' }}>
              Lookup official 80G tax receipts (RELIEF-80G-*) or withdrawal vouchers (RELIEF-DISB-*)
            </div>
          </div>
        </div>

        <form onSubmit={handleLookupReceipt} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 320px', maxWidth: '460px' }}>
          <input
            type="text"
            placeholder="e.g. RELIEF-80G-894218 or RELIEF-DISB-*"
            value={lookupReceiptId}
            onChange={(e) => setLookupReceiptId(e.target.value)}
            className="form-input mono"
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
          />
          <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Lookup Proof
          </button>
        </form>
      </div>

      {lookupError && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            backgroundColor: '#391419',
            border: '1px solid #78232c',
            color: '#fb7185',
            fontSize: '0.85rem',
          }}
        >
          {lookupError}
        </div>
      )}

      {/* Database Search & Filter Toolbar with Flow Type Pills */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Flow Type Tabs */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#9cb0a1', fontWeight: 700, textTransform: 'uppercase', marginRight: '0.25rem' }}>
            Filter Ledger Flow:
          </span>
          <button
            onClick={() => setFilterType('ALL')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              border: filterType === 'ALL' ? '1px solid #8d5b2d' : '1px solid #264232',
              backgroundColor: filterType === 'ALL' ? '#26150b' : '#112319',
              color: filterType === 'ALL' ? '#f6c492' : '#9cb0a1',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s',
            }}
          >
            All Ledger Records
          </button>
          <button
            onClick={() => setFilterType('DONATION')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              border: filterType === 'DONATION' ? '1px solid #236943' : '1px solid #264232',
              backgroundColor: filterType === 'DONATION' ? '#133523' : '#112319',
              color: filterType === 'DONATION' ? '#34d399' : '#9cb0a1',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s',
            }}
          >
            <ArrowDownLeft size={14} color="#34d399" />
            Donations (Inflows)
          </button>
          <button
            onClick={() => setFilterType('DISBURSEMENT')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              border: filterType === 'DISBURSEMENT' ? '1px solid #784524' : '1px solid #264232',
              backgroundColor: filterType === 'DISBURSEMENT' ? '#26150b' : '#112319',
              color: filterType === 'DISBURSEMENT' ? '#fbbf24' : '#9cb0a1',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s',
            }}
          >
            <ArrowUpRight size={14} color="#fbbf24" />
            Disbursements / Withdrawals (Outflows)
          </button>
        </div>

        {/* Search & Dropdown Filters */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search
              size={16}
              color="#9cb0a1"
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search donor/recipient, wallet, purpose milestone, receipt ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.4rem', padding: '0.55rem 0.85rem 0.55rem 2.4rem', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Method Filter */}
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
            >
              <option value="ALL">All Payment Rails</option>
              <option value="WEB3_METAMASK">Web3 MetaMask (ETH)</option>
              <option value="WITHDRAWAL_DISBURSEMENT">Relief Disbursements</option>
              <option value="QR_UPI">UPI / GPay</option>
              <option value="BANK_WIRE">Bank Wire</option>
            </select>

            {/* Campaign Filter */}
            <select
              value={filterCampaign}
              onChange={(e) => {
                const val = e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value, 10);
                setFilterCampaign(val);
              }}
              className="form-select"
              style={{ width: 'auto', padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
            >
              <option value="ALL">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.id}: {c.name.substring(0, 28)}...
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Relational Table */}
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
              fontSize: '0.85rem',
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#0f2017',
                  borderBottom: '1px solid #5c3a21',
                  color: '#f6c492',
                  textTransform: 'uppercase',
                  fontSize: '0.725rem',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '0.9rem 1.2rem' }}>Receipt / ID</th>
                <th style={{ padding: '0.9rem 1.2rem' }}>Flow & Rail</th>
                <th style={{ padding: '0.9rem 1.2rem' }}>Party / Wallet</th>
                <th style={{ padding: '0.9rem 1.2rem' }}>Campaign & Purpose</th>
                <th style={{ padding: '0.9rem 1.2rem' }}>Amount (₹ INR & ETH)</th>
                <th style={{ padding: '0.9rem 1.2rem' }}>Status</th>
                <th style={{ padding: '0.9rem 1.2rem' }}>Date</th>
                <th style={{ padding: '0.9rem 1.2rem', textAlign: 'right' }}>Voucher / Proof</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#d4ded6' }}>
                    Loading database records...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#9cb0a1' }}>
                    No payment or withdrawal records found matching current database filters.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isDisbursement =
                    p.payment_type === 'DISBURSEMENT' ||
                    p.payment_method === 'WITHDRAWAL_DISBURSEMENT' ||
                    p.id.startsWith('DISB');

                  const shortWallet = p.donor_wallet_address
                    ? `${p.donor_wallet_address.substring(0, 6)}...${p.donor_wallet_address.substring(
                        p.donor_wallet_address.length - 4
                      )}`
                    : null;

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid #264232',
                        backgroundColor: '#162e22',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      {/* ID / Voucher */}
                      <td style={{ padding: '0.9rem 1.2rem' }}>
                        <div className="mono" style={{ fontWeight: 700, color: '#f6c492' }}>
                          {p.receipt_id}
                        </div>
                        <div className="mono" style={{ fontSize: '0.7rem', color: '#9cb0a1' }}>
                          {p.id}
                        </div>
                      </td>

                      {/* Flow & Rail */}
                      <td style={{ padding: '0.9rem 1.2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-start' }}>
                          {isDisbursement ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                color: '#fbbf24',
                                backgroundColor: '#34220b',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                border: '1px solid #784d14',
                              }}
                            >
                              <ArrowUpRight size={12} />
                              OUTFLOW
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                color: '#34d399',
                                backgroundColor: '#133523',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                border: '1px solid #236943',
                              }}
                            >
                              <ArrowDownLeft size={12} />
                              INFLOW
                            </span>
                          )}
                          <div>{getMethodBadge(p.payment_method)}</div>
                        </div>
                      </td>

                      {/* Party Identity (Donor or Recipient) */}
                      <td style={{ padding: '0.9rem 1.2rem' }}>
                        <div style={{ fontWeight: 600, color: '#fdfbf7' }}>
                          {p.donor_name}
                        </div>
                        {isDisbursement && (
                          <div style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 600 }}>
                            Aid Vendor / Recipient
                          </div>
                        )}
                        {p.donor_email && (
                          <div style={{ fontSize: '0.75rem', color: '#d4ded6' }}>{p.donor_email}</div>
                        )}
                        {shortWallet && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                            <span className="mono" style={{ fontSize: '0.75rem', color: '#f6c492' }}>
                              {shortWallet}
                            </span>
                            <button
                              onClick={() => copyToClipboard(p.donor_wallet_address!, `w-${p.id}`)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: copiedId === `w-${p.id}` ? '#34d399' : '#9cb0a1',
                                cursor: 'pointer',
                                padding: '0.1rem',
                              }}
                              title="Copy Address"
                            >
                              {copiedId === `w-${p.id}` ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                            {p.transaction_hash && (
                              <a
                                href={`${EXPECTED_CHAIN.blockExplorerUrl}/tx/${p.transaction_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#f6c492', display: 'inline-flex', alignItems: 'center' }}
                                title="View on Block Explorer"
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Campaign & Itemized Purpose */}
                      <td style={{ padding: '0.9rem 1.2rem', maxWidth: '240px' }}>
                        <div style={{ color: '#fdfbf7', fontWeight: 500, fontSize: '0.825rem' }}>
                          {p.campaign_name || `Campaign #${p.campaign_id}`}
                        </div>
                        {p.notes && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: isDisbursement ? '#fbbf24' : '#d4ded6',
                              marginTop: '0.2rem',
                              backgroundColor: isDisbursement ? '#26150b' : 'transparent',
                              padding: isDisbursement ? '0.2rem 0.4rem' : '0',
                              borderRadius: '4px',
                            }}
                          >
                            {p.notes}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '0.9rem 1.2rem' }}>
                        <div
                          className="mono"
                          style={{
                            fontWeight: 800,
                            color: isDisbursement ? '#fbbf24' : '#34d399',
                            fontSize: '1rem',
                          }}
                        >
                          {isDisbursement ? '-' : '+'} {formatINR(p.amount_fiat_inr || ethToInr(p.amount_eth))}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: '#9cb0a1' }}>
                          {isDisbursement ? '-' : '+'} {p.amount_eth} ETH (≈ ${p.amount_fiat_usd?.toLocaleString() || 0} USD)
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.9rem 1.2rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: isDisbursement ? '#fbbf24' : '#34d399',
                          }}
                        >
                          <CheckCircle2 size={13} />
                          {isDisbursement ? 'DISBURSED' : p.payment_status}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '0.9rem 1.2rem', color: '#d4ded6', fontSize: '0.8rem' }}>
                        {new Date(p.created_at * 1000).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Voucher / Certificate Action */}
                      <td style={{ padding: '0.9rem 1.2rem', textAlign: 'right' }}>
                        <button
                          onClick={() =>
                            onViewReceipt({
                              receiptId: p.receipt_id,
                              campaignName: p.campaign_name || `Campaign #${p.campaign_id}`,
                              donorAddress: p.donor_wallet_address || p.donor_name,
                              amountEth: p.amount_eth.toString(),
                              txHash: p.transaction_hash || 'Recorded in SQLite DB',
                              timestamp: new Date(p.created_at * 1000).toLocaleString(),
                            })
                          }
                          style={{
                            background: isDisbursement ? '#26150b' : '#112319',
                            border: isDisbursement ? '1px solid #784524' : '1px solid #5c3a21',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            color: isDisbursement ? '#fbbf24' : '#f6c492',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.15s',
                          }}
                        >
                          <FileText size={13} />
                          {isDisbursement ? 'Relief Voucher' : '80G Certificate'}
                        </button>
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
