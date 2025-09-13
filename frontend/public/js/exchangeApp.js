/**
 * 거래소 메인 애플리케이션 클래스
 * 
 * 기능:
 * - 거래소 전체 애플리케이션 초기화
 * - 지갑 연결 관리
 * - 매니저들 간의 통합 관리
 * - 전역 이벤트 처리
 */

class ExchangeApp {
    constructor() {
        this.managers = {};
        this.isInitialized = false;
        this.init();
    }

    /**
     * 애플리케이션 초기화
     */
    async init() {
        try {
            // 서버 상태 확인
            await this.checkServerStatus();
            
            // 매니저들 초기화
            this.managers.wallet = new WalletManager();
            this.managers.exchange = new ExchangeManager();
            this.managers.auction = new AuctionManager();
            
            // 전역 이벤트 리스너 설정
            this.setupGlobalEventListeners();
            
            // 지갑 연결 상태 확인
            await this.checkWalletConnection();
            
            this.isInitialized = true;
            Utils.showStatus('거래소가 성공적으로 초기화되었습니다!', 'success', 3000);
            
        } catch (error) {
            Utils.showStatus('거래소 초기화 실패: ' + error.message, 'error');
            console.error('ExchangeApp 초기화 오류:', error);
        }
    }

    /**
     * 서버 상태 확인
     */
    async checkServerStatus() {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            
            if (data.ok) {
                Utils.showStatus('서버 연결 상태: 정상', 'success', 2000);
            } else {
                throw new Error('서버 상태 불량');
            }
        } catch (error) {
            Utils.showStatus('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.', 'error');
            throw error;
        }
    }

    /**
     * 지갑 연결 상태 확인
     */
    async checkWalletConnection() {
        const walletManager = this.managers.wallet;
        if (walletManager && walletManager.isConnected()) {
            await this.updateWalletInfo();
        }
    }

    /**
     * 지갑 정보 업데이트
     */
    async updateWalletInfo() {
        const walletManager = this.managers.wallet;
        if (!walletManager || !walletManager.isConnected()) {
            return;
        }

        try {
            const address = walletManager.getCurrentAccount();
            
            // 지갑 주소 표시
            const walletAddressElement = document.getElementById('walletAddress');
            if (walletAddressElement) {
                walletAddressElement.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
            }

            // TORE 잔액 조회
            const response = await fetch(`/api/tore/balance/${address}`);
            const data = await response.json();

            if (data.success) {
                const balanceElement = document.getElementById('toreBalance');
                if (balanceElement) {
                    balanceElement.textContent = `${parseFloat(data.data.balance).toFixed(2)} TORE`;
                }
            }

            // 지갑 정보 표시
            const walletInfoElement = document.getElementById('walletInfo');
            const connectBtnElement = document.getElementById('connectWalletBtn');
            
            if (walletInfoElement && connectBtnElement) {
                walletInfoElement.style.display = 'flex';
                connectBtnElement.style.display = 'none';
            }

        } catch (error) {
            console.error('지갑 정보 업데이트 실패:', error);
        }
    }

    /**
     * 전역 이벤트 리스너 설정
     */
    setupGlobalEventListeners() {
        // 지갑 연결 버튼
        const connectWalletBtn = document.getElementById('connectWalletBtn');
        if (connectWalletBtn) {
            connectWalletBtn.addEventListener('click', () => {
                this.handleWalletConnection();
            });
        }

        // 지갑 연결 상태 변경 감지
        if (this.managers.wallet) {
            this.managers.wallet.onConnectionChange = (connected) => {
                this.handleWalletConnectionChange(connected);
            };
        }

        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // 페이지 가시성 변경 시 상태 업데이트
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isInitialized) {
                this.refreshData();
            }
        });

        // 네트워크 상태 변경 감지
        window.addEventListener('online', () => {
            Utils.showStatus('인터넷 연결이 복구되었습니다.', 'success');
            this.refreshData();
        });

        window.addEventListener('offline', () => {
            Utils.showStatus('인터넷 연결이 끊어졌습니다.', 'warning');
        });
    }

    /**
     * 지갑 연결 처리
     */
    async handleWalletConnection() {
        try {
            const walletManager = this.managers.wallet;
            if (!walletManager) {
                throw new Error('지갑 매니저가 초기화되지 않았습니다.');
            }

            await walletManager.connectWallet();
            await this.updateWalletInfo();
            
            Utils.showStatus('지갑이 성공적으로 연결되었습니다!', 'success');
            
        } catch (error) {
            Utils.showStatus('지갑 연결 실패: ' + error.message, 'error');
        }
    }

    /**
     * 지갑 연결 상태 변경 처리
     */
    async handleWalletConnectionChange(connected) {
        const walletInfoElement = document.getElementById('walletInfo');
        const connectBtnElement = document.getElementById('connectWalletBtn');
        
        if (connected) {
            if (walletInfoElement && connectBtnElement) {
                walletInfoElement.style.display = 'flex';
                connectBtnElement.style.display = 'none';
            }
            await this.updateWalletInfo();
        } else {
            if (walletInfoElement && connectBtnElement) {
                walletInfoElement.style.display = 'none';
                connectBtnElement.style.display = 'block';
            }
        }
    }

    /**
     * 키보드 단축키 처리
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + Enter로 폼 제출
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const activeForm = document.querySelector('.modal.active form, .section.active form');
            if (activeForm) {
                activeForm.dispatchEvent(new Event('submit'));
            }
        }

        // ESC로 모달 닫기
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal[style*="block"]');
            if (openModal) {
                openModal.style.display = 'none';
            }
        }

        // 숫자 키로 탭 전환 (1-4)
        if (e.key >= '1' && e.key <= '4' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const tabIndex = parseInt(e.key) - 1;
            const navLinks = document.querySelectorAll('.nav-link');
            if (navLinks[tabIndex]) {
                navLinks[tabIndex].click();
            }
        }
    }

    /**
     * 데이터 새로고침
     */
    async refreshData() {
        try {
            // 지갑 정보 업데이트
            if (this.managers.wallet && this.managers.wallet.isConnected()) {
                await this.updateWalletInfo();
            }

            // 거래소 데이터 새로고침
            if (this.managers.exchange) {
                await this.managers.exchange.loadActiveTrades();
                this.managers.exchange.renderMarketplace();
            }

            // 경매 데이터 새로고침
            if (this.managers.auction) {
                await this.managers.auction.loadAuctions();
                this.managers.auction.renderAuctions('live');
            }

        } catch (error) {
            console.error('데이터 새로고침 실패:', error);
        }
    }

    /**
     * 매니저 인스턴스 반환
     */
    getManager(type) {
        return this.managers[type];
    }

    /**
     * 전체 상태 정보 반환
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            wallet: {
                connected: this.managers.wallet?.isConnected() || false,
                account: this.managers.wallet?.getCurrentAccount() || null
            },
            exchange: {
                activeTrades: this.managers.exchange?.activeTrades?.length || 0
            },
            auction: {
                activeAuctions: this.managers.auction?.auctions?.filter(a => a.isActive)?.length || 0
            }
        };
    }

    /**
     * 에러 처리
     */
    handleError(error, context = '') {
        console.error(`[ExchangeApp${context ? ' - ' + context : ''}]`, error);
        
        let message = '알 수 없는 오류가 발생했습니다.';
        
        if (error.message) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }

        Utils.showStatus(message, 'error');
    }

    /**
     * 성공 메시지 표시
     */
    showSuccess(message) {
        Utils.showStatus(message, 'success');
    }

    /**
     * 경고 메시지 표시
     */
    showWarning(message) {
        Utils.showStatus(message, 'warning');
    }

    /**
     * 정보 메시지 표시
     */
    showInfo(message) {
        Utils.showStatus(message, 'info');
    }
}

