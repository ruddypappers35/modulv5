import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const DB_DIR = process.env.VERCEL 
  ? path.join("/tmp", "data") 
  : path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "db.json");

// Pastikan folder data dan file db.json ada
function ensureDbExists() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2), "utf-8");
  }
}

// Ambil riwayat
function getHistoryData() {
  try {
    ensureDbExists();
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Gagal membaca db.json, menggunakan fallback array kosong", error);
    return [];
  }
}

// Simpan riwayat
function saveHistoryData(data: any) {
  try {
    ensureDbExists();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Gagal menulis ke db.json", error);
    return false;
  }
}

// Database allowed_emails.json helpers
const EMAILS_PATH = path.join(DB_DIR, "allowed_emails.json");

function ensureEmailsDbExists() {
  ensureDbExists();
  if (!fs.existsSync(EMAILS_PATH)) {
    // Inisialisasi awal dengan email admin default
    fs.writeFileSync(EMAILS_PATH, JSON.stringify(["rudy@admin.com"], null, 2), "utf-8");
  }
}

function getAllowedEmails(): string[] {
  try {
    ensureEmailsDbExists();
    const raw = fs.readFileSync(EMAILS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Gagal membaca allowed_emails.json", error);
    return ["rudy@admin.com"];
  }
}

function saveAllowedEmails(emails: string[]) {
  try {
    ensureEmailsDbExists();
    fs.writeFileSync(EMAILS_PATH, JSON.stringify(emails, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Gagal menyimpan allowed_emails.json", error);
    return false;
  }
}

// Middleware untuk memvalidasi apakah user diperbolehkan mengakses aplikasi
function checkAuth(req: any, res: any, next: any) {
  const email = req.headers["x-user-email"];
  if (!email) {
    return res.status(401).json({ error: "Akses Ditolak. Email user tidak disediakan." });
  }
  const allowed = getAllowedEmails();
  if (!allowed.includes(email.trim().toLowerCase())) {
    return res.status(403).json({ error: "Akses Ditolak. Email Anda belum terdaftar untuk mengakses aplikasi." });
  }
  next();
}

// Middleware untuk memvalidasi otorisasi admin
function checkAdminAuth(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  if (authHeader === "Bearer admin-session-token-ryuna") {
    next();
  } else {
    res.status(401).json({ error: "Akses Ditolak. Sesi admin tidak valid atau kedaluwarsa." });
  }
}

// API Routes
const apiRouter = express.Router();

// A. Auth & Admin Routes

// 1. Cek validitas email normal user
apiRouter.post("/auth/check-email", (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email wajib diisi dengan format yang benar." });
  }
  const normalized = email.trim().toLowerCase();
  const allowed = getAllowedEmails();
  if (allowed.includes(normalized)) {
    res.json({ success: true, email: normalized });
  } else {
    res.status(403).json({ error: "Email Anda belum terdaftar. Silakan hubungi admin untuk mendapatkan akses." });
  }
});

// 2. Login Admin
apiRouter.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "rudy@admin.com" && password === "Ryuna0106") {
    res.json({ success: true, token: "admin-session-token-ryuna" });
  } else {
    res.status(401).json({ error: "Username atau password admin salah." });
  }
});

// 3. Get list email terdaftar (Admin)
apiRouter.get("/admin/emails", checkAdminAuth, (req, res) => {
  const emails = getAllowedEmails();
  res.json(emails);
});

// 4. Add email ke whitelist (Admin)
apiRouter.post("/admin/emails", checkAdminAuth, (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Format email tidak valid." });
  }
  const normalized = email.trim().toLowerCase();
  const emails = getAllowedEmails();
  if (emails.includes(normalized)) {
    return res.status(400).json({ error: "Email sudah terdaftar dalam sistem." });
  }
  emails.push(normalized);
  saveAllowedEmails(emails);
  res.json({ success: true, emails });
});

