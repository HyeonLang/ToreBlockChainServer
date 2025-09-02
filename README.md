## Hardhat + TypeScript + Express 템플릿

Avalanche Fuji/Mainnet 배포 가능한 ERC721(GameItem) 컨트랙트와 Express JSON API 서버 템플릿입니다.

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
contracts/
scripts/
src/
  controllers/
  routes/
  utils/
  middleware/
  app.ts
```

### 주요 API
- POST `/api/nft/mint` { to, tokenURI }
- POST `/api/nft/burn` { tokenId }
- GET  `/api/nft/address`

배포 후 발급된 `CONTRACT_ADDRESS`를 `.env`에 설정하여 API가 컨트랙트에 연결되도록 하세요.

avax fuji testnet faucet 주소
테스트넷 주소에 가스비가 부족할경우 여기서 가스비를 받을수있음
https://core.app/tools/testnet-faucet/

빠른 테스트 절차
1단계: 서버 실행
npm run dev

2단계: 서버가 실행되었는지 확인
브라우저에서 http://localhost:3000/health 주소로 접속하면 { "ok": true }가 나와야 합니다.

3단계: 컨트랙트 주소 확인
브라우저에서 http://localhost:3000/api/nft/address 접속하면 { "address": "0x..." } 형태로 주소가 나와야 합니다.

4단계: NFT 생성(민팅) - PowerShell 사용
PowerShell을 열고 아래 명령어를 실행하세요:
$body = @{
  to = "0x1234567890abcdef1234567890abcdef12345678"  # 여기에 실제 받을 주소 입력
  tokenURI = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"  # 예시 IPFS URI
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/nft/mint" -Method Post -ContentType "application/json" -Body $body

5단계: 생성된 tokenId 확인
민팅 응답으로 받은 txHash를 사용해서:
SnowTrace Fuji 접속
트랜잭션 해시 검색
"Transfer" 이벤트에서 tokenId 확인 (보통 1부터 시작)

6단계: NFT 삭제(소각) - PowerShell 사용
$body = @{ tokenId = 1}  | ConvertTo-Json  # 1 대신 실제 tokenId 입력

Invoke-RestMethod -Uri "http://localhost:3000/api/nft/burn" -Method Post -ContentType "application/json" -Body $body
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