/**
 * JWT 인증 테스트 스크립트
 * 
 * 기능:
 * - JWT 인증 시스템 테스트
 * - 로그인, 토큰 갱신, 보호된 엔드포인트 테스트
 * - API 키 인증 테스트
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// 테스트용 사용자 정보
const testUser = {
  username: 'admin',
  password: 'password'
};

async function testJWT() {
  console.log('🚀 JWT 인증 시스템 테스트 시작\n');

  try {
    // 1. 사용자 등록 테스트
    console.log('1️⃣ 사용자 등록 테스트');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'testpassword',
        role: 'user'
      });
      console.log('✅ 사용자 등록 성공:', registerResponse.data);
    } catch (error) {
      console.log('ℹ️ 사용자 등록 실패 (이미 존재할 수 있음):', error.response?.data?.error || error.message);
    }

    // 2. 로그인 테스트
    console.log('\n2️⃣ 로그인 테스트');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, testUser);
    console.log('✅ 로그인 성공:', {
      success: loginResponse.data.success,
      user: loginResponse.data.user,
      hasAccessToken: !!loginResponse.data.accessToken,
      hasRefreshToken: !!loginResponse.data.refreshToken
    });

    const { accessToken, refreshToken } = loginResponse.data;

    // 3. 토큰 검증 테스트
    console.log('\n3️⃣ 토큰 검증 테스트');
    const verifyResponse = await axios.get(`${BASE_URL}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ 토큰 검증 성공:', verifyResponse.data);

    // 4. 프로필 조회 테스트
    console.log('\n4️⃣ 프로필 조회 테스트');
    const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ 프로필 조회 성공:', profileResponse.data);

    // 5. 보호된 엔드포인트 테스트 (JWT)
    console.log('\n5️⃣ 보호된 엔드포인트 테스트 (JWT)');
    try {
      const nftResponse = await axios.get(`${BASE_URL}/api/nft/address`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      console.log('✅ JWT로 보호된 엔드포인트 접근 성공:', nftResponse.data);
    } catch (error) {
      console.log('❌ JWT로 보호된 엔드포인트 접근 실패:', error.response?.data?.error || error.message);
    }

    // 6. API 키 인증 테스트
    console.log('\n6️⃣ API 키 인증 테스트');
    try {
      const apiKeyResponse = await axios.get(`${BASE_URL}/api/nft/address`, {
        headers: {
          'x-api-key': 'your-api-key'
        }
      });
      console.log('✅ API 키로 보호된 엔드포인트 접근 성공:', apiKeyResponse.data);
    } catch (error) {
      console.log('ℹ️ API 키 인증 실패 (API_KEY 환경변수 미설정):', error.response?.data?.error || error.message);
    }

    // 7. 토큰 갱신 테스트
    console.log('\n7️⃣ 토큰 갱신 테스트');
    try {
      const refreshResponse = await axios.post(`${BASE_URL}/api/auth/refresh`, {
        refreshToken: refreshToken
      });
      console.log('✅ 토큰 갱신 성공:', {
        success: refreshResponse.data.success,
        hasNewAccessToken: !!refreshResponse.data.accessToken,
        hasNewRefreshToken: !!refreshResponse.data.refreshToken
      });
    } catch (error) {
      console.log('❌ 토큰 갱신 실패:', error.response?.data?.error || error.message);
    }

    // 8. 로그아웃 테스트
    console.log('\n8️⃣ 로그아웃 테스트');
    try {
      const logoutResponse = await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      console.log('✅ 로그아웃 성공:', logoutResponse.data);
    } catch (error) {
      console.log('❌ 로그아웃 실패:', error.response?.data?.error || error.message);
    }

    // 9. 만료된 토큰 테스트
    console.log('\n9️⃣ 만료된 토큰 테스트');
    try {
      const expiredResponse = await axios.get(`${BASE_URL}/api/nft/address`, {
        headers: {
          'Authorization': 'Bearer expired.token.here'
        }
      });
      console.log('❌ 만료된 토큰으로 접근 성공 (예상치 못함):', expiredResponse.data);
    } catch (error) {
      console.log('✅ 만료된 토큰으로 접근 실패 (예상됨):', error.response?.data?.error || error.message);
    }

    console.log('\n🎉 JWT 인증 시스템 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
    if (error.response) {
      console.error('응답 데이터:', error.response.data);
      console.error('상태 코드:', error.response.status);
    }
  }
}

// 테스트 실행
testJWT();
