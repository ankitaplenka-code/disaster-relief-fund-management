# Disaster Relief Fund Management

Transparent Disaster Relief Crowdfunding and Auditable Fund Tracking Platform powered by Ethereum Smart Contracts, SQLite Audit Ledger, and React 19 Frontend.

---

## 🌟 Overview

**Disaster Relief Fund Management** is a decentralized application (dApp) designed to bring 100% transparency, cryptographic accountability, and real-time auditability to humanitarian disaster relief contributions.

- **On-Chain Smart Contracts:** Immutable fund tracking, campaign creation, and transparent multi-sig/owner disbursement execution on Ethereum (Sepolia testnet).
- **Relational Audit Ledger & Indexer:** Built-in Node.js server with native SQLite database syncing blockchain events and indexing donations and disbursements.
- **Sign-In with Ethereum (SIWE):** Secure cryptographic owner authentication (EIP-4361 standard) for administrative management.
- **Modern Web3 Frontend:** Built with React 19, TypeScript, Vite, Tailwind-styled components, and interactive Three.js 3D globe visualizations.

---

## 🏗️ Architecture

```
├── contracts/
│   └── DisasterRelief.sol        # Solidity smart contract for campaign & donation tracking
├── database/
│   ├── schema.sql                # SQLite relational database schema & indexes
│   └── relief_funds.sqlite       # Local database file (gitignored)
├── server/
│   ├── auth.mjs                  # SIWE & Owner authentication controller
│   ├── db.mjs                    # SQLite database operations & seeds
│   ├── indexer.mjs               # Sepolia blockchain event indexer
│   ├── server.mjs                # Node.js HTTP API server
│   └── test_e2e_security.mjs     # Security and access-control test suite
└── frontend/
    ├── src/
    │   ├── components/           # UI components, 3D scenes, modals, admin dashboard
    │   ├── config/               # Smart contract ABI and network configuration
    │   ├── context/              # MetaMask / Web3 wallet provider
    │   ├── services/             # API and smart contract communication services
    │   └── utils/                # Currency conversion and WebGL detection helpers
    └── package.json
```

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v22+ recommended)
- [MetaMask](https://metamask.io/) browser extension connected to Sepolia Testnet

### 1. Backend Server Setup
```bash
cd server
npm install
node server.mjs
```
The backend API starts on `http://localhost:5001`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend application starts on `http://localhost:5173`.

---

## 📜 Smart Contract

* **Network:** Sepolia Testnet
* **Contract Address:** `0x71c5c98d879d3de5b4f8d8d85bfa268809118ed3`
* **Explorer:** [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x71c5c98d879d3de5b4f8d8d85bfa268809118ed3)

---

## 🔒 Security & Privacy

- All sensitive credentials, private keys, and environment variables are strictly managed via `.env` files and excluded from version control.
- Test wallets in test suites are generated dynamically in-memory (`ethers.Wallet.createRandom()`).
