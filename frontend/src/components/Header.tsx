import React, { useState } from 'react';
import {
  ShieldAlert,
  Wallet,
  ExternalLink,
  Copy,
  Check,
  LogOut,
  AlertTriangle,
  Flame,
  PlusCircle,
  Sparkles,
  QrCode,
  Database,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { EXPECTED_CHAIN, CONTRACT_ADDRESS } from '../config/contract';
import { formatINR, ethToInr } from '../utils/currency';

interface HeaderProps {
  onOpenCreateCampaign: () => void;
  activeTab: 'campaigns' | 'transparency' | 'database' | 'admin' | 'owner';
  setActiveTab: (tab: 'campaigns' | 'transparency' | 'database' | 'admin' | 'owner') => void;
  onOpenQR?: () => void;
  isOwnerAuthenticated?: boolean;
  onOpenOwnerLogin?: () => void;
  onOwnerLogout?: () => void;
  ownerAddress?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateCampaign,
  activeTab,
  setActiveTab,
  onOpenQR,
  isOwnerAuthenticated = false,
  onOpenOwnerLogin,
  onOwnerLogout,
  ownerAddress,
}) => {
  const {
    isConnected,
    isConnecting,
    address,
    shortAddress,
    isCorrectNetwork,
    balance,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#0c1a13',
        borderBottom: '1px solid #5c3a21',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.65)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0.85rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Brand Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #78350f 0%, #92400e 45%, #b45309 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(180, 83, 9, 0.45)',
              border: '1px solid #c27838',
            }}
          >
            <ShieldAlert size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(to right, #fdfbf7 40%, #f6c492 75%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ReliefChain India
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  background: '#133523',
                  color: '#34d399',
                  border: '1px solid #236943',
                }}
              >
                80G TAX EXEMPT
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9cb0a1' }}>
              National Disaster Relief Portal • UPI & Web3 Transparent Ledger
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#112319',
            padding: '0.3rem',
            borderRadius: '12px',
            border: '1px solid #264232',
            gap: '0.25rem',
          }}
        >
          <button
            onClick={() => setActiveTab('campaigns')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: activeTab === 'campaigns' ? '1px solid #5c3a21' : '1px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s',
              background:
                activeTab === 'campaigns'
                  ? '#1c382a'
                  : 'transparent',
              color: activeTab === 'campaigns' ? '#fdfbf7' : '#d4ded6',
            }}
          >
            <Flame size={16} color={activeTab === 'campaigns' ? '#34d399' : '#9cb0a1'} />
            Campaigns
          </button>

          <button
            onClick={() => setActiveTab('transparency')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: activeTab === 'transparency' ? '1px solid #5c3a21' : '1px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s',
              background:
                activeTab === 'transparency'
                  ? '#1c382a'
                  : 'transparent',
              color: activeTab === 'transparency' ? '#fdfbf7' : '#d4ded6',
            }}
          >
            <Sparkles size={16} color={activeTab === 'transparency' ? '#f6c492' : '#9cb0a1'} />
            Audit & Transparency
          </button>

          {/* SQLite Relational Payments Database Tab */}
          <button
            onClick={() => setActiveTab('database')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: activeTab === 'database' ? '1px solid #236943' : '1px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s',
              background:
                activeTab === 'database'
                  ? '#163625'
                  : 'transparent',
              color: activeTab === 'database' ? '#34d399' : '#d4ded6',
            }}
          >
            <Database size={16} color={activeTab === 'database' ? '#34d399' : '#9cb0a1'} />
            Payments DB
          </button>

          {/* Owner Dashboard Tab - Strictly visible when authenticated as Owner */}
          {isOwnerAuthenticated && (
            <button
              onClick={() => setActiveTab('owner')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #8d5b2d',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s',
                background:
                  activeTab === 'owner'
                    ? '#34220b'
                    : '#221508',
                color: '#f6c492',
              }}
            >
              <ShieldAlert size={16} color="#f59e0b" />
              Owner Dashboard
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  background: '#b45309',
                  color: '#fff',
                  fontWeight: 800,
                }}
              >
                PRO
              </span>
            </button>
          )}
        </nav>

        {/* Action Controls & Wallet Connection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Distinct Owner Entry Point: Owner Sign-In (SIWE) or Owner Status */}
          {!isOwnerAuthenticated ? (
            onOpenOwnerLogin && (
              <button
                onClick={onOpenOwnerLogin}
                className="btn"
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.85rem',
                  gap: '0.4rem',
                  border: '1px solid #784524',
                  backgroundColor: '#26150b',
                  color: '#f6c492',
                  fontWeight: 600,
                }}
                title="Sign-In with Ethereum (Gasless Owner Authentication)"
              >
                <KeyRound size={16} />
                Owner Sign-In
              </button>
            )
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '8px',
                backgroundColor: '#26150b',
                border: '1px solid #784524',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#f6c492',
              }}
            >
              <ShieldCheck size={16} color="#fbbf24" />
              <span>Owner: {ownerAddress ? `${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}` : 'Active'}</span>
              {onOwnerLogout && (
                <button
                  onClick={onOwnerLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#f6c492',
                    cursor: 'pointer',
                    padding: '0 0 0 0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Sign Out as Owner"
                >
                  <LogOut size={13} />
                </button>
              )}
            </div>
          )}

          {/* Quick Action: Universal Scan & Pay QR */}
          {onOpenQR && (
            <button
              onClick={onOpenQR}
              className="btn"
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.85rem',
                gap: '0.4rem',
                border: '1px solid #784524',
                backgroundColor: '#1f160f',
                color: '#f6c492',
              }}
              title="Scan QR Code to pay via UPI, GPay, PhonePe, or Web3 ETH"
            >
              <QrCode size={16} />
              UPI / QR (₹)
            </button>
          )}

          {/* Quick Action: Create Campaign */}
          <button
            onClick={onOpenCreateCampaign}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            title="Create a new Relief Campaign"
          >
            <PlusCircle size={16} />
            New Campaign
          </button>

          {/* Network Badge */}
          {isConnected && (
            <>
              {isCorrectNetwork ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    backgroundColor: '#133523',
                    border: '1px solid #236943',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#34d399',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      boxShadow: '0 0 8px #10b981',
                    }}
                  />
                  {EXPECTED_CHAIN.name}
                </div>
              ) : (
                <button
                  onClick={switchNetwork}
                  className="btn btn-warning"
                  style={{
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.8rem',
                    gap: '0.35rem',
                  }}
                  title="Click to switch to Sepolia"
                >
                  <AlertTriangle size={15} />
                  Wrong Network (Switch to Sepolia)
                </button>
              )}
            </>
          )}

          {/* Wallet Button */}
          {!isConnected ? (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="btn btn-primary"
              style={{ minWidth: '155px' }}
            >
              <Wallet size={18} />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '12px',
                  backgroundColor: '#162e22',
                  border: '1px solid #5c3a21',
                  color: '#fdfbf7',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {/* User Avatar circle */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #78350f, #b45309)',
                  }}
                />
                <span className="mono">{shortAddress}</span>
                {balance && (
                  <span
                    style={{
                      padding: '0.15rem 0.45rem',
                      borderRadius: '6px',
                      backgroundColor: '#0c1a13',
                      border: '1px solid #264232',
                      fontSize: '0.75rem',
                      color: '#34d399',
                    }}
                  >
                    {balance} ETH (≈ {formatINR(ethToInr(balance))})
                  </span>
                )}
              </button>

              {/* Wallet Dropdown Menu */}
              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '260px',
                    backgroundColor: '#13261c',
                    border: '1px solid #5c3a21',
                    borderRadius: '14px',
                    padding: '0.75rem',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.75)',
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#9cb0a1',
                      padding: '0.25rem 0.5rem',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}
                  >
                    Connected Account
                  </div>

                  <div
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#0c1a13',
                      border: '1px solid #264232',
                      borderRadius: '8px',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div
                      className="mono"
                      style={{
                        fontSize: '0.8rem',
                        wordBreak: 'break-all',
                        color: '#fdfbf7',
                      }}
                    >
                      {address}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <button
                      onClick={copyAddress}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: 'none',
                        color: '#d4ded6',
                        cursor: 'pointer',
                        fontSize: '0.825rem',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                        {copied ? 'Copied to clipboard' : 'Copy Address'}
                      </span>
                    </button>

                    <a
                      href={`${EXPECTED_CHAIN.blockExplorerUrl}/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        color: '#d4ded6',
                        textDecoration: 'none',
                        fontSize: '0.825rem',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ExternalLink size={14} />
                        View on Etherscan
                      </span>
                    </a>

                    <div
                      style={{
                        height: '1px',
                        backgroundColor: '#264232',
                        margin: '0.25rem 0',
                      }}
                    />

                    <button
                      onClick={() => {
                        disconnectWallet();
                        setDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        background: '#391419',
                        border: '1px solid #78232c',
                        color: '#fb7185',
                        cursor: 'pointer',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                      }}
                    >
                      <LogOut size={14} />
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contract Reference Info Banner */}
      <div
        style={{
          borderTop: '1px solid #264232',
          backgroundColor: '#09150f',
          padding: '0.35rem 1.5rem',
          fontSize: '0.75rem',
          color: '#9cb0a1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Contract ({EXPECTED_CHAIN.name}):</span>
          <a
            href={`${EXPECTED_CHAIN.blockExplorerUrl}/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mono"
            style={{
              color: '#f6c492',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            {CONTRACT_ADDRESS}
            <ExternalLink size={12} />
          </a>
        </div>
        <div>
          <span>Target Chain ID: </span>
          <span className="mono" style={{ color: '#d4ded6' }}>
            {EXPECTED_CHAIN.chainId} ({EXPECTED_CHAIN.chainIdHex})
          </span>
        </div>
      </div>
    </header>
  );
};
