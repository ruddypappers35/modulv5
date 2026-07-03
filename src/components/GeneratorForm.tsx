import React, { useEffect, useState } from "react";
import { BookOpen, Sparkles, HelpCircle, ArrowRight, List, Trash } from "lucide-react";
import { CurriculumBab, GuruProfile } from "../types";
import { POPULAR_CURRICULUM } from "../data";

interface GeneratorFormProps {
  profile: GuruProfile | null;
  onSubmit: (formData: any) => void;
  onSuggestCP: () => Promise<string>;
  onSuggestTP: () => Promise<string>;
  onSuggestMateri: () => void;
  onSuggestMethodology: () => Promise<{ model: string; metode: string[]; dpl: string[]; nilaiKarakter: string[] }>;
  isGenerating: boolean;
  formValues: {
    kelas: string;
    fase: string;
    semester: string;
    mapel: string;
    topik: string;
    cp: string;
    tp: string;
    waktu: string;
    model: string;
    metode: string[];
    dpl: string[];
    nilaiKarakter: string[];
  };
  setFormValues: React.Dispatch<React.SetStateAction<any>>;
}

export const GeneratorForm: React.FC<GeneratorFormProps> = ({
  profile,
  onSubmit,
  onSuggestCP,
  onSuggestTP,
  onSuggestMateri,
  onSuggestMethodology,
  isGenerating,
  formValues,
  setFormValues
}) => {
  const [cpLoading, setCpLoading] = useState(false);
  const [tpLoading, setTpLoading] = useState(false);

  // Auto mapper Fase based on Kelas
  useEffect(() => {
    if (formValues.kelas) {
      const kelasVal = parseInt(formValues.kelas);
      let fase = "";
      if (kelasVal === 1 || kelasVal === 2) fase = "Fase A";
      else if (kelasVal === 3 || kelasVal === 4) fase = "Fase B";
      else if (kelasVal === 5 || kelasVal === 6) fase = "Fase C";
      else if (kelasVal >= 7 && kelasVal <= 9) fase = "Fase D";
      else if (kelasVal === 10) fase = "Fase E";
      else if (kelasVal === 11 || kelasVal === 12) fase = "Fase F";

      setFormValues((prev: any) => ({ ...prev, fase }));
    }
  }, [formValues.kelas, setFormValues]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormValues((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleAISuggestCP = async () => {
    setCpLoading(true);
    try {
      const cpText = await onSuggestCP();
      setFormValues((prev: any) => ({ ...prev, cp: cpText }));
    } catch (e) {
      console.error(e);
    } finally {
      setCpLoading(false);
    }
  };

  const handleAISuggestTP = async () => {
    setTpLoading(true);
    try {
      const tpText = await onSuggestTP();
      setFormValues((prev: any) => ({ ...prev, tp: tpText }));
    } catch (e) {
      console.error(e);
    } finally {
      setTpLoading(false);
    }
  };

  const [methodologyLoading, setMethodologyLoading] = useState(false);

  const handleToggleMetode = (item: string) => {
    const current = formValues.metode || [];
    const updated = current.includes(item)
      ? current.filter((m: string) => m !== item)
      : [...current, item];
    setFormValues((prev: any) => ({ ...prev, metode: updated }));
  };

  const handleToggleDPL = (item: string) => {
    const current = formValues.dpl || [];
    const updated = current.includes(item)
      ? current.filter((d: string) => d !== item)
      : [...current, item];
    setFormValues((prev: any) => ({ ...prev, dpl: updated }));
  };

  const handleToggleNilaiKarakter = (item: string) => {
    const current = formValues.nilaiKarakter || [];
    const updated = current.includes(item)
      ? current.filter((nk: string) => nk !== item)
      : [...current, item];
    setFormValues((prev: any) => ({ ...prev, nilaiKarakter: updated }));
  };

  const handleAISuggestMethodology = async () => {
    setMethodologyLoading(true);
    try {
      const data = await onSuggestMethodology();
      setFormValues((prev: any) => ({
        ...prev,
        model: data.model || prev.model || "Problem Based Learning (PBL)",
        metode: data.metode && data.metode.length > 0 ? data.metode : prev.metode,
        dpl: data.dpl && data.dpl.length > 0 ? data.dpl : prev.dpl,
        nilaiKarakter: data.nilaiKarakter && data.nilaiKarakter.length > 0 ? data.nilaiKarakter : prev.nilaiKarakter
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setMethodologyLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formValues);
  };

  const clearForm = () => {
    if (confirm("Kosongkan semua inputan form?")) {
      setFormValues({
        kelas: "",
        fase: "",
        semester: "",
        mapel: profile?.mapel || "",
        topik: "",
        cp: "",
        tp: "",
        waktu: "",
        model: "",
        metode: [],
        dpl: [],
        nilaiKarakter: []
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-slate-800 shadow-[3.5px_3.5px_0px_0px_rgba(30,41,59,1)] h-fit">
      <div className="flex justify-between items-center mb-5 pb-3 border-b-2 border-slate-800">
        <h2 className="text-sm font-display font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-yellow animate-pulse" />
          Data Modul Ajar
        </h2>
        <button
          type="button"
          onClick={clearForm}
          className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wider hover:text-brand-rose hover:bg-brand-rose/10 px-2 py-1 border border-transparent hover:border-slate-800 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
          title="Reset Form"
        >
          <Trash className="h-3.5 w-3.5" />
          <span>Reset</span>
        </button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        {/* Kelas & Fase */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold mb-1 font-sans" htmlFor="kelas">
              Kelas
            </label>
            <select
              id="kelas"
              value={formValues.kelas}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl focus:outline-none focus:ring-0 focus:border-slate-800 focus:shadow-[2px_2px_0px_0px_#59B292] shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,0.15)] transition-all text-sm font-medium"
              required
            >
              <option value="" disabled>Pilih...</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((k) => (
                <option key={k} value={k}>
                  Kelas {k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold mb-1 font-sans" htmlFor="fase">
              Fase
            </label>
            <input
              id="fase"
              type="text"
              value={formValues.fase}
              placeholder="Otomatis"
              className="w-full px-3 py-2 bg-brand-cream/10 border-2 border-slate-800 rounded-xl text-slate-600 cursor-not-allowed text-sm font-bold shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,0.15)]"
              readOnly
            />
          </div>
        </div>

        {/* Semester & Waktu */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold mb-1 font-sans" htmlFor="semester">
              Semester
            </label>
            <select
              id="semester"
              value={formValues.semester}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl focus:outline-none focus:ring-0 focus:border-slate-800 focus:shadow-[2px_2px_0px_0px_#59B292] shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,0.15)] transition-all text-sm font-medium"
              required
            >
              <option value="" disabled>Pilih...</option>
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold mb-1" htmlFor="waktu">
              Alokasi Waktu
            </label>
            <input
              id="waktu"
              type="text"
              value={formValues.waktu}
              onChange={handleInputChange}
              placeholder="Cth: 2 JP"
              className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl focus:outline-none focus:ring-0 focus:border-slate-800 focus:shadow-[2px_2px_0px_0px_#59B292] shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,0.15)] transition-all text-sm font-medium"
              required
            />
          </div>
        </div>

        {/* Mata Pelajaran */}
        <div>
          <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold mb-1 font-sans" htmlFor="mapel">
            Mata Pelajaran
          </label>
          <input
            id="mapel"
            type="text"
            value={formValues.mapel}
            onChange={handleInputChange}
            placeholder="Ketik Mapel, Cth: IPA / Matematika"
            className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl focus:outline-none focus:ring-0 focus:border-slate-800 focus:shadow-[2px_2px_0px_0px_#59B292] shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,0.15)] transition-all text-sm font-medium"
            required
          />
        </div>

        {/* Materi Pokok / Topik */}
        <div>
          <div className="flex justify-between items-end mb-1">
            <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold font-sans" htmlFor="topik">
              Topik / Materi (Per Bab)
            </label>
            <button
              type="button"
              onClick={onSuggestMateri}
              id="btn-suggest-materi"
              className="text-[10px] bg-brand-cream hover:bg-brand-cream/80 text-slate-900 py-1 px-2.5 rounded-lg border-2 border-slate-800 font-extrabold transition-all flex items-center gap-1 cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"
            >
              <List className="h-3 w-3 text-slate-900" /> Pilih Bab CP
            </button>
          </div>
          <textarea
            id="topik"
            value={formValues.topik}
            onChange={handleInputChange}
            placeholder="Ketik topik materi atau klik tombol pilih Bab di atas..."
            className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl focus:outline-none focus:ring-0 focus:border-slate-800 focus:shadow-[2px_2px_0px_0px_#59B292] shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,0.15)] transition-all text-xs min-h-[60px] font-medium"
            required
          />
        </div>

        {/* Capaian Pembelajaran (CP) */}
        <div>
          <div className="flex justify-between items-end mb-1">
            <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold font-sans" htmlFor="cp">
              Capaian Pembelajaran (CP)
            </label>
            <button
              type="button"
              onClick={handleAISuggestCP}
              disabled={cpLoading}
              id="btn-suggest-cp"
              className="text-[10px] bg-brand-cream hover:bg-brand-cream/80 text-slate-900 py-1 px-2.5 rounded-lg border-2 border-slate-800 font-extrabold transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"
            >
              {cpLoading ? (
                <>
                  <svg className="animate-spin h-3 w-3 text-slate-900" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 text-brand-yellow animate-pulse" />
                  <span>AI Generate CP</span>
                </>
              )}
            </button>
          </div>
          <textarea
            id="cp"
            value={formValues.cp}
            onChange={handleInputChange}
            placeholder="CP Resmi Kemdikbudristek..."
            className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl focus:outline-none focus:ring-0 focus:border-slate-800 focus:shadow-[2px_2px_0px_0px_#59B292] shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,0.15)] transition-all text-xs min-h-[80px] font-medium"
            required
          />
        </div>

        {/* Tujuan Pembelajaran (TP) */}
        <div>
          <div className="flex justify-between items-end mb-1">
            <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold font-sans" htmlFor="tp">
              Tujuan Pembelajaran (TP)
            </label>
            <button
              type="button"
              onClick={handleAISuggestTP}
              disabled={tpLoading}
              id="btn-suggest-tp"
              className="text-[10px] bg-brand-cream hover:bg-brand-cream/80 text-slate-900 py-1 px-2.5 rounded-lg border-2 border-slate-800 font-extrabold transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"
            >
              {tpLoading ? (
                <>
                  <svg className="animate-spin h-3 w-3 text-slate-900" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 text-brand-yellow animate-pulse" />
                  <span>AI Generate TP</span>
                </>
              )}
            </button>
          </div>
          <textarea
            id="tp"
            value={formValues.tp}
            onChange={handleInputChange}
            placeholder="Poin-poin Tujuan Pembelajaran..."
            className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl focus:outline-none focus:ring-0 focus:border-slate-800 focus:shadow-[2px_2px_0px_0px_#59B292] shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,0.15)] transition-all text-xs min-h-[80px] font-medium"
            required
          />
        </div>

        {/* Model Pembelajaran (ai suggest) */}
        <div className="pt-3 border-t-2 border-slate-800">
          <div className="flex justify-between items-end mb-1">
            <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold font-sans animate-pulse" htmlFor="model">
              Model Pembelajaran (ai suggest)
            </label>
            <button
              type="button"
              onClick={handleAISuggestMethodology}
              disabled={methodologyLoading}
              id="btn-suggest-methodology"
              className="text-[10px] bg-brand-cream hover:bg-brand-cream/80 text-slate-900 py-1 px-2.5 rounded-lg border-2 border-slate-800 font-extrabold transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"
              title="AI akan menganalisis topik & TP untuk otomatis memilih semua opsi di bawah!"
            >
              {methodologyLoading ? (
                <>
                  <svg className="animate-spin h-3 w-3 text-slate-900" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Menganalisis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 text-brand-yellow animate-pulse" />
                  <span>AI Rekomendasi</span>
                </>
              )}
            </button>
          </div>
          <select
            id="model"
            value={formValues.model || ""}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl focus:outline-none focus:ring-0 focus:border-slate-800 focus:shadow-[2px_2px_0px_0px_#59B292] shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,0.15)] transition-all text-sm font-medium"
          >
            <option value="">Pilih Model atau Ketik Manual di Bawah...</option>
            <option value="Problem Based Learning (PBL)">Problem Based Learning (PBL)</option>
            <option value="Project Based Learning (PjBL)">Project Based Learning (PjBL)</option>
            <option value="Discovery Learning">Discovery Learning</option>
            <option value="Inquiry Learning">Inquiry Learning</option>
            <option value="Cooperative Learning">Cooperative Learning</option>
            <option value="Direct Instruction">Direct Instruction (Ceramah Terarah)</option>
          </select>
          <input
            type="text"
            placeholder="Atau ketik model pembelajaran kustom Anda..."
            value={formValues.model || ""}
            onChange={(e) => setFormValues((prev: any) => ({ ...prev, model: e.target.value }))}
            className="w-full mt-1.5 px-3 py-2 bg-white border-2 border-slate-800 rounded-xl focus:outline-none focus:ring-0 focus:border-slate-800 focus:shadow-[2px_2px_0px_0px_#59B292] shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,0.15)] transition-all text-xs font-medium"
          />
        </div>

        {/* Metode Pembelajaran */}
        <div>
          <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold mb-1.5 font-sans">
            Metode Pembelajaran (ai suggest)
          </label>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 bg-brand-cream/10 p-3 rounded-xl border-2 border-slate-800">
            {METODE_LIST.map((m) => {
              const isChecked = (formValues.metode || []).includes(m);
              return (
                <label key={m} className="flex items-start gap-2 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleMetode(m)}
                    className="mt-0.5 rounded border-2 border-slate-800 text-brand-teal focus:ring-0 h-4 w-4 cursor-pointer"
                  />
                  <span className={isChecked ? "text-brand-teal font-extrabold" : "text-slate-700 font-semibold"}>{m}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Dimensi Profil Lulusan (DPL) */}
        <div>
          <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold mb-1.5 font-sans">
            Dimensi Profil Lulusan (DPL)
          </label>
          <div className="grid grid-cols-4 gap-2 bg-brand-cream/10 p-3 rounded-xl border-2 border-slate-800">
            {DPL_LIST.map((d) => {
              const isChecked = (formValues.dpl || []).includes(d);
              return (
                <label
                  key={d}
                  className={`flex items-center justify-center py-1.5 px-1 rounded-lg border-2 border-slate-800 text-center text-[10px] font-black uppercase cursor-pointer select-none transition-all ${
                    isChecked
                      ? "bg-brand-teal text-white shadow-none"
                      : "bg-white text-slate-500 hover:bg-brand-cream/30 shadow-[1px_1px_0px_0px_rgba(30,41,59,1)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleDPL(d)}
                    className="sr-only"
                  />
                  <span>{d}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Integrasi Nilai & Karakter */}
        <div>
          <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold mb-1.5 font-sans">
            Integrasi Nilai & Karakter
          </label>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 bg-brand-cream/10 p-3 rounded-xl border-2 border-slate-800">
            {NILAI_KARAKTER_LIST.map((nk) => {
              const isChecked = (formValues.nilaiKarakter || []).includes(nk);
              return (
                <label key={nk} className="flex items-start gap-2 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleNilaiKarakter(nk)}
                    className="mt-0.5 rounded border-2 border-slate-800 text-brand-teal focus:ring-0 h-4 w-4 cursor-pointer"
                  />
                  <span className={isChecked ? "text-brand-teal font-extrabold" : "text-slate-700 font-semibold"}>{nk}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isGenerating}
          id="btn-submit-generate"
          className="w-full bg-brand-rose hover:bg-brand-rose/90 active:bg-brand-rose text-white font-extrabold py-3.5 px-4 rounded-xl border-2 border-slate-800 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all mt-4 flex justify-center items-center gap-2 text-xs uppercase tracking-wider disabled:opacity-75 cursor-pointer disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>AI Sedang Menulis RPP...</span>
            </>
          ) : (
            <>
              <span>Generate</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

const METODE_LIST = [
  "Ceramah Interaktif",
  "Diskusi Kelompok",
  "Demonstrasi",
  "Tanya Jawab",
  "Simulasi",
  "Studi Kasus",
  "Observasi",
  "Mind Mapping",
  "Gamifikasi",
  "Observasi Diri dan Lingkungan",
  "Pengumpulan Data",
  "Presentasi Proyek"
];

const DPL_LIST = [
  "DPL 1",
  "DPL 2",
  "DPL 3",
  "DPL 4",
  "DPL 5",
  "DPL 6",
  "DPL 7",
  "DPL 8"
];

const NILAI_KARAKTER_LIST = [
  "Tanggung Jawab",
  "Peduli Diri dan Sesama",
  "Kritis dan Kreatif",
  "Kolaborasi",
  "Komunikatif",
  "Religius",
  "Nasionalis",
  "Mandiri",
  "Gotong Royong",
  "Integritas"
];