// 유틸리티 함수들
const Utils = {
    /**
     * 상태 메시지 표시
     */
    showStatus(message, type = 'info', duration = 5000) {
        const toast = document.getElementById('toast');
        if (!toast) return;

        // 기존 토스트 제거
        toast.classList.remove('show', 'success', 'error', 'info', 'warning');
        
        // 새 토스트 설정
        toast.textContent = message;
        toast.classList.add('show', type);
        
        // 자동 제거
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    },

    /**
     * 로딩 표시
     */
    showLoading(show, message = '처리중입니다...') {
        const overlay = document.getElementById('loadingOverlay');
        if (!overlay) return;

        if (show) {
            const messageElement = overlay.querySelector('p');
            if (messageElement) {
                messageElement.textContent = message;
            }
            overlay.style.display = 'flex';
        } else {
            overlay.style.display = 'none';
        }
    },

    /**
     * 숫자 포맷팅
     */
    formatNumber(number, decimals = 2) {
        return parseFloat(number).toFixed(decimals);
    },

    /**
     * 주소 단축 표시
     */
    shortenAddress(address, start = 6, end = 4) {
        if (!address) return '';
        return `${address.slice(0, start)}...${address.slice(-end)}`;
    },

    /**
     * 시간 포맷팅
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('ko-KR');
    },

    /**
     * 시간 차이 계산
     */
    getTimeDifference(timestamp) {
        const now = Date.now();
        const diff = timestamp - now;
        
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
    },

    /**
     * 입력 검증
     */
    validateInput(input, type = 'text') {
        const value = input.value.trim();
        
        switch (type) {
            case 'address':
                return /^0x[a-fA-F0-9]{40}$/.test(value);
            case 'number':
                return !isNaN(parseFloat(value)) && parseFloat(value) > 0;
            case 'tokenId':
                return /^\d+$/.test(value) && parseInt(value) > 0;
            default:
                return value.length > 0;
        }
    },

    /**
     * 디바운스 함수
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 스크롤을 맨 위로
     */
    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// 전역 변수 설정
window.exchangeApp = null;
window.exchangeManager = null;
window.auctionManager = null;

// 페이지 로드 시 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.exchangeApp = new ExchangeApp();
        
        // 매니저들을 전역에서 접근 가능하게 설정
        setTimeout(() => {
            if (window.exchangeApp) {
                window.exchangeManager = window.exchangeApp.getManager('exchange');
                window.auctionManager = window.exchangeApp.getManager('auction');
            }
        }, 1000);
        
    } catch (error) {
        console.error('애플리케이션 초기화 실패:', error);
        Utils.showStatus('애플리케이션 초기화에 실패했습니다. 페이지를 새로고침해주세요.', 'error');
    }
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    if (window.exchangeApp) {
        // 필요한 정리 작업 수행
        console.log('거래소 애플리케이션 종료');
    }
});
