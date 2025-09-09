# NFT 블록체인 프로젝트 완전 가이드 - 10편: 문제 해결 및 FAQ

## 📚 목차
1. [일반적인 문제들](#일반적인-문제들)
2. [설치 및 환경 문제](#설치-및-환경-문제)
3. [서버 관련 문제](#서버-관련-문제)
4. [블록체인 관련 문제](#블록체인-관련-문제)
5. [MetaMask 관련 문제](#metamask-관련-문제)
6. [API 관련 문제](#api-관련-문제)
7. [성능 최적화](#성능-최적화)
8. [FAQ](#faq)

---

## 🔧 일반적인 문제들

### 1. Node.js 버전 문제

#### 문제: Node.js 버전이 18.17 미만
```bash
# 에러 메시지
Error: Node.js version 18.17.0 or higher is required
```

#### 해결 방법:
```bash
# nvm 사용 시
nvm install 18.17.0
nvm use 18.17.0

# 직접 설치 시
# https://nodejs.org/에서 최신 LTS 버전 다운로드
```

### 2. npm 설치 실패

#### 문제: 패키지 설치 중 오류
```bash
# 에러 메시지
npm ERR! code ENOENT
npm ERR! syscall open
npm ERR! path /path/to/package.json
```

#### 해결 방법:
```bash
# npm 캐시 정리
npm cache clean --force

# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install

# 권한 문제 시
sudo npm install
```

### 3. 포트 충돌

#### 문제: 포트 3000이 사용 중
```bash
# 에러 메시지
Error: listen EADDRINUSE: address already in use :::3000
```

#### 해결 방법:
```bash
# 사용 중인 프로세스 확인
lsof -ti:3000

# 프로세스 종료
lsof -ti:3000 | xargs kill -9

# 또는 다른 포트 사용
PORT=3001 npm run dev
```

---

## 💻 설치 및 환경 문제

### 1. .env 파일 문제

#### 문제: 환경 변수가 로드되지 않음
```bash
# 에러 메시지
Error: PRIVATE_KEY is required
```

#### 해결 방법:
```bash
# .env 파일 존재 확인
ls -la | grep .env

# .env 파일 권한 확인
chmod 600 .env

# 환경 변수 로드 확인
node -e "require('dotenv').config(); console.log(process.env.PRIVATE_KEY ? 'OK' : 'Missing PRIVATE_KEY');"
```

### 2. TypeScript 컴파일 오류

#### 문제: TypeScript 컴파일 실패
```bash
# 에러 메시지
error TS2307: Cannot find module 'express'
```

#### 해결 방법:
```bash
# 의존성 재설치
npm install

# TypeScript 재설치
npm install -D typescript

# 컴파일 재시도
npm run build
```

### 3. Git 관련 문제

#### 문제: Git 저장소가 아닌 경우
```bash
# 에러 메시지
fatal: not a git repository
```

#### 해결 방법:
```bash
# Git 저장소 초기화
git init

# 원격 저장소 추가 (선택사항)
git remote add origin <repository-url>
```

---

## 🖥 서버 관련 문제

### 1. 서버 시작 실패

#### 문제: 서버가 시작되지 않음
```bash
# 에러 메시지
Error: Cannot find module './routes/nft'
```

#### 해결 방법:
```bash
# TypeScript 컴파일
npm run build

# 개발 모드로 실행
npm run dev

# 의존성 확인
npm list
```

### 2. API 응답 오류

#### 문제: API 요청 시 500 에러
```bash
# 에러 메시지
{"error": "Internal server error"}
```

#### 해결 방법:
```bash
# 서버 로그 확인
npm run dev

# 환경 변수 확인
echo $PRIVATE_KEY
echo $CONTRACT_ADDRESS

# 데이터베이스 연결 확인 (해당하는 경우)
```

### 3. CORS 오류

#### 문제: CORS 정책 위반
```bash
# 에러 메시지
Access to fetch at 'http://localhost:3000' from origin 'http://localhost:3001' has been blocked by CORS policy
```

#### 해결 방법:
```typescript
// src/app.ts에 CORS 설정 추가
import cors from 'cors';

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
```

---

## ⛓ 블록체인 관련 문제

### 1. 가스비 부족

#### 문제: 가스비 부족으로 트랜잭션 실패
```bash
# 에러 메시지
Error: insufficient funds for gas
```

#### 해결 방법:
```bash
# 테스트 AVAX 받기
# https://core.app/tools/testnet-faucet/

# 지갑 잔액 확인
# MetaMask에서 AVAX 잔액 확인

# 가스 가격 조정
# .env 파일에 가스 설정 추가
GAS_PRICE=25000000000  # 25 gwei
```

### 2. 네트워크 연결 실패

#### 문제: RPC 연결 실패
```bash
# 에러 메시지
Error: could not detect network
```

#### 해결 방법:
```bash
# RPC URL 확인
curl https://api.avax-test.network/ext/bc/C/rpc -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# .env 파일의 RPC_URL 확인
echo $RPC_URL

# 다른 RPC URL 시도
RPC_URL=https://rpc.ankr.com/avalanche_fuji npm run dev
```

### 3. 컨트랙트 주소 오류

#### 문제: 컨트랙트 주소가 잘못됨
```bash
# 에러 메시지
Error: contract not found
```

#### 해결 방법:
```bash
# 컨트랙트 주소 형식 확인
# 0x로 시작하는 42자리 주소인지 확인

# Snowtrace에서 주소 검색
# https://testnet.snowtrace.io/address/[CONTRACT_ADDRESS]

# 컨트랙트 재배포
npm run deploy:fuji
```

### 4. 스마트 컨트랙트 컴파일 오류

#### 문제: Solidity 컴파일 실패
```bash
# 에러 메시지
Error: Compilation failed
```

#### 해결 방법:
```bash
# Solidity 버전 확인
# contracts/GameItem.sol의 pragma 버전 확인

# OpenZeppelin 버전 확인
npm list @openzeppelin/contracts

# 컴파일 재시도
npx hardhat clean
npm run compile
```

---

## 🦊 MetaMask 관련 문제

### 1. MetaMask 연결 실패

#### 문제: 지갑 연결이 안됨
```bash
# 에러 메시지
MetaMask is not installed
```

#### 해결 방법:
```bash
# MetaMask 설치 확인
# 브라우저 확장 프로그램에서 MetaMask 확인

# 브라우저 새로고침
# F5 또는 Ctrl+R

# MetaMask 확장 프로그램 재시작
# 브라우저에서 MetaMask 확장 프로그램 비활성화 후 재활성화
```

### 2. 네트워크 설정 문제

#### 문제: 잘못된 네트워크
```bash
# 에러 메시지
Please switch to Avalanche Fuji network
```

#### 해결 방법:
```bash
# MetaMask에서 네트워크 변경
# 1. MetaMask 클릭
# 2. 네트워크 드롭다운 클릭
# 3. "Avalanche Fuji C-Chain" 선택

# 네트워크 수동 추가
# 네트워크 이름: Avalanche Fuji C-Chain
# RPC URL: https://api.avax-test.network/ext/bc/C/rpc
# 체인 ID: 43113
# 통화 기호: AVAX
```

### 3. 트랜잭션 승인 실패

#### 문제: 트랜잭션이 승인되지 않음
```bash
# 에러 메시지
User rejected the request
```

#### 해결 방법:
```bash
# MetaMask에서 트랜잭션 확인
# 1. MetaMask 팝업에서 "승인" 클릭
# 2. 가스비 확인 후 "확인" 클릭

# 가스비 조정
# MetaMask에서 "가스비 편집" 클릭하여 가스비 조정
```

---

## 🌐 API 관련 문제

### 1. 인증 실패

#### 문제: API 키 인증 실패
```bash
# 에러 메시지
{"error": "Invalid API key", "code": "INVALID_API_KEY"}
```

#### 해결 방법:
```bash
# API 키 확인
echo $API_KEY

# .env 파일의 API_KEY 확인
cat .env | grep API_KEY

# 올바른 API 키로 요청
curl -H "x-api-key: your-correct-api-key" http://localhost:3000/api/nft/address
```

### 2. JWT 토큰 만료

#### 문제: JWT 토큰 만료
```bash
# 에러 메시지
{"error": "Token expired", "code": "TOKEN_EXPIRED"}
```

#### 해결 방법:
```bash
# 토큰 갱신
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your-refresh-token"}'

# 새로 로그인
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'
```

### 3. 요청 제한 초과

#### 문제: 레이트 리미팅
```bash
# 에러 메시지
{"error": "Too many requests", "code": "RATE_LIMIT_EXCEEDED"}
```

#### 해결 방법:
```bash
# 잠시 대기 후 재시도
sleep 60

# 레이트 리미팅 설정 확인
echo $RATE_LIMIT_WINDOW_MS
echo $RATE_LIMIT_MAX

# 다른 API 키 사용 (해당하는 경우)
```

---

## ⚡ 성능 최적화

### 1. 서버 성능 최적화

#### PM2 사용
```bash
# PM2 설치
npm install -g pm2

# PM2로 서버 실행
pm2 start dist/app.js --name "nft-server"

# PM2 상태 확인
pm2 status

# PM2 로그 확인
pm2 logs nft-server
```

#### 메모리 사용량 모니터링
```bash
# 메모리 사용량 확인
pm2 monit

# 메모리 사용량 제한
pm2 start dist/app.js --name "nft-server" --max-memory-restart 500M
```

### 2. 블록체인 성능 최적화

#### 가스 가격 조정
```bash
# .env 파일에 가스 설정 추가
GAS_PRICE=25000000000  # 25 gwei
GAS_LIMIT=2000000      # 2M gas
```

#### RPC URL 최적화
```bash
# 빠른 RPC URL 사용
RPC_URL=https://rpc.ankr.com/avalanche_fuji

# 또는
RPC_URL=https://avalanche-fuji.infura.io/v3/YOUR_PROJECT_ID
```

### 3. 프론트엔드 성능 최적화

#### 이미지 최적화
```html
<!-- 이미지 지연 로딩 -->
<img src="image.jpg" loading="lazy" alt="NFT Image">

<!-- WebP 형식 사용 -->
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="NFT Image">
</picture>
```

#### JavaScript 최적화
```javascript
// 디바운싱으로 API 호출 최적화
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 사용 예시
const debouncedSearch = debounce(searchNFTs, 300);
```

---

## ❓ FAQ

### Q1: 이 프로젝트는 어떤 블록체인을 사용하나요?
**A:** Avalanche Fuji 테스트넷을 사용합니다. 이는 이더리움과 호환되는 네트워크로, 빠르고 저렴한 거래 수수료를 제공합니다.

### Q2: 실제 돈이 필요한가요?
**A:** 아니요, 테스트넷을 사용하므로 실제 돈이 필요하지 않습니다. 테스트 AVAX는 무료로 받을 수 있습니다.

### Q3: MetaMask가 필수인가요?
**A:** 네, MetaMask는 필수입니다. 웹 브라우저에서 블록체인과 상호작용하기 위해 필요합니다.

### Q4: NFT를 실제로 판매할 수 있나요?
**A:** 이 프로젝트는 테스트넷용이므로 실제 판매는 불가능합니다. 실제 판매를 원한다면 메인넷에 배포해야 합니다.

### Q5: 코드를 수정할 수 있나요?
**A:** 네, 모든 코드는 오픈소스이므로 자유롭게 수정할 수 있습니다.

### Q6: 다른 블록체인에 배포할 수 있나요?
**A:** 네, 이더리움 호환 네트워크라면 배포 가능합니다. (Polygon, BSC, Arbitrum 등)

### Q7: 데이터베이스가 필요한가요?
**A:** 현재는 메모리 기반으로 작동하지만, 실제 서비스에서는 데이터베이스가 필요합니다.

### Q8: 보안은 어떻게 관리하나요?
**A:** JWT 토큰, API 키, bcrypt 해싱, 레이트 리미팅 등 다양한 보안 기법을 사용합니다.

### Q9: 확장성은 어떻게 고려했나요?
**A:** 모듈화된 구조로 설계되어 있어 기능 추가나 수정이 용이합니다.

### Q10: 문제가 발생하면 어떻게 해야 하나요?
**A:** 로그를 확인하고, 이 가이드의 문제 해결 섹션을 참고하세요. 여전히 해결되지 않으면 이슈를 생성해주세요.

---

## 📋 마무리

이제 NFT 블록체인 프로젝트의 모든 부분을 이해하고 문제를 해결할 수 있게 되었습니다. 

**주요 학습 내용:**
1. **블록체인과 NFT의 기본 개념**
2. **프로젝트 구조와 각 파일의 역할**
3. **스마트 컨트랙트의 동작 원리**
4. **백엔드 서버와 API 구조**
5. **프론트엔드 웹 인터페이스**
6. **설치 및 실행 방법**
7. **HTTP 통신과 API 사용법**
8. **보안 및 인증 시스템**
9. **실행 흐름과 동작 원리**
10. **문제 해결 방법**

**다음 단계:**
- 프로젝트를 실제로 실행해보세요
- 코드를 수정하여 새로운 기능을 추가해보세요
- 다른 블록체인 네트워크에 배포해보세요
- 실제 서비스로 발전시켜보세요

**도움이 필요하시면:**
- 이 가이드를 다시 참고하세요
- 로그를 확인하여 문제를 파악하세요
- 커뮤니티에 질문을 올려보세요

**성공적인 블록체인 개발을 응원합니다! 🚀**
