// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameItem is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor(string memory name_, string memory symbol_, address initialOwner) ERC721(name_, symbol_) Ownable(initialOwner) {}

    function mint(address to, string memory tokenURI_) external onlyOwner returns (uint256 tokenId) {
        tokenId = ++_nextTokenId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
    }

    function burn(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
    }

    function nextTokenId() external view returns (uint256) {
        return _nextTokenId + 1;
    }
}


