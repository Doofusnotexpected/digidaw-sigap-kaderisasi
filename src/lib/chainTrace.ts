// src/lib/chainTrace.ts
// Menelusuri rantai segel per entri. Entri yang isinya berubah ditandai "diubah",
// dan semua segel sesudahnya ditandai "terdampak" karena bergantung pada segel itu
// (prinsip buku bernomor urut pada proposal Bab 4.2 langkah 3).
import { EntriKontribusi, SegelHash } from '../types';
import { buatPayloadEntri, hitungSHA256 } from './hashEngine';

export type StatusSegel = 'utuh' | 'diubah' | 'terdampak' | 'hilang';

export async function telusuriRantai(
  segelList: SegelHash[],
  entriList: EntriKontribusi[]
): Promise<StatusSegel[]> {
  const hasil: StatusSegel[] = [];
  let sudahPutus = false;

  for (const segel of segelList) {
    const entri = entriList.find((e) => e.id === segel.entriId);
    if (!entri) {
      hasil.push('hilang');
      sudahPutus = true;
      continue;
    }
    const hitungUlang = await hitungSHA256(`${segel.hashSebelumnya}|${buatPayloadEntri(entri)}`);
    if (hitungUlang !== segel.hashSaatIni) {
      hasil.push('diubah');
      sudahPutus = true;
    } else {
      hasil.push(sudahPutus ? 'terdampak' : 'utuh');
    }
  }
  return hasil;
}
