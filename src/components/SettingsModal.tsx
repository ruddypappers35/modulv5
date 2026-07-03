import React, { useRef, useState } from "react";
import { X, Download, Upload, Database, AlertTriangle, CheckCircle2 } from "lucide-react";
import { GuruProfile, ModulRecord } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: GuruProfile | null;
  history: ModulRecord[];
  onRestore: (restoredProfile: GuruProfile, restoredHistory: ModulRecord[]) => Promise<boolean>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  history,
  onRestore
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: "success" | "error" | ""; message: string }>({
    type: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Handle Export / Backup
  const handleBackup = () => {
    try {
      const backupData = {
        appName: "Buat ModulAjar",
        exportDate: new Date().toISOString(),
        profile: profile,
        history: history
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      
      const dateStr = new Date().toISOString().split("T")[0];
      downloadAnchor.setAttribute("download", `backup_modulajar_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setStatus({
        type: "success",
        message: "Backup data berhasil diunduh. Simpan file tersebut untuk dipindahkan ke perangkat lain."
      });
    } catch (err: any) {
      setStatus({
        type: "error",
        message: "Gagal membuat backup: " + (err.message || err)
      });
    }
  };

  // Handle Import / Restore
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus({ type: "", message: "" });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Validation check
        if (!json || (!json.profile && !json.history)) {
          throw new Error("Struktur file backup tidak valid.");
        }

        const confirmed = window.confirm(
          "Apakah Anda yakin ingin memulihkan data ini? Semua data profil dan riwayat saat ini di perangkat ini akan digantikan oleh data dari file backup."
        );

        if (!confirmed) {
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        const success = await onRestore(json.profile || null, json.history || []);
        if (success) {
          setStatus({
            type: "success",
            message: "Data berhasil dipulihkan! Halaman akan dimuat ulang untuk memperbarui tampilan."
          });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          throw new Error("Gagal menyimpan data restorasi ke database.");
        }
      } catch (err: any) {
        setStatus({
          type: "error",
          message: "Restorasi gagal: " + (err.message || "Pastikan file berformat JSON backup yang valid.")
        });
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.onerror = () => {
      setStatus({ type: "error", message: "Gagal membaca file backup." });
      setLoading(false);
    };

    reader.readAsText(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-brand-yellow p-5 border-b-4 border-slate-900 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-slate-900" />
            <h2 className="font-display font-black text-lg text-slate-900 uppercase tracking-wide">
              Pengaturan Aplikasi
            </h2>
          </div>
          <button
            onClick={onClose}
            className="bg-white hover:bg-slate-50 border-2 border-slate-900 p-1.5 rounded-xl cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"
          >
            <X className="h-4 w-4 text-slate-900" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex flex-col gap-5">
          <p className="text-xs font-semibold text-slate-500 leading-relaxed font-sans">
            Gunakan fitur backup dan restore di bawah ini untuk memindahkan seluruh data profil guru dan riwayat modul ajar yang sudah dibuat ke perangkat/komputer lain dengan mudah.
          </p>

          {/* Status Message */}
          {status.type && (
            <div
              className={`p-3.5 rounded-2xl border-2 flex gap-2.5 items-start ${
                status.type === "success"
                  ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                  : "bg-rose-50 border-rose-500 text-rose-800"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              )}
              <span className="text-xs font-bold font-sans leading-relaxed">{status.message}</span>
            </div>
          )}

          {/* Backup Box */}
          <div className="bg-[#FAF8F5] border-2 border-slate-900 rounded-2xl p-4 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]">
            <h3 className="font-display font-black text-xs uppercase text-slate-900 mb-1 flex items-center gap-1.5">
              <Download className="h-4 w-4 text-brand-teal" />
              1. Backup Data (.json)
            </h3>
            <p className="text-[11px] font-medium text-slate-500 mb-3 font-sans">
              Ekspor profil dan riwayat modul ke file JSON untuk dipindahkan.
            </p>
            <button
              onClick={handleBackup}
              className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white font-extrabold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Download Backup File
            </button>
          </div>

          {/* Restore Box */}
          <div className="bg-[#FAF8F5] border-2 border-slate-900 rounded-2xl p-4 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]">
            <h3 className="font-display font-black text-xs uppercase text-slate-900 mb-1 flex items-center gap-1.5">
              <Upload className="h-4 w-4 text-brand-yellow" />
              2. Restore Data (.json)
            </h3>
            <p className="text-[11px] font-medium text-slate-500 mb-3 font-sans">
              Pilih file JSON backup untuk memulihkan data Anda di perangkat ini.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={triggerFileSelect}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-slate-950" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memulihkan Data...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 text-slate-900" />
                  Upload & Restore File
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
