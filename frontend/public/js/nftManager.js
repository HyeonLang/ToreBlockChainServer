/**
 * NFT 관리 클래스
 * 
 * 기능:
 * - NFT 생성, 전송, 삭제
 * - NFT 정보 조회
 * - 지갑 NFT 조회
 * - 거래 이력 조회
 */

class NFTManager {
    constructor() {
        this.contractAddress = null;
        this.init();
    }

    /**
     * 초기화
     */
    async init() {
        try {
            await this.getContractAddress();
            this.setupEventListeners();
        } catch (error) {
            Utils.showStatus('NFT 매니저 초기화 실패: ' + error.message, 'error');
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // NFT 생성 폼
        const mintForm = document.getElementById('mintForm');
        if (mintForm) {
            mintForm.addEventListener('submit', (e) => this.handleMint(e));
        }

        // NFT 전송 폼
        const transferForm = document.getElementById('transferForm');
        if (transferForm) {
            transferForm.addEventListener('submit', (e) => this.handleTransfer(e));
        }

        // NFT 삭제 폼
        const deleteForm = document.getElementById('deleteForm');
        if (deleteForm) {
            deleteForm.addEventListener('submit', (e) => this.handleDelete(e));
        }

        // NFT 정보 조회 폼
        const infoForm = document.getElementById('infoForm');
        if (infoForm) {
            infoForm.addEventListener('submit', (e) => this.handleInfo(e));
        }

        // 지갑 NFT 조회 폼
        const walletForm = document.getElementById('walletForm');
        if (walletForm) {
            walletForm.addEventListener('submit', (e) => this.handleWallet(e));
        }

        // NFT 거래 이력 폼
        const nftHistoryForm = document.getElementById('nftHistoryForm');
        if (nftHistoryForm) {
            nftHistoryForm.addEventListener('submit', (e) => this.handleNftHistory(e));
        }

        // 지갑 거래 이력 폼
        const walletHistoryForm = document.getElementById('walletHistoryForm');
        if (walletHistoryForm) {
            walletHistoryForm.addEventListener('submit', (e) => this.handleWalletHistory(e));
        }

        // 통합 기능 버튼들
        const viewNftHistoryBtn = document.getElementById('viewNftHistoryBtn');
        if (viewNftHistoryBtn) {
            viewNftHistoryBtn.addEventListener('click', () => this.viewNftHistoryFromInfo());
        }

        const viewWalletHistoryBtn = document.getElementById('viewWalletHistoryBtn');
        if (viewWalletHistoryBtn) {
            viewWalletHistoryBtn.addEventListener('click', () => this.viewWalletHistoryFromWallet());
        }
    }

    /**
     * 컨트랙트 주소 가져오기
     */
    async getContractAddress() {
        const result = await Utils.apiCall('/api/nft/address');
        if (result.success) {
            this.contractAddress = result.data.address;
            Utils.showStatus('컨트랙트 주소 로드 완료', 'success', 3000);
        } else {
            throw new Error(result.error);
        }
    }

    /**
     * NFT 생성
     */
    async createNFT(to, tokenURI) {
        return await Utils.apiCall('/api/nft/mint', {
            method: 'POST',
            body: JSON.stringify({ to, tokenURI })
        });
    }

    /**
     * NFT 전송
     */
    async transferNFT(from, to, tokenId) {
        return await Utils.apiCall('/api/nft/transfer', {
            method: 'POST',
            body: JSON.stringify({ from, to, tokenId })
        });
    }

    /**
     * NFT 삭제
     */
    async deleteNFT(tokenId) {
        return await Utils.apiCall('/api/nft/burn', {
            method: 'POST',
            body: JSON.stringify({ tokenId })
        });
    }

    /**
     * NFT 정보 조회
     */
    async getNFTInfo(tokenId) {
        return await Utils.apiCall(`/api/nft/${tokenId}`);
    }

    /**
     * 지갑 NFT 조회
     */
    async getWalletNFTs(walletAddress) {
        return await Utils.apiCall(`/api/nft/wallet?walletAddress=${encodeURIComponent(walletAddress)}`);
    }

    /**
     * NFT 거래 이력 조회
     */
    async getNftTransactionHistory(tokenId) {
        return await Utils.apiCall(`/api/nft/${tokenId}/history`);
    }

    /**
     * 지갑 거래 이력 조회
     */
    async getWalletTransactionHistory(walletAddress) {
        return await Utils.apiCall(`/api/nft/wallet/history?walletAddress=${encodeURIComponent(walletAddress)}`);
    }

    /**
     * NFT 생성 처리
     */
    async handleMint(event) {
        event.preventDefault();
        
        const formData = {
            recipientAddress: document.getElementById('recipientAddress').value.trim(),
            tokenURI: document.getElementById('tokenURI').value.trim()
        };

        const rules = {
            recipientAddress: { required: true, type: 'address', label: '받는 주소' },
            tokenURI: { required: true, type: 'url', label: '토큰 URI' }
        };

        const errors = Utils.validateForm(formData, rules);
        if (errors.length > 0) {
            Utils.showStatus(errors[0], 'error');
            return;
        }

        Utils.setLoading(true, 'mintBtn', 'btnText', 'btnLoading');
        Utils.showStatus('NFT 민팅을 시작합니다...', 'info');

        try {
            const result = await this.createNFT(formData.recipientAddress, formData.tokenURI);
            
            if (result.success) {
                Utils.showStatus(`민팅 성공! 토큰 ID: ${result.data.tokenId}`, 'success');
                await this.addNFTToWallet(result.data.contractAddress || this.contractAddress, result.data.tokenId);
            } else {
                Utils.showStatus('민팅 실패: ' + result.error, 'error');
            }
        } catch (error) {
            Utils.showStatus('민팅 중 오류가 발생했습니다: ' + error.message, 'error');
        } finally {
            Utils.setLoading(false, 'mintBtn', 'btnText', 'btnLoading');
        }
    }

    /**
     * NFT 전송 처리
     */
    async handleTransfer(event) {
        event.preventDefault();
        
        const formData = {
            transferFrom: document.getElementById('transferFrom').value.trim(),
            transferTo: document.getElementById('transferTo').value.trim(),
            transferTokenId: document.getElementById('transferTokenId').value.trim()
        };

        const rules = {
            transferFrom: { required: true, type: 'address', label: '보내는 주소' },
            transferTo: { required: true, type: 'address', label: '받는 주소' },
            transferTokenId: { required: true, type: 'positiveInteger', label: '토큰 ID' }
        };

        const errors = Utils.validateForm(formData, rules);
        if (errors.length > 0) {
            Utils.showStatus(errors[0], 'error');
            return;
        }

        // 같은 주소로 전송하는지 확인
        if (formData.transferFrom.toLowerCase() === formData.transferTo.toLowerCase()) {
            Utils.showStatus('보내는 주소와 받는 주소가 같습니다.', 'error');
            return;
        }

        Utils.setLoading(true, 'transferBtn', 'transferBtnText', 'transferBtnLoading');
        Utils.showStatus('NFT 전송을 시작합니다...', 'info');

        try {
            const result = await this.transferNFT(formData.transferFrom, formData.transferTo, formData.transferTokenId);
            
            if (result.success) {
                Utils.showStatus(`전송 성공! 트랜잭션 해시: ${result.data.txHash}`, 'success');
            } else {
                Utils.showStatus('전송 실패: ' + result.error, 'error');
            }
        } catch (error) {
            Utils.showStatus('전송 중 오류가 발생했습니다: ' + error.message, 'error');
        } finally {
            Utils.setLoading(false, 'transferBtn', 'transferBtnText', 'transferBtnLoading');
        }
    }

    /**
     * NFT 삭제 처리
     */
    async handleDelete(event) {
        event.preventDefault();
        
        const tokenId = document.getElementById('deleteTokenId').value.trim();
        
        if (!Utils.isValidPositiveInteger(tokenId)) {
            Utils.showStatus('올바른 토큰 ID를 입력해주세요. (0 이상의 정수)', 'error');
            return;
        }

        if (!confirm(`정말로 토큰 ID ${tokenId}의 NFT를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }

        Utils.setLoading(true, 'deleteBtn', 'deleteBtnText', 'deleteBtnLoading');
        Utils.showStatus('NFT 삭제를 시작합니다...', 'info');

        try {
            const result = await this.deleteNFT(tokenId);
            
            if (result.success) {
                Utils.showStatus(`삭제 성공! 트랜잭션 해시: ${result.data.txHash}`, 'success');
                document.getElementById('deleteTokenId').value = '';
            } else {
                Utils.showStatus('삭제 실패: ' + result.error, 'error');
            }
        } catch (error) {
            Utils.showStatus('삭제 중 오류가 발생했습니다: ' + error.message, 'error');
        } finally {
            Utils.setLoading(false, 'deleteBtn', 'deleteBtnText', 'deleteBtnLoading');
        }
    }

    /**
     * NFT 정보 조회 처리
     */
    async handleInfo(event) {
        event.preventDefault();
        
        const tokenId = document.getElementById('infoTokenId').value.trim();
        
        if (!Utils.isValidPositiveInteger(tokenId)) {
            Utils.showStatus('올바른 토큰 ID를 입력해주세요. (0 이상의 정수)', 'error');
            return;
        }

        Utils.setLoading(true, 'infoBtn', 'infoBtnText', 'infoBtnLoading');
        Utils.showStatus('NFT 정보를 조회합니다...', 'info');

        try {
            const result = await this.getNFTInfo(tokenId);
            
            if (result.success) {
                Utils.showStatus('NFT 정보 조회 성공!', 'success');
                
                // NFT 정보 표시
                document.getElementById('nftOwner').textContent = result.data.owner;
                document.getElementById('nftTokenURI').textContent = result.data.tokenURI;
                document.getElementById('nftInfo').classList.remove('hidden');
            } else {
                Utils.showStatus('정보 조회 실패: ' + result.error, 'error');
                document.getElementById('nftInfo').classList.add('hidden');
            }
        } catch (error) {
            Utils.showStatus('정보 조회 중 오류가 발생했습니다: ' + error.message, 'error');
        } finally {
            Utils.setLoading(false, 'infoBtn', 'infoBtnText', 'infoBtnLoading');
        }
    }

    /**
     * 지갑 NFT 조회 처리
     */
    async handleWallet(event) {
        event.preventDefault();
        
        const walletAddress = document.getElementById('walletQueryAddress').value.trim();
        
        if (!Utils.isValidAddress(walletAddress)) {
            Utils.showStatus('올바른 지갑 주소를 입력해주세요. (0x로 시작하는 42자리 주소)', 'error');
            return;
        }

        Utils.setLoading(true, 'walletBtn', 'walletBtnText', 'walletBtnLoading');
        Utils.showStatus('지갑 NFT를 조회합니다...', 'info');

        try {
            const result = await this.getWalletNFTs(walletAddress);
            
            if (result.success) {
                Utils.showStatus(`지갑 NFT 조회 성공! (${result.data.nfts.length}개 발견)`, 'success');
                
                // NFT 목록 표시
                this.displayWalletNFTs(result.data.nfts);
                document.getElementById('walletNfts').classList.remove('hidden');
            } else {
                Utils.showStatus('지갑 조회 실패: ' + result.error, 'error');
                document.getElementById('walletNfts').classList.add('hidden');
            }
        } catch (error) {
            Utils.showStatus('지갑 조회 중 오류가 발생했습니다: ' + error.message, 'error');
        } finally {
            Utils.setLoading(false, 'walletBtn', 'walletBtnText', 'walletBtnLoading');
        }
    }

    /**
     * NFT 거래 이력 처리
     */
    async handleNftHistory(event) {
        event.preventDefault();
        
        const tokenId = document.getElementById('nftHistoryTokenId').value.trim();
        
        if (!Utils.isValidPositiveInteger(tokenId)) {
            Utils.showStatus('올바른 토큰 ID를 입력해주세요. (0 이상의 정수)', 'error');
            return;
        }

        Utils.setLoading(true, 'nftHistoryBtn', 'nftHistoryBtnText', 'nftHistoryBtnLoading');
        Utils.showStatus('NFT 거래 이력을 조회합니다...', 'info');

        try {
            const result = await this.getNftTransactionHistory(tokenId);
            
            if (result.success) {
                Utils.showStatus(`NFT 거래 이력 조회 성공! (${result.data.transactions.length}건 발견)`, 'success');
                
                // 거래 이력 표시
                this.displayNftTransactionHistory(result.data.transactions);
                document.getElementById('nftHistoryResult').classList.remove('hidden');
            } else {
                Utils.showStatus('거래 이력 조회 실패: ' + result.error, 'error');
                document.getElementById('nftHistoryResult').classList.add('hidden');
            }
        } catch (error) {
            Utils.showStatus('거래 이력 조회 중 오류가 발생했습니다: ' + error.message, 'error');
        } finally {
            Utils.setLoading(false, 'nftHistoryBtn', 'nftHistoryBtnText', 'nftHistoryBtnLoading');
        }
    }

    /**
     * 지갑 거래 이력 처리
     */
    async handleWalletHistory(event) {
        event.preventDefault();
        
        const walletAddress = document.getElementById('walletHistoryAddress').value.trim();
        
        if (!Utils.isValidAddress(walletAddress)) {
            Utils.showStatus('올바른 지갑 주소를 입력해주세요. (0x로 시작하는 42자리 주소)', 'error');
            return;
        }

        Utils.setLoading(true, 'walletHistoryBtn', 'walletHistoryBtnText', 'walletHistoryBtnLoading');
        Utils.showStatus('지갑 거래 이력을 조회합니다...', 'info');

        try {
            const result = await this.getWalletTransactionHistory(walletAddress);
            
            if (result.success) {
                Utils.showStatus(`지갑 거래 이력 조회 성공! (${result.data.transactions.length}건 발견)`, 'success');
                
                // 거래 이력 표시
                this.displayWalletTransactionHistory(result.data.transactions);
                document.getElementById('walletHistoryResult').classList.remove('hidden');
            } else {
                Utils.showStatus('거래 이력 조회 실패: ' + result.error, 'error');
                document.getElementById('walletHistoryResult').classList.add('hidden');
            }
        } catch (error) {
            Utils.showStatus('거래 이력 조회 중 오류가 발생했습니다: ' + error.message, 'error');
        } finally {
            Utils.setLoading(false, 'walletHistoryBtn', 'walletHistoryBtnText', 'walletHistoryBtnLoading');
        }
    }

    /**
     * 지갑 NFT 목록 표시
     */
    displayWalletNFTs(nfts) {
        const listElement = document.getElementById('walletNftsList');
        listElement.innerHTML = '';

        if (nfts.length === 0) {
            listElement.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">소유한 NFT가 없습니다.</p>';
            return;
        }

        nfts.forEach((nft, index) => {
            const nftElement = document.createElement('div');
            nftElement.style.cssText = `
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border: 2px solid #dee2e6;
                border-radius: 12px;
                padding: 18px;
                margin-bottom: 15px;
                font-family: 'Courier New', monospace;
                font-size: 0.9rem;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                transition: all 0.3s ease;
            `;
            
            nftElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong>NFT #${nft.tokenId}</strong>
                    <span style="background: #667eea; color: white; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem;">
                        ${index + 1}번째
                    </span>
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>소유자:</strong> ${nft.owner}
                </div>
                <div style="word-break: break-all;">
                    <strong>URI:</strong> ${nft.tokenURI}
                </div>
            `;
            
            listElement.appendChild(nftElement);
        });
    }

    /**
     * NFT 거래 이력 표시
     */
    displayNftTransactionHistory(transactions) {
        const listElement = document.getElementById('nftHistoryList');
        listElement.innerHTML = '';

        if (transactions.length === 0) {
            listElement.innerHTML = '<p class="no-transactions">거래 이력이 없습니다.</p>';
            return;
        }

        transactions.forEach((tx) => {
            const txElement = document.createElement('div');
            txElement.className = 'transaction-item';
            
            const timeString = Utils.formatTime(tx.timestamp);
            
            txElement.innerHTML = `
                <div class="transaction-header">
                    <span class="transaction-type ${tx.type}">${Utils.getTransactionTypeText(tx.type)}</span>
                    <span class="transaction-time">${timeString}</span>
                </div>
                <div class="transaction-details">
                    <div class="transaction-detail">
                        <div class="transaction-detail-label">보내는 주소</div>
                        <div class="transaction-detail-value">${tx.from === '0x0000000000000000000000000000000000000000' ? '시스템 (민팅)' : tx.from}</div>
                    </div>
                    <div class="transaction-detail">
                        <div class="transaction-detail-label">받는 주소</div>
                        <div class="transaction-detail-value">${tx.to === '0x0000000000000000000000000000000000000000' ? '시스템 (소각)' : tx.to}</div>
                    </div>
                </div>
                <div class="transaction-details">
                    <div class="transaction-detail">
                        <div class="transaction-detail-label">토큰 ID</div>
                        <div class="transaction-detail-value">#${tx.tokenId}</div>
                    </div>
                    <div class="transaction-detail">
                        <div class="transaction-detail-label">블록 번호</div>
                        <div class="transaction-detail-value">${tx.blockNumber}</div>
                    </div>
                </div>
                <div style="margin-top: 8px;">
                    <div class="transaction-detail-label">트랜잭션 해시</div>
                    <a href="https://testnet.snowtrace.io/tx/${tx.txHash}" target="_blank" class="transaction-hash">
                        ${tx.txHash}
                    </a>
                </div>
            `;
            
            listElement.appendChild(txElement);
        });
    }

    /**
     * 지갑 거래 이력 표시
     */
    displayWalletTransactionHistory(transactions) {
        const listElement = document.getElementById('walletHistoryList');
        listElement.innerHTML = '';

        if (transactions.length === 0) {
            listElement.innerHTML = '<p class="no-transactions">거래 이력이 없습니다.</p>';
            return;
        }

        transactions.forEach((tx) => {
            const txElement = document.createElement('div');
            txElement.className = 'transaction-item';
            
            const timeString = Utils.formatTime(tx.timestamp);
            
            txElement.innerHTML = `
                <div class="transaction-header">
                    <span class="transaction-type ${tx.type}">${Utils.getTransactionTypeText(tx.type)}</span>
                    <div>
                        <span class="transaction-direction ${tx.direction}">${tx.direction === 'sent' ? '보냄' : '받음'}</span>
                        <span class="transaction-time">${timeString}</span>
                    </div>
                </div>
                <div class="transaction-details">
                    <div class="transaction-detail">
                        <div class="transaction-detail-label">보내는 주소</div>
                        <div class="transaction-detail-value">${tx.from === '0x0000000000000000000000000000000000000000' ? '시스템 (민팅)' : tx.from}</div>
                    </div>
                    <div class="transaction-detail">
                        <div class="transaction-detail-label">받는 주소</div>
                        <div class="transaction-detail-value">${tx.to === '0x0000000000000000000000000000000000000000' ? '시스템 (소각)' : tx.to}</div>
                    </div>
                </div>
                <div class="transaction-details">
                    <div class="transaction-detail">
                        <div class="transaction-detail-label">토큰 ID</div>
                        <div class="transaction-detail-value">#${tx.tokenId}</div>
                    </div>
                    <div class="transaction-detail">
                        <div class="transaction-detail-label">블록 번호</div>
                        <div class="transaction-detail-value">${tx.blockNumber}</div>
                    </div>
                </div>
                <div style="margin-top: 8px;">
                    <div class="transaction-detail-label">트랜잭션 해시</div>
                    <a href="https://testnet.snowtrace.io/tx/${tx.txHash}" target="_blank" class="transaction-hash">
                        ${tx.txHash}
                    </a>
                </div>
            `;
            
            listElement.appendChild(txElement);
        });
    }

    /**
     * NFT 정보에서 거래 이력 보기
     */
    viewNftHistoryFromInfo() {
        const tokenId = document.getElementById('infoTokenId').value.trim();
        if (!tokenId) {
            Utils.showStatus('먼저 NFT 정보를 조회해주세요.', 'error');
            return;
        }
        
        // NFT 거래 이력 탭으로 전환
        switchTab('nftHistory');
        
        // 토큰 ID 자동 입력
        document.getElementById('nftHistoryTokenId').value = tokenId;
        
        // 자동으로 거래 이력 조회
        setTimeout(() => {
            this.handleNftHistory({ preventDefault: () => {} });
        }, 100);
    }

    /**
     * 지갑 조회에서 거래 이력 보기
     */
    viewWalletHistoryFromWallet() {
        const walletAddress = document.getElementById('walletQueryAddress').value.trim();
        if (!walletAddress) {
            Utils.showStatus('먼저 지갑 NFT를 조회해주세요.', 'error');
            return;
        }
        
        // 지갑 거래 이력 탭으로 전환
        switchTab('walletHistory');
        
        // 지갑 주소 자동 입력
        document.getElementById('walletHistoryAddress').value = walletAddress;
        
        // 자동으로 거래 이력 조회
        setTimeout(() => {
            this.handleWalletHistory({ preventDefault: () => {} });
        }, 100);
    }

    /**
     * NFT를 지갑에 자동 추가
     */
    async addNFTToWallet(contractAddress, tokenId) {
        try {
            Utils.showStatus('지갑에 NFT를 추가하는 팝업을 호출합니다...', 'info');
            
            if (!contractAddress) {
                throw new Error('컨트랙트 주소를 확인할 수 없습니다.');
            }

            // 사이트 권한 확보 (연결 필요 시 팝업 노출)
            try { 
                await window.walletManager?.connectWallet(); 
            } catch (_) {}

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

            Utils.showStatus('NFT가 성공적으로 지갑에 추가되었습니다! 🎉', 'success');
            
        } catch (error) {
            if (error && error.code === 4001) {
                Utils.showStatus('지갑 추가가 취소되었습니다.', 'info');
            } else {
                Utils.showStatus('지갑 추가 실패: ' + (error && error.message ? error.message : String(error)), 'error');
            }
        }
    }
}

// 전역에서 사용할 수 있도록 window 객체에 추가
window.NFTManager = NFTManager;
