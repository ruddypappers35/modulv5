import React, { useState } from "react";
import { BookOpen, LogIn, AlertCircle } from "lucide-react";

interface UserLoginProps {
  onLoginSuccess: (email: string) => void;
}

export const UserLogin: React.FC<UserLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Masukkan alamat email yang valid.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLoginSuccess(data.email);
      } else {
        setError(data.error || "Email Anda belum terdaftar dalam sistem.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Gagal menghubungi server: " + (err.message || JSON.stringify(err) || "Koneksi terputus."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
      <div className="bg-white border-4 border-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-brand-teal p-6 border-b-4 border-slate-900 text-slate-900 text-center flex flex-col items-center">
          <div className="bg-white p-3 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] mb-3">
            <BookOpen className="h-8 w-8 text-brand-teal" />
          </div>
          <h2 className="font-display font-black text-xl uppercase tracking-wide">
            Masuk Aplikasi
          </h2>
          <p className="text-slate-700 text-xs font-bold mt-1">
            ModulAjar Kurikulum Merdeka
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <p className="text-xs font-semibold text-slate-500 leading-relaxed font-sans text-center">
            Silakan masukkan alamat email yang telah didaftarkan oleh admin untuk mulai menyusun modul ajar.
          </p>

          {error && (
            <div className="bg-rose-50 border-2 border-rose-500 text-rose-800 p-3.5 rounded-2xl flex gap-2 items-start">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <span className="text-xs font-bold font-sans leading-relaxed">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold mb-1 font-sans" htmlFor="user-email">
              Alamat Email Anda
            </label>
            <input
              id="user-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@sekolah.sch.id"
              className="w-full bg-[#FAF8F5] border-2 border-slate-900 rounded-xl p-3 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-yellow hover:bg-brand-yellow/90 active:bg-brand-yellow text-slate-900 font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-slate-950" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Memverifikasi...
              </>
            ) : (
              <>
                <LogIn className="h-4.5 w-4.5 text-slate-900" />
                Masuk ke Aplikasi
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
