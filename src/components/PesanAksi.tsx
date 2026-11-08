import type { HasilAksi } from '@/lib/types';

export function PesanAksi({ hasil }: { hasil: HasilAksi }) {
  if (!hasil?.pesan) return null;
  return (
    <p role={hasil.ok ? 'status' : 'alert'} className="text-xs font-semibold" style={{ color: hasil.ok ? 'var(--seal)' : 'var(--telkom)' }}>
      {hasil.pesan}
    </p>
  );
}

export function GalatField({ hasil, nama }: { hasil: HasilAksi; nama: string }) {
  const t = hasil?.galat?.[nama];
  return t ? <p className="error-text">{t}</p> : null;
}
