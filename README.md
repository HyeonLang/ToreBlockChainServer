## Hardhat + TypeScript + Express 템플릿 (v1 API 적용)

Avalanche Fuji/Mainnet 배포 가능한 ERC721(GameItem) 컨트랙트와 Express JSON API 서버 템플릿입니다.
이 프로젝트는 v1 버전의 RESTful API, API 키 인증, 레이트 리미팅, 지갑 보유 NFT 조회가 추가되었습니다.

### 🆕 새로운 기능
- **웹 인터페이스**: NFT 생성/전송/삭제/조회 UI
- **자동 지갑 연결**: 메타마스크 연결 및 주소 자동 입력
- **자동 NFT 추가**: 민팅 완료 후 지갑에 NFT 자동 추가 (`wallet_watchAsset`)
- **실시간 상태 표시**: 진행 상황을 실시간 표시
- **v1 REST API**: 버전드 경로(`/v1`)와 표준 HTTP 메서드 매핑
- **API 키 인증**: `x-api-key` 헤더 지원 (선택)
- **레이트 리미팅**: 인메모리 토큰 버킷 방식 (기본 60req/분)
- **지갑 전체 NFT 조회**: 컨트랙트 `nextTokenId` 순회 기반

### 요구사항
- Node.js >= 18.17

### 설치
```bash
npm install
```

### 환경 변수 설정
`.env` 파일을 만들고 아래 예시를 참고하세요(`.env.example` 참고).

```env
# 블록체인
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
PRIVATE_KEY=0x...
CONTRACT_ADDRESS=0x...

# 서버
PORT=3000
NODE_ENV=development

# 인증 / 레이트 리미팅 (선택)
API_KEY=your-api-key
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=60
```

### 사용법
```bash
# 컴파일/타입체크
npm run compile
npm run typecheck

# 로컬 개발 서버
npm run dev

# 빌드 후 실행
npm run build
npm start

# 배포
npm run deploy:fuji
npm run deploy:avalanche
```

### 구조
```
contracts/          # 스마트 컨트랙트 (Solidity)
scripts/            # 배포 스크립트
src/                # 백엔드 서버 (TypeScript)
  controllers/      # API 컨트롤러
  routes/           # API 라우터
  utils/            # 유틸리티 함수
  middleware/       # 미들웨어
  app.ts           # 메인 서버 파일
public/             # 프론트엔드 파일 (HTML/CSS/JS)
  index.html       # 메인 웹 페이지
  js/
    nft.js         # NFT 관련 JavaScript 로직
```

### 주요 API (v1)
- POST `/v1/nfts/mint`
  - Request: `{ walletAddress, contractAddress?, itemInfo: { tokenURI } }`
  - Response: `{ nftId, success }`
- PATCH `/v1/nfts/{nftId}/transfer`
  - Request: `{ fromWalletAddress, toWalletAddress, contractAddress? }`
  - Response: `{ nftId, success }`
- DELETE `/v1/nfts/{nftId}`
  - Request: `{ walletAddress?, contractAddress? }`
  - Response: `{ nftId, success }`
- GET `/v1/nfts/{nftId}`
  - Response: `{ exists, ownerAddress?, contractAddress?, tokenURI? }`
- GET `/v1/wallets/{walletAddress}/nfts`
  - Response: `{ nfts: [{ nftId, contractAddress, itemInfo: { tokenURI } }], success }`

기존 경로(하위 호환):
- `POST /api/nft/mint`, `POST /api/nft/transfer`, `POST /api/nft/burn`, `GET /api/nft/:tokenId`, `GET /api/nft/address`

### 웹 인터페이스
- `GET /` - NFT 민팅 웹 페이지
- 자동 지갑 연결 및 NFT 추가 기능 포함

배포 후 발급된 `CONTRACT_ADDRESS`를 `.env`에 설정하여 API가 컨트랙트에 연결되도록 하세요.

avax fuji testnet faucet 주소
테스트넷 주소에 가스비가 부족할경우 여기서 가스비를 받을수있음
https://core.app/tools/testnet-faucet/

## 빠른 테스트 절차
### v1 API 호출 예시 (PowerShell)

1) 민팅
```powershell
$body = @{
  walletAddress = "0x1234567890abcdef1234567890abcdef12345678"
  itemInfo = @{ tokenURI = "ipfs://bafy..." }
} | ConvertTo-Json

$headers = @{ "x-api-key" = "your-api-key" }
Invoke-RestMethod -Uri "http://localhost:3000/v1/nfts/mint" -Headers $headers -Method Post -ContentType "application/json" -Body $body
```

