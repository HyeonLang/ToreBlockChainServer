# NFT 블록체인 프로젝트 완전 가이드 - 2편: 프로젝트 구조 및 폴더 설명

## 📚 목차
1. [전체 폴더 구조](#전체-폴더-구조)
2. [루트 폴더 파일들](#루트-폴더-파일들)
3. [백엔드 폴더 구조](#백엔드-폴더-구조)
4. [프론트엔드 폴더 구조](#프론트엔드-폴더-구조)
5. [블록체인 관련 폴더](#블록체인-관련-폴더)
6. [빌드 및 배포 폴더](#빌드-및-배포-폴더)
7. [설정 파일들](#설정-파일들)

---

## 📁 전체 폴더 구조

```
ToreBlockChainServer/
├── 📁 contracts/                 # 스마트 컨트랙트 소스 코드
├── 📁 scripts/                   # 배포 스크립트
├── 📁 src/                       # 백엔드 서버 소스 코드
├── 📁 public/                    # 프론트엔드 웹 파일들
├── 📁 artifacts/                 # 컴파일된 스마트 컨트랙트
├── 📁 cache/                     # Hardhat 캐시 파일
├── 📁 dist/                      # 빌드된 서버 파일
├── 📁 node_modules/              # NPM 패키지들
├── 📄 package.json               # 프로젝트 설정 및 의존성
├── 📄 tsconfig.json              # TypeScript 설정
├── 📄 hardhat.config.cjs         # Hardhat 설정
├── 📄 .env                       # 환경 변수 (보안상 숨김)
└── 📄 README.md                  # 프로젝트 설명서
```

---

## 📄 루트 폴더 파일들

### 1. package.json
**역할**: 프로젝트의 메타데이터와 의존성 관리

```json
{
  "name": "hardhat-ts-express-template",
  "version": "0.1.0",
  "description": "Hardhat + TypeScript + Express template with ERC721 GameItem",
  "scripts": {
    "build": "tsc -b",                    // TypeScript 컴파일
    "dev": "tsx watch src/app.ts",        // 개발 서버 실행
    "start": "node dist/app.js",          // 프로덕션 서버 실행
    "compile": "hardhat compile",         // 스마트 컨트랙트 컴파일
    "deploy:fuji": "hardhat run scripts/deploy.ts --network fuji"
  }
}
```

**주요 스크립트 설명:**
- `npm run dev`: 개발 모드로 서버 실행 (코드 변경 시 자동 재시작)
- `npm run build`: TypeScript를 JavaScript로 컴파일
- `npm run start`: 컴파일된 서버 실행
- `npm run compile`: 스마트 컨트랙트 컴파일
- `npm run deploy:fuji`: Fuji 테스트넷에 배포

### 2. tsconfig.json
**역할**: TypeScript 컴파일러 설정

```json
{
  "compilerOptions": {
    "target": "ES2020",           // 컴파일 대상 JavaScript 버전
    "module": "ESNext",           // 모듈 시스템
    "moduleResolution": "node",   // 모듈 해석 방식
    "outDir": "./dist",           // 컴파일 결과물 저장 폴더
    "rootDir": "./src",           // 소스 코드 루트 폴더
    "strict": true,               // 엄격한 타입 검사
    "esModuleInterop": true       // ES 모듈 호환성
  }
}
```

### 3. hardhat.config.cjs
**역할**: Hardhat 블록체인 개발 도구 설정

```javascript
const config = {
  solidity: {
    version: "0.8.26",            // Solidity 버전
    settings: { 
      optimizer: { 
        enabled: true,            // 코드 최적화
        runs: 200 
      } 
    }
  },
  networks: {
    fuji: { 
      url: FUJI_RPC_URL,          // Fuji 테스트넷 RPC URL
      accounts: [PRIVATE_KEY]     // 배포용 개인키
    }
  }
};
```

### 4. .env (환경 변수 파일)
**역할**: 보안이 필요한 설정값들을 저장

```env
# 블록체인 설정
PRIVATE_KEY=0x...                 # 배포용 개인키 (절대 공개 금지!)
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
CONTRACT_ADDRESS=0x...            # 배포된 컨트랙트 주소

# 서버 설정
PORT=3000                         # 서버 포트
NODE_ENV=development              # 실행 환경

# API 보안
API_KEY=your-secret-api-key       # API 인증 키
```

**⚠️ 보안 주의사항:**
- `.env` 파일은 절대 Git에 올리지 마세요!
- `PRIVATE_KEY`는 절대 공개하지 마세요!
- 실제 돈이 있는 지갑의 개인키는 사용하지 마세요!

---

## 🖥 백엔드 폴더 구조 (src/)

```
src/
├── 📄 app.ts                     # 메인 서버 파일 (진입점)
├── 📁 controllers/               # API 컨트롤러들
│   ├── 📄 nftController.ts       # NFT 관련 API 처리
│   └── 📄 authController.ts      # 인증 관련 API 처리
├── 📁 routes/                    # API 라우트 정의
│   ├── 📄 nft.ts                # NFT API 라우트
│   ├── 📄 v1.ts                 # v1 API 라우트
│   └── 📄 auth.ts               # 인증 API 라우트
├── 📁 middleware/                # 미들웨어 (인증, 에러 처리 등)
│   ├── 📄 auth.ts               # API 키 인증
│   ├── 📄 jwtAuth.ts            # JWT 인증
│   ├── 📄 rateLimit.ts          # 요청 제한
│   └── 📄 errorHandler.ts       # 에러 처리
├── 📁 utils/                     # 유틸리티 함수들
│   ├── 📄 contract.ts           # 블록체인 연결 유틸
│   └── 📄 jwt.ts                # JWT 토큰 처리
└── 📁 v1/                       # v1 API 컨트롤러
    └── 📄 controllers.ts        # v1 API 컨트롤러
```

### 1. app.ts (메인 서버 파일)
**역할**: Express 서버의 진입점

```typescript
import express from "express";
import nftRouter from "./routes/nft";
import authRouter from "./routes/auth";

const app = express();

// JSON 파싱 미들웨어
app.use(express.json());

// 정적 파일 서빙 (HTML, CSS, JS)
app.use(express.static("public"));

// 라우터 등록
app.use("/api/nft", nftRouter);
app.use("/api/auth", authRouter);

// 서버 시작
app.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});
```

**주요 기능:**
- Express 서버 초기화
- 미들웨어 설정 (JSON 파싱, 정적 파일 서빙)
- 라우터 등록
- 서버 시작

### 2. controllers/ 폴더
**역할**: API 요청을 처리하는 비즈니스 로직

#### nftController.ts
```typescript
export async function mintNftController(req: Request, res: Response) {
  try {
    const { to, tokenURI } = req.body;
    
    // 입력값 검증
    if (!to || !tokenURI) {
      return res.status(400).json({ error: "Invalid input" });
    }
    
    // 블록체인 컨트랙트 호출
    const contract = await getContract();
    const tx = await contract.mint(to, tokenURI);
    
    // 결과 반환
    res.json({ txHash: tx.hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

**주요 컨트롤러:**
- `mintNftController`: NFT 생성
- `transferNftController`: NFT 전송
- `burnNftController`: NFT 삭제
- `getNftController`: NFT 조회
- `getWalletNftsController`: 지갑 NFT 목록 조회

#### authController.ts
```typescript
export async function loginController(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    
    // 사용자 인증
    const user = await authenticateUser(username, password);
    
    // JWT 토큰 생성
    const tokens = generateTokenPair(user);
    
    res.json({ success: true, ...tokens });
  } catch (error) {
    res.status(401).json({ error: "Authentication failed" });
  }
}
```

### 3. routes/ 폴더
**역할**: API 엔드포인트 정의 및 라우팅

#### nft.ts
```typescript
import { Router } from "express";
import { mintNftController } from "../controllers/nftController";

const router = Router();

// POST /api/nft/mint
router.post("/mint", mintNftController);

// GET /api/nft/:tokenId
router.get("/:tokenId", getNftController);

export default router;
```

**주요 라우트:**
- `POST /api/nft/mint`: NFT 생성
- `POST /api/nft/transfer`: NFT 전송
- `POST /api/nft/burn`: NFT 삭제
- `GET /api/nft/:tokenId`: NFT 조회
- `GET /api/nft/wallet`: 지갑 NFT 목록

### 4. middleware/ 폴더
**역할**: 요청 처리 전후에 실행되는 미들웨어

#### auth.ts (API 키 인증)
```typescript
export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.header("x-api-key");
  const configuredKey = process.env.API_KEY;
  
  if (!configuredKey) {
    return next(); // API 키가 설정되지 않으면 인증 생략
  }
  
  if (apiKey !== configuredKey) {
    return res.status(401).json({ error: "Invalid API key" });
  }
  
  next(); // 인증 성공
}
```

#### jwtAuth.ts (JWT 인증)
```typescript
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  } else {
    res.status(401).json({ error: "No token provided" });
  }
}
```

### 5. utils/ 폴더
**역할**: 재사용 가능한 유틸리티 함수들

#### contract.ts (블록체인 연결)
```typescript
export async function getContract() {
  const address = process.env.CONTRACT_ADDRESS;
  const wallet = await getWallet();
  
  const contract = new ethers.Contract(address, abi, wallet);
  return contract;
}

export async function getWallet() {
  const privateKey = process.env.PRIVATE_KEY;
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  
  return new ethers.Wallet(privateKey, provider);
}
```

#### jwt.ts (JWT 토큰 처리)
```typescript
export function generateTokenPair(user: User) {
  const accessToken = jwt.sign(user, ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(user, REFRESH_SECRET, { expiresIn: '7d' });
  
  return { accessToken, refreshToken };
}
```

---

## 🌐 프론트엔드 폴더 구조 (public/)

```
public/
├── 📄 index.html                 # 메인 웹 페이지
└── 📁 js/
    └── 📄 nft.js                # NFT 관련 JavaScript
```

### 1. index.html
**역할**: 웹 페이지의 구조와 디자인

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>NFT 관리 시스템</title>
    <style>
        /* CSS 스타일 */
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 NFT 관리 시스템</h1>
        
        <!-- 탭 메뉴 -->
        <div class="tabs">
            <button class="tab active" onclick="switchTab('create')">생성</button>
            <button class="tab" onclick="switchTab('transfer')">전송</button>
            <button class="tab" onclick="switchTab('delete')">삭제</button>
        </div>
        
        <!-- NFT 생성 폼 -->
        <div id="createTab" class="tab-content active">
            <form id="mintForm">
                <input type="text" id="recipientAddress" placeholder="받는 주소">
                <input type="url" id="tokenURI" placeholder="메타데이터 URI">
                <button type="submit">NFT 생성하기</button>
            </form>
        </div>
    </div>
    
    <script src="js/nft.js"></script>
</body>
</html>
```

**주요 구성 요소:**
- **헤더**: 페이지 제목과 설명
- **탭 메뉴**: 생성, 전송, 삭제, 조회 기능
- **폼**: 사용자 입력을 받는 인터페이스
- **상태 표시**: 성공/실패 메시지 표시
- **로그 패널**: 상세한 실행 로그

### 2. js/nft.js
**역할**: 웹 페이지의 동적 기능 구현

```javascript
class NFTMinter {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contractAddress = null;
        
        this.init();
    }
    
    async init() {
        // DOM 요소 참조
        this.elements = {
            form: document.getElementById('mintForm'),
            recipientAddress: document.getElementById('recipientAddress'),
            tokenURI: document.getElementById('tokenURI')
        };
        
        // 이벤트 리스너 등록
        this.elements.form.addEventListener('submit', (e) => this.handleMint(e));
        
        // 서버 상태 확인
        await this.checkServerStatus();
    }
    
    async connectWallet() {
        // MetaMask 연결
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.signer = this.provider.getSigner();
    }
    
    async createNFT(to, tokenURI) {
        // 서버 API 호출
        const response = await fetch('/api/nft/mint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, tokenURI })
        });
        
        return await response.json();
    }
}
```

**주요 기능:**
- **지갑 연결**: MetaMask와 연결
- **API 호출**: 서버와 통신
- **폼 처리**: 사용자 입력 처리
- **상태 관리**: 로딩, 성공, 실패 상태 표시
- **에러 처리**: 오류 메시지 표시

---

## ⛓ 블록체인 관련 폴더

### 1. contracts/ 폴더
**역할**: 스마트 컨트랙트 소스 코드

```
contracts/
└── 📄 GameItem.sol               # NFT 스마트 컨트랙트
```

#### GameItem.sol
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
}
```

**주요 기능:**
- **ERC721 표준**: NFT 표준 구현
- **URI 저장**: 메타데이터 URI 저장
- **소유자 권한**: 민팅/소각 권한 제어
- **자동 ID 관리**: 토큰 ID 자동 증가

### 2. scripts/ 폴더
**역할**: 스마트 컨트랙트 배포 스크립트

```
scripts/
└── 📄 deploy.ts                  # 배포 스크립트
```

#### deploy.ts
```typescript
import { ethers } from "hardhat";

async function main() {
  // 컨트랙트 팩토리 가져오기
  const GameItem = await ethers.getContractFactory("GameItem");
  
  // 컨트랙트 배포
  const gameItem = await GameItem.deploy(
    "GameItem",           // NFT 이름
    "GMI",               // NFT 심볼
    deployer.address     // 초기 소유자
  );
  
  await gameItem.waitForDeployment();
  
  console.log("GameItem deployed to:", await gameItem.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

---

## 📦 빌드 및 배포 폴더

### 1. artifacts/ 폴더
**역할**: 컴파일된 스마트 컨트랙트 파일들

```
artifacts/
├── 📁 contracts/
│   └── 📁 GameItem.sol/
│       ├── 📄 GameItem.json      # ABI와 바이트코드
│       └── 📄 GameItem.dbg.json  # 디버그 정보
└── 📁 build-info/                # 빌드 정보
```

**주요 파일:**
- **GameItem.json**: ABI(Application Binary Interface)와 바이트코드
- **GameItem.dbg.json**: 디버그 정보

### 2. dist/ 폴더
**역할**: 컴파일된 서버 파일들

```
dist/
├── 📄 app.js                     # 컴파일된 메인 서버 파일
├── 📁 controllers/               # 컴파일된 컨트롤러들
├── 📁 routes/                    # 컴파일된 라우트들
└── 📁 utils/                     # 컴파일된 유틸리티들
```

### 3. cache/ 폴더
**역할**: Hardhat 캐시 파일들

```
cache/
└── 📄 solidity-files-cache.json  # Solidity 파일 캐시
```

---

## ⚙️ 설정 파일들

### 1. nodemon.json
**역할**: 개발 서버 자동 재시작 설정

```json
{
  "watch": ["src"],
  "ext": "ts,js,json",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "tsx src/app.ts"
}
```

### 2. .gitignore
**역할**: Git에서 추적하지 않을 파일들

```
node_modules/
dist/
cache/
artifacts/
.env
*.log
```

---

## 📋 다음 단계

이제 프로젝트 구조를 이해했으니, 다음 가이드에서는 스마트 컨트랙트의 상세한 동작 원리에 대해 알아보겠습니다.

**다음 가이드**: [스마트 컨트랙트 상세 설명](./NFT_BLOCKCHAIN_PROJECT_GUIDE_3_스마트컨트랙트.md)

---

## 💡 핵심 정리

1. **프로젝트는 백엔드(src/), 프론트엔드(public/), 블록체인(contracts/)으로 구성됩니다.**
2. **각 폴더는 명확한 역할을 가지고 있으며, 체계적으로 구성되어 있습니다.**
3. **설정 파일들(package.json, tsconfig.json, hardhat.config.cjs)은 프로젝트의 동작을 제어합니다.**
4. **보안이 중요한 정보(.env)는 절대 공개하지 마세요.**
5. **빌드 폴더들(artifacts/, dist/)은 컴파일 결과물을 저장합니다.**
