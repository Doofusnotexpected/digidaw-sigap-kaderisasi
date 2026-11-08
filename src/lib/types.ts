// Tipe baris basis data (lihat supabase/migrations)

export type PeranOrg = 'ANGGOTA' | 'VERIFIKATOR' | 'PANITIA' | 'AUDITOR' | 'ADMIN';
export type PeranGlobal = 'MAHASISWA' | 'AUDITOR_KAMPUS' | 'SUPERADMIN';
export type JenisOrganisasi = 'ORMAWA' | 'UKM';
export type StatusKontribusi = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';
export type StatusPeriode = 'DRAF' | 'DIBUKA' | 'DITUTUP';
export type AturanPola = 'LONJAKAN_PERSETUJUAN' | 'VERIFIKATOR_DOMINAN' | 'ALASAN_SINGKAT';

export type Bobot = {
  kepemimpinan: number;
  eksekusi: number;
  kolaborasi: number;
  dampak: number;
};

export type Ambang = {
  lonjakan_jumlah: number;
  lonjakan_hari: number;
  dominan_persen: number;
  dominan_min_entri: number;
  alasan_min_karakter: number;
};

export type Organisasi = {
  id: string;
  slug: string;
  nama: string;
  singkatan: string;
  jenis: JenisOrganisasi;
  deskripsi: string | null;
  dibuat_pada: string;
};

export type Profil = {
  id: string;
  nama: string;
  email: string;
  nim: string | null;
  jurusan: string | null;
  angkatan: number | null;
  peran_global: PeranGlobal;
  dibuat_pada: string;
};

export type Keanggotaan = {
  id: string;
  pengguna_id: string;
  organisasi_id: string;
  peran: PeranOrg[];
  jabatan: string | null;
  aktif: boolean;
  dibuat_pada: string;
};

export type PeriodeSuksesi = {
  id: string;
  organisasi_id: string;
  nama: string;
  tanggal_buka: string;
  tanggal_tutup: string;
  status: StatusPeriode;
  bobot: Bobot;
  ambang: Ambang;
  dibuka_pada: string | null;
  ditutup_pada: string | null;
  dibuat_pada: string;
};

export type SlotPeran = {
  id: string;
  periode_id: string;
  nama: string;
  urutan: number;
  bobot: Bobot;
  dibuat_pada: string;
};

export type Kontribusi = {
  id: string;
  pengguna_id: string;
  organisasi_id: string;
  kegiatan: string;
  peran_kegiatan: string;
  periode_kegiatan: string;
  tanggal_kegiatan: string;
  uraian: string;
  bukti_url: string | null;
  bukti_path: string | null;
  status: StatusKontribusi;
  nilai_kepemimpinan: number | null;
  nilai_eksekusi: number | null;
  nilai_kolaborasi: number | null;
  nilai_dampak: number | null;
  catatan_verifikator: string | null;
  verifikator_id: string | null;
  diverifikasi_pada: string | null;
  dibuat_pada: string;
  diubah_pada: string;
};

export type SegelHash = {
  id: string;
  urutan: number;
  kontribusi_id: string;
  hash_sebelumnya: string;
  hash_entri: string;
  dibuat_pada: string;
};

export type PenetapanPeran = {
  id: string;
  periode_id: string;
  slot_id: string;
  kandidat_id: string;
  skor_kecocokan: number;
  skor_saw: number;
  kecocokan_tertinggi: number | null;
  pembanding_id: string | null;
  alasan_tertulis: string | null;
  ditetapkan_oleh: string;
  ditetapkan_pada: string;
};

export type PenandaPola = {
  id: string;
  periode_id: string;
  aturan: AturanPola;
  subjek_id: string;
  keterangan: string;
  data: Record<string, unknown>;
  aktif: boolean;
  ditinjau_oleh: string | null;
  ditinjau_pada: string | null;
  catatan_tinjauan: string | null;
  dibuat_pada: string;
  diperbarui_pada: string;
};

export type JejakAudit = {
  id: number;
  organisasi_id: string | null;
  periode_id: string | null;
  aktor_id: string | null;
  aktor_nama: string | null;
  aksi: string;
  entitas: string | null;
  entitas_id: string | null;
  keterangan: string | null;
  data: Record<string, unknown>;
  dibuat_pada: string;
};

export type RiwayatPerubahan = {
  id: number;
  kontribusi_id: string;
  organisasi_id: string | null;
  data_lama: Partial<Kontribusi>;
  data_baru: Partial<Kontribusi> | null;
  diubah_oleh: string | null;
  peran_db: string;
  diubah_pada: string;
};

/** Hasil server action yang dipakai useFormState */
export type HasilAksi = { ok: boolean; pesan?: string; galat?: Record<string, string>; data?: Record<string, unknown> } | null;
