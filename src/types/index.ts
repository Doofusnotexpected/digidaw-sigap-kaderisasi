// src/types/index.ts
export type RoleType = 'ANGGOTA' | 'KABID' | 'PEMBINA' | 'KEMAHASISWAAN';
export type OrmawaId = 'BEM_TELU' | 'UKM_SEARCH';
export type CabinetRoleKey = 'KETUA' | 'WAKIL_KETUA' | 'BENDAHARA' | 'KABID_KADERISASI';

// Empat jenis pengguna sesuai proposal (Bab 4.1)
export type PeranDemo = 'ANGGOTA' | 'VERIFIKATOR' | 'PANITIA' | 'AUDITOR';

// 1. Yg pengguna (Sesuai Kebutuhan Bab Teknis Devan)
export interface Pengguna {
  id: string;
  nim: string;
  nama: string;
  email: string;
  jurusan: string;
  angkatan: string;
  ormawaId: OrmawaId;
  peranSistem: RoleType;
}

// 2. Yg entri (Rekam Jejak Kontribusi)
export interface EntriKontribusi {
  id: string;
  kandidatId: string;
  ormawaId: OrmawaId;
  namaKegiatan: string;
  peranKegiatan: string;
  tautanBukti: string;
  tanggalKegiatan: string;
  skorKepemimpinan: number; // 1.0 - 5.0
  skorEksekusi: number;      // 1.0 - 5.0
  skorKolaborasi: number;    // 1.0 - 5.0
  skorDampak: number;        // 1.0 - 5.0
  statusVerifikasi: 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';
  verifikatorId: string;
  verifikatorNama: string;
  waktuVerifikasi: string;
  periode?: string;
  uraian?: string;
  catatanVerifikator?: string;
}

// 3. Yg segel_hash (Rantai Integritas Kriptografis)
export interface SegelHash {
  id: string;
  entriId: string;
  hashSebelumnya: string; // Hash N-1
  hashSaatIni: string;    // Hash N
  waktuPenyegelan: string;
  statusIntegritas: 'VALID' | 'TERKOMPROMISI';
}

// 4. Yg peran (Slot Suksesi Kabinet)
export interface PeranKabinet {
  kodePeran: CabinetRoleKey;
  namaPeran: string;
  kandidatTerpilihId: string | null;
  skorKecocokan: number;
  alasanTertulis?: string;
}

// 5. Yg audit_log (Log Justifikasi Tertulis & Deteksi Anomali)
export interface AuditLog {
  id: string;
  timestamp: string;
  aktorId: string;
  aksi: string;
  keteranganTertulis: string; // Wajib diisi jika melanggar rekomendasi peringkat #1
  penandaPola: string[];
  ormawaId?: OrmawaId;
}