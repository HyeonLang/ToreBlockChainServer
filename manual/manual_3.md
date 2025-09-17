# 📖 Manual 3: 마켓 시스템 API 상세

## 🆕 마켓 시스템 개요

마켓 시스템은 NFT를 판매하고 구매할 수 있는 새로운 기능입니다. 사용자는 자신의 NFT를 마켓에 등록하여 판매할 수 있고, 다른 사용자는 마켓에서 NFT를 구매할 수 있습니다.

### 🎯 주요 기능

- **📝 NFT 판매 등록**: 소유한 NFT를 마켓에 등록
- **❌ 판매 등록 취소**: 등록된 NFT 판매를 취소
- **🛒 NFT 구매**: 마켓에서 NFT 구매
- **📋 마켓 목록 조회**: 판매 중인 NFT 목록 확인
- **👤 사용자 거래 내역**: 판매/구매 내역 조회
- **📊 마켓 통계**: 마켓 현황 통계

## 🏗️ 마켓 시스템 구조

### 파일 구조

```
backend/src/
├── 📁 controllers/
│   └── 📄 marketController.ts    # 마켓 컨트롤러
├── 📁 routes/
│   └── 📄 market.ts              # 마켓 라우트
└── 📄 app.ts                     # 마켓 라우터 등록
```

### API 엔드포인트

```
/api/market/
├── POST   /list-nft              # NFT 판매 등록
├── POST   /cancel-listing        # 판매 등록 취소
├── POST   /buy-nft               # NFT 구매
├── GET    /listings              # 판매 중인 NFT 목록
├── GET    /listing/:listingId    # 특정 판매 등록 정보
├── GET    /user-listings/:address # 사용자 판매 등록 목록
├── GET    /user-purchases/:address # 사용자 구매 내역
└── GET    /stats                 # 마켓 통계
```

## 📝 API 상세 설명

### 1. NFT 판매 등록

**엔드포인트**: `POST /api/market/list-nft`

**설명**: 소유한 NFT를 마켓에 판매 등록합니다.

**요청 헤더**:
```http
Content-Type: application/json
X-API-Key: your-api-key
```

**요청 본문**:
```json
{
  "tokenId": 1,
  "price": "100.0",
  "sellerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
}
```

**요청 파라미터**:
- `tokenId` (number): 판매할 NFT의 토큰 ID
- `price` (string): 판매 가격 (TORE 토큰 단위)
- `sellerAddress` (string): 판매자 지갑 주소

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "listingId": 12345,
    "tokenId": 1,
    "price": 100.0,
    "sellerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "status": "active",
    "createdAt": 1694928000000,
    "message": "NFT listed for sale successfully. Please confirm the transaction in MetaMask."
  }
}
```

**에러 응답**:
```json
{
  "success": false,
  "error": "Invalid token ID"
}
```

### 2. 판매 등록 취소

**엔드포인트**: `POST /api/market/cancel-listing`

**설명**: 등록된 NFT 판매를 취소합니다.

**요청 본문**:
```json
{
  "listingId": 12345,
  "sellerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
}
```

**요청 파라미터**:
- `listingId` (number): 취소할 판매 등록 ID
- `sellerAddress` (string): 판매자 지갑 주소

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "listingId": 12345,
    "sellerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "transactionHash": "0x1234567890abcdef...",
    "message": "Listing cancelled successfully. Please confirm the transaction in MetaMask."
  }
}
```

### 3. NFT 구매

**엔드포인트**: `POST /api/market/buy-nft`

**설명**: 마켓에서 NFT를 구매합니다.

**요청 본문**:
```json
{
  "listingId": 12345,
  "buyerAddress": "0x1234567890123456789012345678901234567890"
}
```

