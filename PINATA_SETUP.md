# Pinata IPFS 설정 가이드

## 🎯 개요

NFT 메타데이터를 IPFS에 업로드하기 위해 Pinata 서비스를 사용합니다.

## 📋 필수 사항

### 1. Pinata 계정 생성

1. [Pinata](https://www.pinata.cloud/) 방문
2. 무료 계정 가입 (월 1GB 무료)
3. 이메일 인증 완료

### 2. API 키 발급

1. Pinata 대시보드 로그인
2. 상단 메뉴 **API Keys** 클릭
3. **+ New Key** 버튼 클릭
4. 권한 설정:
   - ✅ `pinFileToIPFS`
   - ✅ `pinJSONToIPFS`
   - ❌ 다른 권한은 필요 없음 (보안상 최소 권한 부여)
5. Key Name 입력 (예: `ToreBlockchain-Server`)
6. **Create Key** 클릭
7. **API Key**와 **API Secret** 복사 (한 번만 표시됨! ⚠️)

## 🔧 환경변수 설정

`.env` 파일에 다음 내용 추가:

```bash
# Pinata IPFS
PINATA_API_KEY=your_api_key_here
PINATA_SECRET_API_KEY=your_secret_key_here
```

### 예시:

```bash
PINATA_API_KEY=a1b2c3d4e5f6g7h8i9j0
PINATA_SECRET_API_KEY=k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

## ✅ 연결 테스트

서버 시작 후 다음 엔드포인트로 테스트:

```bash
curl http://localhost:3000/api/nft/test-pinata
```

**성공 응답:**
```json
{
  "success": true,
  "message": "Pinata connection successful"
}
```

**실패 응답:**
```json
{
  "success": false,
  "message": "Pinata API keys not configured",
  "hint": "Please set PINATA_API_KEY and PINATA_SECRET_API_KEY in .env file"
}
```

## 🚀 사용 방법

### NFT 민팅 시 자동 업로드

NFT를 민팅할 때 `itemData`에 JSON 객체를 전달하면 자동으로 Pinata에 업로드됩니다:

```javascript
// POST /api/nft/mint
{
  "walletAddress": "0x...",
  "itemId": 3,
  "userEquipItemId": 5,
  "itemData": {
    "name": "철검",
    "description": "기본적인 철검입니다.",
    "image": "ipfs://QmXxx...",
    "external_url": "https://toregame.com/items/5",
    "attributes": [
      { "trait_type": "attack", "value": 15 },
      { "trait_type": "durability", "value": 100 }
    ],
    "game_data": {
      "item_id": "3",
      "id": "item_5"
    }
  }
}
```

**응답:**
```json
{
  "txHash": "0xabc...",
  "tokenId": 300000001,
  "tokenURI": "ipfs://QmYxz...",  // ← Pinata가 반환한 IPFS URI
  "contractAddress": "0x0a88..."
}
```

### 실행 흐름:

1. **메타데이터 검증** - 필수 필드 확인
2. **Pinata 업로드** - JSON을 IPFS에 업로드
3. **IPFS URI 받기** - `ipfs://QmXxx...` 형태
4. **블록체인 민팅** - IPFS URI를 tokenURI로 사용
5. **응답 반환** - tokenURI 포함

## 💰 비용

- **무료 티어**: 월 1GB, 100,000 requests
- **프로 티어**: $20/월, 100GB, 무제한 requests
- **일반적인 JSON 메타데이터**: ~1-5KB
- **예상 용량**: 1GB = 약 200,000~1,000,000개 NFT 메타데이터

## 🔒 보안

### ✅ 권장 사항:

1. **최소 권한 부여** - JSON 업로드만 허용
2. **키 노출 금지** - `.env` 파일은 `.gitignore`에 추가
3. **주기적 키 갱신** - 3개월마다 키 재발급
4. **서버 전용** - 클라이언트에서 직접 Pinata 호출하지 않기

### ⚠️ 주의사항:

- API 키를 GitHub에 커밋하지 마세요!
- 프론트엔드 코드에 API 키를 넣지 마세요!
- 백엔드 서버에서만 Pinata API 호출

## 🐛 문제 해결

### 1. "Pinata API keys not configured" 에러

**원인:** `.env` 파일에 키가 없거나 잘못됨

**해결:**
```bash
# .env 파일 확인
cat .env | grep PINATA

# 키가 없으면 추가
echo "PINATA_API_KEY=your_key" >> .env
echo "PINATA_SECRET_API_KEY=your_secret" >> .env
```

### 2. "Pinata authentication failed" 에러

**원인:** API 키가 잘못되었거나 만료됨

**해결:**
1. Pinata 대시보드에서 키 확인
2. 새 키 발급
3. `.env` 파일 업데이트
4. 서버 재시작

### 3. "Failed to upload to Pinata" 에러

**원인:** 네트워크 문제, 용량 초과, 또는 잘못된 데이터

**해결:**
```bash
# 연결 테스트
curl http://localhost:3000/api/nft/test-pinata

# 로그 확인
npm run dev  # 콘솔에서 상세 에러 확인
```

### 4. 업로드 속도가 느림

**원인:** 네트워크 속도, Pinata 서버 부하

**해결:**
- `pinata.ts`의 `timeout` 값 증가 (현재 30초)
- Pinata 대시보드에서 API 상태 확인
- 업그레이드 고려 (프로 티어)

## 📚 참고 자료

- [Pinata 공식 문서](https://docs.pinata.cloud/)
- [Pinata API Reference](https://docs.pinata.cloud/api-pinning/pin-json)
- [IPFS 개념 설명](https://docs.ipfs.tech/concepts/)

## 💡 팁

### IPFS Gateway로 메타데이터 확인:

```
ipfs://QmXxx... → https://gateway.pinata.cloud/ipfs/QmXxx...
```

브라우저에서 직접 확인 가능!

### 업로드된 파일 관리:

Pinata 대시보드 → **Files** 메뉴에서 업로드된 모든 파일 확인 가능

### 파일 이름 규칙:

자동으로 생성되는 이름: `nft-metadata-item{itemId}-{timestamp}.json`

예: `nft-metadata-item3-1699123456789.json`

