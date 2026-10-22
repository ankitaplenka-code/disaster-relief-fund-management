// API Client Service for communicating with the SQLite Payments Database & SIWE Auth
import type { IndexedTransaction, AuditLogEntry, OwnerSession } from '../types';

export interface DatabasePayment {
  id: string;
  campaign_id: number;
  campaign_name?: string;
  donor_name: string;
  donor_email?: string | null;
  donor_wallet_address?: string | null;
  amount_eth: number;
  amount_fiat_usd?: number | null;
  amount_fiat_inr?: number | null;
  payment_method:
    | 'WEB3_METAMASK'
    | 'QR_CRYPTO'
    | 'QR_UPI'
    | 'BANK_WIRE'
    | 'CREDIT_CARD'
    | 'WITHDRAWAL_DISBURSEMENT'
    | string;
  payment_status: 'CONFIRMED' | 'PENDING_VERIFICATION' | 'FAILED' | string;
  payment_type?: 'DONATION' | 'DISBURSEMENT';
  transaction_hash?: string | null;
  receipt_id: string;
  notes?: string | null;
  created_at: number;
}

export interface PaymentStats {
  total_donations_count: number;
  total_raised_eth: number;
  total_raised_usd: number;
  total_raised_inr: number;
  total_withdrawals_count?: number;
  total_disbursed_eth?: number;
  total_disbursed_usd?: number;
  total_disbursed_inr?: number;
  net_balance_eth?: number;
  net_balance_inr?: number;
  unique_donors: number;
  methods: Array<{
    payment_method: string;
    count: number;
    total_eth: number;
  }>;
}

const OWNER_SESSION_KEY = 'reliefchain_owner_session';

