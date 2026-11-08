// Utilitas kecil untuk server action
import 'server-only';
import { revalidatePath } from 'next/cache';

export const teks = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
export const angka = (fd: FormData, k: string) => Number(fd.get(k));

export function gagal(pesan: string, galat?: Record<string, string>) {
  return { ok: false as const, pesan, galat };
}
export function berhasil(pesan: string, data?: Record<string, unknown>) {
  return { ok: true as const, pesan, data };
}

export function segarkanOrg(slug: string) {
  revalidatePath(`/o/${slug}`, 'layout');
}

/** Ubah galat zod menjadi peta field -> pesan */
export function galatZod(issues: { path: (string | number)[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? 'umum');
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

/** Cegah open redirect pada parameter ?lanjut= */
export function jalurAman(p: string | null | undefined, cadangan = '/beranda') {
  if (!p || !p.startsWith('/') || p.startsWith('//')) return cadangan;
  return p;
}
