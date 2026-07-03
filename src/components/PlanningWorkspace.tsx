import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  Edit3, 
  FileDown, 
  Save, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  CheckSquare, 
  Square,
  ChevronRight,
  Info,
  CheckCircle,
  Activity,
  Trash2,
  Plus
} from "lucide-react";
import { ModulRecord, GuruProfile } from "../types";

export interface PromesEvent {
  id: string;
  name: string;
  semester: "Sem 1" | "Sem 2";
  bulan: "Jan" | "Feb" | "Mar" | "Apr" | "Mei" | "Jun" | "Jul" | "Agu" | "Sep" | "Okt" | "Nov" | "Des";
  minggu: "W1" | "W2" | "W3" | "W4" | "W5";
  tipe: "PTS" | "PAS" | "Libur" | "Lainnya";
}

interface PlanningWorkspaceProps {
  record: ModulRecord | null;
  profile: GuruProfile | null;
  activeSubTab?: "prota" | "kktp" | "promes";
  setActiveSubTab?: (subTab: "prota" | "kktp" | "promes") => void;
  onSaveRecord: (updatedRecord: ModulRecord) => void;
  onSelectTpRow: (tp: string, materi: string, semester: string) => void;
  onGenerateProta: (
    jpPerMinggu: number,
    mingguEfektifSem1: number,
    mingguEfektifSem2: number,
    mulaiSem1: string,
    mulaiSem2: string
  ) => Promise<void>;
  protaGenerating: boolean;
  onGenerateKktp: (tp: string, kktpOption: string) => Promise<void>;
  kktpGenerating: boolean;
  onGeneratePromes: (protaJsonStr: string, semester: string, events?: PromesEvent[]) => Promise<void>;
  promesGenerating: boolean;
  onDownload?: (specificTab?: string, specificSubTab?: string) => void;
}

