/**
 * 지갑 관리 클래스
 * 
 * 기능:
 * - MetaMask 지갑 연결
 * - 지갑 상태 관리
 * - 계정 변경 감지
 * - 지갑 정보 표시
 */

class WalletManager {
    constructor() {
        this.currentAccount = null;
        this.provider = null;
        this.signer = null;
        this.init();
    }

    /**
     * 초기화
     */
    init() {
        this.setupEventListeners();
        this.checkExistingConnection();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // MetaMask 연결 버튼
        const connectBtn = document.getElementById('connectBtn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectWallet());
        }

        // MetaMask 계정 변경 감지
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                this.handleAccountsChanged(accounts);
            });

            window.ethereum.on('chainChanged', (chainId) => {
                this.handleChainChanged(chainId);
            });
        }
    }

    /**
     * 기존 연결 확인
     */
    async checkExistingConnection() {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.currentAccount = accounts[0];
                    this.updateWalletInfo();
                    Utils.autoFillWalletAddress(this.currentAccount);
                }
            } catch (error) {
                console.log('기존 연결 확인 실패:', error);
            }
        }
    }

    /**
     * 계정 변경 처리
     */
    handleAccountsChanged(accounts) {
        if (accounts.length > 0) {
            this.currentAccount = accounts[0];
            this.updateWalletInfo();
            Utils.autoFillWalletAddress(this.currentAccount);
            Utils.showStatus('지갑 계정이 변경되었습니다.', 'info', 3000);
        } else {
            this.currentAccount = null;
            this.hideWalletInfo();
            Utils.showStatus('지갑 연결이 해제되었습니다.', 'info', 3000);
        }
    }

    /**
     * 체인 변경 처리
     */
    handleChainChanged(chainId) {
        Utils.showStatus(`네트워크가 변경되었습니다. (Chain ID: ${chainId})`, 'info', 5000);
        // 필요시 페이지 새로고침
        // window.location.reload();
    }

    /**
     * 지갑 연결
     */
    async connectWallet() {
        try {
            // MetaMask가 설치되어 있는지 확인
            if (typeof window.ethereum === 'undefined') {
                Utils.showStatus('메타마스크가 설치되어 있지 않습니다. 메타마스크를 설치해주세요.', 'error');
                return false;
            }

            Utils.showStatus('MetaMask 연결 중...', 'info');

            // 지갑 연결 요청
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                Utils.showStatus('지갑 연결이 취소되었습니다.', 'error');
                return false;
            }

            // Provider 및 Signer 설정
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.currentAccount = accounts[0];
            
            // 연결된 주소 표시
            this.updateWalletInfo();
            Utils.autoFillWalletAddress(this.currentAccount);
            
            // 예시 토큰 URI 설정
            const tokenURI = document.getElementById('tokenURI');
            if (tokenURI && !tokenURI.value) {
                tokenURI.value = 'https://ipfs.io/ipfs/QmYourMetadataHash';
            }
            
            Utils.showStatus('지갑이 성공적으로 연결되었습니다!', 'success');
            return true;

        } catch (error) {
            Utils.showStatus('지갑 연결 실패: ' + (error && error.message ? error.message : String(error)), 'error');
            return false;
        }
    }

    /**
     * 지갑 정보 업데이트
     */
    updateWalletInfo() {
        const walletInfo = document.getElementById('walletInfo');
        const walletAddress = document.getElementById('walletAddress');
        
        if (this.currentAccount && walletInfo && walletAddress) {
            walletAddress.textContent = this.currentAccount;
            walletInfo.classList.remove('hidden');
        }
    }

    /**
     * 지갑 정보 숨기기
     */
    hideWalletInfo() {
        const walletInfo = document.getElementById('walletInfo');
        if (walletInfo) {
            walletInfo.classList.add('hidden');
        }
    }

    /**
     * 현재 계정 주소 반환
     */
    getCurrentAccount() {
        return this.currentAccount;
    }

    /**
     * Provider 반환
     */
    getProvider() {
        return this.provider;
    }

    /**
     * Signer 반환
     */
    getSigner() {
        return this.signer;
    }

    /**
     * 지갑 연결 상태 확인
     */
    isConnected() {
        return this.currentAccount !== null;
    }

    /**
     * 네트워크 정보 가져오기
     */
    async getNetworkInfo() {
        if (!this.provider) return null;
        
        try {
            const network = await this.provider.getNetwork();
            return {
                chainId: network.chainId,
                name: network.name
            };
        } catch (error) {
            console.error('네트워크 정보 가져오기 실패:', error);
            return null;
        }
    }

    /**
     * 잔액 조회
     */
    async getBalance(address = null) {
        if (!this.provider) return null;
        
        try {
            const targetAddress = address || this.currentAccount;
            if (!targetAddress) return null;
            
            const balance = await this.provider.getBalance(targetAddress);
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error('잔액 조회 실패:', error);
            return null;
        }
    }
}

// 전역에서 사용할 수 있도록 window 객체에 추가
window.WalletManager = WalletManager;
