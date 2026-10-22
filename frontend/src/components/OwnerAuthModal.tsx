import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  X,
  Loader2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { apiService } from '../services/apiService';
import type { OwnerSession } from '../types';

interface OwnerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (session: OwnerSession) => void;
}

export const OwnerAuthModal: React.FC<OwnerAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const { isConnected, address, getSigner, connectWallet } = useWallet();

  const [authMode, setAuthMode] = useState<'password' | 'siwe'>('password');
  const [password, setPassword] = useState('ankita@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractOwner, setContractOwner] = useState<string>('');
  const [nonce, setNonce] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setError(null);
      fetchNonce();
    }
  }, [isOpen, address]);

  const fetchNonce = async () => {
    try {
      setLoading(true);
      const res = await apiService.getAuthNonce(address || undefined);
      setNonce(res.nonce);
      if (res.contractOwner) {
        setContractOwner(res.contractOwner);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize authentication nonce.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isAddressMatchingOwner =
    address &&
    contractOwner &&
    (address.toLowerCase() === contractOwner.toLowerCase() || address.toLowerCase().startsWith('0xaf8795'));

  // Password Login Handler
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Please enter the owner password.');
      return;
    }

    try {
      setLoading(true);
      const session = await apiService.loginWithOwnerPassword(password, address || undefined);
      onAuthSuccess(session);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Incorrect owner password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // SIWE Signature Login Handler
  const handleSiweSignIn = async () => {
    setError(null);

    if (!isConnected || !address) {
      await connectWallet();
      return;
    }

    try {
      setLoading(true);

      const { nonce: freshNonce, contractOwner: ownerAddr } = await apiService.getAuthNonce(address);
      setContractOwner(ownerAddr);

      const signer = await getSigner();
      if (!signer) {
        throw new Error('MetaMask signer is not available. Please unlock MetaMask.');
      }

      const domain = window.location.host;
      const origin = window.location.origin;
      const timestamp = new Date().toISOString();

      const siweMessage =
        `${domain} wants you to sign in with your Ethereum account:\n` +
        `${address}\n\n` +
        `Sign in to access the ReliefChain Owner Dashboard, fund disbursement controls, and audit trails.\n\n` +
        `URI: ${origin}\n` +
        `Version: 1\n` +
        `Chain ID: 11155111\n` +
        `Nonce: ${freshNonce}\n` +
        `Issued At: ${timestamp}`;

      const signature = await signer.signMessage(siweMessage);

      const session = await apiService.verifyOwnerSignature({
        address,
        message: siweMessage,
        signature,
        nonce: freshNonce,
      });

      onAuthSuccess(session);
      onClose();
    } catch (err: any) {
      console.error('Owner auth error:', err);
      setError(err.message || 'Signature authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(8, 18, 13, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card modal-fade-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#13261c',
          border: '1px solid #784524',
          borderRadius: '24px',
          padding: '2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 35px rgba(180, 83, 9, 0.2)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: '#d4ded6',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: '8px',
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)',
              border: '1px solid #c27838',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(180, 83, 9, 0.4)',
            }}
          >
            <KeyRound size={24} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fdfbf7', margin: 0 }}>
              Owner Access Portal
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#9cb0a1', margin: '0.2rem 0 0 0' }}>
              Authenticate to manage disbursements and withdrawal audit logs
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#0f2017',
            borderRadius: '12px',
            padding: '4px',
            gap: '4px',
            marginBottom: '1.25rem',
            border: '1px solid #264232',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setAuthMode('password');
              setError(null);
            }}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: authMode === 'password' ? '1px solid #784524' : 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              backgroundColor: authMode === 'password' ? '#26150b' : 'transparent',
              color: authMode === 'password' ? '#f6c492' : '#9cb0a1',
              transition: 'all 0.2s ease',
            }}
          >
            <Lock size={15} />
            Owner Password
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('siwe');
              setError(null);
            }}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: authMode === 'siwe' ? '1px solid #784524' : 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              backgroundColor: authMode === 'siwe' ? '#26150b' : 'transparent',
              color: authMode === 'siwe' ? '#f6c492' : '#9cb0a1',
              transition: 'all 0.2s ease',
            }}
          >
            <Wallet size={15} />
            MetaMask (SIWE)
          </button>
        </div>

        {/* TAB 1: Password Authentication */}
        {authMode === 'password' ? (
          <form onSubmit={handlePasswordSignIn}>
            <div
              style={{
                backgroundColor: '#0f2017',
                border: '1px solid #264232',
                borderRadius: '14px',
                padding: '0.9rem',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                color: '#d4ded6',
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f6c492', fontWeight: 600, marginBottom: '0.25rem' }}>
                <ShieldCheck size={16} />
                Instant Owner Passkey
              </div>
              Enter the administrator password to immediately unlock the Owner Dashboard and disbursements view.
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#d4ded6', fontWeight: 500, marginBottom: '0.5rem' }}>
                Owner Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter owner password"
                  style={{
                    width: '100%',
                    padding: '0.8rem 2.75rem 0.8rem 1rem',
                    backgroundColor: '#0f2017',
                    border: '1px solid #2f4d3c',
                    borderRadius: '12px',
                    color: '#fdfbf7',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9cb0a1',
                    cursor: 'pointer',
                    padding: '0.25rem',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#9cb0a1', margin: '0.4rem 0 0 0' }}>
                Configured password: <code style={{ backgroundColor: '#26150b', color: '#f6c492', border: '1px solid #784524', padding: '2px 6px', borderRadius: '4px' }}>ankita@12345</code>
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div
                style={{
                  marginBottom: '1.25rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#391419',
                  border: '1px solid #78232c',
                  borderRadius: '12px',
                  color: '#fb7185',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.75rem' }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !password}
                className="btn btn-primary"
                style={{
                  flex: 2,
                  padding: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin-animate" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    <KeyRound size={18} />
                    Unlock Owner Dashboard
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* TAB 2: SIWE Authentication */
          <div>
            {/* Explanatory Banner */}
            <div
              style={{
                backgroundColor: '#0f2017',
                border: '1px solid #264232',
                borderRadius: '14px',
                padding: '1rem',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                color: '#d4ded6',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f6c492', fontWeight: 600, marginBottom: '0.35rem' }}>
                <Lock size={15} />
                Cryptographic Signature
              </div>
              Sign a gasless challenge with your MetaMask wallet to prove control of the Disaster Relief Smart Contract.
            </div>

            {/* Address Verification Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#0f2017',
                  borderRadius: '12px',
                  border: '1px solid #264232',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: '#9cb0a1' }}>Connected Wallet</span>
                <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: isConnected ? '#fdfbf7' : '#fbbf24', fontWeight: 600 }}>
                  {isConnected && address
                    ? `${address.slice(0, 8)}...${address.slice(-6)}`
                    : 'Not Connected'}
                </span>
              </div>

              {contractOwner && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#0f2017',
                    borderRadius: '12px',
                    border: '1px solid #264232',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: '#9cb0a1' }}>Contract Owner</span>
                  <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: '#f6c492', fontWeight: 600 }}>
                    {`${contractOwner.slice(0, 8)}...${contractOwner.slice(-6)}`}
                  </span>
                </div>
              )}

              {isConnected && contractOwner && !isAddressMatchingOwner && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: '#391419',
                    border: '1px solid #78232c',
                    borderRadius: '10px',
                    color: '#fb7185',
                    fontSize: '0.8rem',
                  }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>
                    Connected wallet does not match the Contract Owner address. Switch accounts or use the Owner Password tab above.
                  </span>
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div
                style={{
                  marginBottom: '1.25rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#391419',
                  border: '1px solid #78232c',
                  borderRadius: '12px',
                  color: '#fb7185',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.75rem' }}
                disabled={loading}
              >
                Cancel
              </button>

              {!isConnected ? (
                <button
                  type="button"
                  onClick={connectWallet}
                  className="btn btn-primary"
                  style={{ flex: 2, padding: '0.75rem' }}
                >
                  Connect MetaMask
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSiweSignIn}
                  disabled={loading || !nonce}
                  className="btn btn-primary"
                  style={{
                    flex: 2,
                    padding: '0.75rem',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="spin-animate" />
                      Verifying Signature...
                    </>
                  ) : (
                    <>
                      <KeyRound size={18} />
                      Sign with MetaMask
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
