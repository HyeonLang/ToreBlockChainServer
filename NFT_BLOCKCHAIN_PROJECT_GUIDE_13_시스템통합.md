# NFT 블록체인 프로젝트 완전 가이드 - 13편: 시스템 통합 및 최적화

## 📚 목차
1. [전체 시스템 통합](#전체-시스템-통합)
2. [컨트랙트 간 연동](#컨트랙트-간-연동)
3. [백엔드 시스템 통합](#백엔드-시스템-통합)
4. [프론트엔드 통합](#프론트엔드-통합)
5. [데이터 흐름 최적화](#데이터-흐름-최적화)
6. [성능 최적화](#성능-최적화)
7. [보안 강화](#보안-강화)
8. [모니터링 및 로깅](#모니터링-및-로깅)
9. [배포 및 운영](#배포-및-운영)
10. [확장성 고려사항](#확장성-고려사항)

---

## 🏗 전체 시스템 통합

### 통합 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        웹 브라우저 (프론트엔드)                    │
├─────────────────────────────────────────────────────────────────┤
│  NFT 관리 │ TORE 토큰 │ 거래소 │ 지갑 연결 │ 거래 내역 │ 통계 대시보드 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Express 서버 (백엔드)                       │
├─────────────────────────────────────────────────────────────────┤
│ NFT API │ TORE API │ 거래소 API │ 인증 │ 레이트 리미팅 │ 에러 처리 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Avalanche 블록체인 네트워크                   │
├─────────────────────────────────────────────────────────────────┤
│ GameItem │ ToreToken │ ToreExchange │ 이벤트 로그 │ 트랜잭션 내역 │
└─────────────────────────────────────────────────────────────────┘
```

### 시스템 구성 요소

**프론트엔드:**
- **NFT 관리**: 생성, 전송, 삭제, 조회
- **TORE 토큰**: 잔액 조회, 전송, 내역 조회
- **거래소**: 거래 생성, 구매, 취소
- **지갑 연동**: MetaMask 연결 및 자동 주소 입력
- **통합 대시보드**: 모든 기능을 한 곳에서 관리

**백엔드:**
- **API 서버**: RESTful API 제공
- **인증 시스템**: JWT + API 키 하이브리드 인증
- **레이트 리미팅**: API 호출 제한
- **에러 처리**: 통합 에러 관리
- **로깅**: 상세한 로그 기록

**블록체인:**
- **GameItem**: ERC721 NFT 컨트랙트
- **ToreToken**: ERC20 토큰 컨트랙트
- **ToreExchange**: NFT-TORE 거래소 컨트랙트
- **이벤트 시스템**: 모든 거래 내역 기록

---

## 🔗 컨트랙트 간 연동

### 컨트랙트 의존성

```
ToreExchange
├── GameItem (NFT 컨트랙트)
└── ToreToken (토큰 컨트랙트)

ToreToken
├── GameItem (게임 통합)
└── ToreExchange (거래소 연동)
```

### 연동 설정

```typescript
// 거래소 배포 후 연동 설정
async function setupContractIntegration() {
  const toreToken = await ethers.getContractAt("ToreToken", TORE_TOKEN_ADDRESS);
  const exchange = await ethers.getContractAt("ToreExchange", EXCHANGE_ADDRESS);
  
  // 거래소를 TORE 토큰에 추가
  await toreToken.addExchangeContract(EXCHANGE_ADDRESS);
  console.log("Exchange contract added to TORE token");
  
  // 게임 컨트랙트를 TORE 토큰에 추가 (예시)
  if (GAME_CONTRACT_ADDRESS) {
    await toreToken.addGameContract(GAME_CONTRACT_ADDRESS);
    console.log("Game contract added to TORE token");
  }
  
  // 게임 매니저를 TORE 토큰에 추가 (예시)
  if (GAME_MANAGER_ADDRESS) {
    await toreToken.addGameManager(GAME_MANAGER_ADDRESS);
    console.log("Game manager added to TORE token");
  }
}
```

### 권한 관리

```solidity
// ToreToken.sol - 거래소 전송 권한
function exchangeTransfer(address from, address to, uint256 amount) external {
    require(exchangeContracts[msg.sender], "ToreToken: Only authorized exchange contracts");
    _transfer(from, to, amount);
}

// ToreToken.sol - 게임 보상 지급 권한
function distributeGameReward(address player, uint256 amount) external {
    require(
        gameContracts[msg.sender] || gameManagers[msg.sender] || msg.sender == owner(),
        "ToreToken: Only authorized game contracts or managers"
    );
    _mint(player, amount);
}
```

---

## 🖥 백엔드 시스템 통합

### 통합 앱 구조

```typescript
// src/app.ts
import express from "express";
import dotenv from "dotenv";

// 라우터 임포트
import nftRouter from "./routes/nft";
import toreTokenRouter from "./routes/toreToken";
import exchangeRouter from "./routes/exchange";
import authRouter from "./routes/auth";
import v1Router from "./routes/v1";

// 미들웨어 임포트
import { errorHandler } from "./middleware/errorHandler";
import { jwtOrApiKeyAuth } from "./middleware/auth";
import { rateLimit } from "./middleware/rateLimit";

dotenv.config();

const app = express();

// 기본 미들웨어
app.use(express.json());
app.use(express.static("public"));

// 인증이 필요하지 않은 라우트
app.use("/api/auth", authRouter);

// 인증이 필요한 라우트
app.use("/api/nft", jwtOrApiKeyAuth, nftRouter);
app.use("/api/tore", jwtOrApiKeyAuth, toreTokenRouter);
app.use("/api/exchange", jwtOrApiKeyAuth, exchangeRouter);
app.use("/v1", jwtOrApiKeyAuth, v1Router);

// 에러 핸들러
app.use(errorHandler);

export default app;
```

### 통합 컨트롤러

```typescript
// src/controllers/integratedController.ts
export async function getSystemStats(req: Request, res: Response) {
  try {
    const nftContract = await getContract();
    const toreTokenContract = await getToreTokenContract();
    const exchangeContract = await getExchangeContract();
    
    // NFT 통계
    const totalNfts = await nftContract.nextTokenId() - 1;
    
    // TORE 토큰 통계
    const totalSupply = await toreTokenContract.totalSupply();
    const tokenInfo = await toreTokenContract.name();
    
    // 거래소 통계
    const totalTrades = await exchangeContract.getTotalTrades();
    const activeTrades = await exchangeContract.getActiveTradeCount();
    
    res.json({
      success: true,
      data: {
        nft: {
          totalNfts: totalNfts.toString(),
          contractAddress: process.env.CONTRACT_ADDRESS
        },
        toreToken: {
          name: tokenInfo,
          totalSupply: ethers.formatUnits(totalSupply, 18),
          contractAddress: process.env.TORE_TOKEN_ADDRESS
        },
        exchange: {
          totalTrades: totalTrades.toString(),
          activeTrades: activeTrades.toString(),
          contractAddress: process.env.TORE_EXCHANGE_ADDRESS
        }
      }
    });
  } catch (error) {
    console.error('[Integrated Controller] Get system stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system statistics'
    });
  }
}
```

### 통합 유틸리티

```typescript
// src/utils/integration.ts
export async function getWalletOverview(address: string) {
  try {
    const nftContract = await getContract();
    const toreTokenContract = await getToreTokenContract();
    
    // NFT 정보
    const nftBalance = await nftContract.balanceOf(address);
    const nfts = [];
    for (let i = 1; i <= nftBalance; i++) {
      try {
        const owner = await nftContract.ownerOf(i);
        if (owner.toLowerCase() === address.toLowerCase()) {
          const tokenURI = await nftContract.tokenURI(i);
          nfts.push({ tokenId: i, tokenURI });
        }
      } catch (error) {
        // 토큰이 존재하지 않거나 소각됨
        continue;
      }
    }
    
    // TORE 토큰 정보
    const toreBalance = await toreTokenContract.balanceOf(address);
    const toreBalanceFormatted = ethers.formatUnits(toreBalance, 18);
    
    return {
      address,
      nfts: {
        count: nfts.length,
        items: nfts
      },
      toreToken: {
        balance: toreBalanceFormatted,
        symbol: 'TORE'
      }
    };
  } catch (error) {
    console.error('[Integration] Failed to get wallet overview:', error);
    throw error;
  }
}
```

---

## 🌐 프론트엔드 통합

### 통합 대시보드

```html
<!-- 통합 대시보드 탭 -->
<div id="dashboardTab" class="tab-content">
    <div class="dashboard-grid">
        <!-- NFT 섹션 -->
        <div class="dashboard-section">
            <h3>🎨 NFT 관리</h3>
            <div class="stats">
                <div class="stat-item">
                    <span class="stat-label">보유 NFT</span>
                    <span class="stat-value" id="nftCount">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">총 NFT</span>
                    <span class="stat-value" id="totalNfts">0</span>
                </div>
            </div>
            <div class="actions">
                <button onclick="switchTab('create')" class="btn">NFT 생성</button>
                <button onclick="switchTab('wallet')" class="btn">NFT 조회</button>
            </div>
        </div>
        
        <!-- TORE 토큰 섹션 -->
        <div class="dashboard-section">
            <h3>🪙 TORE 토큰</h3>
            <div class="stats">
                <div class="stat-item">
                    <span class="stat-label">보유량</span>
                    <span class="stat-value" id="toreBalance">0 TORE</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">총 공급량</span>
                    <span class="stat-value" id="totalSupply">0 TORE</span>
                </div>
            </div>
            <div class="actions">
                <button onclick="switchTab('toreBalance')" class="btn">잔액 조회</button>
                <button onclick="switchTab('toreTransfer')" class="btn">토큰 전송</button>
            </div>
        </div>
        
        <!-- 거래소 섹션 -->
        <div class="dashboard-section">
            <h3>🏪 거래소</h3>
            <div class="stats">
                <div class="stat-item">
                    <span class="stat-label">활성 거래</span>
                    <span class="stat-value" id="activeTrades">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">총 거래</span>
                    <span class="stat-value" id="totalTrades">0</span>
                </div>
            </div>
            <div class="actions">
                <button onclick="loadActiveTrades()" class="btn">거래 목록</button>
                <button onclick="switchTab('createTrade')" class="btn">거래 생성</button>
            </div>
        </div>
    </div>
</div>
```

### 통합 JavaScript

```javascript
// public/js/integration.js
let systemStats = null;

async function loadSystemStats() {
  try {
    const response = await fetch('/api/system/stats');
    const data = await response.json();
    
    if (data.success) {
      systemStats = data.data;
      updateDashboard();
    } else {
      throw new Error(data.error || '시스템 통계 조회 실패');
    }
  } catch (error) {
    console.error('시스템 통계 조회 오류:', error);
    showStatus(`시스템 통계 조회 실패: ${error.message}`, 'error');
  }
}

function updateDashboard() {
  if (!systemStats) return;
  
  // NFT 통계 업데이트
  document.getElementById('totalNfts').textContent = systemStats.nft.totalNfts;
  
  // TORE 토큰 통계 업데이트
  document.getElementById('totalSupply').textContent = systemStats.toreToken.totalSupply + ' TORE';
  
  // 거래소 통계 업데이트
  document.getElementById('totalTrades').textContent = systemStats.exchange.totalTrades;
  document.getElementById('activeTrades').textContent = systemStats.exchange.activeTrades;
}

async function loadWalletOverview() {
  if (!currentAccount) {
    showStatus('지갑을 먼저 연결해주세요', 'error');
    return;
  }
  
  try {
    const response = await fetch(`/api/wallet/overview/${currentAccount}`);
    const data = await response.json();
    
    if (data.success) {
      updateWalletStats(data.data);
    } else {
      throw new Error(data.error || '지갑 개요 조회 실패');
    }
  } catch (error) {
    console.error('지갑 개요 조회 오류:', error);
    showStatus(`지갑 개요 조회 실패: ${error.message}`, 'error');
  }
}

function updateWalletStats(walletData) {
  // NFT 개수 업데이트
  document.getElementById('nftCount').textContent = walletData.nfts.count;
  
  // TORE 잔액 업데이트
  document.getElementById('toreBalance').textContent = walletData.toreToken.balance + ' TORE';
}
```

---

## 📊 데이터 흐름 최적화

### 캐싱 전략

```typescript
// src/utils/cache.ts
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttl: number = 300000) { // 5분 기본 TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear() {
    this.cache.clear();
  }
}

export const cache = new MemoryCache();
```

### 캐시 적용

```typescript
// src/controllers/toreTokenController.ts
export async function getBalance(req: Request, res: Response) {
  try {
    const { address } = req.params;
    
    // 캐시 확인
    const cacheKey = `balance:${address}`;
    const cachedBalance = cache.get(cacheKey);
    
    if (cachedBalance) {
      return res.json({
        success: true,
        data: cachedBalance,
        cached: true
      });
    }
    
    // 블록체인에서 조회
    const balance = await getTokenBalance(address);
    const result = {
      address,
      balance,
      symbol: 'TORE'
    };
    
    // 캐시에 저장 (1분 TTL)
    cache.set(cacheKey, result, 60000);
    
    res.json({
      success: true,
      data: result,
      cached: false
    });
  } catch (error) {
    console.error('[ToreToken Controller] Get balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get token balance'
    });
  }
}
```

### 배치 처리

```typescript
// src/utils/batchProcessor.ts
export class BatchProcessor {
  private queue: Array<{ id: string; data: any; resolve: Function; reject: Function }> = [];
  private processing = false;
  
  async add<T>(id: string, data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ id, data, resolve, reject });
      this.process();
    });
  }
  
  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, 10); // 10개씩 배치 처리
      
      try {
        const results = await Promise.allSettled(
          batch.map(item => this.processItem(item))
        );
        
        results.forEach((result, index) => {
          const item = batch[index];
          if (result.status === 'fulfilled') {
            item.resolve(result.value);
          } else {
            item.reject(result.reason);
          }
        });
      } catch (error) {
        batch.forEach(item => item.reject(error));
      }
    }
    
    this.processing = false;
  }
  
  private async processItem(item: any) {
    // 실제 처리 로직
    return await this.executeItem(item.data);
  }
  
  private async executeItem(data: any) {
    // 구현 필요
    return data;
  }
}

