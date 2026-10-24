import React, { useState, useEffect, useCallback } from 'react';
import { parseEther } from 'ethers';
import { WalletProvider, useWallet } from './context/WalletContext';
import { Header } from './components/Header';
import { CrisisTicker } from './components/CrisisTicker';
import { CampaignList } from './components/CampaignList';
import { TransparencyAudit } from './components/TransparencyAudit';
import { AdminPanel } from './components/AdminPanel';
import { OwnerDashboard } from './components/OwnerDashboard';
import { OwnerAuthModal } from './components/OwnerAuthModal';
import { DonationCelebration3D } from './components/3d/DonationCelebration3D';
import { DonationModal } from './components/DonationModal';
import { CreateCampaignModal } from './components/CreateCampaignModal';
import { QRCodeModal } from './components/QRCodeModal';
import { ReceiptModal } from './components/ReceiptModal';
import { DatabaseLedger } from './components/DatabaseLedger';
import { ToastContainer } from './components/Toast';
import { contractService, addCampaignDonationRaised } from './services/contractService';
import { apiService } from './services/apiService';
import { AmbientBackground } from './components/AmbientBackground';
import { EXPECTED_CHAIN, CONTRACT_ADDRESS } from './config/contract';
import type { Campaign, DonationRecord, ToastMessage, OwnerSession } from './types';
import { ShieldCheck, ExternalLink, RefreshCw, QrCode } from 'lucide-react';

