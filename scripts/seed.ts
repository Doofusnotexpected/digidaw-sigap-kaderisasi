/**
 * Data contoh SIGAP Kaderisasi: 2 organisasi, 14 kandidat (fiktif).
 * Jalankan setelah migrasi: npm run seed
 *
 * Membuat akun lewat Admin API (tanpa konfirmasi email), entri kontribusi,
 * lalu menyetujui dan menyegelnya berurutan memakai modul hash yang sama
 * dengan aplikasi, sehingga rantai langsung utuh.
 */
import { createClient } from '@supabase/supabase-js';
import { GENESIS, hitungSegel } from '../src/lib/segel';
import { hitungSAW } from '../src/lib/saw';
import { periksaPola, AMBANG_AWAL } from '../src/lib/penanda';
import type { Kontribusi, PeranGlobal, PeranOrg } from '../src/lib/types';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SANDI = process.env.SEED_PASSWORD || 'sigap2026';
if (!URL || !KEY) {
  console.error('Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local');
  process.exit(1);
}
const db = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

// ------------------------------------------------------------ tanggal relatif (WIB)
const HARI = 86_400_000;
const hariIniWib = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
const tgl = (offsetHari: number) => new Date(new Date(`${hariIniWib}T00:00:00+07:00`).getTime() + offsetHari * HARI);
const isoTgl = (d: Date) => new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10);

// ------------------------------------------------------------ data
type Akun = { kunci: string; email: string; nama: string; nim?: string; jurusan?: string; angkatan?: number; global?: PeranGlobal };
type Anggota = { akun: string; org: string; peran: PeranOrg[]; jabatan?: string };
type Entri = {
  akun: string;
  org: string;
  kegiatan: string;
  peran: string;
  periode: string;
  hariKegiatan: number; // relatif hari ini
  uraian: string;
  nilai?: [number, number, number, number];
  verif?: string;
  hariVerif?: number; // relatif hari ini, boleh pecahan
  status?: 'MENUNGGU' | 'DITOLAK';
  catatan?: string;
};

