## Hardhat + TypeScript + Express 템플릿

Avalanche Fuji/Mainnet 배포 가능한 ERC721(GameItem) 컨트랙트와 Express JSON API 서버 템플릿입니다.

### 🆕 새로운 기능
- **웹 인터페이스**: NFT 민팅을 위한 사용자 친화적인 웹 페이지
- **자동 지갑 연결**: 메타마스크 지갑 자동 연결 및 주소 자동 입력
- **자동 NFT 추가**: 민팅 완료 후 자동으로 지갑에 NFT 추가 (`wallet_watchAsset`)
- **실시간 상태 표시**: 민팅 진행 상황을 실시간으로 표시

### 요구사항
- Node.js >= 18.17

### 설치
```bash
npm install
```

### 환경 변수 설정
`.env` 파일을 만들고 아래 예시를 참고하세요(`.env.example` 참고).

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

### 주요 API
- POST `/api/nft/mint` { to, tokenURI }
- POST `/api/nft/burn` { tokenId }
- GET  `/api/nft/address`
- GET  `/api/nft/:tokenId` - NFT 정보 조회
- POST `/api/nft/transfer` { from, to, tokenId } - NFT 전송

### 웹 인터페이스
- `GET /` - NFT 민팅 웹 페이지
- 자동 지갑 연결 및 NFT 추가 기능 포함

배포 후 발급된 `CONTRACT_ADDRESS`를 `.env`에 설정하여 API가 컨트랙트에 연결되도록 하세요.

avax fuji testnet faucet 주소
테스트넷 주소에 가스비가 부족할경우 여기서 가스비를 받을수있음
https://core.app/tools/testnet-faucet/

## 빠른 테스트 절차

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