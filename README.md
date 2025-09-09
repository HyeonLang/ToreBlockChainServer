# 🎨 ToreBlockChainServer - NFT 관리 시스템

Avalanche Fuji/Mainnet 배포 가능한 ERC721(GameItem) 컨트랙트와 완전한 NFT 관리 웹 애플리케이션입니다.

## ✨ 주요 기능

### 🖥️ 웹 인터페이스
- **완전한 NFT 관리 UI**: 생성, 전송, 삭제, 조회를 한 곳에서
- **MetaMask 자동 연결**: 지갑 연결 및 주소 자동 입력
- **자동 NFT 추가**: 민팅 완료 후 지갑에 NFT 자동 추가 (`wallet_watchAsset`)
- **실시간 상태 표시**: 진행 상황을 실시간으로 표시
- **거래 이력 조회**: NFT별 및 지갑별 거래 내역 상세 조회
- **통합 기능**: 조회 결과에서 바로 거래 이력 확인 가능
- **반응형 디자인**: 모바일과 데스크톱 모두 지원

### 🔗 블록체인 기능
- **ERC721 표준 준수**: OpenZeppelin 라이브러리 기반
- **URI 저장 기능**: 메타데이터 연결 지원
- **소유자 권한 관리**: 민팅/소각 권한 제어
- **Avalanche 네트워크**: Fuji 테스트넷 및 메인넷 지원

### 🚀 API 기능
- **RESTful API**: v1 버전과 하위 호환성 지원
- **API 키 인증**: `x-api-key` 헤더 지원 (선택)
- **레이트 리미팅**: 인메모리 토큰 버킷 방식 (기본 60req/분)
- **완전한 CRUD**: 생성, 조회, 전송, 삭제 모든 기능

## 🛠️ 기술 스택

### 백엔드
- **Node.js** (>= 18.17)
- **TypeScript** - 타입 안전성
- **Express.js** - 웹 서버
- **Hardhat** - 스마트 컨트랙트 개발
- **Ethers.js** - 블록체인 상호작용

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

### 4. NFT 전송
1. **전송** 탭 선택
2. 보내는 주소, 받는 주소, 토큰 ID 입력
3. "NFT 전송하기" 버튼 클릭
4. MetaMask에서 트랜잭션 승인

### 5. NFT 삭제
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

## 🔌 API 사용법

### v1 API (권장)

#### NFT 생성
```bash
curl -X POST http://localhost:3000/v1/nfts/mint \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "itemInfo": {
      "tokenURI": "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
    }
  }'
```

#### NFT 전송
```bash
curl -X PATCH http://localhost:3000/v1/nfts/1/transfer \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "fromWalletAddress": "0x1111111111111111111111111111111111111111",
    "toWalletAddress": "0x2222222222222222222222222222222222222222"
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

### 기존 API (하위 호환)

#### NFT 생성
```bash
curl -X POST http://localhost:3000/api/nft/mint \
  -H "Content-Type: application/json" \
  -d '{
    "to": "0x1234567890abcdef1234567890abcdef12345678",
    "tokenURI": "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
  }'
```

#### NFT 전송
```bash
curl -X POST http://localhost:3000/api/nft/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "from": "0x1111111111111111111111111111111111111111",
    "to": "0x2222222222222222222222222222222222222222",
    "tokenId": 1
  }'
```

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
│   └── GameItem.sol          # ERC721 NFT 컨트랙트
├── scripts/                  # 배포 스크립트
│   └── deploy.ts
├── src/                      # 백엔드 서버
│   ├── controllers/          # API 컨트롤러
│   │   └── nftController.ts
│   ├── routes/               # API 라우터
│   │   ├── nft.ts           # 기존 API
│   │   └── v1.ts            # v1 API
│   ├── middleware/           # 미들웨어
│   │   ├── auth.ts          # API 키 인증
│   │   ├── rateLimit.ts     # 레이트 리미팅
│   │   └── errorHandler.ts  # 에러 처리
│   ├── utils/               # 유틸리티
│   │   └── contract.ts      # 컨트랙트 연결
│   ├── v1/                  # v1 컨트롤러
│   │   └── controllers.ts
│   └── app.ts               # 메인 서버 파일
├── public/                   # 프론트엔드 파일
│   ├── index.html           # 메인 웹 페이지
│   └── js/
│       └── nft.js           # NFT 관련 JavaScript
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

### 주요 특징
- **ERC721 표준**: OpenZeppelin의 ERC721URIStorage 상속
- **URI 저장**: 각 NFT의 메타데이터 URI 저장
- **소유자 권한**: 민팅과 소각은 컨트랙트 소유자만 가능
- **자동 ID 관리**: 토큰 ID 자동 증가 (1부터 시작)

## 🛡️ 보안 기능

### API 키 인증
- `x-api-key` 헤더를 통한 인증
- 환경변수 `API_KEY`로 설정
- 선택적 사용 (설정하지 않으면 인증 없이 사용 가능)

### 레이트 리미팅
- 인메모리 토큰 버킷 알고리즘
- 기본 설정: 60 요청/분
- 환경변수로 설정 가능

### 입력 검증
- 주소 형식 검증 (0x로 시작하는 42자리)
- URI 형식 검증 (http, https, ipfs 프로토콜)
- 토큰 ID 숫자 검증

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
4. 생성된 NFT 전송 테스트
5. NFT 조회 테스트

### API 테스트
```bash
# 서버 상태 확인
curl http://localhost:3000/health

# 컨트랙트 주소 확인
curl http://localhost:3000/api/nft/address
```

## 📝 변경 이력

### v1.1.0 (현재)
- ✅ 완전한 NFT 관리 웹 인터페이스 구현
- ✅ MetaMask 자동 연결 및 NFT 자동 추가
- ✅ v1 RESTful API 구현
- ✅ API 키 인증 및 레이트 리미팅
- ✅ 지갑 NFT 조회 기능
- ✅ **NFT 거래 이력 조회 기능** (새로 추가)
- ✅ **지갑 거래 이력 조회 기능** (새로 추가)
- ✅ **통합 조회 기능** (새로 추가)
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