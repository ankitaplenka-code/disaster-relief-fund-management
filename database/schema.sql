-- Relational Schema for Disaster Relief Payments Database
-- Stored in SQLite (database/relief_funds.sqlite)

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
    payment_method TEXT NOT NULL CHECK(payment_method IN ('WEB3_METAMASK', 'QR_CRYPTO', 'QR_UPI', 'BANK_WIRE', 'CREDIT_CARD')),
    payment_status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK(payment_status IN ('CONFIRMED', 'PENDING_VERIFICATION', 'FAILED')),
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

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_payments_campaign ON payments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_payments_wallet ON payments(donor_wallet_address);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payments(receipt_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_disbursements_campaign ON disbursements(campaign_id);