export const PlanningWorkspace: React.FC<PlanningWorkspaceProps> = ({
  record,
  profile,
  activeSubTab = "prota",
  setActiveSubTab,
  onSaveRecord,
  onSelectTpRow,
  onGenerateProta,
  protaGenerating,
  onGenerateKktp,
  kktpGenerating,
  onGeneratePromes,
  promesGenerating,
  onDownload
}) => {
  // Use props if provided, otherwise fallback to local state
  const [localSubTab, setLocalSubTab] = useState<"prota" | "kktp" | "promes">("prota");
  const subTab = setActiveSubTab ? activeSubTab : localSubTab;
  const setSubTab = setActiveSubTab || setLocalSubTab;

  // State untuk Kalender Pendidikan (PROTA)
  const [jpPerMinggu, setJpPerMinggu] = useState<number>(5);
  const [mingguEfektifSem1, setMingguEfektifSem1] = useState<number>(18);
  const [mingguEfektifSem2, setMingguEfektifSem2] = useState<number>(16);
  const [mulaiSem1, setMulaiSem1] = useState<string>("2025-07-14");
  const [mulaiSem2, setMulaiSem2] = useState<string>("2026-01-05");

  // State Edit Mode Prota
  const [isEditingProta, setIsEditingProta] = useState(false);
  const [editedProta, setEditedProta] = useState<any>(null);

  // State Kriteria KKTP
  const [kktpOption, setKktpOption] = useState<"deskripsi" | "rubrik" | "interval">("rubrik");

  // State Semester Promes
  const [promesSemester, setPromesSemester] = useState<"1" | "2">("1");

  // State for Event / Libur configuration (PROMES)
  const [promesEvents, setPromesEvents] = useState<PromesEvent[]>(() => {
    const saved = localStorage.getItem(`promesEvents_${record?.id || "default"}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [
      { id: "1", name: "PTS Semester 1", semester: "Sem 1", bulan: "Okt", minggu: "W4", tipe: "PTS" },
      { id: "2", name: "PAS Semester 1", semester: "Sem 1", bulan: "Des", minggu: "W2", tipe: "PAS" },
      { id: "3", name: "PTS Semester 2", semester: "Sem 2", bulan: "Mar", minggu: "W4", tipe: "PTS" },
      { id: "4", name: "PAS Semester 2", semester: "Sem 2", bulan: "Jun", minggu: "W1", tipe: "PAS" },
    ];
  });

  // Sync to localStorage on events or record change
  useEffect(() => {
    if (record) {
      localStorage.setItem(`promesEvents_${record.id}`, JSON.stringify(promesEvents));
    }
  }, [promesEvents, record]);

  const handleAddPromesEvent = () => {
    const newEvent: PromesEvent = {
      id: Date.now().toString(),
      name: "",
      semester: "Sem 1",
      bulan: "Jul",
      minggu: "W1",
      tipe: "Libur",
    };
    setPromesEvents([...promesEvents, newEvent]);
  };

  const handleChangePromesEvent = (id: string, field: keyof PromesEvent, value: any) => {
    setPromesEvents(
      promesEvents.map((evt) => (evt.id === id ? { ...evt, [field]: value } : evt))
    );
  };

  const handleDeletePromesEvent = (id: string) => {
    setPromesEvents(promesEvents.filter((evt) => evt.id !== id));
  };

  // Track progress TPs completed (stored in local storage or record)
  const [completedTps, setCompletedTps] = useState<Record<number, boolean>>({});

  // Reset local state on record change
  useEffect(() => {
    if (record) {
      if (record.protaJson) {
        try {
          const parsed = JSON.parse(record.protaJson);
          setEditedProta(parsed);
        } catch (e) {
          console.error("Gagal parse protaJson", e);
          setEditedProta(null);
        }
      } else {
        setEditedProta(null);
      }
    }
    // Load completed TPs tracker from localStorage
    const savedTracker = localStorage.getItem(`completedTps_${record?.id}`);
    if (savedTracker) {
      try {
        setCompletedTps(JSON.parse(savedTracker));
      } catch {
        setCompletedTps({});
      }
    } else {
      setCompletedTps({});
    }
  }, [record]);

  if (!record) {
    return (
      <div className="bg-white border-2 border-slate-800 rounded-2xl p-8 shadow-[3.5px_3.5px_0px_0px_rgba(30,41,59,1)] flex flex-col items-center justify-center text-center h-full min-h-[450px]">
        <AlertCircle className="h-10 w-10 text-brand-rose mb-3 animate-pulse" />
        <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wider">
          Pilih / Buat Modul Ajar Terlebih Dahulu
        </h3>
        <p className="text-slate-500 text-xs mt-1.5 max-w-sm font-sans font-medium">
          Workspace Perencanaan Kurikulum memerlukan data modul aktif untuk mensinkronisasikan topik, CP, dan identitas guru.
        </p>
      </div>
    );
  }

  // Menghitung Total JP
  const totalJpSem1 = jpPerMinggu * mingguEfektifSem1;
  const totalJpSem2 = jpPerMinggu * mingguEfektifSem2;

  // Toggle completed TP
  const handleToggleTp = (no: number) => {
    const updated = {
      ...completedTps,
      [no]: !completedTps[no]
    };
    setCompletedTps(updated);
    localStorage.setItem(`completedTps_${record.id}`, JSON.stringify(updated));
  };

  // Menghitung jumlah TP ter-generate
  const totalTps = editedProta 
    ? (editedProta.semester1?.length || 0) + (editedProta.semester2?.length || 0)
    : 0;
  
  const completedCount = Object.values(completedTps).filter(Boolean).length;

  // Handler simpan editan manual Prota
  const handleSaveProtaEdits = async () => {
    if (!editedProta) return;
    const jsonStr = JSON.stringify(editedProta);
    const updatedRecord: ModulRecord = {
      ...record,
      protaJson: jsonStr
    };
    onSaveRecord(updatedRecord);
    setIsEditingProta(false);
  };

  // Handler ubah field Prota
  const handleProtaFieldChange = (semester: "semester1" | "semester2", index: number, field: string, value: any) => {
    if (!editedProta) return;
    const updatedSemester = [...editedProta[semester]];
    updatedSemester[index] = {
      ...updatedSemester[index],
      [field]: value
    };
    setEditedProta({
      ...editedProta,
      [semester]: updatedSemester
    });
  };

  return (
    <div className="flex flex-col h-full bg-white border-2 border-slate-800 rounded-2xl shadow-[3.5px_3.5px_0px_0px_rgba(30,41,59,1)] overflow-hidden">
      {/* Sub tabs navigation */}
      <div className="flex flex-wrap border-b-2 border-slate-800 bg-[#FAF8F5] p-2 gap-2">
        <button
          onClick={() => setSubTab("prota")}
          className={`px-3 py-1.5 text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold transition-all border-2 rounded-xl flex items-center gap-1.5 cursor-pointer ${
            subTab === "prota"
              ? "bg-brand-yellow border-slate-800 text-slate-900 shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]"
              : "bg-white border-transparent text-slate-600 hover:text-brand-yellow hover:border-slate-800"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          1. Program Tahunan (PROTA)
        </button>
        <button
          onClick={() => setSubTab("kktp")}
          className={`px-3 py-1.5 text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold transition-all border-2 rounded-xl flex items-center gap-1.5 cursor-pointer ${
            subTab === "kktp"
              ? "bg-brand-yellow border-slate-800 text-slate-900 shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]"
              : "bg-white border-transparent text-slate-600 hover:text-brand-yellow hover:border-slate-800"
          }`}
        >
          <CheckCircle className="h-3.5 w-3.5" />
          2. KKTP Kurikulum Merdeka
        </button>
        <button
          onClick={() => setSubTab("promes")}
          className={`px-3 py-1.5 text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold transition-all border-2 rounded-xl flex items-center gap-1.5 cursor-pointer ${
            subTab === "promes"
              ? "bg-brand-yellow border-slate-800 text-slate-900 shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]"
              : "bg-white border-transparent text-slate-600 hover:text-brand-yellow hover:border-slate-800"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          3. Program Semester (PROMES)
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-brand-cream/5">
        {/* ===================================== SUB TAB: PROTA ===================================== */}
        {subTab === "prota" && (
          <div className="flex flex-col gap-5 h-full">
            {/* Bagian Atas: Konfigurasi Kalender Akademik & Alokasi Waktu */}
            <div className="bg-white border-2 border-slate-800 rounded-2xl p-4 sm:p-5 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand-teal" />
                  <h4 className="font-display font-black text-xs uppercase text-slate-900">Konfigurasi Kalender Akademik & Alokasi Waktu</h4>
                </div>
                {/* Referensi ringkas Mapel */}
                <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-600 font-semibold">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-full">Mapel: {record.mapel}</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-full">Kelas {record.kelas} ({record.fase})</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">JP per Minggu</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={jpPerMinggu}
                    onChange={(e) => setJpPerMinggu(Number(e.target.value))}
                    className="w-full bg-[#FAF8F5] border-2 border-slate-800 rounded-xl p-2 px-3 font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Minggu Efektif Smt 1</label>
                  <input
                    type="number"
                    min={1}
                    max={26}
                    value={mingguEfektifSem1}
                    onChange={(e) => setMingguEfektifSem1(Number(e.target.value))}
                    className="w-full bg-[#FAF8F5] border-2 border-slate-800 rounded-xl p-2 px-3 font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Minggu Efektif Smt 2</label>
                  <input
                    type="number"
                    min={1}
                    max={26}
                    value={mingguEfektifSem2}
                    onChange={(e) => setMingguEfektifSem2(Number(e.target.value))}
                    className="w-full bg-[#FAF8F5] border-2 border-slate-800 rounded-xl p-2 px-3 font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Mulai Semester 1</label>
                  <input
                    type="date"
                    value={mulaiSem1}
                    onChange={(e) => setMulaiSem1(e.target.value)}
                    className="w-full bg-[#FAF8F5] border-2 border-slate-800 rounded-xl p-1.5 font-mono text-[11px] text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Mulai Semester 2</label>
                  <input
                    type="date"
                    value={mulaiSem2}
                    onChange={(e) => setMulaiSem2(e.target.value)}
                    className="w-full bg-[#FAF8F5] border-2 border-slate-800 rounded-xl p-1.5 font-mono text-[11px] text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-2 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5 text-brand-teal" />
                    <span>Total Alokasi Efektif:</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-brand-teal/10 border border-brand-teal/20 text-brand-teal font-extrabold px-3 py-1 rounded-lg">Semester 1: {totalJpSem1} JP</span>
                    <span className="bg-brand-teal/10 border border-brand-teal/20 text-brand-teal font-extrabold px-3 py-1 rounded-lg">Semester 2: {totalJpSem2} JP</span>
                  </div>
                </div>

                <button
                  onClick={() => onGenerateProta(jpPerMinggu, mingguEfektifSem1, mingguEfektifSem2, mulaiSem1, mulaiSem2)}
                  disabled={protaGenerating}
                  className="bg-brand-teal hover:bg-brand-teal/90 text-white font-extrabold text-xs uppercase tracking-wider py-2.5 px-6 rounded-xl border-2 border-slate-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {protaGenerating ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Menyusun Prota...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Susun Prota Otomatis</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Rincian PROTA */}
            <div className="flex-1 flex flex-col h-full">
              {protaGenerating ? (
                <div className="bg-white border-2 border-slate-800 rounded-2xl p-8 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                  <div className="relative mb-6">
                    <div className="bg-brand-teal p-5 rounded-full text-white border-2 border-slate-800 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] animate-bounce">
                      <Calendar className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-brand-yellow text-slate-900 p-2 rounded-full border-2 border-slate-800 animate-pulse">
                      <Sparkles className="h-4 w-4 text-slate-900" />
                    </div>
                  </div>
                  <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wider">
                    AI Sedang Menyusun Program Tahunan...
                  </h3>
                  <p className="text-slate-600 text-xs max-w-sm mt-3 leading-relaxed font-sans font-semibold">
                    Kecerdasan buatan sedang menganalisis CP mata pelajaran, mendistribusikan alokasi JP per topik, merumuskan alur tujuan pembelajaran, dan menyelaraskan Dimensi Profil Pelajar Pancasila untuk program satu tahun ajaran penuh.
                  </p>
                </div>
              ) : editedProta ? (
                <div className="flex flex-col h-full w-full">
                  {/* Prota Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center flex-1">
                      <h2 className="font-extrabold text-lg">PROGRAM TAHUNAN</h2>
                      <p className="text-sm text-muted-foreground">{profile?.sekolah || "Sekolah Indonesia"}</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        <span>{record.mapel}</span>
                        <span> | Kelas {record.kelas}</span>
                        <span> | Fase {record.fase}</span>
                        {profile?.tahun && <span> | TA {profile.tahun}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar container */}
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-foreground/10">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-muted-foreground">Progress Modul Ajar</span>
                      <span className="text-xs font-bold text-primary">{completedCount}/{totalTps} TP</span>
                    </div>
                    <div aria-valuemax={100} aria-valuemin={0} role="progressbar" className="relative w-full overflow-hidden rounded-full bg-secondary h-2">
                      <div 
                        className="h-full bg-primary transition-all duration-500" 
                        style={{ width: `${totalTps > 0 ? (completedCount / totalTps) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex justify-end gap-2 mb-4">
                    {isEditingProta ? (
                      <button
                        onClick={handleSaveProtaEdits}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 border-2 border-foreground shadow-brutal-sm text-xs cursor-pointer"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Simpan Perubahan
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsEditingProta(true)}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 border-2 border-foreground shadow-brutal-sm text-xs cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-pen-line w-4 h-4 mr-1"><path d="M12 20h9"></path><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"></path></svg>
                          Edit
                        </button>
                        {onDownload && (
                          <button
                            onClick={() => onDownload("perencanaan", "prota")}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 border-2 border-foreground shadow-brutal-sm text-xs cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-file-down w-4 h-4 mr-1"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M12 18v-6"></path><path d="m9 15 3 3 3-3"></path></svg>
                            Download Prota (.docx)
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Tables Container */}
                  <div className="space-y-6 flex-1">
                    {/* Semester 1 Table */}
                    <div>
                      <h3 className="font-bold text-sm bg-primary/10 text-primary px-3 py-2 rounded-t-lg border-2 border-foreground/20 border-b-0">SEMESTER 1</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-2 border-foreground/20">
                          <thead>
                            <tr className="bg-[#0D7C8F] text-white">
                              <th className="border border-foreground/20 px-2 py-2 w-8">✓</th>
                              <th className="border border-foreground/20 px-2 py-2 w-8">No</th>
                              <th className="border border-foreground/20 px-2 py-2">Bab / Unit</th>
                              <th className="border border-foreground/20 px-2 py-2">Tujuan Pembelajaran</th>
                              <th className="border border-foreground/20 px-2 py-2">Materi Pokok</th>
                              <th className="border border-foreground/20 px-2 py-2 w-14">JP</th>
                              <th className="border border-foreground/20 px-2 py-2">Dimensi Profil Lulusan</th>
                              <th className="border border-foreground/20 px-2 py-2">Keterangan</th>
                              <th className="border border-foreground/20 px-2 py-2 w-24">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {editedProta.semester1?.map((row: any, idx: number) => (
                              <tr key={`sem1-${idx}`} className={`hover:bg-muted/50 ${completedTps[row.no] ? "bg-emerald-50/40 line-through text-slate-400" : ""}`}>
                                <td className="border border-foreground/20 px-2 py-2 text-center">
                                  <button onClick={() => handleToggleTp(row.no)} className="cursor-pointer text-slate-700 hover:text-brand-teal transition-all">
                                    {completedTps[row.no] ? (
                                      <CheckSquare className="h-4 w-4 text-brand-teal mx-auto" />
                                    ) : (
                                      <Square className="h-4 w-4 mx-auto" />
                                    )}
                                  </button>
                                </td>
                                <td className="border border-foreground/20 px-2 py-2 text-center font-bold">{row.no}</td>
                                <td className="border border-foreground/20 px-2 py-2 font-semibold">
                                  {isEditingProta ? (
                                    <input
                                      type="text"
                                      value={row.bab || ""}
                                      onChange={(e) => handleProtaFieldChange("semester1", idx, "bab", e.target.value)}
                                      className="w-full bg-[#FAF8F5] border border-slate-300 rounded p-1 font-sans text-[10px] focus:outline-none"
                                    />
                                  ) : (
                                    row.bab || ""
                                  )}
                                </td>
                                <td className="border border-foreground/20 px-2 py-2">
                                  {isEditingProta ? (
                                    <textarea
                                      value={row.tp}
                                      onChange={(e) => handleProtaFieldChange("semester1", idx, "tp", e.target.value)}
                                      className="w-full bg-[#FAF8F5] border border-slate-300 rounded p-1 font-sans text-[10px] focus:outline-none"
                                      rows={2}
                                    />
                                  ) : (
                                    row.tp
                                  )}
                                </td>
                                <td className="border border-foreground/20 px-2 py-2 font-semibold">
                                  {isEditingProta ? (
                                    <input
                                      type="text"
                                      value={row.materi}
                                      onChange={(e) => handleProtaFieldChange("semester1", idx, "materi", e.target.value)}
                                      className="w-full bg-[#FAF8F5] border border-slate-300 rounded p-1 font-sans text-[10px] focus:outline-none"
                                    />
                                  ) : (
                                    row.materi
                                  )}
                                </td>
                                <td className="border border-foreground/20 px-2 py-2 text-center font-bold">
                                  {isEditingProta ? (
                                    <input
                                      type="number"
                                      value={row.jp}
                                      onChange={(e) => handleProtaFieldChange("semester1", idx, "jp", Number(e.target.value))}
                                      className="w-12 bg-[#FAF8F5] border border-slate-300 rounded p-1 font-mono text-[10px] text-center focus:outline-none"
                                    />
                                  ) : (
                                    row.jp
                                  )}
                                </td>
                                <td className="border border-foreground/20 px-2 py-2">
                                  {isEditingProta ? (
                                    <input
                                      type="text"
                                      value={row.dpl}
                                      onChange={(e) => handleProtaFieldChange("semester1", idx, "dpl", e.target.value)}
                                      className="w-full bg-[#FAF8F5] border border-slate-300 rounded p-1 font-sans text-[10px] focus:outline-none"
                                    />
                                  ) : (
                                    row.dpl
                                  )}
                                </td>
                                <td className="border border-foreground/20 px-2 py-2">
                                  {isEditingProta ? (
                                    <input
                                      type="text"
                                      value={row.keterangan || ""}
                                      onChange={(e) => handleProtaFieldChange("semester1", idx, "keterangan", e.target.value)}
                                      className="w-full bg-[#FAF8F5] border border-slate-300 rounded p-1 font-sans text-[10px] focus:outline-none"
                                    />
                                  ) : (
                                    row.keterangan || ""
                                  )}
                                </td>
                                <td className="border border-foreground/20 px-2 py-2 text-center">
                                  <button
                                    onClick={() => onSelectTpRow(row.tp, row.materi, "Semester 1")}
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background hover:text-accent-foreground rounded-md h-6 text-[10px] px-2 border-primary/50 text-primary hover:bg-primary/10 cursor-pointer mx-auto"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-file-text w-3 h-3 mr-1"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
                                    Buat Modul
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-right w-3 h-3 ml-1"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                                  </button>
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-muted/30 font-bold">
                              <td colSpan={5} className="border border-foreground/20 px-2 py-2 text-right">Total JP Semester 1</td>
                              <td className="border border-foreground/20 px-2 py-2 text-center">
                                {editedProta.semester1?.reduce((acc: number, x: any) => acc + (Number(x.jp) || 0), 0)}
                              </td>
                              <td colSpan={3} className="border border-foreground/20 px-2 py-2"></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Semester 2 Table */}
                    <div>
                      <h3 className="font-bold text-sm bg-primary/10 text-primary px-3 py-2 rounded-t-lg border-2 border-foreground/20 border-b-0">SEMESTER 2</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-2 border-foreground/20">
                          <thead>
                            <tr className="bg-[#0D7C8F] text-white">
                              <th className="border border-foreground/20 px-2 py-2 w-8">✓</th>
                              <th className="border border-foreground/20 px-2 py-2 w-8">No</th>
                              <th className="border border-foreground/20 px-2 py-2">Bab / Unit</th>
                              <th className="border border-foreground/20 px-2 py-2">Tujuan Pembelajaran</th>
                              <th className="border border-foreground/20 px-2 py-2">Materi Pokok</th>
                              <th className="border border-foreground/20 px-2 py-2 w-14">JP</th>
                              <th className="border border-foreground/20 px-2 py-2">Dimensi Profil Lulusan</th>
                              <th className="border border-foreground/20 px-2 py-2">Keterangan</th>
                              <th className="border border-foreground/20 px-2 py-2 w-24">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {editedProta.semester2?.map((row: any, idx: number) => (
                              <tr key={`sem2-${idx}`} className={`hover:bg-muted/50 ${completedTps[row.no] ? "bg-emerald-50/40 line-through text-slate-400" : ""}`}>
                                <td className="border border-foreground/20 px-2 py-2 text-center">
                                  <button onClick={() => handleToggleTp(row.no)} className="cursor-pointer text-slate-700 hover:text-brand-teal transition-all">
                                    {completedTps[row.no] ? (
                                      <CheckSquare className="h-4 w-4 text-brand-teal mx-auto" />
                                    ) : (
                                      <Square className="h-4 w-4 mx-auto" />
                                    )}
                                  </button>
                                </td>
                                <td className="border border-foreground/20 px-2 py-2 text-center font-bold">{row.no}</td>
                                <td className="border border-foreground/20 px-2 py-2 font-semibold">
                                  {isEditingProta ? (
                                    <input
                                      type="text"
                                      value={row.bab || ""}
                                      onChange={(e) => handleProtaFieldChange("semester2", idx, "bab", e.target.value)}
                                      className="w-full bg-[#FAF8F5] border border-slate-300 rounded p-1 font-sans text-[10px] focus:outline-none"
                                    />
                                  ) : (
                                    row.bab || ""
                                  )}
                                </td>
                                <td className="border border-foreground/20 px-2 py-2">
                                  {isEditingProta ? (
                                    <textarea
                                      value={row.tp}
                                      onChange={(e) => handleProtaFieldChange("semester2", idx, "tp", e.target.value)}
                                      className="w-full bg-[#FAF8F5] border border-slate-300 rounded p-1 font-sans text-[10px] focus:outline-none"
                                      rows={2}
                                    />
                                  ) : (
                                    row.tp
                                  )}
                                </td>
                                <td className="border border-foreground/20 px-2 py-2 font-semibold">
                                  {isEditingProta ? (
                                    <input
                                      type="text"
                                      value={row.materi}
                                      onChange={(e) => handleProtaFieldChange("semester2", idx, "materi", e.target.value)}
                                      className="w-full bg-[#FAF8F5] border border-slate-300 rounded p-1 font-sans text-[10px] focus:outline-none"
                                    />
                                  ) : (
                                    row.materi
                                  )}
                                </td>
                                <td className="border border-foreground/20 px-2 py-2 text-center font-bold">
                                  {isEditingProta ? (
                                    <input
                                      type="number"
                                      value={row.jp}
                                      onChange={(e) => handleProtaFieldChange("semester2", idx, "jp", Number(e.target.value))}
                                      className="w-12 bg-[#FAF8F5] border border-slate-300 rounded p-1 font-mono text-[10px] text-center focus:outline-none"
                                    />
                                  ) : (
                                    row.jp
                                  )}
                                </td>
                                <td className="border border-foreground/20 px-2 py-2">
                                  {isEditingProta ? (
                                    <input
                                      type="text"
                                      value={row.dpl}
                                      onChange={(e) => handleProtaFieldChange("semester2", idx, "dpl", e.target.value)}
                                      className="w-full bg-[#FAF8F5] border border-slate-300 rounded p-1 font-sans text-[10px] focus:outline-none"
                                    />
                                  ) : (
                                    row.dpl
                                  )}
                                </td>
                                <td className="border border-foreground/20 px-2 py-2">
                                  {isEditingProta ? (
                                    <input
                                      type="text"
                                      value={row.keterangan || ""}
                                      onChange={(e) => handleProtaFieldChange("semester2", idx, "keterangan", e.target.value)}
                                      className="w-full bg-[#FAF8F5] border border-slate-300 rounded p-1 font-sans text-[10px] focus:outline-none"
                                    />
                                  ) : (
                                    row.keterangan || ""
                                  )}
                                </td>
                                <td className="border border-foreground/20 px-2 py-2 text-center">
                                  <button
                                    onClick={() => onSelectTpRow(row.tp, row.materi, "Semester 2")}
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background hover:text-accent-foreground rounded-md h-6 text-[10px] px-2 border-primary/50 text-primary hover:bg-primary/10 cursor-pointer mx-auto"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-file-text w-3 h-3 mr-1"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
                                    Buat Modul
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-right w-3 h-3 ml-1"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                                  </button>
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-muted/30 font-bold">
                              <td colSpan={5} className="border border-foreground/20 px-2 py-2 text-right">Total JP Semester 2</td>
                              <td className="border border-foreground/20 px-2 py-2 text-center">
                                {editedProta.semester2?.reduce((acc: number, x: any) => acc + (Number(x.jp) || 0), 0)}
                              </td>
                              <td colSpan={3} className="border border-foreground/20 px-2 py-2"></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Signatures section preview */}
                    <div className="mt-6 text-xs text-muted-foreground grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-bold">Penyusun,</p>
                        <p className="mt-8">{profile?.guru || "Rudy Susanto, S.Pd"}</p>
                        <p>NIP. {profile?.nipGuru || "199505052023211010"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">Mengetahui,</p>
                        <p>Kepala Sekolah</p>
                        <p className="mt-8">{profile?.kepsek || "Budi Raharjo, S.Pd., M.Si"}</p>
                        {profile?.nipKepsek && <p>NIP. {profile.nipKepsek}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border-2 border-slate-800 rounded-2xl p-8 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                  <Calendar className="h-10 w-10 text-brand-yellow mb-3 animate-pulse" />
                  <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wider">
                    Program Tahunan Belum Disusun
                  </h3>
                  <p className="text-slate-500 text-xs mt-1.5 max-w-sm font-sans font-medium">
                    Atur kalender pendidikan di sebelah kiri lalu klik tombol "Susun Prota Otomatis" agar AI merumuskan perencanaan satu tahun ajaran penuh berdasarkan Kurikulum Merdeka.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================== SUB TAB: KKTP ===================================== */}
        {subTab === "kktp" && (
          <div className="flex flex-col h-full text-xs">
            <div className="bg-white border-2 border-slate-800 rounded-2xl p-5 mb-5 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <CheckCircle className="h-4 w-4 text-brand-teal" />
                <h4 className="font-display font-black text-xs uppercase text-slate-900">Setting Penilaian KKTP (Kriteria Ketercapaian Tujuan Pembelajaran)</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Option 1: Deskripsi Kriteria */}
                <button
                  onClick={() => setKktpOption("deskripsi")}
                  className={`p-3 border-2 rounded-xl text-left transition-all flex flex-col justify-between cursor-pointer ${
                    kktpOption === "deskripsi"
                      ? "bg-brand-teal/5 border-brand-teal shadow-[2px_2px_0px_0px_rgba(89,178,146,1)]"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-800"
                  }`}
                >
                  <div>
                    <h5 className="font-black text-[11px] text-slate-900 uppercase tracking-wide mb-1">1. Deskripsi Kriteria</h5>
                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                      Menentukan ketercapaian dengan mengidentifikasi kriteria-kriteria penting dan memberikan deskripsi apakah murid "Memadai" atau "Tidak Memadai".
                    </p>
                  </div>
                  <span className="mt-3 text-[9px] font-mono text-brand-teal font-extrabold tracking-widest uppercase">Pilih Metode</span>
                </button>

                {/* Option 2: Rubrik */}
                <button
                  onClick={() => setKktpOption("rubrik")}
                  className={`p-3 border-2 rounded-xl text-left transition-all flex flex-col justify-between cursor-pointer ${
                    kktpOption === "rubrik"
                      ? "bg-brand-teal/5 border-brand-teal shadow-[2px_2px_0px_0px_rgba(89,178,146,1)]"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-800"
                  }`}
                >
                  <div>
                    <h5 className="font-black text-[11px] text-slate-900 uppercase tracking-wide mb-1">2. Rubrik Pembelajaran</h5>
                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                      Menggunakan kriteria berjenjang (Baru Berkembang, Layak, Cakap, Mahir) untuk menilai kualitas bukti kinerja hasil belajar murid.
                    </p>
                  </div>
                  <span className="mt-3 text-[9px] font-mono text-brand-teal font-extrabold tracking-widest uppercase">Pilih Metode</span>
                </button>

                {/* Option 3: Interval Nilai */}
                <button
                  onClick={() => setKktpOption("interval")}
                  className={`p-3 border-2 rounded-xl text-left transition-all flex flex-col justify-between cursor-pointer ${
                    kktpOption === "interval"
                      ? "bg-brand-teal/5 border-brand-teal shadow-[2px_2px_0px_0px_rgba(89,178,146,1)]"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-800"
                  }`}
                >
                  <div>
                    <h5 className="font-black text-[11px] text-slate-900 uppercase tracking-wide mb-1">3. Interval Nilai (KKTP Kuantitatif)</h5>
                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                      Menentukan ketuntasan menggunakan persentase nilai tes/tugas dengan kriteria interval (misal: 0-40% belum mencapai, 41-70% remedial, dll.).
                    </p>
                  </div>
                  <span className="mt-3 text-[9px] font-mono text-brand-teal font-extrabold tracking-widest uppercase">Pilih Metode</span>
                </button>
              </div>

              {/* Generate button for active TP */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1 text-slate-600">
                  <p className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">Tujuan Pembelajaran (TP) Aktif:</p>
                  <p className="font-extrabold text-slate-900 mt-0.5 max-w-2xl leading-relaxed">{record.tp}</p>
                </div>
                <button
                  onClick={() => onGenerateKktp(record.tp, kktpOption)}
                  disabled={kktpGenerating}
                  className="w-full sm:w-auto bg-brand-teal hover:bg-brand-teal/90 text-white font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-6 rounded-xl border-2 border-slate-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {kktpGenerating ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Merumuskan KKTP...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Rumuskan KKTP dengan AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* KKTP Content Render */}
            <div className="bg-white p-10 sm:p-14 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] border border-slate-200 rounded-lg flex-1 min-h-[500px]">
              {kktpGenerating ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal mb-4"></div>
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">AI sedang menyusun kriteria penilaian (KKTP)...</h4>
                  <p className="text-slate-500 text-[10px] max-w-xs mt-1.5 font-sans font-semibold">
                    Menyusun deskripsi ketercapaian, tabel rubrik operasional lengkap, dan petunjuk rencana tindak lanjut sesuai kaidah Kurikulum Merdeka.
                  </p>
                </div>
              ) : record.kktpHtml ? (
                <div
                  className="preview-area leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: record.kktpHtml }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCircle className="h-10 w-10 text-brand-yellow mb-3 animate-pulse" />
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Kriteria KKTP Belum Dirumuskan</h4>
                  <p className="text-slate-500 text-[10px] max-w-xs mt-1.5 font-sans font-semibold">
                    Pilih salah satu metode penentuan KKTP di atas, lalu klik tombol "Rumuskan KKTP dengan AI" untuk membuat instrumen pencapaian belajar siswa.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================== SUB TAB: PROMES ===================================== */}
        {subTab === "promes" && (
          <div className="flex flex-col h-full text-xs">
            <div className="bg-white border-2 border-slate-800 rounded-2xl p-5 mb-5 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand-teal" />
                  <h4 className="font-display font-black text-xs uppercase text-slate-900">Konfigurasi Event & Libur</h4>
                </div>
                {/* Semester selection */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 border-2 border-slate-800 rounded-xl shadow-[1px_1px_0px_0px_rgba(30,41,59,1)]">
                  <button
                    type="button"
                    onClick={() => setPromesSemester("1")}
                    className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-lg cursor-pointer transition-all ${
                      promesSemester === "1" ? "bg-brand-teal border border-slate-800 text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Sem 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromesSemester("2")}
                    className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-lg cursor-pointer transition-all ${
                      promesSemester === "2" ? "bg-brand-teal border border-slate-800 text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Sem 2
                  </button>
                </div>
              </div>

              <div>
                <h5 className="font-black text-slate-400 text-[10px] uppercase tracking-wider mb-3">DAFTAR EVENT / LIBUR</h5>
                
                {/* Header labels */}
                <div className="hidden sm:grid grid-cols-12 gap-3 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <div className="col-span-4">NAMA EVENT</div>
                  <div className="col-span-2">SEMESTER</div>
                  <div className="col-span-2">BULAN</div>
                  <div className="col-span-1">MINGGU</div>
                  <div className="col-span-2">TIPE</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Event list rows */}
                <div className="flex flex-col gap-2.5">
                  {promesEvents.map((evt) => (
                    <div key={evt.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-slate-50/50 p-3 sm:p-0 rounded-xl sm:bg-transparent">
                      {/* Name Event */}
                      <div className="col-span-1 sm:col-span-4">
                        <input
                          type="text"
                          value={evt.name}
                          onChange={(e) => handleChangePromesEvent(evt.id, "name", e.target.value)}
                          placeholder="Masukkan nama event (misal: PTS Semester 1)"
                          className="w-full bg-[#FAF8F5] border-2 border-slate-100 rounded-xl p-2.5 px-4 text-xs font-bold text-slate-700 focus:border-slate-800 focus:outline-none transition-all placeholder-slate-400"
                        />
                      </div>

                      {/* Semester Select */}
                      <div className="col-span-1 sm:col-span-2">
                        <select
                          value={evt.semester}
                          onChange={(e) => handleChangePromesEvent(evt.id, "semester", e.target.value as any)}
                          className="w-full bg-[#FAF8F5] border-2 border-slate-100 rounded-xl p-2.5 px-2 text-xs font-bold text-slate-700 focus:border-slate-800 focus:outline-none cursor-pointer transition-all"
                        >
                          <option value="Sem 1">Sem 1</option>
                          <option value="Sem 2">Sem 2</option>
                        </select>
                      </div>

                      {/* Bulan Select */}
                      <div className="col-span-1 sm:col-span-2">
                        <select
                          value={evt.bulan}
                          onChange={(e) => handleChangePromesEvent(evt.id, "bulan", e.target.value as any)}
                          className="w-full bg-[#FAF8F5] border-2 border-slate-100 rounded-xl p-2.5 px-2 text-xs font-bold text-slate-700 focus:border-slate-800 focus:outline-none cursor-pointer transition-all"
                        >
                          {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"].map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      {/* Minggu Select */}
                      <div className="col-span-1 sm:col-span-1">
                        <select
                          value={evt.minggu}
                          onChange={(e) => handleChangePromesEvent(evt.id, "minggu", e.target.value as any)}
                          className="w-full bg-[#FAF8F5] border-2 border-slate-100 rounded-xl p-2.5 px-2 text-xs font-bold text-slate-700 focus:border-slate-800 focus:outline-none cursor-pointer transition-all"
                        >
                          {["W1", "W2", "W3", "W4", "W5"].map((w) => (
                            <option key={w} value={w}>{w}</option>
                          ))}
                        </select>
                      </div>

                      {/* Tipe Select */}
                      <div className="col-span-1 sm:col-span-2">
                        <select
                          value={evt.tipe}
                          onChange={(e) => handleChangePromesEvent(evt.id, "tipe", e.target.value as any)}
                          className="w-full bg-[#FAF8F5] border-2 border-slate-100 rounded-xl p-2.5 px-2 text-xs font-bold text-slate-700 focus:border-slate-800 focus:outline-none cursor-pointer transition-all"
                        >
                          <option value="PTS">PTS</option>
                          <option value="PAS">PAS</option>
                          <option value="Libur">Libur</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>

                      {/* Delete Button */}
                      <div className="col-span-1 sm:col-span-1 flex justify-end sm:justify-center">
                        <button
                          type="button"
                          onClick={() => handleDeletePromesEvent(evt.id)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Hapus Event"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tambah Event Button */}
                <button
                  type="button"
                  onClick={handleAddPromesEvent}
                  className="mt-3 flex items-center gap-1.5 px-3.5 py-2 border-2 border-dashed border-slate-300 hover:border-slate-800 text-slate-600 hover:text-slate-900 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all bg-white hover:bg-slate-50 cursor-pointer shadow-[1px_1px_0px_0px_rgba(30,41,59,1)] active:translate-y-0.5 active:shadow-none"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Event</span>
                </button>
              </div>

              {/* Stats Bar */}
              <div className="bg-[#FAF8F5] border border-slate-200 rounded-xl p-3 px-4 font-mono font-bold text-slate-500 text-[10px] sm:text-xs">
                Prota: <span className="text-slate-800">{totalTps} TP</span> | Sem 1: <span className="text-slate-800">{totalJpSem1} JP</span> | Sem 2: <span className="text-slate-800">{totalJpSem2} JP</span> | JP/Minggu: <span className="text-slate-800">{jpPerMinggu}</span>
              </div>

              {/* Generate Button */}
              <button
                type="button"
                onClick={() => onGeneratePromes(record.protaJson || "", promesSemester, promesEvents)}
                disabled={promesGenerating || !record.protaJson}
                className="w-full bg-[#d25324] hover:bg-[#c2410c] text-white font-extrabold text-[10px] uppercase tracking-wider py-3.5 px-6 rounded-xl border-2 border-slate-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {promesGenerating ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Memetakan Program Semester...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Generate Program Semester</span>
                  </>
                )}
              </button>

              {!record.protaJson && (
                <div className="bg-amber-50 border border-amber-300 text-amber-800 rounded-xl p-3 mt-1 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-semibold leading-relaxed">
                    <strong>Penting:</strong> Promes dipetakan dari Program Tahunan (PROTA). Silakan klik sub-tab <strong>1. Program Tahunan</strong> di atas dan klik <strong>Susun Prota Otomatis</strong> terlebih dahulu sebelum membuat program semester.
                  </p>
                </div>
              )}
            </div>

            {/* Promes Content Render */}
            <div className="bg-white p-8 sm:p-12 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] border border-slate-200 rounded-lg flex-1 min-h-[500px] overflow-x-auto">
              {promesGenerating ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal mb-4"></div>
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">AI sedang memetakan rencana program semester...</h4>
                  <p className="text-slate-500 text-[10px] max-w-xs mt-1.5 font-sans font-semibold">
                    Mendistribusikan materi pokok dari prota ke dalam kalender mingguan bulanan secara otomatis dengan sinkronisasi waktu dan alur belajar.
                  </p>
                </div>
              ) : record.promesHtml ? (
                <div
                  className="preview-area leading-relaxed min-w-[1100px]"
                  dangerouslySetInnerHTML={{ __html: record.promesHtml }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Clock className="h-10 w-10 text-brand-yellow mb-3 animate-pulse" />
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Rencana Promes Belum Dibuat</h4>
                  <p className="text-slate-500 text-[10px] max-w-xs mt-1.5 font-sans font-semibold">
                    Klik tombol "Jadwalkan Promes dengan AI" di atas untuk memetakan alokasi JP per TP ke dalam kalender belajar mingguan untuk Semester {promesSemester}.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
