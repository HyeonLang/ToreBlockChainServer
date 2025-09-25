// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * MultiTokenFactory - 다중 토큰 발행 팩토리 컨트랙트
 * 
 * 기능:
 * - 여러 종류의 ERC-20 토큰을 동적으로 생성
 * - 각 토큰은 고유한 이름, 심볼, 총 공급량을 가짐
 * - 토큰별 소유자 권한 관리
 * - 토큰 목록 조회 및 관리
 * 
 * 사용 예시:
 * - toretest1 토큰 생성
 * - gametoken1 토큰 생성
 * - 각 토큰은 독립적으로 관리됨
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * 개별 토큰 컨트랙트
 */
contract CustomToken is ERC20, Ownable {
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply,
        address owner
    ) ERC20(name, symbol) Ownable(owner) {
        _decimals = decimals_;
        _mint(owner, initialSupply);
    }
    
    function decimals() public view override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    function burn(uint256 amount) external onlyOwner {
        _burn(msg.sender, amount);
    }
}

/**
 * 토큰 팩토리 컨트랙트
 */
contract MultiTokenFactory is Ownable {
    // 토큰 정보 구조체
    struct TokenInfo {
        string name;
        string symbol;
        address contractAddress;
        uint256 totalSupply;
        uint8 decimals;
        address owner;
        uint256 createdAt;
        bool isActive;
    }
    
    // 토큰 목록
    TokenInfo[] public tokens;
    
    // 토큰 심볼 -> 토큰 인덱스 매핑
    mapping(string => uint256) public tokenIndexBySymbol;
    
    // 토큰 이름 -> 토큰 인덱스 매핑  
    mapping(string => uint256) public tokenIndexByName;
    
    // 토큰 존재 여부
    mapping(string => bool) public tokenExists;
    
    // 이벤트
    event TokenCreated(
        string indexed name,
        string indexed symbol,
        address indexed contractAddress,
        address owner,
        uint256 totalSupply
    );
    
    event TokenDeactivated(string indexed symbol);
    event TokenReactivated(string indexed symbol);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * 새로운 토큰 생성
     * 
     * @param name 토큰 이름 (예: "ToreTest1")
     * @param symbol 토큰 심볼 (예: "TORE1")
     * @param decimals 소수점 자릿수 (기본 18)
     * @param initialSupply 초기 공급량
     * @param tokenOwner 토큰 소유자 (기본값: 팩토리 소유자)
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply,
        address tokenOwner
    ) external onlyOwner returns (address) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        require(initialSupply > 0, "Initial supply must be greater than 0");
        require(!tokenExists[symbol], "Token with this symbol already exists");
        
        address owner = tokenOwner != address(0) ? tokenOwner : msg.sender;
        
        // 새 토큰 컨트랙트 배포
        CustomToken newToken = new CustomToken(
            name,
            symbol,
            decimals,
            initialSupply,
            owner
        );
        
        address tokenAddress = address(newToken);
        
        // 토큰 정보 저장
        TokenInfo memory tokenInfo = TokenInfo({
            name: name,
            symbol: symbol,
            contractAddress: tokenAddress,
            totalSupply: initialSupply,
            decimals: decimals,
            owner: owner,
            createdAt: block.timestamp,
            isActive: true
        });
        
        tokens.push(tokenInfo);
        uint256 tokenIndex = tokens.length - 1;
        
        tokenIndexBySymbol[symbol] = tokenIndex;
        tokenIndexByName[name] = tokenIndex;
        tokenExists[symbol] = true;
        
        emit TokenCreated(name, symbol, tokenAddress, owner, initialSupply);
        
        return tokenAddress;
    }
    
    /**
     * 토큰 정보 조회 (심볼로)
     */
    function getTokenBySymbol(string memory symbol) external view returns (TokenInfo memory) {
        require(tokenExists[symbol], "Token does not exist");
        uint256 index = tokenIndexBySymbol[symbol];
        return tokens[index];
    }
    
    /**
     * 토큰 정보 조회 (이름으로)
     */
    function getTokenByName(string memory name) external view returns (TokenInfo memory) {
        uint256 index = tokenIndexByName[name];
        require(index < tokens.length, "Token does not exist");
        return tokens[index];
    }
    
    /**
     * 모든 토큰 목록 조회
     */
    function getAllTokens() external view returns (TokenInfo[] memory) {
        return tokens;
    }
    
    /**
     * 활성 토큰 목록 조회
     */
    function getActiveTokens() external view returns (TokenInfo[] memory) {
        uint256 activeCount = 0;
        
        // 활성 토큰 개수 계산
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i].isActive) {
                activeCount++;
            }
        }
        
        // 활성 토큰 배열 생성
        TokenInfo[] memory activeTokens = new TokenInfo[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i].isActive) {
                activeTokens[currentIndex] = tokens[i];
                currentIndex++;
            }
        }
        
        return activeTokens;
    }
    
    /**
     * 토큰 개수 조회
     */
    function getTokenCount() external view returns (uint256) {
        return tokens.length;
    }
    
    /**
     * 토큰 비활성화 (소유자만)
     */
    function deactivateToken(string memory symbol) external onlyOwner {
        require(tokenExists[symbol], "Token does not exist");
        uint256 index = tokenIndexBySymbol[symbol];
        tokens[index].isActive = false;
        emit TokenDeactivated(symbol);
    }
    
    /**
     * 토큰 재활성화 (소유자만)
     */
    function reactivateToken(string memory symbol) external onlyOwner {
        require(tokenExists[symbol], "Token does not exist");
        uint256 index = tokenIndexBySymbol[symbol];
        tokens[index].isActive = true;
        emit TokenReactivated(symbol);
    }
    
    /**
     * 토큰 존재 여부 확인
     */
    function isTokenExists(string memory symbol) external view returns (bool) {
        return tokenExists[symbol];
    }
}
