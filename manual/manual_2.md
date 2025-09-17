# 📖 Manual 2: 백엔드 서버 구조 및 API

## 🏗️ 백엔드 서버 아키텍처

ToreBlockChainServer의 백엔드는 **Express.js** 기반의 RESTful API 서버로 구성되어 있습니다. 모든 API는 TypeScript로 작성되어 타입 안전성을 보장합니다.

## 📁 백엔드 디렉토리 구조

```
backend/
├── 📁 src/
│   ├── 📄 app.ts                    # 🚀 메인 서버 진입점
│   ├── 📁 controllers/              # 🎮 API 컨트롤러
│   │   ├── 📄 authController.ts      # 인증 관련
│   │   ├── 📄 exchangeController.ts # 거래소 관련
│   │   ├── 📄 marketController.ts   # 🆕 마켓 시스템
│   │   ├── 📄 nftController.ts      # NFT 관련
│   │   ├── 📄 toreTokenController.ts # TORE 토큰 관련
│   │   └── 📄 v1Controllers.ts      # v1 API
│   ├── 📁 middleware/               # 🔧 미들웨어
│   │   ├── 📄 auth.ts               # 인증 미들웨어
│   │   ├── 📄 errorHandler.ts       # 에러 처리
│   │   ├── 📄 jwtAuth.ts            # JWT 인증
│   │   └── 📄 rateLimit.ts          # 요청 제한
│   ├── 📁 routes/                   # 🛣️ API 라우트
│   │   ├── 📄 auth.ts               # 인증 라우트
│   │   ├── 📄 exchange.ts           # 거래소 라우트
│   │   ├── 📄 market.ts             # 🆕 마켓 라우트
│   │   ├── 📄 nft.ts                # NFT 라우트
│   │   ├── 📄 toreToken.ts          # 토큰 라우트
│   │   └── 📄 v1.ts                 # v1 라우트
│   └── 📁 utils/                    # 🛠️ 유틸리티
│       ├── 📄 contract.ts            # 컨트랙트 연결
│       ├── 📄 jwt.ts                # JWT 처리
│       └── 📄 toreToken.ts          # 토큰 유틸리티
└── 📁 tests/                        # 🧪 테스트 파일
```

## 🚀 메인 서버 파일 (`app.ts`)

### 서버 초기화 과정

```typescript
// 1. 환경 변수 로드
dotenv.config();

// 2. Express 앱 생성
const app = express();

// 3. 미들웨어 설정
app.use(express.json());                    // JSON 파싱
app.use(express.static("frontend/public")); // 정적 파일 서빙

// 4. 라우트 등록
app.use("/api/auth", authRouter);           // 인증 (인증 불필요)
app.use("/api/tore", apiKeyAuth, toreTokenRouter);     // TORE 토큰
app.use("/api/exchange", apiKeyAuth, exchangeRouter);  // 거래소
app.use("/api/market", apiKeyAuth, marketRouter);      // 🆕 마켓
app.use("/api/nft", apiKeyAuth, nftRouter);            // NFT
app.use("/v1", apiKeyAuth, v1Router);                  // v1 API

// 5. 에러 핸들러
app.use(errorHandler);

// 6. 서버 시작
app.listen(port);
```

### 주요 설정

- **포트**: 3000 (기본값) 또는 `PORT` 환경변수
- **정적 파일**: `frontend/public` 폴더 서빙
- **인증**: API 키 기반 인증 (`X-API-Key` 헤더)
- **에러 처리**: 전역 에러 핸들러

## 🎮 컨트롤러 구조

### 컨트롤러 패턴

모든 컨트롤러는 동일한 패턴을 따릅니다:

```typescript
export async function functionName(req: Request, res: Response) {
  try {
    // 1. 입력 검증
    const { param1, param2 } = req.body;
    if (!param1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameter'
      });
    }
    
    // 2. 비즈니스 로직
    const result = await someBusinessLogic();
    
    // 3. 성공 응답
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    // 4. 에러 처리
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
```

### 기존 컨트롤러들

#### 1. **NFT 컨트롤러** (`nftController.ts`)
- `mintNFT()` - NFT 생성
- `transferNFT()` - NFT 전송
- `burnNFT()` - NFT 삭제
- `getNFTInfo()` - NFT 정보 조회
- `getWalletNFTs()` - 지갑 NFT 목록

#### 2. **TORE 토큰 컨트롤러** (`toreTokenController.ts`)
- `getTokenInfo()` - 토큰 정보
- `getBalance()` - 잔액 조회
- `transferTokens()` - 토큰 전송
- `getTransferHistory()` - 전송 내역

#### 3. **거래소 컨트롤러** (`exchangeController.ts`)
- `createTrade()` - 거래 생성
- `buyNFT()` - NFT 구매
- `cancelTrade()` - 거래 취소
- `getTrade()` - 거래 정보
- `getUserTrades()` - 사용자 거래 목록
- `getActiveTrades()` - 활성 거래 목록
- `getExchangeStats()` - 거래소 통계

