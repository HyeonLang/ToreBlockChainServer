import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 서버 시작 시간 기록
const startTime = new Date();

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 서버 상태 확인을 위한 상세 정보
const getServerInfo = () => ({
  name: 'Tore Blockchain Server',
  version: '1.0.0',
  status: 'running',
  uptime: process.uptime(),
  startTime: startTime.toISOString(),
  currentTime: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  port: PORT,
  nodeVersion: process.version,
  platform: process.platform,
  memoryUsage: process.memoryUsage(),
  pid: process.pid
});

// 기본 라우트
app.get('/', (req, res) => {
  console.log(`✅ GET / - Request received from ${req.ip}`);
  res.json({
    message: 'Tore Blockchain Server is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    status: 'success'
  });
});

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  console.log(`✅ GET /health - Health check from ${req.ip}`);
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    startTime: startTime.toISOString()
  });
});

// 서버 정보 엔드포인트
app.get('/info', (req, res) => {
  console.log(`✅ GET /info - Server info requested from ${req.ip}`);
  res.json(getServerInfo());
});

// 테스트 엔드포인트
app.get('/test', (req, res) => {
  console.log(`✅ GET /test - Test endpoint called from ${req.ip}`);
  res.json({
    message: 'Test endpoint is working!',
    timestamp: new Date().toISOString(),
    test: 'success'
  });
});

// 404 에러 핸들러
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl} from ${req.ip}`);
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 Tore Blockchain Server Starting...');
  console.log('='.repeat(60));
  console.log(`📅 Start Time: ${startTime.toLocaleString()}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Node Version: ${process.version}`);
  console.log(`💻 Platform: ${process.platform}`);
  console.log(`🆔 Process ID: ${process.pid}`);
  console.log('='.repeat(60));
  console.log('✅ Server is ready to accept connections!');
  console.log('📋 Available endpoints:');
  console.log(`   • GET http://localhost:${PORT}/ - Server status`);
  console.log(`   • GET http://localhost:${PORT}/health - Health check`);
  console.log(`   • GET http://localhost:${PORT}/info - Server info`);
  console.log(`   • GET http://localhost:${PORT}/test - Test endpoint`);
  console.log('='.repeat(60));
});

// 에러 핸들링
app.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 ${signal} received, shutting down gracefully...`);
  console.log('⏳ Closing server...');
  
  setTimeout(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  }, 1000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 예상치 못한 에러 처리
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app; 