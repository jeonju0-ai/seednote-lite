const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");
require("dotenv").config();

const app = express();
app.use(express.json());

// 어느 출처에서든 접근 허용 (폰 → PC)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// 옵시디언 저장 경로 자동 감지
function getVaultPath() {
  if (process.env.VAULT_PATH) return process.env.VAULT_PATH;
  const home = os.homedir();
  const platform = process.platform;
  if (platform === "darwin") {
    // Mac - iCloud 옵시디언 경로 우선
    const icloud = path.join(home, "Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault/0.Inbox");
    if (fs.existsSync(path.dirname(icloud))) return icloud;
    return path.join(home, "Documents/Obsidian Vault/0.Inbox");
  }
  if (platform === "win32") return path.join(home, "Documents/Obsidian Vault/0.Inbox");
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
    res.json({ ok: true, filename });
  } catch (e) {
    console.error("[오류]", e.message);
    res.json({ ok: false, error: e.message });
  }
});

// 서버 상태 확인
app.get("/ping", (req, res) => {
  res.json({ ok: true, vault: VAULT });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("================================");
  console.log(`  씨앗노트 서버 실행 중`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  저장 경로: ${VAULT}`);
  console.log("================================");
});
