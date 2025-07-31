# Tore Blockchain Server

TypeScript로 작성된 블록체인 서버입니다.

## 🚀 시작하기

### 필수 요구사항

- Node.js (v16 이상)
- npm 또는 yarn

### 설치

```bash
# 의존성 설치
npm install

# 또는 yarn 사용시
yarn install
```

### 개발 서버 실행

```bash
# 개발 모드로 실행 (파일 변경시 자동 재시작)
npm run dev:watch

# 또는 단일 실행
npm run dev
```

### 프로덕션 빌드 및 실행

```bash
# TypeScript 컴파일
npm run build

# 프로덕션 서버 실행
npm start
```

## 📁 프로젝트 구조

```
tore_blockchain_server/
├── src/                    # TypeScript 소스 코드
│   └── index.ts           # 메인 실행 파일
├── dist/                   # 컴파일된 JavaScript 파일 (자동 생성)
├── package.json           # 프로젝트 설정 및 의존성
├── tsconfig.json          # TypeScript 설정
├── nodemon.json           # nodemon 설정
└── README.md              # 프로젝트 문서
```

## 🔧 사용 가능한 스크립트

- `npm run build` - TypeScript를 JavaScript로 컴파일
- `npm start` - 컴파일된 코드로 서버 실행
- `npm run dev` - ts-node로 개발 서버 실행
- `npm run dev:watch` - 파일 변경 감지하여 자동 재시작
- `npm run clean` - dist 폴더 정리

## 🌐 API 엔드포인트

- `GET /` - 서버 상태 확인
- `GET /health` - 헬스 체크

## 🔧 환경 변수

`.env` 파일을 생성하여 다음 환경 변수를 설정할 수 있습니다:

```
PORT=3000
NODE_ENV=development
```

## 📝 개발 가이드

### 새로운 라우트 추가

`src/index.ts` 파일에 새로운 라우트를 추가하거나, 별도의 라우터 파일을 생성하여 모듈화할 수 있습니다.

### 타입 정의

TypeScript의 타입 안전성을 활용하여 인터페이스와 타입을 정의하여 사용하세요.

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📄 라이선스

ISC License

