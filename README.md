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

---

## 기능 (v3)

- 🎤 **음성 입력** — 마이크 버튼 누르고 말하면 텍스트 변환
- ⌨️ **텍스트 입력** — 직접 타이핑도 가능
- 📓 **옵시디언 자동 저장** — 버튼 하나로 0.Inbox에 즉시 저장
- 💭 **Gemini 생각 확장** — 저장 후 AI가 관련 아이디어 제안 (API 키 필요)
- 🌐 **이중 서버 주소** — 집(와이파이) + 외부(데이터) 주소 각각 등록, 자동 전환
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

# 3. 설정 파일 생성 (메모장으로 .env 파일 직접 생성)
```

`.env` 파일 내용:

```
VAULT_PATH=C:\Users\사용자이름\Documents\ObsidianVault\0. Inbox
PORT=3456
GEMINI_API_KEY=여기에_Gemini_API_키_입력
```

```bash
# 4. 서버 실행
node server.js
```

---

## 🌐 외부 접속 설정 (집 밖·데이터 사용)

같은 와이파이에서는 설정 없이 바로 된다.
외부(데이터, 다른 장소)에서 쓰려면 아래 두 방법 중 선택.

---

### 방법 1 — 임시 주소 (도메인 불필요, 5분 설정)

가장 빠른 방법. 단, **컴퓨터 재시작 시 주소가 바뀐다.**

**Mac:**

```bash
# cloudflared 설치
brew install cloudflare/cloudflare/cloudflared

# 터널 실행
cloudflared tunnel --url http://localhost:3456
```

**Windows:**

1. [cloudflared 다운로드](https://github.com/cloudflare/cloudflared/releases/latest) → `cloudflared-windows-amd64.exe`
2. 파일명을 `cloudflared.exe`로 변경 후 `C:\cloudflared\` 폴더에 이동
3. 명령 프롬프트에서 실행:

```cmd
C:\cloudflared\cloudflared.exe tunnel --url http://localhost:3456
```

터미널에 출력되는 `https://xxxx.trycloudflare.com` 주소를 폰 앱 설정 → **외부 주소** 칸에 입력.

---

### 방법 2 — 고정 주소 (도메인 있을 때, 재시작해도 주소 불변)

Cloudflare에 등록된 도메인이 있어야 한다. 한 번 설정하면 이후 신경 쓸 필요 없다.

**사전 준비:** [Cloudflare](https://cloudflare.com) 계정 + 도메인 등록

**Mac:**

```bash
# 1. cloudflared 설치 (이미 했으면 건너뜀)
brew install cloudflare/cloudflare/cloudflared

# 2. Cloudflare 계정 로그인 (브라우저 열림)
cloudflared tunnel login

# 3. 터널 생성
cloudflared tunnel create seednote

# 4. DNS 연결 (도메인 바꿔서 입력)
cloudflared tunnel route dns seednote seednote.내도메인.com
```

`~/.cloudflared/config.yml` 파일 생성:

```yaml
tunnel: <tunnel-id>          # cloudflared tunnel list 에서 확인
credentials-file: /Users/사용자이름/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: seednote.내도메인.com
    service: http://localhost:3456
  - service: http_status:404
```

```bash
# 5. 터널 실행
cloudflared tunnel run seednote
```

**Windows:**

```cmd
# 1. 로그인
C:\cloudflared\cloudflared.exe tunnel login

# 2. 터널 생성
C:\cloudflared\cloudflared.exe tunnel create seednote

# 3. DNS 연결
C:\cloudflared\cloudflared.exe tunnel route dns seednote seednote.내도메인.com
```

`C:\Users\사용자이름\.cloudflared\config.yml` 파일 생성:

```yaml
tunnel: <tunnel-id>
credentials-file: C:\Users\사용자이름\.cloudflared\<tunnel-id>.json

ingress:
  - hostname: seednote.내도메인.com
    service: http://localhost:3456
  - service: http_status:404
```

```cmd
C:\cloudflared\cloudflared.exe tunnel run seednote
```

---

## 🔄 컴퓨터 시작 시 자동 실행

서버를 항상 켜두고 싶을 때 설정.

**Mac — LaunchAgent:**

```bash
cloudflared service install
```

**Windows — 작업 스케줄러:**

1. 작업 스케줄러 열기 → 기본 작업 만들기
2. 트리거: 로그온할 때
3. 동작: 프로그램 시작 → `C:\cloudflared\cloudflared.exe`
4. 인수: `tunnel run seednote`

---

## 앱 설정 방법

서버 실행 후 폰 앱 열기 → 오른쪽 상단 ⚙️ 클릭:

| 항목 | 입력 값 |
|------|---------|
| 집·사무실 주소 | `http://192.168.x.x:3456` (같은 와이파이) |
| 외부·데이터 주소 | cloudflare 터널 주소 |

입력하면 자동 저장됨. 저장 시 와이파이 먼저 시도 → 실패 시 외부 주소로 자동 전환.

로컬 IP 확인:
- Mac: `ipconfig getifaddr en0`
- Windows: `ipconfig` → IPv4 주소

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
│   ├── app/index.html    ← 폰에서 여는 앱 (v3)
│   └── server/server.js  ← 옵시디언 저장 서버 (Gemini 연동)
├── app/index.html        ← 기본 앱 (v1)
├── server/server.js      ← 기본 서버 (v1)
├── index.html            ← 설치 가이드
└── CLAUDE.md             ← Claude CLI용 자동 설정
```

---

## 라이선스

MIT — 누구나 자유롭게 사용, 수정, 배포할 수 있습니다.
