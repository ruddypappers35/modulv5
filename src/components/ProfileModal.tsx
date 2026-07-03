import React, { useState, useEffect } from "react";
import { X, Save, Key, Eye, EyeOff, User, AlertCircle, Info, Plus, Trash2, Edit2, Copy, Check } from "lucide-react";
import { GuruProfile } from "../types";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: GuruProfile) => void;
  currentProfile: GuruProfile | null;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentProfile
}) => {
  const [formData, setFormData] = useState<GuruProfile>({
    sekolah: "",
    mapel: "",
    tahun: "",
    guru: "",
    nipGuru: "",
    kepsek: "",
    nipKepsek: "",
    userApiKey: "",
    apiKeys: [],
    activeApiKeyIndex: 0
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [newKeyInput, setNewKeyInput] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (currentProfile) {
      const legacyKey = currentProfile.userApiKey || "";
      const rawKeys = currentProfile.apiKeys || [];
      const currentKeys = rawKeys.map(k => typeof k === 'string' ? k : (k as any).key || String(k));
      let initialKeys = [...currentKeys];
      
      // Auto-populate if keys array is empty but legacy key is present
      if (initialKeys.length === 0 && legacyKey) {
        initialKeys = [legacyKey];
      }
      
      const activeIdx = currentProfile.activeApiKeyIndex !== undefined ? currentProfile.activeApiKeyIndex : 0;
      
      setFormData({
        ...currentProfile,
        apiKeys: initialKeys,
        activeApiKeyIndex: activeIdx,
        userApiKey: initialKeys[activeIdx] || legacyKey
      });
    } else {
      // Default placeholder
      setFormData({
        sekolah: "",
        mapel: "",
        tahun: "",
        guru: "",
        nipGuru: "",
        kepsek: "",
        nipKepsek: "",
        userApiKey: "",
        apiKeys: [],
        activeApiKeyIndex: 0
      });
    }
    // Reset editing/copying states
    setEditingIndex(null);
    setEditingValue("");
    setCopiedIndex(null);
  }, [currentProfile, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddApiKey = () => {
    const trimmed = newKeyInput.trim();
    if (!trimmed) return;
    
    setFormData((prev) => {
      const existingKeys = prev.apiKeys || [];
      if (existingKeys.includes(trimmed)) {
        return prev; // Duplikasi dicegah
      }
      
      const updatedKeys = [...existingKeys, trimmed];
      let activeIdx = prev.activeApiKeyIndex !== undefined ? prev.activeApiKeyIndex : 0;
      
      if (updatedKeys.length === 1) {
        activeIdx = 0;
      }
      
      return {
        ...prev,
        apiKeys: updatedKeys,
        activeApiKeyIndex: activeIdx,
        userApiKey: updatedKeys[activeIdx] || ""
      };
    });
    setNewKeyInput("");
  };

  const handleDeleteApiKey = (indexToDelete: number) => {
    setFormData((prev) => {
      const existingKeys = prev.apiKeys || [];
      const updatedKeys = existingKeys.filter((_, idx) => idx !== indexToDelete);
      
      let activeIdx = prev.activeApiKeyIndex !== undefined ? prev.activeApiKeyIndex : 0;
      if (activeIdx >= updatedKeys.length) {
        activeIdx = Math.max(0, updatedKeys.length - 1);
      }
      
      return {
        ...prev,
        apiKeys: updatedKeys,
        activeApiKeyIndex: activeIdx,
        userApiKey: updatedKeys[activeIdx] || ""
      };
    });
  };

  const handleSetActiveApiKey = (index: number) => {
    setFormData((prev) => {
      const existingKeys = prev.apiKeys || [];
      return {
        ...prev,
        activeApiKeyIndex: index,
        userApiKey: existingKeys[index] || ""
      };
    });
  };

  const handleStartEdit = (index: number, value: string) => {
    setEditingIndex(index);
    setEditingValue(value);
  };

  const handleSaveEdit = (indexToUpdate: number) => {
    const trimmed = editingValue.trim();
    if (!trimmed) return;
    
    setFormData((prev) => {
      const existingKeys = prev.apiKeys || [];
      const updatedKeys = [...existingKeys];
      updatedKeys[indexToUpdate] = trimmed;
      
      const activeIdx = prev.activeApiKeyIndex !== undefined ? prev.activeApiKeyIndex : 0;
      
      return {
        ...prev,
        apiKeys: updatedKeys,
        userApiKey: updatedKeys[activeIdx] || ""
      };
    });
    setEditingIndex(null);
    setEditingValue("");
  };

  const handleCopyKey = (key: string, index: number) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopiedIndex(index);
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 border-2 border-slate-800">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b-2 border-slate-800 flex justify-between items-center bg-white">
          <h3 className="font-display font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <User className="h-4.5 w-4.5 text-brand-teal" />
            Pengaturan Profil &amp; API Key
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-500 hover:text-brand-rose hover:bg-brand-rose/10 p-1.5 rounded-xl border border-transparent hover:border-slate-800 transition-all cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Form Profil */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] space-y-4">
          {/* API Key Section */}
          <div className="bg-brand-cream/10 border-2 border-slate-800 p-4 rounded-xl space-y-3.5 shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
              <Key className="h-4 w-4 text-brand-teal" />
              <span>Rotasi &amp; Manajemen API Key Gemini</span>
            </div>
            
            <p className="text-[11px] text-slate-600 leading-relaxed font-semibold font-sans">
              Anda dapat memasukkan lebih dari 1 API Key. Jika kuota satu key habis, sistem akan <strong>otomatis beralih</strong> ke key berikutnya tanpa menampilkan notifikasi error.
            </p>

            {/* Input untuk menambah key baru */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={newKeyInput}
                  onChange={(e) => setNewKeyInput(e.target.value)}
                  placeholder="Tambah API Key Gemini Baru..."
                  className="w-full pl-3 pr-10 py-2.5 bg-white border-2 border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-0 focus:border-slate-800 focus:shadow-[2px_2px_0px_0px_#59B292] shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,0.15)] transition-all text-slate-800 font-mono font-bold"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddApiKey();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleAddApiKey}
                className="bg-brand-teal hover:bg-brand-teal/95 text-white border-2 border-slate-800 px-3 rounded-xl flex items-center justify-center font-bold text-xs hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5 transition-all shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)] active:shadow-none cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Daftar API Keys */}
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {(!formData.apiKeys || formData.apiKeys.length === 0) ? (
                <div className="text-[11px] text-amber-600 bg-amber-50 border-2 border-amber-500/20 p-2.5 rounded-lg font-bold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>Belum ada API Key terdaftar. Silakan tambah kunci di atas.</span>
                </div>
              ) : (
                formData.apiKeys.map((key, index) => {
                  const isActive = formData.activeApiKeyIndex === index;
                  // Mask the key for display: e.g. AIzaSy...xxxx
                  const safeKey = typeof key === 'string' ? key : (key as any).key || String(key);
                  const displayKey = safeKey.length > 12 
                    ? `${safeKey.slice(0, 8)}...${safeKey.slice(-4)}`
                    : safeKey;
                  const isEditing = editingIndex === index;
                  
                  if (isEditing) {
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-xl border-2 bg-white border-slate-800 shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]"
                      >
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="flex-1 px-2 py-1 bg-white border border-slate-400 rounded-lg text-xs focus:outline-none focus:border-brand-teal font-mono font-bold"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSaveEdit(index);
                            } else if (e.key === "Escape") {
                              setEditingIndex(null);
                            }
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(index)}
                          className="text-brand-teal hover:text-brand-teal/80 p-1 rounded-lg transition-colors cursor-pointer"
                          title="Simpan"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="text-slate-400 hover:text-brand-rose p-1 rounded-lg transition-colors cursor-pointer"
                          title="Batal"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded-xl border-2 transition-all ${
                        isActive
                          ? "bg-brand-teal/5 border-brand-teal/70 shadow-[1.5px_1.5px_0px_0px_rgba(89,178,146,0.3)]"
                          : "bg-white border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSetActiveApiKey(index)}
                        className="flex items-center gap-2 flex-1 text-left cursor-pointer mr-2 overflow-hidden"
                      >
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                          isActive ? "border-brand-teal bg-brand-teal" : "border-slate-400 bg-white"
                        }`}>
                          {isActive && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono text-xs font-bold text-slate-800 truncate">{displayKey}</span>
                          <span className="text-[9px] font-sans font-bold text-slate-400 uppercase tracking-wider">
                            {isActive ? "Aktif & Prioritas Utama" : `API Key #${index + 1}`}
                          </span>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyKey(safeKey, index)}
                          className="text-slate-400 hover:text-brand-teal p-1 rounded-lg transition-colors cursor-pointer"
                          title="Copy API Key"
                        >
                          {copiedIndex === index ? (
                            <Check className="h-4 w-4 text-brand-teal" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(index, safeKey)}
                          className="text-slate-400 hover:text-brand-teal p-1 rounded-lg transition-colors cursor-pointer"
                          title="Edit API Key"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteApiKey(index)}
                          className="text-slate-400 hover:text-brand-rose p-1 rounded-lg transition-colors cursor-pointer"
                          title="Hapus API Key"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-start gap-1.5 text-[10px] text-brand-teal font-extrabold uppercase tracking-wider font-sans">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-brand-teal" />
              <span>
                Dapatkan kunci API Gemini gratis di{" "}
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-slate-900"
                >
                  Google AI Studio
                </a>
              </span>
            </div>
          </div>

          <div className="border-t-2 border-slate-800 my-4 pt-4">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-sans">
              Identitas Sekolah &amp; Guru
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold mb-1 font-sans" htmlFor="sekolah">
                Nama Sekolah
              </label>
              <input
                id="sekolah"
                type="text"
                value={formData.sekolah}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl focus:outline-none focus:ring-0 focus:border-slate-800 focus:shadow-[2px_2px_0px_0px_#59B292] shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,0.15)] transition-all text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold mb-1 font-sans" htmlFor="mapel">
                Mata Pelajaran Default
              </label>
              <input
                id="mapel"
                type="text"
                value={formData.mapel}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl focus:outline-none focus:ring-0 focus:border-slate-800 focus:shadow-[2px_2px_0px_0px_#59B292] shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,0.15)] transition-all text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold mb-1 font-sans" htmlFor="tahun">
                Tahun Ajaran
              </label>
              <input
                id="tahun"
                type="text"
                value={formData.tahun}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl focus:outline-none focus:ring-0 focus:border-slate-800 focus:shadow-[2px_2px_0px_0px_#59B292] shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,0.15)] transition-all text-sm font-medium"
                required
              />
            </div>

            <div className="col-span-2 border-t-2 border-slate-800 my-2 pt-2">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-sans">
                Data Guru Pengajar
              </span>
            </div>

            <div>
              <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold mb-1 font-sans" htmlFor="guru">
                Nama Guru Lengkap
              </label>
              <input
                id="guru"
                type="text"
                value={formData.guru}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl focus:outline-none focus:ring-0 focus:border-slate-800 focus:shadow-[2px_2px_0px_0px_#59B292] shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,0.15)] transition-all text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold mb-1 font-sans" htmlFor="nipGuru">
                NIP / NIK Guru
              </label>
              <input
                id="nipGuru"
                type="text"
                value={formData.nipGuru}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl focus:outline-none focus:ring-0 focus:border-slate-800 focus:shadow-[2px_2px_0px_0px_#59B292] shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,0.15)] transition-all text-sm font-medium"
              />
            </div>

            <div className="col-span-2 border-t-2 border-slate-800 my-2 pt-2">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-sans">
                Tanda Tangan Kepala Sekolah
              </span>
            </div>

            <div>
              <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold mb-1 font-sans" htmlFor="kepsek">
                Nama Kepala Sekolah
              </label>
              <input
                id="kepsek"
                type="text"
                value={formData.kepsek}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl focus:outline-none focus:ring-0 focus:border-slate-800 focus:shadow-[2px_2px_0px_0px_#59B292] shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,0.15)] transition-all text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold mb-1 font-sans" htmlFor="nipKepsek">
                NIP Kepala Sekolah
              </label>
              <input
                id="nipKepsek"
                type="text"
                value={formData.nipKepsek}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-2 border-slate-800 rounded-xl focus:outline-none focus:ring-0 focus:border-slate-800 focus:shadow-[2px_2px_0px_0px_#59B292] shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,0.15)] transition-all text-sm font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            id="btn-save-profile"
            className="w-full bg-brand-teal hover:bg-brand-teal/90 active:bg-brand-teal text-white border-2 border-slate-800 font-black py-3 px-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all flex justify-center items-center gap-2 text-xs uppercase tracking-wider mt-6 cursor-pointer font-sans"
          >
            <Save className="h-4 w-4" />
            <span>Simpan Profil &amp; API Key</span>
          </button>
        </form>
      </div>
    </div>
  );
};
