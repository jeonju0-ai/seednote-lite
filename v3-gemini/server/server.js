const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");
require("dotenv").config();

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

    const prompt = `다음 메모를 읽고 생각을 확장할 수 있는 질문이나 연결 아이디어를 2~3문장으로 짧게 제안해줘. 친근한 말투로, 한국어로.

메모: "${text}"`;

    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const options = {
      hostname: "generativelanguage.googleapis.com",
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
    req.setTimeout(10000, () => { req.destroy(); resolve(null); });
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

app.get("/ping", (req, res) => res.json({ ok: true, vault: VAULT, gemini: !!GEMINI_API_KEY }));

app.listen(PORT, "0.0.0.0", () => {
  console.log("================================");
  console.log(`  씨앗노트 v3 (Gemini) 서버 실행 중`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  저장 경로: ${VAULT}`);
  console.log(`  Gemini: ${GEMINI_API_KEY ? "✓ 활성" : "✗ GEMINI_API_KEY 없음 (.env 확인)"}`);
  console.log("================================");
});
