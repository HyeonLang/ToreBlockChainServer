const http = require('http');

// 서버 테스트 함수
async function testServer() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Tore Blockchain Server...\n');
  
  const endpoints = [
    { path: '/', name: 'Server Status' },
    { path: '/health', name: 'Health Check' },
    { path: '/info', name: 'Server Info' },
    { path: '/test', name: 'Test Endpoint' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${baseUrl}${endpoint.path}`);
      console.log(`✅ ${endpoint.name} (${endpoint.path}): ${response.statusCode}`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      console.log(`❌ ${endpoint.name} (${endpoint.path}): Failed`);
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('🎉 Server test completed!');
}

// HTTP 요청 함수
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// 스크립트 실행
if (require.main === module) {
  testServer().catch(console.error);
}

module.exports = { testServer }; 