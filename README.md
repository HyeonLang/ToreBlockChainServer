# 🎨 ToreBlockChainServer - NFT & TORE 토큰 관리 시스템

Avalanche Fuji/Mainnet 배포 가능한 ERC721(GameItem) 컨트랙트, ERC20(ToreToken) 컨트랙트, 그리고 완전한 NFT와 TORE 토큰 관리 웹 애플리케이션입니다.

## ✨ 프로젝트 정보

<img width="1007" height="491" alt="image" src="https://github.com/user-attachments/assets/cc12aef5-c4ca-41a3-8ce8-79984a6a54a4" />

| 프로젝트 이름 | 깃허브 링크 |
|---|---|
| **TORE 메인 서버 프로젝트** | [ToreMainServer](https://github.com/HyeonLang/ToreMainServer) |
| **TORE Unreal 프로젝트** | [UE5_ToreProject](https://github.com/HyeonLang/UE5_ToreProject) |
| **TORE AI 서버 프로젝트** | [ToreAIServer](https://github.com/HyeonLang/ToreAIServer) |
| **TORE BlockChain 서버 프로젝트** | [ToreBlockChainServer](https://github.com/HyeonLang/ToreBlockChainServer) |


### 🔗 블록체인 기능
- **ERC721 표준 준수**: OpenZeppelin 라이브러리 기반
- **ERC20 표준 준수**: TORE 토큰 (10억개 발행)
- **URI 저장 기능**: 메타데이터 연결 지원
- **소유자 권한 관리**: 민팅/소각 권한 제어
- **게임 통합**: 게임 컨트랙트 및 매니저 관리
- **거래소 지원**: NFT와 TORE 토큰 간 거래
- **Avalanche 네트워크**: Fuji 테스트넷 및 메인넷 지원

### 🚀 API 기능
- **RESTful API**: v1 버전과 하위 호환성 지원
- **JWT 인증**: Access Token (15분) + Refresh Token (7일) 시스템
- **API 키 인증**: `x-api-key` 헤더 지원 (선택)
- **하이브리드 인증**: JWT 또는 API 키 중 하나로 인증 가능
- **레이트 리미팅**: 인메모리 토큰 버킷 방식 (기본 60req/분)
- **완전한 CRUD**: 생성, 조회, 삭제 모든 기능
- **사용자 관리**: 등록, 로그인, 프로필 관리

## 🛠️ 기술 스택

### 백엔드
- **Node.js** (>= 18.17)
- **TypeScript** - 타입 안전성
- **Express.js** - 웹 서버
- **Hardhat** - 스마트 컨트랙트 개발
- **Ethers.js** - 블록체인 상호작용
- **API Key** - API 키 기반 인증
- **bcryptjs** - 비밀번호 해싱

### 프론트엔드
- **Vanilla JavaScript** - 순수 JS로 구현
- **Ethers.js** - 블록체인 연결
- **MetaMask** - 지갑 연동
- **CSS3** - 모던 UI/UX

### 스마트 컨트랙트
- **Solidity** (^0.8.20)
- **OpenZeppelin** - 검증된 라이브러리
- **ERC721URIStorage** - URI 저장 기능

## 📦 설치 및 실행

### 1. 프로젝트 클론 및 의존성 설치
```bash
git clone <repository-url>
cd ToreBlockChainServer
npm install
```

### 2. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
# 블록체인 설정
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
PRIVATE_KEY=0x...
CONTRACT_ADDRESS=0x...

# TORE 토큰 설정
TORE_TOKEN_ADDRESS=0x...
TORE_TOKEN_OWNER=0x...

# 거래소 설정
TORE_EXCHANGE_ADDRESS=0x...
TORE_EXCHANGE_OWNER=0x...

# 서버 설정
PORT=3000
NODE_ENV=development

# API 보안 (선택)
API_KEY=your-api-key
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=60
```

### 3. 스마트 컨트랙트 컴파일 및 배포
```bash
# 컴파일
npm run compile

# Fuji 테스트넷 배포
npm run deploy:fuji

# Avalanche 메인넷 배포
npm run deploy:avalanche

# TORE 토큰 배포 (Fuji 테스트넷)
npm run deploy:tore:fuji

# TORE 토큰 배포 (Avalanche 메인넷)
npm run deploy:tore:avalanche

# 거래소 배포 (Fuji 테스트넷)
npm run deploy:exchange:fuji

# 거래소 배포 (Avalanche 메인넷)
npm run deploy:exchange:avalanche
```

### 4. 서버 실행
```bash
# 개발 모드 (핫 리로드)
npm run dev

# 프로덕션 모드
npm run build
npm start
```

## 🌐 웹 인터페이스 사용법

### 1. 웹 페이지 접속
브라우저에서 `http://localhost:3000` 접속

### 2. 지갑 연결
- "메타마스크 지갑 연결" 버튼 클릭
- MetaMask 팝업에서 계정 선택 및 연결 승인
- 연결된 지갑 주소가 자동으로 입력됨

### 3. NFT 생성
1. **생성** 탭 선택
2. 받는 주소 입력 (연결된 지갑 주소가 자동 입력됨)
3. 토큰 URI 입력 (IPFS 또는 HTTP URL)
4. "NFT 생성하기" 버튼 클릭
5. MetaMask에서 트랜잭션 승인
6. 생성 완료 후 자동으로 지갑에 NFT 추가

### 4. NFT 삭제
1. **삭제** 탭 선택
2. 삭제할 토큰 ID 입력
3. "NFT 삭제하기" 버튼 클릭
4. 확인 팝업에서 승인
5. MetaMask에서 트랜잭션 승인

### 6. NFT 조회
- **개별조회**: 특정 토큰 ID의 정보 조회
- **지갑조회**: 특정 지갑이 소유한 모든 NFT 조회

### 7. 거래 이력 조회
- **NFT 거래 이력**: 특정 NFT의 모든 거래 내역 조회
- **지갑 거래 이력**: 특정 지갑의 모든 NFT 거래 내역 조회
- **통합 조회**: 기존 조회 결과에서 바로 거래 이력 확인

### 8. TORE 토큰 관리
1. **TORE 잔액 조회**
   - TORE잔액 탭 선택
   - 지갑 주소 입력 (연결된 지갑 주소가 자동 입력됨)
   - "TORE 잔액 조회" 버튼 클릭

2. **TORE 토큰 전송**
   - TORE전송 탭 선택
   - 받는 주소와 전송할 TORE 양 입력
   - "TORE 전송하기" 버튼 클릭
   - MetaMask에서 트랜잭션 승인

3. **TORE 전송 내역 조회**
   - TORE내역 탭 선택
   - 지갑 주소 입력 (연결된 지갑 주소가 자동 입력됨)
   - "TORE 전송 내역 조회" 버튼 클릭

## 🔌 API 사용법

### 🔐 인증 시스템

#### JWT 인증 (권장)
JWT 토큰을 사용한 사용자 인증 시스템입니다.

**사용자 등록**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "password": "password123",
    "role": "user"
  }'
```

**로그인**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password"
  }'
```

**응답 예시**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "1",
    "username": "admin",
    "email": "admin@tore.com",
    "role": "admin"
  }
}
```

**토큰 사용**
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/nft/address
```

**토큰 갱신**
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**프로필 조회**
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/auth/profile
```

**로그아웃**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### API 키 인증 (선택사항)
기존 API 키 방식도 지원합니다.

```bash
curl -H "x-api-key: YOUR_API_KEY" \
  http://localhost:3000/api/nft/address
```

### v1 API (권장)

#### NFT 생성
```bash
# JWT 인증 사용
curl -X POST http://localhost:3000/v1/nfts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "itemInfo": {
      "tokenURI": "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
    }
  }'

