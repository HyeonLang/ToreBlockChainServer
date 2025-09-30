/**
 * NFT·토큰 발행량 실시간 모니터링 및 동적 제어 시스템 설계서
 * 
 * 기능:
 * - Avalanche C-Chain(EVM) 기반 게임 경제 시스템
 * - NFT·토큰 발행량 실시간 모니터링
 * - DB와 온체인 데이터 교차검증
 * - 지갑별 보유현황 정확한 산출
 * - 주기적/실시간 발행량(Emission Cap) 동적 조절
 * - 특정 컨트랙트와 NFT tokenId 부분 숫자 패턴 필터링
 * 
 * 기술 스택:
 * - 블록체인: Avalanche C-Chain (EVM 호환)
 * - 백엔드: Node.js, Express.js, TypeScript
 * - 데이터베이스: PostgreSQL, TimescaleDB
 * - 실시간 처리: WebSocket, 이벤트 스트리밍
 * - 모니터링: Prometheus, Grafana
 * 
 * 주요 구성요소:
 * - 실시간 이벤트 수집기
 * - 데이터 정합성 검증 시스템
 * - 동적 발행량 제어 엔진
 * - 관리자 대시보드
 * - API 엔드포인트
 */

# NFT·토큰 발행량 실시간 모니터링 및 동적 제어 시스템 설계서

# 0. 목적 및 범위

본 문서는 Avalanche C-Chain(EVM) 기반 게임 경제에서 **NFT·토큰 발행량을 실시간으로 체크**하고, **DB와 온체인을 교차검증**하여 **지갑별 보유현황을 정확히 산출**하며, 이를 기반으로 **주기적/실시간 발행량(Emission Cap)을 동적으로 조절**하는 전체 기술 설계서입니다. 또한 **특정 컨트랙트(주소)와 NFT `tokenId`의 부분 숫자 패턴(프리픽스/비트필드 등)**으로 필터링하여 집계하는 요구사항을 포함합니다.

---

# 1. 요구사항 요약

* **실시간 발행량 모니터링**: ERC-20 총발행량/민팅속도, ERC-721/1155 민팅 이벤트 수집.
* **필터링**: (A) 컨트랙트 주소로 필터 (B) `tokenId` 부분숫자(접두/범위/비트마스크) 조건으로 필터.
* **교차검증**: DB의 집계결과와 온체인 스냅샷(`balanceOf/ownerOf/totalSupply`) 비교.
* **보유현황**: 지갑별 토큰/NFT 잔고 및 보유목록, 시점 스냅샷 제공.
* **동적 발행 제어**: 최근 발행량·게임 드랍 지표 기반으로 **에폭/시간대별 Cap** 자동 업데이트.
* **공개성 선택**: 내부 전용(웹훅/WS+DB) 또는 공개 API(Subgraph) 병행 선택.

---

# 2. 전체 아키텍처

```
[On-chain]
┌────────────────────┐       민트/번/전송 이벤트       ┌──────────────────────┐
│ GameToken(ERC20)   │ ─────────────────────────────→ │ 실시간 수집기(Webhooks)│
│ GameNFT(ERC721/1155)│                             │(Glacier/Streams/WS)  │
└────────────────────┘                              └──────────┬───────────┘
                                                             파싱/정규화
                                                     ┌──────────▼───────────┐
                                                     │ ETL·정합성 체크 서비스 │
                                                     └──────────┬───────────┘
                                                          원장/파생 적재
                      주기 스냅샷 검증(RPC/API)        ┌─────────▼───────────┐
[RPC/Provider]  ───────────────────────────────────→   │  OLTP(DB) + OLAP    │
                                                       │ (Postgres + Timescale│
                                                       │  /ClickHouse 선택)   │
                                                       └───────┬─────┬───────┘
                                                               │     │
                                             내부 API/대시보드 │     │ 공개 GraphQL(선택)
                                                        ┌──────▼───┐  ┌───────────┐
                                                        │ Admin UI │  │ Subgraph  │
                                                        └──────┬───┘  └─────┬─────┘
                                                               │           │
                                  자동화(스케줄/조건)          │           │
                                ┌───────────────────────────────▼───────────▼─────┐
                                │ SupplyController(온체인 Cap 업데이트 엔드포인트) │
                                └──────────────────────────────────────────────────┘
```

---

# 3. 데이터 수집 계층

## 3.1 실시간(스트리밍)

* **소스**: Avalanche C-Chain 노드(WebSocket) 또는 관리형 스트림/웹훅(예: Glacier Webhooks, Moralis Streams 등).
* **대상 이벤트**

  * ERC-20: `Transfer(address from, address to, uint256 value)`
  * ERC-721: `Transfer(address from, address to, uint256 tokenId)`
  * ERC-1155: `TransferSingle`, `TransferBatch`
