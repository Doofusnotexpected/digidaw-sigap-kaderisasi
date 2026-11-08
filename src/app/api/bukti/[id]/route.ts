// GET /api/bukti/:id : buka berkas atau tautan bukti sebuah entri, setelah cek hak akses.
import { NextResponse, type NextRequest } from 'next/server';
import { pengguna } from '@/lib/server/konteks';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Keanggotaan, Kontribusi } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const p = await pengguna();
  if (!p) return NextResponse.json({ galat: 'Masuk terlebih dahulu.' }, { status: 401 });
  const admin = createAdminClient();
  const { data } = await admin.from('kontribusi').select('*').eq('id', params.id).maybeSingle();
  const k = data as Kontribusi | null;
  if (!k) return NextResponse.json({ galat: 'Entri tidak ditemukan.' }, { status: 404 });

  let boleh = k.pengguna_id === p.profil.id || p.profil.peran_global !== 'MAHASISWA';
  if (!boleh) {
    const { data: m } = await admin.from('keanggotaan').select('*').eq('organisasi_id', k.organisasi_id).eq('pengguna_id', p.profil.id).eq('aktif', true).maybeSingle();
    const peran = (m as Keanggotaan | null)?.peran ?? [];
    boleh = peran.some((r) => ['VERIFIKATOR', 'PANITIA', 'AUDITOR', 'ADMIN'].includes(r));
  }
  if (!boleh) return NextResponse.json({ galat: 'Anda tidak berwenang melihat bukti ini.' }, { status: 403 });

  if (k.bukti_path) {
    const { data: url } = await admin.storage.from('bukti').createSignedUrl(k.bukti_path, 120);
    if (url?.signedUrl) return NextResponse.redirect(url.signedUrl);
  }
  if (k.bukti_url) return NextResponse.redirect(k.bukti_url);
  return NextResponse.json({ galat: 'Entri ini tidak punya bukti.' }, { status: 404 });
}
