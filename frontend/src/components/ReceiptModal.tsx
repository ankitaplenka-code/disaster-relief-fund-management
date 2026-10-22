import React from 'react';
import { X, Printer, ShieldCheck, ExternalLink, Award } from 'lucide-react';
import { EXPECTED_CHAIN } from '../config/contract';
import { formatINR, ethToInr, numberToIndianWords } from '../utils/currency';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: {
    receiptId: string;
    campaignName: string;
    donorAddress: string;
    donorPan?: string;
    amountInr?: number;
    amountEth: string;
    txHash: string;
    timestamp: string;
  } | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, receiptData }) => {
  if (!isOpen || !receiptData) return null;

  const isDisbursement = receiptData.receiptId.includes('DISB');
  const numEth = parseFloat(receiptData.amountEth) || 0;
  const inrAmount = receiptData.amountInr || ethToInr(numEth);
  const amountInWords = numberToIndianWords(inrAmount);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', backgroundColor: '#13261c', border: '1px solid #784524' }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #5c3a21',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color={isDisbursement ? '#fbbf24' : '#34d399'} />
            <span style={{ fontWeight: 700, color: '#fdfbf7', fontSize: '1rem' }}>
              {isDisbursement
                ? 'Relief Fund Disbursement & Expenditure Voucher'
                : 'Section 80G Tax Exemption Certificate (Income Tax Act, 1961)'}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#d4ded6',
              cursor: 'pointer',
              padding: '0.2rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Certificate Paper */}
        <div style={{ padding: '1.75rem' }}>
          <div
            id="printable-receipt"
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              borderRadius: '16px',
              padding: '2rem',
              border: '2px solid #cbd5e1',
              position: 'relative',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
            }}
          >
            {/* Top Seal & Organization Title */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '2px solid #0f172a',
                paddingBottom: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <Award size={18} color={isDisbursement ? '#b45309' : '#065f46'} />
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: isDisbursement ? '#b45309' : '#065f46',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {isDisbursement ? 'OFFICIAL DISBURSEMENT AUDIT VOUCHER' : 'FORM 10BE COMPLIANT CERTIFICATE'}
                  </span>
                </div>
                <h2
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 900,
                    color: isDisbursement ? '#78350f' : '#064e3b',
                    margin: 0,
                    letterSpacing: '-0.02em',
                  }}
                >
                  DISASTER RELIEF NATIONAL TRUST
                </h2>
                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>
                  NITI Aayog NGO Darpan UID: <strong>KA/2026/094218</strong> • PAN: <strong>AAATD1204P</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                  {isDisbursement
                    ? 'Disbursement Auth Ref: ITBA/RELIEF/DISB/2026-EXP'
                    : '80G Order No: ITBA/EXM/S/80G/2024-25/1062948120'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.65rem',
                    backgroundColor: isDisbursement ? '#fef3c7' : '#dcfce7',
                    color: isDisbursement ? '#92400e' : '#166534',
                    fontWeight: 800,
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    border: isDisbursement ? '1px solid #fcd34d' : '1px solid #86efac',
                  }}
                >
                  {isDisbursement ? 'VERIFIED DISBURSEMENT' : 'VERIFIED RECEIPT'}
                </span>
                <div
                  className="mono"
                  style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.35rem', fontWeight: 700 }}
                >
                  {receiptData.receiptId}
                </div>
              </div>
            </div>

            {/* Prominent Rupee Banner */}
            <div
              style={{
                backgroundColor: isDisbursement ? '#fffbeb' : '#f0fdf4',
                border: isDisbursement ? '1px solid #fde68a' : '1px solid #bbf7d0',
                borderRadius: '10px',
                padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: isDisbursement ? '#b45309' : '#166534',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  {isDisbursement ? 'Disbursement Amount Allocated (Indian Rupees)' : 'Donation Amount Received (Indian Rupees)'}
                </div>
                <div
                  style={{
                    fontSize: '1.65rem',
                    fontWeight: 900,
                    color: isDisbursement ? '#b45309' : '#15803d',
                    marginTop: '0.1rem',
                  }}
                >
                  {formatINR(inrAmount)}
                </div>
                <div style={{ fontSize: '0.8rem', color: isDisbursement ? '#b45309' : '#166534', fontStyle: 'italic', marginTop: '0.15rem' }}>
                  ({amountInWords})
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Crypto Equiv.</div>
                <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>
                  {receiptData.amountEth} ETH
                </div>
              </div>
            </div>

            {/* Receipt Body Table */}
            <div style={{ fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ color: '#64748b' }}>Date & Time:</span>
                <strong>{receiptData.timestamp}</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ color: '#64748b' }}>{isDisbursement ? 'Recipient / Vendor:' : 'Donor Identity:'}</span>
                <span className="mono" style={{ wordBreak: 'break-all', fontWeight: 700 }}>
                  {receiptData.donorAddress}
                </span>
              </div>

              {receiptData.donorPan && (
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Donor PAN Number:</span>
                  <strong className="mono" style={{ color: '#0284c7' }}>{receiptData.donorPan}</strong>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ color: '#64748b' }}>Designated Campaign:</span>
                <strong>{receiptData.campaignName}</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ color: '#64748b' }}>Tx / UTR Reference:</span>
                <span className="mono" style={{ fontSize: '0.8rem', color: '#334155', wordBreak: 'break-all' }}>
                  {receiptData.txHash}
                </span>
              </div>
            </div>

            {/* Statutory Notice */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px dashed #cbd5e1',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#475569',
                lineHeight: 1.4,
                marginBottom: '1.25rem',
              }}
            >
              {isDisbursement ? (
                <>
                  <strong>Disbursement Audit Certification:</strong> This expenditure voucher certifies authorized disbursement
                  of disaster relief escrow funds for verified field procurement, medical supplies, or humanitarian aid delivery.
                  Verifiable against the smart contract and relational database ledgers.
                </>
              ) : (
                <>
                  <strong>Statutory Declaration:</strong> Donations made to Disaster Relief National Trust qualify for 50%
                  deduction under Section 80G of the Income Tax Act, 1961. This digital certificate is authenticated and
                  verifiable against the smart contract and relational database ledgers.
                </>
              )}
            </div>

            {/* Footer with Signatory and Seal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingTop: '0.75rem',
                borderTop: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                <div>National Headquarters: Parliament Street, New Delhi 110001</div>
                <div>Web3 Network: Ethereum Sepolia Testnet (ID: {EXPECTED_CHAIN.chainId})</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: 'serif',
                    fontStyle: 'italic',
                    fontSize: '1.1rem',
                    color: '#064e3b',
                    fontWeight: 700,
                  }}
                >
                  S. K. Nambiar
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', borderTop: '1px solid #94a3b8', paddingTop: '0.2rem' }}>
                  Authorized Signatory & Trustee
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end',
              marginTop: '1.5rem',
            }}
          >
            {receiptData.txHash && receiptData.txHash.startsWith('0x') && (
              <a
                href={`${EXPECTED_CHAIN.blockExplorerUrl}/tx/${receiptData.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                <ExternalLink size={15} />
                View On Etherscan
              </a>
            )}

            <button onClick={handlePrint} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              <Printer size={15} />
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
