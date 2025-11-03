# 메타마스크에 NFT 자동 추가 가이드

NFT 민팅 후 메타마스크 웹 확장 프로그램에서 NFT가 **자동으로** 보이도록 하는 방법입니다.

## ⚠️ 중요 사항

**백엔드에서 직접 메타마스크에 NFT를 추가할 수 없습니다.** 이유:
- `wallet_watchAsset` API는 브라우저에서만 실행 가능
- 메타마스크 확장 프로그램의 API이므로 서버에서는 접근 불가
- 사용자 동의가 필요 (보안상의 이유)

**해결 방법**: 프론트엔드에서 민팅 API 호출 후 자동으로 `wallet_watchAsset`을 호출하면 됩니다.

## 개요

민팅 후 자동으로 메타마스크에 NFT를 추가하려면:
1. 백엔드 API로 NFT 민팅 (이미 구현됨)
2. 프론트엔드에서 응답 받은 후 `wallet_watchAsset` 자동 호출
3. 사용자가 메타마스크 팝업에서 승인하면 자동 추가됨

## 백엔드 API 응답

민팅 API(`POST /api/nft/mint`)는 다음 정보를 반환합니다:

```json
{
  "txHash": "0x...",
  "tokenId": 123456,
  "tokenURI": "ipfs://...",
  "contractAddress": "0x...",
  "mintedTo": "0x...",
  "itemId": 3,
  "userEquipItemId": 1
}
```

## 🚀 완전 자동화 예제 (즉시 사용 가능)

### 1. JavaScript (Vanilla JS) - 완전 자동화 버전

```html
<!DOCTYPE html>
<html>
<head>
  <title>NFT 민팅 - 자동 메타마스크 추가</title>
</head>
<body>
  <button id="mintBtn">NFT 민팅하기</button>
  <div id="status"></div>

  <script>
    /**
     * 메타마스크에 NFT를 자동으로 추가하는 함수
     */
    async function addNFTToMetaMask(contractAddress, tokenId) {
      try {
        if (typeof window.ethereum === 'undefined') {
          throw new Error('MetaMask가 설치되어 있지 않습니다.');
        }

        const wasAdded = await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC721',
            options: {
              address: contractAddress,
              tokenId: tokenId.toString(),
            },
          },
        });

        return wasAdded;
      } catch (error) {
        console.error('NFT 추가 실패:', error);
        throw error;
      }
    }

    /**
     * NFT 민팅 후 자동으로 메타마스크에 추가하는 통합 함수
     * 이 함수 하나로 민팅부터 메타마스크 추가까지 완료됩니다!
     */
    async function mintNFTAutoAdd(mintData) {
      const statusDiv = document.getElementById('status');
      statusDiv.textContent = '민팅 중...';

      try {
        // 1. 백엔드 API로 NFT 민팅
        const response = await fetch('/api/nft/mint', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'your-api-key' // 환경에 맞게 수정
          },
          body: JSON.stringify(mintData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '민팅 실패');
        }

        const result = await response.json();
        console.log('✅ 민팅 성공:', result);
        statusDiv.textContent = '민팅 완료! 메타마스크에 추가 중...';

        // 2. 자동으로 메타마스크에 NFT 추가
        if (result.contractAddress && result.tokenId) {
          try {
            const added = await addNFTToMetaMask(result.contractAddress, result.tokenId);
            
            if (added) {
              statusDiv.textContent = `✅ 완료! NFT가 민팅되었고 메타마스크에 추가되었습니다! (Token ID: ${result.tokenId})`;
              alert(`✅ NFT 민팅 및 메타마스크 추가 완료!\n\nToken ID: ${result.tokenId}\n트랜잭션: ${result.txHash}`);
            } else {
              statusDiv.textContent = '⚠️ NFT가 민팅되었지만 메타마스크 추가가 취소되었습니다.';
            }
          } catch (addError) {
            statusDiv.textContent = `⚠️ NFT는 민팅되었지만 메타마스크 추가 실패: ${addError.message}`;
            console.error('메타마스크 추가 실패:', addError);
          }
        } else {
          statusDiv.textContent = '⚠️ 민팅은 완료되었지만 컨트랙트 주소 또는 토큰 ID가 없습니다.';
        }

        return result;
      } catch (error) {
        statusDiv.textContent = `❌ 오류: ${error.message}`;
        console.error('민팅 실패:', error);
        alert(`❌ 민팅 실패: ${error.message}`);
        throw error;
      }
    }

    // 사용 예제
    document.getElementById('mintBtn').addEventListener('click', async () => {
      const mintData = {
        walletAddress: '0xFF5530beBE63f97f6cC80193416f890d76d65661', // 사용자 지갑 주소
        itemId: 3,
        userEquipItemId: 1,
        itemData: {
          name: '철검',
          type: 'EQUIPMENT',
          baseStats: {
            attack: 15,
            durability: 100,
            star: 1,
            enhancement: 0,
            enhancedAttack: 10
          },
          description: '기본적인 철검입니다.',
          image: 'ipfs://bafkreicqxmszqt2tcmf5aqqblokcs2uhem2e4mzbt7pvkjeiitjk5s3atu'
        }
      };

      await mintNFTAutoAdd(mintData);
    });
  </script>
</body>
</html>
```

