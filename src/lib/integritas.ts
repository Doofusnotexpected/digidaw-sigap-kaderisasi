// Penelusuran rantai segel. Murni (tanpa I/O) supaya mudah diuji.
import { GENESIS, hitungSegel } from './segel';
import type { Kontribusi, SegelHash } from './types';

export type StatusSegel =
  | 'utuh' // isi cocok dan tersambung ke segel sebelumnya
  | 'diubah' // isi entri berubah setelah disegel
  | 'putus' // sambungan ke segel sebelumnya tidak cocok (segel disisipkan/dicabut)
  | 'terdampak' // entri tidak berubah, tetapi berada setelah segel yang rusak
  | 'hilang'; // entri yang disegel tidak ditemukan

export type HasilSegel = {
  urutan: number;
  segel_id: string;
  kontribusi_id: string;
  organisasi_id: string | null;
  hash_sebelumnya: string;
  hash_entri: string;
  hash_hitung_ulang: string | null;
  status: StatusSegel;
};

export type LaporanIntegritas = {
  utuh: boolean;
  jumlahSegel: number;
  segelRusakPertama: number | null;
  hasil: HasilSegel[];
  /** Entri berstatus DISETUJUI yang tidak punya segel (status diubah langsung di basis data) */
  tanpaSegel: string[];
  diperiksaPada: string;
};

export function telusuriRantai(segel: SegelHash[], kontribusi: Kontribusi[]): LaporanIntegritas {
  const urut = [...segel].sort((a, b) => a.urutan - b.urutan);
  const peta = new Map(kontribusi.map((k) => [k.id, k]));
  const hasil: HasilSegel[] = [];
  let sebelumnya = GENESIS;
  let rusak = false;
  let pertama: number | null = null;

  for (const s of urut) {
    const k = peta.get(s.kontribusi_id);
    let status: StatusSegel;
    let hitung: string | null = null;

    if (!k) {
      status = 'hilang';
    } else {
      hitung = hitungSegel(s.hash_sebelumnya, k);
      if (s.hash_sebelumnya !== sebelumnya) status = 'putus';
      else if (hitung !== s.hash_entri) status = 'diubah';
      else status = rusak ? 'terdampak' : 'utuh';
    }

    if (status !== 'utuh' && status !== 'terdampak') {
      rusak = true;
      if (pertama === null) pertama = s.urutan;
    }

    hasil.push({
      urutan: s.urutan,
      segel_id: s.id,
      kontribusi_id: s.kontribusi_id,
      organisasi_id: k?.organisasi_id ?? null,
      hash_sebelumnya: s.hash_sebelumnya,
      hash_entri: s.hash_entri,
      hash_hitung_ulang: hitung,
      status,
    });
    sebelumnya = s.hash_entri;
  }

  const tersegel = new Set(urut.map((s) => s.kontribusi_id));
  const tanpaSegel = kontribusi.filter((k) => k.status === 'DISETUJUI' && !tersegel.has(k.id)).map((k) => k.id);

  return {
    utuh: !rusak && tanpaSegel.length === 0,
    jumlahSegel: urut.length,
    segelRusakPertama: pertama,
    hasil,
    tanpaSegel,
    diperiksaPada: new Date().toISOString(),
  };
}
