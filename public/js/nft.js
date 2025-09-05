/**
 * NFT 민팅 및 지갑 자동 추가 기능
 * 
 * 기능:
 * - 메타마스크 지갑 연결
 * - NFT 생성 (민팅)
 * - NFT 전송
 * - NFT 삭제 (소각)
 * - NFT 조회
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
                // 기존 요소들
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
                logPanel: document.getElementById('logPanel'),
                
                // 새로운 요소들
                transferForm: document.getElementById('transferForm'),
                transferFrom: document.getElementById('transferFrom'),
                transferTo: document.getElementById('transferTo'),
                transferTokenId: document.getElementById('transferTokenId'),
                transferBtn: document.getElementById('transferBtn'),
                transferBtnText: document.getElementById('transferBtnText'),
                transferBtnLoading: document.getElementById('transferBtnLoading'),
                
                deleteForm: document.getElementById('deleteForm'),
                deleteTokenId: document.getElementById('deleteTokenId'),
                deleteBtn: document.getElementById('deleteBtn'),
                deleteBtnText: document.getElementById('deleteBtnText'),
                deleteBtnLoading: document.getElementById('deleteBtnLoading'),
                
                infoForm: document.getElementById('infoForm'),
                infoTokenId: document.getElementById('infoTokenId'),
                infoBtn: document.getElementById('infoBtn'),
                infoBtnText: document.getElementById('infoBtnText'),
                infoBtnLoading: document.getElementById('infoBtnLoading'),
                nftInfo: document.getElementById('nftInfo'),
                nftOwner: document.getElementById('nftOwner'),
                nftTokenURI: document.getElementById('nftTokenURI'),
                
                walletForm: document.getElementById('walletForm'),
                walletQueryAddress: document.getElementById('walletQueryAddress'),
                walletBtn: document.getElementById('walletBtn'),
                walletBtnText: document.getElementById('walletBtnText'),
                walletBtnLoading: document.getElementById('walletBtnLoading'),
                walletNfts: document.getElementById('walletNfts'),
                walletNftsList: document.getElementById('walletNftsList')
            };

            // 이벤트 리스너 등록
            this.elements.form.addEventListener('submit', (e) => this.handleMint(e));
            this.elements.connectBtn.addEventListener('click', () => this.connectWallet());
            
            // 새로운 이벤트 리스너들
            this.elements.transferForm.addEventListener('submit', (e) => this.handleTransfer(e));
            this.elements.deleteForm.addEventListener('submit', (e) => this.handleDelete(e));
            this.elements.infoForm.addEventListener('submit', (e) => this.handleInfo(e));
            this.elements.walletForm.addEventListener('submit', (e) => this.handleWallet(e));
            
            // 서버 상태 확인
            await this.checkServerStatus();
            
            // 컨트랙트 주소 가져오기
            await this.getContractAddress().catch(() => {});
            
        } catch (error) {
            this.showStatus('초기화 중 오류가 발생했습니다: ' + error.message, 'error');
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
                this.log('서버 연결 상태: 정상');
            } else {
                this.showStatus('서버 상태를 확인할 수 없습니다.', 'error');
            }
        } catch (error) {
            this.showStatus('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.', 'error');
            this.log('Server health check failed: ' + error.message);
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
                this.log('컨트랙트 주소: ' + this.contractAddress);
            } else {
                throw new Error('컨트랙트 주소를 가져올 수 없습니다.');
            }
        } catch (error) {
            this.showStatus('컨트랙트 주소를 가져올 수 없습니다: ' + error.message, 'error');
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
            this.elements.transferFrom.value = address;
            this.elements.walletQueryAddress.value = address;
            
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
     * NFT 생성 (민팅) 함수
     * 
     * @param {string} to - NFT를 받을 주소
     * @param {string} tokenURI - 토큰의 메타데이터 URI
     * @returns {Promise<Object>} 민팅 결과
     */
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

    /**
     * NFT 전송 함수
     * 
     * @param {string} from - NFT를 보내는 주소
     * @param {string} to - NFT를 받을 주소
     * @param {string|number} tokenId - 전송할 NFT의 토큰 ID
     * @returns {Promise<Object>} 전송 결과
     */
    async transferNFT(from, to, tokenId) {
        try {
            this.log('Transferring NFT... from=' + from + ' to=' + to + ' tokenId=' + tokenId);
            
            const response = await fetch('/api/nft/transfer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ from, to, tokenId })
            });

            const data = await response.json();
            this.log('Transfer NFT response: ' + JSON.stringify(data));

            if (!response.ok) {
                let errorMessage = 'NFT 전송 실패';
                if (data.error) {
                    errorMessage = data.error;
                } else if (data.message) {
                    errorMessage = data.message;
                } else if (response.status === 400) {
                    errorMessage = '잘못된 요청입니다. 입력값을 확인해주세요.';
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
                txHash: data.txHash
            };

        } catch (error) {
            this.log('Network error: ' + error.message);
            return {
                success: false,
                error: '네트워크 연결을 확인해주세요: ' + (error && error.message ? error.message : String(error))
            };
        }
    }

    /**
     * NFT 삭제 (소각) 함수
     * 
     * @param {string|number} tokenId - 삭제할 NFT의 토큰 ID
     * @returns {Promise<Object>} 삭제 결과
     */
    async deleteNFT(tokenId) {
        try {
            this.log('Deleting NFT... tokenId=' + tokenId);
            
            const response = await fetch('/api/nft/burn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tokenId })
            });

            const data = await response.json();
            this.log('Delete NFT response: ' + JSON.stringify(data));

            if (!response.ok) {
                let errorMessage = 'NFT 삭제 실패';
                if (data.error) {
                    errorMessage = data.error;
                } else if (data.message) {
                    errorMessage = data.message;
                } else if (response.status === 400) {
                    errorMessage = '잘못된 요청입니다. 입력값을 확인해주세요.';
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
                txHash: data.txHash
            };

        } catch (error) {
            this.log('Network error: ' + error.message);
            return {
                success: false,
                error: '네트워크 연결을 확인해주세요: ' + (error && error.message ? error.message : String(error))
            };
        }
    }

    /**
     * NFT 정보 조회 함수
     * 
     * @param {string|number} tokenId - 조회할 NFT의 토큰 ID
     * @returns {Promise<Object>} NFT 정보
     */
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

    /**
     * 지갑의 모든 NFT 조회 함수
     * 
     * @param {string} walletAddress - 조회할 지갑 주소
     * @returns {Promise<Object>} 지갑 NFT 목록
     */
    async getWalletNFTs(walletAddress) {
        try {
            this.log('Getting wallet NFTs... walletAddress=' + walletAddress);
            
            const response = await fetch(`/api/nft/wallet?walletAddress=${encodeURIComponent(walletAddress)}`);
            const data = await response.json();
            
            this.log('Get wallet NFTs response: ' + JSON.stringify(data));

            if (!response.ok) {
                let errorMessage = '지갑 NFT 조회 실패';
                if (data.error) {
                    errorMessage = data.error;
                } else if (data.message) {
                    errorMessage = data.message;
                } else if (response.status === 400) {
                    errorMessage = '잘못된 요청입니다. 지갑 주소를 확인해주세요.';
                } else if (response.status === 404) {
                    errorMessage = '해당 지갑을 찾을 수 없습니다.';
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
                nfts: data.nfts || []
            };

        } catch (error) {
            this.log('Network error: ' + error.message);
            return {
                success: false,
                error: '네트워크 연결을 확인해주세요: ' + (error && error.message ? error.message : String(error))
            };
        }
    }

    /**
     * NFT 민팅 처리 (기존 함수명 유지)
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

            // 주소 형식 검증
            if (typeof ethers !== 'undefined' && ethers.utils && !ethers.utils.isAddress(to)) {
                this.showStatus('올바른 지갑 주소를 입력해주세요. (0x로 시작하는 42자리 주소)', 'error');
                return;
            }

            // URI 형식 검증
            try {
                new URL(tokenURI);
            } catch {
                this.showStatus('올바른 URL 형식을 입력해주세요. (https:// 또는 ipfs://)', 'error');
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

    /**
     * NFT 전송 처리
     */
    async handleTransfer(event) {
        event.preventDefault();
        
        try {
            // 폼 데이터 가져오기
            const from = this.elements.transferFrom.value.trim();
            const to = this.elements.transferTo.value.trim();
            const tokenId = this.elements.transferTokenId.value.trim();

            // 입력값 검증
            if (!from || !to || !tokenId) {
                this.showStatus('모든 필드를 입력해주세요.', 'error');
                return;
            }

            // 주소 형식 검증
            if (typeof ethers !== 'undefined' && ethers.utils) {
                if (!ethers.utils.isAddress(from)) {
                    this.showStatus('올바른 보내는 주소를 입력해주세요. (0x로 시작하는 42자리 주소)', 'error');
                    return;
                }
                if (!ethers.utils.isAddress(to)) {
                    this.showStatus('올바른 받는 주소를 입력해주세요. (0x로 시작하는 42자리 주소)', 'error');
                    return;
                }
            }

            // 토큰 ID 검증
            const tokenIdNum = Number(tokenId);
            if (isNaN(tokenIdNum) || tokenIdNum < 0 || !Number.isInteger(tokenIdNum)) {
                this.showStatus('올바른 토큰 ID를 입력해주세요. (0 이상의 정수)', 'error');
                return;
            }

            // 같은 주소로 전송하는지 확인
            if (from.toLowerCase() === to.toLowerCase()) {
                this.showStatus('보내는 주소와 받는 주소가 같습니다.', 'error');
                return;
            }

            // 버튼 비활성화 및 로딩 표시
            this.setLoading(true, 'transfer');
            this.showStatus('NFT 전송을 시작합니다...', 'info');

            // NFT 전송 함수 호출
            const transferResult = await this.transferNFT(from, to, tokenId);
            
            if (transferResult.success) {
                this.showStatus(`전송 성공! 트랜잭션 해시: ${transferResult.txHash}`, 'success');
                this.log('Transfer success txHash=' + transferResult.txHash);
                
            } else {
                this.showStatus('전송 실패: ' + transferResult.error, 'error');
                this.log('Transfer failed: ' + transferResult.error);
            }

        } catch (error) {
            this.showStatus('전송 중 오류가 발생했습니다: ' + error.message, 'error');
        } finally {
            this.setLoading(false, 'transfer');
        }
    }

    /**
     * NFT 삭제 처리
     */
    async handleDelete(event) {
        event.preventDefault();
        
        try {
            // 폼 데이터 가져오기
            const tokenId = this.elements.deleteTokenId.value.trim();

            // 입력값 검증
            if (!tokenId) {
                this.showStatus('토큰 ID를 입력해주세요.', 'error');
                return;
            }

            const tokenIdNum = Number(tokenId);
            if (isNaN(tokenIdNum) || tokenIdNum < 0 || !Number.isInteger(tokenIdNum)) {
                this.showStatus('올바른 토큰 ID를 입력해주세요. (0 이상의 정수)', 'error');
                return;
            }

            // 확인 메시지
            if (!confirm(`정말로 토큰 ID ${tokenId}의 NFT를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
                return;
            }

            // 버튼 비활성화 및 로딩 표시
            this.setLoading(true, 'delete');
            this.showStatus('NFT 삭제를 시작합니다...', 'info');

            // NFT 삭제 함수 호출
            const deleteResult = await this.deleteNFT(tokenId);
            
            if (deleteResult.success) {
                this.showStatus(`삭제 성공! 트랜잭션 해시: ${deleteResult.txHash}`, 'success');
                this.log('Delete success txHash=' + deleteResult.txHash);
                
                // 폼 초기화
                this.elements.deleteTokenId.value = '';
                
            } else {
                this.showStatus('삭제 실패: ' + deleteResult.error, 'error');
                this.log('Delete failed: ' + deleteResult.error);
            }

        } catch (error) {
            this.showStatus('삭제 중 오류가 발생했습니다: ' + error.message, 'error');
        } finally {
            this.setLoading(false, 'delete');
        }
    }

    /**
     * NFT 정보 조회 처리
     */
    async handleInfo(event) {
        event.preventDefault();
        
        try {
            // 폼 데이터 가져오기
            const tokenId = this.elements.infoTokenId.value.trim();

            // 입력값 검증
            if (!tokenId) {
                this.showStatus('토큰 ID를 입력해주세요.', 'error');
                return;
            }

            const tokenIdNum = Number(tokenId);
            if (isNaN(tokenIdNum) || tokenIdNum < 0 || !Number.isInteger(tokenIdNum)) {
                this.showStatus('올바른 토큰 ID를 입력해주세요. (0 이상의 정수)', 'error');
                return;
            }

            // 버튼 비활성화 및 로딩 표시
            this.setLoading(true, 'info');
            this.showStatus('NFT 정보를 조회합니다...', 'info');

            // NFT 정보 조회 함수 호출
            const infoResult = await this.getNFTInfo(tokenId);
            
            if (infoResult.success) {
                this.showStatus('NFT 정보 조회 성공!', 'success');
                this.log('Info success owner=' + infoResult.owner + ' tokenURI=' + infoResult.tokenURI);
                
                // NFT 정보 표시
                this.elements.nftOwner.textContent = infoResult.owner;
                this.elements.nftTokenURI.textContent = infoResult.tokenURI;
                this.elements.nftInfo.classList.remove('hidden');
                
            } else {
                this.showStatus('정보 조회 실패: ' + infoResult.error, 'error');
                this.log('Info failed: ' + infoResult.error);
                this.elements.nftInfo.classList.add('hidden');
            }

        } catch (error) {
            this.showStatus('정보 조회 중 오류가 발생했습니다: ' + error.message, 'error');
        } finally {
            this.setLoading(false, 'info');
        }
    }

    /**
     * 지갑 NFT 조회 처리
     */
    async handleWallet(event) {
        event.preventDefault();
        
        try {
            // 폼 데이터 가져오기
            const walletAddress = this.elements.walletQueryAddress.value.trim();

            // 입력값 검증
            if (!walletAddress) {
                this.showStatus('지갑 주소를 입력해주세요.', 'error');
                return;
            }

            // 주소 형식 검증
            if (typeof ethers !== 'undefined' && ethers.utils && !ethers.utils.isAddress(walletAddress)) {
                this.showStatus('올바른 지갑 주소를 입력해주세요. (0x로 시작하는 42자리 주소)', 'error');
                return;
            }

            // 버튼 비활성화 및 로딩 표시
            this.setLoading(true, 'wallet');
            this.showStatus('지갑 NFT를 조회합니다...', 'info');

            // 지갑 NFT 조회 함수 호출
            const walletResult = await this.getWalletNFTs(walletAddress);
            
            if (walletResult.success) {
                this.showStatus(`지갑 NFT 조회 성공! (${walletResult.nfts.length}개 발견)`, 'success');
                this.log('Wallet success count=' + walletResult.nfts.length);
                
                // NFT 목록 표시
                this.displayWalletNFTs(walletResult.nfts);
                this.elements.walletNfts.classList.remove('hidden');
                
            } else {
                this.showStatus('지갑 조회 실패: ' + walletResult.error, 'error');
                this.log('Wallet failed: ' + walletResult.error);
                this.elements.walletNfts.classList.add('hidden');
            }

        } catch (error) {
            this.showStatus('지갑 조회 중 오류가 발생했습니다: ' + error.message, 'error');
        } finally {
            this.setLoading(false, 'wallet');
        }
    }

    /**
     * 지갑 NFT 목록 표시
     */
    displayWalletNFTs(nfts) {
        const listElement = this.elements.walletNftsList;
        listElement.innerHTML = '';

        if (nfts.length === 0) {
            listElement.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">소유한 NFT가 없습니다.</p>';
            return;
        }

        nfts.forEach((nft, index) => {
            const nftElement = document.createElement('div');
            nftElement.style.cssText = `
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 10px;
                font-family: monospace;
                font-size: 14px;
            `;
            
            nftElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong>NFT #${nft.tokenId}</strong>
                    <span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                        ${index + 1}번째
                    </span>
                </div>
                <div style="margin-bottom: 5px;">
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
    setLoading(loading, type = 'mint') {
        if (type === 'mint') {
            this.elements.mintBtn.disabled = loading;
            this.elements.btnText.style.display = loading ? 'none' : 'inline';
            this.elements.btnLoading.classList.toggle('hidden', !loading);
        } else if (type === 'transfer') {
            this.elements.transferBtn.disabled = loading;
            this.elements.transferBtnText.style.display = loading ? 'none' : 'inline';
            this.elements.transferBtnLoading.classList.toggle('hidden', !loading);
        } else if (type === 'delete') {
            this.elements.deleteBtn.disabled = loading;
            this.elements.deleteBtnText.style.display = loading ? 'none' : 'inline';
            this.elements.deleteBtnLoading.classList.toggle('hidden', !loading);
        } else if (type === 'info') {
            this.elements.infoBtn.disabled = loading;
            this.elements.infoBtnText.style.display = loading ? 'none' : 'inline';
            this.elements.infoBtnLoading.classList.toggle('hidden', !loading);
        } else if (type === 'wallet') {
            this.elements.walletBtn.disabled = loading;
            this.elements.walletBtnText.style.display = loading ? 'none' : 'inline';
            this.elements.walletBtnLoading.classList.toggle('hidden', !loading);
        }
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
