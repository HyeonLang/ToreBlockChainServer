# NFT 민팅 테스트 데이터

## 🎯 테스트 시나리오

SQL 데이터를 기반으로 한 NFT 민팅 요청 예시입니다.

---

## 📝 테스트 케이스 1: 철검 (Level 1) 민팅

```bash
curl -X POST http://localhost:3000/api/nft/mint \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0xFF5530beBE63f97f6cC80193416f890d76d65661",
    "itemId": 3,
    "userEquipItemId": 1,
    "metadataUrl": "https://toregame.com/items/3",
    "itemData": {
      "name": "철검",
      "type": "EQUIPMENT",
      "baseStats": {
        "attack": 15,
        "durability": 100,
        "star": 1,
        "enhancement": 0,
        "enhancedAttack": 10
      },
      "description": "기본적인 철검입니다.",
      "image": "ipfs://bafkreicqxmszqt2tcmf5aqqblokcs2uhem2e4mzbt7pvkjeiitjk5s3atu"
    }
  }'
```

**설명:**
- `itemId: 3` → `item_definitions.item_id = 3` (철검)
- `userEquipItemId: 1` → `user_equip_items`의 첫 번째 레코드 (level 1 철검)
- `baseStats`에 원본 base_stats + enhancement_data 포함

---

## 📝 테스트 케이스 2: 가죽 갑옷 (Level 1) 민팅

```bash
curl -X POST http://localhost:3000/api/nft/mint \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0xFF5530beBE63f97f6cC80193416f890d76d65661",
    "itemId": 4,
    "userEquipItemId": 2,
    "metadataUrl": "https://toregame.com/items/4",
    "itemData": {
      "name": "가죽 갑옷",
      "type": "EQUIPMENT",
      "baseStats": {
        "health": 10,
        "durability": 80,
        "star": 1,
        "enhancement": 0,
        "enhancedHealth": 10
      },
      "description": "가죽으로 만든 갑옷입니다.",
      "image": "ipfs://bafkreidjnwybxkem2ghdhbwn23wopyldw376qfmd626quqb5zblyjummse"
    }
  }'
```

**설명:**
- `itemId: 4` → `item_definitions.item_id = 4` (가죽 갑옷)
- `userEquipItemId: 2` → `user_equip_items`의 두 번째 레코드 (level 1 가죽 갑옷)

---

## 📝 테스트 케이스 3: 철검 (Level 2, 강화) 민팅

```bash
curl -X POST http://localhost:3000/api/nft/mint \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0xFF5530beBE63f97f6cC80193416f890d76d65661",
    "itemId": 3,
    "userEquipItemId": 3,
    "metadataUrl": "https://toregame.com/items/3",
    "itemData": {
      "name": "철검",
      "type": "EQUIPMENT",
      "baseStats": {
        "attack": 15,
        "durability": 100,
        "star": 2,
        "enhancement": 0,
        "enhancedAttack": 13
      },
      "description": "기본적인 철검입니다.",
      "image": "ipfs://bafkreicqxmszqt2tcmf5aqqblokcs2uhem2e4mzbt7pvkjeiitjk5s3atu"
    }
  }'
```

**설명:**
- `userEquipItemId: 3` → 세 번째 레코드 (level 2 철검)
- `star: 2`, `enhancedAttack: 13` (level 2 강화 효과)

---

## 📝 테스트 케이스 4: 가죽 갑옷 (Level 2, 강화) 민팅

```bash
curl -X POST http://localhost:3000/api/nft/mint \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0xFF5530beBE63f97f6cC80193416f890d76d65661",
    "itemId": 4,
    "userEquipItemId": 4,
    "metadataUrl": "https://toregame.com/items/4",
    "itemData": {
      "name": "가죽 갑옷",
      "type": "EQUIPMENT",
      "baseStats": {
        "health": 10,
        "durability": 80,
        "star": 2,
        "enhancement": 0,
        "enhancedHealth": 9
      },
      "description": "가죽으로 만든 갑옷입니다.",
      "image": "ipfs://bafkreidjnwybxkem2ghdhbwn23wopyldw376qfmd626quqb5zblyjummse"
    }
  }'
```

