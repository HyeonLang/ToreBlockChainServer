/**
 * 메인 애플리케이션 클래스
 * 
 * 기능:
 * - 전체 애플리케이션 초기화
 * - 탭 전환 관리
 * - 서버 상태 확인
 * - 전역 이벤트 관리
 */

class App {
    constructor() {
        this.managers = {};
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
            this.managers.nft = new NFTManager();
            this.managers.toreToken = new ToreTokenManager();
            
            // 전역 이벤트 리스너 설정
            this.setupGlobalEventListeners();
            
            Utils.showStatus('애플리케이션이 성공적으로 초기화되었습니다!', 'success', 3000);
            
        } catch (error) {
            Utils.showStatus('애플리케이션 초기화 실패: ' + error.message, 'error');
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
                Utils.showStatus('서버 연결 상태: 정상', 'success', 3000);
            } else {
                Utils.showStatus('서버 상태를 확인할 수 없습니다.', 'error');
            }
        } catch (error) {
            Utils.showStatus('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.', 'error');
        }
    }

    /**
     * 전역 이벤트 리스너 설정
     */
    setupGlobalEventListeners() {
        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter로 폼 제출
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const activeForm = document.querySelector('.tab-content.active form');
                if (activeForm) {
                    activeForm.dispatchEvent(new Event('submit'));
                }
            }
        });

        // 폼 입력 시 실시간 검증
        document.addEventListener('input', (e) => {
            if (e.target.matches('input[pattern]')) {
                this.validateInput(e.target);
            }
        });

        // 페이지 가시성 변경 시 상태 업데이트
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.managers.wallet) {
                this.managers.wallet.checkExistingConnection();
            }
        });
    }

    /**
     * 입력 필드 실시간 검증
     */
    validateInput(input) {
        const pattern = input.getAttribute('pattern');
        const value = input.value.trim();
        
        if (value === '') {
            input.style.borderColor = '#e9ecef';
            return;
        }
        
        const regex = new RegExp(pattern);
        if (regex.test(value)) {
            input.style.borderColor = '#28a745';
        } else {
            input.style.borderColor = '#dc3545';
        }
    }

    /**
     * 탭 전환 함수 (전역에서 사용)
     */
    switchTab(tabName) {
        // 모든 탭과 콘텐츠 비활성화
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // 선택된 탭과 콘텐츠 활성화
        const activeTab = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
        const activeContent = document.getElementById(tabName + 'Tab');
        
        if (activeTab) activeTab.classList.add('active');
        if (activeContent) activeContent.classList.add('active');
        
        // 탭 전환 시 스크롤을 맨 위로
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // 탭 전환 로그
        Utils.showStatus(`${this.getTabDisplayName(tabName)} 탭으로 전환되었습니다.`, 'info', 2000);
    }

    /**
     * 탭 표시 이름 반환
     */
    getTabDisplayName(tabName) {
        const tabNames = {
            'create': 'NFT 생성',
            'transfer': 'NFT 전송',
            'delete': 'NFT 삭제',
            'info': 'NFT 정보',
            'wallet': '지갑 NFT',
            'nftHistory': 'NFT 거래이력',
            'walletHistory': '지갑 거래이력',
            'toreBalance': 'TORE 잔액',
            'toreTransfer': 'TORE 전송',
            'toreHistory': 'TORE 내역'
        };
        return tabNames[tabName] || tabName;
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
            wallet: {
                connected: this.managers.wallet?.isConnected() || false,
                account: this.managers.wallet?.getCurrentAccount() || null
            },
            nft: {
                contractAddress: this.managers.nft?.contractAddress || null
            },
            server: {
                status: 'connected' // 실제로는 서버 상태를 확인해야 함
            }
        };
    }
}

// 전역 함수들
window.switchTab = function(tabName) {
    if (window.app) {
        window.app.switchTab(tabName);
    }
};

// 페이지 로드 시 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