export const batchProcessor = new BatchProcessor();
```

---

## ⚡ 성능 최적화

### 데이터베이스 최적화 (향후 확장)

```typescript
// src/database/optimization.ts
export class DatabaseOptimizer {
  // 인덱스 최적화
  async createIndexes() {
    // 자주 조회되는 필드에 인덱스 생성
    await this.createIndex('transfers', 'from');
    await this.createIndex('transfers', 'to');
    await this.createIndex('transfers', 'tokenId');
    await this.createIndex('transfers', 'blockNumber');
  }
  
  // 쿼리 최적화
  async getOptimizedTransfers(address: string, limit: number = 100) {
    // 복합 인덱스 활용
    return await this.query(`
      SELECT * FROM transfers 
      WHERE (from = ? OR to = ?) 
      ORDER BY blockNumber DESC 
      LIMIT ?
    `, [address, address, limit]);
  }
  
  // 연결 풀 최적화
  async optimizeConnectionPool() {
    // 연결 풀 설정 최적화
    this.pool = {
      min: 5,
      max: 20,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200
    };
  }
}
```

### API 최적화

```typescript
// src/middleware/optimization.ts
export const compression = (req: Request, res: Response, next: NextFunction) => {
  // 응답 압축
  const originalSend = res.send;
  res.send = function(data) {
    if (typeof data === 'string' && data.length > 1024) {
      // 큰 응답은 압축
      res.setHeader('Content-Encoding', 'gzip');
    }
    return originalSend.call(this, data);
  };
  next();
};

