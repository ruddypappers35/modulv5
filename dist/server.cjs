var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_genai = require("@google/genai");
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
var DB_DIR = process.env.VERCEL ? import_path.default.join("/tmp", "data") : import_path.default.join(process.cwd(), "data");
var DB_PATH = import_path.default.join(DB_DIR, "db.json");
function ensureDbExists() {
  if (!import_fs.default.existsSync(DB_DIR)) {
    import_fs.default.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!import_fs.default.existsSync(DB_PATH)) {
    import_fs.default.writeFileSync(DB_PATH, JSON.stringify([], null, 2), "utf-8");
  }
}
function getHistoryData() {
  try {
    ensureDbExists();
    const raw = import_fs.default.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Gagal membaca db.json, menggunakan fallback array kosong", error);
    return [];
  }
}
function saveHistoryData(data) {
  try {
    ensureDbExists();
    import_fs.default.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Gagal menulis ke db.json", error);
    return false;
  }
}
var apiRouter = import_express.default.Router();
apiRouter.get("/history", (req, res) => {
  const data = getHistoryData();
  res.json(data);
});
apiRouter.post("/history", (req, res) => {
  const newRecord = {
    id: req.body.id || Math.random().toString(36).substr(2, 9),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
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
apiRouter.put("/history/:id", (req, res) => {
  const { id } = req.params;
  const currentData = getHistoryData();
  const index = currentData.findIndex((item) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Riwayat tidak ditemukan" });
  }
  currentData[index] = {
    ...currentData[index],
    ...req.body,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
    // perbarui timestamp aktivitas terakhir
  };
  saveHistoryData(currentData);
  res.json(currentData[index]);
});
apiRouter.delete("/history/:id", (req, res) => {
  const { id } = req.params;
  const currentData = getHistoryData();
  const filtered = currentData.filter((item) => item.id !== id);
  if (currentData.length === filtered.length) {
    return res.status(404).json({ error: "Riwayat tidak ditemukan" });
  }
  saveHistoryData(filtered);
  res.json({ success: true, message: "Riwayat berhasil dihapus" });
});
apiRouter.post("/generate", async (req, res) => {
  const { prompt, userApiKey } = req.body;
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({
      error: "Kunci API (API Key) tidak ditemukan. Silakan masukkan API Key Gemini Anda di panel pengaturan / profil guru."
    });
  }
  try {
    const ai = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: error.message || "Gagal berkomunikasi dengan Gemini API. Pastikan API Key Anda valid dan memiliki kuota."
    });
  }
});
app.use("/api", apiRouter);
app.use("/modul-ajar/api", apiRouter);
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use("/modul-ajar", import_express.default.static(distPath));
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
if (!process.env.VERCEL) {
  setupViteOrStatic();
}
var server_default = app;
//# sourceMappingURL=server.cjs.map
