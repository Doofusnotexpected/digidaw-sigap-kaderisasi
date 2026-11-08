// src/data/seedData.ts
import { Pengguna, EntriKontribusi, SegelHash, PeranKabinet } from '../types';

export const DATA_PENGGUNA: Pengguna[] = [
  // BEM KEMA Telkom University
  { id: 'usr-1', nim: '1301230041', nama: 'Raka Pratama Wijaya', email: 'raka@student.telkomuniversity.ac.id', jurusan: 'S1 Informatika', angkatan: '2023', ormawaId: 'BEM_TELU', peranSistem: 'ANGGOTA' },
  { id: 'usr-2', nim: '1401230112', nama: 'Nadia Shafira Putri', email: 'nadia@student.telkomuniversity.ac.id', jurusan: 'S1 MBTI (FEB)', angkatan: '2023', ormawaId: 'BEM_TELU', peranSistem: 'ANGGOTA' },
  { id: 'usr-3', nim: '1302230088', nama: 'Gilang Ramadhan Putra', email: 'gilang@student.telkomuniversity.ac.id', jurusan: 'S1 Rekayasa Perangkat Lunak', angkatan: '2023', ormawaId: 'BEM_TELU', peranSistem: 'ANGGOTA' },
  { id: 'usr-4', nim: '1202230019', nama: 'Alya Zahra Maharani', email: 'alya@student.telkomuniversity.ac.id', jurusan: 'S1 Sistem Informasi', angkatan: '2023', ormawaId: 'BEM_TELU', peranSistem: 'ANGGOTA' },
  { id: 'usr-5', nim: '1101240054', nama: 'Dimas Aditya Nugroho', email: 'dimas@student.telkomuniversity.ac.id', jurusan: 'S1 Teknik Telekomunikasi', angkatan: '2024', ormawaId: 'BEM_TELU', peranSistem: 'ANGGOTA' },
  { id: 'usr-6', nim: '1601240093', nama: 'Farhan Rizky Maulana', email: 'farhan@student.telkomuniversity.ac.id', jurusan: 'S1 Desain Komunikasi Visual', angkatan: '2024', ormawaId: 'BEM_TELU', peranSistem: 'ANGGOTA' },

  // UKM SEARCH Telkom University
  { id: 'usr-7', nim: '1401230205', nama: 'Kezia Aurelia Tan', email: 'kezia@student.telkomuniversity.ac.id', jurusan: 'S1 MBTI (FEB)', angkatan: '2023', ormawaId: 'UKM_SEARCH', peranSistem: 'ANGGOTA' },
  { id: 'usr-8', nim: '1301230177', nama: 'Bagas Satrio Wibowo', email: 'bagas@student.telkomuniversity.ac.id', jurusan: 'S1 Informatika', angkatan: '2023', ormawaId: 'UKM_SEARCH', peranSistem: 'ANGGOTA' },
  { id: 'usr-9', nim: '1201230062', nama: 'Luthfi Hakim Siregar', email: 'luthfi@student.telkomuniversity.ac.id', jurusan: 'S1 Teknik Industri', angkatan: '2023', ormawaId: 'UKM_SEARCH', peranSistem: 'ANGGOTA' },
  { id: 'usr-10', nim: '1501230039', nama: 'Salma Nurul Izzah', email: 'salma@student.telkomuniversity.ac.id', jurusan: 'S1 Ilmu Komunikasi', angkatan: '2023', ormawaId: 'UKM_SEARCH', peranSistem: 'ANGGOTA' },
  { id: 'usr-11', nim: '1302240021', nama: 'Reyhan Putra Pratama', email: 'reyhan@student.telkomuniversity.ac.id', jurusan: 'S1 Rekayasa Perangkat Lunak', angkatan: '2024', ormawaId: 'UKM_SEARCH', peranSistem: 'ANGGOTA' },
  { id: 'usr-12', nim: '1402240081', nama: 'Tiara Kusuma Dewi', email: 'tiara@student.telkomuniversity.ac.id', jurusan: 'S1 Akuntansi', angkatan: '2024', ormawaId: 'UKM_SEARCH', peranSistem: 'ANGGOTA' },
];

export const INITIAL_ENTRI: EntriKontribusi[] = [
  {
    id: 'entri-101',
    kandidatId: 'usr-1',
    ormawaId: 'BEM_TELU',
    namaKegiatan: 'Ketua Pelaksana PKKMB Universitas Telkom 2026',
    peranKegiatan: 'Project Lead',
    tautanBukti: 'https://telkomuniversity.ac.id/sk-pkkmb-2026.pdf',
    tanggalKegiatan: '2026-09-12',
    skorKepemimpinan: 5.0,
    skorEksekusi: 4.8,
    skorKolaborasi: 4.6,
    skorDampak: 4.9,
    statusVerifikasi: 'DISETUJUI',
    verifikatorId: 'pembina-1',
    verifikatorNama: 'Dr. Hendra Wijaya (Pembina BEM)',
    waktuVerifikasi: '2026-09-15T10:00:00Z',
  },
  {
    id: 'entri-102',
    kandidatId: 'usr-2',
    ormawaId: 'BEM_TELU',
    namaKegiatan: 'Audit Laporan Pertanggungjawaban Keuangan Ganjil',
    peranKegiatan: 'Bendahara Pelaksana',
    tautanBukti: 'https://telkomuniversity.ac.id/lpj-keuangan-2026.pdf',
    tanggalKegiatan: '2026-10-05',
    skorKepemimpinan: 4.3,
    skorEksekusi: 5.0,
    skorKolaborasi: 4.7,
    skorDampak: 4.5,
    statusVerifikasi: 'DISETUJUI',
    verifikatorId: 'kabid-1',
    verifikatorNama: 'Rizwan Hakim (Kabid Internal)',
    waktuVerifikasi: '2026-10-06T14:30:00Z',
  },
  // 6 Entri lonjakan H-7 (Gilang Ramadhan terus pemicu penanda pola anomali)
  ...[1, 2, 3, 4, 5, 6].map((idx) => ({
    id: `entri-spike-${idx}`,
    kandidatId: 'usr-3',
    ormawaId: 'BEM_TELU' as const,
    namaKegiatan: `Kepanitiaan Internal Seri #${idx}`,
    peranKegiatan: 'Divisi Logistik',
    tautanBukti: `https://telkomuniversity.ac.id/sertif-adhoc-${idx}.pdf`,
    tanggalKegiatan: `2026-11-0${idx}`,
    skorKepemimpinan: 4.1,
    skorEksekusi: 3.9,
    skorKolaborasi: 4.0,
    skorDampak: 3.8,
    statusVerifikasi: 'DISETUJUI' as const,
    verifikatorId: 'kabid-relasi',
    verifikatorNama: 'Budi Santoso (Kabid Relasi)', // Verifikator dominan
    waktuVerifikasi: `2026-11-0${idx}T18:00:00Z`,
  })),
];

export const INITIAL_SLOT_PERAN: PeranKabinet[] = [
  { kodePeran: 'KETUA', namaPeran: 'Ketua Umum Ormawa', kandidatTerpilihId: null, skorKecocokan: 0 },
  { kodePeran: 'WAKIL_KETUA', namaPeran: 'Wakil Ketua Bidang Internal', kandidatTerpilihId: null, skorKecocokan: 0 },
  { kodePeran: 'BENDAHARA', namaPeran: 'Bendahara Umum', kandidatTerpilihId: null, skorKecocokan: 0 },
  { kodePeran: 'KABID_KADERISASI', namaPeran: 'Kabid PSDM & Kaderisasi', kandidatTerpilihId: null, skorKecocokan: 0 },
];