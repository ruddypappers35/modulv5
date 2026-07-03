import React, { useState } from "react";
import { Download, FileText, BookOpen, AlertCircle, ClipboardCheck, Book, Sparkles, Calendar, Layers, Award, FileSpreadsheet, ChevronDown } from "lucide-react";
import { ModulRecord, GuruProfile } from "../types";
import { PlanningWorkspace } from "./PlanningWorkspace";

interface DocumentPreviewProps {
  record: ModulRecord | null;
  profile: GuruProfile | null;
  activeTab: "modul" | "lkpd" | "asesmen" | "materi" | "refleksi" | "perencanaan";
  setActiveTab: (tab: "modul" | "lkpd" | "asesmen" | "materi" | "refleksi" | "perencanaan") => void;
  activeSubTab: "prota" | "kktp" | "promes";
  setActiveSubTab: (subTab: "prota" | "kktp" | "promes") => void;
  onGenerateLKPD: () => void;
  lkpdGenerating: boolean;
  onGenerateAsesmen: () => void;
  asesmenGenerating: boolean;
  onGenerateMateri: () => void;
  materiGenerating: boolean;
  onGenerateRefleksi: () => void;
  refleksiGenerating: boolean;
  onGenerateProta: (jpPerMinggu: number, mingguEfektifSem1: number, mingguEfektifSem2: number, mulaiSem1: string, mulaiSem2: string) => Promise<void>;
  protaGenerating: boolean;
  onGenerateKKTP: (tp: string, kktpOption: string) => Promise<void>;
  kktpGenerating: boolean;
  onGeneratePromes: (protaJsonStr: string, semester: string, events?: any[]) => Promise<void>;
  promesGenerating: boolean;
  onSaveRecord: (updatedRecord: ModulRecord) => void;
  onSelectTpRow: (tp: string, materi: string, semester: string) => void;
  onDownload: () => void;
  onDownloadAll: () => void;
  isGenerating?: boolean;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  record,
  profile,
  activeTab,
  setActiveTab,
  activeSubTab,
  setActiveSubTab,
  onGenerateLKPD,
  lkpdGenerating,
  onGenerateAsesmen,
  asesmenGenerating,
  onGenerateMateri,
  materiGenerating,
  onGenerateRefleksi,
  refleksiGenerating,
  onGenerateProta,
  protaGenerating,
  onGenerateKKTP,
  kktpGenerating,
  onGeneratePromes,
  promesGenerating,
  onSaveRecord,
  onSelectTpRow,
  onDownload,
  onDownloadAll,
  isGenerating
}) => {
  // Local states for Kalender Pendidikan
  const [jpPerMinggu, setJpPerMinggu] = useState<number>(5);
  const [mingguEfektifSem1, setMingguEfektifSem1] = useState<number>(18);
  const [mingguEfektifSem2, setMingguEfektifSem2] = useState<number>(16);
  const [mulaiSem1, setMulaiSem1] = useState<string>("2025-07-14");
  const [mulaiSem2, setMulaiSem2] = useState<string>("2026-01-05");
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  if (isGenerating) {
    return (
      <div className="bg-white border-2 border-slate-800 rounded-2xl p-8 shadow-[3.5px_3.5px_0px_0px_rgba(30,41,59,1)] flex flex-col items-center justify-center text-center h-full min-h-[550px] animate-in fade-in duration-300">
        <div className="relative mb-6">
          <div className="bg-brand-teal p-5 rounded-full text-white border-2 border-slate-800 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] animate-bounce">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 bg-brand-yellow text-slate-900 p-2 rounded-full border-2 border-slate-800 animate-pulse">
            <Sparkles className="h-4 w-4 text-slate-900" />
          </div>
        </div>
        <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wider">
          AI Sedang Merumuskan Modul Ajar...
        </h3>
        <p className="text-slate-600 text-xs max-w-sm mt-3 leading-relaxed font-sans font-semibold">
          Kecerdasan AI sedang melakukan sintesis kurikulum mendalam, merumuskan Capaian Pembelajaran, tujuan, langkah-langkah, dan instrumen asesmen lengkap secara otomatis.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 w-full max-w-xs">
          {/* Animated loading bar */}
          <div className="w-full h-4 bg-[#FAF8F5] rounded-full border-2 border-slate-800 overflow-hidden relative p-0.5">
            <div className="h-full bg-brand-teal rounded-full animate-pulse" style={{ width: '85%', animationDuration: '1.2s' }}></div>
          </div>
          <span className="text-[10px] font-mono font-black text-brand-teal uppercase tracking-widest animate-pulse">
            Menyusun Dokumen Modul Ajar
          </span>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="bg-white border-2 border-slate-800 rounded-2xl p-8 shadow-[3.5px_3.5px_0px_0px_rgba(30,41,59,1)] flex flex-col items-center justify-center text-center h-full min-h-[450px]">
        <div className="bg-brand-cream/30 p-4 rounded-full text-brand-teal mb-4 animate-bounce border-2 border-slate-800 shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]">
          <BookOpen className="h-8 w-8" />
        </div>
        <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wider">
          Belum Ada Dokumen yang Dibuat
        </h3>
        <p className="text-slate-600 text-xs max-w-sm mt-2 leading-relaxed font-sans font-medium">
          Silakan isi form di sebelah kiri atau pilih salah satu dokumen dari daftar riwayat untuk memuat pratinjau.
        </p>
      </div>
    );
  }

  const handleTabChange = (tab: "modul" | "lkpd" | "asesmen" | "materi" | "refleksi" | "perencanaan") => {
    setActiveTab(tab);
    if (tab === "lkpd" && !record.lkpdHtml && !lkpdGenerating) {
      onGenerateLKPD();
    } else if (tab === "asesmen" && !record.asesmenHtml && !asesmenGenerating) {
      onGenerateAsesmen();
    } else if (tab === "materi" && !record.materiHtml && !materiGenerating) {
      onGenerateMateri();
    } else if (tab === "refleksi" && !record.refleksiHtml && !refleksiGenerating) {
      onGenerateRefleksi();
    }
  };

  const handleSubTabChange = (subTab: "prota" | "kktp" | "promes") => {
    setActiveSubTab(subTab);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-800 shadow-[3.5px_3.5px_0px_0px_rgba(30,41,59,1)] flex flex-col h-full min-h-[550px] overflow-hidden">
      {/* Header Panel Pratinjau */}
      <div className="p-5 border-b-2 border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white rounded-t-2xl">
        <div>
          <h3 className="font-display font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-brand-teal" />
            Pratinjau Dokumen Ekspor
          </h3>
          <p className="text-[11px] text-slate-700 mt-1 truncate max-w-[300px] md:max-w-md font-mono font-bold">
            Materi: {record.topik}
          </p>
        </div>

        {/* Menu Unduh Dropdown */}
        <div className="relative w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsDownloadOpen(!isDownloadOpen)}
            className="w-full sm:w-auto bg-brand-rose hover:bg-brand-rose/90 active:bg-brand-rose text-white text-[10px] font-extrabold uppercase tracking-wider py-2.5 px-4 rounded-xl border-2 border-slate-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
            id="btn-download-dropdown"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Menu Unduh</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isDownloadOpen ? "rotate-180" : ""}`} />
          </button>

          {isDownloadOpen && (
            <>
              {/* Overlay background to capture outer clicks */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsDownloadOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-slate-800 rounded-xl shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-1.5 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onDownload();
                      setIsDownloadOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-brand-teal" />
                    <span>Unduh Tab Aktif (.doc)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDownloadAll();
                      setIsDownloadOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 border-t border-slate-100 pt-2 cursor-pointer"
                  >
                    <Layers className="h-4 w-4 text-brand-rose" />
                    <span>Unduh Semua Tab (.doc)</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap border-b-2 border-slate-800 px-4 bg-[#FAF8F5] gap-2 py-2">
        <button
          onClick={() => handleTabChange("modul")}
          id="tab-modul"
          className={`px-3 py-2 text-[10px] uppercase tracking-wider font-extrabold transition-all border-2 rounded-xl flex items-center gap-1.5 cursor-pointer ${
            activeTab === "modul"
              ? "bg-brand-teal border-slate-800 text-white shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]"
              : "bg-white border-transparent text-slate-600 hover:text-brand-teal hover:border-slate-800"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Modul Ajar (RPP)
        </button>
        <button
          onClick={() => handleTabChange("materi")}
          id="tab-materi"
          className={`px-3 py-2 text-[10px] uppercase tracking-wider font-extrabold transition-all border-2 rounded-xl flex items-center gap-1.5 cursor-pointer ${
            activeTab === "materi"
              ? "bg-brand-teal border-slate-800 text-white shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]"
              : "bg-white border-transparent text-slate-600 hover:text-brand-teal hover:border-slate-800"
          }`}
        >
          <Book className="h-3.5 w-3.5" />
          Materi Ajar
        </button>
        <button
          onClick={() => handleTabChange("lkpd")}
          id="tab-lkpd"
          className={`px-3 py-2 text-[10px] uppercase tracking-wider font-extrabold transition-all border-2 rounded-xl flex items-center gap-1.5 cursor-pointer ${
            activeTab === "lkpd"
              ? "bg-brand-teal border-slate-800 text-white shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]"
              : "bg-white border-transparent text-slate-600 hover:text-brand-teal hover:border-slate-800"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          LKPD Siswa
        </button>
        <button
          onClick={() => handleTabChange("asesmen")}
          id="tab-asesmen"
          className={`px-3 py-2 text-[10px] uppercase tracking-wider font-extrabold transition-all border-2 rounded-xl flex items-center gap-1.5 cursor-pointer ${
            activeTab === "asesmen"
              ? "bg-brand-teal border-slate-800 text-white shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]"
              : "bg-white border-transparent text-slate-600 hover:text-brand-teal hover:border-slate-800"
          }`}
        >
          <ClipboardCheck className="h-3.5 w-3.5" />
          Instrumen Asesmen
        </button>
        <button
          onClick={() => handleTabChange("refleksi")}
          id="tab-refleksi"
          className={`px-3 py-2 text-[10px] uppercase tracking-wider font-extrabold transition-all border-2 rounded-xl flex items-center gap-1.5 cursor-pointer ${
            activeTab === "refleksi"
              ? "bg-brand-teal border-slate-800 text-white shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]"
              : "bg-white border-transparent text-slate-600 hover:text-brand-teal hover:border-slate-800"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Refleksi & Tindak Lanjut
        </button>
        <button
          onClick={() => handleTabChange("perencanaan")}
          id="tab-perencanaan"
          className={`px-3 py-2 text-[10px] uppercase tracking-wider font-extrabold transition-all border-2 rounded-xl flex items-center gap-1.5 cursor-pointer ${
            activeTab === "perencanaan"
              ? "bg-brand-teal border-slate-800 text-white shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]"
              : "bg-white border-transparent text-slate-600 hover:text-brand-teal hover:border-slate-800"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          Perencanaan
        </button>
      </div>

      {/* Konten Area Pratinjau Dokumen */}
      <div className={`flex-1 min-h-0 bg-slate-100 rounded-b-2xl ${activeTab === "perencanaan" ? "p-0 overflow-hidden flex flex-col" : "p-6 overflow-y-auto"}`}>
        {activeTab === "modul" && (
          <div className="bg-white p-10 sm:p-16 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] border border-slate-200 rounded-lg max-w-4xl mx-auto min-h-[900px] overflow-x-auto">
            {/* Render HTML Modul Ajar secara aman */}
            <div
              className="preview-area leading-relaxed"
              dangerouslySetInnerHTML={{ __html: record.modulHtml }}
            />
          </div>
        )}

        {activeTab === "materi" && (
          <div className="bg-white p-10 sm:p-16 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] border border-slate-200 rounded-lg max-w-4xl mx-auto min-h-[900px] overflow-x-auto">
            {materiGenerating ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <svg className="animate-spin h-8 w-8 text-brand-teal" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <div className="text-center">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">AI sedang menyusun Materi...</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs font-sans font-medium">
                    Membuat Bahan Ajar dan rangkuman komprehensif berdasarkan modul pembelajaran secara otomatis.
                  </p>
                </div>
              </div>
            ) : record.materiHtml ? (
              /* Render HTML Materi secara aman */
              <div
                className="preview-area leading-relaxed"
                dangerouslySetInnerHTML={{ __html: record.materiHtml }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="h-8 w-8 text-brand-yellow mb-3 animate-pulse" />
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Materi Ajar Belum Dibuat</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs font-sans font-medium">
                  Klik tombol di bawah ini untuk menghasilkan Bahan Ajar / Materi Pembelajaran mendalam dari AI.
                </p>
                <button
                  onClick={onGenerateMateri}
                  id="btn-generate-materi-trigger"
                  className="mt-4 bg-brand-teal hover:bg-brand-teal/90 active:bg-brand-teal text-white border-2 border-slate-800 text-[10px] font-extrabold uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  Generate Materi Ajar
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "lkpd" && (
          <div className="bg-white p-10 sm:p-16 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] border border-slate-200 rounded-lg max-w-4xl mx-auto min-h-[900px] overflow-x-auto">
            {lkpdGenerating ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <svg className="animate-spin h-8 w-8 text-brand-teal" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <div className="text-center">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">AI sedang menyusun LKPD...</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs font-sans font-medium">
                    Membuat Lembar Kerja Siswa berdasarkan modul pembelajaran Anda secara otomatis.
                  </p>
                </div>
              </div>
            ) : record.lkpdHtml ? (
              /* Render HTML LKPD Siswa secara aman */
              <div
                className="preview-area leading-relaxed"
                dangerouslySetInnerHTML={{ __html: record.lkpdHtml }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="h-8 w-8 text-brand-yellow mb-3 animate-pulse" />
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">LKPD Belum Dibuat</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs font-sans font-medium">
                  Klik tombol di bawah ini untuk menghasilkan Lembar Kerja Peserta Didik (LKPD) asinkron dari AI.
                </p>
                <button
                  onClick={onGenerateLKPD}
                  id="btn-generate-lkpd-trigger"
                  className="mt-4 bg-brand-teal hover:bg-brand-teal/90 active:bg-brand-teal text-white border-2 border-slate-800 text-[10px] font-extrabold uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  Generate LKPD Sekarang
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "asesmen" && (
          <div className="bg-white p-10 sm:p-16 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] border border-slate-200 rounded-lg max-w-4xl mx-auto min-h-[900px] overflow-x-auto">
            {asesmenGenerating ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <svg className="animate-spin h-8 w-8 text-brand-teal" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <div className="text-center">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">AI sedang menyusun Asesmen...</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs font-sans font-medium">
                    Membuat instrumen asesmen awal, formatif, dan sumatif beserta rubrik penilaian lengkap secara otomatis.
                  </p>
                </div>
              </div>
            ) : record.asesmenHtml ? (
              /* Render HTML Asesmen secara aman */
              <div
                className="preview-area leading-relaxed"
                dangerouslySetInnerHTML={{ __html: record.asesmenHtml }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="h-8 w-8 text-brand-yellow mb-3 animate-pulse" />
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Instrumen Asesmen Belum Dibuat</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs font-sans font-medium">
                  Klik tombol di bawah ini untuk menghasilkan Instrumen Asesmen Pembelajaran (Awal, Formatif, Sumatif) lengkap dengan rubrik penilaian dari AI.
                </p>
                <button
                  onClick={onGenerateAsesmen}
                  id="btn-generate-asesmen-trigger"
                  className="mt-4 bg-brand-teal hover:bg-brand-teal/90 active:bg-brand-teal text-white border-2 border-slate-800 text-[10px] font-extrabold uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  Generate Instrumen Asesmen
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "refleksi" && (
          <div className="bg-white p-10 sm:p-16 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] border border-slate-200 rounded-lg max-w-4xl mx-auto min-h-[900px] overflow-x-auto">
            {refleksiGenerating ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <svg className="animate-spin h-8 w-8 text-brand-teal" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <div className="text-center">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">AI sedang menyusun Refleksi & Tindak Lanjut...</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs font-sans font-medium">
                    Merumuskan evaluasi diri guru, kuesioner reflektif siswa, serta program remedial dan pengayaan terstruktur secara otomatis.
                  </p>
                </div>
              </div>
            ) : record.refleksiHtml ? (
              /* Render HTML Refleksi secara aman */
              <div
                className="preview-area leading-relaxed"
                dangerouslySetInnerHTML={{ __html: record.refleksiHtml }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="h-8 w-8 text-brand-yellow mb-3 animate-pulse" />
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Refleksi & Rencana Tindak Lanjut Belum Dibuat</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs font-sans font-medium">
                  Klik tombol di bawah ini untuk menghasilkan Dokumen Refleksi Pembelajaran, Program Remedial, dan Program Pengayaan (HOTS) terintegrasi secara otomatis dari AI.
                </p>
                <button
                  onClick={onGenerateRefleksi}
                  id="btn-generate-refleksi-trigger"
                  className="mt-4 bg-brand-teal hover:bg-brand-teal/90 active:bg-brand-teal text-white border-2 border-slate-800 text-[10px] font-extrabold uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  Generate Refleksi & Tindak Lanjut
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "perencanaan" && (
          <div className="w-full max-w-none mx-auto h-full flex flex-col min-h-0">
            <PlanningWorkspace
              record={record}
              profile={profile}
              activeSubTab={activeSubTab}
              setActiveSubTab={setActiveSubTab}
              onSaveRecord={onSaveRecord}
              onSelectTpRow={onSelectTpRow}
              onGenerateProta={onGenerateProta}
              protaGenerating={protaGenerating}
              onGenerateKktp={onGenerateKKTP}
              kktpGenerating={kktpGenerating}
              onGeneratePromes={onGeneratePromes}
              promesGenerating={promesGenerating}
            />
          </div>
        )}
      </div>
    </div>
  );
};