**요청 파라미터**:
- `listingId` (number): 구매할 판매 등록 ID
- `buyerAddress` (string): 구매자 지갑 주소

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "listingId": 12345,
    "buyerAddress": "0x1234567890123456789012345678901234567890",
    "transactionHash": "0xabcdef1234567890...",
    "message": "NFT purchased successfully. Please confirm the transaction in MetaMask."
  }
}
```

### 4. 판매 중인 NFT 목록 조회

**엔드포인트**: `GET /api/market/listings`

**설명**: 현재 판매 중인 NFT 목록을 조회합니다.

**쿼리 파라미터**:
- `offset` (number): 시작 위치 (기본값: 0)
- `limit` (number): 조회할 개수 (기본값: 20, 최대: 100)
- `sortBy` (string): 정렬 기준 (기본값: "createdAt")
- `order` (string): 정렬 순서 (기본값: "desc")

**요청 예시**:
```http
GET /api/market/listings?offset=0&limit=10&sortBy=price&order=asc
X-API-Key: your-api-key
```

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "listingId": 1,
        "tokenId": 1,
        "seller": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        "price": "100.0",
        "tokenURI": "https://ipfs.io/ipfs/QmExample1",
        "createdAt": 1694928000000,
        "status": "active"
      },
      {
        "listingId": 2,
        "tokenId": 2,
        "seller": "0x1234567890123456789012345678901234567890",
        "price": "150.0",
        "tokenURI": "https://ipfs.io/ipfs/QmExample2",
        "createdAt": 1694928000000,
        "status": "active"
      }
    ],
    "count": 2,
    "offset": 0,
    "limit": 10,
    "sortBy": "price",
    "order": "asc"
  }
}
```

### 5. 특정 판매 등록 정보 조회

**엔드포인트**: `GET /api/market/listing/:listingId`

**설명**: 특정 판매 등록의 상세 정보를 조회합니다.

**URL 파라미터**:
- `listingId` (number): 조회할 판매 등록 ID

**요청 예시**:
```http
GET /api/market/listing/12345
X-API-Key: your-api-key
```

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "listingId": 12345,
    "tokenId": 1,
    "seller": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "price": "100.0",
    "tokenURI": "https://ipfs.io/ipfs/QmExample1",
    "isActive": true,
    "createdAt": 1694928000000,
    "soldAt": 0
  }
}
```

### 6. 사용자 판매 등록 목록 조회

**엔드포인트**: `GET /api/market/user-listings/:address`

**설명**: 특정 사용자의 판매 등록 목록을 조회합니다.

**URL 파라미터**:
- `address` (string): 사용자 지갑 주소

**쿼리 파라미터**:
- `status` (string): 상태 필터 (all, active, sold, cancelled)

**요청 예시**:
```http
GET /api/market/user-listings/0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6?status=active
X-API-Key: your-api-key
```

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "listings": [
      {
        "listingId": 1,
        "tokenId": 1,
        "price": "100.0",
        "status": "active",
        "createdAt": 1694928000000,
        "soldAt": 0
      },
      {
        "listingId": 2,
        "tokenId": 2,
        "price": "150.0",
        "status": "sold",
        "createdAt": 1694928000000,
        "soldAt": 1695014400000
      }
    ],
    "count": 2,
    "status": "active"
  }
}
```

### 7. 사용자 구매 내역 조회

**엔드포인트**: `GET /api/market/user-purchases/:address`

**설명**: 특정 사용자의 구매 내역을 조회합니다.

**URL 파라미터**:
- `address` (string): 사용자 지갑 주소

**쿼리 파라미터**:
- `offset` (number): 시작 위치 (기본값: 0)
- `limit` (number): 조회할 개수 (기본값: 20, 최대: 100)

**요청 예시**:
```http
GET /api/market/user-purchases/0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6?offset=0&limit=10
X-API-Key: your-api-key
```

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "purchases": [
      {
        "listingId": 4,
        "tokenId": 4,
        "seller": "0x1111111111111111111111111111111111111111",
        "price": "120.0",
        "tokenURI": "https://ipfs.io/ipfs/QmExample4",
        "purchasedAt": 1694928000000
      }
    ],
    "count": 1,
    "offset": 0,
    "limit": 10
  }
}
```

### 8. 마켓 통계 조회

**엔드포인트**: `GET /api/market/stats`

**설명**: 마켓의 전체 통계 정보를 조회합니다.

**요청 예시**:
```http
GET /api/market/stats
X-API-Key: your-api-key
```

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "totalListings": 25,
    "activeListings": 8,
    "soldListings": 15,
    "cancelledListings": 2,
    "totalVolume": "3500.0",
    "averagePrice": "140.0",
    "feePercentage": "2.5",
    "marketAddress": "0xMarketContractAddress"
  }
}
```

