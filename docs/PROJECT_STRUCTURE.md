# 📁 ToreBlockChainServer 프로젝트 구조

## 🎯 개요
이 문서는 ToreBlockChainServer 프로젝트의 폴더 구조와 각 파일의 역할을 설명합니다.

## 📂 폴더 구조

```
ToreBlockChainServer/
├── 📁 contracts/                 # 스마트 컨트랙트 소스 코드
│   ├── GameItem.sol             # ERC721 NFT 컨트랙트
│   ├── ToreToken.sol             # ERC20 TORE 토큰 컨트랙트
│   └── ToreExchange.sol          # NFT-TORE 거래소 컨트랙트
│
├── 📁 scripts/                   # 배포 및 유틸리티 스크립트
│   ├── deploy.ts                 # NFT 컨트랙트 배포 스크립트
│   ├── deployToreToken.ts        # TORE 토큰 배포 스크립트
│   └── deployToreExchange.ts    # 거래소 배포 스크립트
│
├── 📁 src/                       # 백엔드 서버 소스 코드
│   ├── 📁 controllers/           # API 컨트롤러
│   │   ├── authController.ts     # JWT 인증 컨트롤러
│   │   ├── nftController.ts      # NFT 관리 컨트롤러
│   │   ├── toreTokenController.ts # TORE 토큰 컨트롤러
│   │   └── exchangeController.ts  # 거래소 컨트롤러
│   │
│   ├── 📁 middleware/            # Express 미들웨어
│   │   ├── auth.ts               # API 키 인증 미들웨어
│   │   ├── jwtAuth.ts            # JWT 인증 미들웨어
│   │   ├── rateLimit.ts          # 레이트 리미팅 미들웨어
│   │   └── errorHandler.ts       # 에러 처리 미들웨어
│   │
│   ├── 📁 routes/                # API 라우터
│   │   ├── auth.ts               # 인증 API 라우터
│   │   ├── nft.ts                # NFT API 라우터
│   │   ├── toreToken.ts          # TORE 토큰 API 라우터
│   │   ├── exchange.ts           # 거래소 API 라우터
│   │   └── v1.ts                 # v1 API 라우터
│   │
│   ├── 📁 utils/                 # 유틸리티 함수
│   │   ├── contract.ts           # 컨트랙트 연결 유틸리티
│   │   ├── jwt.ts                # JWT 토큰 유틸리티
│   │   └── toreToken.ts          # TORE 토큰 유틸리티
│   │
│   ├── 📁 v1/                    # v1 API 컨트롤러
│   │   └── controllers.ts
│   │
│   └── app.ts                    # 메인 서버 애플리케이션
│
├── 📁 public/                    # 프론트엔드 웹 파일
│   ├── index.html                # 메인 웹 페이지
│   └── 📁 js/                    # JavaScript 파일
│       ├── nft.js                # NFT 관련 JavaScript
│       └── toreToken.js          # TORE 토큰 관련 JavaScript
│
├── 📁 docs/                      # 프로젝트 문서
│   └── 📁 guide/                 # 가이드 문서들
│       ├── EXECUTION_FLOW.md
│       ├── FRONTEND_GUIDE.md
│       └── NFT_BLOCKCHAIN_PROJECT_GUIDE_*.md
│
├── 📁 tests/                      # 테스트 파일
│   ├── test-jwt.js               # JWT 테스트
│   └── test.md                   # 테스트 문서
│
├── 📁 artifacts/                 # Hardhat 컴파일 결과물
├── 📁 cache/                     # Hardhat 캐시
├── 📁 node_modules/              # npm 의존성 패키지
│
├── 📄 hardhat.config.cjs         # Hardhat 설정 파일
├── 📄 package.json               # npm 패키지 설정
├── 📄 tsconfig.json              # TypeScript 설정
├── 📄 .gitignore                 # Git 무시 파일 목록
├── 📄 PROJECT_STRUCTURE.md       # 이 파일 (프로젝트 구조 설명)
├── 📄 PROJECT_OVERVIEW.txt       # 프로젝트 개요
└── 📄 README.md                  # 프로젝트 메인 문서
```

## 🔍 각 폴더의 역할