# API 키 인증 사용
curl -X POST http://localhost:3000/v1/nfts \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "itemInfo": {
      "tokenURI": "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
    }
  }'
```


#### NFT 삭제
```bash
curl -X DELETE http://localhost:3000/v1/nfts/1 \
  -H "x-api-key: your-api-key"
```

#### NFT 조회
```bash
curl http://localhost:3000/v1/nfts/1
```

#### 지갑 NFT 목록 조회
```bash
curl http://localhost:3000/v1/wallets/0x1234567890abcdef1234567890abcdef12345678/nfts
```

#### NFT 거래 이력 조회
```bash
curl http://localhost:3000/api/nft/1/history
```

#### 지갑 거래 이력 조회
```bash
curl "http://localhost:3000/api/nft/wallet/history?walletAddress=0x1234567890abcdef1234567890abcdef12345678"
```

### TORE 토큰 API

#### TORE 잔액 조회
```bash
curl http://localhost:3000/api/tore/balance/0x1234567890abcdef1234567890abcdef12345678
```

#### TORE 토큰 전송
```bash
curl -X POST http://localhost:3000/api/tore/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "to": "0x2222222222222222222222222222222222222222",
    "amount": "100.0"
  }'
```

#### TORE 토큰 민팅
```bash
curl -X POST http://localhost:3000/api/tore/mint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "to": "0x1234567890abcdef1234567890abcdef12345678",
    "amount": "1000.0"
  }'
