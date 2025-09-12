// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ToreExchange - NFT와 TORE 토큰 간 거래소 컨트랙트
 * 
 * 기능:
 * - NFT를 TORE 토큰으로 판매
 * - TORE 토큰으로 NFT 구매
 * - 거래 내역 관리 및 이벤트 로깅
 * - 거래 수수료 관리
 * - 거래 취소 기능
 * 
 * 상속:
 * - Ownable: 소유자 권한 관리
 */

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ToreExchange is Ownable, ReentrancyGuard {
    // 컨트랙트 주소들
    IERC721 public nftContract;
    IERC20 public toreTokenContract;
    
    // 거래 구조체
    struct Trade {
        address seller;
        address buyer;
        uint256 tokenId;
        uint256 price;
        bool isActive;
        uint256 createdAt;
        uint256 completedAt;
    }
    
    // 거래 수수료 (기본 2.5%)
    uint256 public feePercentage = 250; // 2.5% (250/10000)
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    // 거래 매핑
    mapping(uint256 => Trade) public trades;
    mapping(address => uint256[]) public userTrades;
    
    // 이벤트
    event TradeCreated(uint256 indexed tradeId, address indexed seller, uint256 indexed tokenId, uint256 price);
    event TradeCompleted(uint256 indexed tradeId, address indexed buyer, uint256 price);
    event TradeCancelled(uint256 indexed tradeId);
    event FeeUpdated(uint256 newFeePercentage);
    
    // 거래 ID 카운터
    uint256 private _tradeIdCounter = 1;
    
    /**
     * 컨트랙트 생성자
     * 
     * @param _nftContract - NFT 컨트랙트 주소
     * @param _toreTokenContract - TORE 토큰 컨트랙트 주소
     * @param initialOwner - 초기 소유자 주소
     */
    constructor(
        address _nftContract,
        address _toreTokenContract,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_nftContract != address(0), "ToreExchange: Invalid NFT contract address");
        require(_toreTokenContract != address(0), "ToreExchange: Invalid TORE token contract address");
        
        nftContract = IERC721(_nftContract);
        toreTokenContract = IERC20(_toreTokenContract);
    }
    
    /**
     * NFT 판매 등록
     * 
     * @param tokenId - 판매할 NFT 토큰 ID
     * @param price - 판매 가격 (TORE 토큰 단위)
     */
    function createTrade(uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "ToreExchange: Price must be greater than 0");
        require(nftContract.ownerOf(tokenId) == msg.sender, "ToreExchange: Not the owner of this NFT");
        require(nftContract.getApproved(tokenId) == address(this) || 
                nftContract.isApprovedForAll(msg.sender, address(this)), 
                "ToreExchange: Contract not approved to transfer NFT");
        
        // 거래 생성
        uint256 tradeId = _tradeIdCounter++;
        trades[tradeId] = Trade({
            seller: msg.sender,
            buyer: address(0),
            tokenId: tokenId,
            price: price,
            isActive: true,
            createdAt: block.timestamp,
            completedAt: 0
        });
        
        userTrades[msg.sender].push(tradeId);
        
        emit TradeCreated(tradeId, msg.sender, tokenId, price);
    }
    
    /**
     * NFT 구매
     * 
     * @param tradeId - 구매할 거래 ID
     */
    function buyNFT(uint256 tradeId) external nonReentrant {
        Trade storage trade = trades[tradeId];
        require(trade.isActive, "ToreExchange: Trade is not active");
        require(trade.seller != msg.sender, "ToreExchange: Cannot buy your own NFT");
        require(toreTokenContract.balanceOf(msg.sender) >= trade.price, "ToreExchange: Insufficient TORE balance");
        
        // 거래 완료 처리
        trade.isActive = false;
        trade.buyer = msg.sender;
        trade.completedAt = block.timestamp;
        
        // 수수료 계산
        uint256 fee = (trade.price * feePercentage) / FEE_DENOMINATOR;
        uint256 sellerAmount = trade.price - fee;
        
        // TORE 토큰 전송
        require(toreTokenContract.transferFrom(msg.sender, trade.seller, sellerAmount), "ToreExchange: TORE transfer failed");
        if (fee > 0) {
            require(toreTokenContract.transferFrom(msg.sender, owner(), fee), "ToreExchange: Fee transfer failed");
        }
        
        // NFT 전송
        nftContract.transferFrom(trade.seller, msg.sender, trade.tokenId);
        
        userTrades[msg.sender].push(tradeId);
        
        emit TradeCompleted(tradeId, msg.sender, trade.price);
    }
    
    /**
     * 거래 취소 (판매자만 가능)
     * 
     * @param tradeId - 취소할 거래 ID
     */
    function cancelTrade(uint256 tradeId) external {
        Trade storage trade = trades[tradeId];
        require(trade.isActive, "ToreExchange: Trade is not active");
        require(trade.seller == msg.sender, "ToreExchange: Only seller can cancel trade");
        
        trade.isActive = false;
        
        emit TradeCancelled(tradeId);
    }
    
    /**
     * 거래 수수료 업데이트 (소유자만 가능)
     * 
     * @param newFeePercentage - 새로운 수수료 비율 (기본 10000분의 1)
     */
    function updateFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 1000, "ToreExchange: Fee cannot exceed 10%");
        feePercentage = newFeePercentage;
        emit FeeUpdated(newFeePercentage);
    }
    
    /**
     * 컨트랙트 주소 업데이트 (소유자만 가능)
     * 
     * @param _nftContract - 새로운 NFT 컨트랙트 주소
     * @param _toreTokenContract - 새로운 TORE 토큰 컨트랙트 주소
     */
    function updateContracts(address _nftContract, address _toreTokenContract) external onlyOwner {
        require(_nftContract != address(0), "ToreExchange: Invalid NFT contract address");
        require(_toreTokenContract != address(0), "ToreExchange: Invalid TORE token contract address");
        
        nftContract = IERC721(_nftContract);
        toreTokenContract = IERC20(_toreTokenContract);
    }
    
    /**
     * 거래 정보 조회
     * 
     * @param tradeId - 조회할 거래 ID
     * @return 거래 정보
     */
    function getTrade(uint256 tradeId) external view returns (Trade memory) {
        return trades[tradeId];
    }
    
    /**
     * 사용자 거래 목록 조회
     * 
     * @param user - 조회할 사용자 주소
     * @return 사용자의 거래 ID 배열
     */
    function getUserTrades(address user) external view returns (uint256[] memory) {
        return userTrades[user];
    }
    
    /**
     * 활성 거래 목록 조회
     * 
     * @param offset - 시작 인덱스
     * @param limit - 조회할 개수
     * @return 활성 거래 ID 배열
     */
    function getActiveTrades(uint256 offset, uint256 limit) external view returns (uint256[] memory) {
        uint256[] memory activeTrades = new uint256[](limit);
        uint256 count = 0;
        
        for (uint256 i = offset; i < _tradeIdCounter && count < limit; i++) {
            if (trades[i].isActive) {
                activeTrades[count] = i;
                count++;
            }
        }
        
        // 실제 개수만큼 배열 크기 조정
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeTrades[i];
        }
        
        return result;
    }
    
    /**
     * 총 거래 수 조회
     * 
     * @return 총 거래 수
     */
    function getTotalTrades() external view returns (uint256) {
        return _tradeIdCounter - 1;
    }
    
    /**
     * 활성 거래 수 조회
     * 
     * @return 활성 거래 수
     */
    function getActiveTradeCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i < _tradeIdCounter; i++) {
            if (trades[i].isActive) {
                count++;
            }
        }
        return count;
    }
}