export const requestOptimization = (req: Request, res: Response, next: NextFunction) => {
  // 요청 최적화
  if (req.method === 'GET') {
    // GET 요청 캐시 헤더 설정
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5분 캐시
  }
  next();
};
```

---

## 🔒 보안 강화

### 입력 검증 강화

```typescript
// src/middleware/validation.ts
import Joi from 'joi';

export const validateAddress = (req: Request, res: Response, next: NextFunction) => {
  const addressSchema = Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/);
  
  if (req.params.address) {
    const { error } = addressSchema.validate(req.params.address);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }
  }
  next();
};

export const validateAmount = (req: Request, res: Response, next: NextFunction) => {
  const amountSchema = Joi.number().positive().max(1000000); // 최대 100만
  
  if (req.body.amount) {
    const { error } = amountSchema.validate(parseFloat(req.body.amount));
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }
  }
  next();
};
```

### 보안 헤더

```typescript
// src/middleware/security.ts
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // 보안 헤더 설정
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  next();
};
```

### 레이트 리미팅 강화

```typescript
// src/middleware/rateLimit.ts
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100 요청
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 60, // 최대 60 요청
  message: {
    success: false,
    error: 'API rate limit exceeded'
  }
});
```

---

## 📈 모니터링 및 로깅

### 통합 로깅 시스템

```typescript
// src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'tore-blockchain-server' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

