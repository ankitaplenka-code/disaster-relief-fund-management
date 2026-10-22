// Disaster Relief Smart Contract Configuration
// All contract addresses, ABIs, and network settings are consolidated here.

export interface NetworkConfig {
  chainId: number;
  chainIdHex: string;
  name: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const SEPOLIA_CONFIG: NetworkConfig = {
  chainId: 11155111,
  chainIdHex: '0xaa36a7',
  name: 'Sepolia Testnet',
  rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
  blockExplorerUrl: 'https://sepolia.etherscan.io',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

// Default deployed contract address on Sepolia.
// Override via VITE_CONTRACT_ADDRESS in .env if desired.
export const CONTRACT_ADDRESS: string =
  (import.meta.env.VITE_CONTRACT_ADDRESS as string) ||
  '0x71c5c98d879d3de5b4f8d8d85bfa268809118ed3';

// Expected network for the application
export const EXPECTED_CHAIN = SEPOLIA_CONFIG;

// Full ABI for DisasterRelief.sol
export const DISASTER_RELIEF_ABI = [
  // --- Write Functions ---
  {
    type: 'function',
    name: 'createCampaign',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'target', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'donate',
    stateMutability: 'payable',
    inputs: [{ name: 'campaignId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'withdrawFunds',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'campaignId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'purpose', type: 'string' },
      { name: 'recipient', type: 'address' },
    ],
    outputs: [],
  },

  // --- Read Functions ---
  {
    type: 'function',
    name: 'owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'campaigns',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'target', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'amountRaised', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'getCampaignsCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'donations',
    stateMutability: 'view',
    inputs: [
      { name: '', type: 'uint256' },
      { name: '', type: 'uint256' },
    ],
    outputs: [
      { name: 'donor', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'withdrawals',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'campaignId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'purpose', type: 'string' },
      { name: 'recipient', type: 'address' },
      { name: 'timestamp', type: 'uint256' },
    ],
  },

  // --- Events ---
  {
    type: 'event',
    name: 'CampaignCreated',
    inputs: [
      { indexed: true, name: 'campaignId', type: 'uint256' },
      { indexed: false, name: 'name', type: 'string' },
      { indexed: false, name: 'target', type: 'uint256' },
      { indexed: false, name: 'deadline', type: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'DonationReceived',
    inputs: [
      { indexed: true, name: 'campaignId', type: 'uint256' },
      { indexed: true, name: 'donor', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'FundsWithdrawn',
    inputs: [
      { indexed: true, name: 'campaignId', type: 'uint256' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'purpose', type: 'string' },
      { indexed: false, name: 'recipient', type: 'address' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
  },
] as const;