### 2. 간단한 함수 버전 (기존 코드에 통합)

```javascript
/**
 * 메타마스크에 NFT를 자동으로 추가하는 함수
 */
async function addNFTToMetaMask(contractAddress, tokenId) {
  try {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask가 설치되어 있지 않습니다.');
    }

    const wasAdded = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC721',
        options: {
          address: contractAddress,
          tokenId: tokenId.toString(),
        },
      },
    });

    return wasAdded;
  } catch (error) {
    console.error('NFT 추가 실패:', error);
    throw error;
  }
}

/**
 * NFT 민팅 후 자동으로 메타마스크에 추가
 * ⚡ 이 함수 하나로 모든 것이 자동으로 처리됩니다!
 */
async function mintNFTAndAutoAddToMetaMask(mintData) {
  try {
    // 1. 백엔드 API로 NFT 민팅
    const response = await fetch('/api/nft/mint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'your-api-key' // 환경에 맞게 수정
      },
      body: JSON.stringify(mintData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '민팅 실패');
    }

    const result = await response.json();
    console.log('✅ 민팅 성공:', result);

    // 2. 자동으로 메타마스크에 NFT 추가
    if (result.contractAddress && result.tokenId) {
      try {
        const added = await addNFTToMetaMask(result.contractAddress, result.tokenId);
        
        if (added) {
          console.log('✅ NFT가 메타마스크에 자동으로 추가되었습니다!');
          return { ...result, addedToMetaMask: true };
        } else {
          console.log('⚠️ 사용자가 메타마스크 추가를 취소했습니다.');
          return { ...result, addedToMetaMask: false };
        }
      } catch (addError) {
        console.error('⚠️ 메타마스크 추가 실패:', addError);
        return { ...result, addedToMetaMask: false, addError: addError.message };
      }
    }

    return result;
  } catch (error) {
    console.error('❌ 민팅 실패:', error);
    throw error;
  }
}

// 사용 예제
const mintData = {
  walletAddress: '0xFF5530beBE63f97f6cC80193416f890d76d65661',
  itemId: 3,
  userEquipItemId: 1,
  itemData: {
    name: '철검',
    type: 'EQUIPMENT',
    image: 'ipfs://...',
    description: '기본적인 철검입니다.'
  }
};

// 이 함수 하나 호출하면 민팅 + 메타마스크 추가가 자동으로 완료됩니다!
mintNFTAndAutoAddToMetaMask(mintData)
  .then(result => {
    console.log('완료:', result);
  })
  .catch(error => {
    console.error('오류:', error);
  });
```

### 3. React 예제 - 완전 자동화

```jsx
import { useState } from 'react';

function MintNFT() {
  const [minting, setMinting] = useState(false);
  const [mintedNFT, setMintedNFT] = useState(null);

  const addNFTToMetaMask = async (contractAddress, tokenId) => {
    try {
      if (typeof window.ethereum === 'undefined') {
        alert('MetaMask가 설치되어 있지 않습니다.');
        return false;
      }

      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC721',
          options: {
            address: contractAddress,
            tokenId: tokenId.toString(),
          },
        },
      });

      return wasAdded;
    } catch (error) {
      console.error('NFT 추가 실패:', error);
      return false;
    }
  };

  const handleMint = async () => {
    setMinting(true);
    try {
      const response = await fetch('/api/nft/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'your-api-key'
        },
        body: JSON.stringify({
          walletAddress: '0x...',
          itemId: 3,
          userEquipItemId: 1,
          itemData: {
            name: '철검',
            type: 'EQUIPMENT',
            image: 'ipfs://...',
            // ... 기타 메타데이터
          }
        })
      });

      const result = await response.json();
      
      if (result.contractAddress && result.tokenId) {
        const added = await addNFTToMetaMask(result.contractAddress, result.tokenId);
        setMintedNFT({ ...result, addedToMetaMask: added });
        
        if (added) {
          alert('✅ NFT가 민팅되었고 메타마스크에 추가되었습니다!');
        }
      }
    } catch (error) {
      console.error('민팅 실패:', error);
      alert('민팅 실패: ' + error.message);
    } finally {
      setMinting(false);
    }
  };

  return (
    <div>
      <button onClick={handleMint} disabled={minting}>
        {minting ? '민팅 중...' : 'NFT 민팅하기'}
      </button>
      
      {mintedNFT && (
        <div>
          <p>민팅 완료!</p>
          <p>토큰 ID: {mintedNFT.tokenId}</p>
          <p>메타마스크 추가: {mintedNFT.addedToMetaMask ? '✅' : '❌'}</p>
        </div>
      )}
    </div>
  );
}
```

