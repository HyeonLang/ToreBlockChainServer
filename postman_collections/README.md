# ToreBlockChainServer API 문서화

이 폴더에는 ToreBlockChainServer 프로젝트의 모든 API 엔드포인트를 Postman 형식으로 정리한 컬렉션들이 포함되어 있습니다.

## 컬렉션 목록

### 1. MultiToken API Collection
- **파일**: `MultiToken_API_Collection.json`
- **설명**: 다중 토큰 팩토리를 통한 여러 종류의 토큰 관리 API
- **기본 URL**: `http://localhost:3000/api/multi-token`
- **주요 기능**:
  - 토큰 생성, 조회, 민팅, 소각
  - 토큰 목록 및 잔액 조회
  - 팩토리 연결 상태 확인

### 2. NFT API Collection
- **파일**: `NFT_API_Collection.json`
- **설명**: NFT 관련 블록체인 상호작용 API
- **기본 URL**: `http://localhost:3000/api/nft`
- **주요 기능**:
  - NFT 민팅 (기존 방식 및 Java 방식 지원)
  - NFT 전송, 소각, 조회
  - 지갑별 NFT 목록 및 거래 이력 조회
  - 컨트랙트 주소 조회

### 3. ToreToken API Collection
- **파일**: `ToreToken_API_Collection.json`
- **설명**: ToreToken ERC-20 토큰 관련 API (레거시)
- **기본 URL**: `http://localhost:3000/api/tore`
- **주요 기능**:
  - 토큰 잔액 조회, 민팅, 소각
  - 게임 보상 지급 및 배치 전송
  - 게임 컨트랙트 및 매니저 관리
  - 지갑별 전송 내역 조회

### 4. V1 API Collection
- **파일**: `V1_API_Collection.json`
- **설명**: RESTful API v1 버전의 NFT 관리 엔드포인트
- **기본 URL**: `http://localhost:3000/v1`
- **주요 기능**:
  - RESTful 설계 원칙을 따른 NFT 관리
  - 표준 HTTP 메서드 사용
  - 일관된 응답 형식

## 사용 방법

### Postman에서 컬렉션 가져오기

1. Postman을 실행합니다
2. "Import" 버튼을 클릭합니다
3. 원하는 JSON 파일을 선택하여 가져옵니다
4. 환경 변수 `baseUrl`을 필요에 따라 수정합니다

### 환경 변수 설정

각 컬렉션에는 `baseUrl` 환경 변수가 포함되어 있습니다:
- MultiToken: `http://localhost:3000/api/multi-token`
- NFT: `http://localhost:3000/api/nft`
- ToreToken: `http://localhost:3000/api/tore`
- V1: `http://localhost:3000/v1`

### 서버 실행

API를 테스트하기 전에 서버가 실행 중인지 확인하세요:

```bash
# 백엔드 서버 실행
cd backend
npm start

# 또는 개발 모드
npm run dev
```

## API 특징

### 인증
- 대부분의 API는 인증 없이 접근 가능합니다
- 일부 API는 API 키 인증이 필요할 수 있습니다

### 요청 형식
- Content-Type: `application/json`
- 이더리움 주소는 0x로 시작하는 42자리 16진수 문자열
- 토큰 ID는 정수형 숫자

### 응답 형식
- 성공 시: `{ "success": true, "data": {...} }`
- 실패 시: `{ "success": false, "error": "에러 메시지" }`

### 에러 코드
- 400: 잘못된 요청 (필수 파라미터 누락, 형식 오류)
- 500: 서버 내부 오류 (블록체인 상호작용 실패)

## 주의사항

1. **ToreToken API는 레거시 시스템**입니다. 새로운 토큰 생성은 MultiTokenFactory 사용을 권장합니다.

2. **블록체인 트랜잭션**은 시간이 걸릴 수 있으므로 적절한 타임아웃을 설정하세요.

3. **가스비**가 필요하므로 충분한 이더리움 잔액을 확보하세요.

4. **테스트넷**에서 먼저 테스트한 후 메인넷에서 사용하세요.

## 추가 정보

프로젝트의 상세한 문서는 `docs/` 폴더를 참조하세요:
- `docs/guide/` - 상세한 가이드 문서
- `docs/PROJECT_OVERVIEW.txt` - 프로젝트 개요
- `docs/PROJECT_STRUCTURE.md` - 프로젝트 구조

## 문제 해결

API 사용 중 문제가 발생하면:
1. 서버 로그를 확인하세요
2. 네트워크 연결 상태를 확인하세요
3. 블록체인 노드 연결 상태를 확인하세요
4. 환경 변수 설정을 확인하세요
