# Tore Blockchain Server - 실행 흐름 분석

## 📁 프로젝트 구조

```
src/
├── app.ts              # 메인 애플리케이션 진입점
├── routes/
│   └── nft.ts         # NFT 관련 라우터
├── controllers/
│   └── nftController.ts # NFT 비즈니스 로직 컨트롤러
├── utils/
│   └── contract.ts    # 블록체인 연결 유틸리티
└── middleware/
    └── errorHandler.ts # 전역 에러 처리

contracts/
└── GameItem.sol       # NFT 스마트 컨트랙트
```

## 🔄 전체 실행 흐름

### 1. 서버 시작 (`app.ts`)
```
1. 환경변수 로드 (.env)
2. Express 서버 초기화
3. JSON 파싱 미들웨어 등록
4. 라우터 등록 (/api/nft)
5. 서버 시작 (포트 3000)
```

### 2. API 요청 처리 흐름

#### NFT 민팅 요청 예시:
```
POST /api/nft/mint
Body: { "to": "0x...", "tokenURI": "https://..." }
```

**처리 과정:**
1. `app.ts` → 요청 수신
2. `routes/nft.ts` → `/mint` 라우트 매칭
3. `controllers/nftController.ts` → `mintNftController` 호출
4. `utils/contract.ts` → 블록체인 연결 및 컨트랙트 인스턴스 생성
5. `GameItem.sol` → `mint` 함수 실행
6. 트랜잭션 해시 반환

## 📋 각 파일별 상세 기능

### `src/app.ts` - 메인 애플리케이션
- **역할**: Express 서버의 진입점
- **주요 기능**:
  - 환경변수 로드
  - 미들웨어 설정 (JSON 파싱)
  - 라우터 등록
  - 서버 시작
- **엔드포인트**: `/health` (헬스 체크)

### `src/routes/nft.ts` - NFT 라우터
- **역할**: NFT 관련 API 엔드포인트 정의
- **주요 기능**:
  - `GET /api/nft/address` - 컨트랙트 주소 조회
  - `POST /api/nft/mint` - NFT 민팅
  - `POST /api/nft/burn` - NFT 소각

### `src/controllers/nftController.ts` - 비즈니스 로직
- **역할**: 블록체인과의 상호작용 처리
- **주요 함수**:
  - `contractAddressController`: 컨트랙트 주소 반환
  - `mintNftController`: NFT 민팅 처리
  - `burnNftController`: NFT 소각 처리
- **에러 처리**: 400 (잘못된 요청), 500 (서버 에러)

### `src/utils/contract.ts` - 블록체인 연결
- **역할**: 이더리움 네트워크 연결 및 컨트랙트 인스턴스 생성
- **주요 함수**:
  - `getProvider()`: RPC Provider 생성
  - `getWallet()`: 개인키 기반 지갑 생성
  - `getContract()`: GameItem 컨트랙트 인스턴스 생성

### `src/middleware/errorHandler.ts` - 에러 처리
- **역할**: 전역 에러 핸들러
- **주요 기능**: 일관된 에러 응답 포맷 제공

### `contracts/GameItem.sol` - 스마트 컨트랙트
- **역할**: ERC721 표준 NFT 컨트랙트
- **주요 함수**:
  - `mint()`: NFT 생성 (소유자만 가능)
  - `burn()`: NFT 소각 (소유자만 가능)
  - `nextTokenId()`: 다음 토큰 ID 조회

## 🔧 환경변수 설정

```env
# 블록체인 연결
RPC_URL=https://...
PRIVATE_KEY=0x...
CONTRACT_ADDRESS=0x...

# 서버 설정
PORT=3000
NODE_ENV=development
```

## 🚀 API 사용 예시

### 1. 컨트랙트 주소 조회
```bash
GET /api/nft/address
```

### 2. NFT 민팅
```bash
POST /api/nft/mint
Content-Type: application/json

{
  "to": "0x1234567890123456789012345678901234567890",
  "tokenURI": "https://example.com/metadata/1.json"
}
```

### 3. NFT 소각
```bash
POST /api/nft/burn
Content-Type: application/json

{
  "tokenId": "1"
}
```

## ⚠️ 주의사항

1. **보안**: 개인키는 환경변수로 관리
2. **권한**: 민팅/소각은 컨트랙트 소유자만 가능
3. **네트워크**: 기본적으로 Avalanche 테스트넷 사용
4. **에러 처리**: 모든 블록체인 상호작용에 try-catch 적용
