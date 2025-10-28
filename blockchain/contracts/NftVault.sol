// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * NFT Vault 컨트랙트
 * 
 * 기능:
 * - NFT를 보관하는 락업 컨트랙트
 * - 소유자만 락업/락업 해제 가능
 * - ERC721 토큰을 보관 및 반환
 * 
 * 상속:
 * - Ownable: 소유자 권한 관리
 * - IERC721Receiver: NFT를 안전하게 받을 수 있도록 구현
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract NftVault is Ownable, IERC721Receiver {
    // 보관된 NFT를 추적하기 위한 매핑
    // owner => nftContract => tokenIds[]
    mapping(address => mapping(address => uint256[])) private _vaultedTokens;
    
    // owner => nftContract => tokenId => isVaulted
    mapping(address => mapping(address => mapping(uint256 => bool))) private _isVaulted;

    /**
     * 컨트랙트 생성자
     * 
     * @param initialOwner - 초기 소유자 주소
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * NFT를 Vault에 락업하는 함수
     * 
     * 실행 흐름:
     * 1. NFT 컨트랙트 주소와 토큰 ID 유효성 검증
     * 2. 호출자가 NFT 소유자인지 확인
     * 3. 호출자가 이 컨트랙트에게 transfer 권한을 주었는지 확인
     * 4. NFT를 Vault로 전송 (transferFrom)
     * 5. 보관 정보 기록
     * 
     * @param nftContract - NFT 컨트랙트 주소
     * @param tokenId - 락업할 NFT의 토큰 ID
     */
    function lockNft(address nftContract, uint256 tokenId) external {
        require(nftContract != address(0), "NftVault: invalid NFT contract");
        require(!_isVaulted[msg.sender][nftContract][tokenId], "NftVault: token already vaulted");
        
        IERC721 nft = IERC721(nftContract);
        
        // 호출자가 NFT 소유자인지 확인
        require(nft.ownerOf(tokenId) == msg.sender, "NftVault: not token owner");
        
        // 이 컨트랙트가 NFT를 받을 권한이 있는지 확인
        require(nft.getApproved(tokenId) == address(this) || 
                nft.isApprovedForAll(msg.sender, address(this)), 
                "NftVault: not approved");
        
        // NFT를 Vault로 전송
        nft.safeTransferFrom(msg.sender, address(this), tokenId);
        
        // 보관 정보 기록
        _vaultedTokens[msg.sender][nftContract].push(tokenId);
        _isVaulted[msg.sender][nftContract][tokenId] = true;
        
        emit NftLocked(msg.sender, nftContract, tokenId);
    }

    /**
     * NFT를 Vault에서 꺼내는 함수 (락업 해제)
     * 
     * 실행 흐름:
     * 1. NFT 컨트랙트 주소와 토큰 ID 유효성 검증
     * 2. 호출자가 이 NFT를 Vault에 보관했는지 확인
     * 3. Vault가 NFT를 소유하고 있는지 확인
     * 4. NFT를 호출자에게 반환 (transferFrom)
     * 5. 보관 정보 제거
     * 
     * @param nftContract - NFT 컨트랙트 주소
     * @param tokenId - 락업 해제할 NFT의 토큰 ID
     */
    function unlockNft(address nftContract, uint256 tokenId) external {
        require(nftContract != address(0), "NftVault: invalid NFT contract");
        require(_isVaulted[msg.sender][nftContract][tokenId], "NftVault: token not vaulted");
        
        IERC721 nft = IERC721(nftContract);
        
        // Vault가 NFT를 소유하고 있는지 확인
        require(nft.ownerOf(tokenId) == address(this), "NftVault: token not in vault");
        
        // NFT를 소유자에게 반환
        nft.safeTransferFrom(address(this), msg.sender, tokenId);
        
        // 보관 정보 제거
        _isVaulted[msg.sender][nftContract][tokenId] = false;
        
        // 배열에서 제거
        uint256[] storage tokens = _vaultedTokens[msg.sender][nftContract];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
        
        emit NftUnlocked(msg.sender, nftContract, tokenId);
    }

    /**
     * 사용자가 Vault에 보관한 NFT 목록 조회
     * 
     * @param owner - NFT 소유자 주소
     * @param nftContract - NFT 컨트랙트 주소
     * @return tokenIds - 보관된 NFT 토큰 ID 배열
     */
    function getVaultedTokens(address owner, address nftContract) external view returns (uint256[] memory tokenIds) {
        return _vaultedTokens[owner][nftContract];
    }

    /**
     * 특정 NFT가 Vault에 보관되어 있는지 확인
     * 
     * @param owner - NFT 소유자 주소
     * @param nftContract - NFT 컨트랙트 주소
     * @param tokenId - 확인할 NFT 토큰 ID
     * @return isVaulted - 보관 여부
     */
    function isNftVaulted(address owner, address nftContract, uint256 tokenId) external view returns (bool isVaulted) {
        return _isVaulted[owner][nftContract][tokenId];
    }

    /**
     * ERC721 토큰을 안전하게 받기 위한 인터페이스 구현
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    /**
     * 이벤트: NFT가 락업되었을 때 발생
     */
    event NftLocked(address indexed owner, address indexed nftContract, uint256 indexed tokenId);

    /**
     * 이벤트: NFT가 락업 해제되었을 때 발생
     */
    event NftUnlocked(address indexed owner, address indexed nftContract, uint256 indexed tokenId);
}

