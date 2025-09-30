# ToreBlockChainServer API 문서

## 개요
ToreBlockChainServer는 블록체인 기반 NFT 및 다중 토큰 관리 시스템입니다. 게임 아이템, 디지털 아트, 커뮤니티 토큰 등을 관리할 수 있는 완전한 블록체인 API를 제공합니다.

## 시스템 아키텍처
- **NFT 시스템**: ERC-721 기반 게임 아이템 및 디지털 아트 관리
- **MultiToken 시스템**: ERC-20 기반 다중 토큰 관리
- **Java 호환성**: Java 백엔드 시스템과의 완전한 호환성 지원
- **블록체인 연동**: 이더리움 네트워크와의 실시간 상호작용

## 기본 설정
- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **인증**: API 키 기반 인증 (필요시)

---

## NFT API (`/api/nft`)

### 1. 컨트랙트 주소 조회
```
GET /api/nft/contract-address
```
**기능**: 현재 배포된 NFT 컨트랙트 주소 조회  
**요청**: 없음  
**응답**:
```json
{
  "address": "0x1234567890123456789012345678901234567890"
}
```

### 2. NFT 민팅 (기존 방식)
```
POST /api/nft/mint
```
**기능**: 새로운 NFT 생성  
**요청**:
```json
{
  "to": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "tokenURI": "https://ipfs.io/ipfs/QmYourMetadataHash"
}
```
**응답**:
```json
{
  "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "tokenId": 1,
  "contractAddress": "0x1234567890123456789012345678901234567890"
}
```

### 3. NFT 민팅 (Java 방식)
```
POST /api/nft/mint
```
**기능**: Java 백엔드와 호환되는 NFT 생성  
**요청**:
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "itemId": 1,
  "userEquipItemId": 100,
  "itemData": {
    "name": "Sword",
    "rarity": "Legendary",
    "stats": {
      "attack": 100,
      "defense": 50
    }
  }
}
```
**응답**:
```json
{
  "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "tokenId": 1,
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "mintedTo": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "itemId": 1,
  "userEquipItemId": 100,
  "itemDataIncluded": true
}
```

### 4. NFT 전송
```
POST /api/nft/transfer
```
**기능**: NFT 소유권 이전  
**요청**:
```json
{
  "from": "0x1111111111111111111111111111111111111111",
  "to": "0x2222222222222222222222222222222222222222",
  "tokenId": 1
}
```
**응답**:
```json
{
  "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

### 5. NFT 소각
```
POST /api/nft/burn
```
**기능**: NFT 영구 삭제  
**요청**:
```json
{
  "tokenId": 1
}
```
**응답**:
```json
{
  "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

### 6. 지갑 NFT 목록 조회
```
GET /api/nft/wallet?walletAddress=0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
```
**기능**: 특정 지갑의 모든 NFT 조회  
**요청**: 쿼리 파라미터 `walletAddress`  
**응답**:
```json
{
  "nfts": [
    {
      "tokenId": 1,
      "owner": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      "tokenURI": "https://ipfs.io/ipfs/QmYourMetadataHash"
    }
  ]
}
```

### 7. 특정 NFT 조회
```
GET /api/nft/{tokenId}
```
**기능**: 특정 NFT 정보 조회  
**요청**: URL 파라미터 `tokenId`  
**응답**:
```json
{
  "owner": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "tokenURI": "https://ipfs.io/ipfs/QmYourMetadataHash"
}
```

### 8. NFT 거래 이력 조회
```
GET /api/nft/{tokenId}/history
```
**기능**: 특정 NFT의 모든 거래 이력 조회  
**요청**: URL 파라미터 `tokenId`  
**응답**:
```json
{
  "tokenId": 1,
  "transactions": [
    {
      "from": "0x0000000000000000000000000000000000000000",
      "to": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      "tokenId": 1,
      "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "blockNumber": 12345678,
      "timestamp": 1640995200,
      "type": "mint"
    }
  ]
}
```

### 9. 지갑 NFT 거래 이력 조회
```
GET /api/nft/wallet/history?walletAddress=0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
```
**기능**: 특정 지갑의 모든 NFT 거래 이력 조회  
**요청**: 쿼리 파라미터 `walletAddress`  
**응답**:
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "transactions": [
    {
      "from": "0x0000000000000000000000000000000000000000",
      "to": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      "tokenId": 1,
      "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "blockNumber": 12345678,
      "timestamp": 1640995200,
      "type": "mint",
      "direction": "received"
    }
  ]
}
```

---

## MultiToken API (`/api/multi-token`)

### 1. 토큰 생성
```
POST /api/multi-token/create
```
**기능**: 새로운 ERC-20 토큰 생성  
**요청**:
```json
{
  "name": "MyToken",
  "symbol": "MTK",
  "decimals": 18,
  "initialSupply": "1000000",
  "owner": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
}
```
**응답**:
```json
{
  "success": true,
  "data": {
    "name": "MyToken",
    "symbol": "MTK",
    "contractAddress": "0x1234567890123456789012345678901234567890",
    "initialSupply": "1000000",
    "decimals": 18,
    "owner": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
  }
}
```

### 2. 모든 토큰 목록 조회
```
GET /api/multi-token/list
```
**기능**: 생성된 모든 토큰 목록 조회  
**요청**: 없음  
**응답**:
```json
{
  "success": true,
  "data": {
    "tokens": [
      {
        "symbol": "MTK",
        "name": "MyToken",
        "contractAddress": "0x1234567890123456789012345678901234567890",
        "decimals": 18,
        "totalSupply": "1000000"
      }
    ],
    "count": 1
  }
}
```

### 3. 활성 토큰 목록 조회
```
GET /api/multi-token/active
```
**기능**: 활성 상태의 토큰 목록 조회  
**요청**: 없음  
**응답**: 위와 동일한 형식

### 4. 특정 토큰 정보 조회
```
GET /api/multi-token/info/{symbol}
```
**기능**: 특정 토큰의 상세 정보 조회  
**요청**: URL 파라미터 `symbol`  
**응답**:
```json
{
  "success": true,
  "data": {
    "symbol": "MTK",
    "name": "MyToken",
    "contractAddress": "0x1234567890123456789012345678901234567890",
    "decimals": 18,
    "totalSupply": "1000000"
  }
}
```

### 5. 특정 토큰 잔액 조회
```
GET /api/multi-token/balance/{symbol}/{address}
```
**기능**: 특정 지갑의 특정 토큰 잔액 조회  
**요청**: URL 파라미터 `symbol`, `address`  
**응답**:
```json
{
  "success": true,
  "data": {
    "symbol": "MTK",
    "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "balance": "1000000"
  }
}
```

### 6. 토큰 민팅
```
POST /api/multi-token/mint
```
**기능**: 특정 토큰을 특정 지갑에 발행  
**요청**:
```json
{
  "symbol": "MTK",
  "to": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "amount": "1000"
}
```
**응답**:
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "symbol": "MTK",
    "to": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "amount": "1000"
  }
}
```

### 7. 토큰 소각
```
POST /api/multi-token/burn
```
**기능**: 특정 토큰 소각  
**요청**:
```json
{
  "symbol": "MTK",
  "amount": "100"
}
```
**응답**:
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "symbol": "MTK",
    "amount": "100"
  }
}
```

