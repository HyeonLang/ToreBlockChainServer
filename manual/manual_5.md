# 📖 Manual 5: 설치 및 실행 가이드

## 🚀 설치 및 실행 개요

이 가이드는 ToreBlockChainServer 프로젝트를 처음부터 설치하고 실행하는 방법을 단계별로 설명합니다. 모든 필요한 의존성부터 서버 실행까지 완전한 과정을 다룹니다.

## 📋 시스템 요구사항

### 필수 요구사항
- **Node.js**: 18.17 이상
- **npm**: 8.0 이상
- **Git**: 최신 버전
- **메모리**: 최소 4GB RAM
- **디스크**: 최소 2GB 여유 공간

### 권장 요구사항
- **Node.js**: 20.x LTS
- **npm**: 10.x
- **메모리**: 8GB RAM 이상
- **디스크**: 5GB 여유 공간

### 브라우저 요구사항
- **Chrome**: 90 이상
- **Firefox**: 88 이상
- **Safari**: 14 이상
- **Edge**: 90 이상
- **MetaMask**: 최신 버전 확장 프로그램

## 🔧 설치 과정

### 1단계: 프로젝트 클론

```bash
# GitHub에서 프로젝트 클론
git clone https://github.com/your-username/ToreBlockChainServer.git

# 프로젝트 디렉토리로 이동
cd ToreBlockChainServer
```

### 2단계: 의존성 설치

```bash
# 모든 의존성 설치
npm install

# 설치 확인
npm list --depth=0
```

### 3단계: 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성하고 다음 내용을 추가합니다:

```env
# 블록체인 연결 설정
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# 개인키 (실제 사용 시 보안에 주의)
PRIVATE_KEY=your-private-key-here

# 컨트랙트 주소 (배포 후 설정)
CONTRACT_ADDRESS=your-nft-contract-address
TORE_EXCHANGE_ADDRESS=your-exchange-contract-address
MARKET_CONTRACT_ADDRESS=your-market-contract-address

# API 보안
API_KEY=your-secret-api-key

# 서버 설정
PORT=3000
NODE_ENV=development
```

### 4단계: 스마트 컨트랙트 컴파일

```bash
# 스마트 컨트랙트 컴파일
npm run compile

# 또는 Hardhat 직접 사용
npx hardhat compile
```

### 5단계: 서버 실행

```bash
# 개발 서버 실행
npm run dev

# 또는 프로덕션 빌드 후 실행
npm run build
npm start
```

## 🌐 서버 접속

### 메인 페이지
- **URL**: `http://localhost:3000`
- **기능**: NFT 생성, 전송, 삭제, 조회

### 거래소 페이지
- **URL**: `http://localhost:3000/exchange.html`
- **기능**: NFT 거래, 마켓 시스템

### API 엔드포인트
- **기본 URL**: `http://localhost:3000/api`
- **헬스 체크**: `http://localhost:3000/health`

## 🔐 MetaMask 설정

