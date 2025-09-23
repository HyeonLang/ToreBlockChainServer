// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ToreToken - 게임 내 화폐 ERC-20 토큰
 * 
 * 기능:
 * - ERC-20 표준을 따르는 게임 내 화폐 토큰
 * - 총 공급량: 10억개 (1,000,000,000 TORE)
 * - 게임 관리자만 민팅/소각 가능
 * - 게임 내 거래를 위한 전송 기능
 * - 게임 보상 지급을 위한 배치 전송 기능
 * - 토큰 잔액 조회 및 이벤트 로깅
 * - NFT와의 거래 지원
 * 
 * 상속:
 * - ERC20: 표준 ERC-20 토큰 기능
 * - Ownable: 소유자 권한 관리
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ToreToken is ERC20, Ownable {
    // 토큰 정보
    uint8 private constant DECIMALS = 18;  // 소수점 자릿수 (18자리)
    uint256 private constant INITIAL_SUPPLY = 1000000000 * 10**DECIMALS;  // 초기 공급량: 1,000,000,000 TORE
    
    // 게임 관련 주소들
    mapping(address => bool) public gameContracts;  // 게임 컨트랙트 주소들
    mapping(address => bool) public gameManagers;   // 게임 매니저 주소들
    
    // 거래소 관련 주소들
    mapping(address => bool) public exchangeContracts;  // 거래소 컨트랙트 주소들
    
    // 이벤트
    event GameContractAdded(address indexed contractAddress);
    event GameContractRemoved(address indexed contractAddress);
    event GameManagerAdded(address indexed manager);
    event GameManagerRemoved(address indexed manager);
    event ExchangeContractAdded(address indexed contractAddress);
    event ExchangeContractRemoved(address indexed contractAddress);
    event GameRewardDistributed(address indexed player, uint256 amount);
    event BatchTransferCompleted(uint256 totalAmount, uint256 recipientCount);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    /**
     * 컨트랙트 생성자
     * 
     * @param initialOwner - 초기 소유자 주소
     */
    constructor(address initialOwner) ERC20("ToreTest", "TORE") Ownable(initialOwner) {
        // 초기 소유자에게 모든 토큰 민팅
        _mint(initialOwner, INITIAL_SUPPLY);
    }

    /**
     * 토큰 소수점 자릿수 반환
     * 
     * @return 토큰의 소수점 자릿수
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * 게임 컨트랙트 추가 (소유자만 실행 가능)
     * 
     * @param contractAddress - 추가할 게임 컨트랙트 주소
     */
    function addGameContract(address contractAddress) external onlyOwner {
        require(contractAddress != address(0), "ToreToken: Invalid contract address");
        gameContracts[contractAddress] = true;
        emit GameContractAdded(contractAddress);
    }

    /**
     * 게임 컨트랙트 제거 (소유자만 실행 가능)
     * 
     * @param contractAddress - 제거할 게임 컨트랙트 주소
     */
    function removeGameContract(address contractAddress) external onlyOwner {
        gameContracts[contractAddress] = false;
        emit GameContractRemoved(contractAddress);
    }

    /**
     * 게임 매니저 추가 (소유자만 실행 가능)
     * 
     * @param manager - 추가할 게임 매니저 주소
     */
    function addGameManager(address manager) external onlyOwner {
        require(manager != address(0), "ToreToken: Invalid manager address");
        gameManagers[manager] = true;
        emit GameManagerAdded(manager);
    }

    /**
     * 게임 매니저 제거 (소유자만 실행 가능)
     * 
     * @param manager - 제거할 게임 매니저 주소
     */
    function removeGameManager(address manager) external onlyOwner {
        gameManagers[manager] = false;
        emit GameManagerRemoved(manager);
    }

    /**
     * 거래소 컨트랙트 추가 (소유자만 실행 가능)
     * 
     * @param contractAddress - 추가할 거래소 컨트랙트 주소
     */
    function addExchangeContract(address contractAddress) external onlyOwner {
        require(contractAddress != address(0), "ToreToken: Invalid contract address");
        exchangeContracts[contractAddress] = true;
        emit ExchangeContractAdded(contractAddress);
    }

    /**
     * 거래소 컨트랙트 제거 (소유자만 실행 가능)
     * 
     * @param contractAddress - 제거할 거래소 컨트랙트 주소
     */
    function removeExchangeContract(address contractAddress) external onlyOwner {
        exchangeContracts[contractAddress] = false;
        emit ExchangeContractRemoved(contractAddress);
    }

    /**
     * 게임 보상 지급 (게임 컨트랙트나 매니저만 실행 가능)
     * 
     * @param player - 보상을 받을 플레이어 주소
     * @param amount - 지급할 토큰 양
     */
    function distributeGameReward(address player, uint256 amount) external {
        require(
            gameContracts[msg.sender] || gameManagers[msg.sender] || msg.sender == owner(),
            "ToreToken: Only authorized game contracts or managers"
        );
        require(player != address(0), "ToreToken: Invalid player address");
        require(amount > 0, "ToreToken: Amount must be greater than 0");
        
        _mint(player, amount);
        emit GameRewardDistributed(player, amount);
    }

    /**
     * 배치 전송 (게임 컨트랙트나 매니저만 실행 가능)
     * 
     * @param recipients - 받을 주소들의 배열
     * @param amounts - 각 주소가 받을 토큰 양의 배열
     */
    function batchTransfer(address[] calldata recipients, uint256[] calldata amounts) external {
        require(
            gameContracts[msg.sender] || gameManagers[msg.sender] || msg.sender == owner(),
            "ToreToken: Only authorized game contracts or managers"
        );
        require(recipients.length == amounts.length, "ToreToken: Arrays length mismatch");
        require(recipients.length > 0, "ToreToken: Empty arrays");
        
        uint256 totalAmount = 0;
        
        // 총 전송량 계산
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        // 발신자 잔액 확인
        require(balanceOf(msg.sender) >= totalAmount, "ToreToken: Insufficient balance");
        
        // 배치 전송 실행
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "ToreToken: Invalid recipient address");
            require(amounts[i] > 0, "ToreToken: Amount must be greater than 0");
            
            _transfer(msg.sender, recipients[i], amounts[i]);
        }
        
        emit BatchTransferCompleted(totalAmount, recipients.length);
    }

    /**
     * 토큰 민팅 (소유자만 실행 가능)
     * 
     * @param to - 토큰을 받을 주소
     * @param amount - 민팅할 토큰 양
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "ToreToken: Invalid address");
        require(amount > 0, "ToreToken: Amount must be greater than 0");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * 토큰 소각 (소유자만 실행 가능)
     * 
     * @param amount - 소각할 토큰 양
     */
    function burn(uint256 amount) external onlyOwner {
        require(amount > 0, "ToreToken: Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "ToreToken: Insufficient balance");
        
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * 특정 주소의 토큰 소각 (소유자만 실행 가능)
     * 
     * @param account - 토큰을 소각할 주소
     * @param amount - 소각할 토큰 양
     */
    function burnFrom(address account, uint256 amount) external onlyOwner {
        require(account != address(0), "ToreToken: Invalid address");
        require(amount > 0, "ToreToken: Amount must be greater than 0");
        require(balanceOf(account) >= amount, "ToreToken: Insufficient balance");
        
        _burn(account, amount);
        emit TokensBurned(account, amount);
    }

    /**
     * 게임 컨트랙트인지 확인
     * 
     * @param contractAddress - 확인할 컨트랙트 주소
     * @return 게임 컨트랙트 여부
     */
    function isGameContract(address contractAddress) external view returns (bool) {
        return gameContracts[contractAddress];
    }

    /**
     * 게임 매니저인지 확인
     * 
     * @param manager - 확인할 매니저 주소
     * @return 게임 매니저 여부
     */
    function isGameManager(address manager) external view returns (bool) {
        return gameManagers[manager];
    }

    /**
     * 거래소 컨트랙트인지 확인
     * 
     * @param contractAddress - 확인할 컨트랙트 주소
     * @return 거래소 컨트랙트 여부
     */
    function isExchangeContract(address contractAddress) external view returns (bool) {
        return exchangeContracts[contractAddress];
    }

    /**
     * 총 공급량 조회
     * 
     * @return 현재 총 토큰 공급량
     */
    function totalSupply() public view override returns (uint256) {
        return super.totalSupply();
    }

    /**
     * 특정 주소의 잔액 조회
     * 
     * @param account - 조회할 주소
     * @return 해당 주소의 토큰 잔액
     */
    function balanceOf(address account) public view override returns (uint256) {
        return super.balanceOf(account);
    }

    /**
     * NFT 거래를 위한 승인 전송 (거래소 컨트랙트만 실행 가능)
     * 
     * @param from - 보내는 주소
     * @param to - 받는 주소
     * @param amount - 전송할 토큰 양
     */
    function exchangeTransfer(address from, address to, uint256 amount) external {
        require(exchangeContracts[msg.sender], "ToreToken: Only authorized exchange contracts");
        require(from != address(0), "ToreToken: Invalid from address");
        require(to != address(0), "ToreToken: Invalid to address");
        require(amount > 0, "ToreToken: Amount must be greater than 0");
        
        _transfer(from, to, amount);
    }
}
