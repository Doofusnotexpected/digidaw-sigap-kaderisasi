// GET /api/ekspor?format=csv|json
// Rekam jejak terverifikasi milik pengguna sendiri. Hanya pemilik data yang
// dapat mengekspor (proposal: ekspor atas izin pemilik data).
import { NextResponse, type NextRequest } from 'next/server';
import { pengguna } from '@/lib/server/konteks';
import { createAdminClient } from '@/lib/supabase/admin';
import { catatAudit } from '@/lib/server/data';
import type { Kontribusi, Organisasi, SegelHash } from '@/lib/types';

export const dynamic = 'force-dynamic';

const sel = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(req: NextRequest) {
  const p = await pengguna();
  if (!p) return NextResponse.json({ galat: 'Masuk terlebih dahulu.' }, { status: 401 });
  const format = req.nextUrl.searchParams.get('format') === 'json' ? 'json' : 'csv';
  const admin = createAdminClient();

  const { data: entri } = await admin.from('kontribusi').select('*').eq('pengguna_id', p.profil.id).eq('status', 'DISETUJUI').order('tanggal_kegiatan');
  const daftar = (entri ?? []) as Kontribusi[];
  const ids = daftar.map((e) => e.id);
  const [{ data: segel }, { data: orgs }, { data: verif }] = await Promise.all([
    ids.length ? admin.from('segel_hash').select('*').in('kontribusi_id', ids) : Promise.resolve({ data: [] }),
    admin.from('organisasi').select('*'),
    admin.from('profil').select('id, nama').in('id', [...new Set(daftar.map((e) => e.verifikator_id ?? ''))].filter(Boolean).concat('00000000-0000-0000-0000-000000000000')),
  ]);
  const segelPeta = new Map(((segel ?? []) as SegelHash[]).map((s) => [s.kontribusi_id, s]));
  const orgPeta = new Map(((orgs ?? []) as Organisasi[]).map((o) => [o.id, o]));
  const verifPeta = new Map(((verif ?? []) as { id: string; nama: string }[]).map((v) => [v.id, v.nama]));

  const baris = daftar.map((e) => ({
    organisasi: orgPeta.get(e.organisasi_id)?.nama ?? '',
    kegiatan: e.kegiatan,
    peran: e.peran_kegiatan,
    periode: e.periode_kegiatan,
    tanggal: e.tanggal_kegiatan,
    nilai_konsistensi: e.nilai_kepemimpinan,
    nilai_keandalan: e.nilai_eksekusi,
    nilai_kolaborasi: e.nilai_kolaborasi,
    nilai_dampak: e.nilai_dampak,
    diverifikasi_oleh: verifPeta.get(e.verifikator_id ?? '') ?? '',
    diverifikasi_pada: e.diverifikasi_pada,
    nomor_segel: segelPeta.get(e.id)?.urutan ?? '',
    segel_sha256: segelPeta.get(e.id)?.hash_entri ?? '',
  }));

  await catatAudit({ aktor: { id: p.profil.id, nama: p.profil.nama }, aksi: 'Rekam jejak diekspor oleh pemilik', keterangan: `${baris.length} entri, format ${format.toUpperCase()}.` });

  const namaBerkas = `rekam-jejak-sigap-${p.profil.nim ?? p.profil.id.slice(0, 8)}`;
  if (format === 'json') {
    const isi = {
      pemilik: { nama: p.profil.nama, nim: p.profil.nim, jurusan: p.profil.jurusan, angkatan: p.profil.angkatan },
      diekspor_pada: new Date().toISOString(),
      catatan: 'Segel dapat dicocokkan dengan rantai SIGAP Kaderisasi melalui auditor organisasi.',
      entri: baris,
    };
    return new NextResponse(JSON.stringify(isi, null, 2), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="${namaBerkas}.json"` },
    });
  }
  const kolom = Object.keys(baris[0] ?? { organisasi: '', kegiatan: '' });
  const csv = '﻿' + [kolom.join(','), ...baris.map((b) => kolom.map((k) => sel((b as Record<string, unknown>)[k])).join(','))].join('\n');
  return new NextResponse(csv, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${namaBerkas}.csv"` },
  });
}