### 4. Vue.js 예제 - 완전 자동화

```vue
<template>
  <div>
    <button @click="handleMint" :disabled="minting">
      {{ minting ? '민팅 중...' : 'NFT 민팅하기' }}
    </button>
    
    <div v-if="mintedNFT">
      <p>민팅 완료!</p>
      <p>토큰 ID: {{ mintedNFT.tokenId }}</p>
      <p>메타마스크 추가: {{ mintedNFT.addedToMetaMask ? '✅' : '❌' }}</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      minting: false,
      mintedNFT: null
    };
  },
  methods: {
    async addNFTToMetaMask(contractAddress, tokenId) {
      try {
        if (typeof window.ethereum === 'undefined') {
          alert('MetaMask가 설치되어 있지 않습니다.');
          return false;
        }

        const wasAdded = await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC721',
            options: {
              address: contractAddress,
              tokenId: tokenId.toString(),
            },
          },
        });

        return wasAdded;
      } catch (error) {
        console.error('NFT 추가 실패:', error);
        return false;
      }
    },

    async handleMint() {
      this.minting = true;
      try {
        const response = await fetch('/api/nft/mint', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'your-api-key'
          },
          body: JSON.stringify({
            walletAddress: '0x...',
            itemId: 3,
            userEquipItemId: 1,
            itemData: {
              name: '철검',
              type: 'EQUIPMENT',
              image: 'ipfs://...',
            }
          })
        });

        const result = await response.json();
        
        if (result.contractAddress && result.tokenId) {
          const added = await this.addNFTToMetaMask(result.contractAddress, result.tokenId);
          this.mintedNFT = { ...result, addedToMetaMask: added };
          
          if (added) {
            alert('✅ NFT가 민팅되었고 메타마스크에 추가되었습니다!');
          }
        }
      } catch (error) {
        console.error('민팅 실패:', error);
        alert('민팅 실패: ' + error.message);
      } finally {
        this.minting = false;
      }
    }
  }
};
</script>
```

## 주의사항

1. **MetaMask 설치 확인**: `window.ethereum`이 존재하는지 확인해야 합니다.
2. **사용자 승인**: 사용자가 NFT 추가를 승인해야 합니다. 취소할 수 있습니다.
3. **네트워크 확인**: 올바른 네트워크(Avalanche Fuji/Mainnet)에 연결되어 있어야 합니다.
4. **에러 처리**: 네트워크 오류나 사용자 취소를 적절히 처리해야 합니다.

## ✅ 요약

### 자동화 방법

**가장 간단한 방법**: `mintNFTAndAutoAddToMetaMask()` 함수 하나만 호출하면 됩니다!

```javascript
// 이 한 줄로 민팅 + 메타마스크 추가가 자동으로 완료됩니다!
await mintNFTAndAutoAddToMetaMask(mintData);
```

### 동작 흐름

1. 사용자가 민팅 버튼 클릭
2. 프론트엔드에서 백엔드 API 호출 (`/api/nft/mint`)
3. 백엔드에서 NFT 민팅 완료
4. 프론트엔드에서 응답 받음 (`contractAddress`, `tokenId` 포함)
5. **자동으로** `wallet_watchAsset` API 호출
6. 메타마스크 팝업 표시 (사용자 승인)
7. ✅ NFT가 메타마스크에 자동 추가됨!

### 핵심 코드

```javascript
// 메타마스크에 자동 추가
await window.ethereum.request({
  method: 'wallet_watchAsset',
  params: {
    type: 'ERC721',
    options: {
      address: result.contractAddress,  // 백엔드 응답에서 받음
      tokenId: result.tokenId.toString()  // 백엔드 응답에서 받음
    }
  }
});
```

## 참고 자료

- [MetaMask wallet_watchAsset 문서](https://docs.metamask.io/wallet/reference/wallet_watchasset/)
- [ERC-721 표준](https://eips.ethereum.org/EIPS/eip-721)
