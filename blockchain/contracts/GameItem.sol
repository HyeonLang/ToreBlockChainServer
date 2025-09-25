// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * GameItem NFT 컨트랙트
 * 
 * 기능:
 * - ERC721 표준을 따르는 NFT 토큰
 * - URI 저장 기능 (메타데이터 연결)
 * - 소유자만 민팅/소각 가능
 * 
 * 상속:
 * - ERC721URIStorage: URI 저장 기능이 있는 ERC721
 * - Ownable: 소유자 권한 관리
 */

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameItem is ERC721URIStorage, Ownable {
    // 다음에 생성될 토큰의 ID (1부터 시작)
    uint256 private _nextTokenId;
    
    // itemId별 인스턴스 카운터 (같은 아이템의 여러 NFT 구분용)
    mapping(uint256 => uint256) private _itemInstanceCounters;
    
    // 총 NFT 발행량 추적 (소각 시 감소)
    uint256 private _totalSupply;

    /**
     * 컨트랙트 생성자
     * 
     * @param name_ - NFT 컬렉션 이름
     * @param symbol_ - NFT 컬렉션 심볼
     * @param initialOwner - 초기 소유자 주소
     */
    constructor(string memory name_, string memory symbol_, address initialOwner) ERC721(name_, symbol_) Ownable(initialOwner) {}

    /**
     * NFT 민팅 함수 (기존 방식 - 하위 호환성)
     * 
     * @param to - NFT를 받을 주소
     * @param tokenURI_ - 토큰의 메타데이터 URI
     * @return tokenId - 생성된 토큰의 ID
     */
    function mint(address to, string memory tokenURI_) external onlyOwner returns (uint256 tokenId) {
        // 기존 방식: 단순 증가
        tokenId = ++_nextTokenId;
        _totalSupply++;  // 총 발행량 증가
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
    }
    
    /**
     * NFT 민팅 함수 (itemId 포함)
     * 
     * 실행 흐름:
     * 1. 소유자 권한 확인 (onlyOwner)
     * 2. itemId와 인스턴스 번호로 고정 자릿수 토큰 ID 생성
     * 3. 토큰을 지정된 주소로 안전하게 민팅
     * 4. 토큰 URI 설정 (메타데이터 연결)
     * 
     * 토큰 ID 구조: [itemId(8자리)] + [instance(8자리)] = 최대 16자리
     * 예시: itemId=2004, instance=1 → tokenId=200400000001
     * 
     * @param to - NFT를 받을 주소
     * @param tokenURI_ - 토큰의 메타데이터 URI
     * @param itemId - 게임 아이템 ID (1 ~ 99,999,999)
     * @return tokenId - 생성된 토큰의 ID (고정 자릿수)
     */
    function mintWithItemId(address to, string memory tokenURI_, uint256 itemId) external onlyOwner returns (uint256 tokenId) {
        require(itemId > 0 && itemId <= 99999999, "GameItem: itemId out of range (1-99999999)");
        
        // itemId별 인스턴스 번호 증가
        uint256 instanceNumber = ++_itemInstanceCounters[itemId];
        require(instanceNumber <= 99999999, "GameItem: Too many instances for this item");
        
        // 토큰 ID 생성: itemId(8자리) + instance(8자리)
        tokenId = itemId * 100000000 + instanceNumber;
        _totalSupply++;  // 총 발행량 증가
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
    }

    /**
     * NFT 소각 함수
     * 
     * 실행 흐름:
     * 1. 소유자 권한 확인 (onlyOwner)
     * 2. 토큰이 존재하는지 확인
     * 3. itemId별 인스턴스 카운터 감소
     * 4. 총 발행량 감소
     * 5. 지정된 토큰 ID의 NFT 소각
     * 
     * @param tokenId - 소각할 토큰의 ID
     */
    function burn(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "GameItem: token does not exist");
        
        // itemId 추출 및 인스턴스 카운터 감소
        uint256 itemId = tokenId / 100000000;  // 상위 8자리가 itemId
        if (itemId > 0) {  // mintWithItemId로 생성된 토큰인 경우만
            require(_itemInstanceCounters[itemId] > 0, "GameItem: invalid item counter state");
            _itemInstanceCounters[itemId]--;
        }
        
        _totalSupply--;  // 총 발행량 감소
        // 토큰 소각 (ERC721URIStorage의 _burn 함수 사용)
        _burn(tokenId);
    }

    /**
     * 다음 토큰 ID 조회 함수 (기존 방식)
     * 
     * @return 다음에 생성될 토큰의 ID
     */
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId + 1;
    }
    
    /**
     * 토큰 ID에서 itemId 추출
     * 
     * @param tokenId - 토큰 ID
     * @return itemId - 게임 아이템 ID (상위 8자리)
     */
    function getItemId(uint256 tokenId) external pure returns (uint256) {
        return tokenId / 100000000;  // 상위 8자리 추출
    }
    
    /**
     * 토큰 ID에서 인스턴스 번호 추출
     * 
     * @param tokenId - 토큰 ID
     * @return instanceNumber - 인스턴스 번호 (하위 8자리)
     */
    function getInstanceNumber(uint256 tokenId) external pure returns (uint256) {
        return tokenId % 100000000;  // 하위 8자리 추출
    }
    
    /**
     * 특정 itemId의 다음 인스턴스 번호 조회
     * 
     * @param itemId - 게임 아이템 ID
     * @return 다음에 생성될 인스턴스 번호
     */
    function getNextInstanceNumber(uint256 itemId) external view returns (uint256) {
        return _itemInstanceCounters[itemId] + 1;
    }
    
    /**
     * 특정 itemId의 현재 존재하는 NFT 개수 조회 (소각된 것 제외)
     * 
     * @param itemId - 게임 아이템 ID
     * @return 해당 아이템의 현재 존재하는 NFT 개수
     */
    function getItemSupply(uint256 itemId) external view returns (uint256) {
        return _itemInstanceCounters[itemId];
    }
    
    /**
     * 전체 NFT 총 발행량 조회 (소각된 것 제외)
     * 
     * @return 현재 존재하는 총 NFT 개수
     */
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }
    
    /**
     * 총 민팅된 NFT 개수 조회 (소각된 것 포함)
     * 
     * @return 지금까지 민팅된 총 NFT 개수
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }
    
    /**
     * 소각된 NFT 개수 조회
     * 
     * @return 소각된 NFT 개수
     */
    function totalBurned() external view returns (uint256) {
        return _nextTokenId - _totalSupply;
    }
    
    /**
     * 모든 itemId별 현재 존재하는 NFT 개수 조회 (배치 조회, 소각된 것 제외)
     * 
     * @param itemIds - 조회할 아이템 ID 배열
     * @return supplies - 각 아이템의 현재 존재하는 NFT 개수 배열
     */
    function getItemSupplies(uint256[] calldata itemIds) external view returns (uint256[] memory supplies) {
        supplies = new uint256[](itemIds.length);
        for (uint256 i = 0; i < itemIds.length; i++) {
            supplies[i] = _itemInstanceCounters[itemIds[i]];
        }
    }
    
    /**
     * NFT가 존재하는지 확인
     * 
     * @param tokenId - 확인할 토큰 ID
     * @return 토큰 존재 여부
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}


