// Disaster Relief Payments & Audit Trail API Server
// Uses built-in node:http and node:sqlite + SIWE Auth + Event Indexer
import http from 'node:http';
import { URL } from 'node:url';
import {
  initDatabase,
  insertPayment,
  getPayments,
  getPaymentStats,
  getReceiptById,
  getAllPaymentsForExport,
  insertDisbursement,
  getDisbursements,
  getDonationsByCampaign,
  getWithdrawalsByCampaign,
  getAllTransactions,
  getAuditLogs,
  insertAuditLog,
  getDbCampaigns,
  insertDbCampaign,
} from './db.mjs';
import {
  generateNonce,
  verifySiweLogin,
  verifyPasswordLogin,
  requireOwnerAuth,
  verifyToken,
  getContractOwner,
  CONTRACT_ADDRESS,
} from './auth.mjs';
import { indexer } from './indexer.mjs';

// Initialize DB schema & indexes
initDatabase();

// Start event indexer service in background
indexer.init().catch((err) => {
  console.warn('Indexer init deferred:', err.message);
});

const PORT = 5001;

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJson(res, statusCode, data) {
  setCorsHeaders(res);
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(statusCode);
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (!body.trim()) {
          resolve({});
        } else {
          resolve(JSON.parse(body));
        }
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', (err) => reject(err));
  });
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;
  const method = req.method;

  // Handle preflight
  if (method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // ==========================================
    // Phase 4: SIWE Authentication Endpoints
    // ==========================================

    // 1. GET /api/auth/nonce
    if (method === 'GET' && pathname === '/api/auth/nonce') {
      const address = reqUrl.searchParams.get('address');
      const nonce = generateNonce(address);
      const ownerAddress = await getContractOwner(indexer.provider);
      return sendJson(res, 200, { success: true, nonce, contractOwner: ownerAddress });
    }

    // 2. POST /api/auth/verify
    if (method === 'POST' && pathname === '/api/auth/verify') {
      const body = await parseJsonBody(req);
      try {
        const result = await verifySiweLogin(body, indexer.provider);
        return sendJson(res, 200, result);
      } catch (authErr) {
        const statusCode = authErr.statusCode || 400;
        return sendJson(res, statusCode, { success: false, error: authErr.message });
      }
    }

    // 2b. POST /api/auth/password-login
    if (method === 'POST' && pathname === '/api/auth/password-login') {
      const body = await parseJsonBody(req);
      try {
        const result = verifyPasswordLogin(body);
        return sendJson(res, 200, result);
      } catch (authErr) {
        const statusCode = authErr.statusCode || 401;
        return sendJson(res, statusCode, { success: false, error: authErr.message });
      }
    }

    // 3. GET /api/auth/me
    if (method === 'GET' && pathname === '/api/auth/me') {
      const auth = requireOwnerAuth(req);
      if (!auth.authorized) {
        return sendJson(res, auth.status, { success: false, isOwner: false, error: auth.error });
      }
      return sendJson(res, 200, { success: true, isOwner: true, address: auth.user.address });
    }

    // 4. POST /api/auth/logout
    if (method === 'POST' && pathname === '/api/auth/logout') {
      const auth = requireOwnerAuth(req);
      if (auth.authorized) {
        insertAuditLog({
          actor: auth.user.address,
          action: 'owner_logout',
          details: 'Owner logged out of session',
        });
      }
      return sendJson(res, 200, { success: true, message: 'Logged out successfully' });
    }

    // 4.5 GET /api/campaigns (PUBLIC)
    if (method === 'GET' && pathname === '/api/campaigns') {
      const list = getDbCampaigns();
      return sendJson(res, 200, { success: true, count: list.length, campaigns: list });
    }

    // 4.6 POST /api/campaigns (PUBLIC / ADMIN)
    if (method === 'POST' && pathname === '/api/campaigns') {
      const body = await parseJsonBody(req);
      if (!body.name || body.target_eth === undefined) {
        return sendJson(res, 400, { success: false, error: 'name and target_eth are required' });
      }

      let campId = body.id;
      if (campId === undefined) {
        const existing = getDbCampaigns();
        const maxId = existing.reduce((max, c) => Math.max(max, c.id), -1);
        campId = maxId + 1;
      }

      const saved = insertDbCampaign({
        ...body,
        id: campId,
      });

      return sendJson(res, 201, { success: true, campaign: saved });
    }

    // 5. GET /api/campaigns/:id/donations (PUBLIC)
    if (method === 'GET' && /^\/api\/campaigns\/[^/]+\/donations$/.test(pathname)) {
      const parts = pathname.split('/');
      const rawId = parts[3];
      const campaignId = rawId.toLowerCase() === 'all' ? 'ALL' : parseInt(rawId, 10);
      const limit = parseInt(reqUrl.searchParams.get('limit') || '50', 10);
      const offset = parseInt(reqUrl.searchParams.get('offset') || '0', 10);

      const donations = getDonationsByCampaign(campaignId, { limit, offset });

      // Format ISO 8601 timestamps
      const formatted = donations.map((d) => ({
        ...d,
        block_timestamp_iso: new Date(d.block_timestamp * 1000).toISOString(),
      }));

      return sendJson(res, 200, {
        success: true,
        campaignId,
        type: 'donation',
        count: formatted.length,
        donations: formatted,
      });
    }

    // 6. GET /api/campaigns/:id/withdrawals (OWNER-ONLY)
    if (method === 'GET' && /^\/api\/campaigns\/[^/]+\/withdrawals$/.test(pathname)) {
      const auth = requireOwnerAuth(req);
      if (!auth.authorized) {
        return sendJson(res, auth.status, {
          success: false,
          error: 'Restricted: Withdrawal audit records are visible to contract owner only.',
        });
      }

      const parts = pathname.split('/');
      const rawId = parts[3];
      const campaignId = rawId.toLowerCase() === 'all' ? 'ALL' : parseInt(rawId, 10);
      const limit = parseInt(reqUrl.searchParams.get('limit') || '50', 10);
      const offset = parseInt(reqUrl.searchParams.get('offset') || '0', 10);

      const withdrawals = getWithdrawalsByCampaign(campaignId, { limit, offset });
      const formatted = withdrawals.map((w) => ({
        ...w,
        block_timestamp_iso: new Date(w.block_timestamp * 1000).toISOString(),
      }));

      return sendJson(res, 200, {
        success: true,
        campaignId,
        type: 'withdrawal',
        count: formatted.length,
        withdrawals: formatted,
      });
    }

    // 7. GET /api/audit-log
    if (method === 'GET' && pathname === '/api/audit-log') {
      const isPublic = reqUrl.searchParams.get('public') === 'true';
      const auth = requireOwnerAuth(req);
      if (!auth.authorized && !isPublic) {
        return sendJson(res, auth.status, {
          success: false,
          error: 'Restricted: System audit trail is visible to contract owner only.',
        });
      }

      const limit = parseInt(reqUrl.searchParams.get('limit') || '100', 10);
      const offset = parseInt(reqUrl.searchParams.get('offset') || '0', 10);
      const action = reqUrl.searchParams.get('action') || undefined;

      const logs = getAuditLogs({ limit, offset, action });
      const formatted = logs.map((l) => ({
        ...l,
        created_at_iso: new Date(l.created_at * 1000).toISOString(),
      }));

      return sendJson(res, 200, {
        success: true,
        count: formatted.length,
        auditLogs: formatted,
      });
    }

    // 8. GET /api/transactions (PUBLIC FEED - Strictly Donations unless Owner)
    if (method === 'GET' && pathname === '/api/transactions') {
      const auth = requireOwnerAuth(req);
      const limit = parseInt(reqUrl.searchParams.get('limit') || '50', 10);
      const offset = parseInt(reqUrl.searchParams.get('offset') || '0', 10);
      const campaignId = reqUrl.searchParams.get('campaignId') || undefined;

      // If user is not authenticated owner, force type = 'donation'
      let typeFilter = 'donation';
      if (auth.authorized) {
        typeFilter = reqUrl.searchParams.get('type') || undefined;
      }

      const txs = getAllTransactions({
        type: typeFilter,
        campaignId: campaignId ? parseInt(campaignId, 10) : undefined,
        limit,
        offset,
      });

      const formatted = txs.map((t) => ({
        ...t,
        block_timestamp_iso: new Date(t.block_timestamp * 1000).toISOString(),
      }));

      return sendJson(res, 200, {
        success: true,
        count: formatted.length,
        transactions: formatted,
      });
    }

    // 9. POST /api/indexer/record (Immediate Indexing Hook)
    if (method === 'POST' && pathname === '/api/indexer/record') {
      const body = await parseJsonBody(req);
      if (!body.tx_hash || !body.type || body.campaign_id === undefined || !body.amount) {
        return sendJson(res, 400, {
          success: false,
          error: 'tx_hash, type, campaign_id, and amount are required.',
        });
      }

      const tx = await indexer.indexDirectTransaction(body);

      // If this is a withdrawal, ensure it is permanently stored in payments DB
      if (body.type === 'withdrawal') {
        insertDisbursement({
          id: `DISB-TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          campaign_id: body.campaign_id,
          amount_eth: body.amount,
          purpose: body.purpose || 'Relief fund disbursement',
          recipient_address: body.to_address,
          transaction_hash: body.tx_hash,
          created_at: body.block_timestamp || Math.floor(Date.now() / 1000),
        });
      }

      return sendJson(res, 201, { success: true, transaction: tx });
    }

    // ==========================================
    // Existing DB / Payments Operations
    // ==========================================

    // 10. GET /api/payments/stats
    if (method === 'GET' && pathname === '/api/payments/stats') {
      const stats = getPaymentStats();
      return sendJson(res, 200, { success: true, stats });
    }

    // 11. GET /api/payments
    if (method === 'GET' && pathname === '/api/payments') {
      const campaignId = reqUrl.searchParams.get('campaignId') || undefined;
      const paymentMethod = reqUrl.searchParams.get('method') || undefined;
      const status = reqUrl.searchParams.get('status') || undefined;
      const type = reqUrl.searchParams.get('type') || undefined;
      const search = reqUrl.searchParams.get('search') || undefined;
      const limit = parseInt(reqUrl.searchParams.get('limit') || '50', 10);
      const offset = parseInt(reqUrl.searchParams.get('offset') || '0', 10);

      const payments = getPayments({
        campaignId: campaignId ? parseInt(campaignId, 10) : undefined,
        method: paymentMethod,
        status,
        type,
        search,
        limit,
        offset,
      });

      return sendJson(res, 200, { success: true, payments, count: payments.length });
    }

    // 12. POST /api/payments
    if (method === 'POST' && pathname === '/api/payments') {
      const body = await parseJsonBody(req);

      if (!body.amount_eth || body.campaign_id === undefined) {
        return sendJson(res, 400, {
          success: false,
          error: 'amount_eth and campaign_id are required fields.',
        });
      }

      const paymentId = body.id || `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const receiptId = body.receipt_id || `RELIEF-80G-${Date.now().toString().slice(-6)}`;

      const newPayment = insertPayment({
        ...body,
        id: paymentId,
        receipt_id: receiptId,
      });

      return sendJson(res, 201, { success: true, payment: newPayment });
    }

    // 13. GET /api/receipts/:receiptId
    if (method === 'GET' && pathname.startsWith('/api/receipts/')) {
      const receiptId = decodeURIComponent(pathname.replace('/api/receipts/', ''));
      const receipt = getReceiptById(receiptId);
      if (!receipt) {
        return sendJson(res, 404, { success: false, error: 'Tax receipt not found in database.' });
      }
      return sendJson(res, 200, { success: true, receipt });
    }

    // 14. GET /api/export/csv
    if (method === 'GET' && pathname === '/api/export/csv') {
      const allRows = getAllPaymentsForExport();
      const headers = [
        'Payment ID',
        'Tax Receipt / Voucher ID',
        'Flow Type',
        'Campaign Name',
        'Party / Donor / Recipient',
        'Email',
        'Wallet Address',
        'Amount ETH',
        'Amount USD',
        'Amount INR',
        'Payment Method',
        'Status',
        'Tx Hash / UTR',
        'Milestone Purpose / Notes',
        'Date & Time',
      ];

      const csvRows = [
        headers.join(','),
        ...allRows.map((r) =>
          [
            `"${r.id}"`,
            `"${r.receipt_id || ''}"`,
            `"${r.flow_type || 'INFLOW (Donation)'}"`,
            `"${(r.campaign || '').replace(/"/g, '""')}"`,
            `"${(r.party_or_recipient || '').replace(/"/g, '""')}"`,
            `"${r.donor_email || ''}"`,
            `"${r.wallet_address || ''}"`,
            r.amount_eth,
            r.amount_fiat_usd,
            r.amount_fiat_inr,
            r.payment_method,
            r.payment_status,
            `"${r.transaction_hash || ''}"`,
            `"${(r.milestone_purpose_notes || '').replace(/"/g, '""')}"`,
            `"${r.date_time}"`,
          ].join(',')
        ),
      ];

      setCorsHeaders(res);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="disaster-relief-audit-ledger-${Date.now()}.csv"`
      );
      res.writeHead(200);
      res.end(csvRows.join('\r\n'));
      return;
    }

    // 15. POST /api/disbursements (Admin / Owner disbursement action)
    if (method === 'POST' && pathname === '/api/disbursements') {
      const auth = requireOwnerAuth(req);
      const body = await parseJsonBody(req);
      const disbId = body.id || `DISB-${Date.now()}`;
      const actorAddress = auth.authorized ? auth.user.address : (body.from_address || 'Contract Owner');

      const paymentRecord = insertDisbursement({
        ...body,
        id: disbId,
      });

      // Also register in indexed transactions
      if (body.transaction_hash) {
        await indexer.indexDirectTransaction({
          tx_hash: body.transaction_hash,
          type: 'withdrawal',
          campaign_id: body.campaign_id,
          from_address: actorAddress,
          to_address: body.recipient_address,
          amount: body.amount_eth,
          purpose: body.purpose,
          block_timestamp: body.created_at || Math.floor(Date.now() / 1000),
          actor: actorAddress,
        });
      }

      return sendJson(res, 201, { success: true, id: disbId, payment: paymentRecord });
    }

    // 16. GET /api/disbursements
    if (method === 'GET' && pathname === '/api/disbursements') {
      const campaignId = reqUrl.searchParams.get('campaignId');
      const list = getDisbursements(campaignId ? parseInt(campaignId, 10) : undefined);
      return sendJson(res, 200, { success: true, disbursements: list });
    }

    // 17. GET /api/campaigns
    if (method === 'GET' && pathname === '/api/campaigns') {
      const list = getDbCampaigns();
      return sendJson(res, 200, { success: true, campaigns: list, count: list.length });
    }

    // 18. POST /api/campaigns
    if (method === 'POST' && pathname === '/api/campaigns') {
      const body = await parseJsonBody(req);
      if (!body.name || (!body.target_eth && !body.target)) {
        return sendJson(res, 400, { success: false, error: 'name and target_eth are required fields.' });
      }
      const newCamp = insertDbCampaign(body);
      return sendJson(res, 201, { success: true, campaign: newCamp });
    }

    // 19. Health check
    if (method === 'GET' && pathname === '/api/health') {
      return sendJson(res, 200, {
        status: 'healthy',
        database: 'connected',
        indexer: 'active',
        contract: CONTRACT_ADDRESS,
      });
    }

    // Not found
    return sendJson(res, 404, { success: false, error: 'Endpoint not found' });
  } catch (err) {
    console.error('API Server Error:', err);
    return sendJson(res, 500, { success: false, error: err.message || 'Internal Server Error' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`ReliefChain Payments Database API running on http://localhost:${PORT}`);
});
