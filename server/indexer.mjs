// Blockchain Event Indexer for DisasterRelief.sol
import { ethers } from 'ethers';
import { upsertTransaction, insertAuditLog, insertDisbursement } from './db.mjs';
import { CONTRACT_ADDRESS } from './auth.mjs';

const SEPOLIA_RPC_URL =
  process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

const CONTRACT_ABI = [
  'event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount, uint256 timestamp)',
  'event FundsWithdrawn(uint256 indexed campaignId, uint256 amount, string purpose, address recipient, uint256 timestamp)',
  'function owner() external view returns (address)',
  'function campaigns(uint256) external view returns (string name, string description, uint256 target, uint256 deadline, uint256 amountRaised, bool active)',
];

export class BlockchainIndexer {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.isSyncing = false;
    this.pollingTimer = null;
    this.lastProcessedBlock = 0;
  }

  async init() {
    try {
      this.provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.provider);
      console.log(`[Indexer] Connected to provider. Target contract: ${CONTRACT_ADDRESS}`);

      // Start initial historical backfill and periodic polling
      await this.runBackfill();
      this.startPolling();
    } catch (err) {
      console.warn('[Indexer] Could not connect to RPC provider initially:', err.message);
      // Retry in 30 seconds
      setTimeout(() => this.init(), 30000);
    }
  }

  /**
   * Historical Backfill: Fetch all historical DonationReceived & FundsWithdrawn events
   */
  async runBackfill(lookbackBlocks = 2000) {
    if (this.isSyncing || !this.contract || !this.provider) return;
    this.isSyncing = true;

    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - lookbackBlocks);
      console.log(`[Indexer] Backfilling events from block ${fromBlock} to ${currentBlock}...`);

      // 1. Fetch historical donations
      const donationFilter = this.contract.filters.DonationReceived();
      const donationEvents = await this.contract.queryFilter(donationFilter, fromBlock, currentBlock);

      for (const event of donationEvents) {
        await this.processDonationEvent(event);
      }

      // 2. Fetch historical withdrawals
      const withdrawalFilter = this.contract.filters.FundsWithdrawn();
      const withdrawalEvents = await this.contract.queryFilter(withdrawalFilter, fromBlock, currentBlock);

      for (const event of withdrawalEvents) {
        await this.processWithdrawalEvent(event);
      }

      this.lastProcessedBlock = currentBlock;
      insertAuditLog({
        actor: 'indexer',
        action: 'backfill_completed',
        details: `Processed ${donationEvents.length} donations and ${withdrawalEvents.length} withdrawals up to block ${currentBlock}`,
      });

      console.log(`[Indexer] Backfill complete: indexed ${donationEvents.length} donations, ${withdrawalEvents.length} withdrawals.`);
    } catch (err) {
      console.warn('[Indexer] Backfill warning (RPC limits or rate limiting):', err.message);
    } finally {
      this.isSyncing = false;
    }
  }

  async processDonationEvent(event) {
    try {
      const { campaignId, donor, amount, timestamp } = event.args;
      const txHash = event.transactionHash;
      const blockNumber = event.blockNumber;

      const ethAmount = parseFloat(ethers.formatEther(amount));
      const blockTimestamp = Number(timestamp);

      const tx = upsertTransaction({
        tx_hash: txHash,
        type: 'donation',
        campaign_id: Number(campaignId),
        from_address: donor,
        to_address: CONTRACT_ADDRESS,
        amount: ethAmount,
        purpose: null,
        block_number: blockNumber,
        block_timestamp: blockTimestamp,
        status: 'confirmed',
      });

      insertAuditLog({
        actor: 'indexer',
        action: 'transaction_indexed',
        target_tx_id: tx?.id || null,
        details: `DonationReceived indexed: ${ethAmount} ETH from ${donor} for Campaign #${campaignId}`,
      });
    } catch (err) {
      console.error('[Indexer] Error processing donation event:', err.message);
    }
  }

  async processWithdrawalEvent(event) {
    try {
      const { campaignId, amount, purpose, recipient, timestamp } = event.args;
      const txHash = event.transactionHash;
      const blockNumber = event.blockNumber;

      const ethAmount = parseFloat(ethers.formatEther(amount));
      const blockTimestamp = Number(timestamp);

      const tx = upsertTransaction({
        tx_hash: txHash,
        type: 'withdrawal',
        campaign_id: Number(campaignId),
        from_address: CONTRACT_ADDRESS,
        to_address: recipient,
        amount: ethAmount,
        purpose,
        block_number: blockNumber,
        block_timestamp: blockTimestamp,
        status: 'confirmed',
      });

      // Also ensure it is persisted in the payments DB
      insertDisbursement({
        id: `DISB-ONCHAIN-${txHash.slice(2, 10)}`,
        campaign_id: Number(campaignId),
        amount_eth: ethAmount,
        purpose,
        recipient_address: recipient,
        transaction_hash: txHash,
        created_at: blockTimestamp,
      });

      insertAuditLog({
        actor: 'indexer',
        action: 'transaction_indexed',
        target_tx_id: tx?.id || null,
        details: `FundsWithdrawn indexed: ${ethAmount} ETH to ${recipient} for Campaign #${campaignId} (Purpose: ${purpose})`,
      });
    } catch (err) {
      console.error('[Indexer] Error processing withdrawal event:', err.message);
    }
  }

  /**
   * Periodic polling check for new on-chain events every 15 seconds
   */
  startPolling() {
    if (this.pollingTimer) clearInterval(this.pollingTimer);

    this.pollingTimer = setInterval(async () => {
      if (this.isSyncing || !this.provider || !this.contract) return;
      try {
        const latestBlock = await this.provider.getBlockNumber();
        if (latestBlock > this.lastProcessedBlock) {
          const from = this.lastProcessedBlock ? this.lastProcessedBlock + 1 : latestBlock - 5;
          const donationFilter = this.contract.filters.DonationReceived();
          const donationEvents = await this.contract.queryFilter(donationFilter, from, latestBlock);

          for (const ev of donationEvents) {
            await this.processDonationEvent(ev);
          }

          const withdrawalFilter = this.contract.filters.FundsWithdrawn();
          const withdrawalEvents = await this.contract.queryFilter(withdrawalFilter, from, latestBlock);

          for (const ev of withdrawalEvents) {
            await this.processWithdrawalEvent(ev);
          }

          this.lastProcessedBlock = latestBlock;
        }
      } catch (err) {
        // Silent RPC catch
      }
    }, 15000);
  }

  /**
   * Direct manual sync method for local simulation / immediate frontend feedback
   */
  async indexDirectTransaction(txData) {
    const tx = upsertTransaction({
      tx_hash: txData.tx_hash,
      type: txData.type,
      campaign_id: txData.campaign_id,
      from_address: txData.from_address,
      to_address: txData.to_address,
      amount: txData.amount,
      purpose: txData.purpose || null,
      block_number: txData.block_number || 0,
      block_timestamp: txData.block_timestamp || Math.floor(Date.now() / 1000),
      status: 'confirmed',
    });

    insertAuditLog({
      actor: txData.actor || 'indexer',
      action: 'transaction_indexed',
      target_tx_id: tx?.id || null,
      details: `${txData.type === 'donation' ? 'Donation' : 'Withdrawal'} indexed: ${txData.amount} ETH (${txData.tx_hash})`,
    });

    return tx;
  }
}

export const indexer = new BlockchainIndexer();
