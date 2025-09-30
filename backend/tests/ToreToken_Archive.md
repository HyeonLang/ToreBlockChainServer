# ToreToken 컨트랙트 아카이브

## 개요
ToreToken 컨트랙트는 MultiTokenFactory로 대체되어 더 이상 사용되지 않습니다.
이 문서는 참고용으로 보관합니다.

## 컨트랙트 정보
- **이름**: ToreToken
- **심볼**: TORE
- **타입**: ERC-20
- **총 공급량**: 1,000,000,000 TORE
- **소수점**: 18자리

## 주요 기능
- 게임 내 화폐 토큰
- 게임 관리자만 민팅/소각 가능
- 게임 보상 지급 기능
- 배치 전송 기능
- NFT와의 거래 지원

## 배포된 컨트랙트 주소
- **Fuji 테스트넷**: 0xa33D0f029Db6bE758df1A429C70C4B4e9873756b

## 관련 스크립트 (삭제됨)
- `deployToreToken.ts`: ToreToken 배포 스크립트
- `checkBalance.ts`: 토큰 잔액 확인 스크립트
- `transferToreTest.ts`: 토큰 전송 테스트 스크립트

## 대체 시스템
MultiTokenFactory를 통해 동적으로 토큰을 생성할 수 있습니다.
각 토큰은 독립적으로 관리되며 더 유연한 구조를 제공합니다.

## 마이그레이션
기존 ToreToken 사용자는 MultiTokenFactory를 통해 새로운 토큰을 생성하여 사용할 수 있습니다.

## 컨트랙트 코드 (참고용)
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ToreToken is ERC20, Ownable {
    uint8 private constant DECIMALS = 18;
    uint256 private constant INITIAL_SUPPLY = 1000000000 * 10**DECIMALS;
    
    mapping(address => bool) public gameContracts;
    mapping(address => bool) public gameManagers;
    
    constructor(address initialOwner) ERC20("ToreTest", "TORE") Ownable(initialOwner) {
        _mint(initialOwner, INITIAL_SUPPLY);
    }
    
    // ... 기타 함수들
}
```
