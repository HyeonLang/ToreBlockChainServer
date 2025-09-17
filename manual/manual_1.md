# 📖 Manual 1: 프로젝트 개요 및 기본 구조

## 🎯 프로젝트 소개

**ToreBlockChainServer**는 NFT와 TORE 토큰을 관리하는 종합 블록체인 서버입니다. 사용자가 NFT를 생성, 전송, 삭제하고, TORE 토큰을 관리하며, 마켓에서 NFT를 거래할 수 있는 완전한 생태계를 제공합니다.

### 🌟 주요 기능

- **🎨 NFT 관리**: 생성, 전송, 삭제, 조회
- **💰 TORE 토큰**: 잔액 조회, 전송, 거래 내역
- **🏪 마켓 시스템**: NFT 판매 등록, 구매, 취소 (신규 추가)
- **🔄 거래소**: NFT와 토큰 간 거래
- **🔐 인증 시스템**: API 키 기반 보안

## 🏗️ 프로젝트 구조

```
ToreBlockChainServer/
├── 📁 backend/                 # 백엔드 서버
│   ├── 📁 src/
│   │   ├── 📄 app.ts          # 메인 서버 진입점
│   │   ├── 📁 controllers/    # API 컨트롤러
│   │   │   ├── 📄 authController.ts
│   │   │   ├── 📄 exchangeController.ts
│   │   │   ├── 📄 marketController.ts    # 🆕 마켓 시스템
│   │   │   ├── 📄 nftController.ts
│   │   │   ├── 📄 toreTokenController.ts
│   │   │   └── 📄 v1Controllers.ts
│   │   ├── 📁 middleware/    # 미들웨어
│   │   │   ├── 📄 auth.ts
│   │   │   ├── 📄 errorHandler.ts
│   │   │   ├── 📄 jwtAuth.ts
│   │   │   └── 📄 rateLimit.ts
│   │   ├── 📁 routes/         # API 라우트
│   │   │   ├── 📄 auth.ts
│   │   │   ├── 📄 exchange.ts
│   │   │   ├── 📄 market.ts              # 🆕 마켓 라우트
│   │   │   ├── 📄 nft.ts
│   │   │   ├── 📄 toreToken.ts
│   │   │   └── 📄 v1.ts
│   │   └── 📁 utils/          # 유틸리티
│   │       ├── 📄 contract.ts
│   │       ├── 📄 jwt.ts
│   │       └── 📄 toreToken.ts
│   └── 📁 tests/              # 테스트 파일
├── 📁 blockchain/             # 블록체인 관련
│   ├── 📁 contracts/          # 스마트 컨트랙트
│   │   ├── 📄 GameItem.sol    # NFT 컨트랙트
│   │   ├── 📄 ToreExchange.sol # 거래소 컨트랙트
│   │   └── 📄 ToreToken.sol   # 토큰 컨트랙트
│   ├── 📁 scripts/            # 배포 스크립트
│   └── 📁 artifacts/          # 컴파일된 컨트랙트
├── 📁 frontend/               # 프론트엔드
│   └── 📁 public/
│       ├── 📄 index.html      # 메인 페이지
│       ├── 📄 exchange.html   # 거래소 페이지
│       ├── 📁 css/            # 스타일시트
│       └── 📁 js/             # JavaScript 파일
├── 📁 manual/                 # 📚 매뉴얼 (신규)
│   ├── 📄 README.md
│   ├── 📄 manual_1.md        # 이 파일
│   ├── 📄 manual_2.md
│   ├── 📄 manual_3.md
│   ├── 📄 manual_4.md
│   └── 📄 manual_5.md
├── 📄 package.json            # 프로젝트 설정
├── 📄 hardhat.config.cjs      # Hardhat 설정
└── 📄 README.md               # 프로젝트 README
```

## 🔧 기술 스택

### 백엔드
- **Node.js**: 서버 런타임
- **TypeScript**: 타입 안전성
- **Express.js**: 웹 프레임워크
- **ethers.js**: 블록체인 상호작용
- **Hardhat**: 스마트 컨트랙트 개발

### 프론트엔드
- **HTML5**: 마크업
- **CSS3**: 스타일링
- **JavaScript (ES6+)**: 클라이언트 로직
- **ethers.js**: 블록체인 연결

### 블록체인
- **Solidity**: 스마트 컨트랙트 언어
- **OpenZeppelin**: 컨트랙트 라이브러리
- **Avalanche Fuji**: 테스트넷

## 🚀 서버 진입점

### 메인 서버 (`backend/src/app.ts`)

```typescript
// 서버 실행 흐름
1. 환경 변수 로드 (.env 파일)
2. Express 서버 초기화
3. 미들웨어 설정 (JSON 파싱, 정적 파일 서빙)
4. 라우트 등록
5. 서버 시작 (포트 3000)
```

### 프론트엔드 진입점

- **메인 페이지**: `http://localhost:3000` → `frontend/public/index.html`
- **거래소 페이지**: `http://localhost:3000/exchange.html`

## 🔐 인증 시스템

모든 API 엔드포인트는 **API 키 인증**을 사용합니다:

```http
X-API-Key: your-api-key-here
```

### 인증이 필요한 엔드포인트
- `/api/nft/*` - NFT 관련 API
- `/api/tore/*` - TORE 토큰 API
- `/api/exchange/*` - 거래소 API
- `/api/market/*` - 🆕 마켓 시스템 API
- `/v1/*` - v1 API

### 인증이 필요하지 않은 엔드포인트
- `/` - 메인 페이지
- `/health` - 헬스 체크
- `/api/auth/*` - 인증 관련 API

## 📊 API 구조 개요

### 기존 API
- **NFT API**: `/api/nft/*` - NFT 생성, 전송, 삭제, 조회
- **TORE 토큰 API**: `/api/tore/*` - 잔액 조회, 전송, 내역
- **거래소 API**: `/api/exchange/*` - 거래 생성, 구매, 취소
- **인증 API**: `/api/auth/*` - 로그인, 로그아웃, 토큰 갱신

### 🆕 신규 마켓 API
- **마켓 API**: `/api/market/*` - NFT 판매 등록, 구매, 취소, 목록 조회

## 🔄 데이터 흐름

### NFT 마켓 시스템 흐름
```
1. 사용자가 NFT 판매 등록
   ↓
2. 마켓에 NFT가 등록됨
   ↓
3. 다른 사용자가 마켓에서 NFT 조회
   ↓
4. 구매자가 NFT 구매
   ↓
5. NFT가 구매자에게 전송됨
   ↓
6. 판매자에게 TORE 토큰 전송됨
```

## 🎯 다음 단계

이제 프로젝트의 기본 구조를 이해했으니, 다음 매뉴얼들을 통해 더 자세한 내용을 확인하세요:

- **[manual_2.md](./manual_2.md)**: 백엔드 서버 구조 및 API 상세
- **[manual_3.md](./manual_3.md)**: 마켓 시스템 API 상세 (신규 기능)
- **[manual_4.md](./manual_4.md)**: 프론트엔드 구조 및 사용법
- **[manual_5.md](./manual_5.md)**: 설치 및 실행 가이드

---

**📝 참고사항**: 이 매뉴얼은 프로젝트의 최신 상태를 반영합니다. 새로운 기능이 추가되면 매뉴얼도 함께 업데이트됩니다.