**설명:**
- `userEquipItemId: 4` → 네 번째 레코드 (level 2 가죽 갑옷)
- `star: 2`, `enhancedHealth: 9` (level 2 강화 효과)

---

## 📊 예상 응답 (성공 시)

```json
{
  "txHash": "0x7d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e",
  "tokenId": 300000001,
  "tokenURI": "ipfs://QmXyZ123abc456def789ghi012jkl345mno678pqr901stu234vwx",
  "contractAddress": "0x0a88E127B64f8bCEDBBe2D748a724402F1033B8D",
  "mintedTo": "0xFF5530beBE63f97f6cC80193416f890d76d65661",
  "itemId": 3,
  "userEquipItemId": 1,
  "itemDataIncluded": true
}
```

---

## 🔍 Attributes 생성 결과

민팅 후 IPFS에 업로드된 메타데이터의 attributes 예시:

```json
{
  "name": "철검",
  "description": "기본적인 철검입니다.",
  "image": "ipfs://bafkreicqxmszqt2tcmf5aqqblokcs2uhem2e4mzbt7pvkjeiitjk5s3atu",
  "external_url": "https://toregame.com/items/3",
  "attributes": [
    { "trait_type": "Item Def ID", "value": 3, "display_type": "number" },
    { "trait_type": "Equip Item ID", "value": 1, "display_type": "number" },
    { "trait_type": "Type", "value": "EQUIPMENT" },
    { "trait_type": "Attack", "value": 15, "display_type": "number" },
    { "trait_type": "Durability", "value": 100, "display_type": "number" },
    { "trait_type": "Star", "value": 1, "display_type": "number" },
    { "trait_type": "Enhancement", "value": 0, "display_type": "number" },
    { "trait_type": "EnhancedAttack", "value": 10, "display_type": "number" }
  ]
}
```

---

## 📌 주의사항

### 1. IPFS 이미지 URL 형식

SQL 데이터에서:
```sql
'ipfs://https://bafkreidjnwybxkem2ghdhbwn23wopyldw376qfmd626quqb5zblyjummse'
```

이는 잘못된 형식입니다. 올바른 형식:
```json
"image": "ipfs://bafkreidjnwybxkem2ghdhbwn23wopyldw376qfmd626quqb5zblyjummse"
```

또는:
```json
"image": "https://ipfs.io/ipfs/bafkreidjnwybxkem2ghdhbwn23wopyldw376qfmd626quqb5zblyjummse"
```

### 2. baseStats 구성

`baseStats`에는 다음을 포함해야 합니다:
- `item_definitions.base_stats`의 모든 속성
- `user_equip_items.enhancement_data`의 모든 속성

**예시:**
```json
"baseStats": {
  // item_definitions.base_stats에서
  "attack": 15,
  "durability": 100,
  // user_equip_items.enhancement_data에서
  "star": 1,
  "enhancement": 0,
  "enhancedAttack": 10
}
```

### 3. 테스트 전 확인사항

- ✅ Pinata API 키 설정 확인 (`.env` 파일)
- ✅ 백엔드 지갑에 AVAX 잔액 확인
- ✅ 컨트랙트 주소 확인 (`CONTRACT_ADDRESS`)
- ✅ 지갑 주소 유효성 확인

---

## 🧪 JavaScript/TypeScript 테스트 예시

```javascript
const testMintIronSword = async () => {
  const response = await fetch('http://localhost:3000/api/nft/mint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      walletAddress: "0xFF5530beBE63f97f6cC80193416f890d76d65661",
      itemId: 3,
      userEquipItemId: 1,
      metadataUrl: "https://toregame.com/items/3",
      itemData: {
        name: "철검",
        type: "EQUIPMENT",
        baseStats: {
          attack: 15,
          durability: 100,
          star: 1,
          enhancement: 0,
          enhancedAttack: 10
        },
        description: "기본적인 철검입니다.",
        image: "ipfs://bafkreicqxmszqt2tcmf5aqqblokcs2uhem2e4mzbt7pvkjeiitjk5s3atu"
      }
    })
  });
  
  const result = await response.json();
  console.log('민팅 결과:', result);
};
```

