/**
 * 씨앗노트 외부 주소 릴레이 등록 스크립트
 * 사용법: node register.js https://xxxx.trycloudflare.com
 */
const https = require("https");
const http = require("http");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const RELAY_URL = "https://seednote-relay.vercel.app";

const url = process.argv[2];
if (!url) {
  console.error("사용법: node register.js https://xxxx.trycloudflare.com");
  process.exit(1);
}

const token = process.env.SEEDNOTE_TOKEN;
if (!token) {
  console.error("토큰을 찾을 수 없습니다. server.js를 먼저 실행해 토큰을 생성하세요.");
  process.exit(1);
}

const body = JSON.stringify({ token, url });
const parsed = new URL(RELAY_URL + "/api/register");

const options = {
  hostname: parsed.hostname,
  path: parsed.pathname,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  },
};

const req = https.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    try {
      const json = JSON.parse(data);
      if (json.ok) {
        console.log("✓ 릴레이 등록 완료!");
        console.log(`  토큰: ${token}`);
        console.log(`  주소: ${url}`);
        console.log("  폰 앱에서 토큰 입력 후 바로 접속됩니다.");
      } else {
        console.error("등록 실패:", json.error);
      }
    } catch {
      console.error("응답 파싱 실패:", data);
    }
  });
});

req.on("error", (e) => console.error("연결 오류:", e.message));
req.write(body);
req.end();