```

#### TORE 토큰 정보 조회
```bash
curl http://localhost:3000/api/tore/info
```

#### TORE 전송 내역 조회
```bash
curl http://localhost:3000/api/tore/history/0x1234567890abcdef1234567890abcdef12345678
```

### 거래소 API

#### 거래 생성
```bash
curl -X POST http://localhost:3000/api/exchange/create-trade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "tokenId": 1,
    "price": "100.0"
  }'
```

#### NFT 구매
```bash
curl -X POST http://localhost:3000/api/exchange/buy-nft \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "tradeId": 1
  }'
```

#### 활성 거래 목록 조회
```bash
curl "http://localhost:3000/api/exchange/active-trades?offset=0&limit=20"
```

#### 거래소 통계 조회
```bash
curl http://localhost:3000/api/exchange/stats
```

### 기존 API (하위 호환)

#### NFT 생성
```bash
curl -X POST http://localhost:3000/api/nft/mint \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "itemId": 3,
    "userEquipItemId": 1,
    "itemData": {
      "name": "철검",
      "type": "EQUIPMENT",
      "image": "ipfs://...",
      "description": "기본적인 철검입니다."
    }
  }'
```

**응답 예시:**
```json
{
  "txHash": "0x...",
  "tokenId": 123456,
  "tokenURI": "ipfs://...",
  "contractAddress": "0x...",
  "mintedTo": "0x...",
  "itemId": 3,
  "userEquipItemId": 1
}
```

> 💡 **메타마스크에 NFT 자동 추가**: 민팅 후 프론트엔드에서 `wallet_watchAsset` API를 사용하여 메타마스크에 자동으로 NFT를 추가할 수 있습니다. 자세한 내용은 [메타마스크 NFT 통합 가이드](docs/metamask-nft-integration.md)를 참조하세요.


#### NFT 삭제
```bash
curl -X POST http://localhost:3000/api/nft/burn \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": 1
  }'
