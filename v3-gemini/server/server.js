const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");
const crypto = require("crypto");
require("dotenv").config();

// 토큰/비밀키 자동 생성 (없을 때만)
function ensureEnvVar(key, generator) {
  const envPath = path.join(__dirname, ".env");
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const regex = new RegExp(`^${key}=`, "m");
  if (regex.test(envContent)) return process.env[key];
  const value = generator();
  envContent = envContent.trimEnd() + `\n${key}=${value}\n`;
  fs.writeFileSync(envPath, envContent, "utf8");
  process.env[key] = value;
  return value;
}

const SEEDNOTE_TOKEN  = ensureEnvVar("SEEDNOTE_TOKEN",  () => crypto.randomBytes(3).toString("hex"));
const SEEDNOTE_SECRET = ensureEnvVar("SEEDNOTE_SECRET", () => crypto.randomBytes(16).toString("hex"));

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

function getVaultPath() {
  if (process.env.VAULT_PATH) return process.env.VAULT_PATH;
  const home = os.homedir();
  if (process.platform === "darwin") {
    const icloud = path.join(home, "Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault/0.Inbox");
    if (fs.existsSync(path.dirname(icloud))) return icloud;
    return path.join(home, "Documents/Obsidian Vault/0.Inbox");
  }
  return path.join(home, "Documents/Obsidian Vault/0.Inbox");
}

const VAULT = getVaultPath();
const PORT = process.env.PORT || 3456;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Gemini API 호출 (Node.js 내장 https 사용 — 추가 패키지 불필요)
function askGemini(text) {
  return new Promise((resolve) => {
    if (!GEMINI_API_KEY) { resolve(null); return; }

    const prompt = `당신은 아이디어를 풍성하게 키워주는 파트너입니다. 아래 메모를 읽고 다음 세 가지 중 가장 적합한 한 가지를 골라 응답하세요.

1. **개념 보충** — 메모의 핵심 개념을 더 깊이 설명하거나 놓친 중요한 맥락을 추가
2. **유사 사례** — 같은 원리가 적용된 실제 사례나 비슷한 상황의 예시를 소개
3. **결합 아이디어** — 이 아이디어에 무엇을 더하거나 연결하면 훨씬 강력해지는지 제안

응답 형식: 유형을 먼저 한 단어로(예: "보충:" / "사례:" / "결합:"), 이어서 2~3문장. 친근하고 실용적인 한국어로.

메모: "${text}"`;

    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const options = {
      hostname: "generativelanguage.googleapis.com",
      path: `/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const result = json?.candidates?.[0]?.content?.parts?.[0]?.text || null;
          resolve(result);
        } catch { resolve(null); }
      });
    });
    req.on("error", () => resolve(null));
    req.setTimeout(25000, () => { req.destroy(); resolve(null); });
    req.write(body);
    req.end();
  });
}

// 생각 저장 + Gemini 확장
app.post("/save", async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.json({ ok: false, error: "내용 없음" });

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
  const filename = `씨앗_${stamp}.md`;
  const filepath = path.join(VAULT, filename);

  // Gemini 호출 (저장과 병렬)
  const geminiPromise = askGemini(text.trim());

  const gemini = await geminiPromise;

  const sections = [
    `# ${text.trim().slice(0, 60)}`,
    "",
    text.trim(),
    "",
    "---",
  ];

  if (gemini) {
    sections.push("", "💭 **Gemini 생각 확장:**", "", gemini, "", "---");
  }

  sections.push(`*${now.toLocaleString("ko-KR")}*`);

  const content = sections.join("\n");

  try {
    if (!fs.existsSync(VAULT)) fs.mkdirSync(VAULT, { recursive: true });
    fs.writeFileSync(filepath, content, "utf8");
    console.log(`[저장] ${filename}${gemini ? " + Gemini ✓" : " (Gemini 없음)"}`);
    res.json({ ok: true, filename, gemini: gemini || null });
  } catch (e) {
    console.error("[오류]", e.message);
    res.json({ ok: false, error: e.message });
  }
});

// 최근 기록
app.get("/history", (req, res) => {
  try {
    if (!fs.existsSync(VAULT)) return res.json({ ok: true, items: [] });
    const files = fs.readdirSync(VAULT)
      .filter(f => f.startsWith("씨앗_") && f.endsWith(".md"))
      .sort().reverse().slice(0, 20);

    const items = files.map(filename => {
      const raw = fs.readFileSync(path.join(VAULT, filename), "utf8");
      const lines = raw.split("\n");
      const title = lines[0].replace(/^# /, "");
      const body = lines.slice(2).join("\n").split("---")[0].trim();
      const geminiMatch = raw.match(/💭 \*\*Gemini 생각 확장:\*\*\n\n([\s\S]*?)\n\n---/);
      const gemini = geminiMatch ? geminiMatch[1].trim() : null;
      return { filename, title, body, gemini };
    });

    res.json({ ok: true, items });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// 씨앗 삭제
app.delete("/delete", (req, res) => {
  const { filename } = req.body;
  if (!filename || !filename.startsWith("씨앗_") || !filename.endsWith(".md")) {
    return res.json({ ok: false, error: "잘못된 파일명" });
  }
  const filepath = path.join(VAULT, filename);
  if (!fs.existsSync(filepath)) return res.json({ ok: false, error: "파일 없음" });
  try {
    fs.unlinkSync(filepath);
    console.log(`[삭제] ${filename}`);
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

app.get("/ping", (req, res) => res.json({ ok: true, vault: VAULT, gemini: !!GEMINI_API_KEY }));

app.listen(PORT, "0.0.0.0", () => {
  console.log("================================");
  console.log(`  씨앗노트 v3 서버 실행 중`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  저장 경로: ${VAULT}`);
  console.log(`  Gemini: ${GEMINI_API_KEY ? "✓ 활성" : "✗ 없음"}`);
  console.log("================================");
  console.log("");
  console.log("  [폰 앱 연결 방법]");
  console.log(`  토큰: ${SEEDNOTE_TOKEN}`);
  console.log("  → 폰 앱 설정에 위 토큰을 입력하세요");
  console.log("");
  console.log("  [외부 접속 등록 방법]");
  console.log("  1. 새 터미널에서: cloudflared tunnel --url http://localhost:3456");
  console.log("  2. 나온 주소로: node register.js https://xxxx.trycloudflare.com");
  console.log("================================");
});