2) 전송
```powershell
$body = @{
  fromWalletAddress = "0x1111111111111111111111111111111111111111"
  toWalletAddress = "0x2222222222222222222222222222222222222222"
} | ConvertTo-Json

$headers = @{ "x-api-key" = "your-api-key" }
Invoke-RestMethod -Uri "http://localhost:3000/v1/nfts/1/transfer" -Headers $headers -Method Patch -ContentType "application/json" -Body $body
```

3) 소각
```powershell
$headers = @{ "x-api-key" = "your-api-key" }
Invoke-RestMethod -Uri "http://localhost:3000/v1/nfts/1" -Headers $headers -Method Delete
```

4) 단일 조회
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/v1/nfts/1" -Method Get
```

5) 지갑 내 전체 NFT 조회
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/v1/wallets/0x1234567890abcdef1234567890abcdef12345678/nfts" -Method Get
```

## 변경사항(Change Log)

- feat(api): v1 버전 도입 및 RESTful 경로/메서드 정렬 (`/v1/...`)
- feat(auth): API 키 기반 인증(`x-api-key`) 추가 (`src/middleware/auth.ts`)
- feat(rate-limit): 인메모리 토큰 버킷 레이트리미팅 추가 (`src/middleware/rateLimit.ts`)
- feat(v1): 컨트롤러 추가(민팅/전송/소각/단일조회/지갑내목록) (`src/v1/controllers.ts`)
- feat(routing): v1 라우터 마운트 (`src/routes/v1.ts`, `src/app.ts`)
- docs: README 및 실행 흐름 문서 업데이트

## 문제 해결 과정(Selected Fixes)

- 설계와 구현 간 경로/메서드 불일치 → v1 라우터로 표준화
- 무인증 API → `x-api-key` 인증 도입으로 최소 보호선 제공
- Abuse 가능성(과도한 호출) → 토큰 버킷 레이트리미터 적용(기본 60rpm)
- 지갑 보유 NFT 목록 제공 필요 → `nextTokenId` 순회 + `ownerOf`/`tokenURI`로 구성


### 방법 1: 웹 인터페이스 사용 (권장)
1단계: 서버 실행
```bash
npm run dev
```

2단계: 웹 브라우저에서 접속
- http://localhost:3000 으로 접속
- 메타마스크 지갑 연결
- NFT 민팅 폼 작성 및 제출
- 민팅 완료 후 자동으로 지갑에 NFT 추가

### 방법 2: API 직접 호출
1단계: 서버 실행
```bash
npm run dev
```

2단계: 서버가 실행되었는지 확인
브라우저에서 http://localhost:3000/health 주소로 접속하면 { "ok": true }가 나와야 합니다.

3단계: 컨트랙트 주소 확인
브라우저에서 http://localhost:3000/api/nft/address 접속하면 { "address": "0x..." } 형태로 주소가 나와야 합니다.

4단계: NFT 생성(민팅) - PowerShell 사용
PowerShell을 열고 아래 명령어를 실행하세요:
```powershell
$body = @{
  to = "0x1234567890abcdef1234567890abcdef12345678"  # 여기에 실제 받을 주소 입력
  tokenURI = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"  # 예시 IPFS URI
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/nft/mint" -Method Post -ContentType "application/json" -Body $body
```

5단계: 생성된 tokenId 확인
민팅 응답으로 받은 txHash를 사용해서:
SnowTrace Fuji 접속
트랜잭션 해시 검색
"Transfer" 이벤트에서 tokenId 확인 (보통 1부터 시작)

6단계: NFT 삭제(소각) - PowerShell 사용
```powershell
$body = @{ tokenId = 1}  | ConvertTo-Json  # 1 대신 실제 tokenId 입력

Invoke-RestMethod -Uri "http://localhost:3000/api/nft/burn" -Method Post -ContentType "application/json" -Body $body
```
테스트 결과:

생성

txhash
0xa09ab6a7ae1c51977ffd8bdb2603a969cda8a50734424ba20f7246ce3f369e1c

링크
https://testnet.snowtrace.io/tx/0xa09ab6a7ae1c51977ffd8bdb2603a969cda8a50734424ba20f7246ce3f369e1c

삭제

txhash
0x586e69eea6b7a529535edfd1830460d53f196c6b7b5584871563038f4c56c69c

링크
https://testnet.snowtrace.io/tx/0x586e69eea6b7a529535edfd1830460d53f196c6b7b5584871563038f4c56c69c