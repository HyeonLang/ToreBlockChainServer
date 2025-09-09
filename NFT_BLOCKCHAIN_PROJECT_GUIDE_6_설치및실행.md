# NFT 블록체인 프로젝트 완전 가이드 - 6편: 설치 및 실행 가이드

## 📚 목차
1. [시스템 요구사항](#시스템-요구사항)
2. [개발 환경 설정](#개발-환경-설정)
3. [프로젝트 설치](#프로젝트-설치)
4. [환경 변수 설정](#환경-변수-설정)
5. [스마트 컨트랙트 배포](#스마트-컨트랙트-배포)
6. [서버 실행](#서버-실행)
7. [웹 인터페이스 사용](#웹-인터페이스-사용)
8. [문제 해결](#문제-해결)

---

## 💻 시스템 요구사항

### 필수 소프트웨어

#### 1. Node.js
- **버전**: 18.17 이상
- **다운로드**: https://nodejs.org/
- **확인 방법**:
```bash
node --version
npm --version
```

#### 2. Git
- **다운로드**: https://git-scm.com/
- **확인 방법**:
```bash
git --version
```

#### 3. MetaMask (브라우저 확장)
- **다운로드**: https://metamask.io/
- **지원 브라우저**: Chrome, Firefox, Edge, Brave

### 선택적 소프트웨어

#### 1. Visual Studio Code
- **다운로드**: https://code.visualstudio.com/
- **추천 확장**:
  - Solidity
  - TypeScript Importer
  - Prettier
  - ESLint

#### 2. Postman (API 테스트)
- **다운로드**: https://www.postman.com/

---

## 🛠 개발 환경 설정

### 1. Node.js 설치 확인

```bash
# Node.js 버전 확인
node --version
# 예상 출력: v18.17.0 이상

# npm 버전 확인
npm --version
# 예상 출력: 9.0.0 이상
```

### 2. Git 설정

```bash
# Git 사용자 정보 설정 (처음 사용 시)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Git 버전 확인
git --version
```

### 3. MetaMask 설치 및 설정

#### MetaMask 설치
1. 브라우저에서 https://metamask.io/ 접속
2. "Download" 버튼 클릭
3. 브라우저 확장 프로그램 설치
4. MetaMask 계정 생성 또는 기존 계정 가져오기

#### Avalanche 네트워크 추가
1. MetaMask에서 "네트워크" 드롭다운 클릭
2. "네트워크 추가" 선택
3. 다음 정보 입력:
   - **네트워크 이름**: Avalanche Fuji C-Chain
   - **새 RPC URL**: https://api.avax-test.network/ext/bc/C/rpc
   - **체인 ID**: 43113
   - **통화 기호**: AVAX
   - **블록 탐색기 URL**: https://testnet.snowtrace.io/

#### 테스트 AVAX 받기
1. https://core.app/tools/testnet-faucet/ 접속
2. MetaMask 주소 입력
3. "Request AVAX" 클릭
4. 몇 분 후 지갑에 테스트 AVAX 입금 확인

---

## 📦 프로젝트 설치

### 1. 프로젝트 클론

```bash
# 프로젝트 클론
git clone <repository-url>
cd ToreBlockChainServer

# 또는 직접 다운로드 후 압축 해제
```

### 2. 의존성 설치

```bash
# NPM 패키지 설치
npm install

# 설치 과정에서 다음과 같은 메시지가 표시됩니다:
# - 패키지 다운로드 진행률
# - 의존성 해결
# - 설치 완료 메시지
```

**설치되는 주요 패키지:**
- **Express.js**: 웹 서버 프레임워크
- **TypeScript**: 타입 안전성을 위한 JavaScript 확장
- **Ethers.js**: 블록체인 상호작용 라이브러리
- **Hardhat**: 스마트 컨트랙트 개발 도구
- **OpenZeppelin**: 검증된 스마트 컨트랙트 라이브러리

### 3. 설치 확인

```bash
# package.json 스크립트 확인
npm run

# 다음과 같은 스크립트들이 표시됩니다:
# - build: TypeScript 컴파일
# - dev: 개발 서버 실행
# - start: 프로덕션 서버 실행
# - compile: 스마트 컨트랙트 컴파일
# - deploy:fuji: Fuji 테스트넷 배포
```

---

## ⚙️ 환경 변수 설정

### 1. .env 파일 생성

프로젝트 루트 디렉토리에 `.env` 파일을 생성합니다:

```bash
# .env 파일 생성
touch .env
```

### 2. 환경 변수 설정

`.env` 파일에 다음 내용을 입력합니다:

```env
# 블록체인 설정
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
CONTRACT_ADDRESS=

# 서버 설정
PORT=3000
NODE_ENV=development

# API 보안 (선택사항)
API_KEY=your-secret-api-key-here
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=60

# JWT 설정 (선택사항)
JWT_ACCESS_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
```

### 3. 개인키 설정

#### MetaMask에서 개인키 가져오기
1. MetaMask에서 계정 메뉴 클릭
2. "계정 세부 정보" 선택
3. "개인키 내보내기" 클릭
4. 비밀번호 입력 후 개인키 복사
5. `.env` 파일의 `PRIVATE_KEY`에 붙여넣기

**⚠️ 보안 주의사항:**
- **절대 실제 돈이 있는 지갑의 개인키를 사용하지 마세요!**
- **테스트용 지갑만 사용하세요!**
- **개인키는 절대 공개하지 마세요!**

### 4. 환경 변수 확인

```bash
# .env 파일이 제대로 생성되었는지 확인
ls -la | grep .env

# .env 파일 내용 확인 (선택사항)
cat .env
```

---

## 🚀 스마트 컨트랙트 배포

### 1. 스마트 컨트랙트 컴파일

```bash
# 스마트 컨트랙트 컴파일
npm run compile

# 성공 시 다음과 같은 메시지가 표시됩니다:
# Compiling 1 file with 0.8.26
# Compilation finished successfully
```

**컴파일 결과:**
- `artifacts/contracts/GameItem.sol/GameItem.json` 파일 생성
- ABI와 바이트코드가 포함된 JSON 파일

### 2. Fuji 테스트넷에 배포

```bash
# Fuji 테스트넷에 배포
npm run deploy:fuji

# 배포 과정에서 다음과 같은 메시지가 표시됩니다:
# Deploying contracts with the account: 0x...
# GameItem deployed to: 0x...
# Contract name: GameItem
# Contract symbol: GMI
# Contract owner: 0x...
```

### 3. 컨트랙트 주소 설정

배포가 완료되면 출력된 컨트랙트 주소를 `.env` 파일에 추가합니다:

```env
# .env 파일에 컨트랙트 주소 추가
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
```

### 4. 배포 확인

```bash
# Snowtrace에서 컨트랙트 확인
# https://testnet.snowtrace.io/address/[CONTRACT_ADDRESS]

# 또는 Hardhat 콘솔로 확인
npx hardhat console --network fuji
```

---

## 🖥 서버 실행

### 1. 개발 모드로 실행

```bash
# 개발 서버 실행 (핫 리로드)
npm run dev

# 성공 시 다음과 같은 메시지가 표시됩니다:
# Server listening on http://localhost:3000
# [NFTMinter] Initializing NFT Minter...
# [Contract] Using RPC URL: https://api.avax-test.network/ext/bc/C/rpc
# [Contract] Wallet address: 0x1234...5678
# [Contract] Contract address: 0x1234567890123456789012345678901234567890
# [Contract] Connected to contract: GameItem
```

**개발 모드 특징:**
- **핫 리로드**: 코드 변경 시 자동 재시작
- **상세 로그**: 디버깅을 위한 상세한 로그 출력
- **에러 표시**: 실시간 에러 메시지 표시

### 2. 프로덕션 모드로 실행

```bash
# TypeScript 컴파일
npm run build

# 프로덕션 서버 실행
npm start
```

**프로덕션 모드 특징:**
- **최적화된 코드**: 컴파일된 JavaScript 실행
- **빠른 시작**: 컴파일 시간 없이 즉시 실행
- **안정성**: 프로덕션 환경에 최적화

### 3. 서버 상태 확인

```bash
# 헬스 체크
curl http://localhost:3000/health

# 예상 응답:
# {"ok": true}

# 컨트랙트 주소 확인
curl http://localhost:3000/api/nft/address

# 예상 응답:
# {"address": "0x1234567890123456789012345678901234567890"}
```

---

## 🌐 웹 인터페이스 사용

### 1. 웹 페이지 접속

브라우저에서 `http://localhost:3000` 접속

### 2. MetaMask 연결

1. "메타마스크 지갑 연결" 버튼 클릭
2. MetaMask 팝업에서 계정 선택
3. "연결" 버튼 클릭
4. 연결된 지갑 주소가 자동으로 입력됨

### 3. NFT 생성

1. **생성** 탭 선택
2. 받는 주소 확인 (연결된 지갑 주소가 자동 입력됨)
3. 토큰 URI 입력 (예: `https://ipfs.io/ipfs/QmYourMetadataHash`)
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

#### 개별 조회
1. **개별조회** 탭 선택
2. 조회할 토큰 ID 입력
3. "NFT 정보 조회" 버튼 클릭

#### 지갑 조회
1. **지갑조회** 탭 선택
2. 조회할 지갑 주소 입력
3. "지갑 NFT 조회" 버튼 클릭

### 7. 거래 이력 조회

#### NFT 거래 이력
1. **NFT거래이력** 탭 선택
2. 조회할 토큰 ID 입력
3. "NFT 거래 이력 조회" 버튼 클릭

#### 지갑 거래 이력
1. **지갑거래이력** 탭 선택
2. 조회할 지갑 주소 입력
3. "지갑 거래 이력 조회" 버튼 클릭

---

## 🔧 문제 해결

### 1. 일반적인 문제들

#### Node.js 버전 문제
```bash
# Node.js 버전이 18.17 미만인 경우
# Node.js 업데이트 필요

# nvm 사용 시
nvm install 18.17.0
nvm use 18.17.0

# 직접 설치 시
# https://nodejs.org/에서 최신 LTS 버전 다운로드
```

#### npm 설치 실패
```bash
# npm 캐시 정리
npm cache clean --force

# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

#### MetaMask 연결 실패
```bash
# 브라우저 새로고침
# MetaMask 확장 프로그램 재시작
# 다른 브라우저에서 시도
# MetaMask 네트워크 설정 확인
```

### 2. 서버 관련 문제

#### 포트 충돌
```bash
# 포트 3000이 사용 중인 경우
# .env 파일에서 다른 포트 설정
PORT=3001

# 또는 사용 중인 프로세스 종료
lsof -ti:3000 | xargs kill -9
```

#### 환경 변수 오류
```bash
# .env 파일 존재 확인
ls -la | grep .env

# .env 파일 권한 확인
chmod 600 .env

# 환경 변수 로드 확인
node -e "require('dotenv').config(); console.log(process.env.PRIVATE_KEY ? 'OK' : 'Missing PRIVATE_KEY');"
```

### 3. 블록체인 관련 문제

#### 가스비 부족
```bash
# 테스트 AVAX 받기
# https://core.app/tools/testnet-faucet/

# 지갑 잔액 확인
# MetaMask에서 AVAX 잔액 확인
```

#### 네트워크 연결 실패
```bash
# RPC URL 확인
# .env 파일의 RPC_URL이 올바른지 확인

# 네트워크 상태 확인
curl https://api.avax-test.network/ext/bc/C/rpc -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

#### 컨트랙트 주소 오류
```bash
# 컨트랙트 주소 형식 확인
# 0x로 시작하는 42자리 주소인지 확인

# 컨트랙트 존재 확인
# Snowtrace에서 주소 검색
```

### 4. 디버깅 방법

#### 서버 로그 확인
```bash
# 개발 모드에서 상세 로그 확인
npm run dev

# 로그 파일로 저장
npm run dev > server.log 2>&1
```

#### 브라우저 개발자 도구
```bash
# F12 키로 개발자 도구 열기
# Console 탭에서 JavaScript 에러 확인
# Network 탭에서 API 요청/응답 확인
```

#### MetaMask 로그 확인
```bash
# MetaMask 설정 > 고급 > 로그 수준을 "debug"로 설정
# 브라우저 콘솔에서 MetaMask 관련 로그 확인
```

### 5. 성능 최적화

#### 서버 성능
```bash
# PM2 사용 (프로덕션 환경)
npm install -g pm2
pm2 start dist/app.js --name "nft-server"

# 메모리 사용량 모니터링
pm2 monit
```

#### 블록체인 성능
```bash
# 가스 가격 조정
# .env 파일에 가스 설정 추가
GAS_PRICE=25000000000  # 25 gwei
GAS_LIMIT=2000000      # 2M gas
```

---

## 📋 다음 단계

이제 프로젝트를 성공적으로 설치하고 실행할 수 있게 되었습니다. 다음 가이드에서는 HTTP 통신과 API 사용법에 대해 자세히 알아보겠습니다.

**다음 가이드**: [HTTP 통신 및 API 사용법](./NFT_BLOCKCHAIN_PROJECT_GUIDE_7_HTTP통신및API.md)

---

## 💡 핵심 정리

1. **Node.js 18.17 이상과 MetaMask가 필요합니다.**
2. **npm install로 의존성을 설치하고 .env 파일을 설정합니다.**
3. **스마트 컨트랙트를 컴파일하고 Fuji 테스트넷에 배포합니다.**
4. **npm run dev로 개발 서버를 실행하고 웹 인터페이스를 사용합니다.**
5. **문제 발생 시 로그를 확인하고 단계별로 디버깅합니다.**
