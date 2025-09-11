# NFT 블록체인 프로젝트 완전 가이드 - 7편: HTTP 통신 및 API 사용법

## 📚 목차
1. [HTTP 통신 개요](#http-통신-개요)
2. [RESTful API 설계](#restful-api-설계)
3. [API 엔드포인트 상세](#api-엔드포인트-상세)
4. [인증 시스템](#인증-시스템)
5. [요청/응답 형식](#요청응답-형식)
6. [에러 처리](#에러-처리)
7. [API 테스트 방법](#api-테스트-방법)
8. [실제 사용 예시](#실제-사용-예시)

---

## 🌐 HTTP 통신 개요

### HTTP란?

**HTTP (HyperText Transfer Protocol)**는 웹에서 데이터를 주고받는 통신 규약입니다.

**HTTP의 특징:**
- **클라이언트-서버 모델**: 클라이언트가 요청, 서버가 응답
- **무상태 (Stateless)**: 각 요청은 독립적
- **요청-응답 구조**: 명확한 요청과 응답
- **표준화된 메서드**: GET, POST, PUT, DELETE 등

### HTTP 메서드

| 메서드 | 용도 | 예시 |
|--------|------|------|
| **GET** | 데이터 조회 | NFT 정보 조회 |
| **POST** | 데이터 생성 | NFT 생성 |
| **PUT** | 데이터 수정 | NFT 정보 수정 |
| **PATCH** | 부분 수정 | NFT 전송 |
| **DELETE** | 데이터 삭제 | NFT 삭제 |

### HTTP 상태 코드

| 코드 | 의미 | 설명 |
|------|------|------|
| **200** | OK | 요청 성공 |
| **201** | Created | 생성 성공 |
| **400** | Bad Request | 잘못된 요청 |
| **401** | Unauthorized | 인증 실패 |
| **403** | Forbidden | 권한 없음 |
| **404** | Not Found | 리소스 없음 |
| **500** | Internal Server Error | 서버 오류 |

---

## 🛣 RESTful API 설계

### REST란?

**REST (Representational State Transfer)**는 웹 서비스 설계를 위한 아키텍처 스타일입니다.

**REST의 원칙:**
1. **자원 (Resource)**: URL로 식별
2. **표현 (Representation)**: JSON, XML 등
3. **상태 전송 (State Transfer)**: HTTP 메서드 사용
4. **무상태**: 각 요청은 독립적

### API URL 구조

```
기본 URL: http://localhost:3000

/api/nft/          # NFT 관련 API
├── GET /address           # 컨트랙트 주소 조회
├── POST /mint            # NFT 생성
├── POST /transfer        # NFT 전송
├── POST /burn            # NFT 삭제
├── GET /:tokenId         # NFT 조회
├── GET /wallet           # 지갑 NFT 목록
├── GET /:tokenId/history # NFT 거래 이력
└── GET /wallet/history   # 지갑 거래 이력

/api/auth/          # 인증 관련 API
├── POST /login           # 로그인
├── POST /register        # 회원가입
├── POST /refresh         # 토큰 갱신
├── GET /profile          # 프로필 조회
└── POST /logout          # 로그아웃

/v1/                # v1 API (RESTful)
├── POST /nfts            # NFT 생성
├── PATCH /nfts/:id/transfer # NFT 전송
└── DELETE /nfts/:id      # NFT 삭제
```

---

## 📡 API 엔드포인트 상세

### 1. NFT 관련 API

#### GET /api/nft/address
**컨트랙트 주소 조회**

```bash
curl http://localhost:3000/api/nft/address
```

**응답:**
```json
{
  "address": "0x1234567890123456789012345678901234567890"
}
```

#### POST /api/nft/mint
**NFT 생성**

```bash
curl -X POST http://localhost:3000/api/nft/mint \
  -H "Content-Type: application/json" \
  -d '{
    "to": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "tokenURI": "https://ipfs.io/ipfs/QmYourMetadataHash"
  }'
```

**요청 본문:**
```json
{
  "to": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "tokenURI": "https://ipfs.io/ipfs/QmYourMetadataHash"
}
```

**응답:**
```json
{
  "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "tokenId": 1,
  "contractAddress": "0x1234567890123456789012345678901234567890"
}
```

#### POST /api/nft/transfer
**NFT 전송**

```bash
curl -X POST http://localhost:3000/api/nft/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "from": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "to": "0x8ba1f109551bD432803012645Hac136c",
    "tokenId": 1
  }'
```

**요청 본문:**
```json
{
  "from": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "to": "0x8ba1f109551bD432803012645Hac136c",
  "tokenId": 1
}
```

**응답:**
```json
{
  "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

#### POST /api/nft/burn
**NFT 삭제**

```bash
curl -X POST http://localhost:3000/api/nft/burn \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": 1
  }'
```

**요청 본문:**
```json
{
  "tokenId": 1
}
```

**응답:**
```json
{
  "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

#### GET /api/nft/:tokenId
**NFT 조회**

```bash
curl http://localhost:3000/api/nft/1
```

**응답:**
```json
{
  "owner": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "tokenURI": "https://ipfs.io/ipfs/QmYourMetadataHash"
}
```

#### GET /api/nft/wallet
**지갑 NFT 목록 조회**

```bash
curl "http://localhost:3000/api/nft/wallet?walletAddress=0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
```

**응답:**
```json
{
  "nfts": [
    {
      "tokenId": 1,
      "owner": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      "tokenURI": "https://ipfs.io/ipfs/QmYourMetadataHash"
    },
    {
      "tokenId": 2,
      "owner": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      "tokenURI": "https://ipfs.io/ipfs/QmAnotherMetadataHash"
    }
  ]
}
```

#### GET /api/nft/:tokenId/history
**NFT 거래 이력 조회**

```bash
curl http://localhost:3000/api/nft/1/history
```

**응답:**
```json
{
  "tokenId": 1,
  "transactions": [
    {
      "from": "0x0000000000000000000000000000000000000000",
      "to": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      "tokenId": 1,
      "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "blockNumber": 12345,
      "timestamp": 1640995200,
      "type": "mint"
    },
    {
      "from": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      "to": "0x8ba1f109551bD432803012645Hac136c",
      "tokenId": 1,
      "txHash": "0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
      "blockNumber": 12346,
      "timestamp": 1640995800,
      "type": "transfer"
    }
  ]
}
```

#### GET /api/nft/wallet/history
**지갑 거래 이력 조회**

```bash
curl "http://localhost:3000/api/nft/wallet/history?walletAddress=0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
```

**응답:**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "transactions": [
    {
      "from": "0x0000000000000000000000000000000000000000",
      "to": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      "tokenId": 1,
      "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "blockNumber": 12345,
      "timestamp": 1640995200,
      "type": "mint",
      "direction": "received"
    },
    {
      "from": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      "to": "0x8ba1f109551bD432803012645Hac136c",
      "tokenId": 1,
      "txHash": "0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
      "blockNumber": 12346,
      "timestamp": 1640995800,
      "type": "transfer",
      "direction": "sent"
    }
  ]
}
```

### 2. 인증 관련 API

#### POST /api/auth/login
**로그인**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password"
  }'
```

**요청 본문:**
```json
{
  "username": "admin",
  "password": "password"
}
```

**응답:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "1",
    "username": "admin",
    "email": "admin@tore.com",
    "role": "admin",
    "lastLoginAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/auth/register
**회원가입**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "password": "password123",
    "role": "user"
  }'
```

**요청 본문:**
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "role": "user"
}
```

**응답:**
```json
{
  "success": true,
  "message": "User registered successfully.",
  "user": {
    "id": "3",
    "username": "newuser",
    "email": "user@example.com",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/auth/refresh
**토큰 갱신**

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**요청 본문:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**응답:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "1",
    "username": "admin",
    "email": "admin@tore.com",
    "role": "admin"
  }
}
```

#### GET /api/auth/profile
**프로필 조회 (JWT 인증 필요)**

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3000/api/auth/profile
```

**응답:**
```json
{
  "success": true,
  "user": {
    "id": "1",
    "username": "admin",
    "email": "admin@tore.com",
    "role": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLoginAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/auth/logout
**로그아웃 (JWT 인증 필요)**

```bash
curl -X POST -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3000/api/auth/logout
```

**응답:**
```json
{
  "success": true,
  "message": "Logout successful."
}
```

### 3. v1 API (RESTful)

#### POST /v1/nfts
**NFT 생성**

```bash
curl -X POST http://localhost:3000/v1/nfts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "itemInfo": {
      "tokenURI": "https://ipfs.io/ipfs/QmYourMetadataHash"
    }
  }'
```

**요청 본문:**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "itemInfo": {
    "tokenURI": "https://ipfs.io/ipfs/QmYourMetadataHash"
  }
}
```

**응답:**
```json
{
  "success": true,
  "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "tokenId": 1,
  "contractAddress": "0x1234567890123456789012345678901234567890"
}
```

#### PATCH /v1/nfts/:id/transfer
**NFT 전송**

```bash
curl -X PATCH http://localhost:3000/v1/nfts/1/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "fromWalletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "toWalletAddress": "0x8ba1f109551bD432803012645Hac136c"
  }'
```

**요청 본문:**
```json
{
  "fromWalletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "toWalletAddress": "0x8ba1f109551bD432803012645Hac136c"
}
```

**응답:**
```json
{
  "success": true,
  "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

#### DELETE /v1/nfts/:id
**NFT 삭제**

```bash
curl -X DELETE -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3000/v1/nfts/1
```

**응답:**
```json
{
  "success": true,
  "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

---

## 🔐 인증 시스템

### 인증 방식

이 프로젝트는 **하이브리드 인증 시스템**을 사용합니다:

1. **JWT 인증** (권장)
2. **API 키 인증** (선택사항)

### JWT 인증

#### 토큰 구조
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "1",
    "username": "admin",
    "email": "admin@tore.com",
    "role": "admin",
    "iat": 1640995200,
    "exp": 1640996100
  }
}
```

#### 토큰 사용법
```bash
# Authorization 헤더에 Bearer 토큰 포함
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3000/api/nft/address
```

### API 키 인증

#### API 키 사용법
```bash
# x-api-key 헤더에 API 키 포함
curl -H "x-api-key: your-secret-api-key" \
  http://localhost:3000/api/nft/address
```

### 하이브리드 인증

**인증 우선순위:**
1. JWT 토큰이 있으면 JWT 인증 시도
2. JWT 토큰이 없으면 API 키 인증 시도
3. 두 방식 중 하나라도 성공하면 통과

---

## 📝 요청/응답 형식

### 요청 형식

#### 헤더
```http
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
x-api-key: your-secret-api-key
```

#### 본문 (POST, PUT, PATCH 요청)
```json
{
  "to": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "tokenURI": "https://ipfs.io/ipfs/QmYourMetadataHash"
}
```

### 응답 형식

#### 성공 응답
```json
{
  "success": true,
  "data": {
    "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "tokenId": 1
  }
}
```

#### 에러 응답
```json
{
  "error": "Invalid 'to' address",
  "code": "INVALID_ADDRESS"
}
```

### 데이터 타입

#### 주소 (Address)
- **형식**: `0x`로 시작하는 42자리 16진수
- **예시**: `0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6`

#### 토큰 ID (Token ID)
- **형식**: 0 이상의 정수
- **예시**: `1`, `2`, `100`

#### URI (Uniform Resource Identifier)
- **형식**: HTTP, HTTPS, IPFS URL
- **예시**: 
  - `https://example.com/metadata.json`
  - `ipfs://QmYourMetadataHash`

---

## ⚠️ 에러 처리

### HTTP 상태 코드

| 코드 | 의미 | 설명 |
|------|------|------|
| **200** | OK | 요청 성공 |
| **201** | Created | 생성 성공 |
| **400** | Bad Request | 잘못된 요청 |
| **401** | Unauthorized | 인증 실패 |
| **403** | Forbidden | 권한 없음 |
| **404** | Not Found | 리소스 없음 |
| **429** | Too Many Requests | 요청 제한 초과 |
| **500** | Internal Server Error | 서버 오류 |

### 에러 응답 형식

#### 인증 에러
```json
{
  "error": "API key required. Please provide x-api-key header.",
  "code": "API_KEY_REQUIRED"
}
```

#### 검증 에러
```json
{
  "error": "Invalid 'to' address",
  "code": "INVALID_ADDRESS"
}
```

#### 서버 에러
```json
{
  "error": "Internal server error during mint.",
  "code": "MINT_ERROR"
}
```

### 에러 코드 목록

| 코드 | 설명 |
|------|------|
| `API_KEY_REQUIRED` | API 키 필요 |
| `INVALID_API_KEY` | 잘못된 API 키 |
| `NO_TOKEN` | 토큰 없음 |
| `INVALID_TOKEN` | 잘못된 토큰 |
| `TOKEN_EXPIRED` | 토큰 만료 |
| `INVALID_ADDRESS` | 잘못된 주소 |
| `INVALID_TOKEN_ID` | 잘못된 토큰 ID |
| `INVALID_URI` | 잘못된 URI |
| `MINT_ERROR` | 민팅 오류 |
| `TRANSFER_ERROR` | 전송 오류 |
| `BURN_ERROR` | 소각 오류 |
| `RATE_LIMIT_EXCEEDED` | 요청 제한 초과 |

---

## 🧪 API 테스트 방법

### 1. cURL 사용

#### 기본 테스트
```bash
# 서버 상태 확인
curl http://localhost:3000/health

# 컨트랙트 주소 조회
curl http://localhost:3000/api/nft/address
```

#### 인증이 필요한 API 테스트
```bash
# JWT 토큰으로 인증
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/nft/address

# API 키로 인증
curl -H "x-api-key: YOUR_API_KEY" \
  http://localhost:3000/api/nft/address
```

### 2. Postman 사용

#### Postman 설정
1. **새 요청 생성**
2. **HTTP 메서드 선택** (GET, POST, PUT, DELETE)
3. **URL 입력**: `http://localhost:3000/api/nft/address`
4. **헤더 설정**:
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_JWT_TOKEN`
5. **본문 설정** (POST, PUT, PATCH 요청 시):
   ```json
   {
     "to": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
     "tokenURI": "https://ipfs.io/ipfs/QmYourMetadataHash"
   }
   ```

#### Postman 컬렉션
```json
{
  "info": {
    "name": "NFT API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["health"]
        }
      }
    },
    {
      "name": "Mint NFT",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"to\": \"0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6\",\n  \"tokenURI\": \"https://ipfs.io/ipfs/QmYourMetadataHash\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/nft/mint",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "nft", "mint"]
        }
      }
    }
  ]
}
```

### 3. JavaScript fetch 사용

```javascript
// 기본 GET 요청
async function getContractAddress() {
  try {
    const response = await fetch('http://localhost:3000/api/nft/address');
    const data = await response.json();
    console.log('Contract address:', data.address);
  } catch (error) {
    console.error('Error:', error);
  }
}

// POST 요청 (JWT 인증)
async function mintNFT(to, tokenURI) {
  try {
    const response = await fetch('http://localhost:3000/api/nft/mint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
      },
      body: JSON.stringify({ to, tokenURI })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Mint failed');
    }
    
    console.log('Mint success:', data);
    return data;
  } catch (error) {
    console.error('Mint error:', error);
    throw error;
  }
}

