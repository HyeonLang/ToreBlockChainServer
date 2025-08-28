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
