// Uji modul inti: SAW (Tabel 2 proposal), kecocokan peran, hash berantai, penanda pola.
// Jalankan: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hitungSAW, skorKecocokan, pembandingTertinggi, BOBOT_AWAL } from '../src/lib/saw';
import { GENESIS, hitungSegel } from '../src/lib/segel';
import { telusuriRantai } from '../src/lib/integritas';
import { periksaPola, AMBANG_AWAL } from '../src/lib/penanda';
import type { Kontribusi, SegelHash } from '../src/lib/types';

test('SAW mereproduksi Tabel 2 proposal (90,0 / 92,2 / 84,4)', () => {
  const e = (k: number, x: number, ko: number, d: number) => ({ kepemimpinan: k, eksekusi: x, kolaborasi: ko, dampak: d });
  const hasil = hitungSAW(
    [
      { id: 'A', nama: 'A', entri: [e(4.5, 4.0, 3.5, 4.0)] },
      { id: 'B', nama: 'B', entri: [e(4.0, 4.5, 4.5, 3.5)] },
      { id: 'C', nama: 'C', entri: [e(3.5, 3.5, 4.0, 4.5)] },
    ],
    BOBOT_AWAL
  );
  const skor = Object.fromEntries(hasil.map((h) => [h.id, h.skor]));
  assert.deepEqual(skor, { A: 90.0, B: 92.2, C: 84.4 });
  assert.equal(hasil[0].id, 'B');
  assert.equal(hasil[0].peringkat, 1);
});

test('rata-rata dihitung dari seluruh entri terverifikasi', () => {
  const hasil = hitungSAW(
    [{ id: 'X', nama: 'X', entri: [{ kepemimpinan: 5, eksekusi: 3, kolaborasi: 4, dampak: 4 }, { kepemimpinan: 3, eksekusi: 5, kolaborasi: 4, dampak: 2 }] }],
    BOBOT_AWAL
  );
  assert.deepEqual(hasil[0].rataRata, { kepemimpinan: 4, eksekusi: 4, kolaborasi: 4, dampak: 3 });
  assert.equal(hasil[0].skor, 100); // satu kandidat selalu menjadi nilai tertinggi
});

test('bobot peran berbeda menghasilkan kecocokan berbeda, dan pembanding terdeteksi', () => {
  const hasil = hitungSAW(
    [
      { id: 'P', nama: 'Pemimpin', entri: [{ kepemimpinan: 5, eksekusi: 3, kolaborasi: 4, dampak: 4 }] },
      { id: 'E', nama: 'Eksekutor', entri: [{ kepemimpinan: 3, eksekusi: 5, kolaborasi: 4, dampak: 4 }] },
    ],
    BOBOT_AWAL
  );
  const bendahara = { kepemimpinan: 0.15, eksekusi: 0.5, kolaborasi: 0.15, dampak: 0.2 };
  const p = hasil.find((h) => h.id === 'P')!;
  const e = hasil.find((h) => h.id === 'E')!;
  assert.ok(skorKecocokan(e, bendahara) > skorKecocokan(p, bendahara));
  const pemb = pembandingTertinggi(hasil, 'P', bendahara, new Set());
  assert.equal(pemb?.kandidat.id, 'E');
  // bila E sudah di slot lain, tidak perlu alasan
  assert.equal(pembandingTertinggi(hasil, 'P', bendahara, new Set(['E'])), null);
});

function entri(id: string, ubah: Partial<Kontribusi> = {}): Kontribusi {
  return {
    id,
    pengguna_id: 'u1',
    organisasi_id: 'o1',
    kegiatan: `Kegiatan ${id}`,
    peran_kegiatan: 'Ketua',
    periode_kegiatan: '2026',
    tanggal_kegiatan: '2026-08-01',
    uraian: '',
    bukti_url: 'https://contoh.id/b.pdf',
    bukti_path: null,
    status: 'DISETUJUI',
    nilai_kepemimpinan: 4,
    nilai_eksekusi: 4,
    nilai_kolaborasi: 4,
    nilai_dampak: 4,
    catatan_verifikator: null,
    verifikator_id: 'v1',
    diverifikasi_pada: '2026-10-01T03:00:00.123+00:00',
    dibuat_pada: '2026-09-01T00:00:00Z',
    diubah_pada: '2026-10-01T00:00:00Z',
    ...ubah,
  };
}

