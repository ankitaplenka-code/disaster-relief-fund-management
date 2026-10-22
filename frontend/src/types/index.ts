// Type definitions for Disaster Relief Fund Tracking Dashboard

export interface Campaign {
  id: number;
  name: string;
  description: string;
  target: string; // ETH formatted
  targetWei: bigint;
  deadline: number; // Unix timestamp in seconds
  deadlineFormatted: string;
  amountRaised: string; // ETH formatted
  amountRaisedWei: bigint;
  active: boolean;
  isEnded: boolean;
  progressPercent: number;
  status: 'Active' | 'Ended' | 'Funded';
  category?: string;
  location?: string;
  image?: string;
}

export interface DonationRecord {
  id: string;
  campaignId: number;
  campaignName?: string;
  donor: string;
  amount: string; // ETH formatted
  amountWei: bigint;
  timestamp: number;
  timestampFormatted: string;
  transactionHash: string;
  blockNumber?: number;
}

export interface WithdrawalRecord {
  id: string;
  campaignId: number;
  campaignName?: string;
  amount: string; // ETH formatted
  amountWei: bigint;
  purpose: string;
  recipient: string;
  timestamp: number;
  timestampFormatted: string;
  transactionHash: string;
  blockNumber?: number;
}

export interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  shortAddress: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  balance: string | null;
  isOwner: boolean;
  contractOwner: string | null;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<void>;
  getSigner: () => Promise<any | null>;
  isMetaMaskInstalled: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  txHash?: string;
  duration?: number;
}

export interface IndexedTransaction {
  id: number;
  tx_hash: string;
  type: 'donation' | 'withdrawal';
  campaign_id: number;
  campaign_name?: string;
  from_address: string;
  to_address: string;
  amount: number;
  purpose?: string | null;
  block_number?: number | null;
  block_timestamp: number;
  block_timestamp_iso?: string;
  indexed_at: number;
  status: 'confirmed' | 'pending' | 'failed';
}

export interface AuditLogEntry {
  id: number;
  actor: string;
  action: string;
  target_tx_id?: number | null;
  details?: string | null;
  created_at: number;
  created_at_iso?: string;
}

export interface OwnerSession {
  token: string;
  ownerAddress: string;
  expiresAt: number;
}

