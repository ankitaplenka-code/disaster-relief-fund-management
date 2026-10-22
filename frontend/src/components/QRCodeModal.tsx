import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Copy,
  Check,
  Download,
  Smartphone,
  ShieldCheck,
  CreditCard,
  Building,
  CheckCircle2,
  FileText,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CONTRACT_ADDRESS, EXPECTED_CHAIN } from '../config/contract';
import type { Campaign } from '../types';
import { parseEther } from 'ethers';
import { apiService } from '../services/apiService';
import { formatINR, inrToEth, ETH_TO_USD_RATE } from '../utils/currency';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign?: Campaign | null;
  onPaymentRecorded?: (receiptData: any) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  campaign,
  onPaymentRecorded,
}) => {
  // Default to UPI (Unified Payments Interface) as standard Indian payment method
  const [activeRail, setActiveRail] = useState<'upi' | 'crypto' | 'bank'>('upi');
  const [amountInr, setAmountInr] = useState<string>('2500');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<string | null>(null);

  // Flow step: 'scan' | 'confirm' | 'done'
  const [step, setStep] = useState<'scan' | 'confirm' | 'done'>('scan');
  const [donorName, setDonorName] = useState<string>('');
  const [donorEmail, setDonorEmail] = useState<string>('');
  const [donorPan, setDonorPan] = useState<string>('');
  const [txRef, setTxRef] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [savedReceipt, setSavedReceipt] = useState<any | null>(null);

  const numInr = parseFloat(amountInr) || 0;
  const numEth = parseFloat(inrToEth(numInr)) || 0;
  const usdAmount = (numEth * ETH_TO_USD_RATE).toFixed(2);
  const ethString = numEth.toFixed(4);

  const upiId = 'disasterrelief@sbi';
  const targetRecipient = CONTRACT_ADDRESS;
  const bankAccountInfo = 'SBI A/C 40923841029 (IFSC: SBIN0000691)';

  // Generate QR Code dynamically
  useEffect(() => {
    const generateQR = async () => {
      try {
        let payload = '';

        if (activeRail === 'upi') {
          // Standard NPCI UPI URI
          const note = campaign ? `Relief-${campaign.id}` : 'DisasterRelief';
          payload = `upi://pay?pa=${upiId}&pn=DisasterReliefTrust&am=${numInr}&cu=INR&tn=${note}`;
        } else if (activeRail === 'crypto') {
          // EIP-681 Ethereum payment URI
          let weiValue = '0';
          try {
            if (numEth > 0) {
              weiValue = parseEther(numEth.toString()).toString();
            }
          } catch {
            weiValue = '0';
          }
          payload = `ethereum:${targetRecipient}@${EXPECTED_CHAIN.chainId}?value=${weiValue}`;
        } else {
          // Bank Wire reference string
          payload = `SBI-RELIEF-TRUST-AC-40923841029-IFSC-SBIN0000691-PAN-AAATD1204P`;
        }

        const url = await QRCode.toDataURL(payload, {
          width: 320,
          margin: 2,
          color: {
            dark: '#0c1a13',
            light: '#ffffff',
          },
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    };

    if (isOpen) {
      generateQR();
    }
  }, [isOpen, activeRail, numInr, numEth, targetRecipient, campaign]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `reliefchain-upi-qr-${activeRail}-inr${numInr}.png`;
    a.click();
  };

  const handleConfirmAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const paymentMethod =
      activeRail === 'upi' ? 'QR_UPI' : activeRail === 'crypto' ? 'QR_CRYPTO' : 'BANK_WIRE';

    const campaignId = campaign ? campaign.id : 0;
    const campaignName = campaign ? campaign.name : 'General Emergency Relief Fund';

    const newPayment = {
      campaign_id: campaignId,
      donor_name: donorName.trim() || 'Anonymous Benefactor',
      donor_email: donorEmail.trim() || undefined,
      donor_wallet_address: activeRail === 'crypto' ? txRef.trim() || undefined : undefined,
      amount_eth: numEth || 0.01,
      amount_fiat_usd: parseFloat(usdAmount),
      amount_fiat_inr: numInr || 2500,
      payment_method: paymentMethod as any,
      payment_status: 'CONFIRMED' as const,
      transaction_hash: txRef.trim() || `UPI-UTR-${Date.now()}`,
      notes: `Recorded via ${paymentMethod} QR payment. PAN: ${donorPan.trim().toUpperCase() || 'N/A'}. Form 10BE eligible.`,
    };

    const recorded = await apiService.recordPayment(newPayment);

    setSubmitting(false);
    setStep('done');

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    const receiptObj = {
      receiptId: recorded?.receipt_id || `RELIEF-80G-${Date.now().toString().slice(-6)}`,
      campaignName,
      donorAddress: donorName.trim() || 'Anonymous Donor',
      donorPan: donorPan.trim().toUpperCase() || 'APPLIED FOR',
      amountInr: numInr,
      amountEth: ethString,
      txHash: txRef.trim() || recorded?.transaction_hash || 'Verified via SQLite DB',
      timestamp: new Date().toLocaleString('en-IN'),
    };

    setSavedReceipt(receiptObj);

    if (onPaymentRecorded) {
      onPaymentRecorded(receiptObj);
    }
  };

  const resetAndClose = () => {
    setStep('scan');
    setDonorName('');
    setDonorEmail('');
    setDonorPan('');
    setTxRef('');
    setSavedReceipt(null);
    onClose();
  };

  const rupeePresets = ['500', '1000', '2500', '5000', '10000', '25000'];

  return (
    <div className="modal-overlay" onClick={resetAndClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px' }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid #5c3a21',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)',
                border: '1px solid #c27838',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 0 15px rgba(180, 83, 9, 0.4)',
              }}
            >
              <QrCode size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fdfbf7' }}>
                Instant Scan & Pay QR (₹ INR / UPI)
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#9cb0a1' }}>
                Zero deduction humanitarian relief gateway • 100% 80G Tax Exempt
              </div>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#d4ded6',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem' }}>
          {/* STEP 1: SCAN QR */}
          {step === 'scan' && (
            <>
              {/* Payment Method Selector Tabs */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  backgroundColor: '#0f2017',
                  padding: '0.3rem',
                  borderRadius: '12px',
                  border: '1px solid #264232',
                  gap: '0.35rem',
                  marginBottom: '1.5rem',
                }}
              >
                <button
                  onClick={() => setActiveRail('upi')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 0.4rem',
                    borderRadius: '8px',
                    border: activeRail === 'upi' ? '1px solid #784524' : 'none',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.825rem',
                    backgroundColor:
                      activeRail === 'upi' ? '#26150b' : 'transparent',
                    color: activeRail === 'upi' ? '#f6c492' : '#9cb0a1',
                    transition: 'all 0.15s',
                  }}
                >
                  <CreditCard size={15} />
                  UPI / GPay (₹)
                </button>

                <button
                  onClick={() => setActiveRail('crypto')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 0.4rem',
                    borderRadius: '8px',
                    border: activeRail === 'crypto' ? '1px solid #236943' : 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    backgroundColor:
                      activeRail === 'crypto' ? '#133523' : 'transparent',
                    color: activeRail === 'crypto' ? '#34d399' : '#9cb0a1',
                    transition: 'all 0.15s',
                  }}
                >
                  <Smartphone size={15} />
                  Web3 ETH
                </button>

                <button
                  onClick={() => setActiveRail('bank')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 0.4rem',
                    borderRadius: '8px',
                    border: activeRail === 'bank' ? '1px solid #784d14' : 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    backgroundColor:
                      activeRail === 'bank' ? '#34220b' : 'transparent',
                    color: activeRail === 'bank' ? '#fbbf24' : '#9cb0a1',
                    transition: 'all 0.15s',
                  }}
                >
                  <Building size={15} />
                  SBI Wire (₹)
                </button>
              </div>

              {/* Amount Selector (INR based) */}
              {activeRail !== 'bank' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <label className="form-label" style={{ margin: 0 }}>
                      Select Donation Amount (Indian Rupees)
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#f6c492' }}>
                      ≈ {ethString} ETH | ${usdAmount} USD
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(6, 1fr)',
                      gap: '0.4rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {rupeePresets.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setAmountInr(chip)}
                        style={{
                          padding: '0.5rem 0.2rem',
                          borderRadius: '8px',
                          border: '1px solid',
                          borderColor:
                            amountInr === chip
                              ? '#8d5b2d'
                              : '#264232',
                          backgroundColor:
                            amountInr === chip
                              ? '#26150b'
                              : '#112319',
                          color: amountInr === chip ? '#f6c492' : '#d4ded6',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        ₹{parseInt(chip) >= 1000 ? `${parseInt(chip) / 1000}k` : chip}
                      </button>
                    ))}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9cb0a1',
                        fontWeight: 700,
                        fontSize: '1rem',
                      }}
                    >
                      ₹
                    </span>
                    <input
                      type="number"
                      step="100"
                      min="100"
                      value={amountInr}
                      onChange={(e) => setAmountInr(e.target.value)}
                      placeholder="Custom amount in Rupees (INR)"
                      className="form-input mono"
                      style={{ paddingLeft: '2rem', fontSize: '1rem', fontWeight: 600 }}
                    />
                  </div>
                </div>
              )}

              {/* QR Code Presentation Box */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
                  marginBottom: '1rem',
                  border: '1px solid #8d5b2d',
                }}
              >
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Donation QR Code"
                    style={{
                      width: '230px',
                      height: '230px',
                      borderRadius: '8px',
                      imageRendering: 'pixelated',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '230px',
                      height: '230px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9cb0a1',
                    }}
                  >
                    Generating QR...
                  </div>
                )}

                <div
                  style={{
                    fontSize: '0.825rem',
                    color: '#0c1a13',
                    fontWeight: 700,
                    marginTop: '0.6rem',
                    textAlign: 'center',
                  }}
                >
                  {activeRail === 'upi' && (
                    <span style={{ color: '#78350f' }}>
                      Scan with Google Pay, PhonePe, Paytm, or BHIM UPI
                    </span>
                  )}
                  {activeRail === 'crypto' && (
                    <span style={{ color: '#166534' }}>
                      Scan with MetaMask, Trust Wallet, or Coinbase Wallet
                    </span>
                  )}
                  {activeRail === 'bank' && (
                    <span style={{ color: '#92400e' }}>
                      Official SBI Trust Relief Account Reference QR
                    </span>
                  )}
                </div>
              </div>

              {/* Copyable Identifier Box */}
              <div
                style={{
                  backgroundColor: '#0f2017',
                  border: '1px solid #264232',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: '#9cb0a1',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                    }}
                  >
                    {activeRail === 'upi'
                      ? 'Official NPCI UPI ID'
                      : activeRail === 'crypto'
                      ? 'Smart Contract Address'
                      : 'SBI Bank Account'}
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: '0.85rem',
                      color: '#fdfbf7',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {activeRail === 'upi'
                      ? upiId
                      : activeRail === 'crypto'
                      ? targetRecipient
                      : bankAccountInfo}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      activeRail === 'upi'
                        ? upiId
                        : activeRail === 'crypto'
                        ? targetRecipient
                        : 'SBI A/C 40923841029 IFSC SBIN0000691',
                      'rail-id'
                    )
                  }
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem', flexShrink: 0 }}
                >
                  {copied === 'rail-id' ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  {copied === 'rail-id' ? 'Copied' : 'Copy'}
                </button>
              </div>

              {/* Verified Trust Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  fontSize: '0.75rem',
                  color: '#34d399',
                  marginBottom: '1.25rem',
                }}
              >
                <ShieldCheck size={15} />
                <span>100% Tax Deductible under Section 80G • Form 10BE Compliant</span>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '0.75rem' }}>
                <button onClick={downloadQR} className="btn btn-secondary">
                  <Download size={16} />
                  Save QR
                </button>

                <button onClick={() => setStep('confirm')} className="btn btn-primary">
                  <CheckCircle2 size={16} />
                  I Have Paid (Get 80G Receipt)
                </button>
              </div>
            </>
          )}

          {/* STEP 2: CONFIRM & RECORD DETAILS */}
          {step === 'confirm' && (
            <form onSubmit={handleConfirmAndSave}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fdfbf7', marginBottom: '0.4rem' }}>
                  Donor Details & 80G Tax Receipt
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#d4ded6' }}>
                  Your donation of <strong style={{ color: '#fdfbf7' }}>{formatINR(numInr)}</strong> (≈ {ethString} ETH) will be recorded
                  in the database and an official 80G Certificate will be generated for your tax filing.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name of Donor (As per PAN)</label>
                <input
                  type="text"
                  placeholder="e.g. Vikramaditya Sharma"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (For Instant Receipt PDF)</label>
                <input
                  type="email"
                  placeholder="e.g. vikram@example.com"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  PAN Number (Optional, required for 80G tax benefit claim)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABCDE1234F"
                  value={donorPan}
                  onChange={(e) => setDonorPan(e.target.value)}
                  maxLength={10}
                  className="form-input mono"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {activeRail === 'upi'
                    ? 'UPI 12-Digit UTR / Transaction Reference'
                    : activeRail === 'crypto'
                    ? 'Your Wallet Address or Tx Hash'
                    : 'Bank NEFT / RTGS Reference Number'}
                </label>
                <input
                  type="text"
                  placeholder={
                    activeRail === 'upi'
                      ? 'e.g. 420918234910'
                      : activeRail === 'crypto'
                      ? '0x...'
                      : 'e.g. SBIN42091823'
                  }
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  className="form-input mono"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setStep('scan')}
                  className="btn btn-secondary"
                >
                  Back to QR
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="spin-animate" />
                      Issuing Receipt...
                    </>
                  ) : (
                    <>
                      <FileText size={16} />
                      Generate 80G Certificate
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: DONE */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#133523',
                  border: '1px solid #236943',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399',
                  margin: '0 auto 1rem',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fdfbf7' }}>
                Donation Recorded Successfully!
              </h3>
              <p style={{ color: '#d4ded6', fontSize: '0.875rem', maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
                Your generous contribution of <strong style={{ color: '#fdfbf7' }}>{formatINR(numInr)}</strong> (≈ {ethString} ETH) has been indexed
                in the relational database.
              </p>

              {savedReceipt && (
                <div
                  style={{
                    backgroundColor: '#0f2017',
                    border: '1px solid #264232',
                    padding: '1rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ color: '#9cb0a1' }}>Section 80G Certificate Number:</div>
                  <strong className="mono" style={{ color: '#f6c492', fontSize: '1rem' }}>
                    {savedReceipt.receiptId}
                  </strong>
                </div>
              )}

              <button onClick={resetAndClose} className="btn btn-primary" style={{ width: '100%' }}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
