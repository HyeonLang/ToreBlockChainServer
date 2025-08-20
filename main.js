'use strict';

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
  
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`);
  
  // 요청 본문이 있는 경우 로그
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`[${timestamp}] Request Body:`, JSON.stringify(req.body, null, 2));
  }
  
  // 응답 완료 후 상태 코드 로그
  res.on('finish', () => {
    const statusCode = res.statusCode;
    const contentLength = res.get('Content-Length') || 0;
    console.log(`[${timestamp}] ${method} ${url} - Status: ${statusCode} - Size: ${contentLength} bytes`);
  });
  
  next();
});

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// In-memory storage for issued NFTs (off-chain)
const issuedNfts = new Map();

function isValidEthAddress(addr) {
  return typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function createId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return crypto.randomBytes(16).toString('hex');
}

function signRecord(record) {
  const secret = process.env.OFFCHAIN_SECRET || 'CHANGE_ME_IN_PRODUCTION_ONLY_FOR_DEV';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(record));
  return hmac.digest('hex');
}

// 루트 엔드포인트
app.get('/', (req, res) => {
  res.json({
    message: 'Tore Blockchain Off-chain NFT Server',
    status: 'running',
    time: new Date().toISOString()
  });
});

// POST /api/blokchain — off-chain NFT issuance
app.post('/api/blokchain', (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Processing NFT issuance request`);
  
  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    console.log(`[${timestamp}] Invalid content-type: ${contentType}`);
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }

  const { to, metadataUri, chain } = req.body || {};
  console.log(`[${timestamp}] NFT issuance data:`, { to, metadataUri, chain });

  if (!to || !isValidEthAddress(to)) {
    console.log(`[${timestamp}] Invalid address: ${to}`);
    return res.status(400).json({ error: 'Invalid "to" (0x-prefixed 20-byte address required)' });
  }
  if (!metadataUri || typeof metadataUri !== 'string') {
    console.log(`[${timestamp}] Invalid metadataUri: ${metadataUri}`);
    return res.status(400).json({ error: 'Invalid "metadataUri" (string required)' });
  }
  if (chain && typeof chain !== 'string') {
    console.log(`[${timestamp}] Invalid chain: ${chain}`);
    return res.status(400).json({ error: 'Invalid "chain" (string if provided)' });
  }

  const id = createId();
  const record = {
    id,
    to,
    metadataUri,
    chain: chain || 'offchain',
    issuedAt: new Date().toISOString()
  };
  const signature = signRecord(record);

  issuedNfts.set(id, { ...record, signature });
  
  console.log(`[${timestamp}] NFT issued successfully:`, { id, to, chain: record.chain });

  return res.status(201).json({
    success: true,
    id,
    to,
    metadataUri,
    chain: record.chain,
    issuedAt: record.issuedAt,
    signature,
    reference: `/api/blokchain/${id}`
  });
});

// Retrieve issued NFT record by id (off-chain lookup)
app.get('/api/blokchain/:id', (req, res) => {
  const timestamp = new Date().toISOString();
  const id = req.params.id;
  
  console.log(`[${timestamp}] Looking up NFT with ID: ${id}`);
  
  const rec = issuedNfts.get(id);
  if (!rec) {
    console.log(`[${timestamp}] NFT not found: ${id}`);
    return res.status(404).json({ error: 'Not found' });
  }
  
  console.log(`[${timestamp}] NFT found:`, { id, to: rec.to, chain: rec.chain });
  return res.json(rec);
});

// 에러 로깅 미들웨어
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${err.message}`);
  console.error(`[${timestamp}] Stack: ${err.stack}`);
  console.error(`[${timestamp}] Request: ${req.method} ${req.originalUrl}`);
  
  res.status(500).json({ 
    error: 'Internal Server Error',
    timestamp: timestamp,
    message: err.message 
  });
});

// Fallback 404
app.use('*', (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 404 - Route not found: ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

app.listen(PORT, () => {
  const timestamp = new Date().toISOString();
  console.log('='.repeat(60));
  console.log(`[${timestamp}] 🚀 Tore Off-chain NFT Server`);
  console.log('='.repeat(60));
  console.log(`[${timestamp}] 🌐 http://localhost:${PORT}`);
  console.log(`[${timestamp}] Available endpoints:`);
  console.log(`[${timestamp}]  • POST /api/blokchain`);
  console.log(`[${timestamp}]  • GET  /api/blokchain/:id`);
  console.log(`[${timestamp}] Logging enabled for all requests`);
  console.log('='.repeat(60));
});