```

#### NFT 조회
```bash
curl http://localhost:3000/api/nft/1
```

#### 지갑 NFT 조회
```bash
curl "http://localhost:3000/api/nft/wallet?walletAddress=0x1234567890abcdef1234567890abcdef12345678"
```

#### NFT 거래 이력 조회
```bash
curl http://localhost:3000/api/nft/1/history
```

#### 지갑 거래 이력 조회
```bash
curl "http://localhost:3000/api/nft/wallet/history?walletAddress=0x1234567890abcdef1234567890abcdef12345678"
```

## 📁 프로젝트 구조

```
ToreBlockChainServer/
├── contracts/                 # 스마트 컨트랙트
│   ├── GameItem.sol          # ERC721 NFT 컨트랙트
│   ├── ToreToken.sol         # ERC20 TORE 토큰 컨트랙트
│   └── ToreExchange.sol      # NFT-TORE 거래소 컨트랙트
├── scripts/                  # 배포 스크립트
│   ├── deploy.ts             # NFT 컨트랙트 배포
│   ├── deployToreToken.ts    # TORE 토큰 배포
│   └── deployToreExchange.ts # 거래소 배포
├── src/                      # 백엔드 서버
│   ├── controllers/          # API 컨트롤러
│   │   ├── nftController.ts  # NFT 관리 컨트롤러
│   │   ├── authController.ts # JWT 인증 컨트롤러
│   │   ├── toreTokenController.ts # TORE 토큰 컨트롤러
│   │   └── exchangeController.ts  # 거래소 컨트롤러
│   ├── routes/               # API 라우터
│   │   ├── nft.ts           # NFT API
│   │   ├── v1.ts            # v1 API
│   │   ├── auth.ts          # JWT 인증 API
│   │   ├── toreToken.ts     # TORE 토큰 API
│   │   └── exchange.ts      # 거래소 API
│   ├── middleware/           # 미들웨어
│   │   ├── auth.ts          # API 키 인증
│   │   ├── jwtAuth.ts       # JWT 인증
│   │   ├── rateLimit.ts     # 레이트 리미팅
│   │   └── errorHandler.ts  # 에러 처리
│   ├── utils/               # 유틸리티
│   │   ├── contract.ts      # 컨트랙트 연결
│   │   ├── jwt.ts           # JWT 유틸리티
│   │   └── toreToken.ts     # TORE 토큰 유틸리티
│   ├── v1/                  # v1 컨트롤러
│   │   └── controllers.ts
│   └── app.ts               # 메인 서버 파일
├── public/                   # 프론트엔드 파일
│   ├── index.html           # 메인 웹 페이지
│   └── js/
│       ├── nft.js           # NFT 관련 JavaScript
│       └── toreToken.js     # TORE 토큰 관련 JavaScript
├── artifacts/               # 컴파일된 컨트랙트
├── cache/                   # Hardhat 캐시
├── dist/                    # 빌드된 서버 파일
├── hardhat.config.cjs       # Hardhat 설정
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 스마트 컨트랙트 상세

### GameItem.sol
```solidity
contract GameItem is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    
    // NFT 민팅 (소유자만 가능)
    function mint(address to, string memory tokenURI_) external onlyOwner returns (uint256 tokenId)
    
    // NFT 소각 (소유자만 가능)
    function burn(uint256 tokenId) external onlyOwner
    
    // 다음 토큰 ID 조회
    function nextTokenId() external view returns (uint256)
}
```

### ToreToken.sol
```solidity
contract ToreToken is ERC20, Ownable {
    uint256 private constant INITIAL_SUPPLY = 1000000000 * 10**18; // 10억개
    
    // 토큰 민팅 (소유자만 가능)
    function mint(address to, uint256 amount) external onlyOwner
    
    // 게임 보상 지급
    function distributeGameReward(address player, uint256 amount) external
    
    // 거래소 전송 (거래소 컨트랙트만 가능)
    function exchangeTransfer(address from, address to, uint256 amount) external
}
```

### ToreExchange.sol
```solidity
contract ToreExchange is Ownable, ReentrancyGuard {
    struct Trade {
        address seller;
        address buyer;
        uint256 tokenId;
        uint256 price;
        bool isActive;
        uint256 createdAt;
        uint256 completedAt;
    }
    
    // 거래 생성
    function createTrade(uint256 tokenId, uint256 price) external
    
    // NFT 구매
    function buyNFT(uint256 tradeId) external
    
    // 거래 취소
    function cancelTrade(uint256 tradeId) external
}
```

### 주요 특징
- **ERC721 표준**: OpenZeppelin의 ERC721URIStorage 상속
- **ERC20 표준**: OpenZeppelin의 ERC20 상속 (TORE 토큰)
- **URI 저장**: 각 NFT의 메타데이터 URI 저장
- **소유자 권한**: 민팅과 소각은 컨트랙트 소유자만 가능
- **자동 ID 관리**: 토큰 ID 자동 증가 (1부터 시작)
- **게임 통합**: 게임 컨트랙트 및 매니저 관리
- **거래소 기능**: NFT와 TORE 토큰 간 거래 지원

