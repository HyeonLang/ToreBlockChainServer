# NFT 블록체인 프로젝트 완전 가이드 - 12편: NFT-TORE 거래소 시스템

## 📚 목차
1. [거래소 시스템 개요](#거래소-시스템-개요)
2. [ToreExchange 컨트랙트 분석](#toreexchange-컨트랙트-분석)
3. [거래 구조체와 상태 관리](#거래-구조체와-상태-관리)
4. [거래 생성 및 관리](#거래-생성-및-관리)
5. [NFT 구매 및 결제](#nft-구매-및-결제)
6. [거래 취소 및 관리](#거래-취소-및-관리)
7. [수수료 시스템](#수수료-시스템)
8. [백엔드 API 구현](#백엔드-api-구현)
9. [프론트엔드 통합](#프론트엔드-통합)
10. [보안 및 최적화](#보안-및-최적화)

---

## 🏪 거래소 시스템 개요

### 거래소란?

**NFT-TORE 거래소**는 NFT를 TORE 토큰으로 판매하고 구매할 수 있는 중앙화된 거래 플랫폼입니다.

**주요 기능:**
- **NFT 판매**: 소유자가 NFT를 TORE 토큰으로 판매 등록
- **NFT 구매**: 구매자가 TORE 토큰으로 NFT 구매
- **거래 관리**: 거래 생성, 진행, 완료, 취소 관리
- **수수료 시스템**: 거래 수수료 자동 차감 및 관리
- **거래 내역**: 모든 거래 기록 블록체인에 저장

### 시스템 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   웹 브라우저    │    │   Express 서버   │    │  Avalanche 블록체인 │
│   (거래소 UI)   │◄──►│   (거래소 API)  │◄──►│   (거래소 컨트랙트) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐            ┌────▼────┐            ┌────▼────┐
    │ MetaMask│            │ 거래소 API│            │ToreExchange│
    │  지갑   │            │ 컨트롤러│            │ 컨트랙트│
    └─────────┘            └─────────┘            └─────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐            ┌────▼────┐            ┌────▼────┐
    │ TORE토큰│            │ NFT API │            │GameItem │
    │ 컨트랙트│            │ 컨트롤러│            │ 컨트랙트│
    └─────────┘            └─────────┘            └─────────┘
```

### 거래 흐름

```
1. 판매자: NFT를 거래소에 판매 등록
2. 구매자: 거래소에서 NFT 검색 및 구매 요청
3. 거래소: TORE 토큰 잔액 확인 및 전송
4. 거래소: NFT 소유권 이전
5. 거래소: 수수료 차감 및 정산
6. 거래 완료: 거래 내역 블록체인에 기록
```

---

## 🔧 ToreExchange 컨트랙트 분석

### 전체 구조

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ToreExchange is Ownable, ReentrancyGuard {
    IERC721 public nftContract;
    IERC20 public toreTokenContract;
    
    struct Trade {
        address seller;
        address buyer;
        uint256 tokenId;
        uint256 price;
        bool isActive;
        uint256 createdAt;
        uint256 completedAt;
    }
    
    uint256 public feePercentage = 250; // 2.5%
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    mapping(uint256 => Trade) public trades;
    mapping(address => uint256[]) public userTrades;
    
    uint256 private _tradeIdCounter = 1;
}
```

### 상속 구조

```
ToreExchange
├── Ownable (소유자 권한 관리)
└── ReentrancyGuard (재진입 공격 방지)
```

**상속의 장점:**
- **Ownable**: 소유자만 수수료 변경, 컨트랙트 업데이트 가능
- **ReentrancyGuard**: 재진입 공격으로부터 안전한 거래 보장

### 상태 변수

```solidity
IERC721 public nftContract;           // NFT 컨트랙트 주소
IERC20 public toreTokenContract;      // TORE 토큰 컨트랙트 주소

uint256 public feePercentage = 250;   // 거래 수수료 (2.5%)
uint256 public constant FEE_DENOMINATOR = 10000;  // 수수료 계산 기준

mapping(uint256 => Trade) public trades;           // 거래 정보
mapping(address => uint256[]) public userTrades;   // 사용자별 거래 목록

uint256 private _tradeIdCounter = 1;  // 거래 ID 카운터
```

---

## 📊 거래 구조체와 상태 관리

### Trade 구조체

```solidity
struct Trade {
    address seller;      // 판매자 주소
    address buyer;       // 구매자 주소 (거래 완료 시)
    uint256 tokenId;     // NFT 토큰 ID
    uint256 price;        // 판매 가격 (TORE 토큰)
    bool isActive;        // 거래 활성 상태
    uint256 createdAt;    // 거래 생성 시간
    uint256 completedAt;  // 거래 완료 시간
}
```

### 거래 상태 관리

```solidity
// 거래 생성
trades[tradeId] = Trade({
    seller: msg.sender,
    buyer: address(0),        // 아직 구매자 없음
    tokenId: tokenId,
    price: price,
    isActive: true,           // 활성 상태
    createdAt: block.timestamp,
    completedAt: 0            // 아직 완료되지 않음
});

// 거래 완료
trades[tradeId].isActive = false;
trades[tradeId].buyer = msg.sender;
trades[tradeId].completedAt = block.timestamp;
```

### 거래 ID 관리

```solidity
uint256 private _tradeIdCounter = 1;

function getNextTradeId() internal returns (uint256) {
    return _tradeIdCounter++;
}
```

**거래 ID 특징:**
- **고유성**: 1부터 시작하여 자동 증가
- **순차성**: 시간 순서대로 생성
- **불변성**: 한번 할당된 ID는 변경되지 않음

---

## 🛒 거래 생성 및 관리

### 거래 생성 (createTrade)

```solidity
function createTrade(uint256 tokenId, uint256 price) external nonReentrant {
    require(price > 0, "ToreExchange: Price must be greater than 0");
    require(nftContract.ownerOf(tokenId) == msg.sender, "ToreExchange: Not the owner of this NFT");
    require(nftContract.getApproved(tokenId) == address(this) || 
            nftContract.isApprovedForAll(msg.sender, address(this)), 
            "ToreExchange: Contract not approved to transfer NFT");
    
    uint256 tradeId = _tradeIdCounter++;
    trades[tradeId] = Trade({
        seller: msg.sender,
        buyer: address(0),
        tokenId: tokenId,
        price: price,
        isActive: true,
        createdAt: block.timestamp,
        completedAt: 0
    });
    
    userTrades[msg.sender].push(tradeId);
    
    emit TradeCreated(tradeId, msg.sender, tokenId, price);
}
```

**실행 흐름:**
1. **입력 검증**: 가격이 0보다 큰지 확인
2. **소유권 확인**: 호출자가 NFT 소유자인지 확인
3. **승인 확인**: 컨트랙트가 NFT를 전송할 수 있는지 확인
4. **거래 생성**: 새로운 거래 정보 저장
5. **사용자 목록 업데이트**: 판매자의 거래 목록에 추가
6. **이벤트 발생**: 거래 생성 이벤트 발생

**사전 요구사항:**
- NFT 소유자여야 함
- 거래소 컨트랙트에 NFT 전송 승인 필요
- 판매 가격이 0보다 커야 함

### 거래 승인 설정

```typescript
// 프론트엔드에서 거래 생성 전 승인 설정
async function approveNFTForExchange(tokenId: string) {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  
  const nftContract = new ethers.Contract(nftAddress, nftABI, signer);
  
  const tx = await nftContract.approve(exchangeAddress, tokenId);
  await tx.wait();
  
  console.log('NFT approved for exchange');
}
```

---

## 💰 NFT 구매 및 결제

### NFT 구매 (buyNFT)

```solidity
function buyNFT(uint256 tradeId) external nonReentrant {
    Trade storage trade = trades[tradeId];
    require(trade.isActive, "ToreExchange: Trade is not active");
    require(trade.seller != msg.sender, "ToreExchange: Cannot buy your own NFT");
    require(toreTokenContract.balanceOf(msg.sender) >= trade.price, "ToreExchange: Insufficient TORE balance");
    
    trade.isActive = false;
    trade.buyer = msg.sender;
    trade.completedAt = block.timestamp;
    
    uint256 fee = (trade.price * feePercentage) / FEE_DENOMINATOR;
    uint256 sellerAmount = trade.price - fee;
    
    require(toreTokenContract.transferFrom(msg.sender, trade.seller, sellerAmount), "ToreExchange: TORE transfer failed");
    if (fee > 0) {
        require(toreTokenContract.transferFrom(msg.sender, owner(), fee), "ToreExchange: Fee transfer failed");
    }
    
    nftContract.transferFrom(trade.seller, msg.sender, trade.tokenId);
    
    userTrades[msg.sender].push(tradeId);
    
    emit TradeCompleted(tradeId, msg.sender, trade.price);
}
```

**실행 흐름:**
1. **거래 상태 확인**: 거래가 활성 상태인지 확인
2. **자기 거래 방지**: 자신의 NFT를 구매할 수 없음
3. **잔액 확인**: 구매자가 충분한 TORE 토큰을 보유하는지 확인
4. **거래 상태 업데이트**: 거래를 비활성화하고 구매자 정보 저장
5. **수수료 계산**: 거래 수수료 계산 (기본 2.5%)
6. **토큰 전송**: 판매자에게 토큰 전송, 소유자에게 수수료 전송
7. **NFT 전송**: NFT 소유권을 구매자에게 이전
8. **사용자 목록 업데이트**: 구매자의 거래 목록에 추가
9. **이벤트 발생**: 거래 완료 이벤트 발생

### 수수료 계산 예시

```solidity
uint256 price = 1000 * 10**18;  // 1000 TORE
uint256 feePercentage = 250;    // 2.5%
uint256 fee = (price * feePercentage) / FEE_DENOMINATOR;
// fee = (1000 * 10**18 * 250) / 10000 = 25 * 10**18 (25 TORE)

uint256 sellerAmount = price - fee;
// sellerAmount = 1000 * 10**18 - 25 * 10**18 = 975 * 10**18 (975 TORE)
```

### 구매 전 승인 설정

```typescript
// 구매자가 거래소에 TORE 토큰 전송 승인
async function approveToreForExchange(amount: string) {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  
  const toreTokenContract = new ethers.Contract(toreTokenAddress, toreTokenABI, signer);
  
  const amountWei = ethers.utils.parseEther(amount);
  const tx = await toreTokenContract.approve(exchangeAddress, amountWei);
  await tx.wait();
  
  console.log('TORE tokens approved for exchange');
}
```

---

## ❌ 거래 취소 및 관리

### 거래 취소 (cancelTrade)

```solidity
function cancelTrade(uint256 tradeId) external {
    Trade storage trade = trades[tradeId];
    require(trade.isActive, "ToreExchange: Trade is not active");
    require(trade.seller == msg.sender, "ToreExchange: Only seller can cancel trade");
    
    trade.isActive = false;
    
    emit TradeCancelled(tradeId);
}
```

**실행 흐름:**
1. **거래 상태 확인**: 거래가 활성 상태인지 확인
2. **권한 확인**: 호출자가 판매자인지 확인
3. **거래 비활성화**: 거래를 비활성화
4. **이벤트 발생**: 거래 취소 이벤트 발생

**취소 가능 조건:**
- 거래가 활성 상태여야 함
- 판매자만 취소 가능
- 구매자가 없는 상태

### 거래 관리 함수

```solidity
function getTrade(uint256 tradeId) external view returns (Trade memory) {
    return trades[tradeId];
}

function getUserTrades(address user) external view returns (uint256[] memory) {
    return userTrades[user];
}

function getActiveTrades(uint256 offset, uint256 limit) external view returns (uint256[] memory) {
    uint256[] memory activeTrades = new uint256[](limit);
    uint256 count = 0;
    
    for (uint256 i = offset; i < _tradeIdCounter && count < limit; i++) {
        if (trades[i].isActive) {
            activeTrades[count] = i;
            count++;
        }
    }
    
    uint256[] memory result = new uint256[](count);
    for (uint256 i = 0; i < count; i++) {
        result[i] = activeTrades[i];
    }
    
    return result;
}
```

---

## 💸 수수료 시스템

### 수수료 설정

```solidity
function updateFee(uint256 newFeePercentage) external onlyOwner {
    require(newFeePercentage <= 1000, "ToreExchange: Fee cannot exceed 10%");
    feePercentage = newFeePercentage;
    emit FeeUpdated(newFeePercentage);
}
```

**수수료 특징:**
- **기본 수수료**: 2.5% (250/10000)
- **최대 수수료**: 10% (1000/10000)
- **소유자만 변경 가능**: 보안을 위해 소유자만 수정 가능
- **투명성**: 모든 수수료가 블록체인에 기록

### 수수료 분배

```solidity
uint256 fee = (trade.price * feePercentage) / FEE_DENOMINATOR;
uint256 sellerAmount = trade.price - fee;

// 판매자에게 토큰 전송
require(toreTokenContract.transferFrom(msg.sender, trade.seller, sellerAmount), "ToreExchange: TORE transfer failed");

// 소유자에게 수수료 전송
if (fee > 0) {
    require(toreTokenContract.transferFrom(msg.sender, owner(), fee), "ToreExchange: Fee transfer failed");
}
```

**수수료 분배 예시:**
- **거래 가격**: 1000 TORE
- **수수료**: 25 TORE (2.5%)
- **판매자 수령**: 975 TORE
- **거래소 수령**: 25 TORE

---

## 🖥 백엔드 API 구현

### 거래소 컨트롤러

```typescript
// src/controllers/exchangeController.ts
export async function createTrade(req: Request, res: Response) {
  try {
    const { tokenId, price } = req.body;
    
    if (!tokenId || isNaN(parseInt(tokenId)) || parseInt(tokenId) < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token ID'
      });
    }
    
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid price'
      });
    }
    
    const exchangeAddress = process.env.TORE_EXCHANGE_ADDRESS;
    if (!exchangeAddress) {
      return res.status(500).json({
        success: false,
        error: 'Exchange contract address not configured'
      });
    }
    
    const tradeId = Math.floor(Math.random() * 1000000) + 1;
    
    res.json({
      success: true,
      data: {
        tradeId,
        tokenId: parseInt(tokenId),
        price: parseFloat(price),
        message: 'Trade created successfully. Please confirm the transaction in MetaMask.'
      }
    });
  } catch (error) {
    console.error('[Exchange Controller] Create trade error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create trade'
    });
  }
}
```

### 거래 조회 API

```typescript
export async function getActiveTrades(req: Request, res: Response) {
  try {
    const { offset = '0', limit = '20' } = req.query;
    
    const offsetNum = parseInt(offset as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid offset parameter'
      });
    }
    
    if (isNaN(limitNum) || limitNum <= 0 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter (must be between 1 and 100)'
      });
    }
    
    const exchangeAddress = process.env.TORE_EXCHANGE_ADDRESS;
    if (!exchangeAddress) {
      return res.status(500).json({
        success: false,
        error: 'Exchange contract address not configured'
      });
    }
    
    const activeTrades = [
      {
        tradeId: 1,
        seller: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        tokenId: 1,
        price: '100.0',
        createdAt: Date.now() - 86400000
      },
      {
        tradeId: 3,
        seller: '0x1234567890123456789012345678901234567890',
        tokenId: 3,
        price: '150.0',
        createdAt: Date.now() - 43200000
      }
    ];
    
    res.json({
      success: true,
      data: {
        trades: activeTrades,
        count: activeTrades.length,
        offset: offsetNum,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('[Exchange Controller] Get active trades error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active trades'
    });
  }
}
```

### 거래소 라우터

```typescript
// src/routes/exchange.ts
router.post('/create-trade', createTrade);
router.post('/buy-nft', buyNFT);
router.post('/cancel-trade', cancelTrade);
router.get('/trade/:tradeId', getTrade);
router.get('/user-trades/:address', getUserTrades);
router.get('/active-trades', getActiveTrades);
router.get('/stats', getExchangeStats);
```

---

## 🌐 프론트엔드 통합

### 거래 생성 UI

```html
<!-- 거래 생성 폼 -->
<div id="createTradeTab" class="tab-content">
    <form id="createTradeForm">
        <div class="form-group">
            <label for="tradeTokenId">NFT 토큰 ID</label>
            <input type="number" id="tradeTokenId" placeholder="1" required min="1">
        </div>
        
        <div class="form-group">
            <label for="tradePrice">판매 가격 (TORE)</label>
            <input type="number" id="tradePrice" placeholder="100" required min="0" step="0.000001">
        </div>
        
        <button type="submit" id="createTradeBtn" class="btn">
            거래 생성하기
        </button>
    </form>
</div>
```

### 거래 생성 JavaScript

```javascript
async function handleCreateTrade(event) {
  event.preventDefault();
  
  const tokenId = document.getElementById('tradeTokenId').value;
  const price = document.getElementById('tradePrice').value;
  
  try {
    showStatus('거래를 생성하는 중...', 'info');
    
    if (!currentAccount) {
      throw new Error('MetaMask 지갑을 먼저 연결해주세요');
    }
    
    // NFT 승인 확인
    const nftContract = new ethers.Contract(nftAddress, nftABI, signer);
    const approvedAddress = await nftContract.getApproved(tokenId);
    
    if (approvedAddress !== exchangeAddress) {
      // NFT 승인 필요
      const approveTx = await nftContract.approve(exchangeAddress, tokenId);
      await approveTx.wait();
      showStatus('NFT 승인 완료. 거래를 생성합니다...', 'info');
    }
    
    // 거래 생성
    const exchangeContract = new ethers.Contract(exchangeAddress, exchangeABI, signer);
    const tx = await exchangeContract.createTrade(tokenId, ethers.utils.parseEther(price));
    
    showStatus('트랜잭션 전송됨. 확인 대기 중...', 'info');
    
    await tx.wait();
    
    showStatus(`거래 생성 완료! 트랜잭션 해시: ${tx.hash}`, 'success');
    
    document.getElementById('createTradeForm').reset();
    
  } catch (error) {
    console.error('거래 생성 오류:', error);
    showStatus(`거래 생성 실패: ${error.message}`, 'error');
  }
}
```

### NFT 구매 UI

```html
<!-- 활성 거래 목록 -->
<div id="activeTradesTab" class="tab-content">
    <h3>활성 거래 목록</h3>
    <div id="activeTradesList"></div>
</div>
```

### NFT 구매 JavaScript

```javascript
async function loadActiveTrades() {
  try {
    const response = await fetch('/api/exchange/active-trades?limit=20');
    const data = await response.json();
    
    if (data.success) {
      displayActiveTrades(data.data.trades);
    } else {
      throw new Error(data.error || '거래 목록 조회 실패');
    }
  } catch (error) {
    console.error('거래 목록 조회 오류:', error);
    showStatus(`거래 목록 조회 실패: ${error.message}`, 'error');
  }
}

async function buyNFT(tradeId, price) {
  try {
    showStatus('NFT를 구매하는 중...', 'info');
    
    if (!currentAccount) {
      throw new Error('MetaMask 지갑을 먼저 연결해주세요');
    }
    
    // TORE 토큰 승인 확인
    const toreTokenContract = new ethers.Contract(toreTokenAddress, toreTokenABI, signer);
    const allowance = await toreTokenContract.allowance(currentAccount, exchangeAddress);
    const priceWei = ethers.utils.parseEther(price);
    
    if (allowance.lt(priceWei)) {
      // TORE 토큰 승인 필요
      const approveTx = await toreTokenContract.approve(exchangeAddress, priceWei);
      await approveTx.wait();
      showStatus('TORE 토큰 승인 완료. 구매를 진행합니다...', 'info');
    }
    
    // NFT 구매
    const exchangeContract = new ethers.Contract(exchangeAddress, exchangeABI, signer);
    const tx = await exchangeContract.buyNFT(tradeId);
    
    showStatus('트랜잭션 전송됨. 확인 대기 중...', 'info');
    
    await tx.wait();
    
    showStatus(`NFT 구매 완료! 트랜잭션 해시: ${tx.hash}`, 'success');
    
    // 거래 목록 새로고침
    loadActiveTrades();
    
  } catch (error) {
    console.error('NFT 구매 오류:', error);
    showStatus(`NFT 구매 실패: ${error.message}`, 'error');
  }
}
```

---

## 🔒 보안 및 최적화

### ReentrancyGuard

```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ToreExchange is Ownable, ReentrancyGuard {
    function buyNFT(uint256 tradeId) external nonReentrant {
        // 거래 로직
    }
}
```

**ReentrancyGuard의 역할:**
- **재진입 공격 방지**: 함수 실행 중 다른 함수 호출 방지
- **원자성 보장**: 거래가 완전히 완료되거나 완전히 실패
- **자금 보호**: 토큰 전송 중 중복 실행 방지

### 입력 검증

```solidity
function createTrade(uint256 tokenId, uint256 price) external nonReentrant {
    require(price > 0, "ToreExchange: Price must be greater than 0");
    require(nftContract.ownerOf(tokenId) == msg.sender, "ToreExchange: Not the owner of this NFT");
    require(nftContract.getApproved(tokenId) == address(this) || 
            nftContract.isApprovedForAll(msg.sender, address(this)), 
            "ToreExchange: Contract not approved to transfer NFT");
}
```

**검증 항목:**
- **가격 검증**: 가격이 0보다 큰지 확인
- **소유권 검증**: 호출자가 NFT 소유자인지 확인
- **승인 검증**: 컨트랙트가 NFT를 전송할 수 있는지 확인

### 가스 최적화

```solidity
// 효율적인 반복문
for (uint256 i = 0; i < recipients.length; i++) {
    require(recipients[i] != address(0), "ToreExchange: Invalid recipient address");
    require(amounts[i] > 0, "ToreExchange: Amount must be greater than 0");
    
    _transfer(msg.sender, recipients[i], amounts[i]);
}
```

**최적화 기법:**
- **배치 처리**: 여러 작업을 한 번에 처리
- **상태 변수 최소화**: 필요한 상태만 저장
- **이벤트 최적화**: 필요한 정보만 이벤트에 포함

---

## 🚀 배포 및 설정

### 거래소 배포

```bash
# Fuji 테스트넷 배포
npm run deploy:exchange:fuji

# Avalanche 메인넷 배포
npm run deploy:exchange:avalanche
```

### 배포 스크립트

```typescript
// scripts/deployToreExchange.ts
async function main() {
  const [deployer] = await ethers.getSigners();
  
  const nftContractAddress = process.env.NFT_CONTRACT_ADDRESS;
  const toreTokenAddress = process.env.TORE_TOKEN_ADDRESS;
  
  if (!nftContractAddress || !toreTokenAddress) {
    throw new Error("NFT_CONTRACT_ADDRESS and TORE_TOKEN_ADDRESS are required");
  }
  
  const ToreExchange = await ethers.getContractFactory("ToreExchange");
  const contract = await ToreExchange.deploy(nftContractAddress, toreTokenAddress, deployer.address);
  
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("ToreExchange deployed to:", address);
}
```

### 환경 변수 설정

```env
# 거래소 설정
TORE_EXCHANGE_ADDRESS=0x...
TORE_EXCHANGE_OWNER=0x...

# 연동 컨트랙트
NFT_CONTRACT_ADDRESS=0x...
TORE_TOKEN_ADDRESS=0x...
```

### 배포 후 설정

```typescript
// 거래소를 TORE 토큰에 추가
await toreToken.addExchangeContract(exchangeAddress);

// 거래소 수수료 설정 (선택사항)
await exchange.updateFee(250); // 2.5%
```

---

## 📋 다음 단계

이제 NFT-TORE 거래소 시스템을 이해했으니, 다음 가이드에서는 전체 시스템의 통합 및 최적화에 대해 알아보겠습니다.

**다음 가이드**: [시스템 통합 및 최적화](./NFT_BLOCKCHAIN_PROJECT_GUIDE_13_시스템통합.md)

---

## 💡 핵심 정리

1. **거래소는 NFT와 TORE 토큰 간의 거래를 중개하는 플랫폼입니다.**
2. **거래 생성, 구매, 취소의 전체 생명주기를 관리합니다.**
3. **수수료 시스템을 통해 거래소 운영비를 확보합니다.**
4. **ReentrancyGuard와 입력 검증으로 보안을 강화합니다.**
5. **백엔드 API와 프론트엔드 UI를 통해 완전한 거래소 시스템을 제공합니다.**
