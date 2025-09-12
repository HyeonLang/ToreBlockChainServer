/**
 * 공통 유틸리티 함수들
 * 
 * 기능:
 * - DOM 요소 관리
 * - 상태 메시지 표시
 * - 로딩 상태 관리
 * - 입력값 검증
 * - API 호출 공통 함수
 */

class Utils {
    /**
     * DOM 요소들을 한 번에 가져오는 헬퍼 함수
     */
    static getElements(selectors) {
        const elements = {};
        for (const [key, selector] of Object.entries(selectors)) {
            elements[key] = document.querySelector(selector);
        }
        return elements;
    }

    /**
     * 상태 메시지 표시
     */
    static showStatus(message, type = 'info', duration = 5000) {
        const status = document.getElementById('status');
        const logPanel = document.getElementById('logPanel');
        
        if (!status) return;

        // 상태 메시지 표시
        status.textContent = message;
        status.className = `status ${type}`;
        status.classList.remove('hidden');
        
        // 로그 패널에 메시지 추가
        if (logPanel) {
            const timestamp = new Date().toLocaleTimeString();
            const logMessage = `[${timestamp}] ${message}`;
            const div = document.createElement('div');
            div.textContent = logMessage;
            logPanel.appendChild(div);
            logPanel.scrollTop = logPanel.scrollHeight;
        }
        
        // 성공 메시지는 지정된 시간 후 자동 숨김
        if (type === 'success' && duration > 0) {
            setTimeout(() => {
                status.classList.add('hidden');
            }, duration);
        }
    }

    /**
     * 로딩 상태 설정
     */
    static setLoading(loading, buttonId, textId, loadingId) {
        const button = document.getElementById(buttonId);
        const text = document.getElementById(textId);
        const loading = document.getElementById(loadingId);
        
        if (button) button.disabled = loading;
        if (text) text.style.display = loading ? 'none' : 'inline';
        if (loading) loading.classList.toggle('hidden', !loading);
    }

    /**
     * 이더리움 주소 검증
     */
    static isValidAddress(address) {
        if (typeof ethers !== 'undefined' && ethers.utils) {
            return ethers.utils.isAddress(address);
        }
        // 기본 검증 (0x로 시작하고 42자리)
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    /**
     * URL 검증
     */
    static isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 숫자 검증 (양의 정수)
     */
    static isValidPositiveInteger(value) {
        const num = Number(value);
        return !isNaN(num) && num >= 0 && Number.isInteger(num);
    }

    /**
     * API 호출 공통 함수
     */
    static async apiCall(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP ${response.status}`);
            }

            return { success: true, data };
        } catch (error) {
            return { 
                success: false, 
                error: error.message || '네트워크 연결을 확인해주세요' 
            };
        }
    }

    /**
     * 폼 데이터 검증
     */
    static validateForm(formData, rules) {
        const errors = [];
        
        for (const [field, value] of Object.entries(formData)) {
            const rule = rules[field];
            if (!rule) continue;
            
            if (rule.required && (!value || value.trim() === '')) {
                errors.push(`${rule.label}을(를) 입력해주세요.`);
                continue;
            }
            
            if (value && rule.type === 'address' && !this.isValidAddress(value)) {
                errors.push(`올바른 ${rule.label}을(를) 입력해주세요. (0x로 시작하는 42자리 주소)`);
            }
            
            if (value && rule.type === 'url' && !this.isValidURL(value)) {
                errors.push(`올바른 ${rule.label}을(를) 입력해주세요. (https:// 또는 ipfs://)`);
            }
            
            if (value && rule.type === 'positiveInteger' && !this.isValidPositiveInteger(value)) {
                errors.push(`올바른 ${rule.label}을(를) 입력해주세요. (0 이상의 정수)`);
            }
        }
        
        return errors;
    }

    /**
     * 연결된 지갑 주소를 폼 필드에 자동 입력
     */
    static autoFillWalletAddress(address) {
        if (!address) return;
        
        const fields = [
            'recipientAddress',
            'transferFrom', 
            'walletQueryAddress',
            'walletHistoryAddress',
            'toreBalanceAddress',
            'toreHistoryAddress'
        ];
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !field.value) {
                field.value = address;
            }
        });
    }

    /**
     * 트랜잭션 타입을 한국어로 변환
     */
    static getTransactionTypeText(type) {
        const typeMap = {
            'mint': '민팅',
            'transfer': '전송', 
            'burn': '소각'
        };
        return typeMap[type] || type;
    }

    /**
     * 시간 포맷팅
     */
    static formatTime(timestamp) {
        return new Date(timestamp * 1000).toLocaleString('ko-KR');
    }

    /**
     * 주소 축약 표시
     */
    static shortenAddress(address, start = 6, end = 4) {
        if (!address) return '';
        return `${address.slice(0, start)}...${address.slice(-end)}`;
    }
}

// 전역에서 사용할 수 있도록 window 객체에 추가
window.Utils = Utils;
