import React, { useState } from "react";
import { Clock, Trash2, Search, BookOpen, ChevronRight, FileText } from "lucide-react";
import { ModulRecord } from "../types";

interface HistorySidebarProps {
  history: ModulRecord[];
  onSelect: (record: ModulRecord) => void;
  onDelete: (id: string) => void;
  activeId?: string;
  loading: boolean;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  history,
  onSelect,
  onDelete,
  activeId,
  loading
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = history.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.mapel.toLowerCase().includes(query) ||
      item.topik.toLowerCase().includes(query) ||
      `kelas ${item.kelas}`.toLowerCase().includes(query)
    );
  });

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-800 shadow-[3.5px_3.5px_0px_0px_rgba(30,41,59,1)] flex flex-col h-[600px] lg:h-full">
      <div className="p-5 border-b-2 border-slate-800 bg-white rounded-t-2xl">
        <h3 className="font-display font-black text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
          <Clock className="h-4 w-4 text-brand-teal animate-pulse" />
          Riwayat Pembuatan
        </h3>
        <p className="text-[10px] text-brand-teal font-extrabold tracking-wide uppercase mt-1 font-sans">Lokal JSON Database</p>
      </div>

      {/* Kolom Pencarian */}
      <div className="p-3 border-b-2 border-slate-800 bg-brand-cream/10">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Cari mapel, bab, kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border-2 border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-0 focus:border-slate-800 focus:shadow-[2px_2px_0px_0px_#59B292] shadow-[1px_1px_0px_0px_rgba(30,41,59,0.1)] transition-all text-slate-800 font-sans font-bold"
          />
        </div>
      </div>

      {/* List Riwayat */}
      <div className="flex-grow overflow-y-auto p-2 space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-2">
            <svg className="animate-spin h-5 w-5 text-brand-teal" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-black font-sans">Memuat riwayat...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-12 px-4">
            <BookOpen className="h-8 w-8 text-brand-cream mx-auto mb-2" />
            <p className="text-slate-400 text-xs font-bold">Belum ada riwayat</p>
            <p className="text-slate-400 text-[10px] mt-1 font-sans">Buat modul baru untuk menyimpannya di sini.</p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isActive = item.id === activeId;
            return (
              <div
                key={item.id}
                className={`group relative flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border-2 ${
                  isActive
                    ? "bg-brand-cream/40 border-slate-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]"
                    : "bg-white border-transparent hover:bg-brand-cream/10 hover:border-slate-800 hover:-translate-y-0.5 hover:shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]"
                }`}
                onClick={() => onSelect(item)}
              >
                <div className="flex-grow pr-6 select-none">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border border-slate-800 ${
                      isActive ? "bg-brand-teal text-white" : "bg-brand-cream/40 text-slate-800"
                    }`}>
                      Kelas {item.kelas}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold font-mono">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>
                  <h4 className="font-black text-slate-900 text-xs mt-1 truncate max-w-[180px]">
                    {item.mapel}
                  </h4>
                  <p className="text-[10px] text-slate-600 truncate mt-0.5 max-w-[180px] font-medium">
                    {item.topik}
                  </p>
                  
                  {item.lkpdHtml && (
                    <div className="flex items-center gap-1 mt-1 text-[9px] text-brand-teal font-extrabold uppercase tracking-wider font-sans">
                      <FileText className="h-3 w-3 text-brand-teal" />
                      <span>+ LKPD</span>
                    </div>
                  )}
                </div>

                <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Apakah Anda yakin ingin menghapus riwayat ini secara permanen dari server?")) {
                        onDelete(item.id);
                      }
                    }}
                    className="p-1.5 hover:bg-brand-rose/10 text-slate-500 hover:text-brand-rose rounded-xl border border-transparent hover:border-slate-800 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
