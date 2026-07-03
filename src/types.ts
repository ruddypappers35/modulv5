export interface GuruProfile {
  sekolah: string;
  mapel: string;
  tahun: string;
  guru: string;
  nipGuru: string;
  kepsek: string;
  nipKepsek: string;
  userApiKey: string;
  apiKeys?: string[];
  activeApiKeyIndex?: number;
}

export interface ModulRecord {
  id: string;
  timestamp: string;
  kelas: string;
  fase: string;
  semester: string;
  mapel: string;
  topik: string;
  cp: string;
  tp: string;
  waktu: string;
  model?: string;
  metode?: string[];
  dpl?: string[];
  nilaiKarakter?: string[];
  modulHtml: string;
  lkpdHtml?: string;
  asesmenHtml?: string;
  materiHtml?: string;
  refleksiHtml?: string;
  protaHtml?: string;
  protaJson?: string;
  kktpHtml?: string;
  promesHtml?: string;
}

export interface CurriculumBab {
  id: string;
  kelas: string;
  fase: string;
  semester: string;
  mapel: string;
  bab: string;
  materi: string;
  cpDefault?: string;
}