* **필터**: 컨트랙트 주소 화이트리스트, 토픽 필터(Transfer 시그니처), 블록 범위.
* **멱등성 키**: `(block_number, tx_hash, log_index)`

## 3.2 백필·스냅샷(정합성 보완)

* 최신 블록 헤드와 별개로 **안전 헤드(safe\_head, N컨펌)** 기준 배치 스냅샷 수행.
* 스냅샷 시 **온체인 콜**

  * ERC-20: `totalSupply()`, `balanceOf(address)`
  * ERC-721: `ownerOf(tokenId)`
  * ERC-1155: `balanceOf(address, id)` / `balanceOfBatch`
* 관리형 데이터 API(옵션)를 보조 소스로 사용하여 히스토리 결손/리오그 복구.

---

# 4. DB 스키마(요약)

> 실제 구현은 Postgres(OLTP) + Timescale/ClickHouse(시계열/OLAP) 혼합 권장

## 4.1 원장 테이블 (append-only)

* `blocks(block_number, block_hash, parent_hash, ts)`
* `txs(tx_hash, block_number, from, to, status, gas_used, ts, ...)`
* `logs(block_number, tx_hash, log_index, address, topic0..3, data)`
* `erc20_transfers(block_number, tx_hash, log_index, token, from, to, amount)`
* `erc721_transfers(block_number, tx_hash, log_index, token, from, to, token_id)`
* `erc1155_transfers(block_number, tx_hash, log_index, token, from, to, token_id, amount, batch_idx)`

## 4.2 파생 테이블 (증분 유지 + 주기 스냅샷 교정)

* `erc20_balances(block_snap, token, address, balance)`
* `erc721_owners(block_snap, token, token_id, owner)`
* `erc1155_balances(block_snap, token, address, token_id, balance)`
* `supply_timeseries(window_ts, token, minted, burned, total_supply)`

## 4.3 인덱스/키

* 유니크: `(block_number, tx_hash, log_index)`
* 조회 인덱스: `(token, ts)`, `(address, token)`, `(token, token_id)`

---

# 5. 필터링 설계: 컨트랙트·부분 `tokenId`

`tokenId`는 256-bit 정수이므로 **부분 숫자 필터**는 다음 3가지 방법 중 택일/병용:

### 5.1 범위 기반(추천)

* 전제: `tokenId`에 카테고리/시즌/드랍타입 등을 **십진수/십육진수 프리픽스**로 인코딩
* 예: `tokenId = PREFIX * 10^K + localIndex` (십진수)

  * 프리픽스가 42, K=10이면 범위: `[42*10^10, (42+1)*10^10 - 1]`
* SQL 예시(Postgres, numeric/bigint 보관):

```sql
SELECT *
FROM erc721_transfers
WHERE token = :contract
  AND token_id BETWEEN :lower_bound AND :upper_bound;
```

### 5.2 비트필드 기반(고정 스키마)

* 전제: `tokenId = (group << 192) | (kind << 160) | serial` 등 비트단위 인코딩
* 마스크/シ프트로 빠른 필터:

```sql
-- token_id를 numeric으로 저장했다면 사용자 함수로 256-bit 비트연산 구현 또는
-- Hex 문자열로 저장 후 범위 매핑. ClickHouse는 UInt256 지원.
```

### 5.3 파생 컬럼/머티리얼라이즈드 뷰

* `token_id_prefix_dec`, `token_id_prefix_hex`, `kind`, `season` 등 파생 필드를 ETL 시 계산하여 색인.
* 장점: 쿼리 단순화, 속도 향상.

> 권장: 신규 발행 설계 시 **tokenId 스키마 명시**(프리픽스 자리수/비트폭 고정) → 필터링/인덱싱 단순화.

---

# 6. 집계·질의 예시

## 6.1 "특정 컨트랙트 + tokenId 프리픽스" NFT 민팅 수

```sql
-- 프리픽스 42(십진), K=10 자리 사용
WITH bounds AS (
  SELECT (42 * 1e10)::numeric AS lo,
         ((42 + 1) * 1e10 - 1)::numeric AS hi
)
SELECT COUNT(*) AS minted
FROM erc721_transfers t, bounds b
WHERE t.token = :contract
  AND t.from = '\x0000000000000000000000000000000000000000' -- 민팅
  AND t.token_id BETWEEN b.lo AND b.hi
  AND t.block_number BETWEEN :bn_start AND :bn_end;
```

