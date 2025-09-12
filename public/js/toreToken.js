/**
 * TORE 토큰 관련 JavaScript 기능
 * 
 * 기능:
 * - TORE 토큰 잔액 조회
 * - TORE 토큰 전송
 * - TORE 토큰 전송 내역 조회
 * - MetaMask와의 연동
 * - API 호출 및 에러 처리
 */

// 전역 변수
let currentAccount = null;
let toreTokenContract = null;

/**
 * 페이지 로드 시 초기화
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeToreTokenFeatures();
});

/**
 * TORE 토큰 기능 초기화
 */
function initializeToreTokenFeatures() {
    // TORE 잔액 조회 폼 이벤트 리스너
    const toreBalanceForm = document.getElementById('toreBalanceForm');
    if (toreBalanceForm) {
        toreBalanceForm.addEventListener('submit', handleToreBalanceQuery);
    }

    // TORE 전송 폼 이벤트 리스너
    const toreTransferForm = document.getElementById('toreTransferForm');
    if (toreTransferForm) {
        toreTransferForm.addEventListener('submit', handleToreTransfer);
    }

    // TORE 전송 내역 조회 폼 이벤트 리스너
    const toreHistoryForm = document.getElementById('toreHistoryForm');
    if (toreHistoryForm) {
        toreHistoryForm.addEventListener('submit', handleToreHistoryQuery);
    }

    // MetaMask 연결 버튼 이벤트 리스너
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
    }

    // MetaMask 계정 변경 감지
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', function(accounts) {
            if (accounts.length > 0) {
                currentAccount = accounts[0];
                updateWalletInfo();
                // 연결된 지갑 주소를 자동으로 입력 필드에 설정
                autoFillWalletAddress();
            } else {
                currentAccount = null;
                hideWalletInfo();
            }
        });
    }
}

/**
 * TORE 잔액 조회 처리
 */
async function handleToreBalanceQuery(event) {
    event.preventDefault();
    
    const address = document.getElementById('toreBalanceAddress').value;
    const btn = document.getElementById('toreBalanceBtn');
    const btnText = document.getElementById('toreBalanceBtnText');
    const btnLoading = document.getElementById('toreBalanceBtnLoading');
    
    // 버튼 상태 변경
    btn.disabled = true;
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    
    try {
        showStatus('TORE 잔액을 조회하는 중...', 'info');
        
        const response = await fetch(`/api/tore/balance/${address}`);
        const data = await response.json();
        
        if (data.success) {
            // 결과 표시
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
        document.getElementById('toreBalanceResult').classList.add('hidden');
    } finally {
        // 버튼 상태 복원
        btn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
    }
}

/**
 * TORE 전송 처리
 */
async function handleToreTransfer(event) {
    event.preventDefault();
    
    const to = document.getElementById('toreTransferTo').value;
    const amount = document.getElementById('toreTransferAmount').value;
    const btn = document.getElementById('toreTransferBtn');
    const btnText = document.getElementById('toreTransferBtnText');
    const btnLoading = document.getElementById('toreTransferBtnLoading');
    
    // 버튼 상태 변경
    btn.disabled = true;
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    
    try {
        showStatus('TORE 전송 중...', 'info');
        
        // MetaMask 연결 확인
        if (!currentAccount) {
            throw new Error('MetaMask 지갑을 먼저 연결해주세요');
        }
        
        // TORE 토큰 컨트랙트 주소 (실제 배포 후 업데이트 필요)
        const toreTokenAddress = '0x...'; // 실제 TORE 토큰 컨트랙트 주소로 교체
        
        // MetaMask를 통해 전송 트랜잭션 실행
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        // ERC-20 토큰 ABI (transfer 함수만 포함)
        const tokenABI = [
            "function transfer(address to, uint256 amount) returns (bool)"
        ];
        
        const tokenContract = new ethers.Contract(toreTokenAddress, tokenABI, signer);
        
        // 전송 실행
        const tx = await tokenContract.transfer(to, ethers.utils.parseUnits(amount, 18));
        
        showStatus('트랜잭션 전송됨. 확인 대기 중...', 'info');
        
        // 트랜잭션 확인 대기
        await tx.wait();
        
        showStatus(`TORE 전송 완료! 트랜잭션 해시: ${tx.hash}`, 'success');
        
        // 폼 초기화
        document.getElementById('toreTransferForm').reset();
        
    } catch (error) {
        console.error('TORE 전송 오류:', error);
        showStatus(`TORE 전송 실패: ${error.message}`, 'error');
    } finally {
        // 버튼 상태 복원
        btn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
    }
}

/**
 * TORE 전송 내역 조회 처리
 */
async function handleToreHistoryQuery(event) {
    event.preventDefault();
    
    const address = document.getElementById('toreHistoryAddress').value;
    const btn = document.getElementById('toreHistoryBtn');
    const btnText = document.getElementById('toreHistoryBtnText');
    const btnLoading = document.getElementById('toreHistoryBtnLoading');
    
    // 버튼 상태 변경
    btn.disabled = true;
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    
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
        document.getElementById('toreHistoryResult').classList.add('hidden');
    } finally {
        // 버튼 상태 복원
        btn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
    }
}

