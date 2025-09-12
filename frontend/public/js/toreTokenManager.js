/**
 * TORE 토큰 관리 클래스
 * 
 * 기능:
 * - TORE 토큰 잔액 조회
 * - TORE 토큰 전송
 * - TORE 토큰 전송 내역 조회
 * - MetaMask와의 연동
 */

class ToreTokenManager {
    constructor() {
        this.init();
    }

    /**
     * 초기화
     */
    init() {
        this.setupEventListeners();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // TORE 잔액 조회 폼
        const toreBalanceForm = document.getElementById('toreBalanceForm');
        if (toreBalanceForm) {
            toreBalanceForm.addEventListener('submit', (e) => this.handleToreBalanceQuery(e));
        }

        // TORE 전송 폼
        const toreTransferForm = document.getElementById('toreTransferForm');
        if (toreTransferForm) {
            toreTransferForm.addEventListener('submit', (e) => this.handleToreTransfer(e));
        }

        // TORE 전송 내역 조회 폼
        const toreHistoryForm = document.getElementById('toreHistoryForm');
        if (toreHistoryForm) {
            toreHistoryForm.addEventListener('submit', (e) => this.handleToreHistoryQuery(e));
        }
    }

    /**
     * TORE 잔액 조회
     */
    async getToreBalance(address) {
        return await Utils.apiCall(`/api/tore/balance/${address}`);
    }

    /**
     * TORE 전송
     */
    async transferTore(to, amount) {
        // MetaMask 연결 확인
        if (!window.walletManager?.isConnected()) {
            throw new Error('MetaMask 지갑을 먼저 연결해주세요');
        }
        
        // TORE 토큰 컨트랙트 주소 (실제 배포 후 업데이트 필요)
        const toreTokenAddress = '0x...'; // 실제 TORE 토큰 컨트랙트 주소로 교체
        
        // MetaMask를 통해 전송 트랜잭션 실행
        const provider = window.walletManager.getProvider();
        const signer = window.walletManager.getSigner();
        
        // ERC-20 토큰 ABI (transfer 함수만 포함)
        const tokenABI = [
            "function transfer(address to, uint256 amount) returns (bool)"
        ];
        
        const tokenContract = new ethers.Contract(toreTokenAddress, tokenABI, signer);
        
        // 전송 실행
        const tx = await tokenContract.transfer(to, ethers.utils.parseUnits(amount, 18));
        
        return tx;
    }

    /**
     * TORE 전송 내역 조회
     */
    async getToreHistory(address) {
        return await Utils.apiCall(`/api/tore/history/${address}`);
    }

    /**
     * TORE 잔액 조회 처리
     */
    async handleToreBalanceQuery(event) {
        event.preventDefault();
        
        const address = document.getElementById('toreBalanceAddress').value.trim();
        
        if (!Utils.isValidAddress(address)) {
            Utils.showStatus('올바른 지갑 주소를 입력해주세요. (0x로 시작하는 42자리 주소)', 'error');
            return;
        }

        Utils.setLoading(true, 'toreBalanceBtn', 'toreBalanceBtnText', 'toreBalanceBtnLoading');
        Utils.showStatus('TORE 잔액을 조회하는 중...', 'info');
        
        try {
            const result = await this.getToreBalance(address);
            
            if (result.success) {
                // 결과 표시
                document.getElementById('toreBalanceWalletAddress').textContent = result.data.address;
                document.getElementById('toreBalanceAmount').textContent = result.data.balance;
                document.getElementById('toreBalanceResult').classList.remove('hidden');
                
                Utils.showStatus(`TORE 잔액 조회 완료: ${result.data.balance} TORE`, 'success');
            } else {
                Utils.showStatus('TORE 잔액 조회 실패: ' + result.error, 'error');
                document.getElementById('toreBalanceResult').classList.add('hidden');
            }
        } catch (error) {
            Utils.showStatus(`TORE 잔액 조회 실패: ${error.message}`, 'error');
            document.getElementById('toreBalanceResult').classList.add('hidden');
        } finally {
            Utils.setLoading(false, 'toreBalanceBtn', 'toreBalanceBtnText', 'toreBalanceBtnLoading');
        }
    }

