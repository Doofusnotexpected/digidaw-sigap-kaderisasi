// src/lib/hashEngine.ts
import { EntriKontribusi, SegelHash } from '../types/index';

export async function hitungSHA256(dataTeks: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(dataTeks);
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;

  if (cryptoObj && cryptoObj.subtle) {
    const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Fallback for non-subtle test runners
  let hash = 0;
  for (let i = 0; i < dataTeks.length; i++) {
    const char = dataTeks.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

export function buatPayloadEntri(entri: EntriKontribusi): string {
  return `${entri.id}|${entri.kandidatId}|${entri.namaKegiatan}|${entri.skorKepemimpinan.toFixed(1)},${entri.skorEksekusi.toFixed(1)},${entri.skorKolaborasi.toFixed(1)},${entri.skorDampak.toFixed(1)}|${entri.waktuVerifikasi}|${entri.verifikatorId}`;
}

export async function segelEntriBaru(
  entri: EntriKontribusi,
  hashSebelumnya: string
): Promise<SegelHash> {
  const payload = buatPayloadEntri(entri);
  const gabungan = `${hashSebelumnya}|${payload}`;
  const hashSaatIni = await hitungSHA256(gabungan);

  return {
    id: `segel-${entri.id}`,
    entriId: entri.id,
    hashSebelumnya,
    hashSaatIni,
    waktuPenyegelan: new Date().toISOString(),
    statusIntegritas: 'VALID',
  };
}

export async function verifikasiIntegritasRantai(
  segelList: SegelHash[],
  entriList: EntriKontribusi[]
): Promise<{ status: boolean; logAudit: string[] }> {
  const logs: string[] = [];
  let chainValid = true;

  for (let i = 0; i < segelList.length; i++) {
    const segel = segelList[i];
    const entri = entriList.find((e) => e.id === segel.entriId);

    if (!entri) {
      logs.push(`[ERROR] Entri ${segel.entriId} tidak ditemukan.`);
      chainValid = false;
      continue;
    }

    if (i > 0) {
      const segelSebelumnya = segelList[i - 1];
      if (segel.hashSebelumnya !== segelSebelumnya.hashSaatIni) {
        logs.push(`[RUSAK] Rantai terputus pada Segel #${i + 1} (${segel.id}).`);
        chainValid = false;
      }
    }

    const payloadAktual = buatPayloadEntri(entri);
    const hashHitungUlang = await hitungSHA256(`${segel.hashSebelumnya}|${payloadAktual}`);

    if (hashHitungUlang !== segel.hashSaatIni) {
      logs.push(`[MANIPULASI TERDETEKSI] Data entri ${entri.id} (${entri.namaKegiatan}) telah diubah!`);
      chainValid = false;
    } else {
      logs.push(`[VALID] Segel #${i + 1} (${segel.entriId}) terverifikasi utuh.`);
    }
  }

  return { status: chainValid, logAudit: logs };
}