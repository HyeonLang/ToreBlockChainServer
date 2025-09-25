/**
 * 토큰 발행 및 전송 엔드포인트 테스트 스크립트
 * 
 * 기능:
 * - 새로운 토큰 API 엔드포인트 테스트
 * - 토큰 발행, 전송, 잔액 조회 테스트
 * - API 키 인증 테스트
 * - 에러 핸들링 테스트
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'your-api-key'; // 환경변수에서 설정된 API 키

// 테스트용 주소들 (새로운 통일 지갑 주소 사용)
const TEST_ADDRESSES = {
  recipient1: '0xFF5530beBE63f97f6cC80193416f890d76d65661',
  recipient2: '0x8ba1f109551bD432803012645Hac136c4c8C3C5',
  invalidAddress: '0xinvalid'
};

async function testTokenEndpoints() {
  console.log('🚀 토큰 발행 및 전송 엔드포인트 테스트 시작\n');

  try {
    // 1. 서버 상태 확인
    console.log('1️⃣ 서버 상태 확인');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ 서버 정상 작동:', healthResponse.data);
    } catch (error) {
      console.log('❌ 서버 연결 실패:', error.message);
      return;
    }

    // 2. 토큰 연결 상태 확인
    console.log('\n2️⃣ 토큰 연결 상태 확인');
    try {
      const connectionResponse = await axios.get(`${BASE_URL}/api/tokens/connection`, {
        headers: { 'x-api-key': API_KEY }
      });
      console.log('✅ 토큰 연결 상태:', connectionResponse.data);
    } catch (error) {
      console.log('❌ 토큰 연결 실패:', error.response?.data?.error || error.message);
    }

    // 3. 토큰 정보 조회
    console.log('\n3️⃣ 토큰 정보 조회');
    try {
      const infoResponse = await axios.get(`${BASE_URL}/api/tokens/info`, {
        headers: { 'x-api-key': API_KEY }
      });
      console.log('✅ 토큰 정보:', infoResponse.data);
    } catch (error) {
      console.log('❌ 토큰 정보 조회 실패:', error.response?.data?.error || error.message);
    }

    // 4. 토큰 발행 테스트
    console.log('\n4️⃣ 토큰 발행 테스트');
    try {
      const mintResponse = await axios.post(`${BASE_URL}/api/tokens/mint`, {
        to: TEST_ADDRESSES.recipient1,
        amount: '1000.0',
        reason: 'test_mint'
      }, {
        headers: { 'x-api-key': API_KEY }
      });
      console.log('✅ 토큰 발행 성공:', mintResponse.data);
    } catch (error) {
      console.log('❌ 토큰 발행 실패:', error.response?.data?.error || error.message);
    }

    // 5. 토큰 전송 테스트
    console.log('\n5️⃣ 토큰 전송 테스트');
    try {
      const transferResponse = await axios.post(`${BASE_URL}/api/tokens/transfer`, {
        to: TEST_ADDRESSES.recipient2,
        amount: '100.0',
        reason: 'test_transfer'
      }, {
        headers: { 'x-api-key': API_KEY }
      });
      console.log('✅ 토큰 전송 성공:', transferResponse.data);
    } catch (error) {
      console.log('❌ 토큰 전송 실패:', error.response?.data?.error || error.message);
    }

    // 6. 잔액 조회 테스트
    console.log('\n6️⃣ 잔액 조회 테스트');
    try {
      const balanceResponse = await axios.get(`${BASE_URL}/api/tokens/balance/${TEST_ADDRESSES.recipient1}`, {
        headers: { 'x-api-key': API_KEY }
      });
      console.log('✅ 잔액 조회 성공:', balanceResponse.data);
    } catch (error) {
      console.log('❌ 잔액 조회 실패:', error.response?.data?.error || error.message);
    }

    // 7. 배치 토큰 발행 테스트
    console.log('\n7️⃣ 배치 토큰 발행 테스트');
    try {
      const batchMintResponse = await axios.post(`${BASE_URL}/api/tokens/batch-mint`, {
        recipients: [TEST_ADDRESSES.recipient1, TEST_ADDRESSES.recipient2],
        amounts: ['500.0', '300.0'],
        reason: 'batch_test'
      }, {
        headers: { 'x-api-key': API_KEY }
      });
      console.log('✅ 배치 토큰 발행 성공:', batchMintResponse.data);
    } catch (error) {
      console.log('❌ 배치 토큰 발행 실패:', error.response?.data?.error || error.message);
    }

    // 8. 입력 검증 테스트 (잘못된 주소)
    console.log('\n8️⃣ 입력 검증 테스트 (잘못된 주소)');
    try {
      const invalidAddressResponse = await axios.post(`${BASE_URL}/api/tokens/mint`, {
        to: TEST_ADDRESSES.invalidAddress,
        amount: '100.0'
      }, {
        headers: { 'x-api-key': API_KEY }
      });
      console.log('❌ 잘못된 주소로 발행 성공 (예상치 못함):', invalidAddressResponse.data);
    } catch (error) {
      console.log('✅ 잘못된 주소로 발행 실패 (예상됨):', error.response?.data?.error || error.message);
    }

    // 9. 입력 검증 테스트 (잘못된 금액)
    console.log('\n9️⃣ 입력 검증 테스트 (잘못된 금액)');
    try {
      const invalidAmountResponse = await axios.post(`${BASE_URL}/api/tokens/mint`, {
        to: TEST_ADDRESSES.recipient1,
        amount: '-100.0'
      }, {
        headers: { 'x-api-key': API_KEY }
      });
      console.log('❌ 잘못된 금액으로 발행 성공 (예상치 못함):', invalidAmountResponse.data);
    } catch (error) {
      console.log('✅ 잘못된 금액으로 발행 실패 (예상됨):', error.response?.data?.error || error.message);
    }

    // 10. API 키 인증 테스트 (API 키 없이)
    console.log('\n🔟 API 키 인증 테스트 (API 키 없이)');
    try {
      const noApiKeyResponse = await axios.get(`${BASE_URL}/api/tokens/info`);
      console.log('❌ API 키 없이 접근 성공 (예상치 못함):', noApiKeyResponse.data);
    } catch (error) {
      console.log('✅ API 키 없이 접근 실패 (예상됨):', error.response?.data?.error || error.message);
    }

    console.log('\n🎉 토큰 발행 및 전송 엔드포인트 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
    if (error.response) {
      console.error('응답 데이터:', error.response.data);
      console.error('상태 코드:', error.response.status);
    }
  }
}

// 테스트 실행
testTokenEndpoints();