## 6.2 지갑별 보유현황 교차검증(샘플)

```sql
-- DB 측 잔고
SELECT address, balance
FROM erc20_balances
WHERE token = :token AND block_snap = :snap_bn
ORDER BY balance DESC
LIMIT 100;
```

온체인 비교(서버 코드 예시):

```ts
const onchain = await erc20.balanceOf(address, { blockTag: snapBn });
assert(onchain.toString() === dbBalance.toString());
```

## 6.3 총발행량 보존식 체크(ERC-20)

```sql
-- 블록 스냅샷에서의 전역 합 == totalSupply()
SELECT SUM(balance) = :total_supply_at_snap AS ok
FROM erc20_balances
WHERE token = :token AND block_snap = :snap_bn;
```

---

# 7. 동적 발행 제어(Emission Control)

## 7.1 온체인 게이트

* `SupplyController`(또는 토큰 내 관리 로직)에서 **윈도우/에폭별 cap** 강제.
* cap 변경은 Timelock+AccessControl(멀티시그)로 **지연 적용**.

### Controller 인터페이스 예시

```solidity
interface ISupplyController {
    function currentWindow() external view returns (uint256);
    function setNextWindowCap(uint256 windowId, uint256 cap) external; // ROLE 제한
}
```

## 7.2 오프체인 제어 루프(실무 기본)

* 입력: `mintRate_t`(온체인 민팅속도), `dropRate_t`(게임 드랍 지표)
* 제어식(예): `cap_{t+1} = clamp(cap_t + Kp*e_t + Ki*Σe, 0, maxCap)` where `e_t = k*dropRate_t - mintRate_t`
* 스케줄: 매시/매일 CRON or Chainlink Automation
* 적용: `setNextWindowCap(nowWindow+1, nextCap)` 호출

---

# 8. The Graph(서브그래프) 사용 여부

* **필수 아님**: 내부 검증·집계·제어엔 스트림+DB로 충분.
* **권장 시나리오**: 외부 파트너/커뮤니티에 GraphQL 질의를 공개하고 싶을 때.

## 8.1 서브그래프 개념

* 매니페스트(subgraph.yaml)로 추출할 컨트랙트/이벤트 정의
* 스키마(schema.graphql)로 공개 데이터 모델 정의
* 매핑(AssemblyScript/Rust)으로 이벤트→엔티티 변환 로직 구현

## 8.2 예시 스키마(요지)

```graphql
type NftMint @entity {
  id: ID!            # txHash-logIndex
  token: Bytes!
  tokenId: BigInt!
  to: Bytes!
  blockNumber: BigInt!
  timestamp: BigInt!
  prefixDec: BigInt   # 파생 필드(옵션)
}
```

## 8.3 GraphQL 쿼리 예시

```graphql
query($token: Bytes!, $lo: BigInt!, $hi: BigInt!) {
  nftMints(where:{token:$token, tokenId_gte:$lo, tokenId_lte:$hi}) {
    id token tokenId to blockNumber timestamp
  }
}
```

---

# 9. API 설계(내부용)

* `GET /metrics/supply?token=0x..&window=1h|1d` : 민팅/소각/총발행량 시계열
* `GET /nft/mints?contract=0x..&prefix=42&k=10&fromBn=&toBn=`
* `GET /nft/owners?contract=0x..&tokenId=`
* `GET /balances/erc20?token=0x..&address=&block=`
* `POST /control/cap` : 다음 윈도 cap 제출(권한 필요)

---

# 10. 운영·정합성 전략

* **Safe Head**: N 컨펌 이전은 잠정 상태로 표시.
* **정합성 테스트**: 무작위 샘플 지갑/토큰 `balanceOf/ownerOf` 대조(주기).
* **리오그 복구**: 포크 지점 롤백→재적재 파이프라인 준비.
* **알림**: 전역 보존식 위배, 윈도 cap 초과 시도, 급격한 민팅속도 변화 알림.

---

# 11. 보안·권한

* 컨트롤러/토큰의 민감 함수는 **멀티시그 + 타임락**.
* 웹훅 서명 검증, 내부 API는 VPC/사설망, 역할 분리(RBAC).
* 키 보관: 서명용 키는 KMS/HSM, 정기 롤오버.

---

# 12. 성능·비용 최적화

* 원장 테이블은 append-only + 파티셔닝(ts 또는 block\_number)
* 파생 테이블은 머티리얼라이즈드 뷰/증분 업데이트
* 핫패스 쿼리(프리픽스 필터)에 맞춘 인덱스/파생 컬럼
* 장기 보관: OLAP로 이관, OLTP는 최근 구간만 유지

