# 🏗️ ToreBlockChainServer - 개선된 프로젝트 구조

## 📁 새로운 폴더 구조

```
ToreBlockChainServer/
├── 📁 blockchain/                    # 블록체인 관련 파일들
│   ├── contracts/                    # 스마트 컨트랙트 소스 코드
│   │   ├── GameItem.sol             # ERC721 NFT 컨트랙트
│   │   ├── ToreToken.sol            # ERC20 토큰 컨트랙트
│   │   └── ToreExchange.sol         # 거래소 컨트랙트
│   ├── scripts/                     # 배포 및 관리 스크립트
│   │   ├── deploy.ts                # 기본 배포 스크립트
│   │   ├── deployToreToken.ts       # ToreToken 배포
│   │   └── deployToreExchange.ts    # ToreExchange 배포
│   ├── artifacts/                   # 컴파일된 컨트랙트 아티팩트
│   └── cache/                       # Hardhat 캐시 파일
├── 📁 backend/                      # 백엔드 서버 코드
│   ├── src/                         # 소스 코드
│   │   ├── controllers/             # 모든 컨트롤러 통합
│   │   │   ├── authController.ts    # 인증 컨트롤러
│   │   │   ├── exchangeController.ts # 거래소 컨트롤러
│   │   │   ├── nftController.ts     # NFT 컨트롤러
│   │   │   ├── toreTokenController.ts # 토큰 컨트롤러
│   │   │   └── v1Controllers.ts     # v1 API 컨트롤러
│   │   ├── middleware/              # 미들웨어
│   │   │   ├── auth.ts              # 인증 미들웨어
│   │   │   ├── errorHandler.ts      # 에러 핸들러
│   │   │   ├── jwtAuth.ts           # JWT 인증
│   │   │   └── rateLimit.ts         # 레이트 리미팅
│   │   ├── routes/                  # 라우터
│   │   │   ├── auth.ts              # 인증 라우터
│   │   │   ├── exchange.ts          # 거래소 라우터
│   │   │   ├── nft.ts               # NFT 라우터
│   │   │   ├── toreToken.ts         # 토큰 라우터
│   │   │   └── v1.ts                # v1 API 라우터
│   │   ├── utils/                   # 유틸리티 함수
│   │   │   ├── contract.ts          # 컨트랙트 유틸리티
│   │   │   ├── jwt.ts               # JWT 유틸리티
│   │   │   └── toreToken.ts         # 토큰 유틸리티
│   │   └── app.ts                   # 메인 애플리케이션
│   └── tests/                       # 백엔드 테스트
│       ├── test-jwt.js              # JWT 테스트
│       └── test.md                  # 테스트 문서
├── 📁 frontend/                     # 프론트엔드 파일들
│   └── public/                      # 정적 파일
│       ├── index.html               # 메인 웹페이지
│       └── js/                      # 클라이언트 JavaScript
│           ├── nft.js               # NFT 관련 JS
│           └── toreToken.js         # 토큰 관련 JS
├── 📁 config/                       # 설정 파일들
│   ├── hardhat.config.cjs          # Hardhat 설정
│   ├── tsconfig.json               # TypeScript 설정
│   └── nodemon.json                # Nodemon 설정
├── 📁 docs/                         # 모든 문서 통합
│   ├── guide/                       # 가이드 문서들
│   ├── PROJECT_OVERVIEW.txt        # 프로젝트 개요
│   ├── PROJECT_STRUCTURE.md        # 기존 구조 문서
│   └── PROJECT_STRUCTURE_IMPROVED.md # 개선된 구조 문서
├── 📄 package.json                  # 프로젝트 설정 및 의존성
├── 📄 package-lock.json             # 의존성 잠금 파일
└── 📄 README.md                     # 프로젝트 README
```

## 🎯 개선 사항

### 1. **명확한 역할 분리**
- **blockchain/**: 블록체인 관련 모든 파일 (컨트랙트, 스크립트, 아티팩트)
- **backend/**: 서버 사이드 코드 (API, 미들웨어, 컨트롤러)
- **frontend/**: 클라이언트 사이드 파일 (HTML, CSS, JS)
- **config/**: 모든 설정 파일 통합
- **docs/**: 모든 문서 통합

### 2. **일관된 컨트롤러 구조**
- 모든 컨트롤러를 `backend/src/controllers/`에 통합
- `v1Controllers.ts`로 명명하여 v1 API 컨트롤러 구분
- 중복된 폴더 구조 제거

### 3. **개선된 설정 관리**
- 모든 설정 파일을 `config/` 폴더로 이동
- 경로 참조 업데이트로 일관성 확보
- 설정 파일별 명확한 역할 구분

### 4. **업데이트된 스크립트**
- `package.json`의 모든 스크립트 경로 업데이트
- Hardhat 설정 파일 경로 수정
- TypeScript 설정 경로 수정

## 🚀 사용법

### 개발 서버 실행
```bash
npm run dev
```

### 블록체인 컴파일
```bash
npm run compile
```

### 컨트랙트 배포
```bash
# Fuji 테스트넷에 배포
npm run deploy:fuji

# Avalanche 메인넷에 배포
npm run deploy:avalanche
```

### 특정 토큰 배포
```bash
# ToreToken 배포
npm run deploy:tore:fuji

# ToreExchange 배포
npm run deploy:exchange:fuji
```

## 📋 주요 변경사항

1. **폴더 구조 재배치**
   - `contracts/` → `blockchain/contracts/`
   - `scripts/` → `blockchain/scripts/`
   - `src/` → `backend/src/`
   - `public/` → `frontend/public/`
   - 설정 파일들 → `config/`

2. **컨트롤러 통합**
   - `src/v1/controllers.ts` → `backend/src/controllers/v1Controllers.ts`
   - 중복 폴더 제거

3. **설정 파일 업데이트**
   - `hardhat.config.cjs`: 경로 참조 수정
   - `tsconfig.json`: include/exclude 경로 수정
   - `package.json`: 스크립트 경로 수정

4. **Express 앱 수정**
   - 정적 파일 경로 수정: `public/` → `frontend/public/`

## ✅ 장점

- **가독성 향상**: 각 폴더의 역할이 명확함
- **유지보수성**: 관련 파일들이 논리적으로 그룹화됨
- **확장성**: 새로운 기능 추가 시 적절한 위치에 배치 가능
- **협업 효율성**: 팀원들이 쉽게 이해할 수 있는 구조
- **일관성**: 모든 컨트롤러와 설정 파일의 일관된 구조

이제 프로젝트가 더욱 체계적이고 이해하기 쉬운 구조로 개선되었습니다! 🎉
