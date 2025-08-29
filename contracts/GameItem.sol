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

    /**
     * 컨트랙트 생성자
     * 
     * @param name_ - NFT 컬렉션 이름
     * @param symbol_ - NFT 컬렉션 심볼
     * @param initialOwner - 초기 소유자 주소
     */
    constructor(string memory name_, string memory symbol_, address initialOwner) ERC721(name_, symbol_) Ownable(initialOwner) {}

    /**
     * NFT 민팅 함수
     * 
     * 실행 흐름:
     * 1. 소유자 권한 확인 (onlyOwner)
     * 2. 다음 토큰 ID 할당 및 증가
     * 3. 토큰을 지정된 주소로 안전하게 민팅
     * 4. 토큰 URI 설정 (메타데이터 연결)
     * 
     * @param to - NFT를 받을 주소
     * @param tokenURI_ - 토큰의 메타데이터 URI
     * @return tokenId - 생성된 토큰의 ID
     */
    function mint(address to, string memory tokenURI_) external onlyOwner returns (uint256 tokenId) {
        // 다음 토큰 ID 할당 및 증가 (1부터 시작)
        tokenId = ++_nextTokenId;
        
        // 토큰을 지정된 주소로 안전하게 민팅
        _safeMint(to, tokenId);
        
        // 토큰의 메타데이터 URI 설정
        _setTokenURI(tokenId, tokenURI_);
    }

    /**
     * NFT 소각 함수
     * 
     * 실행 흐름:
     * 1. 소유자 권한 확인 (onlyOwner)
     * 2. 지정된 토큰 ID의 NFT 소각
     * 
     * @param tokenId - 소각할 토큰의 ID
     */
    function burn(uint256 tokenId) external onlyOwner {
        // 토큰 소각 (ERC721URIStorage의 _burn 함수 사용)
        _burn(tokenId);
    }

    /**
     * 다음 토큰 ID 조회 함수
     * 
     * @return 다음에 생성될 토큰의 ID
     */
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId + 1;
    }
}


