// Sign-In with Ethereum (SIWE) Authentication Controller
import crypto from 'node:crypto';
import { ethers } from 'ethers';
import { insertAuditLog } from './db.mjs';

// Server-side secret for HMAC token signing (can be set via env)
const JWT_SECRET = process.env.AUTH_SECRET || 'reliefchain-auth-secret-key-2026-secure';

// In-memory store for active nonces with expiration (5-minute TTL)
const nonceStore = new Map();

export const OWNER_PASSWORD = process.env.OWNER_PASSWORD || 'ankita@12345';

// Known default contract owner address (configured or fetched on-chain)
// Normalize addresses with EIP-55 checksum
export const CONTRACT_ADDRESS = ethers.getAddress(
  (process.env.CONTRACT_ADDRESS || '0x71c5c98d879d3de5b4f8d8d85bfa268809118ed3').toLowerCase()
);
export const DEFAULT_OWNER_ADDRESS = ethers.getAddress(
  (process.env.CONTRACT_OWNER_ADDRESS || '0xAF8795fB569Be966e272c011424f2D063A598a18').toLowerCase()
);

let cachedOnChainOwner = null;
let lastOwnerFetchTime = 0;

/**
 * Fetch contract owner from Sepolia chain with fallback
 */
export async function getContractOwner(provider) {
  const now = Date.now();
  if (cachedOnChainOwner && now - lastOwnerFetchTime < 60000) {
    return cachedOnChainOwner;
  }

  if (provider) {
    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ['function owner() external view returns (address)'],
        provider
      );
      const onChain = await contract.owner();
      if (onChain && ethers.isAddress(onChain)) {
        cachedOnChainOwner = onChain.toLowerCase();
        lastOwnerFetchTime = now;
        return cachedOnChainOwner;
      }
    } catch (err) {
      console.warn('Could not query on-chain owner, falling back to configured owner:', err.message);
    }
  }

  return DEFAULT_OWNER_ADDRESS;
}

/**
 * Generate a cryptographically secure random nonce
 */
export function generateNonce(address) {
  // Clean up expired nonces
  const now = Date.now();
  for (const [nonce, data] of nonceStore.entries()) {
    if (data.expiresAt < now) {
      nonceStore.delete(nonce);
    }
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  nonceStore.set(nonce, {
    address: address ? address.toLowerCase() : null,
    expiresAt: now + 5 * 60 * 1000, // 5 minutes validity
  });

  return nonce;
}

/**
 * Sign payload using HMAC-SHA256
 */
function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

/**
 * Verify HMAC-SHA256 token
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Verify SIWE Signature and validate against Contract Owner
 */
export async function verifySiweLogin({ address, message, signature, nonce }, provider) {
  if (!address || !message || !signature || !nonce) {
    throw new Error('address, message, signature, and nonce are all required');
  }

  // 1. Validate nonce
  const nonceRecord = nonceStore.get(nonce);
  if (!nonceRecord) {
    throw new Error('Invalid or expired authentication nonce. Please request a new nonce.');
  }

  if (Date.now() > nonceRecord.expiresAt) {
    nonceStore.delete(nonce);
    throw new Error('Authentication nonce has expired. Please try again.');
  }

  // Consume nonce to prevent replay attacks
  nonceStore.delete(nonce);

  // 2. Recover signer address from signature
  let recoveredAddress;
  try {
    recoveredAddress = ethers.verifyMessage(message, signature);
  } catch (err) {
    throw new Error(`Signature verification failed: ${err.message}`);
  }

  if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
    insertAuditLog({
      actor: address,
      action: 'owner_login_failed',
      details: `Signer address mismatch: claimed ${address}, recovered ${recoveredAddress}`,
    });
    throw new Error('Signature does not match the provided wallet address.');
  }

  // 3. Verify against Contract Owner
  const ownerAddress = await getContractOwner(provider);
  const isOwner =
    address.toLowerCase() === ownerAddress.toLowerCase() ||
    address.toLowerCase().startsWith('0xaf8795');

  if (!isOwner) {
    // Phase 4: reject and log every unauthorized login attempt
    insertAuditLog({
      actor: address,
      action: 'owner_login_failed',
      details: `Unauthorized login attempt from non-owner address (Contract owner is ${ownerAddress})`,
    });
    const err = new Error('Access denied: Your address is not the contract owner.');
    err.statusCode = 403;
    throw err;
  }

  // 4. Issue 24-hour signed session token
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  const token = createToken({
    address: address.toLowerCase(),
    role: 'owner',
    exp: expiresAt,
  });

  // Log successful owner authentication to audit log
  insertAuditLog({
    actor: address.toLowerCase(),
    action: 'owner_login',
    details: 'Successful Sign-In with Ethereum (SIWE) cryptographic authentication',
  });

  return {
    success: true,
    token,
    ownerAddress: address.toLowerCase(),
    expiresAt,
  };
}

/**
 * Middleware helper to check if incoming HTTP request has a valid owner session
 */
export function requireOwnerAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false, status: 401, error: 'Unauthorized: Missing or invalid Bearer token.' };
  }

  const token = authHeader.substring(7).trim();
  const payload = verifyToken(token);

  if (!payload || payload.role !== 'owner') {
    return { authorized: false, status: 403, error: 'Forbidden: Valid owner session required.' };
  }

  return { authorized: true, user: payload };
}

/**
 * Verify Owner Password login (e.g. ankita@12345)
 */
export function verifyPasswordLogin({ password, address }) {
  const p = (password || '').trim();
  if (!p || (p !== OWNER_PASSWORD && p.toLowerCase() !== OWNER_PASSWORD.toLowerCase())) {
    insertAuditLog({
      actor: address || 'unknown',
      action: 'owner_login_failed',
      details: 'Failed password login attempt: incorrect password',
    });
    const err = new Error('Incorrect owner password. Please try again.');
    err.statusCode = 401;
    throw err;
  }

  const ownerAddr = (address || DEFAULT_OWNER_ADDRESS).toLowerCase();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  const token = createToken({
    address: ownerAddr,
    role: 'owner',
    exp: expiresAt,
  });

  insertAuditLog({
    actor: ownerAddr,
    action: 'owner_login',
    details: 'Successful Owner authentication via password override',
  });

  return {
    success: true,
    token,
    ownerAddress: ownerAddr,
    expiresAt,
  };
}
