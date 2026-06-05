# 씨앗노트 (seednote-lite)

안드로이드 폰에서 목소리나 글로 생각을 남기면 내 컴퓨터 옵시디언에 저장되는 앱.

## 구조

- `app/index.html` — 폰에서 여는 PWA 앱 (HTML 파일 하나, 프레임워크 없음)
- `server/server.js` — 옵시디언 저장 서버 (Node.js + Express)
- `index.html` — 초보자 설치 가이드

## 사용자가 "설치해줘" 또는 "실행해줘"라고 하면

아래 순서로 자동으로 처리해줘:

1. Node.js 설치 여부 확인 (`node -v`)
   - 없으면 설치 방법 안내 (https://nodejs.org LTS 버전)
2. `server/` 폴더에서 `npm install` 실행
3. 옵시디언 볼트 경로 자동 감지 (Mac iCloud 경로 우선)
   - 못 찾으면 사용자에게 경로 물어보기
   - 찾으면 `server/.env` 파일에 `VAULT_PATH=경로` 자동 작성
4. 내 컴퓨터 IP 주소 찾기
   - Mac: `ipconfig getifaddr en0`
   - Windows: `ipconfig` 실행 후 IPv4 주소 파싱
5. `server/server.js` 실행
6. 사용자에게 정확한 폰 설정 URL 알려주기:
   `http://[찾은 IP 주소]:3456`

## 사용자가 "외부에서도 쓰고 싶어" 또는 "cloudflare" 라고 하면

1. cloudflared 설치 여부 확인
   - Mac: `brew install cloudflare/cloudflare/cloudflared`
   - Windows: 다운로드 링크 안내
2. `cloudflared tunnel --url http://localhost:3456` 실행
3. 생성된 trycloudflare.com 주소를 사용자에게 알려주기

## 사용자가 "서버 꺼줘" 라고 하면

`lsof -ti:3456 | xargs kill` 실행 (Mac)
`netstat -ano | findstr :3456` 로 PID 찾아서 `taskkill` (Windows)

## 사용자가 "GitHub에 올려줘" 라고 하면

1. git init (없으면)
2. .gitignore 생성 (node_modules, .env 제외)
3. git add, commit
4. GitHub repo 생성 안내 및 push
5. GitHub Pages 활성화 방법 안내

## 주요 API 엔드포인트

- `POST /save` — `{ text: "내용" }` → 옵시디언에 마크다운 파일 저장
- `GET /ping` — 서버 상태 확인 및 저장 경로 반환

## 기본값

- 포트: 3456
- 저장 경로: `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault/0.Inbox` (Mac iCloud)
- 파일명 형식: `씨앗_YYYY-MM-DD_HH-MM.md`

## 초보자에게 설명할 때

- 전문 용어 대신 쉬운 말 사용
- 명령어는 항상 복사하기 쉽게 코드블록으로
- 에러가 나면 원인을 쉽게 설명하고 해결책 제시
- "터미널" = 검은 창, "서버" = 항상 켜놓는 프로그램 으로 설명
