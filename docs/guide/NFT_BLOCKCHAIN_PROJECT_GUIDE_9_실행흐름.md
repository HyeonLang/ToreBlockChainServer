# NFT 블록체인 프로젝트 완전 가이드 - 9편: 실행 흐름 및 전체 동작 원리

## 📚 목차
1. [전체 시스템 아키텍처](#전체-시스템-아키텍처)
2. [NFT 생성 흐름](#nft-생성-흐름)
3. [NFT 전송 흐름](#nft-전송-흐름)
4. [NFT 조회 흐름](#nft-조회-흐름)
5. [인증 흐름](#인증-흐름)
6. [에러 처리 흐름](#에러-처리-흐름)
7. [데이터 흐름](#데이터-흐름)

---

## 🏗 전체 시스템 아키텍처

### 시스템 구성도

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   웹 브라우저    │    │   Express 서버   │    │  Avalanche 블록체인 │
│   (프론트엔드)   │◄──►│   (백엔드)      │◄──►│   (스마트 컨트랙트) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐            ┌────▼────┐            ┌────▼────┐
    │ MetaMask│            │ NFT API │            │GameItem │
    │  지갑   │            │ 컨트롤러│            │ 컨트랙트│
    └─────────┘            └─────────┘            └─────────┘
```

### 컴포넌트 역할

#### 1. 웹 브라우저 (프론트엔드)
- **역할**: 사용자 인터페이스 제공
- **기능**: 폼 입력, 결과 표시, MetaMask 연동
- **기술**: HTML, CSS, JavaScript, Ethers.js

#### 2. Express 서버 (백엔드)
- **역할**: API 서버 및 비즈니스 로직 처리
- **기능**: 요청 처리, 인증, 블록체인 상호작용
- **기술**: Node.js, TypeScript, Express.js

#### 3. Avalanche 블록체인
- **역할**: 데이터 저장 및 검증
- **기능**: NFT 생성, 전송, 삭제, 조회
- **기술**: Solidity, Smart Contract

#### 4. MetaMask 지갑
- **역할**: 사용자 지갑 및 트랜잭션 승인
- **기능**: 지갑 연결, 트랜잭션 서명, NFT 표시
- **기술**: Web3 Provider, Wallet API

---

## 🎨 NFT 생성 흐름

### 전체 흐름도

```
사용자 입력 → 웹 페이지 → Express 서버 → 스마트 컨트랙트 → 블록체인
     ↑                                                      ↓
지갑에 추가 ← MetaMask ← 트랜잭션 완료 ← 블록 생성 ← 트랜잭션 처리
```

### 상세 실행 흐름

#### 1단계: 사용자 입력
```javascript
// 사용자가 웹 페이지에서 입력
const to = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6";
const tokenURI = "https://ipfs.io/ipfs/QmYourMetadataHash";
```

#### 2단계: 프론트엔드 처리
```javascript
// public/js/nft.js
async function handleMint(event) {
    event.preventDefault();
    
    // 입력값 검증
    const validation = this.validateFormData({ to, tokenURI }, validationRules);
    if (!validation.isValid) {
        this.showStatus(validation.errors.join(', '), 'error');
        return;
    }
    
    // API 호출
    const mintResult = await this.createNFT(to, tokenURI);
}
```

#### 3단계: API 요청
```javascript
async function createNFT(to, tokenURI) {
    const response = await fetch('/api/nft/mint', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, tokenURI })
    });
    
    return await response.json();
}
```

#### 4단계: 백엔드 처리
```typescript
// src/controllers/nftController.ts
export async function mintNftController(req: Request, res: Response) {
    try {
        // 입력값 검증
        const { to, tokenURI } = req.body;
        if (!to || !tokenURI) {
            return res.status(400).json({ error: "Invalid input" });
        }
        
        // 블록체인 컨트랙트 연결
        const contract = await getContract();
        
        // NFT 민팅 트랜잭션 실행
        const tx = await contract.mint(to, tokenURI);
        
        // 트랜잭션 완료 대기
        const receipt = await tx.wait();
        
        // 결과 반환
        res.json({ 
            txHash: receipt?.hash ?? tx.hash,
            tokenId: tokenId,
            contractAddress: process.env.CONTRACT_ADDRESS
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
```

#### 5단계: 블록체인 처리
```solidity
// contracts/GameItem.sol
function mint(address to, string memory tokenURI_) external onlyOwner returns (uint256 tokenId) {
    tokenId = ++_nextTokenId;        // 토큰 ID 할당
    _safeMint(to, tokenId);          // NFT 생성
    _setTokenURI(tokenId, tokenURI_); // URI 설정
}
```

#### 6단계: 트랜잭션 완료
```typescript
// 트랜잭션 영수증에서 이벤트 파싱
let tokenId: number | null = null;
if (receipt?.logs) {
    for (const log of receipt.logs) {
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog?.name === 'Transfer') {
            tokenId = Number(parsedLog.args[2]);
            break;
        }
    }
}
```

#### 7단계: 지갑에 NFT 추가
```javascript
// MetaMask에 NFT 자동 추가
await window.ethereum.request({
    method: 'wallet_watchAsset',
    params: {
        type: 'ERC721',
        options: {
            address: contractAddress,
            tokenId: tokenId.toString(),
        },
    },
});
```

---

## 🔄 NFT 전송 흐름

### 전체 흐름도

```
사용자 입력 → 웹 페이지 → Express 서버 → 스마트 컨트랙트 → 블록체인
     ↑                                                      ↓
결과 표시 ← JSON 응답 ← 트랜잭션 완료 ← 블록 생성 ← 트랜잭션 처리
```

### 상세 실행 흐름

#### 1단계: 사용자 입력
```javascript
const from = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6";
const to = "0x8ba1f109551bD432803012645Hac136c";
const tokenId = 1;
```

#### 2단계: 프론트엔드 처리
```javascript
async function handleTransfer(event) {
    event.preventDefault();
    
    // 입력값 검증
    if (from.toLowerCase() === to.toLowerCase()) {
        this.showStatus('보내는 주소와 받는 주소가 같습니다.', 'error');
        return;
    }
    
    // API 호출
    const transferResult = await this.transferNFT(from, to, tokenId);
}
```

#### 3단계: API 요청
```javascript
async function transferNFT(from, to, tokenId) {
    const response = await fetch('/api/nft/transfer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, tokenId })
    });
    
    return await response.json();
}
```

#### 4단계: 백엔드 처리
```typescript
export async function transferNftController(req: Request, res: Response) {
    try {
        const { from, to, tokenId } = req.body;
        
        // 입력값 검증
        if (!from || !to || !tokenId) {
            return res.status(400).json({ error: "Invalid input" });
        }
        
        // 블록체인 컨트랙트 연결
        const contract = await getContract();
        
        // NFT 전송 트랜잭션 실행
        const tx = await contract.transferFrom(from, to, BigInt(tokenId));
        
        // 트랜잭션 완료 대기
        const receipt = await tx.wait();
        
        // 결과 반환
        res.json({ txHash: receipt?.hash ?? tx.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
```

#### 5단계: 블록체인 처리
```solidity
// ERC721 표준의 transferFrom 함수
function transferFrom(address from, address to, uint256 tokenId) public virtual override {
    _transfer(from, to, tokenId);
}
```

---

## 🔍 NFT 조회 흐름

### 전체 흐름도

```
사용자 요청 → 웹 페이지 → Express 서버 → 스마트 컨트랙트 → 블록체인
     ↑                                                      ↓
결과 표시 ← JSON 응답 ← 데이터 조회 ← 블록체인 조회 ← 이벤트 로그
```

### 상세 실행 흐름

#### 1단계: 사용자 요청
```javascript
const tokenId = 1; // 조회할 NFT ID
```

#### 2단계: 프론트엔드 처리
```javascript
async function handleInfo(event) {
    event.preventDefault();
    
    const tokenId = this.elements.infoTokenId.value.trim();
    
    // 입력값 검증
    const tokenIdNum = Number(tokenId);
    if (!Number.isInteger(tokenIdNum) || tokenIdNum < 0) {
        this.showStatus('올바른 토큰 ID를 입력해주세요.', 'error');
        return;
    }
    
    // API 호출
    const infoResult = await this.getNFTInfo(tokenId);
}
```

#### 3단계: API 요청
```javascript
async function getNFTInfo(tokenId) {
    const response = await fetch(`/api/nft/${tokenId}`);
    return await response.json();
}
```

#### 4단계: 백엔드 처리
```typescript
export async function getNftController(req: Request, res: Response) {
    try {
        const { tokenId } = req.params;
        
        // 입력값 검증
        const numeric = Number(tokenId);
        if (!Number.isInteger(numeric) || numeric < 0) {
            return res.status(400).json({ error: "Invalid tokenId" });
        }
        
        // 블록체인 컨트랙트 연결
        const contract = await getContract();
        
        // NFT 정보 조회 (가스 비용 없음 - view 함수)
        const [owner, tokenURI] = await Promise.all([
            contract.ownerOf(BigInt(tokenId)),
            contract.tokenURI(BigInt(tokenId))
        ]);
        
        // 결과 반환
        res.json({ 
            owner: owner,
            tokenURI: tokenURI
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
```

#### 5단계: 블록체인 조회
```solidity
// ERC721 표준의 view 함수들
function ownerOf(uint256 tokenId) public view virtual override returns (address) {
    return _ownerOf(tokenId);
}

function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    return _tokenURI(tokenId);
}
```

---

## 🔐 인증 흐름

### JWT 인증 흐름

#### 1단계: 로그인 요청
```javascript
const loginData = {
    username: "admin",
    password: "password"
};
```

#### 2단계: 비밀번호 검증
```typescript
export async function loginController(req: Request, res: Response) {
    try {
        const { username, password } = req.body;
        
        // 사용자 검색
        const user = users.find(u => u.username === username);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // 비밀번호 검증 (bcrypt.compare)
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // JWT 토큰 생성
        const tokens = generateTokenPair({
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        });
        
        res.json({
            success: true,
            ...tokens,
            user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
}
```

#### 3단계: 토큰 생성
```typescript
export function generateTokenPair(payload: JWTPayload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
        expiresIn: '15m'  // 15분
    });
    
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: '7d'   // 7일
    });
    
    return { accessToken, refreshToken, expiresIn: 900 };
}
```

#### 4단계: 토큰 사용
```javascript
// 프론트엔드에서 토큰 저장
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);

// API 요청 시 토큰 포함
const response = await fetch('/api/nft/mint', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
    },
    body: JSON.stringify({ to, tokenURI })
});
```

#### 5단계: 토큰 검증
```typescript
export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const token = authHeader.substring(7);
        
        // JWT 토큰 검증
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
        
        // 사용자 정보를 요청 객체에 추가
        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role
        };
        
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: 'Token expired' });
        } else {
            return res.status(401).json({ error: 'Invalid token' });
        }
    }
}
```

---

## ⚠️ 에러 처리 흐름

### 에러 처리 계층

```
사용자 입력 → 프론트엔드 검증 → 백엔드 검증 → 블록체인 처리 → 에러 응답
     ↑                                                              ↓
에러 표시 ← 에러 메시지 ← JSON 응답 ← 에러 처리 ← 예외 발생
```

### 상세 에러 처리 흐름

#### 1단계: 프론트엔드 검증
```javascript
// 입력값 검증
const validation = this.validateFormData({ to, tokenURI }, validationRules);
if (!validation.isValid) {
    this.showStatus(validation.errors.join(', '), 'error');
    return;
}
```

#### 2단계: 백엔드 검증
```typescript
// 컨트롤러에서 입력값 검증
if (!to || typeof to !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(to)) {
    return res.status(400).json({ error: "Invalid 'to' address" });
}
```

#### 3단계: 블록체인 에러 처리
```typescript
try {
    const tx = await contract.mint(to, tokenURI);
    const receipt = await tx.wait();
    res.json({ txHash: receipt?.hash ?? tx.hash });
} catch (err: any) {
    console.error('[mint] error:', err);
    return res.status(500).json({ error: err.message || "Mint failed" });
}
```

#### 4단계: 전역 에러 처리
```typescript
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
    console.error('[Error Handler]', err);
    
    let status = 500;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    
    if (err.name === 'ValidationError') {
        status = 400;
        message = 'Validation error';
        code = 'VALIDATION_ERROR';
    } else if (err.name === 'UnauthorizedError') {
        status = 401;
        message = 'Unauthorized';
        code = 'UNAUTHORIZED';
    }
    
    res.status(status).json({
        error: message,
        code: code,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}
```

---

## 📊 데이터 흐름

### 데이터 흐름도

```
사용자 입력 → 프론트엔드 → 백엔드 → 블록체인 → 데이터베이스
     ↑                                                      ↓
결과 표시 ← JSON 응답 ← 데이터 처리 ← 트랜잭션 완료 ← 상태 저장
```

### 데이터 변환 과정

#### 1단계: 사용자 입력
```javascript
// 사용자가 입력한 데이터
const userInput = {
    to: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    tokenURI: "https://ipfs.io/ipfs/QmYourMetadataHash"
};
```

#### 2단계: 프론트엔드 처리
```javascript
// 입력값 검증 및 변환
const validatedData = {
    to: userInput.to.toLowerCase(),
    tokenURI: userInput.tokenURI.trim()
};
```

#### 3단계: HTTP 요청
```javascript
// JSON으로 직렬화
const requestBody = JSON.stringify(validatedData);
```

#### 4단계: 백엔드 처리
```typescript
// JSON 파싱
const { to, tokenURI } = req.body as { to: string; tokenURI: string };

// 타입 변환
const contract = await getContract();
```

#### 5단계: 블록체인 처리
```solidity
// Solidity 함수 호출
function mint(address to, string memory tokenURI_) external onlyOwner returns (uint256 tokenId) {
    tokenId = ++_nextTokenId;
    _safeMint(to, tokenId);
    _setTokenURI(tokenId, tokenURI_);
}
```

#### 6단계: 응답 생성
```typescript
// 결과 객체 생성
const response = {
    txHash: receipt?.hash ?? tx.hash,
    tokenId: tokenId,
    contractAddress: process.env.CONTRACT_ADDRESS
};

// JSON으로 직렬화
res.json(response);
```

#### 7단계: 프론트엔드 표시
```javascript
// 응답 데이터 처리
if (mintResult.success) {
    this.showStatus(`민팅 성공! 토큰 ID: ${mintResult.tokenId}`, 'success');
    await this.addNFTToWallet(mintResult.contractAddress, mintResult.tokenId);
} else {
    this.showStatus('민팅 실패: ' + mintResult.error, 'error');
}
```

---

## 📋 다음 단계

이제 실행 흐름과 전체 동작 원리를 이해했으니, 마지막 가이드에서는 문제 해결과 FAQ에 대해 알아보겠습니다.

**다음 가이드**: [문제 해결 및 FAQ](./NFT_BLOCKCHAIN_PROJECT_GUIDE_10_문제해결.md)

---

## 💡 핵심 정리

1. **전체 시스템은 웹 브라우저, Express 서버, 블록체인이 연결되어 작동합니다.**
2. **NFT 생성은 사용자 입력부터 블록체인 저장까지 여러 단계를 거칩니다.**
3. **인증 시스템은 JWT 토큰을 통해 사용자 인증을 관리합니다.**
4. **에러 처리는 각 계층에서 적절한 검증과 처리를 수행합니다.**
5. **데이터는 사용자 입력부터 블록체인 저장까지 변환 과정을 거칩니다.**