## 🛡️ 보안 기능

### JWT 인증 (권장)
- **Access Token**: 15분 만료, 짧은 생명주기
- **Refresh Token**: 7일 만료, 토큰 갱신용
- **비밀키 분리**: Access Token과 Refresh Token 다른 비밀키 사용
- **사용자 정보**: 토큰에 사용자 ID, 역할, 권한 포함
- **자동 갱신**: Refresh Token으로 새로운 Access Token 발급

### API 키 인증 (선택사항)
- `x-api-key` 헤더를 통한 인증
- 환경변수 `API_KEY`로 설정
- 선택적 사용 (설정하지 않으면 인증 없이 사용 가능)

### 하이브리드 인증
- JWT 토큰이 있으면 JWT 인증 우선
- JWT 토큰이 없으면 API 키 인증 시도
- 두 방식 중 하나라도 성공하면 접근 허용

### 비밀번호 보안
- **bcrypt 해싱**: 솔트 라운드 10으로 비밀번호 해싱
- **안전한 저장**: 해싱된 비밀번호만 데이터베이스 저장
- **검증**: 로그인 시 bcrypt.compare로 비밀번호 확인

### 레이트 리미팅
- 인메모리 토큰 버킷 알고리즘
- 기본 설정: 60 요청/분
- 환경변수로 설정 가능
- IP 주소와 API 키 기반 구분

### 입력 검증
- 주소 형식 검증 (0x로 시작하는 42자리)
- URI 형식 검증 (http, https, ipfs 프로토콜)
- 토큰 ID 숫자 검증
- JWT 토큰 형식 및 서명 검증

## 🌐 네트워크 설정

### Avalanche Fuji 테스트넷
- RPC URL: `https://api.avax-test.network/ext/bc/C/rpc`
- 체인 ID: 43113
- Faucet: https://core.app/tools/testnet-faucet/

### Avalanche 메인넷
- RPC URL: `https://api.avax.network/ext/bc/C/rpc`
- 체인 ID: 43114

## 🚀 배포 가이드

### 1. 환경 설정
```bash
# .env 파일에 PRIVATE_KEY와 RPC_URL 설정
PRIVATE_KEY=0x...
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
```

### 2. 컨트랙트 배포
```bash
# Fuji 테스트넷 배포
npm run deploy:fuji

# 배포된 컨트랙트 주소를 .env에 설정
CONTRACT_ADDRESS=0x...
```

### 3. 서버 배포
```bash
# 프로덕션 빌드
npm run build

# 서버 실행
npm start
```

## 🧪 테스트

### 웹 인터페이스 테스트
1. `http://localhost:3000` 접속
2. MetaMask 연결
3. NFT 생성 테스트
4. NFT 조회 테스트

### API 테스트
```bash
# 서버 상태 확인
curl http://localhost:3000/health

# 컨트랙트 주소 확인
curl http://localhost:3000/api/nft/address
```

## 🔒 NFT Vault 시스템

### 개요
NFT Vault는 NFT를 안전하게 락업하고 관리하는 시스템입니다.

### 주요 기능
- **NFT 락업**: NFT를 Vault 컨트랙트로 이동하여 안전하게 보관
- **NFT 락업 해제**: Vault에서 NFT를 개인 지갑으로 다시 이동
- **보관 상태 조회**: Vault에 보관된 NFT 목록 확인

### 컨트랙트
- **NftVault.sol**: NFT 락업/해제 컨트랙트
- **위치**: `blockchain/contracts/NftVault.sol`
- **기능**: 
  - `lockNft()`: NFT를 Vault로 이동
  - `unlockNft()`: NFT를 개인 주소로 이동
  - `getVaultedTokens()`: 보관된 NFT 목록 조회

### API 엔드포인트

#### NFT 락업
```bash
POST /api/nft/lock
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "walletAddress": "0x...",
  "tokenId": 123
}
```

#### NFT 락업 해제
```bash
POST /api/nft/unlock
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "walletAddress": "0x...",
  "tokenId": 123
}
```

