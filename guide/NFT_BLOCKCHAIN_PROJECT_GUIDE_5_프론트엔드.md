# NFT 블록체인 프로젝트 완전 가이드 - 5편: 프론트엔드 웹 인터페이스 설명

## 📚 목차
1. [프론트엔드 개요](#프론트엔드-개요)
2. [HTML 구조 분석](#html-구조-분석)
3. [CSS 스타일링](#css-스타일링)
4. [JavaScript 기능 구현](#javascript-기능-구현)
5. [MetaMask 연동](#metamask-연동)
6. [API 통신](#api-통신)
7. [사용자 인터페이스](#사용자-인터페이스)
8. [에러 처리 및 상태 관리](#에러-처리-및-상태-관리)

---

## 🌐 프론트엔드 개요

### 프론트엔드의 역할

**프론트엔드**는 사용자가 직접 상호작용하는 웹 인터페이스입니다.

**주요 기능:**
1. **사용자 인터페이스**: 직관적이고 사용하기 쉬운 UI 제공
2. **MetaMask 연동**: 블록체인 지갑과 연결
3. **API 통신**: 백엔드 서버와 데이터 교환
4. **상태 관리**: 사용자 입력과 시스템 상태 관리
5. **에러 처리**: 사용자에게 친화적인 에러 메시지 표시

### 기술 스택

- **HTML5**: 웹 페이지 구조
- **CSS3**: 스타일링 및 레이아웃
- **Vanilla JavaScript**: 동적 기능 구현
- **Ethers.js**: 블록체인 상호작용
- **MetaMask**: 지갑 연동

### 파일 구조

```
public/
├── 📄 index.html                 # 메인 웹 페이지
└── 📁 js/
    └── 📄 nft.js                # NFT 관련 JavaScript
```

---

## 📄 HTML 구조 분석

### 메인 HTML 파일 (index.html)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NFT 관리 시스템</title>
    <style>
        /* CSS 스타일이 여기에 포함됨 */
    </style>
</head>
<body>
    <div class="container">
        <!-- 헤더 섹션 -->
        <div class="header">
            <h1>🎨 NFT 관리 시스템</h1>
            <p>NFT 생성, 전송, 삭제를 한 곳에서 관리하세요</p>
        </div>

        <!-- 지갑 정보 섹션 -->
        <div id="walletInfo" class="wallet-info hidden">
            <h3>연결된 지갑</h3>
            <div id="walletAddress" class="wallet-address"></div>
        </div>

        <!-- 탭 메뉴 -->
        <div class="tabs">
            <button class="tab active" onclick="switchTab('create')">생성</button>
            <button class="tab" onclick="switchTab('transfer')">전송</button>
            <button class="tab" onclick="switchTab('delete')">삭제</button>
            <button class="tab" onclick="switchTab('info')">개별조회</button>
            <button class="tab" onclick="switchTab('wallet')">지갑조회</button>
            <button class="tab" onclick="switchTab('nftHistory')">NFT거래이력</button>
            <button class="tab" onclick="switchTab('walletHistory')">지갑거래이력</button>
        </div>

        <!-- 탭 콘텐츠들 -->
        <div id="createTab" class="tab-content active">
            <!-- NFT 생성 폼 -->
        </div>
        
        <div id="transferTab" class="tab-content">
            <!-- NFT 전송 폼 -->
        </div>
        
        <!-- 상태 표시 및 로그 패널 -->
        <div id="status" class="status hidden"></div>
        <div id="logPanel" class="status info"></div>
    </div>

    <!-- 외부 라이브러리 -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js"></script>
    <script src="js/nft.js"></script>
    <script>
        // 탭 전환 함수
        function switchTab(tabName) {
            // 탭 전환 로직
        }
    </script>
</body>
</html>
```

### HTML 구조 분석

#### 1. 헤더 섹션
```html
<div class="header">
    <h1>🎨 NFT 관리 시스템</h1>
    <p>NFT 생성, 전송, 삭제를 한 곳에서 관리하세요</p>
</div>
```
- **역할**: 페이지 제목과 설명
- **스타일**: 중앙 정렬, 큰 폰트 크기

#### 2. 지갑 정보 섹션
```html
<div id="walletInfo" class="wallet-info hidden">
    <h3>연결된 지갑</h3>
    <div id="walletAddress" class="wallet-address"></div>
</div>
```
- **역할**: 연결된 MetaMask 지갑 주소 표시
- **초기 상태**: `hidden` 클래스로 숨김
- **동적 업데이트**: JavaScript로 연결 시 표시

#### 3. 탭 메뉴
```html
<div class="tabs">
    <button class="tab active" onclick="switchTab('create')">생성</button>
    <button class="tab" onclick="switchTab('transfer')">전송</button>
    <button class="tab" onclick="switchTab('delete')">삭제</button>
    <!-- ... 더 많은 탭들 ... -->
</div>
```
- **역할**: 기능별 탭 메뉴
- **활성 탭**: `active` 클래스로 표시
- **이벤트**: `onclick`으로 탭 전환

#### 4. 탭 콘텐츠
```html
<div id="createTab" class="tab-content active">
    <form id="mintForm">
        <div class="form-group">
            <label for="recipientAddress">받는 주소 (지갑 주소)</label>
            <input type="text" id="recipientAddress" placeholder="0x..." required 
                   pattern="^0x[a-fA-F0-9]{40}$" 
                   title="0x로 시작하는 42자리 이더리움 주소를 입력하세요">
        </div>
        <div class="form-group">
            <label for="tokenURI">토큰 URI (메타데이터 URL)</label>
            <input type="url" id="tokenURI" placeholder="https://..." required>
        </div>
        <button type="button" id="connectBtn" class="btn">메타마스크 지갑 연결</button>
        <button type="submit" id="mintBtn" class="btn">NFT 생성하기</button>
    </form>
</div>
```
- **역할**: 각 기능별 폼과 입력 필드
- **폼 검증**: HTML5 `required`, `pattern` 속성 사용
- **버튼**: 지갑 연결, 기능 실행 버튼

---

## 🎨 CSS 스타일링

### 전체 레이아웃

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.container {
    background: white;
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    max-width: 600px;
    width: 100%;
}
```

**스타일 특징:**
- **그라데이션 배경**: 보라색 그라데이션
- **중앙 정렬**: `flexbox`로 화면 중앙 배치
- **카드 디자인**: 흰색 배경, 둥근 모서리, 그림자
- **반응형**: 모바일과 데스크톱 모두 지원

### 탭 메뉴 스타일

```css
.tabs {
    display: flex;
    margin-bottom: 20px;
    border-bottom: 2px solid #e1e5e9;
}

.tab {
    flex: 1;
    padding: 15px;
    text-align: center;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    color: #666;
    transition: all 0.3s ease;
}

.tab.active {
    color: #667eea;
    border-bottom: 3px solid #667eea;
}

.tab-content {
    display: none;
}

.tab-content.active {
    display: block;
}
```

**탭 스타일 특징:**
- **플렉스 레이아웃**: 탭들이 균등하게 배치
- **활성 상태**: 파란색 텍스트와 하단 보더
- **전환 효과**: `transition`으로 부드러운 애니메이션
- **콘텐츠 전환**: `display: none/block`으로 탭 콘텐츠 전환

### 폼 스타일

```css
.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: #333;
    font-weight: 600;
}

.form-group input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e1e5e9;
    border-radius: 10px;
    font-size: 16px;
    transition: border-color 0.3s ease;
}

.form-group input:focus {
    outline: none;
    border-color: #667eea;
}

.btn {
    width: 100%;
    padding: 15px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}
```

**폼 스타일 특징:**
- **입력 필드**: 둥근 모서리, 포커스 시 파란색 보더
- **버튼**: 그라데이션 배경, 호버 시 위로 이동 효과
- **비활성 상태**: 회색 배경, 클릭 불가
- **전환 효과**: 부드러운 애니메이션

### 상태 표시 스타일

```css
.status {
    margin-top: 20px;
    padding: 15px;
    border-radius: 10px;
    font-weight: 500;
}

.status.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.status.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.status.info {
    background: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
}

.loading {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 10px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

**상태 스타일 특징:**
- **성공**: 초록색 배경과 텍스트
- **에러**: 빨간색 배경과 텍스트
- **정보**: 파란색 배경과 텍스트
- **로딩**: 회전하는 스피너 애니메이션

---

## ⚡ JavaScript 기능 구현

### NFTMinter 클래스 구조

```javascript
class NFTMinter {
    constructor() {
        this.provider = null;        // 이더리움 프로바이더
        this.signer = null;          // 서명자 (지갑)
        this.contractAddress = null; // 컨트랙트 주소
        this.contractABI = null;     // 컨트랙트 ABI
        
        this.init();                 // 초기화
    }

    async init() {
        try {
            console.log('[NFTMinter] Initializing NFT Minter...');
            
            // DOM 요소들 참조 설정
            this.elements = {
                // 폼 요소들
                form: document.getElementById('mintForm'),
                connectBtn: document.getElementById('connectBtn'),
                recipientAddress: document.getElementById('recipientAddress'),
                tokenURI: document.getElementById('tokenURI'),
                mintBtn: document.getElementById('mintBtn'),
                
                // 상태 표시 요소들
                status: document.getElementById('status'),
                walletInfo: document.getElementById('walletInfo'),
                walletAddress: document.getElementById('walletAddress'),
                logPanel: document.getElementById('logPanel'),
                
                // 로딩 표시 요소들
                btnText: document.getElementById('btnText'),
                btnLoading: document.getElementById('btnLoading')
            };

            // 이벤트 리스너 등록
            this.elements.form.addEventListener('submit', (e) => this.handleMint(e));
            this.elements.connectBtn.addEventListener('click', () => this.connectWallet());
            
            // 서버 상태 확인
            await this.checkServerStatus();
            
            // 컨트랙트 주소 가져오기
            await this.getContractAddress().catch(() => {});
            
            console.log('[NFTMinter] Initialization completed successfully');
            
        } catch (error) {
            console.error('[NFTMinter] Initialization failed:', error);
            this.showStatus('초기화 중 오류가 발생했습니다: ' + error.message, 'error');
        }
    }
}
```

### 초기화 과정

**1단계: DOM 요소 참조**
```javascript
this.elements = {
    form: document.getElementById('mintForm'),
    connectBtn: document.getElementById('connectBtn'),
    // ... 더 많은 요소들
};
```

**2단계: 이벤트 리스너 등록**
```javascript
this.elements.form.addEventListener('submit', (e) => this.handleMint(e));
this.elements.connectBtn.addEventListener('click', () => this.connectWallet());
```

**3단계: 서버 상태 확인**
```javascript
await this.checkServerStatus();
```

**4단계: 컨트랙트 주소 가져오기**
```javascript
await this.getContractAddress();
```

### MetaMask 연동

#### 지갑 연결 함수

```javascript
async connectWallet() {
    try {
        // 메타마스크가 설치되어 있는지 확인
        if (typeof window.ethereum === 'undefined') {
            this.showStatus('메타마스크가 설치되어 있지 않습니다. 메타마스크를 설치해주세요.', 'error');
            return false;
        }

        // 지갑 연결 요청
        this.log('Requesting wallet connection...');
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        if (accounts.length === 0) {
            this.showStatus('지갑 연결이 취소되었습니다.', 'error');
            return false;
        }

        // Provider 및 Signer 설정
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.signer = this.provider.getSigner();
        
        // 연결된 주소 표시
        const address = await this.signer.getAddress();
        this.log('Connected address: ' + address);
        this.elements.walletAddress.textContent = address;
        this.elements.walletInfo.classList.remove('hidden');
        
        // 받는 주소 필드에 연결된 주소 자동 입력
        this.elements.recipientAddress.value = address;
        
        // 예시 토큰 URI 설정
        if (!this.elements.tokenURI.value) {
            this.elements.tokenURI.value = 'https://ipfs.io/ipfs/QmYourMetadataHash';
        }
        
        this.showStatus('지갑이 성공적으로 연결되었습니다!', 'success');
        return true;

    } catch (error) {
        this.showStatus('지갑 연결 실패: ' + (error && error.message ? error.message : String(error)), 'error');
        this.log('connectWallet error: ' + (error && error.stack ? error.stack : String(error)));
        return false;
    }
}
```

**연결 과정:**
1. **MetaMask 설치 확인**: `window.ethereum` 존재 여부 확인
2. **연결 요청**: `eth_requestAccounts` 메서드로 지갑 연결
3. **Provider 설정**: Web3Provider로 이더리움 네트워크 연결
4. **Signer 설정**: 지갑의 서명 기능 활성화
5. **UI 업데이트**: 연결된 주소 표시 및 폼 자동 입력

#### 지갑에 NFT 자동 추가

```javascript
async addNFTToWallet(contractAddress, tokenId) {
    try {
        this.showStatus('지갑에 NFT를 추가하는 팝업을 호출합니다...', 'info');
        this.log('wallet_watchAsset address=' + contractAddress + ' tokenId=' + tokenId);
        
        if (!contractAddress) {
            throw new Error('컨트랙트 주소를 확인할 수 없습니다.');
        }

        // 사이트 권한 확보 (연결 필요 시 팝업 노출)
        try { await this.connectWallet(); } catch (_) {}

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

        this.showStatus('NFT가 성공적으로 지갑에 추가되었습니다! 🎉', 'success');
        
    } catch (error) {
        if (error && error.code === 4001) {
            this.showStatus('지갑 추가가 취소되었습니다.', 'info');
        } else {
            this.showStatus('지갑 추가 실패: ' + (error && error.message ? error.message : String(error)), 'error');
            this.log('wallet_watchAsset error: ' + (error && error.stack ? error.stack : String(error)));
        }
    }
}
```

**자동 추가 과정:**
1. **권한 확인**: 지갑 연결 상태 확인
2. **NFT 추가 요청**: `wallet_watchAsset` 메서드 호출
3. **사용자 승인**: MetaMask 팝업에서 사용자 승인
4. **지갑 업데이트**: NFT가 지갑에 자동으로 추가됨

---

## 🌐 API 통신

### 서버 상태 확인

```javascript
async checkServerStatus() {
    try {
        const response = await fetch('/health');
        const data = await response.json();
        
        if (data.ok) {
            this.log('서버 연결 상태: 정상');
        } else {
            this.showStatus('서버 상태를 확인할 수 없습니다.', 'error');
        }
    } catch (error) {
        this.showStatus('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.', 'error');
        this.log('Server health check failed: ' + error.message);
    }
}
```

### 컨트랙트 주소 가져오기

```javascript
async getContractAddress() {
    try {
        const response = await fetch('/api/nft/address');
        const data = await response.json();
        
        if (data.address) {
            this.contractAddress = data.address;
            console.log('컨트랙트 주소:', this.contractAddress);
            this.log('컨트랙트 주소: ' + this.contractAddress);
        } else {
            throw new Error('컨트랙트 주소를 가져올 수 없습니다.');
        }
    } catch (error) {
        this.showStatus('컨트랙트 주소를 가져올 수 없습니다: ' + error.message, 'error');
        throw new Error('서버 연결 실패: ' + error.message);
    }
}
```

### NFT 생성 API 호출

```javascript
async createNFT(to, tokenURI) {
    try {
        this.log('Creating NFT... to=' + to + ' tokenURI=' + tokenURI);
        
        const response = await fetch('/api/nft/mint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ to, tokenURI })
        });

        const data = await response.json();
        this.log('Create NFT response: ' + JSON.stringify(data));

        if (!response.ok) {
            let errorMessage = 'NFT 생성 실패';
            if (data.error) {
                errorMessage = data.error;
            } else if (data.message) {
                errorMessage = data.message;
            } else if (response.status === 400) {
                errorMessage = '잘못된 요청입니다. 입력값을 확인해주세요.';
            } else if (response.status === 500) {
                errorMessage = '서버 내부 오류가 발생했습니다.';
            }
            return {
                success: false,
                error: errorMessage
            };
        }

        return {
            success: true,
            txHash: data.txHash,
            tokenId: data.tokenId,
            contractAddress: data.contractAddress
        };

    } catch (error) {
        this.log('Network error: ' + error.message);
        return {
            success: false,
            error: '네트워크 연결을 확인해주세요: ' + (error && error.message ? error.message : String(error))
        };
    }
}
```

**API 호출 과정:**
1. **요청 준비**: HTTP 메서드, 헤더, 본문 설정
2. **요청 전송**: `fetch` API로 서버에 요청
3. **응답 처리**: JSON 파싱 및 상태 코드 확인
4. **에러 처리**: 다양한 에러 상황에 대한 처리
5. **결과 반환**: 성공/실패 여부와 데이터 반환

### NFT 조회 API 호출

```javascript
async getNFTInfo(tokenId) {
    try {
        this.log('Getting NFT info... tokenId=' + tokenId);
        
        const response = await fetch(`/api/nft/${tokenId}`);
        const data = await response.json();
        
        this.log('Get NFT info response: ' + JSON.stringify(data));

        if (!response.ok) {
            let errorMessage = 'NFT 정보 조회 실패';
            if (data.error) {
                errorMessage = data.error;
            } else if (data.message) {
                errorMessage = data.message;
            } else if (response.status === 400) {
                errorMessage = '잘못된 요청입니다. 토큰 ID를 확인해주세요.';
            } else if (response.status === 404) {
                errorMessage = '해당 NFT를 찾을 수 없습니다.';
            } else if (response.status === 500) {
                errorMessage = '서버 내부 오류가 발생했습니다.';
            }
            return {
                success: false,
                error: errorMessage
            };
        }

        return {
            success: true,
            owner: data.owner,
            tokenURI: data.tokenURI
        };

    } catch (error) {
        this.log('Network error: ' + error.message);
        return {
            success: false,
            error: '네트워크 연결을 확인해주세요: ' + (error && error.message ? error.message : String(error))
        };
    }
}
```

---

## 🎯 사용자 인터페이스

### 폼 처리

#### NFT 생성 폼 처리

```javascript
async handleMint(event) {
    event.preventDefault();
    
    try {
        // 폼 데이터 가져오기
        const to = this.elements.recipientAddress.value.trim();
        const tokenURI = this.elements.tokenURI.value.trim();

        // 입력값 검증
        if (!to || !tokenURI) {
            this.showStatus('모든 필드를 입력해주세요.', 'error');
            return;
        }

        // 폼 데이터 검증
        const validationRules = {
            to: { type: 'address', required: true, label: '받는 주소' },
            tokenURI: { type: 'url', required: true, label: '토큰 URI' }
        };
        
        const validation = this.validateFormData({ to, tokenURI }, validationRules);
        if (!validation.isValid) {
            this.showStatus(validation.errors.join(', '), 'error');
            return;
        }

        // 버튼 비활성화 및 로딩 표시
        this.setLoading(true, 'mint');
        this.showStatus('NFT 민팅을 시작합니다...', 'info');

        // NFT 생성 함수 호출
        const mintResult = await this.createNFT(to, tokenURI);
        
        if (mintResult.success) {
            this.showStatus(`민팅 성공! 토큰 ID: ${mintResult.tokenId}`, 'success');
            this.log('Mint success txHash=' + mintResult.txHash + ' tokenId=' + mintResult.tokenId + ' contractAddress=' + mintResult.contractAddress);
            
            // 자동으로 지갑에 NFT 추가
            await this.addNFTToWallet(mintResult.contractAddress || this.contractAddress, mintResult.tokenId);
            
        } else {
            this.showStatus('민팅 실패: ' + mintResult.error, 'error');
            this.log('Mint failed: ' + mintResult.error);
        }

    } catch (error) {
        this.showStatus('민팅 중 오류가 발생했습니다: ' + error.message, 'error');
    } finally {
        this.setLoading(false, 'mint');
    }
}
```

**폼 처리 과정:**
1. **이벤트 방지**: 기본 폼 제출 동작 방지
2. **데이터 추출**: 폼 필드에서 값 추출
3. **입력값 검증**: 필수 필드 및 형식 검증
4. **로딩 상태**: 버튼 비활성화 및 로딩 표시
5. **API 호출**: 백엔드 서버에 요청
6. **결과 처리**: 성공/실패에 따른 UI 업데이트
7. **상태 복원**: 로딩 상태 해제

### 탭 전환 기능

```javascript
function switchTab(tabName) {
    // 모든 탭과 콘텐츠 비활성화
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // 선택된 탭과 콘텐츠 활성화
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
}
```

**탭 전환 과정:**
1. **모든 탭 비활성화**: `active` 클래스 제거
2. **선택된 탭 활성화**: 해당 탭에 `active` 클래스 추가
3. **콘텐츠 전환**: 해당 탭 콘텐츠 표시

### 상태 표시

#### 상태 메시지 표시

```javascript
showStatus(message, type = 'info') {
    this.elements.status.textContent = message;
    this.elements.status.className = `status ${type}`;
    this.elements.status.classList.remove('hidden');
    
    // 성공 메시지는 5초 후 자동 숨김
    if (type === 'success') {
        setTimeout(() => {
            this.elements.status.classList.add('hidden');
        }, 5000);
    }
}
```

#### 로딩 상태 설정

```javascript
setLoading(loading, type = 'mint') {
    if (type === 'mint') {
        this.elements.mintBtn.disabled = loading;
        this.elements.btnText.style.display = loading ? 'none' : 'inline';
        this.elements.btnLoading.classList.toggle('hidden', !loading);
    }
    // ... 다른 타입들도 동일한 방식으로 처리
}
```

---

## ⚠️ 에러 처리 및 상태 관리

### 입력값 검증

```javascript
validateFormData(data, rules) {
    const errors = [];
    
    for (const [field, value] of Object.entries(data)) {
        const rule = rules[field];
        if (!rule) continue;
        
        // 필수 필드 검증
        if (rule.required && (!value || value.toString().trim() === '')) {
            errors.push(`${rule.label || field}은(는) 필수입니다.`);
            continue;
        }
        
        if (!value) continue; // 값이 없으면 다른 검증 건너뛰기
        
        // 주소 검증
        if (rule.type === 'address' && !this.isValidAddress(value)) {
            errors.push(`${rule.label || field}은(는) 유효한 이더리움 주소여야 합니다.`);
        }
        
        // URL 검증
        if (rule.type === 'url' && !this.isValidURL(value)) {
            errors.push(`${rule.label || field}은(는) 유효한 URL이어야 합니다.`);
        }
        
        // 숫자 검증
        if (rule.type === 'number' && !this.isValidNumber(value, rule.min, rule.max)) {
            errors.push(`${rule.label || field}은(는) ${rule.min} 이상 ${rule.max} 이하의 정수여야 합니다.`);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}
```

### 유틸리티 검증 함수들

```javascript
// 이더리움 주소 형식 검증
isValidAddress(address) {
    if (!address || typeof address !== 'string') return false;
    
    // ethers.js가 있으면 사용, 없으면 정규식으로 검증
    if (typeof ethers !== 'undefined' && ethers.utils) {
        return ethers.utils.isAddress(address);
    }
    
    // 기본 정규식 검증
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// URL 형식 검증
isValidURL(url) {
    if (!url || typeof url !== 'string') return false;
    
    try {
        const urlObj = new URL(url);
        return ['http:', 'https:', 'ipfs:'].includes(urlObj.protocol);
    } catch {
        return false;
    }
}

// 숫자 형식 검증
isValidNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const num = Number(value);
    return !isNaN(num) && Number.isInteger(num) && num >= min && num <= max;
}
```

### 로그 시스템

```javascript
log(msg, level = 'info') {
    if (!this.elements || !this.elements.logPanel) return;
    
    const time = new Date().toLocaleTimeString();
    const line = `[${time}] ${msg}`;
    
    const div = document.createElement('div');
    div.textContent = line;
    
    // 로그 레벨에 따른 스타일 적용
    if (level === 'error') {
        div.style.color = '#dc3545';
        div.style.fontWeight = 'bold';
    } else if (level === 'warn') {
        div.style.color = '#ffc107';
    } else if (level === 'success') {
        div.style.color = '#28a745';
    }
    
    this.elements.logPanel.appendChild(div);
    this.elements.logPanel.scrollTop = this.elements.logPanel.scrollHeight;
    
    // 콘솔에도 출력
    try { 
        if (level === 'error') {
            console.error(line);
        } else if (level === 'warn') {
            console.warn(line);
        } else {
            console.log(line);
        }
    } catch (_) {}
}
```

**로그 시스템 특징:**
- **시간 표시**: 각 로그에 타임스탬프 추가
- **레벨별 스타일**: 에러, 경고, 성공에 따른 색상 구분
- **자동 스크롤**: 새 로그가 추가되면 자동으로 스크롤
- **콘솔 출력**: 브라우저 콘솔에도 동시 출력

---

## 📋 다음 단계

이제 프론트엔드 웹 인터페이스의 구조와 기능을 이해했으니, 다음 가이드에서는 프로젝트의 설치 및 실행 방법에 대해 자세히 알아보겠습니다.

**다음 가이드**: [설치 및 실행 가이드](./NFT_BLOCKCHAIN_PROJECT_GUIDE_6_설치및실행.md)

---

## 💡 핵심 정리

1. **프론트엔드는 사용자와 직접 상호작용하는 웹 인터페이스입니다.**
2. **HTML, CSS, JavaScript를 사용하여 직관적인 UI를 구현합니다.**
3. **MetaMask와 연동하여 블록체인 지갑 기능을 제공합니다.**
4. **백엔드 API와 통신하여 NFT 관련 기능을 수행합니다.**
5. **입력값 검증, 에러 처리, 상태 관리를 통해 안정적인 사용자 경험을 제공합니다.**
