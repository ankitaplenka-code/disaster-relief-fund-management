// Contract Service for Disaster Relief Fund Tracking
// Communicates with DisasterRelief.sol via ethers v6

import {
  JsonRpcProvider,
  BrowserProvider,
  Contract,
  formatEther,
  parseEther,
  type Signer,
} from 'ethers';
import {
  CONTRACT_ADDRESS,
  EXPECTED_CHAIN,
  DISASTER_RELIEF_ABI,
} from '../config/contract';
import type { Campaign, DonationRecord, WithdrawalRecord } from '../types';

// Fallback / Initial sample campaigns for demo and instant offline preview
const INITIAL_DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: 0,
    name: 'Assam & Brahmaputra Monsoon Flood Emergency Relief 2026',
    description:
      'Providing clean drinking water purification units, dry ration food kits, and emergency shelter tarpaulins to 14,000+ marooned families across Cachar and Karimganj districts.',
    target: '15.0',
    targetWei: parseEther('15.0'),
    deadline: Math.floor(Date.now() / 1000) + 86400 * 18,
    deadlineFormatted: new Date(Date.now() + 86400 * 18 * 1000).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    amountRaised: '9.45',
    amountRaisedWei: parseEther('9.45'),
    active: true,
    isEnded: false,
    progressPercent: 63,
    status: 'Active',
    category: 'Flood Relief',
    location: 'Assam, India',
    image: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 1,
    name: 'Wayanad Western Ghats Landslide Medical & Shelter Mission',
    description:
      'Procuring mobile trauma surgical kits, orthopedic supplies, pre-fab disaster housing, and cold-chain vaccine refrigeration for cut-off hill-tract villages.',
    target: '25.0',
    targetWei: parseEther('25.0'),
    deadline: Math.floor(Date.now() / 1000) + 86400 * 25,
    deadlineFormatted: new Date(Date.now() + 86400 * 25 * 1000).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    amountRaised: '25.0',
    amountRaisedWei: parseEther('25.0'),
    active: true,
    isEnded: false,
    progressPercent: 100,
    status: 'Funded',
    category: 'Landslide',
    location: 'Kerala, India',
    image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    name: 'Vidarbha & Marathwada Drought Relief & Solar Water Harvesting',
    description:
      'Funding 65 community deep-bore solar well pumps and rainwater harvesting check-dams for rural farming hamlets undergoing acute groundwater depletion.',
    target: '10.0',
    targetWei: parseEther('10.0'),
    deadline: Math.floor(Date.now() / 1000) - 86400 * 3, // Ended
    deadlineFormatted: new Date(Date.now() - 86400 * 3 * 1000).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    amountRaised: '8.2',
    amountRaisedWei: parseEther('8.2'),
    active: false,
    isEnded: true,
    progressPercent: 82,
    status: 'Ended',
    category: 'Drought & Water',
    location: 'Maharashtra, India',
    image: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80',
  },
];

const INITIAL_DEMO_DONATIONS: DonationRecord[] = [
  {
    id: 'don-0-1',
    campaignId: 0,
    campaignName: 'Assam & Sylhet Monsoon Flood Emergency Relief 2026',
    donor: '0x3E5c486eF8B6001Ea514D6200Eb8F160358E298F',
    amount: '2.5',
    amountWei: parseEther('2.5'),
    timestamp: Math.floor(Date.now() / 1000) - 3600 * 14,
    timestampFormatted: '14 hours ago',
    transactionHash: '0x9fa1c78e47087bc00e7cb2df721a37c093a207297e29bb3e680a6b7371cbbe19',
    blockNumber: 5821094,
  },
  {
    id: 'don-0-2',
    campaignId: 0,
    campaignName: 'Assam & Sylhet Monsoon Flood Emergency Relief 2026',
    donor: '0x71C5c98D879d3De5B4f8D8d85bfa268809118eD3',
    amount: '1.2',
    amountWei: parseEther('1.2'),
    timestamp: Math.floor(Date.now() / 1000) - 3600 * 36,
    timestampFormatted: '1 day ago',
    transactionHash: '0x1ab8d4e92a83efc029bb081b7a2cd91fae29813b2909acde93425178652391ea',
    blockNumber: 5819876,
  },
  {
    id: 'don-1-1',
    campaignId: 1,
    campaignName: 'Atlas High-Altitude Earthquake Medical Supplies Fund',
    donor: '0x88921827Acbd5D2644265fC3AbB31D124BfEb032',
    amount: '5.0',
    amountWei: parseEther('5.0'),
    timestamp: Math.floor(Date.now() / 1000) - 3600 * 48,
    timestampFormatted: '2 days ago',
    transactionHash: '0x3ec82f91bbca387402a11bdf28e734c562e8461ab0838dbbf71c53248325a671',
    blockNumber: 5817200,
  },
];

