// src/lib/sawEngine.ts
import { EntriKontribusi } from '../types';

export const BOBOT_SAW = {
  kepemimpinan: 0.35,
  eksekusi: 0.30,
  kolaborasi: 0.20,
  dampak: 0.15,
};

export interface SkorKandidatSAW {
  kandidatId: string;
  namaKandidat: string;
  skorMentah: { kepemimpinan: number; eksekusi: number; kolaborasi: number; dampak: number };
  skorNormalisasi: { kepemimpinan: number; eksekusi: number; kolaborasi: number; dampak: number };
  skorAkhirSAW: number;
  peringkat: number;
}

export function hitungMatriksSAW(
  kandidatList: { id: string; nama: string; entri: EntriKontribusi[] }[]
): SkorKandidatSAW[] {
  const agregat = kandidatList.map((k) => {
    const valid = k.entri.filter((e) => e.statusVerifikasi === 'DISETUJUI');
    const count = valid.length || 1;
    return {
      id: k.id,
      nama: k.nama,
      kepemimpinan: valid.reduce((s, e) => s + e.skorKepemimpinan, 0) / count,
      eksekusi: valid.reduce((s, e) => s + e.skorEksekusi, 0) / count,
      kolaborasi: valid.reduce((s, e) => s + e.skorKolaborasi, 0) / count,
      dampak: valid.reduce((s, e) => s + e.skorDampak, 0) / count,
    };
  });

  // Skala benefit max (standar evaluasi 5.0)
  const maxK = 5.0;
  const maxE = 5.0;
  const maxKo = 5.0;
  const maxD = 5.0;

  const hasil: SkorKandidatSAW[] = agregat.map((a) => {
    const rK = a.kepemimpinan / maxK;
    const rE = a.eksekusi / maxE;
    const rKo = a.kolaborasi / maxKo;
    const rD = a.dampak / maxD;

    const saw =
      rK * BOBOT_SAW.kepemimpinan +
      rE * BOBOT_SAW.eksekusi +
      rKo * BOBOT_SAW.kolaborasi +
      rD * BOBOT_SAW.dampak;

    return {
      kandidatId: a.id,
      namaKandidat: a.nama,
      skorMentah: { kepemimpinan: a.kepemimpinan, eksekusi: a.eksekusi, kolaborasi: a.kolaborasi, dampak: a.dampak },
      skorNormalisasi: { kepemimpinan: rK, eksekusi: rE, kolaborasi: rKo, dampak: rD },
      skorAkhirSAW: Number((saw * 100).toFixed(1)),
      peringkat: 0,
    };
  });

  return hasil
    .sort((a, b) => b.skorAkhirSAW - a.skorAkhirSAW)
    .map((item, index) => ({ ...item, peringkat: index + 1 }));
}

// 3 Aturan Utk Penanda Pola (Deterministik & Dapat Dijelaskan)
export function periksaPenandaPola(
  kandidatId: string,
  semuaEntri: EntriKontribusi[],
  kandidatTerpilihPeringkat: number,
  alasanTertulis: string
): string[] {
  const flags: string[] = [];
  const entriKandidat = semuaEntri.filter((e) => e.kandidatId === kandidatId && e.statusVerifikasi === 'DISETUJUI');

  // Aturan 1: Lonjakan Persetujuan buat H-7
  const cutoff = new Date('2026-11-08T00:00:00Z').getTime();
  const lonjakan = entriKandidat.filter((e) => {
    const t = new Date(e.waktuVerifikasi).getTime();
    const selisihHari = (cutoff - t) / (1000 * 3600 * 24);
    return selisihHari >= 0 && selisihHari <= 7;
  });
  if (lonjakan.length > 5) {
    flags.push(`Penanda Pola: Lonjakan ${lonjakan.length} persetujuan dalam 7 hari menjelang periode suksesi.`);
  }

  // Aturan 2: Verifikator Dominan
  if (entriKandidat.length >= 4) {
    const counts: Record<string, number> = {};
    entriKandidat.forEach((e) => {
      counts[e.verifikatorNama] = (counts[e.verifikatorNama] || 0) + 1;
    });
    for (const [nama, jml] of Object.entries(counts)) {
      if (jml / entriKandidat.length > 0.7) {
        flags.push(`Penanda Pola: Verifikator dominan terdeteksi (${nama} menyetujui ${((jml / entriKandidat.length) * 100).toFixed(0)}% entri).`);
      }
    }
  }

  // Aturan 3: Alasanya Tertulis Wajib
  if (kandidatTerpilihPeringkat > 1) {
    if (!alasanTertulis || alasanTertulis.trim().length < 20) {
      flags.push(`Peringatan Etik: Menetapkan kandidat peringkat #${kandidatTerpilihPeringkat} tanpa justifikasi tertulis yang memadai (minimal 20 karakter).`);
    }
  }

  return flags;
}