const AKUN: Akun[] = [
  { kunci: 'superadmin', email: 'admin@sigap.test', nama: 'Admin Kampus SIGAP', global: 'SUPERADMIN' },
  { kunci: 'kemahasiswaan', email: 'kemahasiswaan@sigap.test', nama: 'Ratna Kusuma', global: 'AUDITOR_KAMPUS' },
  // BEM KEMA
  { kunci: 'fikri', email: 'sekjen.bem@sigap.test', nama: 'Fikri Aditya', nim: '1202210050', jurusan: 'S1 Sistem Informasi', angkatan: 2021 },
  { kunci: 'rizwan', email: 'kabid.bem@sigap.test', nama: 'Rizwan Hakim', nim: '1202210071', jurusan: 'S1 Teknik Elektro', angkatan: 2021 },
  { kunci: 'budi', email: 'budi.bem@sigap.test', nama: 'Budi Santoso', nim: '1202210088', jurusan: 'S1 Manajemen', angkatan: 2021 },
  { kunci: 'hendra', email: 'pembina.bem@sigap.test', nama: 'Dr. Hendra Wijaya' },
  { kunci: 'laras', email: 'panitia.bem@sigap.test', nama: 'Laras Ayuningtyas', nim: '1202220031', jurusan: 'S1 Ilmu Komunikasi', angkatan: 2022 },
  { kunci: 'raka', email: 'raka@sigap.test', nama: 'Raka Pratama Wijaya', nim: '1202230001', jurusan: 'S1 Informatika', angkatan: 2023 },
  { kunci: 'nadia', email: 'nadia@sigap.test', nama: 'Nadia Shafira Putri', nim: '1202230002', jurusan: 'S1 Manajemen Bisnis Telekomunikasi', angkatan: 2023 },
  { kunci: 'gilang', email: 'gilang@sigap.test', nama: 'Gilang Ramadhan Putra', nim: '1202230003', jurusan: 'S1 Rekayasa Perangkat Lunak', angkatan: 2023 },
  { kunci: 'alya', email: 'alya@sigap.test', nama: 'Alya Zahra Maharani', nim: '1202230019', jurusan: 'S1 Sistem Informasi', angkatan: 2023 },
  { kunci: 'dimas', email: 'dimas@sigap.test', nama: 'Dimas Aditya Nugroho', nim: '1202230027', jurusan: 'S1 Akuntansi', angkatan: 2023 },
  { kunci: 'farhan', email: 'farhan@sigap.test', nama: 'Farhan Rizky Maulana', nim: '1202230034', jurusan: 'S1 Desain Komunikasi Visual', angkatan: 2023 },
  { kunci: 'citra', email: 'citra@sigap.test', nama: 'Citra Lestari', nim: '1202230045', jurusan: 'S1 Teknik Industri', angkatan: 2023 },
  // UKM SEARCH
  { kunci: 'yoga', email: 'ketua.search@sigap.test', nama: 'Yoga Prasetyo', nim: '1202210102', jurusan: 'S1 Informatika', angkatan: 2021 },
  { kunci: 'faisal', email: 'kabid.search@sigap.test', nama: 'Ahmad Faisal', nim: '1202210115', jurusan: 'S1 Sains Data', angkatan: 2021 },
  { kunci: 'siti', email: 'pembina.search@sigap.test', nama: 'Dr. Siti Rahma' },
  { kunci: 'wulan', email: 'panitia.search@sigap.test', nama: 'Wulan Sari', nim: '1202220140', jurusan: 'S1 Psikologi', angkatan: 2022 },
  { kunci: 'kezia', email: 'kezia@sigap.test', nama: 'Kezia Aurelia Tan', nim: '1202230201', jurusan: 'S1 Manajemen Bisnis Telekomunikasi', angkatan: 2023 },
  { kunci: 'bagas', email: 'bagas@sigap.test', nama: 'Bagas Satrio Wibowo', nim: '1202230202', jurusan: 'S1 Informatika', angkatan: 2023 },
  { kunci: 'luthfi', email: 'luthfi@sigap.test', nama: 'Luthfi Hakim Siregar', nim: '1202230203', jurusan: 'S1 Teknik Industri', angkatan: 2023 },
  { kunci: 'salma', email: 'salma@sigap.test', nama: 'Salma Nurul Izzah', nim: '1202230210', jurusan: 'S1 Ilmu Komunikasi', angkatan: 2023 },
  { kunci: 'reyhan', email: 'reyhan@sigap.test', nama: 'Reyhan Putra Pratama', nim: '1202230211', jurusan: 'S1 Teknik Komputer', angkatan: 2023 },
  { kunci: 'tiara', email: 'tiara@sigap.test', nama: 'Tiara Kusuma Dewi', nim: '1202230212', jurusan: 'S1 Sains Data', angkatan: 2023 },
  { kunci: 'hana', email: 'hana@sigap.test', nama: 'Hana Putri Ramadhani', nim: '1202230215', jurusan: 'S1 Sistem Informasi', angkatan: 2023 },
];

const ORG = [
  { kunci: 'bem', slug: 'bem-kema', nama: 'BEM KEMA Telkom University', singkatan: 'BEM KEMA', jenis: 'ORMAWA', deskripsi: 'Badan Eksekutif Mahasiswa Keluarga Mahasiswa' },
  { kunci: 'search', slug: 'ukm-search', nama: 'UKM SEARCH Telkom University', singkatan: 'UKM SEARCH', jenis: 'UKM', deskripsi: 'Unit kegiatan riset dan karya ilmiah' },
];

const ANGGOTA: Anggota[] = [
  { akun: 'fikri', org: 'bem', peran: ['ADMIN'], jabatan: 'Sekretaris Jenderal' },
  { akun: 'rizwan', org: 'bem', peran: ['VERIFIKATOR'], jabatan: 'Kabid Internal' },
  { akun: 'budi', org: 'bem', peran: ['VERIFIKATOR'], jabatan: 'Kabid Relasi' },
  { akun: 'hendra', org: 'bem', peran: ['VERIFIKATOR'], jabatan: 'Pembina' },
  { akun: 'laras', org: 'bem', peran: ['PANITIA'], jabatan: 'Ketua Panitia Suksesi' },
  ...['raka', 'nadia', 'gilang', 'alya', 'dimas', 'farhan', 'citra'].map((a) => ({ akun: a, org: 'bem', peran: ['ANGGOTA'] as PeranOrg[] })),
  { akun: 'yoga', org: 'search', peran: ['ADMIN'], jabatan: 'Ketua UKM' },
  { akun: 'faisal', org: 'search', peran: ['VERIFIKATOR'], jabatan: 'Kabid Riset' },
  { akun: 'siti', org: 'search', peran: ['VERIFIKATOR'], jabatan: 'Pembina' },
  { akun: 'wulan', org: 'search', peran: ['PANITIA'], jabatan: 'Panitia Suksesi' },
  ...['kezia', 'bagas', 'luthfi', 'salma', 'reyhan', 'tiara', 'hana'].map((a) => ({ akun: a, org: 'search', peran: ['ANGGOTA'] as PeranOrg[] })),
];

