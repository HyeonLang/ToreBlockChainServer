# NFT 블록체인 프로젝트 완전 가이드 - 11편: TORE 토큰 시스템

## 📚 목차
1. [TORE 토큰 시스템 개요](#tore-토큰-시스템-개요)
2. [ERC20 표준 이해](#erc20-표준-이해)
3. [ToreToken 컨트랙트 분석](#toretoken-컨트랙트-분석)
4. [TORE 토큰 기능 상세](#tore-토큰-기능-상세)
5. [게임 통합 기능](#게임-통합-기능)
6. [거래소 연동](#거래소-연동)
7. [백엔드 API 구현](#백엔드-api-구현)
8. [프론트엔드 통합](#프론트엔드-통합)

---

## 🪙 TORE 토큰 시스템 개요

### TORE 토큰이란?

**TORE 토큰**은 게임 내에서 화폐처럼 작동하는 ERC20 표준 토큰입니다.

**주요 특징:**
- **총 공급량**: 10억개 (1,000,000,000 TORE)
- **소수점**: 18자리 (이더리움 표준)
- **민팅 가능**: 소유자만 추가 발행 가능
- **게임 통합**: 게임 내 보상 지급 시스템
- **거래소 지원**: NFT와의 거래 기능

### NFT와의 차이점

| 구분 | NFT (ERC721) | TORE 토큰 (ERC20) |
|------|-------------|------------------|
| **성격** | 대체 불가능 | 대체 가능 |
| **용도** | 고유한 아이템 | 화폐/포인트 |
| **예시** | 게임 아이템, 아트 | 게임 코인, 포인트 |
| **전송** | 개별 전송 | 양으로 전송 |
| **가치** | 각각 다름 | 동일한 가치 |

### 시스템 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   게임 서버     │    │   Express 서버   │    │  Avalanche 블록체인 │
│   (인게임)      │◄──►│   (백엔드)      │◄──►│   (스마트 컨트랙트) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐            ┌────▼────┐            ┌────▼────┐
    │ 게임 매니저│            │ TORE API │            │ToreToken│
    │  지갑   │            │ 컨트롤러│            │ 컨트랙트│
    └─────────┘            └─────────┘            └─────────┘
```

---

## 🏷 ERC20 표준 이해

### ERC20이란?

**ERC20**은 이더리움에서 대체 가능한 토큰을 만드는 표준 규격입니다.

**ERC20의 핵심 기능:**
1. **잔액 관리**: 각 주소의 토큰 잔액 추적
2. **전송 기능**: 토큰을 다른 주소로 전송
3. **승인 기능**: 다른 주소가 토큰을 전송할 수 있도록 승인
4. **총 공급량**: 전체 토큰의 총량 관리

### ERC20의 주요 함수

```solidity
// 기본 ERC20 함수들
function totalSupply() public view returns (uint256);  // 총 공급량
function balanceOf(address account) public view returns (uint256);  // 잔액 조회
function transfer(address to, uint256 amount) public returns (bool);  // 전송
function allowance(address owner, address spender) public view returns (uint256);  // 승인량 조회
function approve(address spender, uint256 amount) public returns (bool);  // 승인
function transferFrom(address from, address to, uint256 amount) public returns (bool);  // 승인된 전송
```

### ERC20의 주요 이벤트

```solidity
// ERC20 표준 이벤트들
event Transfer(address indexed from, address indexed to, uint256 value);
event Approval(address indexed owner, address indexed spender, uint256 value);
```

### Transfer 이벤트 상세

```solidity
event Transfer(address indexed from, address indexed to, uint256 value);
```

**이벤트 발생 시점:**
- **민팅**: `from`이 `address(0)` (0x0000...0000)
- **전송**: `from`이 이전 소유자, `to`가 새 소유자
- **소각**: `to`가 `address(0)` (0x0000...0000)

**인덱스된 매개변수:**
- `from`, `to`, `value` 모두 인덱스됨
- 효율적인 검색을 위한 필터링 가능

---

## 🔧 ToreToken 컨트랙트 분석

### 전체 구조

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ToreToken is ERC20, Ownable {
    uint8 private constant DECIMALS = 18;
    uint256 private constant INITIAL_SUPPLY = 1000000000 * 10**DECIMALS; // 10억개
    
    mapping(address => bool) public gameContracts;
    mapping(address => bool) public gameManagers;
    mapping(address => bool) public exchangeContracts;
    
    constructor(address initialOwner) ERC20("Tore Token", "TORE") Ownable(initialOwner) {
        _mint(initialOwner, INITIAL_SUPPLY);
    }
    
    function distributeGameReward(address player, uint256 amount) external;
    function exchangeTransfer(address from, address to, uint256 amount) external;
    function mint(address to, uint256 amount) external onlyOwner;
    function burn(uint256 amount) external onlyOwner;
}
```

### 상속 구조

```
ToreToken
├── ERC20 (기본 토큰 표준)
│   └── IERC20 (토큰 인터페이스)
└── Ownable (소유자 권한 관리)
```

**상속의 장점:**
- **코드 재사용**: 검증된 OpenZeppelin 라이브러리 사용
- **보안**: 안전한 토큰 구현 활용
- **표준 준수**: ERC20 표준을 완벽히 준수

### 상태 변수

```solidity
uint8 private constant DECIMALS = 18;  // 소수점 자릿수
uint256 private constant INITIAL_SUPPLY = 1000000000 * 10**DECIMALS;  // 초기 공급량

mapping(address => bool) public gameContracts;   // 게임 컨트랙트 주소들
mapping(address => bool) public gameManagers;   // 게임 매니저 주소들
mapping(address => bool) public exchangeContracts;  // 거래소 컨트랙트 주소들
```

**상태 변수 설명:**
- **DECIMALS**: 토큰의 소수점 자릿수 (18자리)
- **INITIAL_SUPPLY**: 초기 공급량 (10억개)
- **gameContracts**: 게임 컨트랙트 주소 관리
- **gameManagers**: 게임 매니저 주소 관리
- **exchangeContracts**: 거래소 컨트랙트 주소 관리

---

## 🎮 TORE 토큰 기능 상세

### 1. 생성자 (Constructor)

```solidity
constructor(address initialOwner) ERC20("Tore Token", "TORE") Ownable(initialOwner) {
    _mint(initialOwner, INITIAL_SUPPLY);
}
```

**실행 흐름:**
1. **ERC20 초기화**: 토큰 이름 "Tore Token", 심볼 "TORE" 설정
2. **Ownable 초기화**: 초기 소유자 설정
3. **초기 민팅**: 소유자에게 10억개 토큰 민팅

**매개변수:**
- `initialOwner`: 토큰의 초기 소유자 주소

### 2. 게임 보상 지급 (distributeGameReward)

```solidity
function distributeGameReward(address player, uint256 amount) external {
    require(
        gameContracts[msg.sender] || gameManagers[msg.sender] || msg.sender == owner(),
        "ToreToken: Only authorized game contracts or managers"
    );
    require(player != address(0), "ToreToken: Invalid player address");
    require(amount > 0, "ToreToken: Amount must be greater than 0");
    
    _mint(player, amount);
    emit GameRewardDistributed(player, amount);
}
```

**실행 흐름:**
1. **권한 확인**: 게임 컨트랙트, 매니저, 또는 소유자만 호출 가능
2. **입력 검증**: 플레이어 주소와 금액 유효성 확인
3. **토큰 민팅**: 플레이어에게 새로운 토큰 민팅
4. **이벤트 발생**: 보상 지급 이벤트 발생

**사용 예시:**
```typescript
// 게임에서 플레이어에게 보상 지급
await toreToken.distributeGameReward(playerAddress, ethers.parseEther("100"));
```

### 3. 거래소 전송 (exchangeTransfer)

```solidity
function exchangeTransfer(address from, address to, uint256 amount) external {
    require(exchangeContracts[msg.sender], "ToreToken: Only authorized exchange contracts");
    require(from != address(0), "ToreToken: Invalid from address");
    require(to != address(0), "ToreToken: Invalid to address");
    require(amount > 0, "ToreToken: Amount must be greater than 0");
    
    _transfer(from, to, amount);
}
```

**실행 흐름:**
1. **권한 확인**: 승인된 거래소 컨트랙트만 호출 가능
2. **입력 검증**: 주소와 금액 유효성 확인
3. **토큰 전송**: 거래소를 통해 토큰 전송

**사용 예시:**
```typescript
// 거래소에서 NFT 구매 시 토큰 전송
await toreToken.exchangeTransfer(buyerAddress, sellerAddress, price);
```

### 4. 토큰 민팅 (mint)

```solidity
function mint(address to, uint256 amount) external onlyOwner {
    require(to != address(0), "ToreToken: Invalid address");
    require(amount > 0, "ToreToken: Amount must be greater than 0");
    
    _mint(to, amount);
    emit TokensMinted(to, amount);
}
```

**실행 흐름:**
1. **권한 확인**: 소유자만 호출 가능
2. **입력 검증**: 주소와 금액 유효성 확인
3. **토큰 민팅**: 새로운 토큰 생성
4. **이벤트 발생**: 민팅 이벤트 발생

### 5. 토큰 소각 (burn)

```solidity
function burn(uint256 amount) external onlyOwner {
    require(amount > 0, "ToreToken: Amount must be greater than 0");
    require(balanceOf(msg.sender) >= amount, "ToreToken: Insufficient balance");
    
    _burn(msg.sender, amount);
    emit TokensBurned(msg.sender, amount);
}
```

**실행 흐름:**
1. **권한 확인**: 소유자만 호출 가능
2. **입력 검증**: 금액과 잔액 유효성 확인
3. **토큰 소각**: 토큰 영구 삭제
4. **이벤트 발생**: 소각 이벤트 발생

---

## 🎯 게임 통합 기능

### 게임 컨트랙트 관리

```solidity
function addGameContract(address contractAddress) external onlyOwner {
    require(contractAddress != address(0), "ToreToken: Invalid contract address");
    gameContracts[contractAddress] = true;
    emit GameContractAdded(contractAddress);
}

function removeGameContract(address contractAddress) external onlyOwner {
    gameContracts[contractAddress] = false;
    emit GameContractRemoved(contractAddress);
}
```

**게임 컨트랙트의 역할:**
- **자동화된 보상**: 게임 내 이벤트에 따라 자동으로 토큰 지급
- **보안**: 승인된 컨트랙트만 토큰 민팅 가능
- **투명성**: 모든 보상 지급이 블록체인에 기록

### 게임 매니저 관리

```solidity
function addGameManager(address managerAddress) external onlyOwner {
    require(managerAddress != address(0), "ToreToken: Invalid manager address");
    gameManagers[managerAddress] = true;
    emit GameManagerAdded(managerAddress);
}

function removeGameManager(address managerAddress) external onlyOwner {
    gameManagers[managerAddress] = false;
    emit GameManagerRemoved(managerAddress);
}
```

**게임 매니저의 역할:**
- **수동 보상**: 게임 관리자가 직접 플레이어에게 보상 지급
- **이벤트 보상**: 특별 이벤트나 프로모션 보상
- **지원 보상**: 고객 지원을 통한 보상 지급

### 배치 전송

```solidity
function batchTransfer(address[] calldata recipients, uint256[] calldata amounts) external {
    require(
        gameContracts[msg.sender] || gameManagers[msg.sender] || msg.sender == owner(),
        "ToreToken: Only authorized game contracts or managers"
    );
    require(recipients.length == amounts.length, "ToreToken: Arrays length mismatch");
    require(recipients.length > 0, "ToreToken: Empty arrays");
    
    uint256 totalAmount = 0;
    for (uint256 i = 0; i < amounts.length; i++) {
        totalAmount += amounts[i];
    }
    
    require(balanceOf(msg.sender) >= totalAmount, "ToreToken: Insufficient balance");
    
    for (uint256 i = 0; i < recipients.length; i++) {
        require(recipients[i] != address(0), "ToreToken: Invalid recipient address");
        require(amounts[i] > 0, "ToreToken: Amount must be greater than 0");
        
        _transfer(msg.sender, recipients[i], amounts[i]);
    }
    
    emit BatchTransferCompleted(totalAmount, recipients.length);
}
```

**배치 전송의 장점:**
- **효율성**: 여러 전송을 한 번에 처리
- **가스비 절약**: 개별 전송보다 저렴
- **원자성**: 모든 전송이 성공하거나 모두 실패

---

## 🏪 거래소 연동

### 거래소 컨트랙트 관리

```solidity
function addExchangeContract(address contractAddress) external onlyOwner {
    require(contractAddress != address(0), "ToreToken: Invalid contract address");
    exchangeContracts[contractAddress] = true;
    emit ExchangeContractAdded(contractAddress);
}

function removeExchangeContract(address contractAddress) external onlyOwner {
    exchangeContracts[contractAddress] = false;
    emit ExchangeContractRemoved(contractAddress);
}
```

**거래소 연동의 장점:**
- **자동화**: 거래소에서 자동으로 토큰 전송
- **보안**: 승인된 거래소만 토큰 전송 가능
- **투명성**: 모든 거래가 블록체인에 기록

### 거래소 전송 과정

```
1. 사용자가 거래소에서 NFT 구매 요청
2. 거래소가 TORE 토큰 잔액 확인
3. 거래소가 exchangeTransfer() 호출
4. 토큰이 구매자에서 판매자로 전송
5. NFT 소유권이 구매자로 이전
```

---

## 🖥 백엔드 API 구현

### TORE 토큰 컨트롤러

```typescript
// src/controllers/toreTokenController.ts
export async function getBalance(req: Request, res: Response) {
  try {
    const { address } = req.params;
    
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }
    
    const balance = await getTokenBalance(address);
    
    res.json({
      success: true,
      data: {
        address,
        balance,
        symbol: 'TORE'
      }
    });
  } catch (error) {
    console.error('[ToreToken Controller] Get balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get token balance'
    });
  }
}
```

### TORE 토큰 유틸리티

```typescript
// src/utils/toreToken.ts
export async function getTokenBalance(address: string): Promise<string> {
  try {
    const contract = await getToreTokenContract();
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error('[ToreToken] Failed to get balance:', error);
    throw error;
  }
}

export async function transferTokens(to: string, amount: string): Promise<string> {
  try {
    const contract = await getToreTokenContractWithWallet();
    const decimals = await contract.decimals();
    const amountWei = ethers.parseUnits(amount, decimals);
    
    const tx = await contract.transfer(to, amountWei);
    await tx.wait();
    
    console.log(`[ToreToken] Transfer completed: ${amount} TORE to ${to}`);
    return tx.hash;
  } catch (error) {
    console.error('[ToreToken] Failed to transfer tokens:', error);
    throw error;
  }
}
```

### API 엔드포인트

```typescript
// src/routes/toreToken.ts
router.get('/balance/:address', getBalance);
router.post('/transfer', transfer);
router.post('/mint', mint);
router.post('/burn', burn);
router.post('/reward', distributeReward);
router.post('/batch-transfer', batchTransferTokens);
router.get('/info', getTokenInfo);
router.get('/history/:address', getTransferHistory);
```

---

## 🌐 프론트엔드 통합

### TORE 토큰 JavaScript

```javascript
// public/js/toreToken.js
async function handleToreBalanceQuery(event) {
  event.preventDefault();
  
  const address = document.getElementById('toreBalanceAddress').value;
  
  try {
    showStatus('TORE 잔액을 조회하는 중...', 'info');
    
    const response = await fetch(`/api/tore/balance/${address}`);
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('toreBalanceWalletAddress').textContent = data.data.address;
      document.getElementById('toreBalanceAmount').textContent = data.data.balance;
      document.getElementById('toreBalanceResult').classList.remove('hidden');
      
      showStatus(`TORE 잔액 조회 완료: ${data.data.balance} TORE`, 'success');
    } else {
      throw new Error(data.error || 'TORE 잔액 조회 실패');
    }
  } catch (error) {
    console.error('TORE 잔액 조회 오류:', error);
    showStatus(`TORE 잔액 조회 실패: ${error.message}`, 'error');
  }
}
```

### TORE 토큰 전송

```javascript
async function handleToreTransfer(event) {
  event.preventDefault();
  
  const to = document.getElementById('toreTransferTo').value;
  const amount = document.getElementById('toreTransferAmount').value;
  
  try {
    showStatus('TORE 전송 중...', 'info');
    
    if (!currentAccount) {
      throw new Error('MetaMask 지갑을 먼저 연결해주세요');
    }
    
    const toreTokenAddress = '0x...'; // 실제 TORE 토큰 컨트랙트 주소
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    const tokenABI = [
      "function transfer(address to, uint256 amount) returns (bool)"
    ];
    
    const tokenContract = new ethers.Contract(toreTokenAddress, tokenABI, signer);
    
    const tx = await tokenContract.transfer(to, ethers.utils.parseUnits(amount, 18));
    
    showStatus('트랜잭션 전송됨. 확인 대기 중...', 'info');
    
    await tx.wait();
    
    showStatus(`TORE 전송 완료! 트랜잭션 해시: ${tx.hash}`, 'success');
    
    document.getElementById('toreTransferForm').reset();
    
  } catch (error) {
    console.error('TORE 전송 오류:', error);
    showStatus(`TORE 전송 실패: ${error.message}`, 'error');
  }
}
```

### 전송 내역 조회

```javascript
async function handleToreHistoryQuery(event) {
  event.preventDefault();
  
  const address = document.getElementById('toreHistoryAddress').value;
  
  try {
    showStatus('TORE 전송 내역을 조회하는 중...', 'info');
    
    const response = await fetch(`/api/tore/history/${address}`);
    const data = await response.json();
    
    if (data.success) {
      displayToreHistory(data.data.transfers);
      document.getElementById('toreHistoryResult').classList.remove('hidden');
      
      showStatus(`TORE 전송 내역 조회 완료: ${data.data.count}건`, 'success');
    } else {
      throw new Error(data.error || 'TORE 전송 내역 조회 실패');
    }
  } catch (error) {
    console.error('TORE 전송 내역 조회 오류:', error);
    showStatus(`TORE 전송 내역 조회 실패: ${error.message}`, 'error');
  }
}
```

---

## 🚀 배포 및 설정

### TORE 토큰 배포

```bash
# Fuji 테스트넷 배포
npm run deploy:tore:fuji

# Avalanche 메인넷 배포
npm run deploy:tore:avalanche
```

### 환경 변수 설정

```env
# TORE 토큰 설정
TORE_TOKEN_ADDRESS=0x...
TORE_TOKEN_OWNER=0x...

# 거래소 설정
TORE_EXCHANGE_ADDRESS=0x...
TORE_EXCHANGE_OWNER=0x...
```

### 배포 후 설정

```typescript
// 거래소 컨트랙트를 TORE 토큰에 추가
await toreToken.addExchangeContract(exchangeAddress);

// 게임 컨트랙트를 TORE 토큰에 추가
await toreToken.addGameContract(gameContractAddress);

// 게임 매니저를 TORE 토큰에 추가
await toreToken.addGameManager(gameManagerAddress);
```

---

## 📋 다음 단계

이제 TORE 토큰 시스템을 이해했으니, 다음 가이드에서는 NFT와 TORE 토큰 간의 거래소 시스템에 대해 자세히 알아보겠습니다.

**다음 가이드**: [NFT-TORE 거래소 시스템](./NFT_BLOCKCHAIN_PROJECT_GUIDE_12_거래소시스템.md)

---

## 💡 핵심 정리

1. **TORE 토큰은 게임 내 화폐로 작동하는 ERC20 표준 토큰입니다.**
2. **총 공급량은 10억개이며, 민팅과 소각이 가능합니다.**
3. **게임 컨트랙트와 매니저를 통한 자동화된 보상 시스템을 지원합니다.**
4. **거래소 연동을 통해 NFT와의 거래가 가능합니다.**
5. **백엔드 API와 프론트엔드 UI를 통해 완전한 토큰 관리 시스템을 제공합니다.**