/**
 * TORE 전송 내역 표시
 */
function displayToreHistory(transfers) {
    const historyList = document.getElementById('toreHistoryList');
    
    if (!transfers || transfers.length === 0) {
        historyList.innerHTML = '<div class="no-transactions">전송 내역이 없습니다.</div>';
        return;
    }
    
    let html = '';
    transfers.forEach(transfer => {
        const direction = transfer.to.toLowerCase() === currentAccount?.toLowerCase() ? 'received' : 'sent';
        const directionText = direction === 'received' ? '받음' : '보냄';
        const directionClass = direction === 'received' ? 'received' : 'sent';
        
        html += `
            <div class="transaction-item">
                <div class="transaction-header">
                    <span class="transaction-type transfer">전송</span>
                    <span class="transaction-direction ${directionClass}">${directionText}</span>
                </div>
                <div class="transaction-details">
                    <div class="transaction-detail">
                        <div class="transaction-detail-label">보낸 주소</div>
                        <div class="transaction-detail-value">${transfer.from}</div>
                    </div>
                    <div class="transaction-detail">
                        <div class="transaction-detail-label">받은 주소</div>
                        <div class="transaction-detail-value">${transfer.to}</div>
                    </div>
                    <div class="transaction-detail">
                        <div class="transaction-detail-label">금액</div>
                        <div class="transaction-detail-value">${transfer.amount} TORE</div>
                    </div>
                    <div class="transaction-detail">
                        <div class="transaction-detail-label">블록 번호</div>
                        <div class="transaction-detail-value">${transfer.blockNumber}</div>
                    </div>
                </div>
                <div class="transaction-hash">
                    <a href="https://testnet.snowtrace.io/tx/${transfer.transactionHash}" target="_blank">
                        ${transfer.transactionHash}
                    </a>
                </div>
            </div>
        `;
    });
    
    historyList.innerHTML = html;
}

/**
 * MetaMask 지갑 연결
 */
async function connectWallet() {
    try {
        if (!window.ethereum) {
            throw new Error('MetaMask가 설치되지 않았습니다. MetaMask를 설치해주세요.');
        }
        
        showStatus('MetaMask 연결 중...', 'info');
        
        // 계정 요청
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length > 0) {
            currentAccount = accounts[0];
            updateWalletInfo();
            autoFillWalletAddress();
            showStatus('MetaMask 지갑이 연결되었습니다.', 'success');
        } else {
            throw new Error('계정을 선택하지 않았습니다.');
        }
        
    } catch (error) {
        console.error('MetaMask 연결 오류:', error);
        showStatus(`MetaMask 연결 실패: ${error.message}`, 'error');
    }
}

/**
 * 지갑 정보 업데이트
 */
function updateWalletInfo() {
    const walletInfo = document.getElementById('walletInfo');
    const walletAddress = document.getElementById('walletAddress');
    
    if (currentAccount) {
        walletAddress.textContent = currentAccount;
        walletInfo.classList.remove('hidden');
    } else {
        walletInfo.classList.add('hidden');
    }
}

/**
 * 지갑 정보 숨기기
 */
function hideWalletInfo() {
    const walletInfo = document.getElementById('walletInfo');
    walletInfo.classList.add('hidden');
}

/**
 * 연결된 지갑 주소를 자동으로 입력 필드에 설정
 */
function autoFillWalletAddress() {
    if (!currentAccount) return;
    
    // TORE 잔액 조회 주소 필드에 자동 입력
    const toreBalanceAddress = document.getElementById('toreBalanceAddress');
    if (toreBalanceAddress && !toreBalanceAddress.value) {
        toreBalanceAddress.value = currentAccount;
    }
    
    // TORE 전송 내역 조회 주소 필드에 자동 입력
    const toreHistoryAddress = document.getElementById('toreHistoryAddress');
    if (toreHistoryAddress && !toreHistoryAddress.value) {
        toreHistoryAddress.value = currentAccount;
    }
}

/**
 * 상태 메시지 표시
 */
function showStatus(message, type) {
    const status = document.getElementById('status');
    const logPanel = document.getElementById('logPanel');
    
    // 상태 메시지 표시
    status.textContent = message;
    status.className = `status ${type}`;
    status.classList.remove('hidden');
    
    // 로그 패널에 메시지 추가
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    logPanel.innerHTML += `<div>${logMessage}</div>`;
    logPanel.scrollTop = logPanel.scrollHeight;
    
    // 3초 후 상태 메시지 숨기기
    setTimeout(() => {
        status.classList.add('hidden');
    }, 3000);
}
