import React, { useState, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import { Navbar } from "./components/Navbar";
import { HistorySidebar } from "./components/HistorySidebar";
import { GeneratorForm } from "./components/GeneratorForm";
import { DocumentPreview } from "./components/DocumentPreview";
import { ProfileModal } from "./components/ProfileModal";
import { BabSelectionModal } from "./components/BabSelectionModal";
import { GuruProfile, ModulRecord, CurriculumBab } from "./types";
import { AlertCircle, HelpCircle, CheckCircle, Info, RefreshCw, Sliders, Eye, PenTool } from "lucide-react";

export default function App() {
  const [profile, setProfile] = useState<GuruProfile | null>(null);
  const [history, setHistory] = useState<ModulRecord[]>([]);
  const [activeRecord, setActiveRecord] = useState<ModulRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"modul" | "lkpd" | "asesmen" | "materi" | "refleksi" | "perencanaan">("modul");
  const [activeSubTab, setActiveSubTab] = useState<"prota" | "kktp" | "promes">("prota");
  const [leftColTab, setLeftColTab] = useState<"input" | "history">("input");
  const [mobileActiveView, setMobileActiveView] = useState<"input" | "preview">("input");
  
  // Modals & Loadings
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBabSelectionOpen, setIsBabSelectionOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lkpdGenerating, setLkpdGenerating] = useState(false);
  const [asesmenGenerating, setAsesmenGenerating] = useState(false);
  const [materiGenerating, setMateriGenerating] = useState(false);
  const [refleksiGenerating, setRefleksiGenerating] = useState(false);
  const [protaGenerating, setProtaGenerating] = useState(false);
  const [kktpGenerating, setKktpGenerating] = useState(false);
  const [promesGenerating, setPromesGenerating] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Form States
  const [formValues, setFormValues] = useState({
    kelas: "",
    fase: "",
    semester: "",
    mapel: "",
    topik: "",
    cp: "",
    tp: "",
    waktu: "",
    model: "",
    metode: [] as string[],
    dpl: [] as string[],
    nilaiKarakter: [] as string[]
  });

  // Tampilkan Toast Notifikasi
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper untuk melakukan generate menggunakan Gemini (Mencoba Server, Fallback ke Browser Client-side)
  const executeAIGenerate = async (rawPrompt: string): Promise<string> => {
    // Sisipkan aturan bahasa & istilah resmi sesuai CP Kemdikbudristek RI
    const prompt = `${rawPrompt}

[PANDUAN ISTILAH & GAYA BAHASA PENTING]:
1. Gunakan istilah resmi Kurikulum Merdeka Kemdikbudristek RI secara konsisten (misalnya: "Fase", "Tujuan Pembelajaran (TP)", "Alur Tujuan Pembelajaran (ATP)", "Asesmen Formatif/Sumatif", "Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)", "Profil Pelajar Pancasila").
2. SESUAIKAN BAHASA: Sederhanakan bahasa dan penjelasan materi agar sesuai dengan jenjang usia/kelas siswa. JANGAN menggunakan istilah akademis yang terlalu rumit, abstrak, atau kalimat berbelit-belit untuk mata pelajaran sekolah.
3. Kosakata, ilustrasi, studi kasus, instruksi tugas/LKPD, dan pertanyaan pemantik/asesmen harus ramah anak, mudah dicerna, komunikatif, konkret, dan dekat dengan kehidupan sehari-hari siswa.`;

    let keysToTry: string[] = [];
    let initialActiveIndex = 0;

    if (profile) {
      const pKeys = profile.apiKeys || [];
      const legacyKey = profile.userApiKey || "";
      if (pKeys.length > 0) {
        keysToTry = [...pKeys];
        initialActiveIndex = profile.activeApiKeyIndex !== undefined ? profile.activeApiKeyIndex : 0;
      } else if (legacyKey) {
        keysToTry = [legacyKey];
        initialActiveIndex = 0;
      }
    }

    if (keysToTry.length === 0) {
      throw new Error("Kunci API (API Key) tidak ditemukan. Silakan masukkan API Key Gemini Anda di panel pengaturan / profil guru.");
    }

    if (initialActiveIndex < 0 || initialActiveIndex >= keysToTry.length) {
      initialActiveIndex = 0;
    }

    const isQuotaError = (message: string): boolean => {
      if (!message) return false;
      const msgLower = message.toLowerCase();
      return (
        msgLower.includes("quota") ||
        msgLower.includes("rate limit") ||
        msgLower.includes("429") ||
        msgLower.includes("limit") ||
        msgLower.includes("exhausted") ||
        msgLower.includes("resource_exhausted") ||
        msgLower.includes("resource exhausted")
      );
    };

    let currentIndex = initialActiveIndex;
    let attemptsCount = 0;
    const totalKeys = keysToTry.length;

    while (attemptsCount < totalKeys) {
      const currentApiKey = keysToTry[currentIndex];
      
      try {
        // 1. Coba panggil server API terlebih dahulu
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, userApiKey: currentApiKey })
        });

        const contentType = response.headers.get("Content-Type") || "";
        
        if (response.ok) {
          if (contentType.includes("application/json")) {
            const data = await response.json();
            if (data && data.text) {
              // Jika beralih kunci, update profil dan simpan ke localStorage secara persistent
              if (currentIndex !== initialActiveIndex && profile) {
                const updatedProfile = {
                  ...profile,
                  userApiKey: currentApiKey,
                  activeApiKeyIndex: currentIndex
                };
                setProfile(updatedProfile);
                localStorage.setItem("guruProfile", JSON.stringify(updatedProfile));
              }
              return data.text;
            }
          }
          throw new Error("Server API tidak mengembalikan respon JSON valid");
        } else {
          let errorMsg = "";
          if (contentType.includes("application/json")) {
            try {
              const errData = await response.json();
              errorMsg = errData.error || "";
            } catch (_) {}
          }
          if (!errorMsg) {
            errorMsg = `HTTP Error ${response.status}`;
          }
          
          if (isQuotaError(errorMsg) || response.status === 429) {
            throw new Error("QUOTA_LIMIT_ERROR");
          }
          throw new Error(errorMsg);
        }
      } catch (serverError: any) {
        const isQuota = serverError.message === "QUOTA_LIMIT_ERROR" || isQuotaError(serverError.message);
        
        if (isQuota && totalKeys > 1 && attemptsCount < totalKeys - 1) {
          // Rotasi ke API key berikutnya
          currentIndex = (currentIndex + 1) % totalKeys;
          attemptsCount++;
          console.warn(`API Key ke-${currentIndex === 0 ? totalKeys : currentIndex} terkena Quota/Limit. Berpindah otomatis ke API Key berikutnya...`);
          continue; // Lanjut ke iterasi berikutnya untuk mencoba key baru
        }
        
        // Coba browser-side fallback menggunakan key ini sebelum beralih ke key berikutnya jika bukan quota error,
        // atau jika browser-side fallback juga bisa merotasi key.
        console.warn("API Server bermasalah, mencoba browser-side generation langsung...", serverError);
        
        try {
          const ai = new GoogleGenAI({ apiKey: currentApiKey });
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
          });
          if (response && response.text) {
            if (currentIndex !== initialActiveIndex && profile) {
              const updatedProfile = {
                ...profile,
                userApiKey: currentApiKey,
                activeApiKeyIndex: currentIndex
              };
              setProfile(updatedProfile);
              localStorage.setItem("guruProfile", JSON.stringify(updatedProfile));
            }
            return response.text;
          }
          throw new Error("Respon dari Gemini API kosong");
        } catch (browserError: any) {
          console.error("Client-side generation gagal:", browserError);
          const bMsg = browserError.message || "";
          const isBrowserQuota = isQuotaError(bMsg) || browserError.status === 429;
          
          if (isBrowserQuota && totalKeys > 1 && attemptsCount < totalKeys - 1) {
            currentIndex = (currentIndex + 1) % totalKeys;
            attemptsCount++;
            console.warn(`Client-side API Key ke-${currentIndex === 0 ? totalKeys : currentIndex} terkena Quota/Limit. Berpindah otomatis ke API Key berikutnya...`);
            continue;
          }
          
          if (isBrowserQuota) {
            throw new Error("Quota semua API Key Gemini Anda telah habis atau terkena pembatasan kecepatan (Rate Limit). Silakan tunggu beberapa menit lagi atau tambahkan API Key baru.");
          }
          throw new Error(browserError.message || "Gagal berkomunikasi dengan Gemini API. Silakan coba kembali beberapa saat lagi.");
        }
      }
    }

    throw new Error("Semua API Key yang terkonfigurasi mengalami limitasi quota. Silakan tunggu beberapa menit lagi atau tambahkan API Key baru.");
  };

  // Muat data profil dari LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("guruProfile");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        
        // Normalize apiKeys in case older versions stored objects like {provider, key, label}
        if (Array.isArray(p.apiKeys)) {
          p.apiKeys = p.apiKeys.map((k: any) => typeof k === 'string' ? k : (k.key || String(k)));
        }
        
        setProfile(p);
        setFormValues((prev) => ({ ...prev, mapel: p.mapel }));
      } catch (e) {
        console.error("Gagal membaca profil dari localStorage", e);
      }
    } else {
      // Buka modal profil otomatis jika baru pertama kali masuk
      setIsProfileOpen(true);
    }
  }, []);

  // Muat Riwayat dari Server Express API
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch("/api/history");
      const contentType = response.headers.get("Content-Type") || "";
      if (response.ok && contentType.includes("application/json")) {
        const data = await response.json();
        setHistory(data);
      } else {
        throw new Error("Gagal mengambil data dari server");
      }
    } catch (e) {
      console.warn("Server API offline atau gagal terhubung, menggunakan fallback localStorage", e);
      // Fallback ke localStorage
      const savedHistory = localStorage.getItem("modulHistory");
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch (jsonErr) {
          console.error("Gagal membaca JSON riwayat lokal:", jsonErr);
        }
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Simpan/Update Profil Guru & API Key
  const handleSaveProfile = (updatedProfile: GuruProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem("guruProfile", JSON.stringify(updatedProfile));
    
    // Sinkronisasi default mapel ke form jika masih kosong
    setFormValues((prev) => ({
      ...prev,
      mapel: prev.mapel || updatedProfile.mapel
    }));

    showToast("Profil Guru & API Key disimpan dengan sukses!", "success");
  };

  // Hapus Riwayat
  const handleDeleteHistory = async (id: string) => {
    try {
      const response = await fetch(`/api/history/${id}`, {
        method: "DELETE"
      });

      const contentType = response.headers.get("Content-Type") || "";
      if (response.ok && contentType.includes("application/json")) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        if (activeRecord?.id === id) {
          setActiveRecord(null);
        }
        showToast("Riwayat berhasil dihapus", "success");
      } else {
        throw new Error("Gagal menghapus dari server");
      }
    } catch (e) {
      // Fallback lokal
      const updated = history.filter((item) => item.id !== id);
      setHistory(updated);
      localStorage.setItem("modulHistory", JSON.stringify(updated));
      if (activeRecord?.id === id) {
        setActiveRecord(null);
      }
      showToast("Riwayat dihapus (Lokal)", "success");
    }
  };

  // Populate form dari list Riwayat yang diklik
  const handleSelectRecord = (record: ModulRecord) => {
    setActiveRecord(record);
    setActiveTab("modul");
    setMobileActiveView("preview");
    setFormValues({
      kelas: record.kelas,
      fase: record.fase,
      semester: record.semester,
      mapel: record.mapel,
      topik: record.topik,
      cp: record.cp,
      tp: record.tp,
      waktu: record.waktu,
      model: record.model || "",
      metode: record.metode || [],
      dpl: record.dpl || [],
      nilaiKarakter: record.nilaiKarakter || []
    });
    showToast(`Memuat modul ajar: ${record.mapel}`, "info");
  };

  // Pilihan Bab Kurikulum Merdeka
  const handleSelectBab = (bab: CurriculumBab) => {
    setFormValues((prev) => ({
      ...prev,
      kelas: bab.kelas,
      fase: bab.fase,
      semester: bab.semester,
      mapel: bab.mapel,
      topik: `${bab.bab} - ${bab.materi}`,
      cp: bab.cpDefault || prev.cp
    }));
    showToast(`Bab "${bab.bab}" berhasil dipilih!`, "success");
  };

  // AI Generator CP (Capaian Pembelajaran)
  const handleSuggestCP = async (): Promise<string> => {
    if (!profile?.userApiKey) {
      showToast("Masukkan Gemini API Key Anda terlebih dahulu di profil guru.", "error");
      setIsProfileOpen(true);
      throw new Error("API Key Kosong");
    }

    const prompt = `Anda adalah Ahli Kurikulum Merdeka Kemdikbudristek RI. Tuliskan narasi Capaian Pembelajaran (CP) resmi sesuai keputusan BSKAP terbaru untuk Mata Pelajaran: "${formValues.mapel}" pada Fase: "${formValues.fase}" (Kelas ${formValues.kelas}) untuk Semester: "${formValues.semester}". 
    PENTING: Berikan narasi paragraf CP resmi yang utuh, padat, profesional, tanpa embel-embel kalimat pembuka atau penutup.`;

    try {
      const text = await executeAIGenerate(prompt);
      return text.trim();
    } catch (e: any) {
      showToast(e.message || "Gagal men-generate CP. Coba lagi.", "error");
      throw e;
    }
  };

  // AI Generator TP (Tujuan Pembelajaran)
  const handleSuggestTP = async (): Promise<string> => {
    if (!profile?.userApiKey) {
      showToast("Masukkan Gemini API Key Anda terlebih dahulu di profil guru.", "error");
      setIsProfileOpen(true);
      throw new Error("API Key Kosong");
    }

    const prompt = `Berdasarkan Capaian Pembelajaran (CP): "${formValues.cp}" untuk materi: "${formValues.topik}" (${formValues.mapel} Kelas ${formValues.kelas}), rumuskan 2 sampai 3 Tujuan Pembelajaran (TP) yang operasional menggunakan kata kerja taksonomi Bloom hasil revisi yang mendorong Pembelajaran Mendalam (Deep Learning). 
    Tuliskan hasilnya langsung dalam bentuk poin-poin bertanda hubung (-) tanpa teks pengantar tambahan.`;

    try {
      const text = await executeAIGenerate(prompt);
      return text.trim();
    } catch (e: any) {
      showToast(e.message || "Gagal men-generate TP. Coba lagi.", "error");
      throw e;
    }
  };

  // AI Rekomendasi Model, Metode, DPL, dan Karakter
  const handleSuggestMethodology = async (): Promise<{ model: string; metode: string[]; dpl: string[]; nilaiKarakter: string[] }> => {
    if (!profile?.userApiKey) {
      showToast("Masukkan Gemini API Key Anda terlebih dahulu di profil guru.", "error");
      setIsProfileOpen(true);
      throw new Error("API Key Kosong");
    }

    const prompt = `Analisis materi pelajaran ini:
Mata Pelajaran: "${formValues.mapel}"
Materi: "${formValues.topik}"
Tujuan Pembelajaran: "${formValues.tp}"
Kelas: "${formValues.kelas}"

Rekomendasikan komponen pembelajaran berikut yang paling relevan:
1. Model Pembelajaran yang paling cocok (contoh: "Problem Based Learning (PBL)", "Project Based Learning (PjBL)", "Discovery Learning", "Inquiry Learning", "Cooperative Learning", atau "Direct Instruction").
2. Metode Pembelajaran (Pilih mana saja yang PALING cocok dari daftar ini: "Ceramah Interaktif", "Diskusi Kelompok", "Demonstrasi", "Tanya Jawab", "Simulasi", "Studi Kasus", "Observasi", "Mind Mapping", "Gamifikasi", "Observasi Diri dan Lingkungan", "Pengumpulan Data", "Presentasi Proyek").
3. Dimensi Profil Lulusan / DPL (Pilih mana saja yang paling relevan dari daftar ini: "DPL 1", "DPL 2", "DPL 3", "DPL 4", "DPL 5", "DPL 6", "DPL 7", "DPL 8").
4. Integrasi Nilai & Karakter (Pilih mana saja yang paling relevan dari daftar ini: "Tanggung Jawab", "Peduli Diri dan Sesama", "Kritis dan Kreatif", "Kolaborasi", "Komunikatif", "Religius", "Nasionalis", "Mandiri", "Gotong Royong", "Integritas").

Berikan jawaban Anda HANYA berupa JSON murni (tanpa tag markdown \`\`\`json) dengan format objek berikut:
{
  "model": "Nama Model Pembelajaran",
  "metode": ["Nama Metode 1", "Nama Metode 2"],
  "dpl": ["DPL X", "DPL Y"],
  "nilaiKarakter": ["Karakter 1", "Karakter 2"]
}
`;

    try {
      const rawText = await executeAIGenerate(prompt);
      let text = rawText.trim();
      // Bersihkan jika ada penulisan markdown ```json
      text = text.replace(/^```json\n?/gm, "").replace(/^```\n?/gm, "").replace(/```$/gm, "").trim();
      
      const parsed = JSON.parse(text);
      return {
        model: parsed.model || "",
        metode: Array.isArray(parsed.metode) ? parsed.metode : [],
        dpl: Array.isArray(parsed.dpl) ? parsed.dpl : [],
        nilaiKarakter: Array.isArray(parsed.nilaiKarakter) ? parsed.nilaiKarakter : []
      };
    } catch (e: any) {
      showToast("Gagal menyarankan komponen pembelajaran secara cerdas. Menggunakan opsi standar.", "info");
      console.error(e);
      throw e;
    }
  };

  // AI Generator MODUL AJAR (Lengkap berformat Tabel)
  const handleGenerateModul = async (vals: typeof formValues) => {
    if (!profile?.userApiKey) {
      showToast("Masukkan Gemini API Key Anda terlebih dahulu di profil guru.", "error");
      setIsProfileOpen(true);
      return;
    }

    setIsGenerating(true);
    setActiveTab("modul");
    setMobileActiveView("preview");

    const prompt = `Anda adalah Ahli Kurikulum Merdeka Kemdikbudristek RI. Susun Modul Ajar (RPP) lengkap yang mengintegrasikan Pembelajaran Mendalam (Deep Learning) secara lengkap dengan mengikuti FORMAT, URUTAN, dan STRUKTUR di bawah ini dengan sangat presisi.

DATA INPUT:
- Nama Penyusun: ${profile.guru}
- Sekolah: ${profile.sekolah}
- Kepala Sekolah: ${profile.kepsek} (NIP. ${profile.nipKepsek})
- Guru Mapel: ${profile.guru} (NIP. ${profile.nipGuru})
- Tahun Ajaran: ${profile.tahun}
- Mata Pelajaran: ${vals.mapel}
- Fase / Kelas: ${vals.fase} / Kelas ${vals.kelas}
- Semester: ${vals.semester}
- Alokasi Waktu: ${vals.waktu}
- Topik Materi Pokok: ${vals.topik}
- Capaian Pembelajaran (CP): ${vals.cp}
- Tujuan Pembelajaran (TP): ${vals.tp}
- Model Pembelajaran: ${vals.model || "Problem Based Learning (PBL)"}
- Metode Pembelajaran: ${vals.metode && vals.metode.length > 0 ? vals.metode.join(", ") : "Ceramah Interaktif, Diskusi Kelompok, Tanya Jawab"}
- Dimensi Profil Lulusan (DPL) yang Dikembangkan: ${vals.dpl && vals.dpl.length > 0 ? vals.dpl.join(", ") : "DPL 3, DPL 5, DPL 6"}
- Integrasi Nilai & Karakter: ${vals.nilaiKarakter && vals.nilaiKarakter.length > 0 ? vals.nilaiKarakter.join(", ") : "Tanggung Jawab, Gotong Royong, Mandiri"}

TUGAS UTAMA:
Tuliskan dokumen Modul Ajar berformat HTML murni (dimulai dengan <div>, tanpa membungkus dengan tag <html> atau <body>). Gunakan Times New Roman (font-serif) untuk keterbacaan formal cetak/Microsoft Word.

Gunakan struktur persis seperti di bawah ini untuk tampilan layout web dan Word yang sangat rapi dan konsisten:

1. JUDUL & SUBJUDUL (Tengah):
\`\`\`html
<div style="text-align: center; margin-bottom: 20px; border-bottom: 3px solid black; padding-bottom: 10px;">
  <h1 style="font-size: 16pt; font-weight: bold; margin: 0px; text-transform: uppercase;">MODUL AJAR: [MAPEL]</h1>
  <p class="italic">Materi: [TOPIK] - Kelas [KELAS]</p>
</div>
\`\`\`

2. TABEL I (IDENTIFIKASI DASAR HINGGA PROFIL LULUSAN)
Gunakan tag <table> dengan \`<colgroup><col style="width: 30%;"><col style="width: 70%;"></colgroup>\` dan border tipis hitam (border border-black border-collapse) dan margin-bottom: 20px.
Gunakan baris subjudul header dengan background-color spesifik:
- Baris I. IDENTIFIKASI DASAR: \`<tr style="background-color: rgb(226, 232, 240);"><td colspan="2" style="border: 1px solid black; padding: 8px; font-weight: bold;">I. IDENTIFIKASI DASAR</td></tr>\`
  - Lalu baris berikutnya memiliki kolom 1: \`Identitas Umum\` (bold, vertical-align top) dan kolom 2 berisi informasi terformat seperti:
    \`<div><strong>Nama Penyusun:</strong> ${profile.guru}</div>\`
    \`<div><strong>Sekolah:</strong> ${profile.sekolah}</div>\`
    \`<div><strong>Mata Pelajaran:</strong> ${vals.mapel}</div>\`
    \`<div><strong>Materi:</strong> ${vals.topik}</div>\`
    \`<div><strong>Kelas/Fase:</strong> Kelas ${vals.kelas} / ${vals.fase}</div>\`
    \`<div><strong>Semester:</strong> ${vals.semester}</div>\`
    \`<div><strong>Jumlah Pertemuan:</strong> ${vals.waktu}</div>\`
- Baris II. IDENTIFIKASI MURID: \`<tr style="background-color: rgb(219, 234, 254);"><td colspan="2" style="border: 1px solid black; padding: 8px; font-weight: bold;">II. IDENTIFIKASI MURID</td></tr>\`
  - Lalu baris berikutnya untuk tiap aspek murid:
    - Baris 'Aspek Pengetahuan Awal': kolom 1 \`Aspek Pengetahuan Awal\` (bold, vertical-align top, border: 1px solid black), kolom 2 penjelasan.
    - Baris 'Aspek Minat': kolom 1 \`Aspek Minat\`, kolom 2 penjelasan.
    - Baris 'Aspek Latar Belakang': kolom 1 \`Aspek Latar Belakang\`, kolom 2 penjelasan.
    - Baris 'Aspek Kebutuhan Belajar': kolom 1 \`Aspek Kebutuhan Belajar\`, kolom 2 penjelasan.
- Baris III. JENIS PENGETAHUAN MATERI: \`<tr style="background-color: rgb(209, 250, 229);"><td colspan="2" style="border: 1px solid black; padding: 8px; font-weight: bold;">III. JENIS PENGETAHUAN MATERI</td></tr>\`
  - Lalu baris berikutnya:
    - Baris 'Faktual': kolom 1 \`Faktual\`, kolom 2 penjelasan.
    - Baris 'Konseptual': kolom 1 \`Konseptual\`, kolom 2 penjelasan.
    - Baris 'Prosedural': kolom 1 \`Prosedural\`, kolom 2 penjelasan.
    - Baris 'Metakognitif': kolom 1 \`Metakognitif\`, kolom 2 penjelasan.
    - Baris 'Kaitan dengan Kehidupan': kolom 1 \`Kaitan dengan Kehidupan\`, kolom 2 penjelasan.
- Baris IV. INTEGRASI NILAI & KARAKTER: \`<tr style="background-color: rgb(254, 243, 199);"><td colspan="2" style="border: 1px solid black; padding: 8px; font-weight: bold;">IV. INTEGRASI NILAI & KARAKTER</td></tr>\`
  - Lalu baris berikutnya: kolom 1 \`Nilai Karakter\`, kolom 2 berisi daftar nilai karakter yang dikembangkan: ${vals.nilaiKarakter && vals.nilaiKarakter.length > 0 ? vals.nilaiKarakter.join(", ") : "Tanggung Jawab, Gotong Royong, Mandiri"} beserta rincian penjelasannya.
- Baris V. DIMENSI PROFIL LULUSAN: \`<tr style="background-color: rgb(224, 231, 255);"><td colspan="2" style="border: 1px solid black; padding: 8px; font-weight: bold;">V. DIMENSI PROFIL LULUSAN</td></tr>\`
  - Lalu baris berikutnya: kolom 1 \`DPL yang Dikembangkan\`, kolom 2 dengan bullet list rincian dimensi profil lulusan yang dikembangkan: ${vals.dpl && vals.dpl.length > 0 ? vals.dpl.join(", ") : "DPL 3, DPL 5, DPL 6"}.

3. TABEL II (DESAIN PEMBELAJARAN HINGGA PEMANFAATAN DIGITAL)
Gunakan tag <table> kedua dengan \`<colgroup><col style="width: 30%;"><col style="width: 70%;"></colgroup>\` dan border tipis hitam (border border-black border-collapse) dan margin-bottom: 20px.
Gunakan baris subjudul header dengan background-color spesifik:
- Baris VI. DESAIN PEMBELAJARAN: \`<tr style="background-color: rgb(226, 232, 240);"><td colspan="2" style="border: 1px solid black; padding: 8px; font-weight: bold;">VI. DESAIN PEMBELAJARAN</td></tr>\`
  - Baris 'Capaian Pembelajaran': kolom 1 \`Capaian Pembelajaran\`, kolom 2 berisi isi CP dari input.
  - Baris 'Tujuan Pembelajaran': kolom 1 \`Tujuan Pembelajaran\`, kolom 2 berisi isi TP dari input.
  - Baris 'Pemahaman Bermakna': kolom 1 \`Pemahaman Bermakna\`, kolom 2 penjelasan esensial.
  - Baris 'Model Pembelajaran': kolom 1 \`Model Pembelajaran\`, kolom 2 berisi \`${vals.model || "Problem Based Learning (PBL)"}\`.
  - Baris 'Metode Pembelajaran': kolom 1 \`Metode Pembelajaran\`, kolom 2 berisi daftar metode yang digunakan: ${vals.metode && vals.metode.length > 0 ? vals.metode.join(", ") : "Ceramah Interaktif, Diskusi Kelompok, Tanya Jawab"}.
- Baris VII. LINTAS DISIPLIN ILMU: \`<tr style="background-color: rgb(240, 253, 244);"><td colspan="2" style="border: 1px solid black; padding: 8px; font-weight: bold;">VII. LINTAS DISIPLIN ILMU</td></tr>\`
  - Baris 'PPKn', 'IPS', 'Matematika', 'Bahasa Indonesia'.
- Baris VIII. KEMITRAAN PEMBELAJARAN: \`<tr style="background-color: rgb(252, 231, 243);"><td colspan="2" style="border: 1px solid black; padding: 8px; font-weight: bold;">VIII. KEMITRAAN PEMBELAJARAN</td></tr>\`
  - Baris 'Guru Bidang Studi Lain', 'Orang Tua', 'Instansi Terkait'.
- Baris IX. LINGKUNGAN PEMBELAJARAN: \`<tr style="background-color: rgb(207, 250, 254);"><td colspan="2" style="border: 1px solid black; padding: 8px; font-weight: bold;">IX. LINGKUNGAN PEMBELAJARAN</td></tr>\`
  - Baris 'Ruang Fisik', 'Ruang Virtual', 'Budaya Belajar'.
- Baris X. PEMANFAATAN DIGITAL: \`<tr style="background-color: rgb(237, 233, 254);"><td colspan="2" style="border: 1px solid black; padding: 8px; font-weight: bold;">X. PEMANFAATAN DIGITAL</td></tr>\`
  - Baris 'Perencanaan', 'Pelaksanaan', 'Asesmen'.

4. SEKSI XI. PENGALAMAN BELAJAR (LANGKAH PEMBELAJARAN)
- Tampilkan judul seksi: \`<div style="background-color: rgb(226, 232, 240); padding: 8px; font-weight: bold; margin-bottom: 16px; border: 1px solid black;">XI. PENGALAMAN BELAJAR (LANGKAH PEMBELAJARAN)</div>\`
- Tampilkan status box: \`<div class="no-print" style="margin-bottom: 12px; padding: 8px 12px; background-color: rgb(220, 252, 231); border: 1px solid rgb(22, 163, 74); border-radius: 4px; font-size: 0.9em; font-weight: 600;">Status: 2 dari 2 pertemuan selesai</div>\`
- Buat sebuah tabel ketiga dengan: \`<table style="width: 100%; border-collapse: collapse; border: 1px solid black; table-layout: fixed;">\`
  \`<colgroup><col style="width: 18%;"><col style="width: 67%;"><col style="width: 15%;"></colgroup>\`
  - Baris sub-header: \`<tr style="background-color: rgb(241, 245, 249); text-align: center;"><th style="border: 1px solid black; padding: 6px;">TAHAP</th><th style="border: 1px solid black; padding: 6px;">KEGIATAN & PRINSIP</th><th style="border: 1px solid black; padding: 6px;">DURASI</th></tr>\`
  - Baris PERTEMUAN 1: \`<tr style="background-color: rgb(199, 210, 254);"><td colspan="3" style="border: 1px solid black; padding: 8px; font-weight: bold; text-align: center;">PERTEMUAN 1 (40 Menit)</td></tr>\`
  - Baris Pendahuluan:
    - Kolom 1 (rowspan="2", background-color \`rgb(219, 234, 254)\`, bold, center, top): \`Pendahuluan\`
    - Kolom 2:
      \`<strong>Orientasi</strong>\`
      \`<ul style="margin-left: 12px; list-style-type: disc;">...</ul>\`
      \`<div style="color: rgb(107, 114, 128); background-color: rgb(243, 244, 246); font-size: 0.85em; margin-top: 8px; padding: 2px 8px; border-radius: 4px; display: inline-block; font-weight: 500;">★ Membangun kesadaran (Mindful)</div>\`
    - Kolom 3: \`2 menit\`
  - Baris Pendahuluan Part 2 (Apersepsi & Motivasi):
    - Kolom 2:
      \`<strong>Apersepsi & Motivasi</strong>\`
      \`<ul>...</ul>\`
      \`💡 Pertanyaan Pemantik box dengan warna background kuning soft\`
      \`★ Bermakna (Meaningful), Menggembirakan (Joyful) tag\`
    - Kolom 3: \`3 menit\`
  - Baris TAHAP INTI - INTI: \`<tr style="background-color: rgb(209, 250, 229);"><td colspan="3" style="border: 1px solid black; padding: 8px; font-weight: bold; text-align: center;">TAHAP INTI - INTI<span style="font-weight: normal; margin-left: 8px; font-style: italic;">(Model: ${vals.model || "Problem Based Learning (PBL)"})</span></td></tr>\`
  - Baris FASE Header: \`<tr style="background-color: rgb(241, 245, 249);"><th style="border: 1px solid black; padding: 6px; width: 15%;">FASE</th><th style="border: 1px solid black; padding: 6px;">KEGIATAN & PRINSIP</th><th style="border: 1px solid black; padding: 6px; width: 10%;">DURASI</th></tr>\`
  - Baris FASE MEMAHAMI:
    - Kolom 1: (rowspan="2", background-color \`rgb(209, 250, 229)\`, vertical-align: top, text-align: center): \`🔍 MEMAHAMI (10 menit)\`
    - Kolom 2 (Orientasi): \`<strong>Orientasi Peserta Didik pada Masalah</strong>\`, with list, Pertanyaan Pemantik, and tag.
    - Kolom 3: \`5 menit\`
  - Baris FASE MEMAHAMI Part 2:
    - Kolom 2 (Mengorganisasikan): \`<strong>Mengorganisasikan Peserta Didik untuk Belajar</strong>\`, list, and tag.
    - Kolom 3: \`5 menit\`
  - Baris FASE MENGAPLIKASI:
    - Kolom 1 (rowspan="2", background-color \`rgb(254, 243, 199)\`, top, center): \`🛠️ MENGAPLIKASI (15 menit)\`
    - Kolom 2 (Membimbing): \`<strong>Membimbing Penyelidikan Individual/Kelompok</strong>\` with list, Pertanyaan Pemantik, and tag.
    - Kolom 3: \`10 menit\`
  - Baris FASE MENGAPLIKASI Part 2:
    - Kolom 2 (Mengembangkan): \`<strong>Mengembangkan dan Menyajikan Hasil Karya</strong>\` list, and tag.
    - Kolom 3: \`5 menit\`
  - Baris FASE MEREFLEKSI:
    - Kolom 1 (rowspan="1", background-color \`rgb(219, 234, 254)\`, top, center): \`💭 MEREFLEKSI (5 menit)\`
    - Kolom 2 (Mengevaluasi): \`<strong>Menganalisis dan Mengevaluasi Proses Pemecahan Masalah</strong>\` with list, Pertanyaan Pemantik, and tag.
    - Kolom 3: \`5 menit\`
  - Baris Penutup:
    - Kolom 1 (rowspan="2", background-color \`rgb(254, 243, 199)\`, top, center): \`Penutup\`
    - Kolom 2 (Refleksi): \`<strong>Refleksi Individu & Kesimpulan Bersama</strong>\` list, tag.
    - Kolom 3: \`3 menit\`
  - Baris Penutup Part 2:
    - Kolom 2 (Apresiasi): \`<strong>Apresiasi & Doa Penutup</strong>\` list, tag.
    - Kolom 3: \`2 menit\`

- Buat baris serupa untuk PERTEMUAN 2 (dengan durasi total yang sesuai, misal 200 menit, sesuaikan waktu di masing-masing sub-langkah secara logis).

Atas pengesahan tanda tangan di bagian paling bawah:
\`\`\`html
<table class="border-0" style="width: 100%; border-style: none; margin-top: 50px;">
  <tbody>
    <tr>
      <td style="width: 50%; text-align: center; vertical-align: top; border: none;">
        Mengetahui,<br>Kepala Sekolah<br><br><br><br><strong>${profile.kepsek}</strong><br><span style="font-size: 10pt;">NIP. ${profile.nipKepsek}</span>
      </td>
      <td style="width: 50%; text-align: center; vertical-align: top; border: none;">
        Guru Mata Pelajaran<br><br><br><br><strong>${profile.guru}</strong><br><span style="font-size: 10pt;">NIP. ${profile.nipGuru}</span>
      </td>
    </tr>
  </tbody>
</table>
\`\`\`

PERHATIAN STYLING:
Gunakan CSS Tailwind bawaan yang ramah cetak (text-black, font-serif, border-black untuk tabel). Pastikan semua teks rapi, terformat, mudah dipahami, tanpa menggunakan markup markdown \`\`\`html di luar. Berikan respon HANYA dalam format kode HTML murni di dalam pembungkus <div>.`;

    try {
      const text = await executeAIGenerate(prompt);
      let cleanHtml = text;
      
      // Bersihkan sisa-sisa markdown block jika model tetap menyertakannya
      cleanHtml = cleanHtml.replace(/^```html\n?/gm, "").replace(/^```\n?/gm, "").replace(/```$/gm, "").trim();

      const newRecord: ModulRecord = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        kelas: vals.kelas,
        fase: vals.fase,
        semester: vals.semester,
        mapel: vals.mapel,
        topik: vals.topik,
        cp: vals.cp,
        tp: vals.tp,
        waktu: vals.waktu,
        modulHtml: cleanHtml
      };

      // Simpan ke server
      try {
        const saveResponse = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newRecord)
        });
        const contentType = saveResponse.headers.get("Content-Type") || "";
        if (saveResponse.ok && contentType.includes("application/json")) {
          const savedData = await saveResponse.json();
          setHistory((prev) => [savedData, ...prev]);
          setActiveRecord(savedData);
        } else {
          throw new Error();
        }
      } catch {
        // Fallback simpan lokal
        const updated = [newRecord, ...history];
        setHistory(updated);
        localStorage.setItem("modulHistory", JSON.stringify(updated));
        setActiveRecord(newRecord);
      }

      showToast("Modul Ajar berhasil di-generate secara lengkap!", "success");
    } catch (e: any) {
      showToast(e.message || "Gagal generate Modul. Silakan coba lagi.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Generator LKPD (Asinkron)
  const handleGenerateLKPD = async () => {
    if (!activeRecord) {
      showToast("Buat atau pilih Modul Ajar terlebih dahulu.", "error");
      return;
    }
    if (!profile?.userApiKey) {
      showToast("Masukkan Gemini API Key Anda di profil guru.", "error");
      setIsProfileOpen(true);
      return;
    }

    setLkpdGenerating(true);
    setMobileActiveView("preview");

    const prompt = `Anda adalah Ahli Kurikulum Merdeka Kemdikbudristek RI. Susun Lembar Kerja Peserta Didik (LKPD) yang kreatif, interaktif, dan berorientasi pada Pembelajaran Mendalam (Deep Learning) / Problem Based Learning (PBL) berdasarkan data berikut:
    - Mata Pelajaran: ${activeRecord.mapel}
    - Kelas: ${activeRecord.kelas}
    - Topik Materi Pokok: ${activeRecord.topik}
    - Tujuan Pembelajaran (TP): ${activeRecord.tp}

    TUGAS UTAMA:
    Tuliskan LKPD berformat HTML murni (dimulai dengan <div>, tanpa membungkus dengan tag <html> atau <body>). Gunakan Times New Roman (font-serif) untuk keterbacaan formal cetak/Microsoft Word.

    Anda WAJIB mengikuti STRUKTUR DAN FORMAT HTML di bawah ini secara persis:

    1. HEADER LKPD:
    \`\`\`html
    <div style="text-align: center; margin-bottom: 20px; border-bottom: 3px solid black; padding-bottom: 10px;">
      <h1 style="font-size: 14pt; font-weight: bold; margin: 0px; text-transform: uppercase;">LEMBAR KERJA PESERTA DIDIK (LKPD)</h1>
      <p style="font-size: 10pt; margin: 4px 0;">Mata Pelajaran: ${activeRecord.mapel} | Kelas: ${activeRecord.kelas}</p>
      <p style="font-size: 10pt; margin: 4px 0; font-weight: bold;">Materi Pokok: ${activeRecord.topik}</p>
    </div>
    \`\`\`

    2. IDENTITAS KELOMPOK:
    \`\`\`html
    <div style="margin-bottom: 20px; font-size: 10pt;">
      <div style="margin-bottom: 6px;">Kelompok ......................................................................................</div>
      <div>Anggota Kelompok</div>
      <ol style="margin-left: 20px; margin-top: 4px; list-style-type: decimal;">
        <li>.............................................................</li>
        <li>.............................................................</li>
        <li>.............................................................</li>
        <li>.............................................................</li>
      </ol>
    </div>
    \`\`\`

    3. SEKSI A. TUJUAN KEGIATAN:
    Sebutkan minimal 3-4 tujuan kegiatan pembelajaran secara rinci, terukur, dan operasional relevan dengan topik "${activeRecord.topik}" dan TP "${activeRecord.tp}". Gunakan format tag \`<ul style="margin-left: 20px; list-style-type: disc;">\` dan \`<li>\`.

    4. SEKSI B. STIMULUS / ORIENTASI MASALAH:
    Sajikan suatu kasus cerita nyata (studi kasus) atau fenomena sehari-hari yang sangat menarik, kontekstual, menantang, dan relevan dengan materi agar memicu rasa ingin tahu siswa secara mendalam.
    Format:
    \`\`\`html
    <p style="font-weight: bold; margin-bottom: 4px;">Kasus: "[Judul Kasus Menarik]"</p>
    <p style="text-align: justify; line-height: 1.5; margin-bottom: 10px;">[Isi Kasus/Cerita Stimulus Lengkap]</p>
    \`\`\`

    5. SEKSI C. ALAT, BAHAN & LANGKAH KERJA:
    Tuliskan daftar Alat & Bahan yang masuk akal dan relevan, lalu Langkah Kerja yang terperinci (3-5 langkah). Gunakan tag \`<ul>\` atau \`<ol>\` dengan margin kiri 20px.

    6. SEKSI D. HASIL PENGAMATAN / DISKUSI:
    Sajikan petunjuk persis:
    \`<p style="font-style: italic; margin-bottom: 8px;">Tulislah hasil pengamatan atau diskusi kelompokmu pada tabel/kolom di bawah ini!</p>\`
    Buatlah tabel dengan style border hitam tipis:
    \`\`\`html
    <table style="width: 100%; border-collapse: collapse; border: 1px solid black; margin-top: 10px;">
      <thead>
        <tr style="background-color: rgb(241, 245, 249);">
          <th style="border: 1px solid black; padding: 8px; width: 8%; text-align: center;">No.</th>
          <th style="border: 1px solid black; padding: 8px; width: 42%; text-align: left;">Aspek yang Diamati/Didiskusikan</th>
          <th style="border: 1px solid black; padding: 8px; width: 50%; text-align: left;">Hasil / Jawaban</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 1px solid black; padding: 8px; text-align: center; vertical-align: top;">1</td>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top;">[Pertanyaan Diskusi Kritis & Analitis 1 berdasarkan kasus stimulus]</td>
          <td style="border: 1px solid black; padding: 8px; height: 110px; vertical-align: top; background-color: rgb(253, 253, 253);"></td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; text-align: center; vertical-align: top;">2</td>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top;">[Pertanyaan Diskusi Kritis & Analitis 2 berdasarkan kasus stimulus]</td>
          <td style="border: 1px solid black; padding: 8px; height: 110px; vertical-align: top; background-color: rgb(253, 253, 253);"></td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; text-align: center; vertical-align: top;">3</td>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top;">[Pertanyaan Diskusi Kritis & Analitis 3 berdasarkan kasus stimulus]</td>
          <td style="border: 1px solid black; padding: 8px; height: 110px; vertical-align: top; background-color: rgb(253, 253, 253);"></td>
        </tr>
      </tbody>
    </table>
    \`\`\`

    7. SEKSI E. KESIMPULAN:
    Sajikan petunjuk:
    \`<p style="font-style: italic; margin-bottom: 8px;">Berdasarkan kegiatan yang telah dilakukan, apa yang dapat kelompokmu simpulkan?</p>\`
    Lalu berikan box kosong bergaris untuk menulis kesimpulan siswa:
    \`<div style="border: 1px solid black; min-height: 120px; padding: 10px; background-color: rgb(253, 253, 253); margin-top: 6px;"></div>\`

    8. POJOK KANAN BAWAH (Nilai / Paraf Guru):
    \`\`\`html
    <div style="text-align: right; margin-top: 30px; font-size: 11pt; font-weight: bold;">
      Nilai / Paraf Guru: ........................................
    </div>
    \`\`\`

    PERHATIAN STYLING:
    Gunakan CSS Tailwind bawaan yang ramah cetak (text-black, font-serif, border-black untuk tabel). Pastikan semua teks rapi, terformat, mudah dipahami, tanpa menggunakan markup markdown \`\`\`html di luar. Berikan respon HANYA dalam format kode HTML murni di dalam pembungkus <div>.`;

    try {
      const text = await executeAIGenerate(prompt);
      let cleanHtml = text;
      
      // Bersihkan sisa-sisa markdown block
      cleanHtml = cleanHtml.replace(/^```html\n?/gm, "").replace(/^```\n?/gm, "").replace(/```$/gm, "").trim();

      const updatedRecord = {
        ...activeRecord,
        lkpdHtml: cleanHtml
      };

      // Simpan pembaruan ke server
      try {
        const updateResponse = await fetch(`/api/history/${activeRecord.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lkpdHtml: cleanHtml })
        });
        const contentType = updateResponse.headers.get("Content-Type") || "";
        if (updateResponse.ok && contentType.includes("application/json")) {
          const updatedData = await updateResponse.json();
          setHistory((prev) => prev.map((item) => (item.id === activeRecord.id ? updatedData : item)));
          setActiveRecord(updatedData);
        } else {
          throw new Error();
        }
      } catch {
        // Fallback update lokal
        const updatedHistory = history.map((item) => (item.id === activeRecord.id ? updatedRecord : item));
        setHistory(updatedHistory);
        localStorage.setItem("modulHistory", JSON.stringify(updatedHistory));
        setActiveRecord(updatedRecord);
      }

      showToast("LKPD Siswa berhasil disusun oleh AI!", "success");
    } catch (e: any) {
      showToast(e.message || "Gagal generate LKPD. Silakan coba lagi.", "error");
    } finally {
      setLkpdGenerating(false);
    }
  };

  // AI Generator ASESMEN (Asinkron)
  const handleGenerateAsesmen = async () => {
    if (!activeRecord) {
      showToast("Buat atau pilih Modul Ajar terlebih dahulu.", "error");
      return;
    }
    if (!profile?.userApiKey) {
      showToast("Masukkan Gemini API Key Anda di profil guru.", "error");
      setIsProfileOpen(true);
      return;
    }

    setAsesmenGenerating(true);
    setMobileActiveView("preview");

    const prompt = `Anda adalah Ahli Kurikulum Merdeka Kemdikbudristek RI. Susun Instrumen Asesmen Pembelajaran yang kreatif, interaktif, dan berorientasi pada Pembelajaran Mendalam (Deep Learning) berdasarkan data berikut:
    - Mata Pelajaran: ${activeRecord.mapel}
    - Kelas: ${activeRecord.kelas}
    - Topik Materi Pokok: ${activeRecord.topik}
    - Tujuan Pembelajaran (TP): ${activeRecord.tp}
    - Model Pembelajaran: ${activeRecord.model || "Problem Based Learning (PBL)"}
    - Metode Pembelajaran: ${activeRecord.metode && activeRecord.metode.length > 0 ? activeRecord.metode.join(", ") : "Ceramah Interaktif, Diskusi Kelompok, Tanya Jawab"}

    TUGAS UTAMA:
    Tuliskan Instrumen Asesmen Pembelajaran berformat HTML murni (dimulai dengan <div>, tanpa membungkus dengan tag <html> atau <body>). Gunakan Times New Roman (font-serif) untuk keterbacaan formal cetak/Microsoft Word.

    Anda WAJIB mengikuti STRUKTUR DAN FORMAT HTML di bawah ini secara persis, disesuaikan dengan topik "${activeRecord.topik}" dan TP "${activeRecord.tp}":

    1. HEADER ASESMEN:
    \`\`\`html
    <div style="text-align: center; margin-bottom: 20px; border-bottom: 3px solid black; padding-bottom: 10px;">
      <h1 style="font-size: 14pt; font-weight: bold; margin: 0px; text-transform: uppercase;">INSTRUMEN ASESMEN PEMBELAJARAN</h1>
      <p style="font-size: 10pt; margin: 4px 0;">Mata Pelajaran: ${activeRecord.mapel} | Kelas: ${activeRecord.kelas}</p>
      <p style="font-size: 10pt; margin: 4px 0; font-weight: bold;">Materi Pokok: ${activeRecord.topik}</p>
    </div>
    \`\`\`

    2. SEKSI A. ASESMEN AWAL PEMBELAJARAN (Diagnostik)
    Jelaskan tujuan asesmen awal ini secara kontekstual untuk topik "${activeRecord.topik}".
    Metode: Pertanyaan Lisan
    Sajikan tabel berisi 3 pertanyaan pemantik kritis yang relevan dengan topik "${activeRecord.topik}" beserta tujuannya masing-masing.
    Gunakan format tabel:
    - Kolom No (lebar 10%), Pertanyaan Pemantik (lebar 45%), Tujuan (lebar 45%).
    - Border hitam tipis (border: 1px solid black; border-collapse: collapse;).
    - Beri style header kolom berwarna background abu-abu soft (background-color: rgb(241, 245, 249)).

    3. SEKSI B. ASESMEN PROSES PEMBELAJARAN (Formatif)
    Jelaskan tujuan asesmen proses pembelajaran (formatif) untuk memantau kemajuan peserta didik tentang "${activeRecord.topik}" menggunakan metode: Observasi, Penilaian Kinerja, atau Diskusi Kelompok (sesuaikan dengan metode pembelajaran terpilih: ${activeRecord.metode && activeRecord.metode.length > 0 ? activeRecord.metode.join(", ") : "Diskusi Kelompok"}).
    
    Aktivitas 1: [Nama Aktivitas Menarik yang Relevan, misal: Jelajah Keanekaragaman di Sekolah untuk materi IPA, atau aktivitas kognitif/psikomotorik yang sesuai materi]
    Instruksi: Berikan instruksi kerja kelompok yang detail dan menantang (seperti mencari objek di sekolah, berdiskusi, menganalisis, dsb., sesuaikan durasi misalnya 20 menit).
    Pertanyaan Diskusi: Berikan minimal 5 pertanyaan diskusi kelompok yang mendalam, menantang (Higher Order Thinking Skills / HOTS), dan kritis berdasarkan aktivitas tersebut.
    Kunci Jawaban: Sediakan penjelasan kunci jawaban atau panduan jawaban yang komprehensif bagi guru untuk 5 pertanyaan diskusi tersebut.

    Rubrik Penilaian Proses:
    Sajikan tabel rubrik penilaian proses dengan 4 aspek penilaian yang relevan (misalnya: Kemampuan Mengidentifikasi Ciri-ciri/Materi, Kemampuan Mengklasifikasikan/Menganalisis, Partisipasi/Kerjasama Kelompok, Ketelitian Pengamatan/Kualitas Hasil).
    Tabel berisi kolom: Aspek, Sangat Baik (4), Baik (3), Cukup (2), Kurang (1).
    Rincikan kriteria masing-masing skor (4, 3, 2, 1) dengan kalimat deskriptif yang jelas dan bertingkat.
    Gunakan border hitam tipis dan warna background header yang rapi.

    📝 Penilaian Diri:
    Sediakan 4 pertanyaan refleksi penilaian diri (self-assessment) untuk siswa dalam bentuk list/pertanyaan reflektif.
    
    👥 Penilaian Sejawat:
    Sediakan 4 indikator penilaian sejawat (peer-assessment) untuk mengevaluasi partisipasi teman dalam kerja kelompok.

    4. SEKSI C. ASESMEN AKHIR PEMBELAJARAN (Sumatif)
    Jelaskan tujuan asesmen akhir pembelajaran (sumatif) untuk mengukur ketercapaian TP secara keseluruhan pada materi "${activeRecord.topik}".
    Metode: Tes Tertulis Uraian
    Soal Uraian: Sediakan minimal 4 soal uraian HOTS yang sangat relevan dengan materi "${activeRecord.topik}".
    Sajikan dalam bentuk tabel berisi kolom: No, Pertanyaan, Kunci Jawaban, Skor.
    - Soal 1: Pemahaman konsep dan alasan pentingnya (Skor 20).
    - Soal 2: Analisis kasus atau gambar hipotetis terkait materi (Skor 30).
    - Soal 3: Studi kasus imajinatif/kontekstual yang melatih kemampuan klasifikasi/pemecahan masalah (Skor 25).
    - Soal 4: Peran teknologi/alat bantu atau analisis mendalam terkait materi (Skor 25).
    Setiap baris tabel harus memiliki pertanyaan yang detail, kunci jawaban ilmiah yang komprehensif, dan skor yang tertera di kolomnya.

    Rubrik Penilaian Akhir:
    Sajikan tabel rubrik penilaian akhir untuk tes uraian tersebut dengan 4 aspek penilaian (misalnya: Pemahaman Konsep, Kemampuan Mengidentifikasi/Menjelaskan Ciri, Kemampuan Mengklasifikasikan/Analisis, Kesesuaian Jawaban dengan Konteks).
    Kolom: Aspek, Sangat Baik (4), Baik (3), Cukup (2), Kurang (1). Rincikan kriteria bertingkat dengan deskripsi yang sangat profesional dan akademis.

    Pedoman Penskoran:
    Cantumkan:
    Skor Total: 100
    Rumus Nilai: (Skor Perolehan / Skor Maksimal) x 100
    Lalu berikan tempat untuk Nilai/Paraf Guru di akhir dokumen.

    PERHATIAN STYLING:
    Gunakan CSS Tailwind bawaan atau style inline standar yang ramah cetak (text-black, font-serif, border-black untuk tabel). Pastikan semua teks rapi, terformat, mudah dipahami, tanpa menggunakan markup markdown \`\`\`html di luar. Berikan respon HANYA dalam format kode HTML murni di dalam pembungkus <div>.`;

    try {
      const text = await executeAIGenerate(prompt);
      let cleanHtml = text;
      
      // Bersihkan sisa-sisa markdown block
      cleanHtml = cleanHtml.replace(/^```html\n?/gm, "").replace(/^```\n?/gm, "").replace(/```$/gm, "").trim();

      const updatedRecord = {
        ...activeRecord,
        asesmenHtml: cleanHtml
      };

      // Simpan pembaruan ke server
      try {
        const updateResponse = await fetch(`/api/history/${activeRecord.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ asesmenHtml: cleanHtml })
        });
        const contentType = updateResponse.headers.get("Content-Type") || "";
        if (updateResponse.ok && contentType.includes("application/json")) {
          const updatedData = await updateResponse.json();
          setHistory((prev) => prev.map((item) => (item.id === activeRecord.id ? updatedData : item)));
          setActiveRecord(updatedData);
        } else {
          throw new Error();
        }
      } catch {
        // Fallback update lokal
        const updatedHistory = history.map((item) => (item.id === activeRecord.id ? updatedRecord : item));
        setHistory(updatedHistory);
        localStorage.setItem("modulHistory", JSON.stringify(updatedHistory));
        setActiveRecord(updatedRecord);
      }

      showToast("Instrumen Asesmen Pembelajaran berhasil disusun oleh AI!", "success");
    } catch (e: any) {
      showToast(e.message || "Gagal generate Asesmen. Silakan coba lagi.", "error");
    } finally {
      setAsesmenGenerating(false);
    }
  };

  // AI Generator MATERI (Asinkron)
  const handleGenerateMateri = async () => {
    if (!activeRecord) {
      showToast("Buat atau pilih Modul Ajar terlebih dahulu.", "error");
      return;
    }
    if (!profile?.userApiKey) {
      showToast("Masukkan Gemini API Key Anda di profil guru.", "error");
      setIsProfileOpen(true);
      return;
    }

    setMateriGenerating(true);
    setMobileActiveView("preview");

    const prompt = `Anda adalah Ahli Kurikulum Merdeka Kemdikbudristek RI. Susun Bahan Ajar / Materi Pembelajaran (Materi Utama) yang sangat komprehensif, mendalam (Deep Learning), terstruktur, dan ramah dibaca untuk siswa berdasarkan data berikut:
    - Mata Pelajaran: ${activeRecord.mapel}
    - Kelas: ${activeRecord.kelas}
    - Topik Materi Pokok: ${activeRecord.topik}
    - Tujuan Pembelajaran (TP): ${activeRecord.tp}
    - Model Pembelajaran: ${activeRecord.model || "Problem Based Learning (PBL)"}
    - Metode Pembelajaran: ${activeRecord.metode && activeRecord.metode.length > 0 ? activeRecord.metode.join(", ") : "Ceramah Interaktif, Diskusi Kelompok, Tanya Jawab"}

    TUGAS UTAMA:
    Tuliskan Bahan Ajar / Materi Pembelajaran yang lengkap, edukatif, dan menarik berformat HTML murni (dimulai dengan <div>, tanpa membungkus dengan tag <html> atau <body>). Gunakan Times New Roman (font-serif) untuk keterbacaan formal cetak/Microsoft Word.

    Anda WAJIB mengikuti STRUKTUR DAN FORMAT HTML di bawah ini secara persis, disesuaikan dengan topik "${activeRecord.topik}" dan TP "${activeRecord.tp}":

    1. HEADER MATERI:
    \`\`\`html
    <div style="text-align: center; margin-bottom: 25px; border-bottom: 3px solid black; padding-bottom: 10px;">
      <h1 style="font-size: 16pt; font-weight: bold; margin: 0px; text-transform: uppercase;">BAHAN AJAR / MATERI PEMBELAJARAN</h1>
      <p style="font-size: 10pt; margin: 4px 0;">Mata Pelajaran: ${activeRecord.mapel} | Kelas: ${activeRecord.kelas} | Semester: ${activeRecord.semester || "Ganjil"}</p>
      <p style="font-size: 11pt; margin: 4px 0; font-weight: bold;">Materi: ${activeRecord.topik}</p>
    </div>
    \`\`\`

    2. PENDAHULUAN & MOTIVASI (APERSEPSI):
    - Tulis 1-2 paragraf pembuka yang menarik minat baca siswa, mengaitkan topik "${activeRecord.topik}" dengan fenomena kehidupan sehari-hari (kontekstual).
    - Berikan 1 kotak "Tahukah Kamu?" yang mencolok (misal: background-color: rgb(239, 246, 255); border-left: 4px solid rgb(59, 130, 246); padding: 10px; margin-bottom: 15px; font-style: italic;) berisi fakta unik berkaitan dengan materi tersebut.

    3. MATERI UTAMA / INTI:
    - Jabarkan konsep-konsep kunci secara mendalam (Deep Learning), bukan sekadar definisi singkat.
    - Gunakan sub-heading (h2, h3) yang rapi dengan penomoran yang sistematis.
    - Sertakan tabel perbandingan atau rangkuman jika relevan agar mudah dipelajari.
    - Gunakan daftar berpoin (ul/li) atau daftar bernomor (ol/li) untuk merinci penjelasan konsep.
    - Highlight istilah-istilah penting dengan huruf tebal (bold).

    4. CONTOH KASUS / APLIKASI NYATA:
    - Berikan minimal 1 contoh kasus konkret, eksperimen sederhana, atau aplikasi nyata dari topik "${activeRecord.topik}" di dunia nyata agar siswa memahami kemanfaatan ilmu tersebut.

    5. RANGKUMAN MATERI:
    - Sediakan kotak rangkuman (background-color: rgb(240, 253, 244); border: 1px solid rgb(74, 222, 128); padding: 15px; margin-top: 20px; border-radius: 6px;) berisi 5-6 poin penting dari materi yang telah dijabarkan.

    6. GLOSARIUM MINI:
    - Berikan daftar istilah penting beserta definisinya secara ringkas di akhir materi.

    PERHATIAN STYLING:
    Gunakan CSS Tailwind bawaan atau style inline standar yang ramah cetak (text-black, font-serif, border-black untuk tabel). Pastikan semua teks rapi, terformat, mudah dipahami, tanpa menggunakan markup markdown \`\`\`html di luar. Berikan respon HANYA dalam format kode HTML murni di dalam pembungkus <div>.`;

    try {
      const text = await executeAIGenerate(prompt);
      let cleanHtml = text;
      
      // Bersihkan sisa-sisa markdown block
      cleanHtml = cleanHtml.replace(/^```html\n?/gm, "").replace(/^```\n?/gm, "").replace(/```$/gm, "").trim();

      const updatedRecord = {
        ...activeRecord,
        materiHtml: cleanHtml
      };

      // Simpan pembaruan ke server
      try {
        const updateResponse = await fetch(`/api/history/${activeRecord.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materiHtml: cleanHtml })
        });
        const contentType = updateResponse.headers.get("Content-Type") || "";
        if (updateResponse.ok && contentType.includes("application/json")) {
          const updatedData = await updateResponse.json();
          setHistory((prev) => prev.map((item) => (item.id === activeRecord.id ? updatedData : item)));
          setActiveRecord(updatedData);
        } else {
          throw new Error();
        }
      } catch {
        // Fallback update lokal
        const updatedHistory = history.map((item) => (item.id === activeRecord.id ? updatedRecord : item));
        setHistory(updatedHistory);
        localStorage.setItem("modulHistory", JSON.stringify(updatedHistory));
        setActiveRecord(updatedRecord);
      }

      showToast("Materi Pembelajaran berhasil disusun oleh AI!", "success");
    } catch (e: any) {
      showToast(e.message || "Gagal generate Materi. Silakan coba lagi.", "error");
    } finally {
      setMateriGenerating(false);
    }
  };

  // AI Generator REFLEKSI & TINDAK LANJUT (Asinkron)
  const handleGenerateRefleksi = async () => {
    if (!activeRecord) {
      showToast("Buat atau pilih Modul Ajar terlebih dahulu.", "error");
      return;
    }
    if (!profile?.userApiKey) {
      showToast("Masukkan Gemini API Key Anda di profil guru.", "error");
      setIsProfileOpen(true);
      return;
    }

    setRefleksiGenerating(true);
    setMobileActiveView("preview");

    const prompt = `Anda adalah Ahli Kurikulum Merdeka Kemdikbudristek RI. Susun Dokumen Refleksi & Tindak Lanjut (Remedial & Pengayaan) yang sangat komprehensif, terstruktur, mendalam (Deep Learning), dan siap pakai untuk guru berdasarkan data berikut:
    - Mata Pelajaran: ${activeRecord.mapel}
    - Kelas: ${activeRecord.kelas}
    - Topik Materi Pokok: ${activeRecord.topik}
    - Tujuan Pembelajaran (TP): ${activeRecord.tp}
    - Model Pembelajaran: ${activeRecord.model || "Problem Based Learning (PBL)"}

    TUGAS UTAMA:
    Tuliskan Dokumen Refleksi & Tindak Lanjut Lengkap berformat HTML murni (dimulai dengan <div>, tanpa membungkus dengan tag <html> atau <body>). Gunakan Times New Roman (font-serif) untuk keterbacaan formal cetak/Microsoft Word.

    Dokumen ini WAJIB mencakup bagian-bagian berikut dengan sangat detail dan profesional:

    1. HEADER DOKUMEN:
    \`\`\`html
    <div style="text-align: center; margin-bottom: 25px; border-bottom: 3px solid black; padding-bottom: 10px;">
      <h1 style="font-size: 16pt; font-weight: bold; margin: 0px; text-transform: uppercase;">REFLEKSI & RENCANA TINDAK LANJUT</h1>
      <p style="font-size: 10pt; margin: 4px 0;">Mata Pelajaran: ${activeRecord.mapel} | Kelas: ${activeRecord.kelas} | Semester: ${activeRecord.semester || "Ganjil"}</p>
      <p style="font-size: 11pt; margin: 4px 0; font-weight: bold;">Materi: ${activeRecord.topik}</p>
    </div>
    \`\`\`

    2. REFLEKSI GURU:
    - Sediakan ulasan refleksi mendalam untuk guru.
    - Buat tabel kuesioner refleksi diri guru (minimal 5 pertanyaan reflektif, misal: kesesuaian alokasi waktu, pencapaian target, keaktifan siswa, kendala pembelajaran, efektivitas media). Gunakan kolom: No, Pertanyaan Refleksi, Jawaban/Catatan Guru.
    - Tambahkan 1-2 paragraf saran perbaikan diri untuk pertemuan berikutnya.

    3. REFLEKSI SISWA:
    - Sediakan panduan refleksi untuk siswa (untuk melatih kesadaran metakognitif).
    - Buat tabel lembar refleksi siswa (minimal 5 pertanyaan, misal: tingkat pemahaman materi, bagian yang paling menarik, bagian yang masih membingungkan, usaha yang dilakukan untuk memahami, bantuan yang dibutuhkan). Gunakan kolom: No, Pertanyaan Refleksi Siswa, Pilihan Respon (Sangat Paham / Paham / Kurang Paham) atau Catatan Siswa.

    4. PROGRAM REMEDIAL (TINDAK LANJUT):
    - Jelaskan secara detail rencana program remedial bagi siswa yang belum mencapai kriteria ketercapaian tujuan pembelajaran (KKTP).
    - Berikan strategi pelaksanaan (misalnya bimbingan perorangan, pembelajaran ulang dengan metode berbeda, atau tutor sebaya).
    - Berikan contoh instrumen / aktivitas remedial berupa minimal 3 soal latihan remedial yang disesuaikan dengan topik "${activeRecord.topik}" beserta kunci jawaban singkat atau panduan tugas khusus.

    5. PROGRAM PENGAYAAN (TINDAK LANJUT):
    - Jelaskan secara detail program pengayaan bagi siswa yang memiliki kecepatan belajar tinggi atau telah mencapai KKTP dengan sangat baik.
    - Berikan strategi pelaksanaan (misalnya belajar kelompok mandiri, membaca literatur ilmiah populer, melakukan eksperimen tambahan, atau memecahkan studi kasus tingkat tinggi).
    - Sediakan contoh aktivitas / instrumen pengayaan berupa minimal 2 tantangan berpikir kritis atau soal HOTS (Higher Order Thinking Skills) berkaitan dengan "${activeRecord.topik}" beserta petunjuk pengerjaan.

    PERHATIAN STYLING:
    Gunakan CSS Tailwind bawaan atau style inline standar yang ramah cetak (text-black, font-serif, border-black untuk tabel). Pastikan semua teks rapi, terformat, mudah dipahami, tanpa menggunakan markup markdown \`\`\`html di luar. Berikan respon HANYA dalam format kode HTML murni di dalam pembungkus <div>.`;

    try {
      const text = await executeAIGenerate(prompt);
      let cleanHtml = text;
      
      cleanHtml = cleanHtml.replace(/^```html\n?/gm, "").replace(/^```\n?/gm, "").replace(/```$/gm, "").trim();

      const updatedRecord = {
        ...activeRecord,
        refleksiHtml: cleanHtml
      };

      try {
        const updateResponse = await fetch(`/api/history/${activeRecord.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refleksiHtml: cleanHtml })
        });
        const contentType = updateResponse.headers.get("Content-Type") || "";
        if (updateResponse.ok && contentType.includes("application/json")) {
          const updatedData = await updateResponse.json();
          setHistory((prev) => prev.map((item) => (item.id === activeRecord.id ? updatedData : item)));
          setActiveRecord(updatedData);
        } else {
          throw new Error();
        }
      } catch {
        const updatedHistory = history.map((item) => (item.id === activeRecord.id ? updatedRecord : item));
        setHistory(updatedHistory);
        localStorage.setItem("modulHistory", JSON.stringify(updatedHistory));
        setActiveRecord(updatedRecord);
      }

      showToast("Dokumen Refleksi & Tindak Lanjut berhasil disusun oleh AI!", "success");
    } catch (e: any) {
      showToast(e.message || "Gagal generate Refleksi & Tindak Lanjut. Silakan coba lagi.", "error");
    } finally {
      setRefleksiGenerating(false);
    }
  };

  // AI Generator PROGRAM TAHUNAN (Asinkron)
  const handleGenerateProta = async (
    jpPerMinggu: number,
    mingguEfektifSem1: number,
    mingguEfektifSem2: number,
    mulaiSem1: string,
    mulaiSem2: string
  ) => {
    if (!activeRecord) {
      showToast("Buat atau pilih Modul Ajar terlebih dahulu.", "error");
      return;
    }
    if (!profile?.userApiKey) {
      showToast("Masukkan Gemini API Key Anda di profil guru.", "error");
      setIsProfileOpen(true);
      return;
    }

    setProtaGenerating(true);
    setMobileActiveView("preview");

    const prompt = `Anda adalah Ahli Kurikulum Merdeka Kemdikbudristek RI. Susun Program Tahunan (PROTA) yang lengkap, sistematis, dan terintegrasi untuk:
    - Mata Pelajaran: ${activeRecord.mapel}
    - Kelas: ${activeRecord.kelas} / Fase ${activeRecord.fase}
    - Capaian Pembelajaran (CP) Utama: ${activeRecord.cp}
    - Total JP per Minggu: ${jpPerMinggu} JP
    - Minggu Efektif Semester 1: ${mingguEfektifSem1} Minggu (Total: ${jpPerMinggu * mingguEfektifSem1} JP)
    - Minggu Efektif Semester 2: ${mingguEfektifSem2} Minggu (Total: ${jpPerMinggu * mingguEfektifSem2} JP)
    - Tanggal Mulai Semester 1: ${mulaiSem1}
    - Tanggal Mulai Semester 2: ${mulaiSem2}
    - Satuan Pendidikan (Nama Sekolah): ${profile?.sekolah || "SMP Negeri 2 Tungkal Jaya"}
    - Guru Penyusun: ${profile?.guru || "Nama Guru"}
    - Kepala Sekolah: ${profile?.kepsek || "Nama Kepala Sekolah"}
    - Tahun Pelajaran: ${profile?.tahun || "2025/2026"}

    TUGAS UTAMA:
    Buatlah Dokumen Program Tahunan (PROTA) dalam format JSON valid dengan dua properti utama:
    1. "html": Kode HTML murni untuk cetak PROTA (menggunakan Times New Roman, tabel rapi dengan border, tanda tangan pengesahan di bawah).
    2. "json": Data terstruktur untuk tabel interaktif dengan format berikut:
       {
         "semester1": [
           { "no": 1, "tp": "Deskripsi Tujuan Pembelajaran", "materi": "Nama Materi Pokok/Bab", "jp": 6, "dpl": "Profil Pelajar Pancasila", "keterangan": "" }
         ],
         "semester2": [
           { "no": 5, "tp": "Deskripsi Tujuan Pembelajaran", "materi": "Nama Materi Pokok/Bab", "jp": 6, "dpl": "Profil Pelajar Pancasila", "keterangan": "" }
         ]
       }

    Ketentuan Alokasi Waktu:
    - Sediakan minimal 4 TP untuk Semester 1 (Semester Ganjil) dengan total alokasi waktu JP kumulatif tepat ${jpPerMinggu * mingguEfektifSem1} JP.
    - Sediakan minimal 4 TP untuk Semester 2 (Semester Genap) dengan total alokasi waktu JP kumulatif tepat ${jpPerMinggu * mingguEfektifSem2} JP.
    - Setiap baris harus memiliki deskripsi TP yang konkrit dan materi pokok yang logis sesuai CP: "${activeRecord.cp}".

    Perhatian Formatting:
    Berikan respon HANYA berupa JSON valid murni tanpa block markdown (\`\`\`json) atau teks pengantar lainnya agar dapat langsung di-parse menggunakan JSON.parse.`;

    try {
      const text = await executeAIGenerate(prompt);
      let cleanText = text;
      cleanText = cleanText.replace(/^```json\n?/gm, "").replace(/^```\n?/gm, "").replace(/```$/gm, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(cleanText);
      } catch (err) {
        console.warn("Gagal parse langsung JSON, mencoba parsing darurat", err);
        // Fallback jika tidak berhasil parse JSON: buat protaHtml default
        parsed = {
          html: `<div><h3 class='text-center font-bold font-serif text-lg'>PROGRAM TAHUNAN (PROTA)</h3><p class='text-center font-serif'>Mata Pelajaran: ${activeRecord.mapel}</p><p class='text-serif'>Format respons AI tidak terurai secara otomatis. Silakan coba generate kembali.</p></div>`,
          json: { semester1: [], semester2: [] }
        };
      }

      const cleanHtml = parsed.html || "";
      const protaJsonStr = JSON.stringify(parsed.json || { semester1: [], semester2: [] });

      const updatedRecord = {
        ...activeRecord,
        protaHtml: cleanHtml,
        protaJson: protaJsonStr
      };

      try {
        const updateResponse = await fetch(`/api/history/${activeRecord.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ protaHtml: cleanHtml, protaJson: protaJsonStr })
        });
        if (updateResponse.ok) {
          const updatedData = await updateResponse.json();
          setHistory((prev) => prev.map((item) => (item.id === activeRecord.id ? updatedData : item)));
          setActiveRecord(updatedData);
        } else {
          throw new Error();
        }
      } catch {
        const updatedHistory = history.map((item) => (item.id === activeRecord.id ? updatedRecord : item));
        setHistory(updatedHistory);
        localStorage.setItem("modulHistory", JSON.stringify(updatedHistory));
        setActiveRecord(updatedRecord);
      }

      showToast("Program Tahunan berhasil disusun oleh AI!", "success");
    } catch (e: any) {
      showToast(e.message || "Gagal generate Program Tahunan. Silakan coba lagi.", "error");
    } finally {
      setProtaGenerating(false);
    }
  };

  // AI Generator KKTP (Asinkron)
  const handleGenerateKKTP = async (tp: string, kktpOption: string) => {
    if (!activeRecord) {
      showToast("Buat atau pilih Modul Ajar terlebih dahulu.", "error");
      return;
    }
    if (!profile?.userApiKey) {
      showToast("Masukkan Gemini API Key Anda di profil guru.", "error");
      setIsProfileOpen(true);
      return;
    }

    setKktpGenerating(true);
    setMobileActiveView("preview");

    const prompt = `Anda adalah Ahli Kurikulum Merdeka Kemdikbudristek RI. Susun Dokumen Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) menggunakan pendekatan "${kktpOption.toUpperCase()}" yang lengkap, mendalam, dan terstruktur untuk:
    - Mata Pelajaran: ${activeRecord.mapel}
    - Kelas: ${activeRecord.kelas}
    - Topik Materi Pokok: ${activeRecord.topik}
    - Tujuan Pembelajaran (TP): ${tp || activeRecord.tp}
    - Nama Sekolah: ${profile?.sekolah || "Sekolah Indonesia"}
    - Guru Penyusun: ${profile?.guru || "Nama Guru"}
    - Kepala Sekolah: ${profile?.kepsek || "Nama Kepala Sekolah"}

    TUGAS UTAMA:
    Buatlah Dokumen KKTP dalam format HTML murni (dimulai dengan <div>, tanpa tag <html> atau <body>). Gunakan Times New Roman (font-serif) untuk keterbacaan formal cetak.

    Dokumen harus mencakup:
    1. HEADER KKTP:
       - Judul: "KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)"
       - Identitas Satuan Pendidikan (Nama Sekolah: ${profile?.sekolah || "SMP Negeri 2 Tungkal Jaya"}, Kelas: ${activeRecord.kelas}, Mapel: ${activeRecord.mapel}, Tahun Pelajaran: ${profile?.tahun || "2025/2026"})
    2. TABEL DESKRIPSI KRITERIA & INTERVAL SKOR:
       - Sesuai metode yang dipilih: "${kktpOption.toUpperCase()}".
       - Jika RUBRIK: Buat tabel berjenjang (Baru Berkembang (0-60), Layak (61-70), Cakap (71-85), Mahir (86-100)) lengkap dengan deskripsi kriteria pencapaian konkrit.
       - Jika DESKRIPSI: Buat tabel kriteria esensial beserta kolom penilaian "Memadai" / "Tidak Memadai" dan rekomendasi tindak lanjut.
       - Sediakan minimal 3 kriteria/indikator ketercapaian detail berdasarkan TP: "${tp || activeRecord.tp}".
    3. PENJELASAN INTERVENSI:
       - Berikan ulasan singkat mengenai rekomendasi rencana tindak lanjut intervensi remedial maupun pengayaan yang sesuai.
    4. LEMBAR PENGESAHAN TANDA TANGAN GURU & KEPALA SEKOLAH.

    PERHATIAN STYLING:
    Gunakan CSS Tailwind bawaan atau style inline standar yang ramah cetak (text-black, font-serif, border-black untuk tabel). Berikan respon HANYA dalam format kode HTML murni di dalam pembungkus <div>.`;

    try {
      const text = await executeAIGenerate(prompt);
      let cleanHtml = text;
      cleanHtml = cleanHtml.replace(/^```html\n?/gm, "").replace(/^```\n?/gm, "").replace(/```$/gm, "").trim();

      const updatedRecord = {
        ...activeRecord,
        kktpHtml: cleanHtml
      };

      try {
        const updateResponse = await fetch(`/api/history/${activeRecord.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kktpHtml: cleanHtml })
        });
        if (updateResponse.ok) {
          const updatedData = await updateResponse.json();
          setHistory((prev) => prev.map((item) => (item.id === activeRecord.id ? updatedData : item)));
          setActiveRecord(updatedData);
        } else {
          throw new Error();
        }
      } catch {
        const updatedHistory = history.map((item) => (item.id === activeRecord.id ? updatedRecord : item));
        setHistory(updatedHistory);
        localStorage.setItem("modulHistory", JSON.stringify(updatedHistory));
        setActiveRecord(updatedRecord);
      }

      showToast("Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) berhasil disusun oleh AI!", "success");
    } catch (e: any) {
      showToast(e.message || "Gagal generate KKTP. Silakan coba lagi.", "error");
    } finally {
      setKktpGenerating(false);
    }
  };

  // AI Generator PROGRAM SEMESTER (Asinkron)
  const handleGeneratePromes = async (protaJsonStr: string, semester: string, events?: any[]) => {
    if (!activeRecord) {
      showToast("Buat atau pilih Modul Ajar terlebih dahulu.", "error");
      return;
    }
    if (!profile?.userApiKey) {
      showToast("Masukkan Gemini API Key Anda di profil guru.", "error");
      setIsProfileOpen(true);
      return;
    }

    setPromesGenerating(true);
    setMobileActiveView("preview");

    const prompt = `Anda adalah Ahli Kurikulum Merdeka Kemdikbudristek RI. Susun Dokumen Program Semester (PROSEM / PROMES) Semester ${semester === "1" ? "1 (Ganjil)" : "2 (Genap)"} yang lengkap dan rapi untuk:
    - Mata Pelajaran: ${activeRecord.mapel}
    - Kelas: ${activeRecord.kelas}
    - Nama Sekolah: ${profile?.sekolah || "Sekolah Indonesia"}
    - Guru Penyusun: ${profile?.guru || "Nama Guru"}
    - Kepala Sekolah: ${profile?.kepsek || "Nama Kepala Sekolah"}
    - Tahun Pelajaran: ${profile?.tahun || "2025/2026"}

    REFERENSI DATA PROTA (SINKRONISASI):
    Gunakan referensi data Program Tahunan (PROTA) berikut untuk memetakan Tujuan Pembelajaran dan Materi Pokok:
    ${protaJsonStr || "{}"}

    DAFTAR ACARA & LIBUR (KONFIGURASI):
    Gunakan daftar acara, penilaian, ujian, dan libur berikut untuk menandai sel bersangkutan sebagai hari khusus / ujian / libur di dalam matriks tabel bulanan (misalnya dengan memberi latar belakang warna abu-abu gelap, arsir, atau menuliskan inisial tipe acara "PTS", "PAS", atau "Libur" di sel mingguan tersebut):
    ${events && events.length > 0 
      ? events.map(e => `- ${e.name} (Semester: ${e.semester}, Bulan: ${e.bulan}, Minggu: ${e.minggu}, Tipe: ${e.tipe})`).join("\n") 
      : "Tidak ada acara khusus."}

    TUGAS UTAMA:
    Buatlah Dokumen Program Semester (PROSEM) dalam format HTML murni (dimulai dengan <div>, tanpa tag <html> atau <body>). Gunakan Times New Roman (font-serif) untuk keterbacaan formal cetak.

    Dokumen harus mencakup:
    1. HEADER PROGRAM SEMESTER:
       - Judul: "PROGRAM SEMESTER (PROSEM) SEMESTER ${semester === "1" ? "GANJIL" : "GENAP"}"
       - Identitas Satuan Pendidikan (Sekolah: ${profile?.sekolah || "SMP Negeri 2 Tungkal Jaya"}, Kelas: ${activeRecord.kelas}, Mapel: ${activeRecord.mapel}, Tahun Pelajaran: ${profile?.tahun || "2025/2026"})
    2. TABEL MATRIX PROGRAM SEMESTER (MINGGUAN BULANAN):
       - Jika Semester GANJIL (1): Judul kolom bulan adalah Juli, Agustus, September, Oktober, November, Desember. Masing-masing bulan memiliki sub-kolom Minggu 1, 2, 3, 4, 5.
       - Jika Semester GENAP (2): Judul kolom bulan adalah Januari, Februari, Maret, April, Mei, Juni. Masing-masing bulan memiliki sub-kolom Minggu 1, 2, 3, 4, 5.
       - Kolom utama Tabel: No, Tujuan Pembelajaran, Materi Pokok, Alokasi JP, dan sub-kolom mingguan bulanan tersebut.
       - Petakan alokasi JP dari data PROTA di atas ke dalam sel-sel minggu secara logis dan proporsional. Berikan latar belakang warna abu-abu tipis (atau tulis angka JP, misal "2" atau "4") pada minggu yang dijadwalkan agar menyerupai matrix prosem sekolah asli.
    3. TANDA TANGAN PENGESAHAN GURU & KEPALA SEKOLAH.

    PENTING (TIDAK BOLEH ADA KOTAK PEMBUNGKUS LUAR):
    Jangan membungkus seluruh dokumen dengan border luar ganda, card, panel, box bayangan, atau kotak pembungkus dekoratif apa pun. Dokumen harus langsung berupa teks biasa untuk kop, tabel jadwal, dan area pengesahan.

    UKURAN FONT TABEL:
    Gunakan ukuran font yang sangat kompak dan kecil pada tabel PROMES agar muat dalam halaman landscape dan tidak terpotong (gunakan class "text-[10px]" atau inline "font-size: 10px;", padding sel tipis "p-1" atau "px-1", serta buat tabel 100% lebar).

    PERHATIAN STYLING:
    Gunakan CSS Tailwind bawaan atau style inline standar yang ramah cetak (text-black, font-serif, border-black untuk tabel). Berikan respon HANYA dalam format kode HTML murni di dalam pembungkus <div>.`;

    try {
      const text = await executeAIGenerate(prompt);
      let cleanHtml = text;
      cleanHtml = cleanHtml.replace(/^```html\n?/gm, "").replace(/^```\n?/gm, "").replace(/```$/gm, "").trim();

      const updatedRecord = {
        ...activeRecord,
        promesHtml: cleanHtml
      };

      try {
        const updateResponse = await fetch(`/api/history/${activeRecord.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promesHtml: cleanHtml })
        });
        if (updateResponse.ok) {
          const updatedData = await updateResponse.json();
          setHistory((prev) => prev.map((item) => (item.id === activeRecord.id ? updatedData : item)));
          setActiveRecord(updatedData);
        } else {
          throw new Error();
        }
      } catch {
        const updatedHistory = history.map((item) => (item.id === activeRecord.id ? updatedRecord : item));
        setHistory(updatedHistory);
        localStorage.setItem("modulHistory", JSON.stringify(updatedHistory));
        setActiveRecord(updatedRecord);
      }

      showToast("Program Semester (Prosem) berhasil disusun oleh AI!", "success");
    } catch (e: any) {
      showToast(e.message || "Gagal generate Program Semester. Silakan coba lagi.", "error");
    } finally {
      setPromesGenerating(false);
    }
  };

  // Handler Simpan Record Umum (Dipakai untuk Edit Prota di Planning Workspace)
  const handleSaveRecord = async (updatedRecord: ModulRecord) => {
    try {
      const updateResponse = await fetch(`/api/history/${updatedRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRecord)
      });
      if (updateResponse.ok) {
        const updatedData = await updateResponse.json();
        setHistory((prev) => prev.map((item) => (item.id === updatedRecord.id ? updatedData : item)));
        setActiveRecord(updatedData);
        showToast("Perubahan dokumen perencanaan disimpan!", "success");
      } else {
        throw new Error();
      }
    } catch {
      // Fallback local
      const updatedHistory = history.map((item) => (item.id === updatedRecord.id ? updatedRecord : item));
      setHistory(updatedHistory);
      localStorage.setItem("modulHistory", JSON.stringify(updatedHistory));
      setActiveRecord(updatedRecord);
      showToast("Perubahan disimpan secara lokal!", "success");
    }
  };

  // Handler memilih baris TP dari Prota untuk langsung membuat Modul Ajar
  const handleSelectTpRow = (tp: string, materi: string, semester: string) => {
    setFormValues((prev) => ({
      ...prev,
      tp,
      topik: materi,
      semester: semester || prev.semester
    }));
    setLeftColTab("input");
    showToast(`Materi "${materi}" dan TP dimuat ke form input Modul Ajar!`, "success");
  };

  // Unduh dokumen ke Microsoft Word (.doc) menggunakan pembungkus MIME tipe Word
  const handleDownloadWord = (specificTab?: string, specificSubTab?: string) => {
    if (!activeRecord) {
      showToast("Dokumen tidak ditemukan.", "error");
      return null;
    }

    const tab = specificTab || activeTab;
    const subTab = specificSubTab || activeSubTab;

    const isModul = tab === "modul";
    const isLkpd = tab === "lkpd";
    const isAsesmen = tab === "asesmen";
    const isRefleksi = tab === "refleksi";
    const isPerencanaan = tab === "perencanaan";

    const htmlToDownload = isModul 
      ? activeRecord?.modulHtml 
      : isLkpd 
      ? activeRecord?.lkpdHtml 
      : isAsesmen
      ? activeRecord?.asesmenHtml
      : isRefleksi
      ? activeRecord?.refleksiHtml
      : isPerencanaan
      ? subTab === "prota"
        ? activeRecord?.protaHtml
        : subTab === "kktp"
        ? activeRecord?.kktpHtml
        : activeRecord?.promesHtml
      : activeRecord?.materiHtml;

    if (!htmlToDownload) {
      if (!specificTab) {
        showToast("Dokumen tidak ditemukan.", "error");
      }
      return null;
    }

    const isLandscape = tab === "perencanaan" && subTab === "promes";

    const fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Ekspor Dokumen</title>
        <style>
          @page {
            size: ${isLandscape ? "297mm 210mm" : "210mm 297mm"};
            margin: 1.0in 1.0in 1.0in 1.0in;
            mso-page-orientation: ${isLandscape ? "landscape" : "portrait"};
          }
          @page Section1 {
            size: ${isLandscape ? "841.9pt 595.3pt" : "595.3pt 841.9pt"};
            mso-page-orientation: ${isLandscape ? "landscape" : "portrait"};
            margin: 1.0in 1.0in 1.0in 1.0in;
            mso-header-margin: .5in;
            mso-footer-margin: .5in;
            mso-paper-source: 0;
          }
          div.Section1 {
            page: Section1;
          }
          body {
            font-family: 'Times New Roman', serif;
            font-size: ${isLandscape ? "9pt" : "12pt"};
            line-height: 1.3;
          }
          table {
            width: 100% !important;
            border-collapse: collapse;
            margin-bottom: 16px;
            font-size: ${isLandscape ? "8pt" : "11pt"};
          }
          td, th {
            border: 1px solid black;
            padding: ${isLandscape ? "3px 4px !important" : "8px !important"};
            vertical-align: top;
            font-size: ${isLandscape ? "8pt" : "inherit"};
          }
          table.border-0 td, table.border-0 th, table.border-none td, table.border-none th, .border-0 td, .border-0 th, .border-none td, .border-none th {
            border: none !important;
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .italic { font-style: italic; }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${htmlToDownload}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", fullHtml], { type: "application/msword" });
    const mapelClean = activeRecord?.mapel.replace(/[^a-zA-Z0-9]/g, "_") || "Dokumen";
    const kelas = activeRecord?.kelas || "Semua";
    const prefix = tab === "modul" 
      ? "Modul_Ajar" 
      : tab === "lkpd" 
      ? "LKPD_Siswa" 
      : tab === "asesmen"
      ? "Asesmen_Pembelajaran"
      : tab === "refleksi"
      ? "Refleksi_Tindak_Lanjut"
      : tab === "perencanaan"
      ? subTab === "prota"
        ? "Program_Tahunan_PROTA"
        : subTab === "kktp"
        ? "KKTP_Pembelajaran"
        : "Program_Semester_PROSEM"
      : "Materi_Pembelajaran";
    const fileName = `${prefix}_${mapelClean}_Kelas_${kelas}.doc`;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const docName = tab === "modul" 
      ? "Modul Ajar" 
      : tab === "lkpd" 
      ? "LKPD" 
      : tab === "asesmen"
      ? "Asesmen"
      : tab === "refleksi"
      ? "Refleksi & Tindak Lanjut"
      : tab === "perencanaan"
      ? subTab === "prota"
        ? "Program Tahunan (PROTA)"
        : subTab === "kktp"
        ? "KKTP"
        : "Program Semester (PROSEM)"
      : "Materi";

    if (!specificTab) {
      showToast(`Dokumen ${docName} berhasil diekspor ke format MS Word (.doc)!`, "success");
    }
    return docName;
  };

  const handleDownloadAllDocs = () => {
    if (!activeRecord) {
      showToast("Belum ada dokumen yang terpilih.", "error");
      return;
    }

    const docsToTry = [
      { tab: "modul", subTab: undefined },
      { tab: "materi", subTab: undefined },
      { tab: "lkpd", subTab: undefined },
      { tab: "asesmen", subTab: undefined },
      { tab: "refleksi", subTab: undefined },
      { tab: "perencanaan", subTab: "prota" },
      { tab: "perencanaan", subTab: "kktp" },
      { tab: "perencanaan", subTab: "promes" }
    ];

    let downloadedCount = 0;
    let checkedCount = 0;

    docsToTry.forEach((doc, idx) => {
      setTimeout(() => {
        const htmlToDownload = doc.tab === "modul" 
          ? activeRecord?.modulHtml 
          : doc.tab === "lkpd" 
          ? activeRecord?.lkpdHtml 
          : doc.tab === "asesmen"
          ? activeRecord?.asesmenHtml
          : doc.tab === "refleksi"
          ? activeRecord?.refleksiHtml
          : doc.tab === "perencanaan"
          ? doc.subTab === "prota"
            ? activeRecord?.protaHtml
            : doc.subTab === "kktp"
            ? activeRecord?.kktpHtml
            : activeRecord?.promesHtml
          : activeRecord?.materiHtml;

        if (htmlToDownload) {
          const result = handleDownloadWord(doc.tab, doc.subTab);
          if (result) {
            downloadedCount++;
          }
        }
        checkedCount++;

        if (checkedCount === docsToTry.length) {
          if (downloadedCount > 0) {
            showToast(`${downloadedCount} dokumen berhasil diunduh dalam format MS Word!`, "success");
          } else {
            showToast("Belum ada dokumen yang dihasilkan untuk diunduh.", "info");
          }
        }
      }, idx * 200);
    });
  };

  console.log("Rendering App component...");
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col text-slate-900 antialiased selection:bg-brand-cream">
      <Navbar profile={profile} onOpenProfile={() => setIsProfileOpen(true)} />

      {/* Main Container */}
      <main className="flex-grow max-w-[1440px] 2xl:max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 lg:pb-6 flex flex-col gap-6 relative">
        
        {/* Toast Notification Pop-up */}
        
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-stretch">
          
          {/* Kolom Kiri: Form & Riwayat (Tabbed) */}
          <div className={`lg:col-span-3 lg:sticky lg:top-24 flex flex-col gap-4 self-start max-h-[calc(100vh-120px)] overflow-y-auto pr-1 ${mobileActiveView === "input" ? "flex" : "hidden lg:flex"}`}>
            <div className="bg-white border-2 border-slate-800 rounded-xl p-1 flex shadow-[2.5px_2.5px_0px_0px_rgba(30,41,59,1)]">
              <button
                type="button"
                onClick={() => setLeftColTab("input")}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer ${
                  leftColTab === "input"
                    ? "bg-brand-teal text-white border border-slate-800 shadow-none"
                    : "text-slate-500 hover:text-slate-800 hover:bg-brand-cream/30"
                }`}
              >
                Form Input
              </button>
              <button
                type="button"
                onClick={() => setLeftColTab("history")}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer ${
                  leftColTab === "history"
                    ? "bg-brand-teal text-white border border-slate-800 shadow-none"
                    : "text-slate-500 hover:text-slate-800 hover:bg-brand-cream/30"
                }`}
              >
                Riwayat ({history.length})
              </button>
            </div>

            {leftColTab === "input" ? (
              <GeneratorForm
                profile={profile}
                onSubmit={handleGenerateModul}
                onSuggestCP={handleSuggestCP}
                onSuggestTP={handleSuggestTP}
                onSuggestMateri={() => setIsBabSelectionOpen(true)}
                onSuggestMethodology={handleSuggestMethodology}
                isGenerating={isGenerating}
                formValues={formValues}
                setFormValues={setFormValues}
              />
            ) : (
              <HistorySidebar
                history={history}
                onSelect={(record) => {
                  handleSelectRecord(record);
                  setLeftColTab("input");
                }}
                onDelete={handleDeleteHistory}
                activeId={activeRecord?.id}
                loading={historyLoading}
              />
            )}
          </div>

          {/* Kolom Kanan: Pratinjau Dokumen */}
          <div className={`lg:col-span-7 lg:sticky lg:top-24 flex flex-col max-h-[calc(100vh-120px)] h-full min-h-0 ${mobileActiveView === "preview" ? "flex" : "hidden lg:flex"}`}>
            <DocumentPreview
              record={activeRecord}
              profile={profile}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              activeSubTab={activeSubTab}
              setActiveSubTab={setActiveSubTab}
              onGenerateLKPD={handleGenerateLKPD}
              lkpdGenerating={lkpdGenerating}
              onGenerateAsesmen={handleGenerateAsesmen}
              asesmenGenerating={asesmenGenerating}
              onGenerateMateri={handleGenerateMateri}
              materiGenerating={materiGenerating}
              onGenerateRefleksi={handleGenerateRefleksi}
              refleksiGenerating={refleksiGenerating}
              onGenerateProta={handleGenerateProta}
              protaGenerating={protaGenerating}
              onGenerateKKTP={handleGenerateKKTP}
              kktpGenerating={kktpGenerating}
              onGeneratePromes={handleGeneratePromes}
              promesGenerating={promesGenerating}
              onSaveRecord={handleSaveRecord}
              onSelectTpRow={handleSelectTpRow}
              onDownload={handleDownloadWord}
              onDownloadAll={handleDownloadAllDocs}
              isGenerating={isGenerating}
            />
          </div>

        </div>

        {/* Sticky Bottom Bar for Mobile View Switcher */}
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t-2 border-slate-800 grid grid-cols-2 h-14">
          <button
            type="button"
            onClick={() => setMobileActiveView("input")}
            className={`flex items-center justify-center gap-2 h-full text-xs font-sans font-bold transition-all cursor-pointer border-r-2 border-slate-800 ${
              mobileActiveView === "input"
                ? "bg-[#F8FAFC] text-slate-900"
                : "bg-white text-slate-500 hover:text-slate-800"
            }`}
          >
            <PenTool className={`h-4.5 w-4.5 shrink-0 ${mobileActiveView === "input" ? "text-slate-900" : "text-slate-500"}`} />
            <span>Input Data</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileActiveView("preview")}
            className={`flex items-center justify-center gap-2 h-full text-xs font-sans font-bold transition-all cursor-pointer ${
              mobileActiveView === "preview"
                ? "bg-[#F8FAFC] text-slate-900"
                : "bg-white text-slate-500 hover:text-slate-800"
            }`}
          >
            <Eye className={`h-4.5 w-4.5 shrink-0 ${mobileActiveView === "preview" ? "text-slate-900" : "text-slate-500"}`} />
            <span>Hasil Preview</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-slate-800 py-3 text-center text-xs sticky bottom-0 z-35 mt-auto">
        <div className="max-w-[1440px] 2xl:max-w-[1536px] mx-auto px-4">
          <p className="font-semibold text-slate-600 font-sans">
            © 2026 GenModul AI • Created by Rudy Susanto
          </p>
        </div>
      </footer>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onSave={handleSaveProfile}
        currentProfile={profile}
      />

      {/* Bab Selection Modal */}
      <BabSelectionModal
        isOpen={isBabSelectionOpen}
        onClose={() => setIsBabSelectionOpen(false)}
        onSelect={handleSelectBab}
        currentMapel={formValues.mapel}
        currentKelas={formValues.kelas}
        currentSemester={formValues.semester}
        currentFase={formValues.fase}
        userApiKey={profile?.userApiKey}
      />
    </div>
  );
}
