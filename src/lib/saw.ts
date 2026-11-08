// Modul skor SAW dan pencocokan peran (proposal Bab 4.2 langkah 4 dan 5).
//   r_ij = x_ij / max(x_j)
//   V_i  = Σ (w_j × r_ij), ditampilkan dalam skala 100
import type { Bobot } from './types';

export const ASPEK = [
  { key: 'kepemimpinan', label: 'Konsistensi kepemimpinan', singkat: 'Konsistensi', yangDinilai: 'Keberlanjutan peran dan tanggung jawab dari satu periode ke periode berikutnya' },
  { key: 'eksekusi', label: 'Keandalan eksekusi', singkat: 'Keandalan', yangDinilai: 'Tugas selesai sesuai target dan waktu' },
  { key: 'kolaborasi', label: 'Kolaborasi', singkat: 'Kolaborasi', yangDinilai: 'Kerja sama dengan pengurus dan anggota lain' },
  { key: 'dampak', label: 'Dampak organisasi', singkat: 'Dampak', yangDinilai: 'Hasil kegiatan bagi organisasi dan anggotanya' },
] as const;

export type AspekKey = (typeof ASPEK)[number]['key'];

export const BOBOT_AWAL: Bobot = { kepemimpinan: 0.3, eksekusi: 0.3, kolaborasi: 0.2, dampak: 0.2 };

export type NilaiEntri = { kepemimpinan: number; eksekusi: number; kolaborasi: number; dampak: number };

export type KandidatMasukan = { id: string; nama: string; entri: NilaiEntri[] };

export type HasilSAW = {
  id: string;
  nama: string;
  jumlahEntri: number;
  rataRata: NilaiEntri; // x_ij
  normalisasi: NilaiEntri; // r_ij
  skor: number; // V_i × 100, satu desimal
  peringkat: number;
};

const bulat = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

export function hitungSAW(kandidat: KandidatMasukan[], bobot: Bobot): HasilSAW[] {
  const valid = kandidat.filter((k) => k.entri.length > 0);
  if (valid.length === 0) return [];

  const rata = valid.map((k) => {
    const n = k.entri.length;
    const jumlah = k.entri.reduce(
      (a, e) => ({
        kepemimpinan: a.kepemimpinan + e.kepemimpinan,
        eksekusi: a.eksekusi + e.eksekusi,
        kolaborasi: a.kolaborasi + e.kolaborasi,
        dampak: a.dampak + e.dampak,
      }),
      { kepemimpinan: 0, eksekusi: 0, kolaborasi: 0, dampak: 0 }
    );
    return {
      kepemimpinan: jumlah.kepemimpinan / n,
      eksekusi: jumlah.eksekusi / n,
      kolaborasi: jumlah.kolaborasi / n,
      dampak: jumlah.dampak / n,
    };
  });

  const maks = ASPEK.reduce(
    (m, a) => ({ ...m, [a.key]: Math.max(...rata.map((r) => r[a.key])) }),
    {} as NilaiEntri
  );

  const hasil = valid.map((k, i) => {
    const x = rata[i];
    const r = ASPEK.reduce(
      (o, a) => ({ ...o, [a.key]: maks[a.key] > 0 ? x[a.key] / maks[a.key] : 0 }),
      {} as NilaiEntri
    );
    const v = ASPEK.reduce((s, a) => s + bobot[a.key] * r[a.key], 0);
    return {
      id: k.id,
      nama: k.nama,
      jumlahEntri: k.entri.length,
      rataRata: x,
      normalisasi: r,
      skor: bulat(v * 100),
      peringkat: 0,
    };
  });

  hasil.sort((a, b) => b.skor - a.skor || a.nama.localeCompare(b.nama));
  hasil.forEach((h, i) => {
    // skor sama mendapat peringkat sama
    h.peringkat = i > 0 && hasil[i - 1].skor === h.skor ? hasil[i - 1].peringkat : i + 1;
  });
  return hasil;
}

/** Skor kecocokan kandidat untuk satu slot peran, memakai bobot slot itu. */
export function skorKecocokan(h: Pick<HasilSAW, 'normalisasi'>, bobotSlot: Bobot): number {
  return bulat(ASPEK.reduce((s, a) => s + bobotSlot[a.key] * h.normalisasi[a.key], 0) * 100);
}

/**
 * Kandidat lain yang lebih cocok untuk slot ini dan belum ditetapkan di slot lain.
 * Bila ada, panitia wajib menulis alasan (proposal Bab 4.2 langkah 5).
 */
export function pembandingTertinggi(
  hasil: HasilSAW[],
  kandidatId: string,
  bobotSlot: Bobot,
  sudahDiSlotLain: Set<string>
): { kandidat: HasilSAW; skor: number } | null {
  const pilihan = hasil.find((h) => h.id === kandidatId);
  if (!pilihan) return null;
  const skorPilihan = skorKecocokan(pilihan, bobotSlot);
  let terbaik: { kandidat: HasilSAW; skor: number } | null = null;
  for (const h of hasil) {
    if (h.id === kandidatId || sudahDiSlotLain.has(h.id)) continue;
    const s = skorKecocokan(h, bobotSlot);
    if (s > skorPilihan && (!terbaik || s > terbaik.skor)) terbaik = { kandidat: h, skor: s };
  }
  return terbaik;
}

export function bobotValid(b: Bobot): boolean {
  const nilai = ASPEK.map((a) => b[a.key]);
  return nilai.every((n) => Number.isFinite(n) && n >= 0) && Math.abs(nilai.reduce((s, n) => s + n, 0) - 1) < 0.0001;
}
