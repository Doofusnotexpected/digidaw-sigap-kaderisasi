// Modul hash berantai (proposal Bab 4.2 langkah 3).
// Isi entri digabung dengan segel entri sebelumnya, lalu dihitung SHA-256.
// Hanya dipakai di server (node:crypto).
import { createHash } from 'node:crypto';
import type { Kontribusi } from './types';

export const GENESIS = '0'.repeat(64);

/** Bentuk kanonik isi entri. Urutan field tetap, waktu dinormalkan ke ISO UTC. */
export function payloadKontribusi(k: Kontribusi): string {
  return JSON.stringify([
    k.id,
    k.pengguna_id,
    k.organisasi_id,
    k.kegiatan,
    k.peran_kegiatan,
    k.periode_kegiatan,
    k.tanggal_kegiatan,
    k.uraian ?? '',
    k.bukti_url ?? '',
    k.bukti_path ?? '',
    k.status,
    k.nilai_kepemimpinan,
    k.nilai_eksekusi,
    k.nilai_kolaborasi,
    k.nilai_dampak,
    k.catatan_verifikator ?? '',
    k.verifikator_id,
    k.diverifikasi_pada ? new Date(k.diverifikasi_pada).toISOString() : null,
  ]);
}

export function sha256(teks: string): string {
  return createHash('sha256').update(teks, 'utf8').digest('hex');
}

export function hitungSegel(hashSebelumnya: string, k: Kontribusi): string {
  return sha256(`${hashSebelumnya}|${payloadKontribusi(k)}`);
}
