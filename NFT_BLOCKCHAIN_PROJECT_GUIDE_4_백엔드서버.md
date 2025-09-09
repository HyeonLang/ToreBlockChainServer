# NFT 블록체인 프로젝트 완전 가이드 - 4편: 백엔드 서버 구조 및 API 설명

## 📚 목차
1. [백엔드 서버 개요](#백엔드-서버-개요)
2. [Express.js 서버 구조](#expressjs-서버-구조)
3. [API 라우트 시스템](#api-라우트-시스템)
4. [컨트롤러 상세 분석](#컨트롤러-상세-분석)
5. [미들웨어 시스템](#미들웨어-시스템)
6. [인증 시스템](#인증-시스템)
7. [에러 처리](#에러-처리)
8. [유틸리티 함수들](#유틸리티-함수들)

---

## 🖥 백엔드 서버 개요

### 서버의 역할

**백엔드 서버**는 클라이언트(웹 브라우저)와 블록체인 사이의 중간 역할을 합니다.

**주요 기능:**
1. **API 제공**: 클라이언트가 요청할 수 있는 엔드포인트 제공
2. **블록체인 연동**: 스마트 컨트랙트와 상호작용
3. **인증 처리**: 사용자 인증 및 권한 관리
4. **데이터 검증**: 입력 데이터의 유효성 검사
5. **에러 처리**: 오류 상황에 대한 적절한 응답

### 서버 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   웹 브라우저    │    │   Express 서버   │    │  스마트 컨트랙트  │
│   (클라이언트)   │◄──►│   (백엔드)      │◄──►│   (블록체인)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐            ┌────▼────┐            ┌────▼────┐
    │ HTTP    │            │ API     │            │ 컨트랙트 │
    │ 요청    │            │ 라우트  │            │ 함수    │
    └─────────┘            └─────────┘            └─────────┘
```

### 기술 스택

- **Node.js**: JavaScript 런타임 환경
- **TypeScript**: 타입 안전성을 위한 JavaScript 확장
- **Express.js**: 웹 서버 프레임워크
- **Ethers.js**: 블록체인 상호작용 라이브러리
- **JWT**: 사용자 인증을 위한 토큰 시스템

---

## 🚀 Express.js 서버 구조

### 메인 서버 파일 (app.ts)

```typescript
import express from "express";
import dotenv from "dotenv";
import nftRouter from "./routes/nft";
import v1Router from "./routes/v1";
import authRouter from "./routes/auth";
import { errorHandler } from "./middleware/errorHandler";
import { jwtOrApiKeyAuth } from "./middleware/auth";

// 환경 변수 로드
dotenv.config();

// Express 애플리케이션 인스턴스 생성
const app = express();

// 미들웨어 설정
app.use(express.json());                    // JSON 파싱
app.use(express.static("public"));          // 정적 파일 서빙

// 라우트 등록
app.get("/", (_req, res) => {
  res.sendFile("index.html", { root: "public" });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);           // 인증 라우트
app.use("/api/nft", jwtOrApiKeyAuth, nftRouter);  // NFT 라우트 (인증 필요)
app.use("/v1", jwtOrApiKeyAuth, v1Router);  // v1 API 라우트 (인증 필요)

// 에러 핸들러
app.use(errorHandler);

// 서버 시작
const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

export default app;
```

### 서버 초기화 과정

**1단계: 환경 변수 로드**
```typescript
dotenv.config();
// .env 파일에서 환경 변수들을 process.env에 로드
```

**2단계: Express 앱 생성**
```typescript
const app = express();
// Express 애플리케이션 인스턴스 생성
```

**3단계: 미들웨어 설정**
```typescript
app.use(express.json());           // JSON 요청 본문 파싱
app.use(express.static("public")); // 정적 파일 서빙
```

**4단계: 라우트 등록**
```typescript
app.use("/api/nft", nftRouter);    // NFT 관련 라우트
app.use("/api/auth", authRouter);  // 인증 관련 라우트
```

**5단계: 서버 시작**
```typescript
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
```

---

## 🛣 API 라우트 시스템

### 라우트 구조

```
/api/
├── /auth/                    # 인증 관련 API
│   ├── POST /login          # 로그인
│   ├── POST /logout         # 로그아웃
│   ├── POST /refresh        # 토큰 갱신
│   ├── GET /profile         # 프로필 조회
│   └── POST /register       # 회원가입
├── /nft/                     # NFT 관련 API
│   ├── GET /address         # 컨트랙트 주소 조회
│   ├── POST /mint           # NFT 생성
│   ├── POST /transfer       # NFT 전송
│   ├── POST /burn           # NFT 삭제
│   ├── GET /:tokenId        # NFT 조회
│   ├── GET /wallet          # 지갑 NFT 목록
│   ├── GET /:tokenId/history # NFT 거래 이력
│   └── GET /wallet/history  # 지갑 거래 이력
└── /v1/                      # v1 API (RESTful)
    ├── POST /nfts           # NFT 생성
    ├── PATCH /nfts/:id/transfer # NFT 전송
    └── DELETE /nfts/:id     # NFT 삭제
```

### 라우트 파일 구조

#### 1. NFT 라우트 (routes/nft.ts)

```typescript
import { Router } from "express";
import { 
  burnNftController, 
  contractAddressController, 
  mintNftController, 
  transferNftController,
  getNftController,
  getWalletNftsController,
  getNftTransactionHistoryController,
  getWalletTransactionHistoryController
} from "../controllers/nftController";

const router = Router();

// GET /api/nft/address - 컨트랙트 주소 조회
router.get("/address", contractAddressController);

// POST /api/nft/mint - NFT 생성
router.post("/mint", mintNftController);

// POST /api/nft/transfer - NFT 전송
router.post("/transfer", transferNftController);

// POST /api/nft/burn - NFT 삭제
router.post("/burn", burnNftController);

// GET /api/nft/wallet - 지갑 NFT 목록 조회
router.get("/wallet", getWalletNftsController);

// GET /api/nft/:tokenId - NFT 조회
router.get("/:tokenId", getNftController);

// GET /api/nft/:tokenId/history - NFT 거래 이력
router.get("/:tokenId/history", getNftTransactionHistoryController);

// GET /api/nft/wallet/history - 지갑 거래 이력
router.get("/wallet/history", getWalletTransactionHistoryController);

export default router;
```

#### 2. 인증 라우트 (routes/auth.ts)

```typescript
import { Router } from "express";
import { 
  loginController, 
  logoutController, 
  refreshTokenController, 
  getProfileController,
  registerController 
} from "../controllers/authController";
import { authenticateJWT } from "../middleware/jwtAuth";

const router = Router();

// POST /api/auth/login - 로그인
router.post("/login", loginController);

// POST /api/auth/register - 회원가입
router.post("/register", registerController);

// POST /api/auth/refresh - 토큰 갱신
router.post("/refresh", refreshTokenController);

// GET /api/auth/profile - 프로필 조회 (JWT 인증 필요)
router.get("/profile", authenticateJWT, getProfileController);

// POST /api/auth/logout - 로그아웃 (JWT 인증 필요)
router.post("/logout", authenticateJWT, logoutController);

export default router;
```

#### 3. v1 API 라우트 (routes/v1.ts)

```typescript
import { Router } from "express";
import { 
  createNftController, 
  transferNftController, 
  deleteNftController 
} from "../v1/controllers";

const router = Router();

// POST /v1/nfts - NFT 생성
router.post("/nfts", createNftController);

// PATCH /v1/nfts/:id/transfer - NFT 전송
router.patch("/nfts/:id/transfer", transferNftController);

// DELETE /v1/nfts/:id - NFT 삭제
router.delete("/nfts/:id", deleteNftController);

export default router;
```

---

## 🎮 컨트롤러 상세 분석

### NFT 컨트롤러 (controllers/nftController.ts)

#### 1. NFT 생성 컨트롤러

```typescript
export async function mintNftController(req: Request, res: Response) {
  try {
    console.log('[mint] request body:', req.body);
    
    // 요청 본문에서 파라미터 추출
    const { to, tokenURI } = req.body as { to: string; tokenURI: string };
    
    // 입력값 검증
    if (!to || typeof to !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(to)) {
      return res.status(400).json({ error: "Invalid 'to' address" });
    }
    
    if (!tokenURI || typeof tokenURI !== "string" || tokenURI.length > 2048) {
      return res.status(400).json({ error: "Invalid 'tokenURI'" });
    }
    
    // URI 프로토콜 검증
    try {
      const u = new URL(tokenURI);
      if (!["http:", "https:", "ipfs:"].includes(u.protocol)) {
        return res.status(400).json({ error: "Unsupported tokenURI scheme" });
      }
    } catch {
      return res.status(400).json({ error: "Malformed tokenURI" });
    }

    // 블록체인 컨트랙트 인스턴스 생성
    const contract = await getContract();
    
    // NFT 민팅 트랜잭션 실행
    const tx = await contract.mint(to, tokenURI);
    console.log('[mint] tx sent:', tx.hash);
    
    // 트랜잭션 완료 대기 및 영수증 획득
    const receipt = await tx.wait();
    console.log('[mint] tx mined:', receipt?.hash);
    
    // Transfer 이벤트에서 tokenId 추출
    let tokenId: number | null = null;
    if (receipt?.logs) {
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          if (parsedLog?.name === 'Transfer' && parsedLog.args) {
            tokenId = Number(parsedLog.args[2]); // tokenId는 세 번째 인자
            console.log('[mint] tokenId parsed:', tokenId);
            break;
          }
        } catch {
          // 로그 파싱 실패 시 무시하고 계속 진행
        }
      }
    }
    
    // 성공 응답
    const payload = { 
      txHash: receipt?.hash ?? tx.hash,
      tokenId: tokenId,
      contractAddress: process.env.CONTRACT_ADDRESS || null
    };
    console.log('[mint] response:', payload);
    return res.json(payload);
    
  } catch (err: any) {
    // 에러 처리
    console.error('[mint] error:', err);
    return res.status(500).json({ error: err.message || "Mint failed" });
  }
}
```

**실행 흐름:**
1. **요청 파라미터 추출**: `to`, `tokenURI` 추출
2. **입력값 검증**: 주소 형식, URI 형식 검증
3. **컨트랙트 연결**: `getContract()`로 컨트랙트 인스턴스 생성
4. **트랜잭션 실행**: `contract.mint()` 호출
5. **완료 대기**: `tx.wait()`로 트랜잭션 완료 대기
6. **이벤트 파싱**: Transfer 이벤트에서 tokenId 추출
7. **응답 반환**: 트랜잭션 해시, tokenId, 컨트랙트 주소 반환

#### 2. NFT 조회 컨트롤러

```typescript
export async function getNftController(req: Request, res: Response) {
  try {
    // URL 파라미터에서 tokenId 추출
    const { tokenId } = req.params;
    
    // 입력값 검증
    if (!tokenId) {
      return res.status(400).json({ error: "Missing tokenId" });
    }
    
    const numeric = Number(tokenId);
    if (!Number.isInteger(numeric) || numeric < 0) {
      return res.status(400).json({ error: "Invalid tokenId" });
    }

    // 블록체인 컨트랙트 인스턴스 생성
    const contract = await getContract();
    
    // NFT 정보 조회 (가스 비용 없음 - view 함수)
    const [owner, tokenURI] = await Promise.all([
      contract.ownerOf(BigInt(tokenId)),
      contract.tokenURI(BigInt(tokenId))
    ]);
    
    // 성공 응답
    return res.json({ 
      owner: owner,
      tokenURI: tokenURI
    });
    
  } catch (err: any) {
    // 에러 처리
    return res.status(500).json({ error: err.message || "NFT query failed" });
  }
}
```

**특징:**
- **view 함수**: 상태를 변경하지 않으므로 가스비 없음
- **Promise.all**: 병렬로 여러 함수 호출하여 성능 향상
- **BigInt 변환**: Solidity의 uint256과 JavaScript의 Number 호환

#### 3. 지갑 NFT 목록 조회 컨트롤러

```typescript
export async function getWalletNftsController(req: Request, res: Response) {
  try {
    // 쿼리 파라미터에서 walletAddress 추출
    const { walletAddress } = req.query;
    
    // 입력값 검증
    if (!walletAddress || typeof walletAddress !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    // 블록체인 컨트랙트 인스턴스 생성
    const contract = await getContract();
    
    // 지갑이 소유한 NFT 개수 조회
    const balance = await contract.balanceOf(walletAddress);
    const balanceNum = Number(balance);
    
    if (balanceNum === 0) {
      return res.json({ nfts: [] });
    }

    // 각 NFT의 정보를 조회
    const nfts = [];
    for (let i = 0; i < balanceNum; i++) {
      try {
        // tokenOfOwnerByIndex로 i번째 NFT의 tokenId 조회
        const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
        const tokenIdNum = Number(tokenId);
        
        // 해당 NFT의 소유자와 URI 조회
        const [owner, tokenURI] = await Promise.all([
          contract.ownerOf(tokenId),
          contract.tokenURI(tokenId)
        ]);
        
        nfts.push({
          tokenId: tokenIdNum,
          owner: owner,
          tokenURI: tokenURI
        });
      } catch (err) {
        console.warn(`Failed to get NFT at index ${i}:`, err);
        // 개별 NFT 조회 실패 시 무시하고 계속 진행
      }
    }
    
    // 성공 응답
    return res.json({ nfts });
    
  } catch (err: any) {
    // 에러 처리
    console.error('[getWalletNfts] error:', err);
    return res.status(500).json({ error: err.message || "Wallet NFTs query failed" });
  }
}
```

**특징:**
- **순차 조회**: `balanceOf`로 개수 확인 후 각 NFT 정보 조회
- **에러 처리**: 개별 NFT 조회 실패 시에도 전체 조회 계속
- **성능 최적화**: `Promise.all`로 병렬 조회

### 인증 컨트롤러 (controllers/authController.ts)

#### 1. 로그인 컨트롤러

```typescript
export async function loginController(req: Request, res: Response): Promise<void> {
  try {
    console.log('[Auth] Login attempt:', req.body);
    
    // 요청 본문에서 로그인 정보 추출
    const { username, email, password } = req.body as { 
      username?: string; 
      email?: string; 
      password: string; 
    };
    
    // 필수 필드 검증
    if (!password) {
      res.status(400).json({ 
        error: 'Password is required.',
        code: 'PASSWORD_REQUIRED'
      });
      return;
    }
    
    if (!username && !email) {
      res.status(400).json({ 
        error: 'Username or email is required.',
        code: 'USERNAME_OR_EMAIL_REQUIRED'
      });
      return;
    }
    
    // 사용자 검색
    let user: User | undefined;
    if (username) {
      user = users.find(u => u.username === username);
    } else if (email) {
      user = users.find(u => u.email === email);
    }
    
    if (!user) {
      res.status(401).json({ 
        error: 'Invalid credentials.',
        code: 'INVALID_CREDENTIALS'
      });
      return;
    }
    
    // 비밀번호 검증 (bcrypt.compare 사용)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      res.status(401).json({ 
        error: 'Invalid credentials.',
        code: 'INVALID_CREDENTIALS'
      });
      return;
    }
    
    // JWT 토큰 쌍 생성
    const tokens = generateTokenPair({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
    
    // 로그인 시간 업데이트
    user.lastLoginAt = new Date();
    
    console.log(`[Auth] Login successful: ${user.username} (${user.id})`);
    
    // 성공 응답
    res.json({
      success: true,
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLoginAt: user.lastLoginAt
      }
    });
    
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error during login.',
      code: 'LOGIN_ERROR'
    });
  }
}
```

**실행 흐름:**
1. **입력값 검증**: 사용자명/이메일, 비밀번호 확인
2. **사용자 검색**: 데이터베이스에서 사용자 찾기
3. **비밀번호 검증**: bcrypt로 해싱된 비밀번호 비교
4. **토큰 생성**: JWT Access Token과 Refresh Token 생성
5. **로그인 시간 업데이트**: 마지막 로그인 시간 기록
6. **응답 반환**: 토큰과 사용자 정보 반환

---

## 🛡 미들웨어 시스템

### 미들웨어란?

**미들웨어**는 요청과 응답 사이에서 실행되는 함수입니다.

**미들웨어의 특징:**
- **순차 실행**: 등록된 순서대로 실행
- **요청 수정**: 요청 객체 수정 가능
- **응답 수정**: 응답 객체 수정 가능
- **다음 미들웨어 호출**: `next()` 함수로 다음 미들웨어 호출

### 인증 미들웨어 (middleware/auth.ts)

#### 1. API 키 인증

```typescript
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    // 환경변수에서 API 키 확인
    const configuredKey = process.env.API_KEY;
    
    // API 키가 설정되지 않았으면 인증 생략 (개발 환경)
    if (!configuredKey) {
      console.log('[API Key Auth] No API key configured, skipping authentication');
      return next();
    }

    // 요청 헤더에서 API 키 추출
    const providedKey = req.header("x-api-key");
    
    if (!providedKey) {
      console.log('[API Key Auth] No API key provided in x-api-key header');
      return res.status(401).json({ 
        error: "API key required. Please provide x-api-key header.",
        code: "API_KEY_REQUIRED"
      });
    }

    // API 키 검증
    if (providedKey !== configuredKey) {
      console.log('[API Key Auth] Invalid API key provided');
      return res.status(401).json({ 
        error: "Invalid API key.",
        code: "INVALID_API_KEY"
      });
    }

    console.log('[API Key Auth] API key authentication successful');
    return next();
    
  } catch (error) {
    console.error('[API Key Auth] Authentication error:', error);
    return res.status(500).json({ 
      error: "Internal server error during API key authentication.",
      code: "API_KEY_AUTH_ERROR"
    });
  }
}
```

#### 2. JWT 또는 API 키 인증

```typescript
export function jwtOrApiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    // JWT 토큰 확인
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // JWT 토큰이 있으면 JWT 인증 시도
      console.log('[Auth] JWT token found, attempting JWT authentication');
      const { authenticateJWT } = require('./jwtAuth');
      return authenticateJWT(req, res, next);
    } else {
      // JWT 토큰이 없으면 API 키 인증 시도
      console.log('[Auth] No JWT token found, attempting API key authentication');
      return apiKeyAuth(req, res, next);
    }
    
  } catch (error) {
    console.error('[Auth] JWT or API key authentication error:', error);
    return res.status(500).json({ 
      error: "Internal server error during authentication.",
      code: "AUTH_ERROR"
    });
  }
}
```

### JWT 인증 미들웨어 (middleware/jwtAuth.ts)

```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    email: string;
    role: string;
  };
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No token provided.',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.substring(7); // 'Bearer ' 제거
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided.',
        code: 'NO_TOKEN'
      });
    }
    
    // JWT 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
    
    // 사용자 정보를 요청 객체에 추가
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };
    
    console.log(`[JWT Auth] Authentication successful: ${decoded.username}`);
    next();
    
  } catch (error) {
    console.error('[JWT Auth] Authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Token expired.',
        code: 'TOKEN_EXPIRED'
      });
    } else {
      return res.status(500).json({ 
        error: 'Internal server error during authentication.',
        code: 'AUTH_ERROR'
      });
    }
  }
}
```

### 레이트 리미팅 미들웨어 (middleware/rateLimit.ts)

```typescript
interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  try {
    const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000; // 1분
    const maxRequests = Number(process.env.RATE_LIMIT_MAX) || 60; // 60 요청
    
    // 클라이언트 식별 (IP 주소 또는 API 키)
    const clientId = req.header('x-api-key') || req.ip;
    
    if (!clientId) {
      return res.status(400).json({ error: 'Unable to identify client' });
    }
    
    const now = Date.now();
    let bucket = buckets.get(clientId);
    
    if (!bucket) {
      bucket = {
        tokens: maxRequests,
        lastRefill: now
      };
      buckets.set(clientId, bucket);
    }
    
    // 토큰 보충
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed / windowMs) * maxRequests;
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(maxRequests, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
    
    // 토큰 소비
    if (bucket.tokens > 0) {
      bucket.tokens--;
      next();
    } else {
      res.status(429).json({ 
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
    
  } catch (error) {
    console.error('[Rate Limit] Error:', error);
    next(); // 에러 시 제한 없이 통과
  }
}
```

---

## 🔐 인증 시스템

### JWT 토큰 시스템

**JWT (JSON Web Token)**는 사용자 인증을 위한 토큰 기반 인증 시스템입니다.

#### 토큰 구조

```
JWT = Header.Payload.Signature

Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "userId": "1",
  "username": "admin",
  "email": "admin@tore.com",
  "role": "admin",
  "iat": 1640995200,
  "exp": 1640996100
}

Signature: HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret
)
```

#### 토큰 생성 (utils/jwt.ts)

```typescript
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
}

