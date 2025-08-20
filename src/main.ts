import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT: number = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

type SupportedChain = string;

interface IssueRequestBody {
  to: string;
  metadataUri: string;
  chain?: SupportedChain;
}

interface OffchainNftRecord {
  id: string;
  to: string;
  metadataUri: string;
  chain: string;
  issuedAt: string;
}

const issuedNfts: Map<string, OffchainNftRecord & { signature: string }> = new Map();

function isValidEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function createId(): string {
  if (typeof (crypto as any).randomUUID === 'function') return (crypto as any).randomUUID();
  return crypto.randomBytes(16).toString('hex');
}

function signRecord(record: OffchainNftRecord): string {
  const secret: string = process.env.OFFCHAIN_SECRET || 'CHANGE_ME_IN_PRODUCTION_ONLY_FOR_DEV';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(record));
  return hmac.digest('hex');
}

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Tore Blockchain Off-chain NFT Server (TS)',
    status: 'running',
    time: new Date().toISOString()
  });
});

// POST /api/blokchain — off-chain NFT issuance
app.post('/api/blokchain', (req: Request<unknown, unknown, IssueRequestBody>, res: Response) => {
  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }

  const { to, metadataUri, chain } = req.body || ({} as IssueRequestBody);

  if (!to || !isValidEthAddress(to)) {
    return res.status(400).json({ error: 'Invalid "to" (0x-prefixed 20-byte address required)' });
  }
  if (!metadataUri || typeof metadataUri !== 'string') {
    return res.status(400).json({ error: 'Invalid "metadataUri" (string required)' });
  }
  if (chain && typeof chain !== 'string') {
    return res.status(400).json({ error: 'Invalid "chain" (string if provided)' });
  }

  const id = createId();
  const record: OffchainNftRecord = {
    id,
    to,
    metadataUri,
    chain: chain || 'offchain',
    issuedAt: new Date().toISOString()
  };
  const signature = signRecord(record);

  issuedNfts.set(id, { ...record, signature });

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
app.get('/api/blokchain/:id', (req: Request<{ id: string }>, res: Response) => {
  const id = req.params.id;
  const rec = issuedNfts.get(id);
  if (!rec) return res.status(404).json({ error: 'Not found' });
  return res.json(rec);
});

// Fallback 404
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found', path: (req as any).originalUrl || req.url });
});

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log('='.repeat(60));
  // eslint-disable-next-line no-console
  console.log('🚀 Tore Off-chain NFT Server (TypeScript)');
  // eslint-disable-next-line no-console
  console.log('='.repeat(60));
  // eslint-disable-next-line no-console
  console.log(`🌐 http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log('Available endpoints:');
  // eslint-disable-next-line no-console
  console.log(' • POST /api/blokchain');
  // eslint-disable-next-line no-console
  console.log(' • GET  /api/blokchain/:id');
  // eslint-disable-next-line no-console
  console.log('='.repeat(60));
});

server.on('error', (err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('❌ Server error:', err);
});

export default app;