// POST 요청 (API 키 인증)
async function mintNFTWithApiKey(to, tokenURI) {
  try {
    const response = await fetch('http://localhost:3000/api/nft/mint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'your-secret-api-key'
      },
      body: JSON.stringify({ to, tokenURI })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Mint failed');
    }
    
    console.log('Mint success:', data);
    return data;
  } catch (error) {
    console.error('Mint error:', error);
    throw error;
  }
}
```

### 4. Python requests 사용

```python
import requests
import json

# 기본 GET 요청
def get_contract_address():
    try:
        response = requests.get('http://localhost:3000/api/nft/address')
        data = response.json()
        print('Contract address:', data['address'])
        return data['address']
    except Exception as e:
        print('Error:', e)
        return None

# POST 요청 (JWT 인증)
def mint_nft(to, token_uri, access_token):
    try:
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        }
        data = {
            'to': to,
            'tokenURI': token_uri
        }
        
        response = requests.post(
            'http://localhost:3000/api/nft/mint',
            headers=headers,
            json=data
        )
        
        if response.status_code == 200:
            result = response.json()
            print('Mint success:', result)
            return result
        else:
            error = response.json()
            print('Mint failed:', error)
            return None
            
    except Exception as e:
        print('Error:', e)
        return None

# POST 요청 (API 키 인증)
def mint_nft_with_api_key(to, token_uri, api_key):
    try:
        headers = {
            'Content-Type': 'application/json',
            'x-api-key': api_key
        }
        data = {
            'to': to,
            'tokenURI': token_uri
        }
        
        response = requests.post(
            'http://localhost:3000/api/nft/mint',
            headers=headers,
            json=data
        )
        
        if response.status_code == 200:
            result = response.json()
            print('Mint success:', result)
            return result
        else:
            error = response.json()
            print('Mint failed:', error)
            return None
            
    except Exception as e:
        print('Error:', e)
        return None