export function generateTokenPair(payload: JWTPayload) {
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: '15m'  // 15분
  });
  
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '7d'   // 7일
  });
  
  return {
    accessToken,
    refreshToken,
    expiresIn: 900  // 15분 (초 단위)
  };
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JWTPayload;
  } catch (error) {
    return null;
  }
}
```

### 비밀번호 보안

#### bcrypt 해싱

```typescript
import bcrypt from 'bcryptjs';

// 비밀번호 해싱
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// 비밀번호 검증
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
```

**bcrypt의 특징:**
- **솔트**: 각 비밀번호마다 고유한 솔트 생성
- **라운드**: 해싱 반복 횟수 (10라운드 권장)
- **시간 복잡도**: 브루트 포스 공격 방지

---

## ⚠️ 에러 처리

### 에러 핸들러 미들웨어 (middleware/errorHandler.ts)

```typescript
import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error('[Error Handler]', err);
  
  // 기본 에러 응답
  let status = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  
  // 에러 타입별 처리
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation error';
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
    code = 'UNAUTHORIZED';
  } else if (err.name === 'ForbiddenError') {
    status = 403;
    message = 'Forbidden';
    code = 'FORBIDDEN';
  } else if (err.name === 'NotFoundError') {
    status = 404;
    message = 'Not found';
    code = 'NOT_FOUND';
  }
  
  // 에러 응답
  res.status(status).json({
    error: message,
    code: code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
```

### 컨트롤러에서의 에러 처리

```typescript
export async function mintNftController(req: Request, res: Response) {
  try {
    // 비즈니스 로직
    const result = await someBusinessLogic();
    res.json(result);
    
  } catch (err: any) {
    // 에러 로깅
    console.error('[mint] error:', err);
    
    // 에러 타입별 처리
    if (err.message.includes('insufficient funds')) {
      return res.status(400).json({ 
        error: 'Insufficient funds for gas',
        code: 'INSUFFICIENT_FUNDS'
      });
    } else if (err.message.includes('invalid address')) {
      return res.status(400).json({ 
        error: 'Invalid address format',
        code: 'INVALID_ADDRESS'
      });
    } else {
      return res.status(500).json({ 
        error: err.message || 'Mint failed',
        code: 'MINT_ERROR'
      });
    }
  }
}
```

---

## 🛠 유틸리티 함수들

### 블록체인 연결 유틸 (utils/contract.ts)

```typescript
import { ethers } from "ethers";
import dotenv from "dotenv";
import abiJson from "../../artifacts/contracts/GameItem.sol/GameItem.json";

dotenv.config();

export function getProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.RPC_URL || process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
  console.log(`[Contract] Using RPC URL: ${rpcUrl}`);
  return new ethers.JsonRpcProvider(rpcUrl);
}

export async function getWallet(): Promise<ethers.Wallet> {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    throw new Error("PRIVATE_KEY is required. Please set PRIVATE_KEY environment variable.");
  }
  
  const provider = getProvider();
  const wallet = new ethers.Wallet(pk, provider);
  
  const address = await wallet.getAddress();
  const maskedAddress = address.slice(0, 6) + '...' + address.slice(-4);
  console.log(`[Contract] Wallet address: ${maskedAddress}`);
  
  return wallet;
}