### 📁 contracts/
- **목적**: Solidity 스마트 컨트랙트 소스 코드
- **주요 파일**:
  - `GameItem.sol`: ERC721 표준 NFT 컨트랙트
  - `ToreToken.sol`: ERC20 표준 TORE 토큰 컨트랙트
  - `ToreExchange.sol`: NFT와 TORE 토큰 간 거래소 컨트랙트

### 📁 scripts/
- **목적**: 배포 및 유틸리티 스크립트
- **주요 파일**:
  - `deploy.ts`: NFT 컨트랙트 배포
  - `deployToreToken.ts`: TORE 토큰 배포
  - `deployToreExchange.ts`: 거래소 배포

### 📁 src/
- **목적**: 백엔드 Express.js 서버 소스 코드
- **구조**:
  - `controllers/`: API 요청 처리 로직
  - `middleware/`: Express 미들웨어 (인증, 에러 처리 등)
  - `routes/`: API 엔드포인트 정의
  - `utils/`: 공통 유틸리티 함수
  - `app.ts`: 메인 서버 애플리케이션

### 📁 public/
- **목적**: 프론트엔드 웹 인터페이스 파일
- **주요 파일**:
  - `index.html`: 메인 웹 페이지
  - `js/nft.js`: NFT 관리 JavaScript
  - `js/toreToken.js`: TORE 토큰 관리 JavaScript

### 📁 docs/
- **목적**: 프로젝트 문서 및 가이드
- **구조**:
  - `guide/`: 상세한 사용 가이드 문서들

### 📁 tests/
- **목적**: 테스트 파일 및 테스트 관련 문서

### 📁 artifacts/ & 📁 cache/
- **목적**: Hardhat 빌드 결과물 및 캐시 (자동 생성)

## 🚀 개발 워크플로우

### 1. 스마트 컨트랙트 개발
```bash
# 컨트랙트 수정 후 컴파일
npm run compile

# 테스트넷 배포
npm run deploy:fuji
```

### 2. 백엔드 서버 개발
```bash
# 개발 모드 실행 (핫 리로드)
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

### 3. 프론트엔드 개발
- `public/` 폴더의 HTML, CSS, JS 파일 수정
- 서버 실행 후 `http://localhost:3000`에서 확인

## 📋 파일 찾기 가이드

### 🎯 특정 기능을 찾고 싶다면:

- **NFT 관련**: `contracts/GameItem.sol`, `src/controllers/nftController.ts`, `public/js/nft.js`
- **TORE 토큰 관련**: `contracts/ToreToken.sol`, `src/controllers/toreTokenController.ts`, `public/js/toreToken.js`
- **거래소 관련**: `contracts/ToreExchange.sol`, `src/controllers/exchangeController.ts`
- **인증 관련**: `src/controllers/authController.ts`, `src/middleware/auth.ts`, `src/middleware/jwtAuth.ts`
- **API 라우트**: `src/routes/` 폴더의 각 파일들
- **설정 파일**: 루트의 `package.json`, `tsconfig.json`, `hardhat.config.cjs`

### 🔧 문제 해결을 원한다면:
- **설치 및 실행**: `docs/guide/NFT_BLOCKCHAIN_PROJECT_GUIDE_6_설치및실행.md`
- **문제 해결**: `docs/guide/NFT_BLOCKCHAIN_PROJECT_GUIDE_10_문제해결.md`
- **실행 흐름**: `docs/guide/EXECUTION_FLOW.md`

## 📝 주의사항

1. **빌드 파일**: `artifacts/`, `cache/`, `dist/` 폴더는 자동 생성되므로 직접 수정하지 마세요.
2. **환경 변수**: `.env` 파일을 생성하여 필요한 환경 변수를 설정하세요.
3. **의존성**: 새로운 패키지 설치 후 `package.json`이 업데이트되는지 확인하세요.
4. **문서**: 코드 수정 시 관련 문서도 함께 업데이트하세요.

---

이 구조는 블록체인 프로젝트의 표준적인 구조를 따르며, 각 컴포넌트의 역할이 명확하게 분리되어 있어 유지보수와 확장이 용이합니다.
