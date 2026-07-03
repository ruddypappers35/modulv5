import React from "react";
import { BookOpen, Settings, User } from "lucide-react";
import { GuruProfile } from "../types";

interface NavbarProps {
  profile: GuruProfile | null;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ profile, onOpenProfile, onOpenSettings }) => {
  return (
    <header className="bg-white border-b-2 border-slate-800 text-slate-900 sticky top-0 z-40">
      <div className="max-w-[1440px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-brand-teal p-2.5 rounded-xl text-slate-900 border-2 border-slate-800 shadow-[2.5px_2.5px_0px_0px_rgba(30,41,59,1)] flex items-center justify-center">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-display font-black tracking-tight text-slate-900 flex items-center gap-1">
              Buat ModulAjar
            </h1>
            <p className="text-slate-600 text-[11px] font-bold tracking-wide">
              Kurikulum Merdeka • Sesuai CP BSKAP Kemdikbudristek
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {profile && (
            <div className="hidden md:block text-right">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Selamat datang</p>
              <p className="text-xs font-bold text-slate-800">{profile.guru || "Guru Penggerak"}</p>
            </div>
          )}
          <button
            onClick={onOpenProfile}
            id="btn-open-profile"
            title={profile?.guru ? "Profil & API Key" : "Atur Profil Guru"}
            className="flex items-center justify-center bg-brand-cream hover:bg-brand-cream/80 active:bg-brand-cream/90 border-2 border-slate-800 text-slate-900 h-10 w-10 rounded-xl shadow-[2.5px_2.5px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <User className="h-5 w-5 text-slate-900" />
          </button>
          <button
            onClick={onOpenSettings}
            id="btn-open-settings"
            title="Pengaturan Aplikasi"
            className="flex items-center justify-center bg-brand-cream hover:bg-brand-cream/80 active:bg-brand-cream/90 border-2 border-slate-800 text-slate-900 h-10 w-10 rounded-xl shadow-[2.5px_2.5px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <Settings className="h-5 w-5 text-slate-900" />
          </button>
        </div>
      </div>
    </header>
  );
};