export default logger;
```

### 성능 모니터링

```typescript
// src/middleware/monitoring.ts
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: duration,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };
    
    logger.info('Request completed', logData);
    
    // 느린 요청 경고
    if (duration > 5000) {
      logger.warn('Slow request detected', logData);
    }
  });
  
  next();
};
```

### 에러 추적

```typescript
// src/middleware/errorTracking.ts
export const errorTracking = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  };
  
  logger.error('Application error', errorData);
  
  // 외부 에러 추적 서비스로 전송 (예: Sentry)
  // Sentry.captureException(error);
  
  next(error);
};
```

---

## 🚀 배포 및 운영

### 프로덕션 배포

```bash
# 프로덕션 빌드
npm run build

# 환경 변수 설정
cp .env.example .env.production

# PM2로 프로덕션 실행
pm2 start dist/app.js --name "tore-blockchain-server" --env production

# PM2 설정 파일
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'tore-blockchain-server',
    script: 'dist/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 헬스 체크

```typescript
// src/routes/health.ts
export const healthCheck = async (req: Request, res: Response) => {
  try {
    const checks = {
      server: 'ok',
      database: 'ok',
      blockchain: 'ok',
      timestamp: new Date().toISOString()
    };
    
    // 블록체인 연결 확인
    try {
      await getContract();
    } catch (error) {
      checks.blockchain = 'error';
    }
    
    // 데이터베이스 연결 확인 (향후 확장)
    // try {
    //   await db.ping();
    // } catch (error) {
    //   checks.database = 'error';
    // }
    
    const status = Object.values(checks).every(check => check === 'ok') ? 200 : 503;
    
    res.status(status).json({
      success: status === 200,
      data: checks
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Health check failed'
    });
  }
};
```