### 1. MetaMask 설치
1. [MetaMask 공식 사이트](https://metamask.io/)에서 확장 프로그램 설치
2. 브라우저에 MetaMask 추가
3. 지갑 생성 또는 기존 지갑 가져오기

### 2. Avalanche Fuji 테스트넷 추가
1. MetaMask에서 네트워크 선택
2. "네트워크 추가" 클릭
3. 다음 정보 입력:
   - **네트워크 이름**: Avalanche Fuji C-Chain
   - **RPC URL**: `https://api.avax-test.network/ext/bc/C/rpc`
   - **체인 ID**: `43113`
   - **통화 기호**: `AVAX`
   - **블록 탐색기**: `https://testnet.snowtrace.io/`

### 3. 테스트 토큰 받기
1. [Avalanche Faucet](https://faucet.avax.network/) 방문
2. 지갑 주소 입력
3. 테스트 AVAX 받기

## 🧪 테스트 실행

### 1. 서버 상태 확인

```bash
# 헬스 체크
curl http://localhost:3000/health

# 예상 응답
{"ok": true}
```

### 2. API 테스트

```bash
# NFT 정보 조회 테스트
curl -X GET "http://localhost:3000/api/nft/info/1" \
  -H "X-API-Key: your-api-key"

# TORE 토큰 정보 조회 테스트
curl -X GET "http://localhost:3000/api/tore/info" \
  -H "X-API-Key: your-api-key"

# 마켓 통계 조회 테스트
curl -X GET "http://localhost:3000/api/market/stats" \
  -H "X-API-Key: your-api-key"
```

### 3. 프론트엔드 테스트
1. 브라우저에서 `http://localhost:3000` 접속
2. MetaMask 연결
3. 각 기능 테스트:
   - NFT 생성
   - NFT 전송
   - NFT 조회
   - 거래 이력 확인

## 🔧 개발 환경 설정

### 1. 코드 에디터 설정

#### VS Code 권장 확장 프로그램
- **TypeScript**: TypeScript 지원
- **Prettier**: 코드 포맷팅
- **ESLint**: 코드 린팅
- **Solidity**: Solidity 지원
- **Auto Rename Tag**: HTML 태그 자동 이름 변경

#### VS Code 설정 (`.vscode/settings.json`)
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### 2. Git 설정

```bash
# Git 사용자 정보 설정
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Git 훅 설정 (선택사항)
npm install --save-dev husky lint-staged
```

### 3. 환경별 설정

#### 개발 환경
```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
```

#### 프로덕션 환경
```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

## 🚀 배포 가이드

### 1. 스마트 컨트랙트 배포

```bash
# Avalanche Fuji 테스트넷에 배포
npm run deploy:fuji

# Avalanche 메인넷에 배포
npm run deploy:avalanche

# TORE 토큰 배포
npm run deploy:tore:fuji

# 거래소 컨트랙트 배포
npm run deploy:exchange:fuji
```

### 2. 환경 변수 업데이트

배포 후 생성된 컨트랙트 주소를 `.env` 파일에 업데이트:

```env
# 배포된 컨트랙트 주소
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
TORE_EXCHANGE_ADDRESS=0x2345678901234567890123456789012345678901
MARKET_CONTRACT_ADDRESS=0x3456789012345678901234567890123456789012
```

### 3. 서버 배포

#### Docker 사용 (권장)
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Docker 이미지 빌드
docker build -t tore-blockchain-server .

# Docker 컨테이너 실행
docker run -p 3000:3000 --env-file .env tore-blockchain-server
```

#### PM2 사용
```bash
# PM2 설치
npm install -g pm2

# PM2로 서버 실행
pm2 start dist/app.js --name "tore-server"

# PM2 상태 확인
pm2 status
```

## 🔍 문제 해결

### 1. 설치 문제

#### Node.js 버전 문제
```bash
# Node.js 버전 확인
node --version

# nvm으로 Node.js 버전 관리
nvm install 18.17.0
nvm use 18.17.0
```

#### 의존성 설치 실패
```bash
# 캐시 정리 후 재설치
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 2. 컴파일 문제

#### 스마트 컨트랙트 컴파일 실패
```bash
# Hardhat 캐시 정리
npx hardhat clean

# 재컴파일
npx hardhat compile
```

#### TypeScript 컴파일 오류
```bash
# TypeScript 타입 체크
npm run typecheck

# 린트 검사
npm run lint
```

### 3. 실행 문제

#### 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인
netstat -ano | findstr :3000

# 프로세스 종료
taskkill /PID [프로세스ID] /F
```

#### 서버 시작 실패
```bash
# 로그 확인
npm run dev

# 환경 변수 확인
echo $NODE_ENV
echo $PORT
```

### 4. 프론트엔드 문제

#### MetaMask 연결 실패
- MetaMask 확장 프로그램이 설치되어 있는지 확인
- 브라우저에서 MetaMask가 활성화되어 있는지 확인
- 팝업 차단 설정 확인

#### API 호출 실패
- 서버가 실행 중인지 확인
- API 키가 올바른지 확인
- 네트워크 연결 상태 확인

## 📊 성능 최적화

### 1. 서버 최적화

#### 메모리 사용량 최적화
```javascript
// app.ts에서 메모리 사용량 모니터링
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
```

#### 응답 시간 최적화
```javascript
// 압축 미들웨어 추가
import compression from 'compression';
app.use(compression());
```

### 2. 프론트엔드 최적화

#### 이미지 최적화
- WebP 형식 사용
- 적절한 이미지 크기 설정
- 지연 로딩 구현

#### JavaScript 최적화
- 코드 분할 (Code Splitting)
- 불필요한 라이브러리 제거
- 번들 크기 최적화

## 🔒 보안 설정

### 1. API 키 보안

```env
# 강력한 API 키 생성
API_KEY=your-very-secure-api-key-here

# 환경별 다른 API 키 사용
API_KEY_DEV=dev-api-key
API_KEY_PROD=prod-api-key
```

### 2. CORS 설정

```javascript
// app.ts에서 CORS 설정
import cors from 'cors';

app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
}));
```

### 3. Rate Limiting

```javascript
// rateLimit.ts에서 요청 제한 설정
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100 // 최대 100 요청
});

app.use('/api/', limiter);
```

## 📈 모니터링

### 1. 로그 설정

```javascript
// winston 로거 설정
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 2. 헬스 체크

```javascript
// app.ts에서 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

## 🎯 다음 단계

설치 및 실행을 완료했으니, 다음 단계를 진행하세요:

1. **프로젝트 탐색**: 각 매뉴얼을 읽어보며 프로젝트 구조 이해
2. **기능 테스트**: 모든 기능을 테스트해보며 동작 확인
3. **개발 시작**: 새로운 기능 추가 또는 기존 기능 수정
4. **배포**: 프로덕션 환경에 배포

## 📞 지원

문제가 발생하거나 질문이 있으시면:

1. **GitHub Issues**: 프로젝트 이슈 페이지에서 질문
2. **문서 확인**: 각 매뉴얼에서 관련 정보 찾기
3. **로그 확인**: 서버 로그에서 오류 메시지 확인

---

**📝 참고사항**: 이 가이드는 프로젝트의 최신 상태를 반영합니다. 새로운 기능이 추가되면 가이드도 함께 업데이트됩니다.

**🚀 성공적인 설치를 위해**: 각 단계를 차근차근 따라하시고, 문제가 발생하면 해당 섹션의 문제 해결 부분을 참고하세요.
