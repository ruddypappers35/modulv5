import React, { useState, useEffect } from "react";
import { X, Search, BookOpen, ChevronRight, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { POPULAR_CURRICULUM } from "../data";
import { CurriculumBab } from "../types";

interface BabSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (bab: CurriculumBab) => void;
  currentMapel: string;
  currentKelas: string;
  currentSemester: string;
  currentFase: string;
  userApiKey?: string;
}

export const BabSelectionModal: React.FC<BabSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentMapel,
  currentKelas,
  currentSemester,
  currentFase,
  userApiKey
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("Semua");
  const [modalMode, setModalMode] = useState<"database" | "ai">("database");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiBabList, setAiBabList] = useState<CurriculumBab[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Set default mode and clear states when modal is opened
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      // Auto switch to AI mode if the user's form inputs are filled
      if (currentMapel && currentKelas && currentSemester) {
        setModalMode("ai");
      } else {
        setModalMode("database");
      }
    }
  }, [isOpen, currentMapel, currentKelas, currentSemester]);

  if (!isOpen) return null;

  // Mendapatkan daftar mapel unik untuk filter tab
  const categories = ["Semua", ...Array.from(new Set(POPULAR_CURRICULUM.map((item) => item.mapel)))];

  const filteredBab = POPULAR_CURRICULUM.filter((item) => {
    const matchesSearch =
      item.bab.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.materi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mapel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = activeTab === "Semua" || item.mapel === activeTab;

    return matchesSearch && matchesCategory;
  });

  const handleGenerateAiBab = async () => {
    const apiKeyToUse = userApiKey;
    if (!apiKeyToUse) {
      setErrorMsg("Kunci API (API Key) Gemini tidak ditemukan. Silakan masukkan API Key Anda terlebih dahulu di menu Profil (Kanan Atas).");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    const mapel = currentMapel || "IPA";
    const kelas = currentKelas || "9";
    const semester = currentSemester || "Ganjil";
    const fase = currentFase || "Fase D";

    const prompt = `Anda adalah Ahli Kurikulum Merdeka Kemdikbudristek RI. Tuliskan daftar bab kurikulum merdeka resmi untuk parameter berikut:
    Mata Pelajaran: "${mapel}"
    Kelas: "${kelas}"
    Semester: "${semester}"
    Fase: "${fase}"

    Harap buat daftar 4 bab resmi kurikulum merdeka yang paling relevan dengan deskripsi materi pokok yang mendalam.
    Kembalikan HASILNYA HANYA berupa JSON array murni tanpa tag markdown \`\`\`json atau teks pengantar lainnya agar bisa langsung di-JSON.parse() di frontend.
    
    Format JSON harus berupa array of objects seperti ini:
    [
      {
        "kelas": "${kelas}",
        "fase": "${fase}",
        "semester": "${semester}",
        "mapel": "${mapel}",
        "bab": "Bab I: [Judul Bab Resmi]",
        "materi": "[Deskripsi detail sub-bab & materi pokok]",
        "cpDefault": "[Deskripsi Capaian Pembelajaran standar untuk bab ini]"
      }
    ]
    
    PENTING: Pastikan JSON valid dan sesuai format di atas. Hanya kembalikan array JSON murni, jangan ada kata pengantar atau penutup.`;

    try {
      let text = "";

      // 1. Coba panggil server-side API terlebih dahulu
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            userApiKey: apiKeyToUse
          })
        });

        const contentType = response.headers.get("Content-Type") || "";
        if (response.ok && contentType.includes("application/json")) {
          const resData = await response.json();
          if (resData && resData.text) {
            text = resData.text;
          } else {
            throw new Error("Respon server kosong");
          }
        } else {
          throw new Error("Respon server bukan JSON valid");
        }
      } catch (serverErr) {
        console.warn("Server API bermasalah atau tidak tersedia di platform ini, mencoba client-side...", serverErr);
        
        // 2. Fallback: Panggil Gemini API langsung dari browser client-side
        const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });

        if (response && response.text) {
          text = response.text;
        } else {
          throw new Error("Respon dari Gemini API kosong");
        }
      }

      // Clean the string from potential markdown backticks
      let cleaned = text.trim();
      cleaned = cleaned.replace(/^```json\s*/i, "");
      cleaned = cleaned.replace(/^```\s*/i, "");
      cleaned = cleaned.replace(/\s*```$/i, "");

      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        const formatted: CurriculumBab[] = parsed.map((item: any, index: number) => ({
          id: `ai-${index}-${Date.now()}`,
          kelas: item.kelas || kelas,
          fase: item.fase || fase,
          semester: item.semester || semester,
          mapel: item.mapel || mapel,
          bab: item.bab || `Bab ${index + 1}`,
          materi: item.materi || "",
          cpDefault: item.cpDefault || ""
        }));
        setAiBabList(formatted);
      } else {
        throw new Error("Format respon AI tidak valid (bukan array).");
      }
    } catch (err: any) {
      console.error("Gagal generate bab AI:", err);
      setErrorMsg(err.message || "Gagal menyusun bab dengan AI. Pastikan format input dan API Key valid.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 border-2 border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-slate-800 flex justify-between items-center bg-white">
          <h3 className="font-display font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="h-4.5 w-4.5 text-brand-teal" />
            Pilihan Bab &amp; Materi Kemdikbudristek
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-brand-rose hover:bg-brand-rose/10 p-1.5 rounded-xl border border-transparent hover:border-slate-800 transition-all cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b-2 border-slate-800 px-6 bg-brand-cream/10 shrink-0 gap-2 py-2">
          <button
            type="button"
            onClick={() => setModalMode("database")}
            className={`py-2 text-xs font-black uppercase tracking-wider border-2 px-4 rounded-xl transition-all cursor-pointer ${
              modalMode === "database"
                ? "bg-brand-teal border-slate-800 text-white shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]"
                : "bg-white border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-800"
            }`}
          >
            Database Kurikulum
          </button>
          <button
            type="button"
            onClick={() => setModalMode("ai")}
            className={`py-2 text-xs font-black uppercase tracking-wider border-2 px-4 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              modalMode === "ai"
                ? "bg-brand-teal border-slate-800 text-white shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]"
                : "bg-white border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-800"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-brand-yellow animate-pulse" />
            Rekomendasi AI ✨
          </button>
        </div>

        {modalMode === "database" ? (
          <>
            {/* Filter Pencarian & Kategori */}
            <div className="p-4 bg-brand-cream/5 border-b-2 border-slate-800 space-y-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari bab atau deskripsi materi pokok..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-0 focus:border-slate-800 focus:shadow-[2px_2px_0px_0px_#59B292] shadow-[1px_1px_0px_0px_rgba(30,41,59,0.1)] transition-all text-slate-800 font-sans font-bold"
                />
              </div>

              {/* Kategori Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveTab(cat)}
                    className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-extrabold rounded-xl transition-all border-2 whitespace-nowrap cursor-pointer ${
                      activeTab === cat
                        ? "bg-brand-teal border-slate-800 text-white shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]"
                        : "bg-white border-slate-800 text-slate-700 hover:bg-brand-cream/20"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Daftar Materi Database */}
            <div className="p-6 overflow-y-auto flex-grow bg-slate-50/20 max-h-[400px]">
              {filteredBab.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <p className="text-sm font-bold">Materi tidak ditemukan.</p>
                  <p className="text-xs mt-1 font-sans">Coba ketik kata kunci lain atau ketik langsung di form.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredBab.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelect(item);
                        onClose();
                      }}
                      className="w-full text-left p-4 bg-white border-2 border-slate-800 rounded-xl hover:shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 transition-all group flex items-start justify-between gap-4 cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-brand-teal text-white border border-slate-800 text-[9px] font-black px-2 py-0.5 rounded">
                            {item.mapel}
                          </span>
                          <span className="bg-brand-cream/40 text-slate-800 text-[9px] font-black px-2 py-0.5 rounded border border-slate-800">
                            {item.fase} (Kelas {item.kelas})
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold font-mono">
                            Semester {item.semester}
                          </span>
                        </div>
                        <h4 className="font-black text-slate-900 text-xs mt-2 group-hover:text-brand-teal transition-colors">
                          {item.bab}
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                          {item.materi}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-brand-teal transition-colors shrink-0 self-center" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col flex-grow overflow-hidden bg-slate-50/20">
            {/* Active Parameters */}
            <div className="p-4 mx-6 mt-4 bg-brand-cream/5 border-2 border-slate-800 rounded-xl space-y-2 shrink-0 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
              <div className="text-[9px] font-black text-brand-teal uppercase tracking-widest font-sans">
                Parameter Form Saat Ini:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-2 rounded-lg border-2 border-slate-800">
                  <span className="text-slate-400 font-black uppercase tracking-wider text-[9px] block">Mata Pelajaran</span>
                  <strong className="text-slate-900">{currentMapel || "Belum diisi"}</strong>
                </div>
                <div className="bg-white p-2 rounded-lg border-2 border-slate-800">
                  <span className="text-slate-400 font-black uppercase tracking-wider text-[9px] block">Kelas &amp; Fase</span>
                  <strong className="text-slate-900">
                    {currentKelas ? `Kelas ${currentKelas}` : "Belum diisi"}{" "}
                    {currentFase ? `(${currentFase})` : ""}
                  </strong>
                </div>
                <div className="bg-white p-2 rounded-lg border-2 border-slate-800">
                  <span className="text-slate-400 font-black uppercase tracking-wider text-[9px] block">Semester</span>
                  <strong className="text-slate-900">{currentSemester || "Belum diisi"}</strong>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mx-6 mt-4 p-4 bg-red-50 border-2 border-red-500 text-red-900 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed shrink-0">
                <AlertCircle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-grow">
                  <p className="font-bold">Gagal Merekomendasikan Bab</p>
                  <p className="mt-1 text-slate-700 font-medium">{errorMsg}</p>
                  {!userApiKey && (
                    <p className="mt-1.5 font-bold text-slate-700">
                      Silakan klik tombol "Profil" di navbar kanan atas untuk menempelkan API Key Gemini Anda.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleGenerateAiBab}
                    className="mt-3 bg-red-100 hover:bg-red-200 text-red-900 font-extrabold px-3 py-1.5 rounded transition text-[10px] uppercase tracking-wider cursor-pointer border border-red-400"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
            )}

            {/* AI Generator Output / Trigger Section */}
            <div className="p-6 overflow-y-auto flex-grow max-h-[400px]">
              {isGenerating ? (
                <div className="text-center py-12 space-y-3">
                  <Loader2 className="h-8 w-8 text-brand-teal animate-spin mx-auto" />
                  <p className="text-sm font-black text-slate-800 font-sans">Menghubungkan ke Gemini 3.5 Flash...</p>
                  <p className="text-xs text-slate-500 font-sans font-semibold">Menyusun daftar bab resmi kurikulum merdeka RI yang komprehensif</p>
                </div>
              ) : aiBabList.length === 0 ? (
                <div className="text-center py-8 px-4 border-2 border-dashed border-slate-800 rounded-xl bg-white max-w-md mx-auto my-4 space-y-4 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]">
                  <Sparkles className="h-10 w-10 text-brand-yellow mx-auto animate-pulse" />
                  <div>
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                      Sintesis Bab Kurikulum Merdeka
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-2 font-semibold font-sans">
                      Kecerdasan AI akan memetakan dan merumuskan daftar bab pembelajaran resmi beserta sub-bab materi dan Capaian Pembelajaran secara instan sesuai kurikulum terbaru.
                    </p>
                    {(!currentMapel || !currentKelas || !currentSemester) && (
                      <p className="text-[10px] text-amber-600 font-black mt-3 leading-normal font-sans uppercase">
                        ⚠️ Catatan: Form Anda belum lengkap. AI akan mengasumsikan default (IPA Kelas IX Semester Ganjil). Lengkapi form input terlebih dahulu untuk akurasi penuh.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateAiBab}
                    className="w-full bg-brand-teal hover:bg-brand-teal/90 active:bg-brand-teal text-white font-black py-3 px-4 rounded-xl border-2 border-slate-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all flex justify-center items-center gap-2 text-xs uppercase tracking-wider cursor-pointer font-sans"
                  >
                    <Sparkles className="h-4 w-4 text-brand-yellow animate-bounce" />
                    <span>Dapatkan Rekomendasi Bab (AI)</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">
                      Daftar Bab Hasil Rekomendasi AI
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerateAiBab}
                      className="text-[10px] text-brand-teal hover:underline font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer font-sans"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-brand-yellow animate-pulse" />
                      Regenerasi AI
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {aiBabList.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelect(item);
                          onClose();
                        }}
                        className="w-full text-left p-4 bg-white border-2 border-slate-800 rounded-xl hover:shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 transition-all group flex items-start justify-between gap-4 cursor-pointer"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-brand-teal text-white border border-slate-800 text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                              <Sparkles className="h-2.5 w-2.5 text-brand-yellow animate-pulse" /> AI
                            </span>
                            <span className="bg-brand-cream/40 text-slate-800 text-[9px] font-black px-2 py-0.5 rounded border border-slate-800">
                              {item.fase} (Kelas {item.kelas})
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold font-mono">
                              Semester {item.semester}
                            </span>
                          </div>
                          <h4 className="font-black text-slate-900 text-xs mt-2 group-hover:text-brand-teal transition-colors">
                            {item.bab}
                          </h4>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                            {item.materi}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-brand-teal transition-colors shrink-0 self-center" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