# 사용 예시
if __name__ == '__main__':
    # 컨트랙트 주소 조회
    contract_address = get_contract_address()
    
    # NFT 생성 (JWT 인증)
    access_token = 'your-jwt-token'
    result = mint_nft(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        'https://ipfs.io/ipfs/QmYourMetadataHash',
        access_token
    )
    
    # NFT 생성 (API 키 인증)
    api_key = 'your-api-key'
    result = mint_nft_with_api_key(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        'https://ipfs.io/ipfs/QmYourMetadataHash',
        api_key
    )
```

---

## 📋 다음 단계

이제 HTTP 통신과 API 사용법을 이해했으니, 다음 가이드에서는 보안 및 인증 시스템에 대해 자세히 알아보겠습니다.

**다음 가이드**: [보안 및 인증 시스템 설명](./NFT_BLOCKCHAIN_PROJECT_GUIDE_8_보안및인증.md)

---

## 💡 핵심 정리

1. **HTTP는 웹에서 데이터를 주고받는 통신 규약입니다.**
2. **RESTful API는 자원을 URL로 식별하고 HTTP 메서드로 조작합니다.**
3. **JWT와 API 키 두 가지 인증 방식을 지원합니다.**
4. **표준화된 요청/응답 형식을 사용합니다.**
5. **cURL, Postman, JavaScript, Python 등 다양한 방법으로 API를 테스트할 수 있습니다.**