const INITIAL_DEMO_WITHDRAWALS: WithdrawalRecord[] = [
  {
    id: 'wd-0-1',
    campaignId: 0,
    campaignName: 'Assam & Sylhet Monsoon Flood Emergency Relief 2026',
    amount: '3.0',
    amountWei: parseEther('3.0'),
    purpose: 'Procurement of 500 Water Purification Filter kits & dispatched via local Red Cross team',
    recipient: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
    timestamp: Math.floor(Date.now() / 1000) - 3600 * 8,
    timestampFormatted: '8 hours ago',
    transactionHash: '0x5ac7e88939a04702b8b9cbfa2721ab993f41249bce376dae932948ca298bfd11',
    blockNumber: 5821940,
  },
];

// Helper to get read-only provider
export const getReadOnlyProvider = (): JsonRpcProvider => {
  return new JsonRpcProvider(EXPECTED_CHAIN.rpcUrl);
};

// Helper to get contract instance
export const getContractInstance = (signerOrProvider: Signer | JsonRpcProvider | BrowserProvider): Contract => {
  return new Contract(CONTRACT_ADDRESS, DISASTER_RELIEF_ABI, signerOrProvider);
};

// Local storage storage keys for dynamic additions during demo / live session
const LOCAL_STORAGE_CAMPAIGNS_KEY = 'dr_custom_campaigns';
const LOCAL_STORAGE_DONATIONS_KEY = 'dr_custom_donations';
const LOCAL_STORAGE_WITHDRAWALS_KEY = 'dr_custom_withdrawals';

