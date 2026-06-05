const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");
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

// 생각 저장
app.post("/save", (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.json({ ok: false, error: "내용 없음" });

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
  const filename = `씨앗_${stamp}.md`;
  const filepath = path.join(VAULT, filename);

  const content = [
    `# ${text.trim().slice(0, 60)}`,
    "",
    text.trim(),
    "",
    "---",
    `*${now.toLocaleString("ko-KR")}*`,
  ].join("\n");

  try {
    if (!fs.existsSync(VAULT)) fs.mkdirSync(VAULT, { recursive: true });
    fs.writeFileSync(filepath, content, "utf8");
    console.log(`[저장] ${filename}`);
    res.json({ ok: true, filename, text: text.trim(), savedAt: now.toLocaleString("ko-KR") });
  } catch (e) {
    console.error("[오류]", e.message);
    res.json({ ok: false, error: e.message });
  }
});

// 최근 저장 기록 (최대 20개)
app.get("/history", (req, res) => {
  try {
    if (!fs.existsSync(VAULT)) return res.json({ ok: true, items: [] });
    const files = fs.readdirSync(VAULT)
      .filter(f => f.startsWith("씨앗_") && f.endsWith(".md"))
      .sort()
      .reverse()
      .slice(0, 20);

    const items = files.map(filename => {
      const raw = fs.readFileSync(path.join(VAULT, filename), "utf8");
      const lines = raw.split("\n");
      const title = lines[0].replace(/^# /, "");
      const body = lines.slice(2).join("\n").split("---")[0].trim();
      return { filename, title, body };
    });

    res.json({ ok: true, items });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

app.get("/ping", (req, res) => res.json({ ok: true, vault: VAULT }));

app.listen(PORT, "0.0.0.0", () => {
  console.log("================================");
  console.log(`  씨앗노트 v2 (기록) 서버 실행 중`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  저장 경로: ${VAULT}`);
  console.log("================================");
});
