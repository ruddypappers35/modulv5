import React, { useState, useEffect } from "react";
import { Lock, LogOut, Plus, Trash2, Mail, AlertCircle, ShieldAlert, Check } from "lucide-react";

export const AdminPanel: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Whitelist State
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Check if admin is already logged in (local state or storage)
  useEffect(() => {
    const savedToken = sessionStorage.getItem("adminToken");
    if (savedToken) {
      setToken(savedToken);
      setIsAdmin(true);
      fetchEmails(savedToken);
    }
  }, []);

  // Fetch Whitelisted Emails
  const fetchEmails = async (sessionToken: string) => {
    try {
      const response = await fetch("/api/admin/emails", {
        headers: {
          "Authorization": `Bearer ${sessionToken}`
        }
      });
      if (response.ok) {
        const list = await response.json();
        setEmails(list);
      }
    } catch (err) {
      console.error("Gagal memuat daftar email:", err);
    }
  };

  // Handle Admin Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setToken(data.token);
        setIsAdmin(true);
        sessionStorage.setItem("adminToken", data.token);
        fetchEmails(data.token);
      } else {
        setError(data.error || "Login gagal. Username atau password salah.");
      }
    } catch (err: any) {
      setError("Koneksi gagal terhubung ke server: " + (err.message || JSON.stringify(err) || "Koneksi terputus."));
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Email
  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes("@")) return;

    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const response = await fetch("/api/admin/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ email: newEmail })
      });
      const data = await response.json();

      if (response.ok) {
        setEmails(data.emails);
        setNewEmail("");
        setSuccess("Email berhasil ditambahkan ke whitelist!");
      } else {
        setError(data.error || "Gagal menambahkan email.");
      }
    } catch (err) {
      setError("Koneksi server terputus.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Email
  const handleDeleteEmail = async (emailToDelete: string) => {
    if (emailToDelete === "rudy@admin.com") {
      alert("Email admin utama tidak dapat dihapus!");
      return;
    }

    if (!window.confirm(`Hapus akses untuk email ${emailToDelete}?`)) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/emails/${encodeURIComponent(emailToDelete)}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setEmails(data.emails);
        setSuccess("Akses email berhasil dihapus.");
      } else {
        setError(data.error || "Gagal menghapus email.");
      }
    } catch (err) {
      setError("Koneksi server terputus.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    setIsAdmin(false);
    setToken("");
    setUsername("");
    setPassword("");
    setError("");
    setSuccess("");
  };

  // 1. Render Login Screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="bg-white border-4 border-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-[8px_8px_0px_0px_rgba(30,41,59,1)]">
          <div className="bg-brand-rose p-6 border-b-4 border-slate-900 text-slate-900 text-center flex flex-col items-center">
            <div className="bg-white p-3 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] mb-3">
              <ShieldAlert className="h-8 w-8 text-brand-rose" />
            </div>
            <h2 className="font-display font-black text-xl uppercase tracking-wide">
              Admin Login
            </h2>
            <p className="text-slate-700 text-xs font-bold mt-1">
              Halaman Khusus Administrator
            </p>
          </div>

          <form onSubmit={handleLogin} className="p-6 flex flex-col gap-4">
            {error && (
              <div className="bg-rose-50 border-2 border-rose-500 text-rose-800 p-3 rounded-2xl flex gap-2 items-center">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                <span className="text-xs font-bold font-sans">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold mb-1 font-sans">
                Username / Email
              </label>
              <input
                type="email"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@email.com"
                className="w-full bg-[#FAF8F5] border-2 border-slate-900 rounded-xl p-3 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose"
              />
            </div>

            <div>
              <label className="block text-slate-800 text-[10px] uppercase tracking-wider font-extrabold mb-1 font-sans">
                Kata Sandi
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FAF8F5] border-2 border-slate-900 rounded-xl p-3 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(251,191,36,1)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Lock className="h-4.5 w-4.5 text-white" />
              {loading ? "Memverifikasi..." : "Autentikasi Masuk"}
            </button>
            
            <a href="/" className="text-center text-xs font-bold text-slate-500 hover:text-slate-800 underline mt-2 block">
              Kembali ke Dashboard Utama
            </a>
          </form>
        </div>
      </div>
    );
  }

  // 2. Render Admin Whitelist Dashboard
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col text-slate-900 selection:bg-brand-cream">
      {/* Header */}
      <header className="bg-white border-b-2 border-slate-800 py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-rose p-2 rounded-lg border-2 border-slate-900 text-slate-900 shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-display font-black uppercase tracking-tight">
                Panel Administrasi Whitelist
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                GenModul App Management
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-1.5 bg-brand-rose/10 hover:bg-brand-rose/25 text-brand-rose border-2 border-brand-rose/30 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wide cursor-pointer transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {statusAlerts(error, success)}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Add Email Form */}
          <div className="bg-white border-4 border-slate-900 rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] flex flex-col gap-4">
            <h2 className="font-display font-black text-xs uppercase text-slate-900 border-b-2 border-slate-200 pb-2 flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-brand-teal" />
              Tambah Akses Email
            </h2>

            <form onSubmit={handleAddEmail} className="flex flex-col gap-3">
              <div>
                <label className="block text-slate-500 text-[9px] uppercase tracking-wider font-extrabold mb-1">
                  Alamat Email Guru
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="guru@sekolah.sch.id"
                  className="w-full bg-[#FAF8F5] border-2 border-slate-900 rounded-xl p-2.5 font-bold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading || !newEmail}
                className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-4 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
              >
                <Plus className="h-4 w-4" />
                {actionLoading ? "Menyimpan..." : "Daftarkan Email"}
              </button>
            </form>
          </div>

          {/* Whitelisted Emails Table */}
          <div className="bg-white border-4 border-slate-900 rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] md:col-span-2 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b-2 border-slate-200 pb-2">
              <h2 className="font-display font-black text-xs uppercase text-slate-900 flex items-center gap-2">
                <Mail className="h-4.5 w-4.5 text-brand-yellow" />
                Daftar Whitelist ({emails.length} User)
              </h2>
            </div>

            <div className="overflow-hidden border-2 border-slate-900 rounded-xl">
              <table className="w-full text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-white font-extrabold">
                    <th className="px-3 py-2 text-left border-r border-slate-800">No</th>
                    <th className="px-3 py-2 text-left border-r border-slate-800">Email Terdaftar</th>
                    <th className="px-3 py-2 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((email, idx) => (
                    <tr key={email} className="border-b border-slate-200 hover:bg-[#FAF8F5] transition-all">
                      <td className="px-3 py-2.5 font-bold border-r border-slate-200 text-center w-12">{idx + 1}</td>
                      <td className="px-3 py-2.5 font-bold border-r border-slate-200 text-slate-900 flex items-center gap-2">
                        {email}
                        {email === "rudy@admin.com" && (
                          <span className="bg-brand-rose/10 text-brand-rose text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-brand-rose/25">
                            Super Admin
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {email !== "rudy@admin.com" ? (
                          <button
                            onClick={() => handleDeleteEmail(email)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 p-1.5 rounded-lg cursor-pointer transition-all hover:scale-105 inline-flex items-center justify-center"
                            title="Hapus Akses"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold italic">Permanen</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t-2 border-slate-800 py-3 text-center text-xs mt-auto">
        <p className="font-semibold text-slate-500">
          © 2026 GenModul AI • Admin Session
        </p>
      </footer>
    </div>
  );
};

// Helper for Status Alerts
function statusAlerts(error: string, success: string) {
  if (error) {
    return (
      <div className="bg-rose-50 border-2 border-rose-500 text-rose-800 p-3.5 rounded-2xl flex gap-2 items-center">
        <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
        <span className="text-xs font-bold font-sans">{error}</span>
      </div>
    );
  }
  if (success) {
    return (
      <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-800 p-3.5 rounded-2xl flex gap-2 items-center">
        <Check className="h-5 w-5 shrink-0 text-emerald-600" />
        <span className="text-xs font-bold font-sans">{success}</span>
      </div>
    );
  }
  return null;
}
