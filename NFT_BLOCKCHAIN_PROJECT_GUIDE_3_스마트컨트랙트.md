# NFT 블록체인 프로젝트 완전 가이드 - 3편: 스마트 컨트랙트 상세 설명

## 📚 목차
1. [스마트 컨트랙트란?](#스마트-컨트랙트란)
2. [GameItem 컨트랙트 분석](#gameitem-컨트랙트-분석)
3. [ERC721 표준 이해](#erc721-표준-이해)
4. [컨트랙트 함수 상세 분석](#컨트랙트-함수-상세-분석)
5. [이벤트와 로그](#이벤트와-로그)
6. [배포 과정](#배포-과정)
7. [컨트랙트와 서버 연동](#컨트랙트와-서버-연동)

---

## 🤖 스마트 컨트랙트란?

### 기본 개념

**스마트 컨트랙트**는 블록체인 위에서 실행되는 자동화된 계약서입니다.

**일상생활 비유:**
- **자판기**: 돈을 넣고 버튼을 누르면 자동으로 음료가 나옴
- **스마트 컨트랙트**: 조건을 만족하면 자동으로 NFT가 생성되거나 전송됨

### 스마트 컨트랙트의 특징

1. **자동 실행**: 조건이 만족되면 자동으로 실행
2. **불변성**: 한번 배포되면 코드를 수정할 수 없음
3. **투명성**: 모든 코드와 실행 결과가 공개됨
4. **분산성**: 여러 노드에서 동일하게 실행됨
5. **가스비**: 실행할 때마다 수수료(가스비) 지불

### Solidity 언어

**Solidity**는 스마트 컨트랙트를 작성하는 프로그래밍 언어입니다.

```solidity
// 간단한 Solidity 예제
contract SimpleStorage {
    uint256 public storedData;  // 상태 변수
    
    function set(uint256 x) public {
        storedData = x;         // 함수
    }
    
    function get() public view returns (uint256) {
        return storedData;      // 조회 함수
    }
}
```

**주요 특징:**
- **정적 타입**: 변수의 타입을 미리 지정
- **상태 변수**: 컨트랙트에 영구 저장되는 데이터
- **함수**: 컨트랙트의 기능을 구현
- **가시성**: public, private, internal, external

---

## 🎮 GameItem 컨트랙트 분석

### 전체 구조

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameItem is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    
    constructor(string memory name_, string memory symbol_, address initialOwner) 
        ERC721(name_, symbol_) 
        Ownable(initialOwner) {}
    
    function mint(address to, string memory tokenURI_) external onlyOwner returns (uint256 tokenId) {
        tokenId = ++_nextTokenId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
    }
    
    function burn(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
    }
    
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId + 1;
    }
}
```

### 상속 구조

```
GameItem
├── ERC721URIStorage (NFT 표준 + URI 저장)
│   └── ERC721 (기본 NFT 표준)
│       └── IERC721 (NFT 인터페이스)
└── Ownable (소유자 권한 관리)
```

**상속의 장점:**
- **코드 재사용**: 검증된 라이브러리 사용
- **보안**: OpenZeppelin의 안전한 구현 활용
- **표준 준수**: ERC721 표준을 완벽히 준수

### 상태 변수

```solidity
uint256 private _nextTokenId;  // 다음에 생성될 토큰 ID
```

**상태 변수란?**
- 블록체인에 영구 저장되는 데이터
- 컨트랙트의 상태를 나타냄
- 가스비를 지불해야 수정 가능

**`_nextTokenId`의 역할:**
- 새로운 NFT를 생성할 때 사용할 ID를 추적
- 1부터 시작하여 자동으로 증가
- 중복 방지 및 고유성 보장

---

## 🏷 ERC721 표준 이해

### ERC721이란?

**ERC721**은 이더리움에서 NFT를 만드는 표준 규격입니다.

**ERC721의 핵심 기능:**
1. **소유권 관리**: 누가 어떤 NFT를 소유하는지 추적
2. **전송 기능**: NFT를 다른 주소로 전송
3. **승인 기능**: 다른 주소가 NFT를 전송할 수 있도록 승인
4. **메타데이터**: NFT의 정보(이름, 설명, 이미지 등) 연결

### ERC721의 주요 함수

```solidity
// 기본 ERC721 함수들
function ownerOf(uint256 tokenId) public view returns (address);  // 소유자 조회
function balanceOf(address owner) public view returns (uint256);  // 소유 NFT 개수
function transferFrom(address from, address to, uint256 tokenId) public;  // 전송
function approve(address to, uint256 tokenId) public;  // 승인
function getApproved(uint256 tokenId) public view returns (address);  // 승인된 주소
```

### ERC721URIStorage 확장

**ERC721URIStorage**는 ERC721에 URI 저장 기능을 추가한 확장입니다.

```solidity
// ERC721URIStorage 추가 함수
function tokenURI(uint256 tokenId) public view returns (string memory);  // URI 조회
function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal;  // URI 설정
```

**URI의 역할:**
- NFT의 메타데이터 위치를 저장
- JSON 형태의 메타데이터를 가리킴
- IPFS, HTTP, HTTPS URL 사용 가능

### 메타데이터 예시

```json
{
  "name": "My Awesome NFT",
  "description": "This is a description of my NFT",
  "image": "https://example.com/image.png",
  "attributes": [
    {
      "trait_type": "Color",
      "value": "Blue"
    },
    {
      "trait_type": "Rarity",
      "value": "Legendary"
    }
  ]
}
```

---

## 🔧 컨트랙트 함수 상세 분석

### 1. 생성자 (Constructor)

```solidity
constructor(string memory name_, string memory symbol_, address initialOwner) 
    ERC721(name_, symbol_) 
    Ownable(initialOwner) {}
```

**실행 흐름:**
1. **ERC721 초기화**: NFT 컬렉션 이름과 심볼 설정
2. **Ownable 초기화**: 초기 소유자 설정
3. **상태 초기화**: `_nextTokenId`는 0으로 초기화

**매개변수:**
- `name_`: NFT 컬렉션 이름 (예: "GameItem")
- `symbol_`: NFT 컬렉션 심볼 (예: "GMI")
- `initialOwner`: 컨트랙트 소유자 주소

**실행 예시:**
```typescript
// 배포 시 호출
const gameItem = await GameItem.deploy(
  "GameItem",           // name_
  "GMI",               // symbol_
  deployer.address     // initialOwner
);
```

### 2. 민팅 함수 (mint)

```solidity
function mint(address to, string memory tokenURI_) external onlyOwner returns (uint256 tokenId) {
    tokenId = ++_nextTokenId;        // 1. 토큰 ID 할당 및 증가
    _safeMint(to, tokenId);          // 2. 안전한 민팅 실행
    _setTokenURI(tokenId, tokenURI_); // 3. URI 설정
}
```

**실행 흐름:**
1. **권한 확인**: `onlyOwner` 수정자로 소유자만 호출 가능
2. **토큰 ID 할당**: `_nextTokenId`를 1 증가시켜 새로운 ID 생성
3. **안전한 민팅**: `_safeMint`로 NFT 생성 (ERC721Receiver 확인)
4. **URI 설정**: `_setTokenURI`로 메타데이터 URI 저장

**매개변수:**
- `to`: NFT를 받을 주소
- `tokenURI_`: 메타데이터 URI

**반환값:**
- `tokenId`: 생성된 NFT의 고유 ID

**가스비:**
- 약 100,000-200,000 가스 (네트워크에 따라 다름)
- Avalanche Fuji 테스트넷: 약 $0.01-0.05

### 3. 소각 함수 (burn)

```solidity
function burn(uint256 tokenId) external onlyOwner {
    _burn(tokenId);  // NFT 완전 삭제
}
```

**실행 흐름:**
1. **권한 확인**: `onlyOwner` 수정자로 소유자만 호출 가능
2. **소각 실행**: `_burn`으로 NFT 완전 삭제
3. **상태 정리**: 소유권, URI, 승인 정보 모두 삭제

**매개변수:**
- `tokenId`: 삭제할 NFT의 ID

**주의사항:**
- **되돌릴 수 없음**: 한번 소각된 NFT는 복구 불가능
- **가스비**: 약 50,000-100,000 가스

### 4. 조회 함수 (nextTokenId)

```solidity
function nextTokenId() external view returns (uint256) {
    return _nextTokenId + 1;  // 다음에 생성될 토큰 ID
}
```

**실행 흐름:**
1. **상태 조회**: `_nextTokenId` 값 확인
2. **계산**: 현재 값 + 1 반환

**특징:**
- **view 함수**: 상태를 변경하지 않음
- **가스비 없음**: 조회만 하므로 가스비 불필요
- **실시간**: 항상 최신 상태 반영

---

## 📊 이벤트와 로그

### 이벤트란?

**이벤트**는 스마트 컨트랙트에서 발생한 중요한 사건을 기록하는 메커니즘입니다.

**이벤트의 특징:**
- **저장**: 블록체인에 영구 저장
- **검색**: 나중에 조회 가능
- **가스비**: 이벤트 발생 시 가스비 지불
- **인덱싱**: 효율적인 검색을 위한 인덱스 생성

### ERC721의 주요 이벤트

```solidity
// ERC721 표준 이벤트들
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
```

### Transfer 이벤트 상세

```solidity
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
```

**이벤트 발생 시점:**
- **민팅**: `from`이 `address(0)` (0x0000...0000)
- **전송**: `from`이 이전 소유자, `to`가 새 소유자
- **소각**: `to`가 `address(0)` (0x0000...0000)

**인덱스된 매개변수:**
- `indexed`: 검색 시 필터링 가능
- `from`, `to`, `tokenId` 모두 인덱스됨

### 이벤트 로그 예시

```javascript
// 민팅 시 발생하는 이벤트
{
  event: "Transfer",
  args: {
    from: "0x0000000000000000000000000000000000000000",  // 시스템 (민팅)
    to: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",    // 받는 주소
    tokenId: 1                                           // 토큰 ID
  },
  transactionHash: "0x1234...",
  blockNumber: 12345
}

// 전송 시 발생하는 이벤트
{
  event: "Transfer",
  args: {
    from: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",  // 보내는 주소
    to: "0x8ba1f109551bD432803012645Hac136c",             // 받는 주소
    tokenId: 1                                           // 토큰 ID
  },
  transactionHash: "0x5678...",
  blockNumber: 12346
}
```

### 이벤트 활용

**서버에서 이벤트 조회:**
```typescript
// 특정 토큰의 모든 전송 이력 조회
const filter = contract.filters.Transfer(null, null, tokenId);
const logs = await contract.queryFilter(filter);

// 특정 지갑의 모든 전송 이력 조회
const filter = contract.filters.Transfer(walletAddress, walletAddress);
const logs = await contract.queryFilter(filter);
```

---

## 🚀 배포 과정

### 1. 배포 스크립트 (deploy.ts)

```typescript
import { ethers } from "hardhat";

async function main() {
  // 배포자 정보 가져오기
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // 컨트랙트 팩토리 가져오기
  const GameItem = await ethers.getContractFactory("GameItem");
  
  // 컨트랙트 배포
  const gameItem = await GameItem.deploy(
    "GameItem",           // NFT 컬렉션 이름
    "GMI",               // NFT 컬렉션 심볼
    deployer.address     // 초기 소유자
  );
  
  // 배포 완료 대기
  await gameItem.waitForDeployment();
  
  // 결과 출력
  const address = await gameItem.getAddress();
  console.log("GameItem deployed to:", address);
  
  // 컨트랙트 정보 확인
  const name = await gameItem.name();
  const symbol = await gameItem.symbol();
  const owner = await gameItem.owner();
  
  console.log("Contract name:", name);
  console.log("Contract symbol:", symbol);
  console.log("Contract owner:", owner);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### 2. 배포 실행

```bash
# Fuji 테스트넷에 배포
npm run deploy:fuji

# 또는 직접 실행
npx hardhat run scripts/deploy.ts --network fuji
```

### 3. 배포 과정 상세

**1단계: 환경 설정**
```bash
# .env 파일에 설정
PRIVATE_KEY=0x...                    # 배포용 개인키
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
```

**2단계: 컴파일**
```bash
npx hardhat compile
# 결과: artifacts/contracts/GameItem.sol/GameItem.json 생성
```

**3단계: 배포 실행**
```bash
npx hardhat run scripts/deploy.ts --network fuji
```

**4단계: 배포 결과**
```
Deploying contracts with the account: 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
GameItem deployed to: 0x1234567890123456789012345678901234567890
Contract name: GameItem
Contract symbol: GMI
Contract owner: 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
```

**5단계: 환경 변수 설정**
```bash
# .env 파일에 컨트랙트 주소 추가
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
```

### 4. 배포 비용

**Avalanche Fuji 테스트넷:**
- **가스비**: 약 2,000,000 가스
- **가스 가격**: 25 gwei
- **총 비용**: 약 0.05 AVAX (테스트넷이므로 무료)

**Avalanche 메인넷:**
- **가스비**: 약 2,000,000 가스
- **가스 가격**: 25 gwei
- **총 비용**: 약 0.05 AVAX (약 $1-2)

---

## 🔗 컨트랙트와 서버 연동

### 1. 컨트랙트 인스턴스 생성

```typescript
// src/utils/contract.ts
import { ethers } from "ethers";
import abiJson from "../../artifacts/contracts/GameItem.sol/GameItem.json";

export async function getContract() {
  // 환경 변수에서 컨트랙트 주소 확인
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) {
    throw new Error("CONTRACT_ADDRESS is required");
  }
  
  // 지갑 인스턴스 생성
  const wallet = await getWallet();
  
  // 컨트랙트 인스턴스 생성
  const contract = new ethers.Contract(address, abiJson.abi, wallet);
  
  // 연결 확인
  const name = await contract.name();
  console.log(`Connected to contract: ${name}`);
  
  return contract;
}
```

### 2. ABI (Application Binary Interface)

**ABI란?**
- 컨트랙트와 상호작용하기 위한 인터페이스
- 함수명, 매개변수, 반환값 등의 정보 포함
- JSON 형태로 저장

**ABI 예시:**
```json
{
  "abi": [
    {
      "inputs": [
        {"name": "to", "type": "address"},
        {"name": "tokenURI_", "type": "string"}
      ],
      "name": "mint",
      "outputs": [
        {"name": "tokenId", "type": "uint256"}
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
}
```

### 3. 서버에서 컨트랙트 호출

```typescript
// src/controllers/nftController.ts
export async function mintNftController(req: Request, res: Response) {
  try {
    const { to, tokenURI } = req.body;
    
    // 컨트랙트 인스턴스 생성
    const contract = await getContract();
    
    // 민팅 트랜잭션 실행
    const tx = await contract.mint(to, tokenURI);
    console.log('Transaction sent:', tx.hash);
    
    // 트랜잭션 완료 대기
    const receipt = await tx.wait();
    console.log('Transaction mined:', receipt?.hash);
    
    // 결과 반환
    res.json({ 
      txHash: receipt?.hash ?? tx.hash,
      tokenId: tokenId  // 이벤트에서 추출
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### 4. 트랜잭션 처리 과정

**1단계: 트랜잭션 생성**
```typescript
const tx = await contract.mint(to, tokenURI);
// 결과: 트랜잭션 객체 (아직 블록에 포함되지 않음)
```

**2단계: 트랜잭션 전송**
```typescript
// 트랜잭션이 네트워크에 전송됨
// tx.hash로 트랜잭션 해시 확인 가능
```

**3단계: 트랜잭션 완료 대기**
```typescript
const receipt = await tx.wait();
// 결과: 트랜잭션 영수증 (블록에 포함됨)
```

**4단계: 이벤트 로그 파싱**
```typescript
// Transfer 이벤트에서 tokenId 추출
let tokenId = null;
if (receipt?.logs) {
  for (const log of receipt.logs) {
    const parsedLog = contract.interface.parseLog(log);
    if (parsedLog?.name === 'Transfer') {
      tokenId = Number(parsedLog.args[2]); // tokenId는 세 번째 인자
      break;
    }
  }
}
```

### 5. 에러 처리

```typescript
try {
  const tx = await contract.mint(to, tokenURI);
  const receipt = await tx.wait();
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    // 가스비 부족
    throw new Error('Insufficient funds for gas');
  } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
    // 가스 한도 예측 불가
    throw new Error('Transaction may fail');
  } else {
    // 기타 오류
    throw new Error(error.message);
  }
}
```

---

## 📋 다음 단계

이제 스마트 컨트랙트의 동작 원리를 이해했으니, 다음 가이드에서는 백엔드 서버의 구조와 API에 대해 자세히 알아보겠습니다.

**다음 가이드**: [백엔드 서버 구조 및 API 설명](./NFT_BLOCKCHAIN_PROJECT_GUIDE_4_백엔드서버.md)

---

## 💡 핵심 정리

1. **스마트 컨트랙트는 블록체인 위에서 실행되는 자동화된 계약서입니다.**
2. **GameItem 컨트랙트는 ERC721 표준을 준수하여 NFT를 생성, 관리합니다.**
3. **민팅, 소각, 조회 함수가 각각의 역할을 가지고 있습니다.**
4. **이벤트는 블록체인에 중요한 사건을 기록하는 메커니즘입니다.**
5. **배포 과정을 통해 컨트랙트를 블록체인에 올리고 서버와 연동합니다.**