export async function getContract() {
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) {
    throw new Error("CONTRACT_ADDRESS is required. Please set CONTRACT_ADDRESS environment variable.");
  }
  
  console.log(`[Contract] Contract address: ${address}`);
  
  const wallet = await getWallet();
  const contract = new ethers.Contract(address, abiJson.abi, wallet);
  
  try {
    const name = await contract.name();
    console.log(`[Contract] Connected to contract: ${name}`);
  } catch (error) {
    console.error('[Contract] Failed to connect to contract:', error);
    throw new Error(`Failed to connect to contract at ${address}: ${error}`);
  }
  
  return contract;
}

export async function checkConnection(): Promise<boolean> {
  try {
    const provider = getProvider();
    await provider.getBlockNumber();
    console.log('[Contract] Network connection: OK');
    return true;
  } catch (error) {
    console.error('[Contract] Network connection failed:', error);
    return false;
  }
}
```

---

## 📋 다음 단계

이제 백엔드 서버의 구조와 API에 대해 이해했으니, 다음 가이드에서는 프론트엔드 웹 인터페이스에 대해 자세히 알아보겠습니다.

**다음 가이드**: [프론트엔드 웹 인터페이스 설명](./NFT_BLOCKCHAIN_PROJECT_GUIDE_5_프론트엔드.md)

---

## 💡 핵심 정리

1. **백엔드 서버는 클라이언트와 블록체인 사이의 중간 역할을 합니다.**
2. **Express.js를 사용하여 RESTful API를 제공합니다.**
3. **컨트롤러는 비즈니스 로직을 처리하고 블록체인과 상호작용합니다.**
4. **미들웨어는 인증, 에러 처리, 레이트 리미팅 등을 담당합니다.**
5. **JWT 토큰 시스템과 bcrypt를 사용하여 보안을 강화합니다.**