const DashboardInner: React.FC = () => {
  const { error: walletError } = useWallet();

  const [activeTab, setActiveTab] = useState<
    'campaigns' | 'transparency' | 'database' | 'admin' | 'owner'
  >('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Phase 4 & 5: Owner Authentication & Profile State
  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState<boolean>(false);
  const [ownerSession, setOwnerSession] = useState<OwnerSession | null>(null);
  const [isOwnerAuthModalOpen, setIsOwnerAuthModalOpen] = useState<boolean>(false);

  // Phase 4: Interactive 3D Donation Celebration State
  const [celebrationData, setCelebrationData] = useState<{
    campaignName: string;
    amountEth: string;
  } | null>(null);

  // Modal states
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedAuditCampaignId, setSelectedAuditCampaignId] = useState<number | null>(null);

  // Real Funds Generating additions: QR & Receipt states
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [selectedCampaignForQR, setSelectedCampaignForQR] = useState<Campaign | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [receiptData, setReceiptData] = useState<{
    receiptId: string;
    campaignName: string;
    donorAddress: string;
    amountEth: string;
    txHash: string;
    timestamp: string;
  } | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration || 5000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Restore stored owner session on mount
  useEffect(() => {
    const stored = apiService.getStoredOwnerSession();
    if (stored) {
      setOwnerSession(stored);
      setIsOwnerAuthenticated(true);
      apiService.verifyCurrentSession().then((isValid) => {
        if (!isValid) {
          setOwnerSession(null);
          setIsOwnerAuthenticated(false);
        }
      });
    }
  }, []);

  // Surface wallet errors as toasts
  useEffect(() => {
    if (walletError) {
      addToast({
        type: 'error',
        title: 'Wallet Notice',
        message: walletError,
      });
    }
  }, [walletError, addToast]);

  // Phase 5: Fetch public on-chain data ONLY (never fetches withdrawals in public view)
  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [campData, donData] = await Promise.all([
        contractService.fetchCampaigns(),
        contractService.fetchDonations(),
      ]);

      setCampaigns(campData);
      setDonations(donData);
    } catch (err) {
      console.error('Failed to load public contract data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open donation modal
  const handleOpenDonate = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDonationModalOpen(true);
  };

  // Open QR modal for specific or general appeal
  const handleOpenQR = (campaign?: Campaign) => {
    setSelectedCampaignForQR(campaign || null);
    setIsQRModalOpen(true);
  };

  // Open transparency tab filtered to specific campaign
  const handleSelectCampaignForAudit = (campaignId: number) => {
    setSelectedAuditCampaignId(campaignId);
    setActiveTab('transparency');
  };

  // Handle owner logout
  const handleOwnerLogout = async () => {
    await apiService.logoutOwner();
    setOwnerSession(null);
    setIsOwnerAuthenticated(false);
    if (activeTab === 'owner') {
      setActiveTab('campaigns');
    }
    addToast({
      type: 'info',
      title: 'Owner Signed Out',
      message: 'Exclusive owner session cleared. Switched to public view.',
    });
  };

  // Handle donation success (Triggers 3D celebration burst + optimistic update)
  const handleDonationSuccess = (campaignId: number, ethAmount: string, txHash: string) => {
    const matched = campaigns.find((c) => c.id === campaignId);
    const cName = matched ? matched.name : `Campaign #${campaignId}`;

    // Trigger Phase 4: 3D celebratory particle burst
    setCelebrationData({
      campaignName: cName,
      amountEth: ethAmount,
    });

    addToast({
      type: 'success',
      title: 'Donation Confirmed on Chain!',
      message: `Successfully sent ${ethAmount} ETH to ${cName}.`,
      txHash,
    });

    // Update campaign balance optimistically and refresh
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === campaignId) {
          const currentRaised = parseFloat(c.amountRaised);
          const newRaised = (currentRaised + parseFloat(ethAmount)).toFixed(3);
          const targetNum = parseFloat(c.target);
          const newProgress = Math.min(100, Math.round((parseFloat(newRaised) / targetNum) * 100));
          return {
            ...c,
            amountRaised: newRaised,
            progressPercent: newProgress,
            status: newProgress >= 100 ? 'Funded' : c.status,
          };
        }
        return c;
      })
    );

    // Persist additional raised amount so it never resets on refresh
    addCampaignDonationRaised(campaignId, parseFloat(ethAmount));

    // Immediately record in public donations list for Transparency & Audit
    const donorAddr = (window as any).ethereum?.selectedAddress || '0xVerifiedSupporter';
    const newDonation: DonationRecord = {
      id: `don-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      campaignId,
      campaignName: cName,
      donor: donorAddr,
      amount: ethAmount,
      amountWei: parseEther(ethAmount),
      timestamp: Math.floor(Date.now() / 1000),
      timestampFormatted: 'Just now',
      transactionHash: txHash,
    };
    setDonations((prev) => [newDonation, ...prev]);

    setTimeout(() => {
      loadData();
    }, 1500);
  };

  // Handle withdrawal success (from OwnerDashboard)
  const handleWithdrawSuccess = () => {
    addToast({
      type: 'success',
      title: 'Disbursement Complete',
      message: 'Funds disbursed on-chain and recorded into the payment DB audit ledger.',
    });
    setTimeout(() => {
      loadData();
    }, 1500);
  };

  // Handle campaign created
  const handleCampaignCreated = (newCampaign: Campaign) => {
    addToast({
      type: 'success',
      title: 'Campaign Created',
      message: `"${newCampaign.name}" is now live and accepting contributions.`,
    });
    setCampaigns((prev) => {
      const exists = prev.some((c) => c.id === newCampaign.id || c.name === newCampaign.name);
      if (exists) return prev;
      return [newCampaign, ...prev];
    });
    setActiveTab('campaigns');
    setTimeout(() => {
      loadData();
    }, 1500);
  };

  return (
    <div className="app-container" style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Ambient Layered Background System with Drift, Particles & Parallax */}
      <AmbientBackground />

      {/* Live Crisis Ticker Banner */}
      <CrisisTicker onOpenQR={() => handleOpenQR()} />

      {/* Header with Distinct Owner Sign-In & Dashboard Tabs */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateCampaign={() => setIsCreateModalOpen(true)}
        onOpenQR={() => handleOpenQR()}
        isOwnerAuthenticated={isOwnerAuthenticated}
        onOpenOwnerLogin={() => setIsOwnerAuthModalOpen(true)}
        onOwnerLogout={handleOwnerLogout}
        ownerAddress={ownerSession?.ownerAddress}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Controls Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '1rem',
          }}
        >
          <button
            onClick={loadData}
            disabled={refreshing}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.35rem' }}
            title="Refresh public on-chain data"
          >
            <RefreshCw size={14} className={refreshing ? 'spin-animate' : ''} />
            {refreshing ? 'Syncing On-Chain...' : 'Refresh Chain State'}
          </button>
        </div>

        {/* Tab Views with Smooth Mount Fade & Slide */}
        <div key={activeTab} className="tab-content-enter">
          {activeTab === 'campaigns' && (
            <CampaignList
              campaigns={campaigns}
              loading={loading}
              onDonateClick={handleOpenDonate}
              onSelectCampaignForAudit={handleSelectCampaignForAudit}
              onOpenQR={handleOpenQR}
              onOpenCreateCampaign={() => setIsCreateModalOpen(true)}
            />
          )}

          {activeTab === 'transparency' && (
            <TransparencyAudit
              donations={donations}
              campaigns={campaigns}
              selectedCampaignId={selectedAuditCampaignId}
              onClearFilter={() => setSelectedAuditCampaignId(null)}
            />
          )}

          {activeTab === 'database' && (
            <DatabaseLedger
              campaigns={campaigns}
              onViewReceipt={(data) => {
                setReceiptData(data);
                setIsReceiptModalOpen(true);
              }}
            />
          )}

          {activeTab === 'admin' && (
            <AdminPanel
              campaigns={campaigns}
              onWithdrawSuccess={handleWithdrawSuccess}
              onOpenCreateCampaign={() => setIsCreateModalOpen(true)}
            />
          )}

          {activeTab === 'owner' && ownerSession && (
            <OwnerDashboard
              campaigns={campaigns}
              ownerSession={ownerSession}
              onLogout={handleOwnerLogout}
              onWithdrawSuccess={handleWithdrawSuccess}
            />
          )}
        </div>
      </main>

      {/* Floating Global Quick QR Button */}
      <button
        onClick={() => handleOpenQR()}
        className="floating-qr-pulse"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '1.5rem',
          zIndex: 900,
          backgroundColor: '#162e22',
          border: '1px solid #8d5b2d',
          color: '#f6c492',
          padding: '0.65rem 1.1rem',
          borderRadius: '9999px',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.7), 0 0 15px rgba(180, 83, 9, 0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 700,
          fontSize: '0.85rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <QrCode size={18} />
        Scan to Donate (QR)
      </button>

      {/* Sign-In with Ethereum (SIWE) Owner Authentication Modal */}
      <OwnerAuthModal
        isOpen={isOwnerAuthModalOpen}
        onClose={() => setIsOwnerAuthModalOpen(false)}
        onAuthSuccess={(session) => {
          setOwnerSession(session);
          setIsOwnerAuthenticated(true);
          setActiveTab('owner');
          addToast({
            type: 'success',
            title: 'Contract Owner Authenticated (SIWE)',
            message: `Exclusive session established for ${session.ownerAddress.slice(0, 6)}...${session.ownerAddress.slice(-4)}. Owner Dashboard unlocked.`,
          });
        }}
      />

      {/* Phase 4: Interactive 3D Donation Celebration Burst */}
      <DonationCelebration3D
        isOpen={!!celebrationData}
        onClose={() => setCelebrationData(null)}
        campaignName={celebrationData?.campaignName || ''}
        amountEth={celebrationData?.amountEth || ''}
      />

      {/* Donation Modal */}
      <DonationModal
        campaign={selectedCampaign}
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
        onSuccess={handleDonationSuccess}
        onOpenQR={handleOpenQR}
        onGenerateReceipt={(data) => {
          setReceiptData(data);
          setIsReceiptModalOpen(true);
        }}
      />

      {/* Dynamic Universal QR Code Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        campaign={selectedCampaignForQR}
        onPaymentRecorded={(data) => {
          setReceiptData(data);
          setIsReceiptModalOpen(true);
          addToast({
            type: 'success',
            title: 'Payment Recorded in Database',
            message: `Official 80G tax receipt ${data.receiptId} issued.`,
          });
          const campId = selectedCampaignForQR?.id ?? 0;
          addCampaignDonationRaised(campId, parseFloat(data.amountEth));
          const newDonation: DonationRecord = {
            id: `don-qr-${Date.now()}`,
            campaignId: campId,
            campaignName: data.campaignName,
            donor: data.donorAddress || 'UPI / QR Contributor',
            amount: data.amountEth,
            amountWei: parseEther(data.amountEth),
            timestamp: Math.floor(Date.now() / 1000),
            timestampFormatted: 'Just now',
            transactionHash: data.txHash,
          };
          setDonations((prev) => [newDonation, ...prev]);
          setCampaigns((prev) =>
            prev.map((c) => {
              if (c.id === campId) {
                const currentRaised = parseFloat(c.amountRaised);
                const newRaised = (currentRaised + parseFloat(data.amountEth)).toFixed(3);
                const targetNum = parseFloat(c.target);
                const newProgress = Math.min(100, Math.round((parseFloat(newRaised) / targetNum) * 100));
                return {
                  ...c,
                  amountRaised: newRaised,
                  progressPercent: newProgress,
                  status: newProgress >= 100 ? 'Funded' : c.status,
                };
              }
              return c;
            })
          );
        }}
      />

      {/* Official 80G Tax Exemption Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receiptData={receiptData}
      />

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCampaignCreated}
        nextCampaignId={campaigns.reduce((max, c) => Math.max(max, c.id), -1) + 1}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid #5c3a21',
          backgroundColor: '#09150f',
          padding: '2.5rem 1.5rem',
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#133523',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #236943',
              }}
            >
              <ShieldCheck size={18} color="#10b981" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fdfbf7' }}>
                ReliefChain Sovereign Protocol & Payments DB
              </div>
              <div style={{ fontSize: '0.8rem', color: '#9cb0a1' }}>
                Audited Smart Contract Transparency & 80G Tax Exemption System
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              fontSize: '0.85rem',
              color: '#d4ded6',
            }}
          >
            <span>Contract: {`${CONTRACT_ADDRESS.slice(0, 6)}...${CONTRACT_ADDRESS.slice(-4)}`}</span>
            <a
              href={`${EXPECTED_CHAIN.blockExplorerUrl}/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#f6c492',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                textDecoration: 'none',
              }}
            >
              Etherscan
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <WalletProvider>
      <DashboardInner />
    </WalletProvider>
  );
};

export default App;