function rantai(daftar: Kontribusi[]): SegelHash[] {
  let prev = GENESIS;
  return daftar.map((k, i) => {
    const h = hitungSegel(prev, k);
    const s = { id: `s${i}`, urutan: i + 1, kontribusi_id: k.id, hash_sebelumnya: prev, hash_entri: h, dibuat_pada: '' };
    prev = h;
    return s;
  });
}

test('rantai utuh terverifikasi, format waktu berbeda tetap cocok', () => {
  const data = [entri('k1'), entri('k2'), entri('k3')];
  const segel = rantai(data);
  const dariDb = data.map((k) => ({ ...k, diverifikasi_pada: '2026-10-01T03:00:00.123Z' }));
  const lap = telusuriRantai(segel, dariDb);
  assert.equal(lap.utuh, true);
  assert.deepEqual(lap.hasil.map((h) => h.status), ['utuh', 'utuh', 'utuh']);
});

test('mengubah satu entri lama membuat segel itu dan sesudahnya tidak cocok', () => {
  const data = [entri('k1'), entri('k2'), entri('k3'), entri('k4')];
  const segel = rantai(data);
  const diubah = data.map((k) => (k.id === 'k2' ? { ...k, nilai_eksekusi: 5 } : k));
  const lap = telusuriRantai(segel, diubah);
  assert.equal(lap.utuh, false);
  assert.equal(lap.segelRusakPertama, 2);
  assert.deepEqual(lap.hasil.map((h) => h.status), ['utuh', 'diubah', 'terdampak', 'terdampak']);
});

test('mencabut segel di tengah terdeteksi sebagai rantai putus', () => {
  const data = [entri('k1'), entri('k2'), entri('k3')];
  const segel = rantai(data).filter((s) => s.kontribusi_id !== 'k2');
  const lap = telusuriRantai(segel, data);
  assert.equal(lap.utuh, false);
  assert.deepEqual(lap.hasil.map((h) => h.status), ['utuh', 'putus']);
  assert.deepEqual(lap.tanpaSegel, ['k2']);
});

test('penanda pola: lonjakan, verifikator dominan, alasan singkat', () => {
  const buka = '2026-11-08';
  const e = (i: number, hariSebelum: number, verif = 'v1') => ({
    id: `e${i}`,
    pengguna_id: 'g',
    verifikator_id: verif,
    verifikator_nama: verif === 'v1' ? 'Budi' : 'Sari',
    diverifikasi_pada: new Date(new Date(`${buka}T00:00:00+07:00`).getTime() - hariSebelum * 86_400_000 + 3_600_000).toISOString(),
  });
  const hasil = periksaPola({
    kandidat: [{ id: 'g', nama: 'Gilang' }, { id: 'r', nama: 'Raka' }],
    entri: [1, 2, 3, 4, 5, 6].map((i) => e(i, i)),
    tanggalBuka: buka,
    ambang: AMBANG_AWAL,
    penetapan: [{ kandidat_id: 'r', slot_nama: 'Ketua', alasan_tertulis: 'Lebih senior.', skor_kecocokan: 88, kecocokan_tertinggi: 93 }],
  });
  assert.deepEqual(hasil.map((h) => h.aturan).sort(), ['ALASAN_SINGKAT', 'LONJAKAN_PERSETUJUAN', 'VERIFIKATOR_DOMINAN']);

  const aman = periksaPola({
    kandidat: [{ id: 'g', nama: 'Gilang' }],
    entri: [e(1, 1), e(2, 20, 'v2'), e(3, 30), e(4, 40, 'v2')],
    tanggalBuka: buka,
    ambang: AMBANG_AWAL,
    penetapan: [],
  });
  assert.equal(aman.length, 0);
});