### 백업 및 복구

```bash
# 컨트랙트 주소 백업
echo "CONTRACT_ADDRESS=0x..." >> contracts_backup.txt
echo "TORE_TOKEN_ADDRESS=0x..." >> contracts_backup.txt
echo "TORE_EXCHANGE_ADDRESS=0x..." >> contracts_backup.txt

# 환경 변수 백업
cp .env .env.backup

# 로그 파일 로테이션
logrotate /etc/logrotate.d/tore-blockchain-server
```

---

## 📈 확장성 고려사항

### 수평 확장

```typescript
// src/utils/loadBalancer.ts
export class LoadBalancer {
  private servers = [
    'http://server1:3000',
    'http://server2:3000',
    'http://server3:3000'
  ];
  
  private currentIndex = 0;
  
  getNextServer(): string {
    const server = this.servers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.servers.length;
    return server;
  }
  
  async distributeRequest(endpoint: string, data: any) {
    const server = this.getNextServer();
    const response = await fetch(`${server}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}
```

### 데이터베이스 확장

```typescript
// src/database/sharding.ts
export class DatabaseSharding {
  private shards = [
    { id: 0, connection: 'shard0_connection' },
    { id: 1, connection: 'shard1_connection' },
    { id: 2, connection: 'shard2_connection' }
  ];
  
  getShard(address: string): number {
    // 주소 기반 샤드 결정
    const hash = this.hashAddress(address);
    return hash % this.shards.length;
  }
  
  private hashAddress(address: string): number {
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      const char = address.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    return Math.abs(hash);
  }
}
```

### 캐시 확장

```typescript
// src/utils/redis.ts
import Redis from 'ioredis';

export class RedisCache {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    });
  }
  
  async set(key: string, value: any, ttl: number = 300) {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async get(key: string): Promise<any | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  async del(key: string) {
    await this.redis.del(key);
  }
}
```

---

## 📋 마무리

이제 ToreBlockChainServer의 전체 시스템을 완전히 이해하고 구현할 수 있게 되었습니다.

**완성된 시스템 구성 요소:**

1. **NFT 관리 시스템** (GameItem 컨트랙트)
2. **TORE 토큰 시스템** (ToreToken 컨트랙트)
3. **NFT-TORE 거래소** (ToreExchange 컨트랙트)
4. **통합 백엔드 API** (Express 서버)
5. **통합 프론트엔드** (웹 인터페이스)
6. **보안 및 최적화** (인증, 캐싱, 모니터링)

**주요 특징:**
- **완전한 통합**: NFT, 토큰, 거래소가 하나의 시스템으로 통합
- **확장 가능**: 모듈화된 구조로 기능 추가 용이
- **보안 강화**: 다층 보안 시스템 구현
- **성능 최적화**: 캐싱, 배치 처리, 모니터링
- **운영 준비**: 프로덕션 배포 및 운영 도구

**다음 단계:**
- 실제 프로젝트에 적용해보세요
- 새로운 기능을 추가해보세요
- 다른 블록체인 네트워크에 배포해보세요
- 실제 서비스로 발전시켜보세요

**성공적인 블록체인 개발을 응원합니다! 🚀**