#### 4. **인증 컨트롤러** (`authController.ts`)
- `login()` - 로그인
- `logout()` - 로그아웃
- `refreshToken()` - 토큰 갱신

## 🛣️ 라우트 구조

### 라우트 등록 패턴

```typescript
// 라우터 생성
const router = express.Router();

// 라우트 등록
router.post('/endpoint', controllerFunction);
router.get('/endpoint/:param', controllerFunction);

// 라우터 export
export default router;
```

### 기존 라우트들

#### 1. **NFT 라우트** (`/api/nft/*`)
```typescript
POST   /api/nft/mint              # NFT 생성
POST   /api/nft/transfer           # NFT 전송
POST   /api/nft/burn              # NFT 삭제
GET    /api/nft/info/:tokenId     # NFT 정보
GET    /api/nft/wallet/:address   # 지갑 NFT 목록
```

#### 2. **TORE 토큰 라우트** (`/api/tore/*`)
```typescript
GET    /api/tore/info             # 토큰 정보
GET    /api/tore/balance/:address # 잔액 조회
POST   /api/tore/transfer         # 토큰 전송
GET    /api/tore/history/:address # 전송 내역
```

#### 3. **거래소 라우트** (`/api/exchange/*`)
```typescript
POST   /api/exchange/create-trade    # 거래 생성
POST   /api/exchange/buy-nft         # NFT 구매
POST   /api/exchange/cancel-trade    # 거래 취소
GET    /api/exchange/trade/:tradeId  # 거래 정보
GET    /api/exchange/user-trades/:address # 사용자 거래
GET    /api/exchange/active-trades   # 활성 거래 목록
GET    /api/exchange/stats           # 거래소 통계
```

#### 4. **인증 라우트** (`/api/auth/*`)
```typescript
POST   /api/auth/login           # 로그인
POST   /api/auth/logout          # 로그아웃
POST   /api/auth/refresh         # 토큰 갱신
```

## 🔧 미들웨어

### 1. **인증 미들웨어** (`auth.ts`)

```typescript
// API 키 인증
export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    });
  }
  next();
}
```

### 2. **에러 핸들러** (`errorHandler.ts`)

```typescript
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
}
```

### 3. **JWT 인증** (`jwtAuth.ts`)

```typescript
// JWT 토큰 검증
export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  // JWT 검증 로직
}
```

## 🛠️ 유틸리티

### 1. **컨트랙트 유틸리티** (`contract.ts`)

```typescript
// Provider 생성
export function getProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
  return new ethers.JsonRpcProvider(rpcUrl);
}

// 지갑 생성
export async function getWallet(): Promise<ethers.Wallet> {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY is required");
  return new ethers.Wallet(pk, getProvider());
}

// 컨트랙트 인스턴스 생성
export async function getContract() {
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) throw new Error("CONTRACT_ADDRESS is required");
  const wallet = await getWallet();
  return new ethers.Contract(address, abiJson.abi, wallet);
}
```

## 🔐 보안

### API 키 인증

모든 민감한 API는 API 키 인증을 사용합니다:

```http
GET /api/nft/info/1
X-API-Key: your-secret-api-key
```

### 환경 변수

```env
# 블록체인 연결
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
PRIVATE_KEY=your-private-key
CONTRACT_ADDRESS=your-contract-address

# API 보안
API_KEY=your-secret-api-key

# 컨트랙트 주소
TORE_EXCHANGE_ADDRESS=exchange-contract-address
MARKET_CONTRACT_ADDRESS=market-contract-address
```

## 📊 응답 형식

### 성공 응답

```json
{
  "success": true,
  "data": {
    "tokenId": 1,
    "owner": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "tokenURI": "https://ipfs.io/ipfs/QmExample"
  }
}
```

### 에러 응답

```json
{
  "success": false,
  "error": "Invalid token ID"
}
```

## 🧪 테스트

### 테스트 실행

```bash
# 테스트 실행
npm test

# 특정 테스트 파일 실행
npm test -- --grep "NFT"
```

### 테스트 구조

```
tests/
├── 📄 test-jwt.js          # JWT 테스트
└── 📄 test.md              # 테스트 문서
```

## 🔄 다음 단계

백엔드 구조를 이해했으니, 다음 매뉴얼을 확인하세요:

- **[manual_3.md](./manual_3.md)**: 🆕 마켓 시스템 API 상세 (새로 추가된 기능)
- **[manual_4.md](./manual_4.md)**: 프론트엔드 구조 및 사용법
- **[manual_5.md](./manual_5.md)**: 설치 및 실행 가이드

---

**📝 참고사항**: 모든 API는 RESTful 설계 원칙을 따르며, 일관된 응답 형식을 사용합니다.