#### Vault에 보관된 NFT 조회
```bash
GET /api/nft/vault?walletAddress=0x...
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 실제 네트워크 배포 가이드

#### 1단계: 환경변수 설정 (.env 파일)
`.env` 파일이 프로젝트 루트에 있는지 확인하고, 다음 변수들이 설정되어 있는지 확인하세요:

```env
# ⚠️ 필수 환경변수
PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE          # 배포자 지갑 개인키 (0x 없이)
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc  # Fuji 테스트넷 RPC
CONTRACT_ADDRESS=0x...                       # NFT 컨트랙트 주소 (이미 배포된 경우)
VAULT_ADDRESS=0x...                          # Vault 컨트랙트 주소 (배포 후 채움)
PORT=3000
NODE_ENV=development
```

#### 2단계: NFT 컨트랙트 배포 (아직 배포하지 않은 경우)
```bash
# NFT 컨트랙트를 Fuji 테스트넷에 배포
npm run deploy:fuji

# 배포된 주소를 .env 파일의 CONTRACT_ADDRESS에 추가하세요
```

#### 3단계: Vault 컨트랙트 배포
```bash
# Vault 컨트랙트를 Fuji 테스트넷에 배포
npm run deploy:vault:fuji

# 배포 결과에서 나온 주소를 .env 파일의 VAULT_ADDRESS에 추가하세요
# 예: VAULT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
```

#### 4단계: 배포 확인
배포 후 출력되는 주소를 복사하여 `.env` 파일을 업데이트하세요.
또한 Avalanche Explorer에서 배포를 확인할 수 있습니다:
- Fuji 테스트넷: https://testnet.snowtrace.io/

#### 5단계: 백엔드 서버 재시작
환경변수를 업데이트한 후 서버를 재시작하세요:

```bash
# 서버 중지 (Ctrl+C)
# 그리고 다시 시작
npm run dev
```

#### ⚠️ 보안 주의사항
- `.env` 파일은 절대 Git에 커밋하지 마세요 (이미 .gitignore에 포함됨)
- 테스트넷용 지갑만 사용하고, 실제 자금이 있는 지갑의 개인키는 절대 사용하지 마세요
- Fuji 테스트넷 Faucet에서 테스트 토큰을 받아서 사용하세요: https://core.app/tools/testnet-faucet/

### 테스트
```bash
# Vault 락업/해제 테스트
npm run test:vault
```

### ⚠️ 현재 구현의 제한사항

현재 백엔드는 **서버 측 지갑(private key)**을 사용하여 트랜잭션을 전송합니다.
이 방식은 **보안상 위험**이 있으며, 실제 운영 환경에서는 권장되지 않습니다.

**주의사항:**
- 기본 배포 스크립트(`deploy:vault`)는 **로컬 가상 네트워크(hardhat)**에 배포합니다
- 실제 테스트넷/메인넷에서 작동하려면 환경변수 설정 후 `deploy:vault:fuji` 또는 `deploy:vault:avalanche` 명령을 사용해야 합니다
- 현재 락업 기능은 서버 지갑이 NFT 소유자인 경우에만 작동합니다

### 개선 방안

#### 1. 프론트엔드에서 직접 호출 (권장)
```javascript
// 프론트엔드에서 사용자가 직접 MetaMask로 approve & lock
await nftContract.approve(VAULT_ADDRESS, tokenId);
await vaultContract.lockNft(NFT_CONTRACT_ADDRESS, tokenId);
```

#### 2. 서명된 메시지 방식
- 사용자가 오프체인에서 메시지 서명
- 백엔드에서 서명 검증
- 백엔드가 대리 전송 (meta transaction)

#### 3. 서명된 매개변수 (EIP-712)
```solidity
function lockNftWithSignature(
    address nftContract,
    uint256 tokenId,
    uint256 nonce,
    bytes memory signature
) external {
    // 서명 검증 및 락업 진행
}
```

### 스마트 컨트랙트 구조

**NftVault.sol** (`blockchain/contracts/NftVault.sol`)
- `lockNft(address nftContract, uint256 tokenId)`: NFT를 Vault에 락업
- `unlockNft(address nftContract, uint256 tokenId)`: NFT를 Vault에서 꺼냄
- `getVaultedTokens(address owner, address nftContract)`: 보관된 NFT 목록 조회
- `isNftVaulted(address owner, address nftContract, uint256 tokenId)`: 락업 여부 확인

**보안 기능**
- ERC721Receiver 구현: NFT를 안전하게 받을 수 있음
- 소유자 권한 기반 락업/락업 해제
- 중복 락업 방지

### 문제 해결

#### "Not approved" 오류
**원인**: NFT 컨트랙트에 Vault 주소가 approve되지 않음  
**해결**: 사용자가 직접 approve
```javascript
await nftContract.approve(VAULT_ADDRESS, tokenId);
```

#### "Not token owner" 오류
**원인**: NFT 소유자가 요청한 주소와 다름  
**해결**: 올바른 walletAddress로 요청하거나 NFT를 먼저 서버 지갑으로 전송

## 📝 변경 이력

### v1.3.0 (현재)
- ✅ **TORE 토큰 시스템** (새로 추가)
  - ERC20 표준 TORE 토큰 (10억개 발행)
  - 토큰 잔액 조회, 전송, 민팅, 소각
  - 게임 보상 지급 및 배치 전송
  - 게임 컨트랙트 및 매니저 관리
  - 거래소 컨트랙트 관리
  - 지갑별 전송 내역 조회
- ✅ **NFT-TORE 거래소** (새로 추가)
  - NFT를 TORE 토큰으로 판매
  - TORE 토큰으로 NFT 구매
  - 거래 생성, 구매, 취소 기능
  - 거래 내역 관리 및 통계
  - 거래 수수료 관리 (기본 2.5%)
- ✅ **프론트엔드 업데이트** (새로 추가)
  - TORE 토큰 관리 UI 추가
  - TORE 잔액 조회, 전송, 내역 조회
  - MetaMask 연동 및 자동 주소 입력
  - 반응형 디자인 및 사용자 친화적 인터페이스
- ✅ **백엔드 API 확장** (새로 추가)
  - TORE 토큰 관련 API 엔드포인트
  - 거래소 관련 API 엔드포인트
  - JWT 인증 및 API 키 인증 지원
  - 상세한 에러 처리 및 로깅
- ✅ 완전한 NFT 관리 웹 인터페이스 구현
- ✅ MetaMask 자동 연결 및 NFT 자동 추가
- ✅ v1 RESTful API 구현
- ✅ API 키 인증 및 레이트 리미팅
- ✅ 지갑 NFT 조회 기능
- ✅ **JWT 인증 시스템**
  - Access Token (15분) + Refresh Token (7일)
  - 사용자 등록, 로그인, 로그아웃
  - 토큰 갱신 및 프로필 관리
  - 하이브리드 인증 (JWT + API 키)
- ✅ **비밀번호 보안**
  - bcrypt 해싱 (솔트 라운드 10)
  - 안전한 비밀번호 저장 및 검증
- ✅ **상세한 코드 주석**
  - 모든 파일에 상세한 주석 추가
  - 함수별 실행 흐름 설명
  - 사용 예시 및 에러 처리 가이드
- ✅ NFT 거래 이력 조회 기능
- ✅ 지갑 거래 이력 조회 기능
- ✅ 통합 조회 기능
- ✅ 반응형 UI/UX 디자인

### v1.1.0
- ✅ 완전한 NFT 관리 웹 인터페이스 구현
- ✅ MetaMask 자동 연결 및 NFT 자동 추가
- ✅ v1 RESTful API 구현
- ✅ API 키 인증 및 레이트 리미팅
- ✅ 지갑 NFT 조회 기능
- ✅ NFT 거래 이력 조회 기능
- ✅ 지갑 거래 이력 조회 기능
- ✅ 통합 조회 기능
- ✅ 반응형 UI/UX 디자인

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해주세요.

---

**ToreBlockChainServer** - 완전한 NFT 관리 시스템을 위한 올인원 솔루션 🚀
