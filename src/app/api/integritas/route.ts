// GET /api/integritas : periksa ulang seluruh rantai segel (modul hash berantai)
import { NextResponse } from 'next/server';
import { pengguna } from '@/lib/server/konteks';
import { periksaIntegritas } from '@/lib/server/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const p = await pengguna();
  if (!p) return NextResponse.json({ galat: 'Masuk terlebih dahulu.' }, { status: 401 });
  const laporan = await periksaIntegritas();
  return NextResponse.json({
    utuh: laporan.utuh,
    jumlahSegel: laporan.jumlahSegel,
    segelRusakPertama: laporan.segelRusakPertama,
    tanpaSegel: laporan.tanpaSegel.length,
    diperiksaPada: laporan.diperiksaPada,
    segel: laporan.hasil.map((h) => ({ urutan: h.urutan, status: h.status, hash_sebelumnya: h.hash_sebelumnya, hash_entri: h.hash_entri })),
  });
}
