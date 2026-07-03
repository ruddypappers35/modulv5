import { CurriculumBab } from "./types";

export const POPULAR_CURRICULUM: CurriculumBab[] = [
  {
    id: "1",
    kelas: "7",
    fase: "Fase D",
    semester: "Ganjil",
    mapel: "IPA",
    bab: "Bab 1: Hakikat Ilmu Sains dan Metode Ilmiah",
    materi: "Metode Ilmiah, Pengukuran, Alat Laboratorium, dan Keselamatan Kerja di Laboratorium",
    cpDefault: "Peserta didik mampu mengidentifikasi alat-alat laboratorium, menerapkan metode ilmiah untuk menyelidiki fenomena alam, melakukan pengukuran dengan satuan baku, serta menerapkan prinsip keselamatan kerja."
  },
  {
    id: "2",
    kelas: "7",
    fase: "Fase D",
    semester: "Ganjil",
    mapel: "IPA",
    bab: "Bab 2: Zat dan Perubahannya",
    materi: "Wujud Zat, Model Partikel, Kerapatan Zat, Perubahan Fisika dan Kimia, Siklus Air",
    cpDefault: "Peserta didik mampu mendeskripsikan perbedaan keadaan partikel dalam zat padat, cair, dan gas, menjelaskan konsep kerapatan, membedakan perubahan fisika dan kimia, serta menjelaskan siklus air."
  },
  {
    id: "3",
    kelas: "7",
    fase: "Fase D",
    semester: "Genap",
    mapel: "IPA",
    bab: "Bab 5: Klasifikasi Makhluk Hidup",
    materi: "Karakteristik Makhluk Hidup, Kunci Determinasi, Klasifikasi 5 Kingdom",
    cpDefault: "Peserta didik mampu membedakan makhluk hidup dan benda mati berdasarkan karakteristiknya, menggunakan kunci dikotom/determinasi sederhana, serta mengklasifikasikan makhluk hidup ke dalam 5 kingdom."
  },
  {
    id: "4",
    kelas: "8",
    fase: "Fase D",
    semester: "Ganjil",
    mapel: "IPA",
    bab: "Bab 1: Sel",
    materi: "Pengenalan Sel, Spesialisasi Sel, Sel Hewan dan Tumbuhan, Mikroskop",
    cpDefault: "Peserta didik mampu mendeskripsikan sel sebagai unit terkecil penyusun makhluk hidup, mengidentifikasi organel sel hewan dan tumbuhan, serta menggunakan mikroskop untuk mengamati sel."
  },
  {
    id: "5",
    kelas: "8",
    fase: "Fase D",
    semester: "Ganjil",
    mapel: "Matematika",
    bab: "Bab 1: Bilangan Berpangkat",
    materi: "Sifat-sifat Eksponen, Bilangan Berpangkat Bulat Negatif dan Nol, Bentuk Akar",
    cpDefault: "Peserta didik mampu memahami sifat-sifat bilangan berpangkat (eksponen) dan menerapkannya dalam menyederhanakan ekspresi matematika serta mengoperasikan bentuk akar."
  },
  {
    id: "6",
    kelas: "10",
    fase: "Fase E",
    semester: "Ganjil",
    mapel: "Informatika",
    bab: "Bab 1: Berpikir Komputasional",
    materi: "Pencarian (Searching), Pengurutan (Sorting), Tumpukan (Stack), dan Antrean (Queue)",
    cpDefault: "Peserta didik mampu menerapkan strategi algoritmik standar untuk menyelesaikan persoalan komputasional yang mengandung pencarian, pengurutan, tumpukan, dan antrean."
  },
  {
    id: "7",
    kelas: "4",
    fase: "Fase B",
    semester: "Ganjil",
    mapel: "IPAS",
    bab: "Bab 1: Tumbuhan, Sumber Kehidupan di Bumi",
    materi: "Bagian Tubuh Tumbuhan, Fotosintesis, Perkembangbiakan Tumbuhan",
    cpDefault: "Peserta didik menganalisis hubungan antara bentuk serta fungsi bagian tubuh pada manusia dan tumbuhan, memahami proses fotosintesis, serta siklus hidup tumbuhan."
  },
  {
    id: "8",
    kelas: "9",
    fase: "Fase D",
    semester: "Ganjil",
    mapel: "Bahasa Inggris",
    bab: "Chapter 1: Exploring Fauna of Indonesia",
    materi: "Report Text, Describing Animals, Present Tense",
    cpDefault: "Students are able to read and write report texts about Indonesian wildlife, write descriptions using appropriate vocabulary and grammar structure (simple present tense)."
  }
];

export const MODEL_PEMBELAJARAN_OPTIONS = [
  "Problem Based Learning (PBL)",
  "Project Based Learning (PjBL)",
  "Discovery Learning",
  "Inquiry Learning",
  "Kooperatif (Cooperative Learning)",
  "Kontekstual (Contextual Teaching and Learning)"
];

export const METODE_PEMBELAJARAN_OPTIONS = [
  "Diskusi Kelompok, Studi Kasus, Presentasi",
  "Eksperimen Laboratorium, Diskusi, Observasi",
  "Ceramah Interaktif, Tanya Jawab, Penugasan",
  "Simulasi, Game-Based Learning, Refleksi",
  "Peta Konsep, Mind Mapping, Brainstorming"
];