### 8. 팩토리 연결 상태 확인
```
GET /api/multi-token/connection
```
**기능**: MultiTokenFactory 연결 상태 확인  
**요청**: 없음  
**응답**:
```json
{
  "success": true,
  "data": {
    "connected": true,
    "factory": "MultiTokenFactory"
  }
}
```

---

## 에러 응답 형식

모든 API는 다음과 같은 에러 응답을 반환할 수 있습니다:

```json
{
  "error": "에러 메시지",
  "details": {
    "received": "받은 값",
    "type": "데이터 타입",
    "length": "길이 (해당하는 경우)",
    "expected": "예상 형식"
  }
}
```

---

## 파라미터 검증 규칙

### 지갑 주소
- 형식: `0x`로 시작하는 42자리 16진수 문자열
- 예시: `0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6`

### 토큰 ID
- 형식: 0 이상의 정수
- 예시: `1`, `123`, `999`

### 토큰 URI
- 형식: 유효한 URL (http, https, ipfs 프로토콜 지원)
- 예시: `https://ipfs.io/ipfs/QmYourMetadataHash`

### 금액
- 형식: 양수 문자열
- 예시: `"1000"`, `"1000000"`

### 토큰 심볼
- 형식: 문자열 (대소문자 구분)
- 예시: `"MTK"`, `"GOLD"`, `"SILVER"`

---

## 사용 시나리오

### 게임 아이템 시스템
1. **아이템 발행**: `POST /api/nft/mint` (Java 방식)
2. **인벤토리 조회**: `GET /api/nft/wallet`
3. **아이템 거래**: `POST /api/nft/transfer`

### 게임 경제 시스템
1. **화폐 생성**: `POST /api/multi-token/create`
2. **리워드 지급**: `POST /api/multi-token/mint`
3. **잔액 확인**: `GET /api/multi-token/balance`

### NFT 마켓플레이스
1. **NFT 정보**: `GET /api/nft/{tokenId}`
2. **거래 이력**: `GET /api/nft/{tokenId}/history`
3. **구매 처리**: `POST /api/nft/transfer`

### 관리자 기능
1. **토큰 관리**: `GET /api/multi-token/list`
2. **공급량 조절**: `POST /api/multi-token/burn`
3. **시스템 상태**: `GET /api/multi-token/connection`

---

## 주의사항

1. **트랜잭션 대기**: 모든 블록체인 상호작용은 트랜잭션 완료까지 시간이 소요될 수 있습니다.
2. **가스비**: 모든 트랜잭션은 가스비가 필요합니다.
3. **네트워크 상태**: 블록체인 네트워크 상태에 따라 응답 시간이 달라질 수 있습니다.
4. **데이터 형식**: 모든 파라미터는 정확한 형식으로 전송해야 합니다.
5. **보안**: API 키는 안전하게 관리해야 합니다.

이 API 문서를 통해 완전한 블록체인 기반 게임/플랫폼을 구축할 수 있습니다.
