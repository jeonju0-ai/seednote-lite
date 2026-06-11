# 🌱 씨앗노트 (seednote-lite)

> 폰에서 말하거나 입력하면 내 컴퓨터 옵시디언에 바로 저장되는 앱

---

## 이런 분들께 딱 맞아요

- 걷다가, 운전하다가 떠오른 생각을 바로 남기고 싶은 분
- 옵시디언을 쓰는데 폰에서 빠르게 메모하고 싶은 분
- 집 밖에서도 메모가 필요한 분

---

## 작동 원리

```
📱 폰  →  🌐 인터넷  →  💻 내 컴퓨터  →  📓 옵시디언
말하거나 입력       서버가 받아서         자동 저장!
```

집 와이파이에서는 직접 연결, 밖에서는 릴레이 서버를 통해 자동 연결.
사용자는 **토큰 1개만** 알면 됨 — 주소, IP 몰라도 됨.

---

## 기능 (v3)

- 🎤 **음성 입력** — 마이크 버튼 누르고 말하면 텍스트 변환
- ⌨️ **텍스트 입력** — 직접 타이핑도 가능
- 📓 **옵시디언 자동 저장** — 버튼 하나로 0.Inbox에 즉시 저장
- 💭 **Gemini 생각 확장** — 저장 후 AI가 관련 아이디어 제안 (선택, API 키 필요)
- 🔁 **자동 연결** — 집 와이파이 직접 연결 / 밖 데이터·공공 와이파이 릴레이 자동 전환
- 📱 **PWA** — 홈 화면에 추가하면 앱처럼 사용 가능

---

## 📱 앱 주소

폰 브라우저에서 바로 열기:

```
https://jeonju0-ai.github.io/seednote-lite/app/
```

---

## 💻 서버 설치

### Mac

```bash
# 1. 이 저장소 받기
git clone https://github.com/jeonju0-ai/seednote-lite.git
cd seednote-lite/v3-gemini/server

# 2. 패키지 설치
npm install

# 3. 설정 파일 생성
cp .env.example .env
```

`.env` 파일 열어서 수정:

```
VAULT_PATH=/Users/사용자이름/Library/Mobile Documents/iCloud~md~obsidian/Documents/볼트이름/0. Inbox
PORT=3456
GEMINI_API_KEY=여기에_Gemini_API_키_입력  # 없으면 이 줄 삭제
```

```bash
# 4. 서버 실행
node server.js
```

### Windows

```bash
# 1. 이 저장소 받기
git clone https://github.com/jeonju0-ai/seednote-lite.git
cd seednote-lite\v3-gemini\server

# 2. 패키지 설치
npm install
```

`.env` 파일 직접 생성 (메모장):

```
VAULT_PATH=C:\Users\사용자이름\Documents\ObsidianVault\0. Inbox
PORT=3456
GEMINI_API_KEY=여기에_Gemini_API_키_입력
```

```bash
# 3. 서버 실행
node server.js
```

---

## 📱 폰 앱 연결 방법

서버 실행하면 터미널에 이렇게 표시됨:

```
================================
  씨앗노트 v3 서버 실행 중
================================

  [폰 앱 연결 방법]
  토큰: a3f8k2
  → 폰 앱 설정에 위 토큰을 입력하세요
================================
```

폰 앱 열기 → 오른쪽 상단 ⚙️ → **토큰 입력** → 완료.

집 와이파이 / 밖 데이터 / 공공 와이파이 어디서든 자동으로 연결됨.

---

## 🌐 외부 접속 설정 (밖에서도 저장하려면)

같은 와이파이에서는 설정 없이 바로 된다.
밖에서도 저장하려면 cloudflared 터널을 열고 릴레이에 등록해야 한다.

```bash
# 1. cloudflared 설치 (Mac)
brew install cloudflare/cloudflare/cloudflared

# 2. 새 터미널에서 터널 실행
cloudflared tunnel --url http://localhost:3456

# 3. 나온 주소를 릴레이에 등록
node register.js https://xxxx.trycloudflare.com
```

Windows는 [cloudflared 다운로드](https://github.com/cloudflare/cloudflared/releases/latest) 후 동일하게 실행.

등록하면 폰 앱이 자동으로 해당 주소로 연결됨.
서버 재시작 시 새 주소로 `node register.js` 다시 실행 필요.

---

## 🔄 컴퓨터 시작 시 자동 실행 (Mac)

```bash
# cloudflare 서비스 자동 시작 등록
cloudflared service install
```

---

## 필요한 것

| 항목 | 설명 |
|------|------|
| 📱 폰 | 크롬 브라우저 (안드로이드·아이폰 모두 가능) |
| 💻 컴퓨터 | Mac 또는 Windows |
| 📓 옵시디언 | [무료 설치](https://obsidian.md) |
| 📦 Node.js | [무료 설치](https://nodejs.org) LTS 버전 |

---

## 파일 구조

```
seednote-lite/
├── v3-gemini/
│   ├── app/index.html      ← 폰에서 여는 앱 (v3)
│   └── server/
│       ├── server.js       ← 옵시디언 저장 서버
│       └── register.js     ← 외부 주소 릴레이 등록 스크립트
├── app/index.html          ← 기본 앱 (v1)
├── server/server.js        ← 기본 서버 (v1)
└── index.html              ← 설치 가이드
```

---

## 라이선스

MIT — 누구나 자유롭게 사용, 수정, 배포할 수 있습니다.
