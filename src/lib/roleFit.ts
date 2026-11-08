// src/lib/roleFit.ts
// Pencocokan peran (proposal Bab 4.2 langkah 5): tiap slot memakai bobot berbeda,
// misalnya keandalan eksekusi dibobot lebih tinggi untuk Bendahara.
import { CabinetRoleKey } from '../types';
import { SkorKandidatSAW } from './sawEngine';

type Bobot = { kepemimpinan: number; eksekusi: number; kolaborasi: number; dampak: number };

export const BOBOT_PERAN: Record<CabinetRoleKey, Bobot> = {
  KETUA: { kepemimpinan: 0.4, eksekusi: 0.25, kolaborasi: 0.2, dampak: 0.15 },
  WAKIL_KETUA: { kepemimpinan: 0.3, eksekusi: 0.25, kolaborasi: 0.3, dampak: 0.15 },
  BENDAHARA: { kepemimpinan: 0.15, eksekusi: 0.5, kolaborasi: 0.15, dampak: 0.2 },
  KABID_KADERISASI: { kepemimpinan: 0.25, eksekusi: 0.2, kolaborasi: 0.35, dampak: 0.2 },
};

export function skorKecocokan(kandidat: SkorKandidatSAW, kodePeran: CabinetRoleKey): number {
  const w = BOBOT_PERAN[kodePeran];
  const r = kandidat.skorNormalisasi;
  const v = r.kepemimpinan * w.kepemimpinan + r.eksekusi * w.eksekusi + r.kolaborasi * w.kolaborasi + r.dampak * w.dampak;
  return Number((v * 100).toFixed(1));
}