const E = (akun: string, org: string, kegiatan: string, peran: string, periode: string, hariKegiatan: number, nilai: [number, number, number, number], verif: string, uraian = ''): Entri => ({
  akun,
  org,
  kegiatan,
  peran,
  periode,
  hariKegiatan,
  nilai,
  verif,
  hariVerif: hariKegiatan + 5 + (Math.abs(kegiatan.length) % 4),
  uraian,
});

const ENTRI: Entri[] = [
  // ---------- BEM KEMA
  E('raka', 'bem', 'Ketua Pelaksana PKKMB Telkom University 2026', 'Ketua pelaksana', 'Mei – Agu 2026', -95, [5, 4, 5, 5], 'hendra', 'Memimpin 120 panitia dan menyusun ulang alur registrasi maba.'),
  E('raka', 'bem', 'Koordinator Divisi Acara Dies Natalis 2025', 'Koordinator divisi', 'Nov – Des 2025', -330, [4, 4, 4, 4], 'rizwan'),
  E('raka', 'bem', 'Staf Kementerian Dalam Negeri BEM 2025', 'Staf', 'Feb – Des 2025', -340, [5, 4, 4, 4], 'rizwan'),
  E('nadia', 'bem', 'Audit Laporan Pertanggungjawaban Keuangan Ganjil', 'Ketua tim audit internal', 'Sep – Okt 2026', -40, [4, 5, 4, 4], 'rizwan', 'Merekonsiliasi 46 transaksi dan menyusun temuan untuk Sekjen.'),
  E('nadia', 'bem', 'Bendahara Telkom Leadership Camp 2026', 'Bendahara', 'Jun – Agu 2026', -100, [4, 5, 5, 4], 'hendra'),
  E('nadia', 'bem', 'Penyusunan SOP Pencairan Dana Kegiatan', 'Penyusun', 'Mar – Apr 2026', -200, [4, 5, 4, 4], 'budi'),
  ...[1, 2, 3, 4, 5, 6].map((i) => ({
    akun: 'gilang',
    org: 'bem',
    kegiatan: `Kepanitiaan Internal Seri #${i}`,
    peran: 'Staf acara',
    periode: 'Okt – Nov 2026',
    hariKegiatan: -9 - i,
    nilai: [4, 4, 5, 4] as [number, number, number, number],
    verif: 'budi',
    hariVerif: -(7 - i) - 0.6, // enam persetujuan dalam 7 hari sebelum periode dibuka
    uraian: 'Kegiatan internal kementerian.',
  })),
  E('alya', 'bem', 'Telkom Leadership Camp 2026', 'Koordinator divisi acara', 'Agu – Okt 2026', -30, [4, 4, 5, 4], 'rizwan', 'Menyusun rundown tiga hari dan memimpin 14 staf acara.'),
  E('dimas', 'bem', 'Kajian dan Audiensi UKT Semester Ganjil', 'Staf advokasi', 'Jul – Agu 2026', -80, [3, 4, 4, 5], 'hendra', 'Mengolah 600 jawaban survei dan menyiapkan naskah audiensi.'),
  E('dimas', 'bem', 'Pendampingan Keringanan UKT', 'Pendamping', 'Agu – Sep 2026', -55, [3, 4, 4, 4], 'rizwan'),
  E('citra', 'bem', 'Bakti Sosial Dayeuhkolot', 'Koordinator lapangan', 'Mar 2026', -230, [4, 3, 5, 4], 'budi'),
  // menunggu dan ditolak
  { akun: 'farhan', org: 'bem', kegiatan: 'Publikasi Dies Natalis Telkom University', peran: 'Penanggung jawab desain', periode: 'Okt 2026', hariKegiatan: -12, uraian: 'Merancang identitas visual acara dan 30 materi publikasi.', status: 'MENUNGGU' },
  { akun: 'alya', org: 'bem', kegiatan: 'Mentoring Kepemimpinan Maba', peran: 'Mentor kelompok', periode: 'Sep – Okt 2026', hariKegiatan: -15, uraian: 'Mendampingi 12 mahasiswa baru selama delapan pekan.', status: 'MENUNGGU' },
  { akun: 'dimas', org: 'bem', kegiatan: 'Rapat Kerja BEM 2026', peran: 'Peserta', periode: 'Jan 2026', hariKegiatan: -300, uraian: 'Hadir sebagai peserta.', status: 'DITOLAK', verif: 'rizwan', hariVerif: -290, catatan: 'Kehadiran sebagai peserta belum termasuk kontribusi. Lampirkan tugas spesifik bila ada.' },
  { akun: 'raka', org: 'bem', kegiatan: 'Ketua Panitia Seminar Nasional Kepemimpinan', peran: 'Ketua panitia', periode: 'Okt 2026', hariKegiatan: -8, uraian: 'Menghadirkan tiga pembicara nasional, 400 peserta.', status: 'MENUNGGU' },
  // ---------- UKM SEARCH
  E('kezia', 'search', 'Ketua Tim PKM-RE Didanai 2026', 'Ketua tim', 'Mar – Agu 2026', -90, [5, 5, 4, 5], 'siti', 'Proposal didanai dan lolos PIMNAS tingkat wilayah.'),
  E('kezia', 'search', 'Koordinator Kelas Menulis Ilmiah', 'Koordinator', 'Sep – Nov 2025', -360, [4, 5, 4, 4], 'faisal'),
  E('bagas', 'search', 'Pengembang Portal Repositori Riset UKM', 'Pengembang utama', 'Jan – Jun 2026', -150, [4, 5, 4, 5], 'faisal'),
  E('bagas', 'search', 'Asisten Workshop Analisis Data', 'Asisten', 'Feb 2026', -260, [4, 4, 5, 4], 'siti'),
  E('luthfi', 'search', 'Ketua Kompetisi Esai Ilmiah Internal', 'Ketua pelaksana', 'Jul – Agu 2026', -85, [4, 4, 4, 5], 'faisal'),
  E('salma', 'search', 'Moderator Seminar Riset Komunikasi Digital', 'Moderator dan ketua panitia', 'Okt 2026', -25, [5, 4, 5, 4], 'siti', 'Memimpin panitia sembilan orang, 180 peserta.'),
  E('reyhan', 'search', 'Mentor Kelas Python Anggota Baru', 'Mentor', 'Sep – Nov 2026', -20, [3, 4, 4, 4], 'faisal', 'Mengajar enam pertemuan untuk 40 anggota baru.'),
  { akun: 'tiara', org: 'search', kegiatan: 'Asisten Riset Dosen: Analisis Sentimen', peran: 'Asisten riset', periode: 'Agu – Okt 2026', hariKegiatan: -18, uraian: 'Melabeli 3.000 data dan menulis laporan metodologi.', status: 'MENUNGGU' },
  { akun: 'hana', org: 'search', kegiatan: 'Penulis Artikel Buletin SEARCH', peran: 'Penulis', periode: 'Okt 2026', hariKegiatan: -10, uraian: 'Dua artikel populer tentang riset mahasiswa.', status: 'MENUNGGU' },
];

