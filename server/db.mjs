// Native SQLite Database Manager using Node.js 24 node:sqlite
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path in project root/database/relief_funds.sqlite
const DB_DIR = path.resolve(__dirname, '../database');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
const DB_PATH = path.join(DB_DIR, 'relief_funds.sqlite');

export const db = new DatabaseSync(DB_PATH);

// Initialize schema tables & indexes
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      target_eth REAL NOT NULL,
      deadline INTEGER NOT NULL,
      category TEXT DEFAULT 'Disaster Relief',
      status TEXT DEFAULT 'Active',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      campaign_id INTEGER NOT NULL,
      donor_name TEXT DEFAULT 'Anonymous Donor',
      donor_email TEXT,
      donor_wallet_address TEXT,
      amount_eth REAL NOT NULL,
      amount_fiat_usd REAL,
      amount_fiat_inr REAL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'CONFIRMED',
      transaction_hash TEXT,
      receipt_id TEXT UNIQUE,
      notes TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    );

    CREATE TABLE IF NOT EXISTS disbursements (
      id TEXT PRIMARY KEY,
      campaign_id INTEGER NOT NULL,
      amount_eth REAL NOT NULL,
      purpose TEXT NOT NULL,
      recipient_address TEXT NOT NULL,
      transaction_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    );

    -- Phase 1 Master Payment DB Table (Indexed on-chain transactions)
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tx_hash TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('donation', 'withdrawal')),
      campaign_id INTEGER NOT NULL,
      from_address TEXT NOT NULL,
      to_address TEXT NOT NULL,
      amount REAL NOT NULL,
      purpose TEXT,
      block_number INTEGER,
      block_timestamp INTEGER NOT NULL,
      indexed_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed'
    );

    -- Non-financial traceability audit trail
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      target_tx_id INTEGER,
      details TEXT,
      created_at INTEGER NOT NULL
    );

    -- Indexes for high-performance querying
    CREATE INDEX IF NOT EXISTS idx_payments_campaign ON payments(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_payments_wallet ON payments(donor_wallet_address);
    CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payments(receipt_id);
    CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);

    CREATE INDEX IF NOT EXISTS idx_tx_hash ON transactions(tx_hash);
    CREATE INDEX IF NOT EXISTS idx_tx_campaign ON transactions(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_tx_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_tx_block_time ON transactions(block_timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
  `);

  // Ensure payment_type column exists in payments table
  try {
    const tableInfo = db.prepare("PRAGMA table_info(payments)").all();
    const hasPaymentType = tableInfo.some((col) => col.name === 'payment_type');
    if (!hasPaymentType) {
      db.exec("ALTER TABLE payments ADD COLUMN payment_type TEXT DEFAULT 'DONATION'");
    }
    db.exec("CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(payment_type);");
  } catch (err) {
    console.warn('Payment type column check warning:', err.message);
  }

  // Ensure amount_raised column exists in campaigns table
  try {
    const campInfo = db.prepare("PRAGMA table_info(campaigns)").all();
    const hasAmountRaised = campInfo.some((col) => col.name === 'amount_raised');
    if (!hasAmountRaised) {
      db.exec("ALTER TABLE campaigns ADD COLUMN amount_raised REAL DEFAULT 0");
      // Populate initial amounts for seed campaigns
      try {
        db.prepare("UPDATE campaigns SET amount_raised = 9.45 WHERE id = 0 AND (amount_raised IS NULL OR amount_raised = 0)").run();
        db.prepare("UPDATE campaigns SET amount_raised = 25.0 WHERE id = 1 AND (amount_raised IS NULL OR amount_raised = 0)").run();
        db.prepare("UPDATE campaigns SET amount_raised = 8.2 WHERE id = 2 AND (amount_raised IS NULL OR amount_raised = 0)").run();
      } catch {}
    }
  } catch (err) {
    console.warn('Campaign amount_raised column check warning:', err.message);
  }

  // Seed sample campaigns if empty
  const campaignCount = db.prepare('SELECT COUNT(*) as count FROM campaigns').get().count;
  if (campaignCount === 0) {
    const insertCamp = db.prepare(`
      INSERT INTO campaigns (id, name, description, target_eth, deadline, category, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCamp.run(
      0,
      'Assam & Sylhet Monsoon Flood Emergency Relief 2026',
      'Drinking water units and food rations for marooned families.',
      15.0,
      Math.floor(Date.now() / 1000) + 86400 * 18,
      'Flood Relief',
      'Active',
      Math.floor(Date.now() / 1000) - 86400 * 5
    );

    insertCamp.run(
      1,
      'Atlas High-Altitude Earthquake Medical Supplies Fund',
      'Surgical trauma kits and cold-chain vaccines for remote clinics.',
      25.0,
      Math.floor(Date.now() / 1000) + 86400 * 25,
      'Earthquake',
      'Active',
      Math.floor(Date.now() / 1000) - 86400 * 10
    );

    insertCamp.run(
      2,
      'Southern Drought Zone Agricultural Water Harvesting',
      '45 deep-bore solar well pumps for drought-struck villages.',
      10.0,
      Math.floor(Date.now() / 1000) - 86400 * 3,
      'Drought & Water',
      'Ended',
      Math.floor(Date.now() / 1000) - 86400 * 20
    );
  }

  // Seed realistic payments if empty
  const paymentCount = db.prepare('SELECT COUNT(*) as count FROM payments').get().count;
  if (paymentCount === 0) {
    const insertPay = db.prepare(`
      INSERT INTO payments (
        id, campaign_id, donor_name, donor_email, donor_wallet_address,
        amount_eth, amount_fiat_usd, amount_fiat_inr, payment_method,
        payment_status, transaction_hash, receipt_id, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPay.run(
      'PAY-1001',
      0,
      'Vikramaditya Sharma',
      'vikram.sharma@example.com',
      '0x3E5c486eF8B6001Ea514D6200Eb8F160358E298F',
      2.5,
      8500.0,
      712500.0,
      'WEB3_METAMASK',
      'CONFIRMED',
      '0x9fa1c78e47087bc00e7cb2df721a37c093a207297e29bb3e680a6b7371cbbe19',
      'RELIEF-80G-894218',
      'Contribution for emergency water units in Cachar district.',
      Math.floor(Date.now() / 1000) - 3600 * 14
    );

    insertPay.run(
      'PAY-1002',
      0,
      'Dr. Ananya Roy',
      'ananya.roy@healthtrust.org',
      null,
      0.35,
      1190.0,
      99750.0,
      'QR_UPI',
      'CONFIRMED',
      'UPI/2026/0914/908234120934',
      'RELIEF-80G-894219',
      'UPI Scan & Pay via GPay. Ref: ICICI-98241.',
      Math.floor(Date.now() / 1000) - 3600 * 6
    );

    insertPay.run(
      'PAY-1003',
      1,
      'Elena Rostova',
      'elena.rostova@geneva.ch',
      '0x88921827Acbd5D2644265fC3AbB31D124BfEb032',
      5.0,
      17000.0,
      1425000.0,
      'WEB3_METAMASK',
      'CONFIRMED',
      '0x3ec82f91bbca387402a11bdf28e734c562e8461ab0838dbbf71c53248325a671',
      'RELIEF-80G-894220',
      'Medical emergency trauma surgical supplies allocation.',
      Math.floor(Date.now() / 1000) - 3600 * 48
    );
  }

  // Seed sample disbursements if empty
  const disbCount = db.prepare('SELECT COUNT(*) as count FROM disbursements').get().count;
  if (disbCount === 0) {
    const insertDisb = db.prepare(`
      INSERT INTO disbursements (id, campaign_id, amount_eth, purpose, recipient_address, transaction_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertDisb.run(
      'DISB-01',
      0,
      3.0,
      'Procurement of 500 Water Purification Filter kits & dispatched via local Red Cross team',
      '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
      '0x5ac7e88939a04702b8b9cbfa2721ab993f41249bce376dae932948ca298bfd11',
      Math.floor(Date.now() / 1000) - 3600 * 8
    );
  }

  // Seed realistic transactions if empty
  const txCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;
  if (txCount === 0) {
    const now = Math.floor(Date.now() / 1000);

    // Initial donations
    upsertTransaction({
      tx_hash: '0x9fa1c78e47087bc00e7cb2df721a37c093a207297e29bb3e680a6b7371cbbe19',
      type: 'donation',
      campaign_id: 0,
      from_address: '0x3E5c486eF8B6001Ea514D6200Eb8F160358E298F',
      to_address: '0x71C5c98D879d3De5B4f8D8d85bfa268809118eD3',
      amount: 2.5,
      purpose: null,
      block_number: 6721094,
      block_timestamp: now - 3600 * 14,
      indexed_at: now - 3600 * 14,
      status: 'confirmed',
    });

    upsertTransaction({
      tx_hash: '0x3ec82f91bbca387402a11bdf28e734c562e8461ab0838dbbf71c53248325a671',
      type: 'donation',
      campaign_id: 1,
      from_address: '0x88921827Acbd5D2644265fC3AbB31D124BfEb032',
      to_address: '0x71C5c98D879d3De5B4f8D8d85bfa268809118eD3',
      amount: 5.0,
      purpose: null,
      block_number: 6721150,
      block_timestamp: now - 3600 * 48,
      indexed_at: now - 3600 * 48,
      status: 'confirmed',
    });

    upsertTransaction({
      tx_hash: '0x2ba58c148a27d312bc9e29a399885e3a89047bfec15a4eb392d472bf6e10f13a',
      type: 'donation',
      campaign_id: 0,
      from_address: '0x1247b99c7161b9a2DAb364375bDE3B948a39C6D1',
      to_address: '0x71C5c98D879d3De5B4f8D8d85bfa268809118eD3',
      amount: 1.25,
      purpose: null,
      block_number: 6721204,
      block_timestamp: now - 3600 * 5,
      indexed_at: now - 3600 * 5,
      status: 'confirmed',
    });

    // Initial withdrawal (owner-only visibility)
    upsertTransaction({
      tx_hash: '0x5ac7e88939a04702b8b9cbfa2721ab993f41249bce376dae932948ca298bfd11',
      type: 'withdrawal',
      campaign_id: 0,
      from_address: '0x71C5c98D879d3De5B4f8D8d85bfa268809118eD3',
      to_address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
      amount: 3.0,
      purpose: 'Procurement of 500 Water Purification Filter units via Red Cross field logistics',
      block_number: 6721320,
      block_timestamp: now - 3600 * 8,
      indexed_at: now - 3600 * 8,
      status: 'confirmed',
    });

    // Seed corresponding audit trail
    insertAuditLog({
      actor: 'indexer',
      action: 'transaction_indexed',
      target_tx_id: 1,
      details: 'Historical DonationReceived event indexed (2.5 ETH)',
      created_at: now - 3600 * 14,
    });

    insertAuditLog({
      actor: 'indexer',
      action: 'transaction_indexed',
      target_tx_id: 2,
      details: 'Historical DonationReceived event indexed (5.0 ETH)',
      created_at: now - 3600 * 48,
    });

    insertAuditLog({
      actor: 'indexer',
      action: 'transaction_indexed',
      target_tx_id: 3,
      details: 'Historical DonationReceived event indexed (1.25 ETH)',
      created_at: now - 3600 * 5,
    });

    insertAuditLog({
      actor: 'indexer',
      action: 'transaction_indexed',
      target_tx_id: 4,
      details: 'Historical FundsWithdrawn event indexed (3.0 ETH to Red Cross logistics)',
      created_at: now - 3600 * 8,
    });
  }

  // Ensure all historical disbursements and withdrawals are synced to payments table
  try {
    const existingDisbursements = db.prepare('SELECT * FROM disbursements').all();
    const insertPaySync = db.prepare(`
      INSERT OR REPLACE INTO payments (
        id, campaign_id, donor_name, donor_email, donor_wallet_address,
        amount_eth, amount_fiat_usd, amount_fiat_inr, payment_method,
        payment_status, transaction_hash, receipt_id, notes, created_at, payment_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const disb of existingDisbursements) {
      const receiptId = `RELIEF-DISB-${disb.created_at.toString().slice(-6)}`;
      const ethAmount = parseFloat(disb.amount_eth);
      insertPaySync.run(
        disb.id,
        disb.campaign_id,
        `Disbursement: ${disb.recipient_address.substring(0, 6)}...${disb.recipient_address.substring(disb.recipient_address.length - 4)}`,
        null,
        disb.recipient_address,
        ethAmount,
        ethAmount * 3400,
        ethAmount * 285000,
        'WITHDRAWAL_DISBURSEMENT',
        'CONFIRMED',
        disb.transaction_hash,
        receiptId,
        disb.purpose,
        disb.created_at,
        'DISBURSEMENT'
      );
    }

    // Also sync any withdrawal transactions that might not be in disbursements/payments
    const withdrawalTxs = db.prepare("SELECT * FROM transactions WHERE type = 'withdrawal'").all();
    for (const wTx of withdrawalTxs) {
      const existing = db.prepare('SELECT id FROM payments WHERE transaction_hash = ?').get(wTx.tx_hash);
      if (!existing) {
        const disbId = `DISB-TX-${wTx.id}`;
        const receiptId = `RELIEF-DISB-${wTx.block_timestamp.toString().slice(-6)}`;
        insertPaySync.run(
          disbId,
          wTx.campaign_id,
          `Disbursement: ${wTx.to_address.substring(0, 6)}...${wTx.to_address.substring(wTx.to_address.length - 4)}`,
          null,
          wTx.to_address,
          wTx.amount,
          wTx.amount * 3400,
          wTx.amount * 285000,
          'WITHDRAWAL_DISBURSEMENT',
          'CONFIRMED',
          wTx.tx_hash,
          receiptId,
          wTx.purpose || 'Relief fund disbursement',
          wTx.block_timestamp,
          'DISBURSEMENT'
        );
      }
    }
  } catch (err) {
    console.warn('Sync historical withdrawals to payments warning:', err.message);
  }

  console.log('Disaster Relief SQLite Database initialized successfully at:', DB_PATH);
}

// ==========================================
// Phase 1 Transactions & Audit Log Operations
// ==========================================

/**
 * Idempotently insert or update a transaction by tx_hash
 */
export function upsertTransaction(tx) {
  const stmt = db.prepare(`
    INSERT INTO transactions (
      tx_hash, type, campaign_id, from_address, to_address,
      amount, purpose, block_number, block_timestamp, indexed_at, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(tx_hash) DO UPDATE SET
      status = excluded.status,
      block_number = COALESCE(excluded.block_number, transactions.block_number),
      block_timestamp = COALESCE(excluded.block_timestamp, transactions.block_timestamp)
  `);

  stmt.run(
    tx.tx_hash,
    tx.type,
    tx.campaign_id,
    tx.from_address,
    tx.to_address,
    tx.amount,
    tx.purpose || null,
    tx.block_number || null,
    tx.block_timestamp,
    tx.indexed_at || Math.floor(Date.now() / 1000),
    tx.status || 'confirmed'
  );

  return db.prepare('SELECT * FROM transactions WHERE tx_hash = ?').get(tx.tx_hash);
}

export function getTransactionByHash(txHash) {
  return db.prepare('SELECT * FROM transactions WHERE tx_hash = ?').get(txHash);
}

/**
 * Get public donations for a specific campaign (or all if campaignId is omitted/'ALL')
 */
export function getDonationsByCampaign(campaignId, { limit = 50, offset = 0 } = {}) {
  let query = `
    SELECT t.*, c.name as campaign_name,
           datetime(t.block_timestamp, 'unixepoch') as block_timestamp_iso
    FROM transactions t
    LEFT JOIN campaigns c ON t.campaign_id = c.id
    WHERE t.type = 'donation'
  `;
  const params = [];
  if (campaignId !== undefined && campaignId !== 'ALL') {
    query += ' AND t.campaign_id = ?';
    params.push(campaignId);
  }
  query += ' ORDER BY t.block_timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}

/**
 * Get withdrawals for a specific campaign - OWNER ONLY
 */
export function getWithdrawalsByCampaign(campaignId, { limit = 50, offset = 0 } = {}) {
  let query = `
    SELECT t.*, c.name as campaign_name,
           datetime(t.block_timestamp, 'unixepoch') as block_timestamp_iso
    FROM transactions t
    LEFT JOIN campaigns c ON t.campaign_id = c.id
    WHERE t.type = 'withdrawal'
  `;
  const params = [];
  if (campaignId !== undefined && campaignId !== 'ALL') {
    query += ' AND t.campaign_id = ?';
    params.push(campaignId);
  }
  query += ' ORDER BY t.block_timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}

/**
 * Get all transactions with filters
 */
export function getAllTransactions({ type, campaignId, limit = 50, offset = 0 } = {}) {
  let query = `
    SELECT t.*, c.name as campaign_name,
           datetime(t.block_timestamp, 'unixepoch') as block_timestamp_iso
    FROM transactions t
    LEFT JOIN campaigns c ON t.campaign_id = c.id
    WHERE 1=1
  `;
  const params = [];
  if (type) {
    query += ' AND t.type = ?';
    params.push(type);
  }
  if (campaignId !== undefined && campaignId !== 'ALL') {
    query += ' AND t.campaign_id = ?';
    params.push(campaignId);
  }
  query += ' ORDER BY t.block_timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}

/**
 * Record a non-financial traceability audit event
 */
export function insertAuditLog({ actor, action, target_tx_id = null, details = null, created_at = null }) {
  const stmt = db.prepare(`
    INSERT INTO audit_log (actor, action, target_tx_id, details, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const res = stmt.run(
    actor,
    action,
    target_tx_id,
    typeof details === 'object' ? JSON.stringify(details) : (details || null),
    created_at || Math.floor(Date.now() / 1000)
  );

  return { id: res.lastInsertRowid };
}

/**
 * Retrieve audit log records
 */
export function getAuditLogs({ limit = 50, offset = 0, action = null } = {}) {
  let query = `
    SELECT a.*, datetime(a.created_at, 'unixepoch') as created_at_iso
    FROM audit_log a
    WHERE 1=1
  `;
  const params = [];
  if (action && action !== 'ALL') {
    query += ' AND a.action = ?';
    params.push(action);
  }
  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}

// ==========================================
// Existing Payments / Campaigns Operations
// ==========================================

export function insertPayment(p) {
  const stmt = db.prepare(`
    INSERT INTO payments (
      id, campaign_id, donor_name, donor_email, donor_wallet_address,
      amount_eth, amount_fiat_usd, amount_fiat_inr, payment_method,
      payment_status, transaction_hash, receipt_id, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const createdAt = p.created_at || Math.floor(Date.now() / 1000);
  const txHash = p.transaction_hash || `0xpay-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  stmt.run(
    p.id,
    p.campaign_id,
    p.donor_name || 'Anonymous Donor',
    p.donor_email || null,
    p.donor_wallet_address || null,
    p.amount_eth,
    p.amount_fiat_usd || p.amount_eth * 3400,
    p.amount_fiat_inr || p.amount_eth * 285000,
    p.payment_method,
    p.payment_status || 'CONFIRMED',
    txHash,
    p.receipt_id,
    p.notes || null,
    createdAt
  );

  // Auto-record in transactions table for unified audit
  try {
    upsertTransaction({
      tx_hash: txHash,
      type: 'donation',
      campaign_id: p.campaign_id,
      from_address: p.donor_wallet_address || '0xAnonymousDonor',
      to_address: '0x71C5c98D879d3De5B4f8D8d85bfa268809118eD3',
      amount: p.amount_eth,
      purpose: p.notes || `Donation received for Campaign #${p.campaign_id}`,
      block_timestamp: createdAt,
      status: 'confirmed',
    });
  } catch (txErr) {
    console.warn('Could not auto-insert transaction from payment:', txErr.message);
  }

  // Auto-record in system audit trail
  try {
    const actorLabel = p.donor_wallet_address
      ? `${p.donor_wallet_address.slice(0, 6)}...${p.donor_wallet_address.slice(-4)}`
      : p.donor_name || 'Donor';
    insertAuditLog({
      actor: actorLabel,
      action: 'donation_received',
      details: `Donation received: +${p.amount_eth} ETH for Campaign #${p.campaign_id} via ${p.payment_method || 'WEB3'}`,
      created_at: createdAt,
    });
  } catch (auditErr) {
    console.warn('Could not record audit log for payment:', auditErr.message);
  }

  // Auto-update amount_raised in campaigns table
  try {
    const updateCamp = db.prepare(`
      UPDATE campaigns 
      SET amount_raised = COALESCE(amount_raised, 0) + ? 
      WHERE id = ?
    `);
    updateCamp.run(parseFloat(p.amount_eth), parseInt(p.campaign_id, 10));
  } catch (campErr) {
    console.warn('Could not update campaign amount_raised in DB:', campErr.message);
  }

  return getPaymentById(p.id);
}

export function getDbCampaigns() {
  return db.prepare('SELECT * FROM campaigns ORDER BY id ASC').all();
}

export function insertDbCampaign(c) {
  let campaignId = c.id;
  if (campaignId === undefined || campaignId === null) {
    const maxRow = db.prepare('SELECT MAX(id) as maxId FROM campaigns').get();
    campaignId = (maxRow?.maxId !== undefined && maxRow.maxId !== null ? maxRow.maxId : -1) + 1;
  }

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO campaigns (id, name, description, target_eth, deadline, category, status, created_at, amount_raised)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, 0))
  `);

  const createdAt = c.created_at || Math.floor(Date.now() / 1000);

  stmt.run(
    campaignId,
    c.name,
    c.description || '',
    parseFloat(c.target_eth || c.target || '0'),
    parseInt(c.deadline, 10),
    c.category || 'Disaster Relief',
    c.status || 'Active',
    createdAt,
    parseFloat(c.amount_raised || c.amountRaised || '0')
  );

  // Auto-record campaign creation in audit trail
  try {
    insertAuditLog({
      actor: 'Admin / Relief Organizer',
      action: 'campaign_created',
      details: `New emergency relief campaign launched: "${c.name}" (ID #${campaignId}, Target: ${c.target_eth || c.target} ETH)`,
      created_at: createdAt,
    });
  } catch (auditErr) {
    console.warn('Could not record audit log for campaign creation:', auditErr.message);
  }

  return db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
}

export function getPaymentById(id) {
  return db.prepare(`
    SELECT p.*, c.name as campaign_name
    FROM payments p
    LEFT JOIN campaigns c ON p.campaign_id = c.id
    WHERE p.id = ?
  `).get(id);
}

export function getReceiptById(receiptId) {
  return db.prepare(`
    SELECT p.*, c.name as campaign_name
    FROM payments p
    LEFT JOIN campaigns c ON p.campaign_id = c.id
    WHERE p.receipt_id = ?
  `).get(receiptId);
}

export function getPayments({ campaignId, method, status, type, search, limit = 50, offset = 0 } = {}) {
  let query = `
    SELECT p.*, c.name as campaign_name
    FROM payments p
    LEFT JOIN campaigns c ON p.campaign_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (campaignId !== undefined && campaignId !== 'ALL') {
    query += ' AND p.campaign_id = ?';
    params.push(campaignId);
  }

  if (type && type !== 'ALL') {
    if (type === 'DONATION') {
      query += " AND (p.payment_type = 'DONATION' OR p.payment_type IS NULL OR p.payment_method != 'WITHDRAWAL_DISBURSEMENT')";
    } else if (type === 'DISBURSEMENT' || type === 'WITHDRAWAL') {
      query += " AND (p.payment_type = 'DISBURSEMENT' OR p.payment_method = 'WITHDRAWAL_DISBURSEMENT')";
    }
  }

  if (method && method !== 'ALL') {
    query += ' AND p.payment_method = ?';
    params.push(method);
  }

  if (status && status !== 'ALL') {
    query += ' AND p.payment_status = ?';
    params.push(status);
  }

  if (search && search.trim()) {
    query += ` AND (
      p.donor_name LIKE ? OR
      p.donor_email LIKE ? OR
      p.donor_wallet_address LIKE ? OR
      p.transaction_hash LIKE ? OR
      p.receipt_id LIKE ? OR
      p.notes LIKE ?
    )`;
    const s = `%${search.trim()}%`;
    params.push(s, s, s, s, s, s);
  }

  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}

export function getPaymentStats() {
  const donationStats = db.prepare(`
    SELECT 
      COUNT(*) as total_donations_count,
      COALESCE(SUM(amount_eth), 0) as total_raised_eth,
      COALESCE(SUM(amount_fiat_usd), 0) as total_raised_usd,
      COALESCE(SUM(amount_fiat_inr), 0) as total_raised_inr,
      COUNT(DISTINCT COALESCE(donor_wallet_address, donor_email, id)) as unique_donors
    FROM payments
    WHERE payment_status = 'CONFIRMED'
      AND (payment_type = 'DONATION' OR payment_type IS NULL OR payment_method != 'WITHDRAWAL_DISBURSEMENT')
  `).get();

  const withdrawalStats = db.prepare(`
    SELECT 
      COUNT(*) as total_withdrawals_count,
      COALESCE(SUM(amount_eth), 0) as total_disbursed_eth,
      COALESCE(SUM(amount_fiat_usd), 0) as total_disbursed_usd,
      COALESCE(SUM(amount_fiat_inr), 0) as total_disbursed_inr
    FROM payments
    WHERE payment_status = 'CONFIRMED'
      AND (payment_type = 'DISBURSEMENT' OR payment_method = 'WITHDRAWAL_DISBURSEMENT')
  `).get();

  const methodBreakdown = db.prepare(`
    SELECT payment_method, COUNT(*) as count, SUM(amount_eth) as total_eth
    FROM payments
    WHERE payment_status = 'CONFIRMED'
    GROUP BY payment_method
  `).all();

  const totalRaisedEth = donationStats.total_raised_eth || 0;
  const totalDisbursedEth = withdrawalStats.total_disbursed_eth || 0;
  const netEth = Math.max(0, totalRaisedEth - totalDisbursedEth);

  const totalRaisedInr = donationStats.total_raised_inr || 0;
  const totalDisbursedInr = withdrawalStats.total_disbursed_inr || 0;
  const netInr = Math.max(0, totalRaisedInr - totalDisbursedInr);

  return {
    ...donationStats,
    ...withdrawalStats,
    net_balance_eth: netEth,
    net_balance_inr: netInr,
    methods: methodBreakdown,
  };
}

export function getAllPaymentsForExport() {
  return db.prepare(`
    SELECT 
      p.id,
      p.receipt_id,
      CASE 
        WHEN p.payment_type = 'DISBURSEMENT' OR p.payment_method = 'WITHDRAWAL_DISBURSEMENT' THEN 'OUTFLOW (Disbursement)'
        ELSE 'INFLOW (Donation)'
      END as flow_type,
      c.name as campaign,
      p.donor_name as party_or_recipient,
      p.donor_email,
      p.donor_wallet_address as wallet_address,
      p.amount_eth,
      p.amount_fiat_usd,
      p.amount_fiat_inr,
      p.payment_method,
      p.payment_status,
      p.transaction_hash,
      p.notes as milestone_purpose_notes,
      datetime(p.created_at, 'unixepoch', 'localtime') as date_time
    FROM payments p
    LEFT JOIN campaigns c ON p.campaign_id = c.id
    ORDER BY p.created_at DESC
  `).all();
}

export function insertDisbursement(d) {
  const disbId = d.id || `DISB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const createdAt = d.created_at || Math.floor(Date.now() / 1000);
  const receiptId = d.receipt_id || `RELIEF-DISB-${createdAt.toString().slice(-6)}`;
  const ethAmount = parseFloat(d.amount_eth);
  const recipientAddr = d.recipient_address || '0x0000000000000000000000000000000000000000';
  const shortRecipient = `${recipientAddr.substring(0, 6)}...${recipientAddr.substring(recipientAddr.length - 4)}`;
  const recipientLabel = d.recipient_name || `Disbursement: ${shortRecipient}`;

  // 1. Insert or replace in disbursements table
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO disbursements (id, campaign_id, amount_eth, purpose, recipient_address, transaction_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    disbId,
    d.campaign_id,
    ethAmount,
    d.purpose,
    recipientAddr,
    d.transaction_hash || '',
    createdAt
  );

  // 2. Insert or replace into payments table (ensuring it's permanently present in payment db)
  const payStmt = db.prepare(`
    INSERT OR REPLACE INTO payments (
      id, campaign_id, donor_name, donor_email, donor_wallet_address,
      amount_eth, amount_fiat_usd, amount_fiat_inr, payment_method,
      payment_status, transaction_hash, receipt_id, notes, created_at, payment_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  payStmt.run(
    disbId,
    d.campaign_id,
    recipientLabel,
    null,
    recipientAddr,
    ethAmount,
    ethAmount * 3400,
    ethAmount * 285000,
    'WITHDRAWAL_DISBURSEMENT',
    'CONFIRMED',
    d.transaction_hash || null,
    receiptId,
    d.purpose,
    createdAt,
    'DISBURSEMENT'
  );

  // 3. Upsert into transactions table
  if (d.transaction_hash) {
    upsertTransaction({
      tx_hash: d.transaction_hash,
      type: 'withdrawal',
      campaign_id: d.campaign_id,
      from_address: '0x71C5c98D879d3De5B4f8D8d85bfa268809118eD3',
      to_address: recipientAddr,
      amount: ethAmount,
      purpose: d.purpose,
      block_timestamp: createdAt,
      status: 'confirmed',
    });
  }

  // 4. Record in audit trail
  insertAuditLog({
    actor: recipientAddr ? `Disbursed to ${shortRecipient}` : 'admin',
    action: 'withdrawal_disbursed',
    details: `Disbursed ${ethAmount} ETH for Campaign #${d.campaign_id}: ${d.purpose}`,
    created_at: createdAt,
  });

  return getPaymentById(disbId);
}

export function getDisbursements(campaignId) {
  let query = 'SELECT * FROM disbursements';
  const params = [];
  if (campaignId !== undefined && campaignId !== 'ALL') {
    query += ' WHERE campaign_id = ?';
    params.push(campaignId);
  }
  query += ' ORDER BY created_at DESC';
  return db.prepare(query).all(...params);
}
