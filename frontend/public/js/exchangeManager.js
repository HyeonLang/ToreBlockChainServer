/**
 * 거래소 관리자 클래스
 * 
 * 기능:
 * - NFT 마켓플레이스 관리
 * - 거래 생성, 구매, 취소
 * - 거래 내역 조회
 * - 필터링 및 정렬
 * - 페이지네이션
 */

class ExchangeManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentFilters = {
            category: '',
            priceRange: '',
            sort: 'newest'
        };
        this.activeTrades = [];
        this.userTrades = [];
        this.init();
    }

    /**
     * 초기화
     */
    async init() {
        try {
            await this.loadActiveTrades();
            this.setupEventListeners();
            this.renderMarketplace();
            Utils.showStatus('거래소가 성공적으로 초기화되었습니다!', 'success', 3000);
        } catch (error) {
            Utils.showStatus('거래소 초기화 실패: ' + error.message, 'error');
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 필터 변경 이벤트
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.currentFilters.category = e.target.value;
            this.renderMarketplace();
        });

        document.getElementById('priceFilter').addEventListener('change', (e) => {
            this.currentFilters.priceRange = e.target.value;
            this.renderMarketplace();
        });

        document.getElementById('sortFilter').addEventListener('change', (e) => {
            this.currentFilters.sort = e.target.value;
            this.renderMarketplace();
        });

        // NFT 판매 버튼
        document.getElementById('sellNftBtn').addEventListener('click', () => {
            this.openSellNftModal();
        });

        // 모달 이벤트
        this.setupModalEvents();

        // 탭 전환 이벤트
        this.setupTabEvents();
    }

    /**
     * 모달 이벤트 설정
     */
    setupModalEvents() {
        // 판매 모달 폼 제출
        document.getElementById('sellNftForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSellNft();
        });

        // 구매 확인 버튼
        document.getElementById('confirmPurchaseBtn').addEventListener('click', () => {
            this.handleBuyNft();
        });

        // 가격 입력 시 실시간 계산
        document.getElementById('sellPrice').addEventListener('input', (e) => {
            this.updateNetAmount(e.target.value);
        });
    }

    /**
     * 탭 이벤트 설정
     */
    setupTabEvents() {
        // 네비게이션 탭
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = e.target.getAttribute('href').substring(1);
                this.switchSection(targetSection);
            });
        });

        // 거래 내역 탭
        document.querySelectorAll('#my-trades .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.getAttribute('data-tab');
                this.switchTradeTab(tab);
            });
        });
    }

    /**
     * 활성 거래 목록 로드
     */
    async loadActiveTrades() {
        try {
            const response = await fetch('/api/exchange/active-trades?offset=0&limit=100');
            const data = await response.json();
            
            if (data.success) {
                this.activeTrades = data.data.trades;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('활성 거래 로드 실패:', error);
            this.activeTrades = [];
        }
    }

    /**
     * 사용자 거래 내역 로드
     */
    async loadUserTrades(address) {
        try {
            const response = await fetch(`/api/exchange/user-trades/${address}`);
            const data = await response.json();
            
            if (data.success) {
                this.userTrades = data.data.trades;
                return data.data.trades;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('사용자 거래 내역 로드 실패:', error);
            return [];
        }
    }

    /**
     * 마켓플레이스 렌더링
     */
    renderMarketplace() {
        const grid = document.getElementById('nftGrid');
        const filteredTrades = this.filterTrades(this.activeTrades);
        const paginatedTrades = this.paginateTrades(filteredTrades);

        grid.innerHTML = '';

        if (paginatedTrades.length === 0) {
            grid.innerHTML = `
                <div class="no-items">
                    <i class="fas fa-search"></i>
                    <h3>판매중인 NFT가 없습니다</h3>
                    <p>다른 필터를 시도해보세요.</p>
                </div>
            `;
            return;
        }

        paginatedTrades.forEach(trade => {
            const card = this.createNftCard(trade);
            grid.appendChild(card);
        });

        this.renderPagination(filteredTrades.length);
    }

    /**
     * 거래 필터링
     */
    filterTrades(trades) {
        let filtered = [...trades];

        // 카테고리 필터
        if (this.currentFilters.category) {
            // 실제 구현에서는 NFT 메타데이터에서 카테고리 정보를 가져와야 함
            // 여기서는 시뮬레이션
            filtered = filtered.filter(trade => {
                // 카테고리 필터링 로직
                return true;
            });
        }

        // 가격 범위 필터
        if (this.currentFilters.priceRange) {
            const [min, max] = this.currentFilters.priceRange.split('-').map(Number);
            filtered = filtered.filter(trade => {
                const price = parseFloat(trade.price);
                if (max) {
                    return price >= min && price <= max;
                } else {
                    return price >= min;
                }
            });
        }

        // 정렬
        filtered.sort((a, b) => {
            switch (this.currentFilters.sort) {
                case 'price-low':
                    return parseFloat(a.price) - parseFloat(b.price);
                case 'price-high':
                    return parseFloat(b.price) - parseFloat(a.price);
                case 'newest':
                    return b.createdAt - a.createdAt;
                case 'popular':
                    // 인기도 기준 정렬 (실제 구현에서는 조회수, 좋아요 등을 고려)
                    return Math.random() - 0.5;
                default:
                    return 0;
            }
        });

        return filtered;
    }

    /**
     * 페이지네이션
     */
    paginateTrades(trades) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return trades.slice(startIndex, endIndex);
    }

    /**
     * NFT 카드 생성
     */
    createNftCard(trade) {
        const card = document.createElement('div');
        card.className = 'nft-card';
        card.innerHTML = `
            <div class="nft-image">
                <i class="fas fa-gem"></i>
            </div>
            <div class="nft-info">
                <h3 class="nft-name">NFT #${trade.tokenId}</h3>
                <p class="nft-description">게임 아이템 NFT</p>
                <div class="nft-price">
                    <span class="price">${trade.price} TORE</span>
                    <span class="price-label">판매가</span>
                </div>
                <div class="nft-actions">
                    <button class="btn btn-primary" onclick="exchangeManager.openBuyNftModal(${trade.tradeId})">
                        <i class="fas fa-shopping-cart"></i> 구매하기
                    </button>
                </div>
            </div>
        `;
        return card;
    }

    /**
     * 페이지네이션 렌더링
     */
    renderPagination(totalItems) {
        const pagination = document.getElementById('pagination');
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '';

        // 이전 버튼
        html += `
            <button ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="exchangeManager.changePage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // 페이지 번호들
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `
                    <button class="${i === this.currentPage ? 'active' : ''}" 
                            onclick="exchangeManager.changePage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += '<span>...</span>';
            }
        }

        // 다음 버튼
        html += `
            <button ${this.currentPage === totalPages ? 'disabled' : ''} 
                    onclick="exchangeManager.changePage(${this.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        pagination.innerHTML = html;
    }

    /**
     * 페이지 변경
     */
    changePage(page) {
        this.currentPage = page;
        this.renderMarketplace();
    }

    /**
     * 섹션 전환
     */
    switchSection(sectionId) {
        // 모든 섹션 비활성화
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // 모든 네비게이션 링크 비활성화
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // 선택된 섹션 활성화
        const targetSection = document.getElementById(sectionId);
        const targetLink = document.querySelector(`[href="#${sectionId}"]`);

        if (targetSection) {
            targetSection.classList.add('active');
        }
        if (targetLink) {
            targetLink.classList.add('active');
        }

        // 섹션별 데이터 로드
        switch (sectionId) {
            case 'my-nfts':
                this.loadUserNfts();
                break;
            case 'my-trades':
                this.loadUserTradeHistory();
                break;
            case 'auction':
                this.loadAuctions();
                break;
        }
    }

    /**
     * 거래 내역 탭 전환
     */
    switchTradeTab(tab) {
        // 모든 탭 버튼 비활성화
        document.querySelectorAll('#my-trades .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 선택된 탭 활성화
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // 해당 탭의 거래 내역 렌더링
        this.renderTradeHistory(tab);
    }

    /**
     * 사용자 NFT 로드
     */
    async loadUserNfts() {
        const walletManager = window.app?.getManager('wallet');
        if (!walletManager || !walletManager.isConnected()) {
            Utils.showStatus('지갑을 먼저 연결해주세요.', 'warning');
            return;
        }

        try {
            const address = walletManager.getCurrentAccount();
            const response = await fetch(`/api/nft/balance/${address}`);
            const data = await response.json();

            if (data.success) {
                this.renderUserNfts(data.data.tokens);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            Utils.showStatus('NFT 로드 실패: ' + error.message, 'error');
        }
    }

    /**
     * 사용자 NFT 렌더링
     */
    renderUserNfts(tokens) {
        const grid = document.getElementById('myNftGrid');
        grid.innerHTML = '';

        if (tokens.length === 0) {
            grid.innerHTML = `
                <div class="no-items">
                    <i class="fas fa-box-open"></i>
                    <h3>보유한 NFT가 없습니다</h3>
                    <p>게임에서 NFT를 획득하거나 다른 사용자로부터 구매해보세요.</p>
                </div>
            `;
            return;
        }

        tokens.forEach(tokenId => {
            const card = document.createElement('div');
            card.className = 'nft-card';
            card.innerHTML = `
                <div class="nft-image">
                    <i class="fas fa-gem"></i>
                </div>
                <div class="nft-info">
                    <h3 class="nft-name">NFT #${tokenId}</h3>
                    <p class="nft-description">게임 아이템 NFT</p>
                    <div class="nft-actions">
                        <button class="btn btn-primary" onclick="exchangeManager.openSellNftModal(${tokenId})">
                            <i class="fas fa-tag"></i> 판매하기
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    /**
     * 사용자 거래 내역 로드
     */
    async loadUserTradeHistory() {
        const walletManager = window.app?.getManager('wallet');
        if (!walletManager || !walletManager.isConnected()) {
            Utils.showStatus('지갑을 먼저 연결해주세요.', 'warning');
            return;
        }

        try {
            const address = walletManager.getCurrentAccount();
            const trades = await this.loadUserTrades(address);
            this.renderTradeHistory('sold');
        } catch (error) {
            Utils.showStatus('거래 내역 로드 실패: ' + error.message, 'error');
        }
    }

    /**
     * 거래 내역 렌더링
     */
    renderTradeHistory(tab) {
        const tradeList = document.getElementById('tradeList');
        let trades = [];

        switch (tab) {
            case 'sold':
                trades = this.userTrades.filter(trade => trade.seller === window.app?.getManager('wallet')?.getCurrentAccount());
                break;
            case 'bought':
                trades = this.userTrades.filter(trade => trade.buyer === window.app?.getManager('wallet')?.getCurrentAccount());
                break;
            case 'active':
                trades = this.userTrades.filter(trade => trade.isActive);
                break;
        }

        tradeList.innerHTML = '';

        if (trades.length === 0) {
            tradeList.innerHTML = `
                <div class="no-items">
                    <i class="fas fa-history"></i>
                    <h3>거래 내역이 없습니다</h3>
                    <p>아직 거래한 내역이 없습니다.</p>
                </div>
            `;
            return;
        }

        trades.forEach(trade => {
            const item = this.createTradeItem(trade);
            tradeList.appendChild(item);
        });
    }

    /**
     * 거래 아이템 생성
     */
    createTradeItem(trade) {
        const item = document.createElement('div');
        item.className = 'trade-item';
        
        const statusClass = trade.isActive ? 'status-active' : 
                          trade.completedAt > 0 ? 'status-completed' : 'status-cancelled';
        const statusText = trade.isActive ? '진행중' : 
                          trade.completedAt > 0 ? '완료' : '취소됨';

        item.innerHTML = `
            <div class="trade-nft-info">
                <div class="trade-nft-image">
                    <i class="fas fa-gem"></i>
                </div>
                <div class="trade-details">
                    <h4>NFT #${trade.tokenId}</h4>
                    <p>거래 ID: ${trade.tradeId}</p>
                    <p>생성일: ${new Date(trade.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
            <div class="trade-price">${trade.price} TORE</div>
            <div class="trade-status ${statusClass}">${statusText}</div>
        `;

        return item;
    }

    /**
     * NFT 판매 모달 열기
     */
    openSellNftModal(tokenId = null) {
        const modal = document.getElementById('sellNftModal');
        const nftSelect = document.getElementById('nftSelect');
        
        // NFT 선택 옵션 로드
        this.loadNftOptions(nftSelect, tokenId);
        
        modal.style.display = 'block';
    }

    /**
     * NFT 선택 옵션 로드
     */
    async loadNftOptions(selectElement, selectedTokenId = null) {
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
                    if (selectedTokenId && tokenId === selectedTokenId) {
                        option.selected = true;
                    }
                    selectElement.appendChild(option);
                });
            }
        } catch (error) {
            Utils.showStatus('NFT 목록 로드 실패: ' + error.message, 'error');
        }
    }

    /**
     * NFT 구매 모달 열기
     */
    openBuyNftModal(tradeId) {
        const trade = this.activeTrades.find(t => t.tradeId === tradeId);
        if (!trade) {
            Utils.showStatus('거래 정보를 찾을 수 없습니다.', 'error');
            return;
        }

        const modal = document.getElementById('buyNftModal');
        const preview = document.getElementById('nftPreview');
        const walletManager = window.app?.getManager('wallet');

        // NFT 미리보기 설정
        preview.innerHTML = `
            <div class="nft-preview-image">
                <i class="fas fa-gem"></i>
            </div>
            <h4>NFT #${trade.tokenId}</h4>
        `;

        // 가격 정보 설정
        document.getElementById('nftPrice').textContent = trade.price;
        document.getElementById('purchaseFee').textContent = (trade.price * 0.025).toFixed(2);
        document.getElementById('totalPrice').textContent = (trade.price * 1.025).toFixed(2);

        // 잔액 확인
        if (walletManager && walletManager.isConnected()) {
            this.checkBalance(trade.price);
        }

        modal.style.display = 'block';
    }

    /**
     * 잔액 확인
     */
    async checkBalance(requiredAmount) {
        const walletManager = window.app?.getManager('wallet');
        if (!walletManager || !walletManager.isConnected()) {
            return;
        }

        try {
            const address = walletManager.getCurrentAccount();
            const response = await fetch(`/api/tore/balance/${address}`);
            const data = await response.json();

            if (data.success) {
                const balance = parseFloat(data.data.balance);
                const required = parseFloat(requiredAmount) * 1.025; // 수수료 포함
                
                document.getElementById('myBalance').textContent = balance.toFixed(2);
                
                const insufficientElement = document.getElementById('insufficientBalance');
                if (balance < required) {
                    insufficientElement.style.display = 'block';
                    document.getElementById('confirmPurchaseBtn').disabled = true;
                } else {
                    insufficientElement.style.display = 'none';
                    document.getElementById('confirmPurchaseBtn').disabled = false;
                }
            }
        } catch (error) {
            console.error('잔액 확인 실패:', error);
        }
    }

    /**
     * 순 수령액 업데이트
     */
    updateNetAmount(price) {
        const netAmount = parseFloat(price) * 0.975; // 2.5% 수수료 차감
        document.getElementById('netAmount').textContent = netAmount.toFixed(2) + ' TORE';
    }

    /**
     * NFT 판매 처리
     */
    async handleSellNft() {
        const tokenId = document.getElementById('nftSelect').value;
        const price = document.getElementById('sellPrice').value;

        if (!tokenId || !price) {
            Utils.showStatus('모든 필드를 입력해주세요.', 'warning');
            return;
        }

        try {
            this.showLoading(true);

            const response = await fetch('/api/exchange/create-trade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tokenId: parseInt(tokenId),
                    price: parseFloat(price)
                })
            });

            const data = await response.json();

            if (data.success) {
                Utils.showStatus('NFT 판매 등록이 완료되었습니다!', 'success');
                closeModal('sellNftModal');
                await this.loadActiveTrades();
                this.renderMarketplace();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            Utils.showStatus('판매 등록 실패: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * NFT 구매 처리
     */
    async handleBuyNft() {
        const tradeId = this.getCurrentTradeId();
        if (!tradeId) {
            Utils.showStatus('거래 정보를 찾을 수 없습니다.', 'error');
            return;
        }

        try {
            this.showLoading(true);

            const response = await fetch('/api/exchange/buy-nft', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tradeId: tradeId
                })
            });

            const data = await response.json();

            if (data.success) {
                Utils.showStatus('NFT 구매가 완료되었습니다!', 'success');
                closeModal('buyNftModal');
                await this.loadActiveTrades();
                this.renderMarketplace();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            Utils.showStatus('구매 실패: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 현재 거래 ID 가져오기
     */
    getCurrentTradeId() {
        // 모달에서 현재 거래 ID를 추출하는 로직
        // 실제 구현에서는 모달에 거래 ID를 저장해야 함
        return null;
    }

    /**
     * 로딩 표시
     */
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = show ? 'flex' : 'none';
    }

    /**
     * 경매 로드 (경매 시스템 구현 시 사용)
     */
    async loadAuctions() {
        // 경매 시스템 구현 시 사용
        Utils.showStatus('경매 시스템은 준비 중입니다.', 'info');
    }
}

// 전역 함수들
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 모달 닫기 버튼 이벤트
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
});