export const apiService = {
  // ==========================================
  // Phase 4: SIWE Owner Authentication & Session
  // ==========================================

  getStoredOwnerSession(): OwnerSession | null {
    try {
      const raw = sessionStorage.getItem(OWNER_SESSION_KEY);
      if (!raw) return null;
      const session: OwnerSession = JSON.parse(raw);
      if (session.expiresAt && Date.now() > session.expiresAt) {
        sessionStorage.removeItem(OWNER_SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  saveOwnerSession(session: OwnerSession): void {
    sessionStorage.setItem(OWNER_SESSION_KEY, JSON.stringify(session));
  },

  clearOwnerSession(): void {
    sessionStorage.removeItem(OWNER_SESSION_KEY);
  },

  async getAuthNonce(address?: string): Promise<{ nonce: string; contractOwner: string }> {
    const url = new URL('/api/auth/nonce', window.location.origin);
    if (address) url.searchParams.set('address', address);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to request authentication nonce.');
    const data = await res.json();
    return { nonce: data.nonce, contractOwner: data.contractOwner };
  },

  async verifyOwnerSignature(payload: {
    address: string;
    message: string;
    signature: string;
    nonce: string;
  }): Promise<OwnerSession> {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Authentication failed: Not authorized as contract owner.');
    }

    const session: OwnerSession = {
      token: data.token,
      ownerAddress: data.ownerAddress,
      expiresAt: data.expiresAt,
    };

    this.saveOwnerSession(session);
    return session;
  },

  async loginWithOwnerPassword(password: string, address?: string): Promise<OwnerSession> {
    const res = await fetch('/api/auth/password-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, address }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Incorrect owner password.');
    }

    const session: OwnerSession = {
      token: data.token,
      ownerAddress: data.ownerAddress,
      expiresAt: data.expiresAt,
    };

    this.saveOwnerSession(session);
    return session;
  },

  async verifyCurrentSession(): Promise<boolean> {
    const session = this.getStoredOwnerSession();
    if (!session?.token) return false;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (!res.ok) {
        this.clearOwnerSession();
        return false;
      }
      const data = await res.json();
      return !!data.isOwner;
    } catch {
      return false;
    }
  },

  async logoutOwner(): Promise<void> {
    const session = this.getStoredOwnerSession();
    if (session?.token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.token}` },
        });
      } catch {
        // Continue cleanup
      }
    }
    this.clearOwnerSession();
  },

  // ==========================================
  // Phase 3: Transaction & Audit Endpoints
  // ==========================================

  /**
   * Public: Query donation transactions for a campaign
   */
  async getCampaignDonations(campaignId: number | 'ALL' = 'ALL'): Promise<IndexedTransaction[]> {
    try {
      const param = campaignId === 'ALL' ? 'all' : campaignId;
      const res = await fetch(`/api/campaigns/${param}/donations`);
      if (!res.ok) throw new Error(`Donations fetch failed: ${res.statusText}`);
      const data = await res.json();
      return data.donations || [];
    } catch (err) {
      console.error('Failed to fetch campaign donations:', err);
      return [];
    }
  },

  /**
   * Owner-Only: Query withdrawal records for a campaign
   * Strictly verifies and sends Bearer token.
   */
  async getCampaignWithdrawals(campaignId: number | 'ALL' = 'ALL'): Promise<IndexedTransaction[]> {
    const session = this.getStoredOwnerSession();
    if (!session?.token) {
      throw new Error('Access denied: Owner authentication required to view withdrawal records.');
    }

    const param = campaignId === 'ALL' ? 'all' : campaignId;
    const res = await fetch(`/api/campaigns/${param}/withdrawals`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        this.clearOwnerSession();
      }
      throw new Error(`Withdrawals query rejected: ${res.statusText}`);
    }

    const data = await res.json();
    return data.withdrawals || [];
  },

  /**
   * Owner-Only: Query non-financial system audit trail
   */
  async getAuditLogs(limit: number = 50, action?: string): Promise<AuditLogEntry[]> {
    const session = this.getStoredOwnerSession();
    if (!session?.token) {
      throw new Error('Access denied: Owner authentication required to view system audit logs.');
    }

    const url = new URL('/api/audit-log', window.location.origin);
    url.searchParams.set('limit', limit.toString());
    if (action && action !== 'ALL') {
      url.searchParams.set('action', action);
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        this.clearOwnerSession();
      }
      throw new Error(`Audit log query rejected: ${res.statusText}`);
    }

    const data = await res.json();
    return data.auditLogs || [];
  },

  /**
   * Index a transaction directly into DB (immediate UI sync)
   */
  async recordIndexedTransaction(tx: {
    tx_hash: string;
    type: 'donation' | 'withdrawal';
    campaign_id: number;
    from_address: string;
    to_address: string;
    amount: number;
    purpose?: string;
    block_timestamp?: number;
    actor?: string;
  }): Promise<IndexedTransaction | null> {
    try {
      const res = await fetch('/api/indexer/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.transaction || null;
    } catch (err) {
      console.error('Failed to index transaction:', err);
      return null;
    }
  },

  // ==========================================
  // Existing Payment & Receipt Endpoints
  // ==========================================

  async getPayments(params?: {
    campaignId?: number | 'ALL';
    method?: string;
    status?: string;
    type?: 'ALL' | 'DONATION' | 'DISBURSEMENT';
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ payments: DatabasePayment[]; count: number }> {
    try {
      const url = new URL('/api/payments', window.location.origin);
      if (params?.campaignId !== undefined && params.campaignId !== 'ALL') {
        url.searchParams.append('campaignId', params.campaignId.toString());
      }
      if (params?.type && params.type !== 'ALL') {
        url.searchParams.append('type', params.type);
      }
      if (params?.method && params.method !== 'ALL') {
        url.searchParams.append('method', params.method);
      }
      if (params?.status && params.status !== 'ALL') {
        url.searchParams.append('status', params.status);
      }
      if (params?.search) {
        url.searchParams.append('search', params.search);
      }
      if (params?.limit) {
        url.searchParams.append('limit', params.limit.toString());
      }
      if (params?.offset) {
        url.searchParams.append('offset', params.offset.toString());
      }

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      const data = await res.json();
      return { payments: data.payments || [], count: data.count || 0 };
    } catch (err) {
      console.error('Failed to fetch payments from DB:', err);
      return { payments: [], count: 0 };
    }
  },

  async recordDisbursement(disb: {
    campaign_id: number;
    amount_eth: number;
    purpose: string;
    recipient_address: string;
    transaction_hash?: string;
    recipient_name?: string;
    id?: string;
    created_at?: number;
  }): Promise<any> {
    try {
      const session = this.getStoredOwnerSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }

      const res = await fetch('/api/disbursements', {
        method: 'POST',
        headers,
        body: JSON.stringify(disb),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to record disbursement in payment DB: ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      console.error('Failed to record disbursement in payments DB:', err);
      return null;
    }
  },

  async getDisbursements(campaignId?: number | 'ALL'): Promise<any[]> {
    try {
      const url = new URL('/api/disbursements', window.location.origin);
      if (campaignId !== undefined && campaignId !== 'ALL') {
        url.searchParams.append('campaignId', campaignId.toString());
      }
      const res = await fetch(url.toString());
      if (!res.ok) return [];
      const data = await res.json();
      return data.disbursements || [];
    } catch (err) {
      console.error('Failed to fetch disbursements:', err);
      return [];
    }
  },

  async getStats(): Promise<PaymentStats | null> {
    try {
      const res = await fetch('/api/payments/stats');
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      const data = await res.json();
      return data.stats || null;
    } catch (err) {
      console.error('Failed to fetch payment stats:', err);
      return null;
    }
  },

  async recordPayment(payment: Partial<DatabasePayment>): Promise<DatabasePayment | null> {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to record payment');
      }
      const data = await res.json();
      return data.payment;
    } catch (err) {
      console.error('Failed to record payment in DB:', err);
      return null;
    }
  },

  async getReceipt(receiptId: string): Promise<DatabasePayment | null> {
    try {
      const res = await fetch(`/api/receipts/${encodeURIComponent(receiptId)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.receipt || null;
    } catch (err) {
      console.error('Failed to fetch receipt:', err);
      return null;
    }
  },

  async getCampaigns(): Promise<any[]> {
    try {
      const res = await fetch('/api/campaigns');
      if (!res.ok) return [];
      const data = await res.json();
      return data.campaigns || [];
    } catch (err) {
      console.warn('Failed to fetch campaigns from DB API:', err);
      return [];
    }
  },

  async createCampaign(campaign: {
    id?: number;
    name: string;
    description?: string;
    target_eth: number | string;
    deadline: number;
    category?: string;
    status?: string;
  }): Promise<any> {
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to save campaign to DB');
      }
      const data = await res.json();
      return data.campaign;
    } catch (err) {
      console.error('Failed to create campaign in DB:', err);
      return null;
    }
  },

  getCsvDownloadUrl(): string {
    return '/api/export/csv';
  },
};
