// Mesin aturan penanda pola (proposal Bab 4.2 langkah 6).
// Sengaja sederhana dan tanpa AI: setiap peringatan menyebut aturan
// yang terpicu dan data yang mendasarinya.
import type { Ambang, AturanPola } from './types';

export const AMBANG_AWAL: Ambang = {
  lonjakan_jumlah: 5,
  lonjakan_hari: 7,
  dominan_persen: 70,
  dominan_min_entri: 4,
  alasan_min_karakter: 60,
};

export const NAMA_ATURAN: Record<AturanPola, string> = {
  LONJAKAN_PERSETUJUAN: 'Lonjakan persetujuan',
  VERIFIKATOR_DOMINAN: 'Verifikator dominan',
  ALASAN_SINGKAT: 'Pilihan tanpa alasan memadai',
};

export function uraianAturan(aturan: AturanPola, a: Ambang): string {
  switch (aturan) {
    case 'LONJAKAN_PERSETUJUAN':
      return `Lebih dari ${a.lonjakan_jumlah} entri seorang kandidat disetujui dalam ${a.lonjakan_hari} hari sebelum periode suksesi dibuka.`;
    case 'VERIFIKATOR_DOMINAN':
      return `Satu verifikator menyetujui lebih dari ${a.dominan_persen}% entri seorang kandidat (dihitung bila kandidat punya minimal ${a.dominan_min_entri} entri).`;
    case 'ALASAN_SINGKAT':
      return `Kandidat berskor kecocokan lebih rendah ditetapkan dengan alasan tertulis kurang dari ${a.alasan_min_karakter} karakter.`;
  }
}

export type EntriPola = {
  id: string;
  pengguna_id: string;
  verifikator_id: string;
  verifikator_nama: string;
  diverifikasi_pada: string;
};

export type PenetapanPola = {
  kandidat_id: string;
  slot_nama: string;
  alasan_tertulis: string | null;
  skor_kecocokan: number;
  kecocokan_tertinggi: number | null;
};

export type HasilPola = {
  aturan: AturanPola;
  subjek_id: string;
  keterangan: string;
  data: Record<string, unknown>;
};

/** Awal hari tanggal_buka menurut WIB */
export function awalPeriode(tanggalBuka: string): Date {
  return new Date(`${tanggalBuka}T00:00:00+07:00`);
}

export function periksaPola(input: {
  kandidat: { id: string; nama: string }[];
  entri: EntriPola[];
  tanggalBuka: string;
  ambang: Ambang;
  penetapan: PenetapanPola[];
}): HasilPola[] {
  const { kandidat, entri, tanggalBuka, ambang, penetapan } = input;
  const hasil: HasilPola[] = [];
  const buka = awalPeriode(tanggalBuka).getTime();
  const awalJendela = buka - ambang.lonjakan_hari * 86_400_000;

  for (const k of kandidat) {
    const milik = entri.filter((e) => e.pengguna_id === k.id);
    if (milik.length === 0) continue;

    // Aturan 1: lonjakan persetujuan
    const dalamJendela = milik.filter((e) => {
      const t = new Date(e.diverifikasi_pada).getTime();
      return t >= awalJendela && t < buka;
    });
    if (dalamJendela.length > ambang.lonjakan_jumlah) {
      hasil.push({
        aturan: 'LONJAKAN_PERSETUJUAN',
        subjek_id: k.id,
        keterangan: `${dalamJendela.length} entri ${k.nama} disetujui dalam ${ambang.lonjakan_hari} hari sebelum periode dibuka (batas ${ambang.lonjakan_jumlah}).`,
        data: {
          jumlah: dalamJendela.length,
          batas: ambang.lonjakan_jumlah,
          hari: ambang.lonjakan_hari,
          entri_id: dalamJendela.map((e) => e.id),
        },
      });
    }

    // Aturan 2: verifikator dominan
    if (milik.length >= ambang.dominan_min_entri) {
      const hitung = new Map<string, { nama: string; n: number }>();
      for (const e of milik) {
        const h = hitung.get(e.verifikator_id) ?? { nama: e.verifikator_nama, n: 0 };
        h.n += 1;
        hitung.set(e.verifikator_id, h);
      }
      const [vid, top] = [...hitung.entries()].sort((a, b) => b[1].n - a[1].n)[0];
      const persen = (top.n / milik.length) * 100;
      if (persen > ambang.dominan_persen) {
        hasil.push({
          aturan: 'VERIFIKATOR_DOMINAN',
          subjek_id: k.id,
          keterangan: `${top.nama} menyetujui ${top.n} dari ${milik.length} entri ${k.nama} (${Math.round(persen)}%, batas ${ambang.dominan_persen}%).`,
          data: { verifikator_id: vid, verifikator_nama: top.nama, jumlah: top.n, total: milik.length, persen: Math.round(persen) },
        });
      }
    }
  }

  // Aturan 3: pilihan tanpa alasan memadai
  for (const p of penetapan) {
    if (p.alasan_tertulis && p.alasan_tertulis.trim().length < ambang.alasan_min_karakter) {
      const nama = kandidat.find((k) => k.id === p.kandidat_id)?.nama ?? 'Kandidat';
      hasil.push({
        aturan: 'ALASAN_SINGKAT',
        subjek_id: p.kandidat_id,
        keterangan: `${nama} ditetapkan sebagai ${p.slot_nama} (kecocokan ${p.skor_kecocokan}, tertinggi ${p.kecocokan_tertinggi ?? '-'}) dengan alasan ${p.alasan_tertulis.trim().length} karakter.`,
        data: { slot: p.slot_nama, alasan: p.alasan_tertulis, panjang: p.alasan_tertulis.trim().length, batas: ambang.alasan_min_karakter },
      });
    }
  }

  return hasil;
}
