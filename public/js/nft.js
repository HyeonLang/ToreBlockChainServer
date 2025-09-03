/**
 * NFT 민팅 및 지갑 자동 추가 기능
 * 
 * 기능:
 * - 메타마스크 지갑 연결
 * - NFT 민팅 API 호출
 * - 트랜잭션 완료 후 자동 지갑 추가
 * - 상태 관리 및 UI 업데이트
 */

class NFTMinter {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contractAddress = null;
        this.contractABI = null;
        
        this.init();
    }

    /**
     * 초기화 함수
     */
    async init() {
        try {
            // DOM 요소들
            this.elements = {
                form: document.getElementById('mintForm'),
                connectBtn: document.getElementById('connectBtn'),
                recipientAddress: document.getElementById('recipientAddress'),
                tokenURI: document.getElementById('tokenURI'),
                mintBtn: document.getElementById('mintBtn'),
                btnText: document.getElementById('btnText'),
                btnLoading: document.getElementById('btnLoading'),
                status: document.getElementById('status'),
                walletInfo: document.getElementById('walletInfo'),
                walletAddress: document.getElementById('walletAddress'),
                logPanel: document.getElementById('logPanel')
            };

            // 이벤트 리스너 등록
            this.elements.form.addEventListener('submit', (e) => this.handleMint(e));
            this.elements.connectBtn.addEventListener('click', () => this.connectWallet());
            
            // 컨트랙트 주소 가져오기 (옵션: 서버에서 응답으로 내려주므로 필수 아님)
            await this.getContractAddress().catch(() => {});
            
        } catch (error) {
            this.showStatus('초기화 중 오류가 발생했습니다: ' + error.message, 'error');
        }
    }

    /**
     * 컨트랙트 주소 가져오기
     */
    async getContractAddress() {
        try {
            const response = await fetch('/api/nft/address');
            const data = await response.json();
            
            if (data.address) {
                this.contractAddress = data.address;
                console.log('컨트랙트 주소:', this.contractAddress);
            } else {
                throw new Error('컨트랙트 주소를 가져올 수 없습니다.');
            }
        } catch (error) {
            throw new Error('서버 연결 실패: ' + error.message);
        }
    }

    /**
     * 메타마스크 지갑 연결
     */
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

    /**
     * NFT 민팅 처리
     */
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

            if (typeof ethers !== 'undefined' && ethers.utils && !ethers.utils.isAddress(to)) {
                this.showStatus('올바른 지갑 주소를 입력해주세요.', 'error');
                return;
            }

            // 버튼 비활성화 및 로딩 표시
            this.setLoading(true);
            this.showStatus('NFT 민팅을 시작합니다...', 'info');
            this.log('POST /api/nft/mint to=' + to + ' tokenURI=' + tokenURI);

            // 민팅 API 호출
            const mintResult = await this.mintNFT(to, tokenURI);
            
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
            this.setLoading(false);
        }
    }

    /**
     * NFT 민팅 API 호출
     */
    async mintNFT(to, tokenURI) {
        try {
            const response = await fetch('/api/nft/mint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ to, tokenURI })
            });

            const data = await response.json();
            this.log('Mint response: ' + JSON.stringify(data));

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || '민팅 실패'
                };
            }

            return {
                success: true,
                txHash: data.txHash,
                tokenId: data.tokenId,
                contractAddress: data.contractAddress
            };

        } catch (error) {
            return {
                success: false,
                error: error && error.message ? error.message : String(error)
            };
        }
    }

    /**
     * NFT를 지갑에 자동 추가
     */
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

    /**
     * 로딩 상태 설정
     */
    setLoading(loading) {
        this.elements.mintBtn.disabled = loading;
        this.elements.btnText.style.display = loading ? 'none' : 'inline';
        this.elements.btnLoading.classList.toggle('hidden', !loading);
    }

    /**
     * 상태 메시지 표시
     */
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

    /**
     * 로그 출력
     */
    log(msg) {
        if (!this.elements || !this.elements.logPanel) return;
        const time = new Date().toLocaleTimeString();
        const line = `[${time}] ${msg}`;
        const div = document.createElement('div');
        div.textContent = line;
        this.elements.logPanel.appendChild(div);
        this.elements.logPanel.scrollTop = this.elements.logPanel.scrollHeight;
        // 콘솔에도 출력
        try { console.log(line); } catch (_) {}
    }
}

// 페이지 로드 시 NFT 민터 초기화
document.addEventListener('DOMContentLoaded', () => {
    new NFTMinter();
});