---

# 13. 테스트 계획

* 단위: 이벤트 파싱/멱등성/비트마스크 필터 UT
* 통합: 테스트넷(Fuji) 재생산 시나리오(대량 민팅/번)
* 정합성: 스냅샷 블록에서 DB 합계 vs 온체인 콜 동치성
* 로드: 스트림 폭주(재시도/중복)·리오그·네트워크 지연

---

# 14. 단계별 추진 일정(예시 4주)

* **W1**: 스키마/수집기/파서 골격, 컨트랙트 주소 화이트리스트
* **W2**: 파생테이블·스냅샷 검증 루틴, API v1(내부)
* **W3**: Admin UI·알림, 동적 발행 제어 루프(오프체인→온체인)
* **W4**: 최적화/보안(멀티시그·타임락), (선택) 서브그래프 공개

---

# 15. 구현 스니펫(의사코드)

## 15.1 수집기

```ts
app.post('/webhook', async (req, res) => {
  const evts = normalize(req.body); // 공급자 포맷→표준화
  for (const e of evts) {
    if (exists(e.block, e.tx, e.idx)) continue; // 멱등성
    const decoded = decodeByABI(e);
    await insertLedger(decoded);
    await applyDerived(decoded); // balances/owners 증분
  }
  res.sendStatus(200);
});
```

## 15.2 스냅샷 비교

```ts
const balDb = await getBalanceAt(addr, token, snapBn);
const balOn = await erc20.balanceOf(addr, { blockTag: snapBn });
if (!eq(balDb, balOn)) enqueueBackfill(addr, token, snapBn);
```

## 15.3 Cap 제어 루틴

```ts
cron.schedule('0 * * * *', async () => { // 매시
  const w = await controller.currentWindow();
  const mintRate = await calcMintRate(w-1);
  const dropRate = await calcDropRate(w-1);
  const nextCap  = pid(mintRate, dropRate);
  await controller.setNextWindowCap(w+1, nextCap);
});
```

---

# 16. 리스크 & 대응

* **이벤트 누락/중복**: 재시도 대비 멱등키, dead-letter 큐
* **리오그**: safe\_head 운용, 롤백 파이프라인
* **스키마 변경**: 파생 컬럼 추가/마이그레이션 전략 사전 수립
* **성능 병목**: 배치 업서트, 파티셔닝, 핫컬럼 인덱스

---

# 17. 결론

* 실시간 발행량 체크·교차검증·동적 발행 제어는 **스트림+DB+스냅샷 검증**으로 내재화하고,
* 공개 재사용/파트너 연동이 필요할 때만 **서브그래프**를 병행합니다.
* `tokenId` 부분숫자 필터는 **범위·비트필드·파생 컬럼** 3축으로 설계하여 정확성과 속도를 확보합니다.

---

# 18. ToreBlockChainServer 프로젝트 적용 워크플로우

## 18.1 현재 프로젝트 구조 분석

현재 프로젝트는 다음과 같은 구조를 가지고 있습니다:
- **Backend**: Express.js 기반 API 서버 (`backend/src/`)
- **Blockchain**: Hardhat 기반 스마트 컨트랙트 (`blockchain/contracts/`)
- **기존 컨트랙트**: ToreToken(ERC20), GameItem(ERC721), ToreExchange

## 18.2 단계별 구현 워크플로우

### Phase 1: 데이터베이스 스키마 설계 및 구축 (1주차)

1. **PostgreSQL 데이터베이스 설정**
   ```bash
   # 프로젝트 루트에 database 폴더 생성
   mkdir database
   cd database
   ```

2. **스키마 파일 생성**
   - `database/schema.sql`: 원장 테이블 및 파생 테이블 정의
   - `database/migrations/`: 버전별 마이그레이션 스크립트
   - `database/indexes.sql`: 성능 최적화 인덱스

3. **기존 백엔드에 DB 연결 설정**
   - `backend/src/config/database.ts`: DB 연결 설정
   - `backend/src/models/`: Sequelize/TypeORM 모델 정의
   - `backend/src/migrations/`: DB 마이그레이션 관리

### Phase 2: 실시간 이벤트 수집기 구현 (1-2주차)

1. **WebSocket 연결 설정**
   ```typescript
   // backend/src/services/blockchainListener.ts
   - Avalanche C-Chain WebSocket 연결
   - 이벤트 필터링 (Transfer 이벤트만)
   - 멱등성 키 관리
   ```

