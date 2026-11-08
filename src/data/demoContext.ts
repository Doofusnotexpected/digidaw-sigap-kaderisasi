// src/data/demoContext.ts
// Data contoh tambahan untuk demo: entri yang masih menunggu verifikasi,
// identitas pengguna demo per ormawa, dan info periode suksesi.
import { EntriKontribusi, OrmawaId } from '../types';

export const INFO_ORMAWA: Record<
  OrmawaId,
  { nama: string; singkat: string; jenis: string; periode: string; dibuka: string }
> = {
  BEM_TELU: {
    nama: 'BEM KEMA Telkom University',
    singkat: 'BEM KEMA',
    jenis: 'Ormawa',
    periode: 'Kabinet 2027',
    dibuka: '2026-11-08',
  },
  UKM_SEARCH: {
    nama: 'UKM SEARCH Telkom University',
    singkat: 'UKM SEARCH',
    jenis: 'UKM',
    periode: 'Kepengurusan 2027',
    dibuka: '2026-11-08',
  },
};

// Siapa yang "login" untuk tiap peran demo, per ormawa
export const IDENTITAS_DEMO: Record<
  OrmawaId,
  { anggotaId: string; verifikator: { id: string; nama: string }; panitia: string; auditor: string }
> = {
  BEM_TELU: {
    anggotaId: 'usr-4',
    verifikator: { id: 'kabid-1', nama: 'Rizwan Hakim (Kabid Internal)' },
    panitia: 'Panitia Suksesi BEM KEMA',
    auditor: 'Direktorat Kemahasiswaan',
  },
  UKM_SEARCH: {
    anggotaId: 'usr-10',
    verifikator: { id: 'kabid-search', nama: 'Ahmad Faisal (Kabid Riset)' },
    panitia: 'Panitia Suksesi UKM SEARCH',
    auditor: 'Direktorat Kemahasiswaan',
  },
};

const menunggu = (
  e: Pick<EntriKontribusi, 'id' | 'kandidatId' | 'ormawaId' | 'namaKegiatan' | 'peranKegiatan' | 'tautanBukti' | 'tanggalKegiatan'> & {
    periode: string;
    uraian: string;
  }
): EntriKontribusi => ({
  ...e,
  skorKepemimpinan: 0,
  skorEksekusi: 0,
  skorKolaborasi: 0,
  skorDampak: 0,
  statusVerifikasi: 'MENUNGGU',
  verifikatorId: '',
  verifikatorNama: '',
  waktuVerifikasi: '',
});

export const ENTRI_MENUNGGU: EntriKontribusi[] = [
  menunggu({
    id: 'entri-p-201',
    kandidatId: 'usr-4',
    ormawaId: 'BEM_TELU',
    namaKegiatan: 'Telkom Leadership Camp 2026',
    peranKegiatan: 'Koordinator Divisi Acara',
    periode: 'Agu – Okt 2026',
    uraian: 'Menyusun rundown tiga hari, mengoordinasikan 14 staf acara, dan memimpin gladi.',
    tautanBukti: 'https://drive.example/tlc-2026-sk-panitia.pdf',
    tanggalKegiatan: '2026-10-18',
  }),
  menunggu({
    id: 'entri-p-202',
    kandidatId: 'usr-5',
    ormawaId: 'BEM_TELU',
    namaKegiatan: 'Kajian dan audiensi UKT semester genap',
    peranKegiatan: 'Staf Advokasi',
    periode: 'Sep – Okt 2026',
    uraian: 'Mengolah 600 jawaban survei UKT dan menyiapkan naskah audiensi dengan rektorat.',
    tautanBukti: 'https://drive.example/kajian-ukt-2026.pdf',
    tanggalKegiatan: '2026-10-22',
  }),
  menunggu({
    id: 'entri-p-203',
    kandidatId: 'usr-6',
    ormawaId: 'BEM_TELU',
    namaKegiatan: 'Publikasi Dies Natalis Telkom University',
    peranKegiatan: 'Penanggung Jawab Desain',
    periode: 'Okt 2026',
    uraian: 'Merancang identitas visual acara dan 30 materi publikasi.',
    tautanBukti: 'https://drive.example/dies-natalis-publikasi.pdf',
    tanggalKegiatan: '2026-10-30',
  }),
  menunggu({
    id: 'entri-p-301',
    kandidatId: 'usr-10',
    ormawaId: 'UKM_SEARCH',
    namaKegiatan: 'Seminar Riset Komunikasi Digital',
    peranKegiatan: 'Moderator dan Ketua Panitia',
    periode: 'Okt 2026',
    uraian: 'Memimpin panitia 9 orang, menghadirkan 3 pembicara, 180 peserta.',
    tautanBukti: 'https://drive.example/seminar-komdig.pdf',
    tanggalKegiatan: '2026-10-25',
  }),
  menunggu({
    id: 'entri-p-302',
    kandidatId: 'usr-11',
    ormawaId: 'UKM_SEARCH',
    namaKegiatan: 'Kelas Python untuk Anggota Baru',
    peranKegiatan: 'Mentor',
    periode: 'Sep – Nov 2026',
    uraian: 'Mengajar 6 pertemuan dan menyusun modul latihan untuk 40 anggota baru.',
    tautanBukti: 'https://github.com/example/search-python-class',
    tanggalKegiatan: '2026-11-02',
  }),
];
