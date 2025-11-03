/**
 * NFT 민팅 테스트 스크립트
 * test-data/mint-nft-requests.json의 모든 테스트 케이스를 실행합니다.
 */

const fs = require('fs');
const path = require('path');

// 테스트 데이터 로드
const testDataPath = path.join(__dirname, 'test-data', 'mint-nft-requests.json');
const testCases = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));

const API_BASE_URL = 'http://localhost:3000/api/blockchain/nft';
const MINT_ENDPOINT = `${API_BASE_URL}/mint`;

// 서버가 준비될 때까지 대기하는 함수
async function waitForServer(maxRetries = 30, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('http://localhost:3000/health');
      if (response.ok) {
        console.log('✅ 서버가 준비되었습니다.\n');
        return true;
      }
    } catch (error) {
      // 서버가 아직 시작되지 않음
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return false;
}

// 민팅 테스트 실행
async function testMint(testCase, index) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`테스트 케이스 ${index + 1}: ${testCase.description}`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    const response = await fetch(MINT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCase.request),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ 민팅 성공!');
      console.log('📋 응답 데이터:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('❌ 민팅 실패');
      console.log('📋 에러 정보:');
      console.log(JSON.stringify(result, null, 2));
    }

    return { success: response.ok, data: result };
  } catch (error) {
    console.error('❌ 요청 중 오류 발생:', error.message);
    return { success: false, error: error.message };
  }
}

// 메인 실행 함수
async function main() {
  console.log('🚀 NFT 민팅 테스트 시작\n');
  console.log(`서버 URL: ${API_BASE_URL}`);
  console.log(`테스트 케이스 수: ${testCases.length}\n`);

  // 서버 대기
  console.log('⏳ 서버 시작 대기 중...');
  const serverReady = await waitForServer();
  
  if (!serverReady) {
    console.error('❌ 서버가 시작되지 않았습니다. 서버를 먼저 실행해주세요.');
    console.error('   명령어: npm run dev');
    process.exit(1);
  }

  // 각 테스트 케이스 실행
  const results = [];
  for (let i = 0; i < testCases.length; i++) {
    const result = await testMint(testCases[i], i);
    results.push(result);
    
    // 테스트 케이스 간 잠시 대기 (블록체인 트랜잭션 처리 시간)
    if (i < testCases.length - 1) {
      console.log('\n⏳ 다음 테스트 전 대기 중... (5초)');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // 전체 결과 요약
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 테스트 결과 요약');
  console.log(`${'='.repeat(60)}`);
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;
  
  console.log(`✅ 성공: ${successCount}/${results.length}`);
  console.log(`❌ 실패: ${failCount}/${results.length}`);
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} 테스트 ${index + 1}: ${testCases[index].description}`);
  });
  
  console.log('\n' + '='.repeat(60));
}

// 스크립트 실행
main().catch(error => {
  console.error('❌ 스크립트 실행 중 오류:', error);
  process.exit(1);
});

