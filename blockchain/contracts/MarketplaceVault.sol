// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MarketplaceVault
 * @notice 온체인에서 NFT 리스팅을 보관하고 즉시 정리하는 경량 마켓플레이스 보관소
 * @dev 저장소에는 활성 리스팅만 남도록 설계되었으며, 거래 기록은 이벤트로만 추적합니다.
 */

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MarketplaceVault is Ownable {
    /// @notice 리스팅 상태를 나타내는 열거형
    enum Status {
        Active,
        SellerCancelled,
        Expired,
        Sold
    }

    /// @notice 단일 NFT 리스팅 정보를 나타내는 구조체
    struct Listing {
        uint256 listingId;
        address seller;
        uint256 price;
        uint256 expiresAt;
        uint256 listTimestamp;
        Status status;
    }

    /// @notice 리스팅 대상 ERC721 컨트랙트
    IERC721 public immutable nftContract;

    /// @notice 결제에 사용할 ERC20 토큰
    IERC20 public immutable paymentToken;

    /// @notice 플랫폼 수수료 수령자
    address public feeCollector;

    /// @notice 플랫폼 수수료(10000 기준, 10000 = 100%)
    uint256 public platformFeePercent;

    /// @notice 다음에 부여할 리스팅 ID (1부터 시작)
    uint256 private _nextListingId = 1;

    /// @notice tokenId 기준 현재 활성 리스팅
    mapping(uint256 => Listing) public listings;

    /// @notice NFT가 리스팅되었을 때 발생
    event NFTListed(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        uint256 expiresAt
    );

    /// @notice NFT가 판매되었을 때 발생 (finalStatus는 항상 Status.Sold)
    event NFTSold(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 price,
        uint256 feeAmount,
        Status finalStatus
    );

    /// @notice NFT가 회수되었을 때 발생 (finalStatus는 SellerCancelled 또는 Expired)
    event NFTReclaimed(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed seller,
        Status finalStatus
    );

    /// @notice 플랫폼 수수료율 변경 시 발생
    event FeeUpdated(uint256 newFeePercent);

    /// @notice 수수료 수령자 변경 시 발생
    event CollectorUpdated(address newCollector);

    /**
     * @param nftAddress 리스팅 대상 ERC721 컨트랙트 주소
     * @param tokenAddress 결제에 사용할 ERC20 토큰 주소
     * @param feeCollector_ 플랫폼 수수료 수령자 주소
     * @param initialFeePercent 초기 수수료율 (10000 = 100%)
     */
    constructor(
        address nftAddress,
        address tokenAddress,
        address feeCollector_,
        uint256 initialFeePercent
    ) Ownable(msg.sender) {
        require(nftAddress != address(0), "MarketplaceVault: invalid NFT address");
        require(tokenAddress != address(0), "MarketplaceVault: invalid token address");
        require(feeCollector_ != address(0), "MarketplaceVault: invalid fee collector");

        nftContract = IERC721(nftAddress);
        paymentToken = IERC20(tokenAddress);
        feeCollector = feeCollector_;
        platformFeePercent = initialFeePercent;
    }

    /**
     * @notice NFT를 리스팅하여 Vault로 이전합니다.
     * @param _tokenId 리스팅할 NFT 토큰 ID
     * @param _price 판매 가격
     * @param _durationInSeconds 리스팅 유지 시간(초)
     */
    function listNFT(
        uint256 _tokenId,
        uint256 _price,
        uint256 _durationInSeconds
    ) external {
        require(_price > 0, "MarketplaceVault: price must be > 0");
        require(_durationInSeconds > 0, "MarketplaceVault: duration must be > 0");

        Listing storage existing = listings[_tokenId];
        require(existing.seller == address(0), "MarketplaceVault: already listed");

        uint256 newListingId = _nextListingId++;
        uint256 expiresAt = block.timestamp + _durationInSeconds;

        // NFT를 Vault로 전송하여 에스크로 보관
        nftContract.transferFrom(msg.sender, address(this), _tokenId);

        listings[_tokenId] = Listing({
            listingId: newListingId,
            seller: msg.sender,
            price: _price,
            expiresAt: expiresAt,
            listTimestamp: block.timestamp,
            status: Status.Active
        });

        emit NFTListed(newListingId, _tokenId, msg.sender, _price, expiresAt);
    }

    /**
     * @notice 리스팅된 NFT를 구매합니다. 구매와 동시에 수수료 및 정산을 진행합니다.
     * @param _tokenId 구매할 NFT 토큰 ID
     */
    function buyNFT(uint256 _tokenId) external {
        Listing storage listing = listings[_tokenId];
        require(listing.seller != address(0), "MarketplaceVault: not listed");
        require(listing.status == Status.Active, "MarketplaceVault: inactive listing");
        require(block.timestamp < listing.expiresAt, "MarketplaceVault: listing expired");

        address seller = listing.seller;
        uint256 feeAmount = (listing.price * platformFeePercent) / 10000;
        uint256 netAmount = listing.price - feeAmount;
        address buyer = msg.sender;

        emit NFTSold(
            listing.listingId,
            _tokenId,
            buyer,
            listing.price,
            feeAmount,
            Status.Sold
        );

        // 저장소를 즉시 비워 가스 환급
        delete listings[_tokenId];

        if (feeAmount > 0) {
            require(
                paymentToken.transferFrom(buyer, feeCollector, feeAmount),
                "MarketplaceVault: fee transfer failed"
            );
        }

        require(
            paymentToken.transferFrom(buyer, seller, netAmount),
            "MarketplaceVault: payment transfer failed"
        );

        nftContract.transferFrom(address(this), buyer, _tokenId);
    }

    /**
     * @notice 판매자가 자신의 리스팅을 회수합니다. 만료 여부에 따라 상태가 결정됩니다.
     * @param _tokenId 회수할 NFT 토큰 ID
     */
    function reclaimNFT(uint256 _tokenId) external {
        Listing storage listing = listings[_tokenId];
        require(listing.seller != address(0), "MarketplaceVault: not listed");
        require(listing.status == Status.Active, "MarketplaceVault: inactive listing");
        require(listing.seller == msg.sender, "MarketplaceVault: not seller");

        Status finalStatus;
        if (block.timestamp >= listing.expiresAt) {
            finalStatus = Status.Expired;
        } else {
            finalStatus = Status.SellerCancelled;
        }

        emit NFTReclaimed(listing.listingId, _tokenId, msg.sender, finalStatus);

        delete listings[_tokenId];

        nftContract.transferFrom(address(this), msg.sender, _tokenId);
    }

    /**
     * @notice 플랫폼 수수료율을 업데이트합니다.
     * @param _newFeePercent 새로운 수수료율 (10000 = 100%)
     */
    function updateFeePercent(uint256 _newFeePercent) external onlyOwner {
        platformFeePercent = _newFeePercent;
        emit FeeUpdated(_newFeePercent);
    }

    /**
     * @notice 수수료 수령자를 변경합니다.
     * @param _newCollector 새로운 수수료 수령자 주소
     */
    function updateFeeCollector(address _newCollector) external onlyOwner {
        require(_newCollector != address(0), "MarketplaceVault: invalid collector");
        feeCollector = _newCollector;
        emit CollectorUpdated(_newCollector);
    }
}