const SLOT_AWAL = [
  { nama: 'Ketua', bobot: { kepemimpinan: 0.4, eksekusi: 0.25, kolaborasi: 0.2, dampak: 0.15 } },
  { nama: 'Wakil Ketua', bobot: { kepemimpinan: 0.3, eksekusi: 0.25, kolaborasi: 0.3, dampak: 0.15 } },
  { nama: 'Sekretaris', bobot: { kepemimpinan: 0.15, eksekusi: 0.45, kolaborasi: 0.25, dampak: 0.15 } },
  { nama: 'Bendahara', bobot: { kepemimpinan: 0.15, eksekusi: 0.5, kolaborasi: 0.15, dampak: 0.2 } },
  { nama: 'Kabid HR dan Kaderisasi', bobot: { kepemimpinan: 0.25, eksekusi: 0.2, kolaborasi: 0.35, dampak: 0.2 } },
];

// ------------------------------------------------------------ helper
function wajib<T>(r: { data: T | null; error: { message: string } | null }, konteks: string): T {
  if (r.error || r.data === null) throw new Error(`${konteks}: ${r.error?.message ?? 'data kosong'}`);
  return r.data;
}

async function audit(row: Record<string, unknown>) {
  const { error } = await db.from('jejak_audit').insert(row);
  if (error) throw new Error(`jejak_audit: ${error.message}`);
}