    /**
     * TORE 전송 처리
     */
    async handleToreTransfer(event) {
        event.preventDefault();
        
        const formData = {
            toreTransferTo: document.getElementById('toreTransferTo').value.trim(),
            toreTransferAmount: document.getElementById('toreTransferAmount').value.trim()
        };

        const rules = {
            toreTransferTo: { required: true, type: 'address', label: '받는 주소' },
            toreTransferAmount: { required: true, type: 'positiveInteger', label: '전송할 TORE 양' }
        };

        const errors = Utils.validateForm(formData, rules);
        if (errors.length > 0) {
            Utils.showStatus(errors[0], 'error');
            return;
        }

        Utils.setLoading(true, 'toreTransferBtn', 'toreTransferBtnText', 'toreTransferBtnLoading');
        Utils.showStatus('TORE 전송 중...', 'info');
        
        try {
            // MetaMask 연결 확인
            if (!window.walletManager?.isConnected()) {
                throw new Error('MetaMask 지갑을 먼저 연결해주세요');
            }
            
            // TORE 토큰 컨트랙트 주소 (실제 배포 후 업데이트 필요)
            const toreTokenAddress = '0x...'; // 실제 TORE 토큰 컨트랙트 주소로 교체
            
            // MetaMask를 통해 전송 트랜잭션 실행
            const provider = window.walletManager.getProvider();
            const signer = window.walletManager.getSigner();
            
            // ERC-20 토큰 ABI (transfer 함수만 포함)
            const tokenABI = [
                "function transfer(address to, uint256 amount) returns (bool)"
            ];
            
            const tokenContract = new ethers.Contract(toreTokenAddress, tokenABI, signer);
            
            // 전송 실행
            const tx = await tokenContract.transfer(formData.toreTransferTo, ethers.utils.parseUnits(formData.toreTransferAmount, 18));
            
            Utils.showStatus('트랜잭션 전송됨. 확인 대기 중...', 'info');
            
            // 트랜잭션 확인 대기
            await tx.wait();
            
            Utils.showStatus(`TORE 전송 완료! 트랜잭션 해시: ${tx.hash}`, 'success');
            
            // 폼 초기화
            document.getElementById('toreTransferForm').reset();
            
        } catch (error) {
            Utils.showStatus(`TORE 전송 실패: ${error.message}`, 'error');
        } finally {
            Utils.setLoading(false, 'toreTransferBtn', 'toreTransferBtnText', 'toreTransferBtnLoading');
        }
    }

    /**
     * TORE 전송 내역 조회 처리
     */
    async handleToreHistoryQuery(event) {
        event.preventDefault();
        
        const address = document.getElementById('toreHistoryAddress').value.trim();
        
        if (!Utils.isValidAddress(address)) {
            Utils.showStatus('올바른 지갑 주소를 입력해주세요. (0x로 시작하는 42자리 주소)', 'error');
            return;
        }

        Utils.setLoading(true, 'toreHistoryBtn', 'toreHistoryBtnText', 'toreHistoryBtnLoading');
        Utils.showStatus('TORE 전송 내역을 조회하는 중...', 'info');
        
        try {
            const result = await this.getToreHistory(address);
            
            if (result.success) {
                this.displayToreHistory(result.data.transfers);
                document.getElementById('toreHistoryResult').classList.remove('hidden');
                
                Utils.showStatus(`TORE 전송 내역 조회 완료: ${result.data.count}건`, 'success');
            } else {
                Utils.showStatus('TORE 전송 내역 조회 실패: ' + result.error, 'error');
                document.getElementById('toreHistoryResult').classList.add('hidden');
            }
        } catch (error) {
            Utils.showStatus(`TORE 전송 내역 조회 실패: ${error.message}`, 'error');
            document.getElementById('toreHistoryResult').classList.add('hidden');
        } finally {
            Utils.setLoading(false, 'toreHistoryBtn', 'toreHistoryBtnText', 'toreHistoryBtnLoading');
        }
    }

    /**
     * TORE 전송 내역 표시
     */
    displayToreHistory(transfers) {
        const historyList = document.getElementById('toreHistoryList');
        
        if (!transfers || transfers.length === 0) {
            historyList.innerHTML = '<div class="no-transactions">전송 내역이 없습니다.</div>';
            return;
        }
        
        let html = '';
        transfers.forEach(transfer => {
            const currentAccount = window.walletManager?.getCurrentAccount();
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
}

// 전역에서 사용할 수 있도록 window 객체에 추가
window.ToreTokenManager = ToreTokenManager;
