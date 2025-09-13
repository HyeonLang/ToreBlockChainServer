/**
 * 경매 관리자 클래스
 * 
 * 기능:
 * - 경매 생성 및 관리
 * - 입찰 시스템
 * - 경매 종료 처리
 * - 경매 내역 조회
 */

class AuctionManager {
    constructor() {
        this.auctions = [];
        this.userBids = [];
        this.init();
    }

    /**
     * 초기화
     */
    async init() {
        try {
            await this.loadAuctions();
            this.setupEventListeners();
            Utils.showStatus('경매 시스템이 성공적으로 초기화되었습니다!', 'success', 3000);
        } catch (error) {
            Utils.showStatus('경매 시스템 초기화 실패: ' + error.message, 'error');
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 경매 생성 버튼
        document.getElementById('createAuctionBtn').addEventListener('click', () => {
            this.openCreateAuctionModal();
        });

        // 경매 탭 전환
        document.querySelectorAll('#auction .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.getAttribute('data-tab');
                this.switchAuctionTab(tab);
            });
        });

        // 경매 생성 폼
        document.getElementById('createAuctionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateAuction();
        });

        // 종료 시간 유효성 검사
        document.getElementById('endTime').addEventListener('change', (e) => {
            this.validateEndTime(e.target.value);
        });
    }

    /**
     * 경매 목록 로드
     */
    async loadAuctions() {
        try {
            // 실제 구현에서는 백엔드 API 호출
            // 여기서는 시뮬레이션 데이터
            this.auctions = [
                {
                    id: 1,
                    tokenId: 1,
                    seller: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
                    startPrice: 50,
                    currentBid: 75,
                    buyNowPrice: 200,
                    endTime: Date.now() + 86400000, // 24시간 후
                    description: '레어 무기 NFT',
                    isActive: true,
                    highestBidder: '0x1234567890123456789012345678901234567890',
                    bidCount: 5
                },
                {
                    id: 2,
                    tokenId: 2,
                    seller: '0x1234567890123456789012345678901234567890',
                    startPrice: 100,
                    currentBid: 100,
                    buyNowPrice: 300,
                    endTime: Date.now() + 3600000, // 1시간 후
                    description: '전설 방어구 NFT',
                    isActive: true,
                    highestBidder: null,
                    bidCount: 0
                }
            ];

            this.renderAuctions('live');
        } catch (error) {
            console.error('경매 목록 로드 실패:', error);
            this.auctions = [];
        }
    }

    /**
     * 경매 탭 전환
     */
    switchAuctionTab(tab) {
        // 모든 탭 버튼 비활성화
        document.querySelectorAll('#auction .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 선택된 탭 활성화
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // 해당 탭의 경매 렌더링
        this.renderAuctions(tab);
    }

    /**
     * 경매 렌더링
     */
    renderAuctions(tab) {
        const grid = document.getElementById('auctionGrid');
        let filteredAuctions = [];

        switch (tab) {
            case 'live':
                filteredAuctions = this.auctions.filter(auction => 
                    auction.isActive && auction.endTime > Date.now()
                );
                break;
            case 'ending-soon':
                filteredAuctions = this.auctions.filter(auction => 
                    auction.isActive && 
                    auction.endTime > Date.now() && 
                    auction.endTime < Date.now() + 3600000 // 1시간 이내
                );
                break;
            case 'ended':
                filteredAuctions = this.auctions.filter(auction => 
                    !auction.isActive || auction.endTime <= Date.now()
                );
                break;
        }

        grid.innerHTML = '';

        if (filteredAuctions.length === 0) {
            grid.innerHTML = `
                <div class="no-items">
                    <i class="fas fa-gavel"></i>
                    <h3>경매가 없습니다</h3>
                    <p>${this.getTabMessage(tab)}</p>
                </div>
            `;
            return;
        }

        filteredAuctions.forEach(auction => {
            const card = this.createAuctionCard(auction);
            grid.appendChild(card);
        });
    }

    /**
     * 탭별 메시지 반환
     */
    getTabMessage(tab) {
        switch (tab) {
            case 'live':
                return '현재 진행중인 경매가 없습니다.';
            case 'ending-soon':
                return '곧 마감되는 경매가 없습니다.';
            case 'ended':
                return '종료된 경매가 없습니다.';
            default:
                return '';
        }
    }

    /**
     * 경매 카드 생성
     */
    createAuctionCard(auction) {
        const card = document.createElement('div');
        card.className = 'nft-card auction-card';
        
        const timeLeft = this.getTimeLeft(auction.endTime);
        const isEndingSoon = auction.endTime < Date.now() + 3600000;
        
        card.innerHTML = `
            <div class="nft-image">
                <i class="fas fa-gem"></i>
                ${isEndingSoon ? '<div class="ending-badge">마감임박</div>' : ''}
            </div>
            <div class="nft-info">
                <h3 class="nft-name">NFT #${auction.tokenId}</h3>
                <p class="nft-description">${auction.description}</p>
                
                <div class="auction-info">
                    <div class="price-info">
                        <div class="current-bid">
                            <span class="label">현재 입찰가:</span>
                            <span class="price">${auction.currentBid} TORE</span>
                        </div>
                        <div class="bid-count">
                            <span class="label">입찰 수:</span>
                            <span class="count">${auction.bidCount}회</span>
                        </div>
                    </div>
                    
                    <div class="time-info">
                        <span class="label">남은 시간:</span>
                        <span class="time-left ${isEndingSoon ? 'ending' : ''}">${timeLeft}</span>
                    </div>
                    
                    ${auction.buyNowPrice ? `
                        <div class="buy-now-info">
                            <span class="label">즉시 구매가:</span>
                            <span class="price">${auction.buyNowPrice} TORE</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="nft-actions">
                    <button class="btn btn-primary" onclick="auctionManager.openBidModal(${auction.id})">
                        <i class="fas fa-gavel"></i> 입찰하기
                    </button>
                    ${auction.buyNowPrice ? `
                        <button class="btn btn-success" onclick="auctionManager.buyNow(${auction.id})">
                            <i class="fas fa-bolt"></i> 즉시구매
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        return card;
    }

    /**
     * 남은 시간 계산
     */
    getTimeLeft(endTime) {
        const now = Date.now();
        const diff = endTime - now;
        
        if (diff <= 0) {
            return '종료됨';
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
            return `${days}일 ${hours}시간`;
        } else if (hours > 0) {
            return `${hours}시간 ${minutes}분`;
        } else {
            return `${minutes}분`;
        }
    }

    /**
     * 경매 생성 모달 열기
     */
    openCreateAuctionModal() {
        const modal = document.getElementById('createAuctionModal');
        const nftSelect = document.getElementById('auctionNftSelect');
        
        // 사용자의 NFT 목록 로드
        this.loadUserNftsForAuction(nftSelect);
        
        // 종료 시간을 최소 1시간 후로 설정
        const minEndTime = new Date(Date.now() + 3600000);
        document.getElementById('endTime').min = minEndTime.toISOString().slice(0, 16);
        
        modal.style.display = 'block';
    }

    /**
     * 경매용 사용자 NFT 로드
     */
    async loadUserNftsForAuction(selectElement) {
        const walletManager = window.app?.getManager('wallet');
        if (!walletManager || !walletManager.isConnected()) {
            Utils.showStatus('지갑을 먼저 연결해주세요.', 'warning');
            return;
        }

        try {
            const address = walletManager.getCurrentAccount();
            const response = await fetch(`/api/nft/balance/${address}`);
            const data = await response.json();

            selectElement.innerHTML = '<option value="">NFT를 선택하세요</option>';

            if (data.success && data.data.tokens.length > 0) {
                data.data.tokens.forEach(tokenId => {
                    const option = document.createElement('option');
                    option.value = tokenId;
                    option.textContent = `NFT #${tokenId}`;
                    selectElement.appendChild(option);
                });
            }
        } catch (error) {
            Utils.showStatus('NFT 목록 로드 실패: ' + error.message, 'error');
        }
    }

    /**
     * 종료 시간 유효성 검사
     */
    validateEndTime(endTime) {
        const selectedTime = new Date(endTime).getTime();
        const now = Date.now();
        const minTime = now + 3600000; // 최소 1시간 후

        if (selectedTime < minTime) {
            Utils.showStatus('경매 종료 시간은 최소 1시간 후여야 합니다.', 'warning');
            document.getElementById('endTime').value = new Date(minTime).toISOString().slice(0, 16);
        }
    }

    /**
     * 경매 생성 처리
     */
    async handleCreateAuction() {
        const tokenId = document.getElementById('auctionNftSelect').value;
        const startPrice = document.getElementById('startPrice').value;
        const buyNowPrice = document.getElementById('buyNowPrice').value;
        const endTime = document.getElementById('endTime').value;
        const description = document.getElementById('auctionDescription').value;

        if (!tokenId || !startPrice || !endTime) {
            Utils.showStatus('필수 필드를 모두 입력해주세요.', 'warning');
            return;
        }

        if (buyNowPrice && parseFloat(buyNowPrice) <= parseFloat(startPrice)) {
            Utils.showStatus('즉시 구매가는 시작가보다 높아야 합니다.', 'warning');
            return;
        }

        try {
            this.showLoading(true);

            // 실제 구현에서는 백엔드 API 호출
            const auctionData = {
                tokenId: parseInt(tokenId),
                startPrice: parseFloat(startPrice),
                buyNowPrice: buyNowPrice ? parseFloat(buyNowPrice) : null,
                endTime: new Date(endTime).getTime(),
                description: description || `NFT #${tokenId}`
            };

            // 시뮬레이션: 경매 생성
            const newAuction = {
                id: this.auctions.length + 1,
                ...auctionData,
                seller: window.app?.getManager('wallet')?.getCurrentAccount(),
                currentBid: parseFloat(startPrice),
                isActive: true,
                highestBidder: null,
                bidCount: 0
            };

            this.auctions.push(newAuction);

            Utils.showStatus('경매가 성공적으로 생성되었습니다!', 'success');
            closeModal('createAuctionModal');
            
            // 폼 초기화
            document.getElementById('createAuctionForm').reset();
            
            // 경매 목록 새로고침
            this.renderAuctions('live');

        } catch (error) {
            Utils.showStatus('경매 생성 실패: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 입찰 모달 열기
     */
    openBidModal(auctionId) {
        const auction = this.auctions.find(a => a.id === auctionId);
        if (!auction) {
            Utils.showStatus('경매 정보를 찾을 수 없습니다.', 'error');
            return;
        }

        const walletManager = window.app?.getManager('wallet');
        if (!walletManager || !walletManager.isConnected()) {
            Utils.showStatus('지갑을 먼저 연결해주세요.', 'warning');
            return;
        }

        // 입찰 모달 생성 (동적으로 생성)
        this.createBidModal(auction);
    }

    /**
     * 입찰 모달 생성
     */
    createBidModal(auction) {
        // 기존 입찰 모달이 있으면 제거
        const existingModal = document.getElementById('bidModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'bidModal';
        modal.className = 'modal';
        modal.style.display = 'block';

        const minBid = auction.currentBid + 0.01;
        const timeLeft = this.getTimeLeft(auction.endTime);

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>입찰하기</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="auction-preview">
                        <div class="nft-preview-image">
                            <i class="fas fa-gem"></i>
                        </div>
                        <h4>NFT #${auction.tokenId}</h4>
                        <p>${auction.description}</p>
                    </div>
                    
                    <div class="bid-info">
                        <div class="current-bid-info">
                            <p>현재 최고 입찰가: <span class="price">${auction.currentBid} TORE</span></p>
                            <p>최소 입찰가: <span class="price">${minBid} TORE</span></p>
                            <p>남은 시간: <span class="time-left">${timeLeft}</span></p>
                        </div>
                        
                        <div class="form-group">
                            <label>입찰가 (TORE)</label>
                            <input type="number" id="bidAmount" min="${minBid}" step="0.01" value="${minBid}">
                            <small>최소 입찰가: ${minBid} TORE</small>
                        </div>
                        
                        <div class="bid-summary">
                            <p>입찰 수수료 (2.5%): <span id="bidFee">0 TORE</span></p>
                            <p>총 필요 금액: <span id="totalBidAmount">0 TORE</span></p>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">취소</button>
                        <button type="button" class="btn btn-primary" onclick="auctionManager.handleBid(${auction.id})">입찰하기</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 입찰가 입력 시 실시간 계산
        document.getElementById('bidAmount').addEventListener('input', (e) => {
            const amount = parseFloat(e.target.value);
            const fee = amount * 0.025;
            const total = amount + fee;
            
            document.getElementById('bidFee').textContent = fee.toFixed(2) + ' TORE';
            document.getElementById('totalBidAmount').textContent = total.toFixed(2) + ' TORE';
        });
    }

    /**
     * 입찰 처리
     */
    async handleBid(auctionId) {
        const bidAmount = parseFloat(document.getElementById('bidAmount').value);
        const auction = this.auctions.find(a => a.id === auctionId);

        if (!auction) {
            Utils.showStatus('경매 정보를 찾을 수 없습니다.', 'error');
            return;
        }

        if (bidAmount <= auction.currentBid) {
            Utils.showStatus('입찰가는 현재 최고 입찰가보다 높아야 합니다.', 'warning');
            return;
        }

        try {
            this.showLoading(true);

            // 실제 구현에서는 백엔드 API 호출
            const walletManager = window.app?.getManager('wallet');
            const bidderAddress = walletManager.getCurrentAccount();

            // 경매 정보 업데이트
            auction.currentBid = bidAmount;
            auction.highestBidder = bidderAddress;
            auction.bidCount++;

            Utils.showStatus('입찰이 성공적으로 완료되었습니다!', 'success');
            
            // 입찰 모달 닫기
            document.getElementById('bidModal').remove();
            
            // 경매 목록 새로고침
            this.renderAuctions('live');

        } catch (error) {
            Utils.showStatus('입찰 실패: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 즉시 구매 처리
     */
    async buyNow(auctionId) {
        const auction = this.auctions.find(a => a.id === auctionId);
        if (!auction || !auction.buyNowPrice) {
            Utils.showStatus('즉시 구매가 설정되지 않은 경매입니다.', 'error');
            return;
        }

        const walletManager = window.app?.getManager('wallet');
        if (!walletManager || !walletManager.isConnected()) {
            Utils.showStatus('지갑을 먼저 연결해주세요.', 'warning');
            return;
        }

        if (!confirm(`즉시 구매가 ${auction.buyNowPrice} TORE로 구매하시겠습니까?`)) {
            return;
        }

        try {
            this.showLoading(true);

            // 실제 구현에서는 백엔드 API 호출
            auction.isActive = false;
            auction.currentBid = auction.buyNowPrice;
            auction.highestBidder = walletManager.getCurrentAccount();

            Utils.showStatus('즉시 구매가 완료되었습니다!', 'success');
            
            // 경매 목록 새로고침
            this.renderAuctions('live');

        } catch (error) {
            Utils.showStatus('즉시 구매 실패: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 로딩 표시
     */
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * 경매 종료 처리 (실제 구현에서는 백엔드에서 자동 처리)
     */
    processEndedAuctions() {
        const now = Date.now();
        this.auctions.forEach(auction => {
            if (auction.isActive && auction.endTime <= now) {
                auction.isActive = false;
                // 실제 구현에서는 최고 입찰자에게 NFT 전송 처리
            }
        });
    }

    /**
     * 주기적으로 경매 상태 업데이트
     */
    startAuctionTimer() {
        setInterval(() => {
            this.processEndedAuctions();
            this.renderAuctions('live');
        }, 60000); // 1분마다 업데이트
    }
}

// 경매 타이머 시작
document.addEventListener('DOMContentLoaded', () => {
    if (window.auctionManager) {
        window.auctionManager.startAuctionTimer();
    }
});