## 🔧 구현 세부사항

### 컨트롤러 구조

```typescript
// marketController.ts
export async function listNFT(req: Request, res: Response) {
  try {
    // 1. 입력 검증
    const { tokenId, price, sellerAddress } = req.body;
    
    // 2. 비즈니스 로직
    const listingId = Math.floor(Math.random() * 1000000) + 1;
    
    // 3. 응답
    res.json({
      success: true,
      data: { listingId, tokenId, price, sellerAddress, ... }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to list NFT for sale'
    });
  }
}
```

### 라우트 등록

```typescript
// market.ts
const router = express.Router();

router.post('/list-nft', listNFT);
router.post('/cancel-listing', cancelListing);
router.post('/buy-nft', buyNFT);
router.get('/listings', getListings);
router.get('/listing/:listingId', getListing);
router.get('/user-listings/:address', getUserListings);
router.get('/user-purchases/:address', getUserPurchases);
router.get('/stats', getMarketStats);

export default router;
```

### 앱 통합

```typescript
// app.ts
import marketRouter from "./routes/market";

app.use("/api/market", apiKeyAuth, marketRouter);
```

## 🔐 보안 및 인증

### API 키 인증

모든 마켓 API는 API 키 인증이 필요합니다:

```http
X-API-Key: your-secret-api-key
```

### 입력 검증

모든 입력은 엄격하게 검증됩니다:

- **토큰 ID**: 0 이상의 정수
- **가격**: 0보다 큰 숫자
- **지갑 주소**: 유효한 이더리움 주소 형식 (0x + 40자리 16진수)

### 에러 처리

일관된 에러 응답 형식:

```json
{
  "success": false,
  "error": "Error message"
}
```

## 🌐 환경 변수

마켓 시스템을 위해 다음 환경 변수가 필요합니다:

```env
# 마켓 컨트랙트 주소 (실제 배포 후 설정)
MARKET_CONTRACT_ADDRESS=0x...

# 기존 환경 변수들
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
PRIVATE_KEY=your-private-key
CONTRACT_ADDRESS=your-nft-contract-address
API_KEY=your-api-key
```

## 🔄 데이터 흐름

### NFT 판매 등록 흐름

```
1. 사용자가 NFT 판매 등록 요청
   ↓
2. 입력 검증 (토큰 ID, 가격, 주소)
   ↓
3. 마켓 컨트랙트에 판매 등록
   ↓
4. 판매 등록 ID 생성 및 반환
   ↓
5. 사용자에게 성공 응답
```

### NFT 구매 흐름

```
1. 사용자가 NFT 구매 요청
   ↓
2. 입력 검증 (판매 등록 ID, 구매자 주소)
   ↓
3. 구매자 잔액 확인
   ↓
4. 마켓 컨트랙트에서 구매 실행
   ↓
5. NFT 소유권 이전
   ↓
6. 판매자에게 토큰 전송
   ↓
7. 구매자에게 성공 응답
```

## 🧪 테스트 방법

### cURL 예시

```bash
# NFT 판매 등록
curl -X POST http://localhost:3000/api/market/list-nft \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "tokenId": 1,
    "price": "100.0",
    "sellerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
  }'

# 판매 중인 NFT 목록 조회
curl -X GET "http://localhost:3000/api/market/listings?offset=0&limit=10" \
  -H "X-API-Key: your-api-key"

# 마켓 통계 조회
curl -X GET http://localhost:3000/api/market/stats \
  -H "X-API-Key: your-api-key"
```

## 🔄 다음 단계

마켓 시스템 API를 이해했으니, 다음 매뉴얼을 확인하세요:

- **[manual_4.md](./manual_4.md)**: 프론트엔드 구조 및 사용법
- **[manual_5.md](./manual_5.md)**: 설치 및 실행 가이드

---

**📝 참고사항**: 현재 마켓 시스템은 시뮬레이션 데이터를 반환합니다. 실제 스마트 컨트랙트 연동은 나중에 구현할 수 있습니다.