// 5. Delete email dari whitelist (Admin)
apiRouter.delete("/admin/emails/:email", checkAdminAuth, (req, res) => {
  const { email } = req.params;
  const normalized = email.trim().toLowerCase();
  if (normalized === "rudy@admin.com") {
    return res.status(400).json({ error: "Email admin utama tidak dapat dihapus." });
  }
  let emails = getAllowedEmails();
  if (!emails.includes(normalized)) {
    return res.status(404).json({ error: "Email tidak ditemukan." });
  }
  emails = emails.filter(e => e !== normalized);
  saveAllowedEmails(emails);
  res.json({ success: true, emails });
});

// B. Perencanaan & Modul Ajar Routes (Memerlukan checkAuth)

// 1. Get History
apiRouter.get("/history", checkAuth, (req, res) => {
  const data = getHistoryData();
  res.json(data);
});

// 2. Add History
apiRouter.post("/history", checkAuth, (req, res) => {
  const newRecord = {
    id: req.body.id || Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    kelas: req.body.kelas || "",
    fase: req.body.fase || "",
    semester: req.body.semester || "",
    mapel: req.body.mapel || "",
    topik: req.body.topik || "",
    cp: req.body.cp || "",
    tp: req.body.tp || "",
    waktu: req.body.waktu || "",
    model: req.body.model || "",
    metode: req.body.metode || [],
    dpl: req.body.dpl || [],
    nilaiKarakter: req.body.nilaiKarakter || [],
    modulHtml: req.body.modulHtml || "",
    lkpdHtml: req.body.lkpdHtml || "",
    asesmenHtml: req.body.asesmenHtml || "",
    materiHtml: req.body.materiHtml || "",
    refleksiHtml: req.body.refleksiHtml || "",
    protaHtml: req.body.protaHtml || "",
    kktpHtml: req.body.kktpHtml || "",
    promesHtml: req.body.promesHtml || ""
  };

  const currentData = getHistoryData();
  currentData.unshift(newRecord);
  saveHistoryData(currentData);

  res.status(201).json(newRecord);
});

// 3. Update History
apiRouter.put("/history/:id", checkAuth, (req, res) => {
  const { id } = req.params;
  const currentData = getHistoryData();
  const index = currentData.findIndex((item: any) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Riwayat tidak ditemukan" });
  }

  currentData[index] = {
    ...currentData[index],
    ...req.body,
    timestamp: new Date().toISOString()
  };

  saveHistoryData(currentData);
  res.json(currentData[index]);
});

// 4. Delete History
apiRouter.delete("/history/:id", checkAuth, (req, res) => {
  const { id } = req.params;
  const currentData = getHistoryData();
  const filtered = currentData.filter((item: any) => item.id !== id);

  if (currentData.length === filtered.length) {
    return res.status(404).json({ error: "Riwayat tidak ditemukan" });
  }

  saveHistoryData(filtered);
  res.json({ success: true, message: "Riwayat berhasil dihapus" });
});

// 4.5. Restore History
apiRouter.post("/history/restore", checkAuth, (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records)) {
    return res.status(400).json({ error: "Format data tidak valid. 'records' harus berupa array." });
  }
  const saved = saveHistoryData(records);
  if (saved) {
    res.json({ success: true, message: "Database berhasil dipulihkan." });
  } else {
    res.status(500).json({ error: "Gagal memulihkan database." });
  }
});

// 5. AI Generation Endpoint (Modul Ajar & LKPD)
apiRouter.post("/generate", checkAuth, async (req, res) => {
  const { prompt, userApiKey } = req.body;
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ 
      error: "Kunci API (API Key) tidak ditemukan. Silakan masukkan API Key Gemini Anda di panel pengaturan / profil guru." 
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ 
      error: error.message || "Gagal berkomunikasi dengan Gemini API. Pastikan API Key Anda valid dan memiliki kuota." 
    });
  }
});

app.use("/api", apiRouter);
app.use("/modul-ajar/api", apiRouter);

// Setup Vite atau Static File Server
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use("/modul-ajar", express.static(distPath));
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  setupViteOrStatic();
}

export default app;