export const getLocalCampaigns = (): Campaign[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CAMPAIGNS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLocalCampaign = (campaign: Campaign) => {
  try {
    const current = getLocalCampaigns();
    localStorage.setItem(LOCAL_STORAGE_CAMPAIGNS_KEY, JSON.stringify([campaign, ...current]));
  } catch (err) {
    console.warn('Failed to save to local storage', err);
  }
};

export const getLocalDonations = (): DonationRecord[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DONATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLocalDonation = (donation: DonationRecord) => {
  try {
    const current = getLocalDonations();
    localStorage.setItem(LOCAL_STORAGE_DONATIONS_KEY, JSON.stringify([donation, ...current]));
  } catch (err) {
    console.warn('Failed to save donation', err);
  }
};

export const getLocalWithdrawals = (): WithdrawalRecord[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_WITHDRAWALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLocalWithdrawal = (withdrawal: WithdrawalRecord) => {
  try {
    const current = getLocalWithdrawals();
    localStorage.setItem(LOCAL_STORAGE_WITHDRAWALS_KEY, JSON.stringify([withdrawal, ...current]));
  } catch (err) {
    console.warn('Failed to save withdrawal', err);
  }
};

export const updateLocalCampaignBalance = (campaignId: number, ethAmountToSubtract: number) => {
  try {
    const campaigns = getLocalCampaigns();
    const updated = campaigns.map((c) => {
      if (c.id === campaignId) {
        const currentRaised = parseFloat(c.amountRaised || '0');
        const newRaised = Math.max(0, currentRaised - ethAmountToSubtract);
        return {
          ...c,
          amountRaised: newRaised.toFixed(2),
          amountRaisedWei: parseEther(newRaised.toFixed(4)),
        };
      }
      return c;
    });
    localStorage.setItem(LOCAL_STORAGE_CAMPAIGNS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to update campaign balance locally', err);
  }
};

const LOCAL_STORAGE_ADDITIONAL_RAISED_KEY = 'dr_campaign_additional_raised';

export const getAdditionalRaised = (): Record<number, number> => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ADDITIONAL_RAISED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const addCampaignDonationRaised = (campaignId: number, ethAmount: number) => {
  try {
    const map = getAdditionalRaised();
    map[campaignId] = (map[campaignId] || 0) + ethAmount;
    localStorage.setItem(LOCAL_STORAGE_ADDITIONAL_RAISED_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to save additional raised to local storage', err);
  }
};

// Service object
export const contractService = {
  /**
   * Fetch all campaigns from the contract.
   * Gracefully handles count getter, index iteration, and fallbacks.
   */
  async fetchCampaigns(): Promise<Campaign[]> {
    const provider = getReadOnlyProvider();
    const contract = getContractInstance(provider);
    const onChainCampaigns: Campaign[] = [];

    try {
      // 1. Try to get campaigns count
      let count = 0;
      try {
        const countBn = await contract.getCampaignsCount();
        count = Number(countBn);
      } catch {
        // If count function not found, query index until revert (up to 20)
        let idx = 0;
        while (idx < 20) {
          try {
            await contract.campaigns(idx);
            idx++;
          } catch {
            break;
          }
        }
        count = idx;
      }

      const nowSec = Math.floor(Date.now() / 1000);

      // Read each campaign struct
      for (let i = 0; i < count; i++) {
        try {
          const raw = await contract.campaigns(i);
          const name: string = raw.name || raw[0];
          const description: string = raw.description || raw[1];
          const targetWei: bigint = BigInt(raw.target || raw[2]);
          const deadline: number = Number(raw.deadline || raw[3]);
          const amountRaisedWei: bigint = BigInt(raw.amountRaised || raw[4]);
          const active: boolean = Boolean(raw.active ?? raw[5]);

          const targetEth = formatEther(targetWei);
          const raisedEth = formatEther(amountRaisedWei);

          const isEnded = !active || deadline <= nowSec;
          const targetNum = parseFloat(targetEth);
          const raisedNum = parseFloat(raisedEth);
          const progressPercent = targetNum > 0 ? Math.min(100, Math.round((raisedNum / targetNum) * 100)) : 0;

          let status: 'Active' | 'Ended' | 'Funded' = 'Active';
          if (progressPercent >= 100) status = 'Funded';
          else if (isEnded) status = 'Ended';

          onChainCampaigns.push({
            id: i,
            name,
            description,
            target: targetEth,
            targetWei,
            deadline,
            deadlineFormatted: new Date(deadline * 1000).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            amountRaised: raisedEth,
            amountRaisedWei,
            active,
            isEnded,
            progressPercent,
            status,
            category: 'Emergency Relief',
            location: 'Global Testnet',
          });
        } catch (itemErr) {
          console.warn(`Error reading campaign #${i}:`, itemErr);
          break;
        }
      }
    } catch (err: any) {
      console.warn('Could not fetch campaigns from RPC, using cached/demo data:', err.message);
    }

    // Merge on-chain campaigns with custom local campaigns, backend DB campaigns, and initial demo
    let dbCampaigns: Campaign[] = [];
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const data = await res.json();
        if (data.campaigns && Array.isArray(data.campaigns)) {
          const nowSec = Math.floor(Date.now() / 1000);
          dbCampaigns = data.campaigns.map((c: any) => {
            const targetEth = String(c.target_eth || c.target || '10');
            const deadline = Number(c.deadline || nowSec + 86400 * 14);
            const isEnded = c.status === 'Ended' || deadline <= nowSec;
            return {
              id: Number(c.id),
              name: c.name,
              description: c.description || '',
              target: targetEth,
              targetWei: parseEther(targetEth),
              deadline,
              deadlineFormatted: new Date(deadline * 1000).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
              amountRaised: String(c.amount_raised || c.amountRaised || '0.0'),
              amountRaisedWei: parseEther(String(c.amount_raised || c.amountRaised || '0.0')),
              active: c.active !== undefined ? Boolean(c.active) : !isEnded,
              isEnded,
              progressPercent: 0,
              status: (c.status || (isEnded ? 'Ended' : 'Active')) as 'Active' | 'Ended' | 'Funded',
              category: c.category || 'Disaster Relief',
              location: c.location || 'India / Global',
              image: c.image || 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
            };
          });
        }
      }
    } catch {
      // Ignore API fetch error if offline
    }

    const localCustom = getLocalCampaigns();
    const sourceList = [
      ...localCustom,
      ...dbCampaigns,
      ...onChainCampaigns,
      ...INITIAL_DEMO_CAMPAIGNS,
    ];

    // Deduplicate by ID and apply accumulated donations to amountRaised
    const seenIds = new Set<number>();
    const mergedCampaigns: Campaign[] = [];
    const additionalMap = getAdditionalRaised();

    for (const c of sourceList) {
      if (!seenIds.has(c.id)) {
        seenIds.add(c.id);

        const extra = additionalMap[c.id] || 0;
        const baseRaised = parseFloat(c.amountRaised || '0.0');
        const totalRaised = (baseRaised + extra).toFixed(3);
        const targetNum = parseFloat(c.target);
        const progressPercent = targetNum > 0 ? Math.min(100, Math.round((parseFloat(totalRaised) / targetNum) * 100)) : 0;
        let status = c.status;
        if (progressPercent >= 100) status = 'Funded';
        else if (c.isEnded) status = 'Ended';
        else status = 'Active';

        mergedCampaigns.push({
          ...c,
          amountRaised: totalRaised,
          amountRaisedWei: parseEther(totalRaised),
          progressPercent,
          status,
        });
      }
    }
    return mergedCampaigns;
  },

  /**
   * Fetch all donation events across campaigns
   */
  async fetchDonations(campaignId?: number): Promise<DonationRecord[]> {
    const provider = getReadOnlyProvider();
    const contract = getContractInstance(provider);
    const onChainDonations: DonationRecord[] = [];

    try {
      const filter = contract.filters.DonationReceived(
        campaignId !== undefined ? campaignId : null
      );

      // Query past 10,000 blocks to avoid RPC timeout
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 9999);
      const events = await contract.queryFilter(filter, fromBlock, 'latest');

      for (const evt of events) {
        const anyEvt = evt as any;
        const args = anyEvt.args;
        if (args) {
          const cId = Number(args.campaignId || args[0]);
          const donor = String(args.donor || args[1]);
          const amountWei = BigInt(args.amount || args[2]);
          const timestamp = Number(args.timestamp || args[3]);

          onChainDonations.push({
            id: `${evt.transactionHash}-${evt.index}`,
            campaignId: cId,
            donor,
            amount: formatEther(amountWei),
            amountWei,
            timestamp,
            timestampFormatted: new Date(timestamp * 1000).toLocaleString(),
            transactionHash: evt.transactionHash,
            blockNumber: evt.blockNumber,
          });
        }
      }
    } catch (err: any) {
      console.warn('Could not query DonationReceived events from RPC:', err.message);
    }

    // Also fetch donations recorded in backend payments DB
    let dbDonations: DonationRecord[] = [];
    try {
      const res = await fetch('/api/payments?type=DONATION');
      if (res.ok) {
        const data = await res.json();
        if (data.payments && Array.isArray(data.payments)) {
          dbDonations = data.payments.map((p: any) => ({
            id: p.id || `don-${p.created_at}`,
            campaignId: Number(p.campaign_id),
            campaignName: p.campaign_name || `Campaign #${p.campaign_id}`,
            donor: p.donor_wallet_address || p.donor_name || 'Anonymous Donor',
            amount: String(p.amount_eth),
            amountWei: parseEther(String(p.amount_eth)),
            timestamp: Number(p.created_at),
            timestampFormatted: new Date(Number(p.created_at) * 1000).toLocaleString(),
            transactionHash: p.transaction_hash || `0xpay-${p.id}`,
            receiptId: p.receipt_id,
          }));
        }
      }
    } catch {
      // Ignore if offline
    }

    const localDonations = getLocalDonations();
    const all = [...localDonations, ...dbDonations, ...onChainDonations, ...INITIAL_DEMO_DONATIONS];

    // Deduplicate by transactionHash or ID
    const seenTx = new Set<string>();
    const deduplicatedDonations: DonationRecord[] = [];
    for (const d of all) {
      const key = d.transactionHash || d.id;
      if (!seenTx.has(key)) {
        seenTx.add(key);
        deduplicatedDonations.push(d);
      }
    }

    if (campaignId !== undefined) {
      return deduplicatedDonations.filter((d) => d.campaignId === campaignId);
    }
    return deduplicatedDonations;
  },

  /**
   * Fetch all withdrawal events
   */
  async fetchWithdrawals(campaignId?: number): Promise<WithdrawalRecord[]> {
    const provider = getReadOnlyProvider();
    const contract = getContractInstance(provider);
    const onChainWithdrawals: WithdrawalRecord[] = [];

    try {
      const filter = contract.filters.FundsWithdrawn(
        campaignId !== undefined ? campaignId : null
      );

      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 9999);
      const events = await contract.queryFilter(filter, fromBlock, 'latest');

      for (const evt of events) {
        const anyEvt = evt as any;
        const args = anyEvt.args;
        if (args) {
          const cId = Number(args.campaignId || args[0]);
          const amountWei = BigInt(args.amount || args[1]);
          const purpose = String(args.purpose || args[2]);
          const recipient = String(args.recipient || args[3]);
          const timestamp = Number(args.timestamp || args[4]);

          onChainWithdrawals.push({
            id: `${evt.transactionHash}-${evt.index}`,
            campaignId: cId,
            amount: formatEther(amountWei),
            amountWei,
            purpose,
            recipient,
            timestamp,
            timestampFormatted: new Date(timestamp * 1000).toLocaleString(),
            transactionHash: evt.transactionHash,
            blockNumber: evt.blockNumber,
          });
        }
      }
    } catch (err: any) {
      console.warn('Could not query FundsWithdrawn events from RPC:', err.message);
    }

    const localWithdrawals = getLocalWithdrawals();
    const all = [...localWithdrawals, ...onChainWithdrawals, ...INITIAL_DEMO_WITHDRAWALS];

    if (campaignId !== undefined) {
      return all.filter((w) => w.campaignId === campaignId);
    }
    return all;
  },

  /**
   * Submit donation transaction to a campaign
   */
  async donate(signer: Signer, campaignId: number, ethAmount: string): Promise<{ txHash: string }> {
    const contract = getContractInstance(signer);
    const value = parseEther(ethAmount);

    try {
      const tx = await contract.donate(campaignId, { value });
      const receipt = await tx.wait(1);
      return { txHash: receipt.hash || tx.hash };
    } catch (err: any) {
      throw parseContractError(err);
    }
  },

  /**
   * Withdraw funds from campaign (only owner)
   */
  async withdrawFunds(
    signer: Signer,
    campaignId: number,
    ethAmount: string,
    purpose: string,
    recipient: string
  ): Promise<{ txHash: string }> {
    const contract = getContractInstance(signer);
    const amountWei = parseEther(ethAmount);

    try {
      const tx = await contract.withdrawFunds(campaignId, amountWei, purpose, recipient);
      const receipt = await tx.wait(1);
      return { txHash: receipt.hash || tx.hash };
    } catch (err: any) {
      throw parseContractError(err);
    }
  },

  /**
   * Create a new campaign (only owner)
   */
  async createCampaign(
    signer: Signer,
    name: string,
    description: string,
    targetEth: string,
    deadlineUnix: number
  ): Promise<{ txHash: string }> {
    const contract = getContractInstance(signer);
    const targetWei = parseEther(targetEth);

    try {
      const tx = await contract.createCampaign(name, description, targetWei, deadlineUnix);
      const receipt = await tx.wait(1);
      return { txHash: receipt.hash || tx.hash };
    } catch (err: any) {
      throw parseContractError(err);
    }
  },
};

/**
 * Cleanly format contract revert errors into plain human-readable messages
 */
export function parseContractError(err: any): Error {
  console.error('Raw Web3 Error:', err);

  // User rejected in MetaMask
  if (err.code === 4001 || err.code === 'ACTION_REJECTED' || err.info?.error?.code === 4001) {
    return new Error('Transaction was cancelled in MetaMask.');
  }

  // Insufficient funds for gas or value
  if (err.code === 'INSUFFICIENT_FUNDS' || err.message?.includes('insufficient funds')) {
    return new Error('Insufficient ETH in your wallet to cover the donation and network gas fee.');
  }

  // Revert reason in data
  if (err.reason) {
    return new Error(`Smart Contract reverted: ${err.reason}`);
  }

  // Common contract reverts
  const msg = err.message || '';
  if (msg.includes('Campaign ended') || msg.includes('deadline passed')) {
    return new Error('This campaign deadline has passed and is no longer accepting donations.');
  }
  if (msg.includes('Target reached')) {
    return new Error('The target goal for this campaign has already been achieved.');
  }
  if (msg.includes('Ownable: caller is not the owner') || msg.includes('onlyOwner')) {
    return new Error('Unauthorized: Only the contract owner can execute this function.');
  }
  if (msg.includes('Insufficient balance') || msg.includes('Amount exceeds raised')) {
    return new Error('Withdrawal amount exceeds the available funds raised for this campaign.');
  }

  return new Error(err.shortMessage || err.message || 'An unexpected transaction error occurred.');
}