2. **이벤트 파싱 및 정규화**
   ```typescript
   // backend/src/services/eventParser.ts
   - ERC-20/721/1155 이벤트 디코딩
   - 표준화된 데이터 구조로 변환
   - 컨트랙트 주소 화이트리스트 필터링
   ```

3. **데이터 저장 로직**
   ```typescript
   // backend/src/services/dataIngestion.ts
   - 원장 테이블에 이벤트 저장
   - 파생 테이블 증분 업데이트
   - 배치 처리 및 트랜잭션 관리
   ```

### Phase 3: 교차검증 시스템 구현 (2주차)

1. **스냅샷 서비스**
   ```typescript
   // backend/src/services/snapshotService.ts
   - 주기적 블록 스냅샷 생성
   - 온체인 balanceOf/ownerOf 호출
   - DB 데이터와 비교 검증
   ```

2. **정합성 체크 API**
   ```typescript
   // backend/src/controllers/validationController.ts
   - 실시간 정합성 검증 엔드포인트
   - 불일치 발견 시 알림 시스템
   - 백필 작업 큐 관리
   ```

### Phase 4: 필터링 및 집계 API 구현 (2-3주차)

1. **TokenId 필터링 로직**
   ```typescript
   // backend/src/services/tokenIdFilter.ts
   - 프리픽스 기반 범위 필터
   - 비트필드 기반 필터 (선택사항)
   - 파생 컬럼 기반 필터
   ```

2. **집계 API 엔드포인트**
   ```typescript
   // backend/src/controllers/metricsController.ts
   - GET /api/v1/metrics/supply
   - GET /api/v1/nft/mints
   - GET /api/v1/balances/erc20
   - GET /api/v1/nft/owners
   ```

### Phase 5: 동적 발행 제어 시스템 (3주차)

1. **SupplyController 스마트 컨트랙트**
   ```solidity
   // blockchain/contracts/SupplyController.sol
   - 윈도우별 발행량 제한 로직
   - 관리자 권한 및 타임락
   - 기존 ToreToken과 연동
   ```

2. **제어 루프 서비스**
   ```typescript
   // backend/src/services/emissionController.ts
   - 민팅 속도 모니터링
   - PID 제어 알고리즘 구현
   - 자동 Cap 업데이트 스케줄러
   ```

### Phase 6: 관리자 UI 및 모니터링 (3-4주차)

1. **Admin Dashboard**
   ```typescript
   // backend/src/routes/admin.ts
   - 실시간 발행량 모니터링
   - 지갑별 보유현황 조회
   - 수동 Cap 조정 인터페이스
   ```

2. **알림 시스템**
   ```typescript
   // backend/src/services/notificationService.ts
   - Discord/Slack 웹훅 연동
   - 이상 상황 알림
   - 정합성 오류 알림
   ```

### Phase 7: 최적화 및 보안 강화 (4주차)

1. **성능 최적화**
   - 데이터베이스 인덱스 튜닝
   - 배치 처리 최적화
   - 캐싱 레이어 추가 (Redis)

2. **보안 강화**
   - API 인증 및 권한 관리
   - 멀티시그 지갑 연동
   - 감사 로그 시스템

## 18.3 기존 코드와의 통합 포인트

### 기존 컨트랙트 연동
- **ToreToken**: `totalSupply()`, `balanceOf()` 메서드 활용
- **GameItem**: `ownerOf()`, `totalSupply()` 메서드 활용
- **ToreExchange**: 거래 이벤트 모니터링 추가

### 기존 API 확장
- **v1Controllers.ts**: 새로운 메트릭스 엔드포인트 추가
- **auth.ts**: 관리자 권한 레벨 추가
- **rateLimit.ts**: 모니터링 API용 별도 제한 설정

## 18.4 배포 및 운영 전략

### 개발 환경
1. **로컬 개발**: Ganache/Hardhat 네트워크 사용
2. **테스트넷**: Avalanche Fuji 테스트넷 배포
3. **스테이징**: 메인넷과 동일한 환경 구성

### 프로덕션 배포
1. **인프라**: AWS/GCP 클라우드 환경
2. **모니터링**: Prometheus + Grafana 대시보드
3. **백업**: 데이터베이스 정기 백업 및 복구 테스트

### 운영 체크리스트
- [ ] 실시간 이벤트 수집 상태 모니터링
- [ ] 데이터베이스 정합성 정기 검증
- [ ] 발행량 제한 정책 준수 확인
- [ ] 보안 취약점 정기 점검
- [ ] 성능 지표 추적 및 최적화

이 워크플로우를 통해 기존 ToreBlockChainServer 프로젝트에 실시간 발행량 모니터링 및 동적 제어 시스템을 단계적으로 통합할 수 있습니다.