// ------------------------------------------------------------ utama
async function main() {
  // Cek hak akses dulu agar pesan galatnya jelas
  for (const t of ['organisasi', 'profil', 'kontribusi', 'segel_hash']) {
    const { error } = await db.from(t).select('*', { head: true, count: 'exact' });
    if (error) {
      console.error(`Tidak bisa membaca tabel ${t}: ${error.message}`);
      console.error('Jalankan supabase/migrations/20261108000001_hak_akses.sql di SQL Editor, lalu ulangi.');
      process.exit(1);
    }
  }
  const { data: ada } = await db.from('organisasi').select('id').in('slug', ORG.map((o) => o.slug));
  if (ada && ada.length) {
    console.error('Data contoh sudah ada. Jalankan supabase/reset.sql di SQL Editor bila ingin mengulang.');
    process.exit(1);
  }

  console.log('Membuat akun…');
  const id = new Map<string, string>();
  const nama = new Map<string, string>();
  for (const a of AKUN) {
    const { data, error } = await db.auth.admin.createUser({
      email: a.email,
      password: SANDI,
      email_confirm: true,
      user_metadata: { nama: a.nama, nim: a.nim ?? '', jurusan: a.jurusan ?? '', angkatan: a.angkatan ? String(a.angkatan) : '' },
    });
    if (error || !data.user) {
      const ada = /already|registered|exists/i.test(error?.message ?? '');
      throw new Error(`Akun ${a.email}: ${error?.message}${ada ? '. Sisa seed sebelumnya: jalankan supabase/reset.sql di SQL Editor lalu ulangi.' : ''}`);
    }
    id.set(a.kunci, data.user.id);
    nama.set(a.kunci, a.nama);
    if (a.global) wajib(await db.from('profil').update({ peran_global: a.global }).eq('id', data.user.id).select(), `peran global ${a.email}`);
  }

  console.log('Membuat organisasi dan keanggotaan…');
  const orgId = new Map<string, string>();
  for (const o of ORG) {
    const { kunci, ...isi } = o;
    const r = wajib(await db.from('organisasi').insert(isi).select().single(), `organisasi ${o.slug}`) as { id: string };
    orgId.set(kunci, r.id);
  }
  wajib(
    await db
      .from('keanggotaan')
      .insert(ANGGOTA.map((m) => ({ pengguna_id: id.get(m.akun), organisasi_id: orgId.get(m.org), peran: m.peran, jabatan: m.jabatan ?? null, aktif: true })))
      .select(),
    'keanggotaan'
  );
  // satu permintaan bergabung yang menunggu persetujuan admin
  const { data: baru } = await db.auth.admin.createUser({ email: 'calon@sigap.test', password: SANDI, email_confirm: true, user_metadata: { nama: 'Putri Anindya', nim: '1202240088', jurusan: 'S1 Informatika', angkatan: '2024' } });
  if (baru?.user) await db.from('keanggotaan').insert({ pengguna_id: baru.user.id, organisasi_id: orgId.get('bem'), peran: ['ANGGOTA'], aktif: false });

  console.log('Membuat periode suksesi dan slot peran…');
  const periodeId = new Map<string, string>();
  for (const [kunci, nm, buka, tutup] of [
    ['bem', 'Kabinet 2027', 0, 30],
    ['search', 'Kepengurusan 2027', 5, 35],
  ] as const) {
    const p = wajib(
      await db.from('periode_suksesi').insert({ organisasi_id: orgId.get(kunci), nama: nm, tanggal_buka: isoTgl(tgl(buka)), tanggal_tutup: isoTgl(tgl(tutup)), ambang: AMBANG_AWAL }).select().single(),
      `periode ${kunci}`
    ) as { id: string };
    periodeId.set(kunci, p.id);
    wajib(await db.from('slot_peran').insert(SLOT_AWAL.map((s, i) => ({ periode_id: p.id, nama: s.nama, bobot: s.bobot, urutan: i }))).select(), `slot ${kunci}`);
  }

  console.log('Mencatat entri kontribusi…');
  const terkirim: { e: Entri; row: Kontribusi }[] = [];
  for (const e of ENTRI) {
    const dikirim = tgl(e.hariKegiatan + 2);
    const row = wajib(
      await db
        .from('kontribusi')
        .insert({
          pengguna_id: id.get(e.akun),
          organisasi_id: orgId.get(e.org),
          kegiatan: e.kegiatan,
          peran_kegiatan: e.peran,
          periode_kegiatan: e.periode,
          tanggal_kegiatan: isoTgl(tgl(e.hariKegiatan)),
          uraian: e.uraian,
          bukti_url: `https://drive.example.org/sigap-demo/${e.akun}-${Math.abs(e.hariKegiatan)}.pdf`,
          dibuat_pada: dikirim.toISOString(),
        })
        .select()
        .single(),
      `kontribusi ${e.kegiatan}`
    ) as Kontribusi;
    terkirim.push({ e, row });
    await audit({ organisasi_id: row.organisasi_id, aktor_id: row.pengguna_id, aktor_nama: nama.get(e.akun), aksi: 'Entri baru dikirim', entitas: 'kontribusi', entitas_id: row.id, keterangan: e.kegiatan, dibuat_pada: dikirim.toISOString() });
  }

  console.log('Menyetujui dan menyegel berurutan…');
  const disetujui = terkirim
    .filter((t) => t.e.nilai && t.e.verif)
    .map((t) => ({ ...t, waktu: new Date(tgl(0).getTime() + (t.e.hariVerif ?? 0) * HARI + 3 * 3600_000).toISOString() }))
    .sort((a, b) => a.waktu.localeCompare(b.waktu));

  let sebelumnya = GENESIS;
  for (const { e, row, waktu } of disetujui) {
    const [k, x, ko, d] = e.nilai!;
    const final: Kontribusi = {
      ...row,
      status: 'DISETUJUI',
      nilai_kepemimpinan: k,
      nilai_eksekusi: x,
      nilai_kolaborasi: ko,
      nilai_dampak: d,
      catatan_verifikator: null,
      verifikator_id: id.get(e.verif!)!,
      diverifikasi_pada: waktu,
    };
    const hash = hitungSegel(sebelumnya, final);
    const { data: urutan, error } = await db.rpc('setujui_dan_segel', {
      p_kontribusi_id: row.id,
      p_verifikator_id: final.verifikator_id,
      p_waktu: waktu,
      p_kepemimpinan: k,
      p_eksekusi: x,
      p_kolaborasi: ko,
      p_dampak: d,
      p_catatan: null,
      p_hash_sebelumnya: sebelumnya,
      p_hash_entri: hash,
    });
    if (error) throw new Error(`segel ${e.kegiatan}: ${error.message}`);
    sebelumnya = hash;
    await audit({
      organisasi_id: row.organisasi_id,
      aktor_id: final.verifikator_id,
      aktor_nama: nama.get(e.verif!),
      aksi: 'Entri disetujui dan disegel',
      entitas: 'kontribusi',
      entitas_id: row.id,
      keterangan: `${e.kegiatan}. Nilai ${k}/${x}/${ko}/${d}. Segel nomor ${urutan}.`,
      dibuat_pada: waktu,
    });
  }

  for (const { e, row } of terkirim.filter((t) => t.e.status === 'DITOLAK')) {
    const waktu = new Date(tgl(e.hariVerif ?? 0).getTime() + 3 * 3600_000).toISOString();
    wajib(await db.from('kontribusi').update({ status: 'DITOLAK', catatan_verifikator: e.catatan, verifikator_id: id.get(e.verif!), diverifikasi_pada: waktu }).eq('id', row.id).select(), 'tolak');
    await audit({ organisasi_id: row.organisasi_id, aktor_id: id.get(e.verif!), aktor_nama: nama.get(e.verif!), aksi: 'Entri ditolak', entitas: 'kontribusi', entitas_id: row.id, keterangan: `${e.kegiatan}. Catatan: ${e.catatan}`, dibuat_pada: waktu });
  }

  console.log('Membuka periode BEM KEMA dan menjalankan penanda pola…');
  const pBem = periodeId.get('bem')!;
  wajib(await db.from('periode_suksesi').update({ status: 'DIBUKA', dibuka_pada: tgl(0).toISOString() }).eq('id', pBem).select(), 'buka periode');
  for (const o of ['bem', 'search']) {
    await audit({ organisasi_id: orgId.get(o), periode_id: periodeId.get(o), aktor_id: id.get(o === 'bem' ? 'fikri' : 'yoga'), aktor_nama: nama.get(o === 'bem' ? 'fikri' : 'yoga'), aksi: 'Periode suksesi dibuat', keterangan: 'Draf dengan bobot awal 30/30/20/20 dan lima slot peran.', dibuat_pada: tgl(-3).toISOString() });
  }
  await audit({ organisasi_id: orgId.get('bem'), periode_id: pBem, aktor_id: id.get('fikri'), aktor_nama: nama.get('fikri'), aksi: 'Periode suksesi dibuka', keterangan: 'Kabinet 2027 dibuka. Bobot, ambang, dan slot peran kini terkunci.', dibuat_pada: tgl(0).toISOString() });

  // Penanda pola awal (logika sama dengan aplikasi)
  const bemEntri = disetujui.filter((d) => d.e.org === 'bem');
  const kandidatBem = [...new Set(bemEntri.map((d) => d.e.akun))];
  const saw = hitungSAW(
    kandidatBem.map((k) => ({ id: id.get(k)!, nama: nama.get(k)!, entri: bemEntri.filter((d) => d.e.akun === k).map((d) => ({ kepemimpinan: d.e.nilai![0], eksekusi: d.e.nilai![1], kolaborasi: d.e.nilai![2], dampak: d.e.nilai![3] })) })),
    { kepemimpinan: 0.3, eksekusi: 0.3, kolaborasi: 0.2, dampak: 0.2 }
  );
  const temuan = periksaPola({
    kandidat: saw.map((s) => ({ id: s.id, nama: s.nama })),
    entri: bemEntri.map((d) => ({ id: d.row.id, pengguna_id: d.row.pengguna_id, verifikator_id: id.get(d.e.verif!)!, verifikator_nama: nama.get(d.e.verif!)!, diverifikasi_pada: d.waktu })),
    tanggalBuka: hariIniWib,
    ambang: AMBANG_AWAL,
    penetapan: [],
  });
  if (temuan.length) wajib(await db.from('penanda_pola').insert(temuan.map((t) => ({ periode_id: pBem, ...t }))).select(), 'penanda');

  console.log('\nSelesai.');
  console.log(`  ${AKUN.length + 1} akun, ${ENTRI.length} entri, ${disetujui.length} segel, ${temuan.length} penanda pola.`);
  console.log(`  Peringkat BEM KEMA: ${saw.map((s) => `${s.nama.split(' ')[0]} ${s.skor}`).join(', ')}`);
  console.log(`\nSemua akun memakai kata sandi: ${SANDI}`);
  console.log('  Superadmin          admin@sigap.test');
  console.log('  Auditor kampus      kemahasiswaan@sigap.test');
  console.log('  Admin BEM           sekjen.bem@sigap.test');
  console.log('  Verifikator BEM     kabid.bem@sigap.test, budi.bem@sigap.test, pembina.bem@sigap.test');
  console.log('  Panitia BEM         panitia.bem@sigap.test');
  console.log('  Anggota BEM         raka@sigap.test, alya@sigap.test, …');
  console.log('  Admin UKM SEARCH    ketua.search@sigap.test');
}

main().catch((e) => {
  console.error('\nSeed gagal:', e instanceof Error ? e.message : e);
  process.exit(1);
});
