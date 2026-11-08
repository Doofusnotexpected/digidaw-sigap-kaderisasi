'use client';

// Tombol aksi dua langkah: klik pertama meminta konfirmasi, klik kedua menjalankan.
import { useState, type ReactNode } from 'react';
import { TombolKirim } from './Tombol';

export function FormKonfirmasi({
  aksi,
  data,
  label,
  konfirmasi,
  kelas = 'btn btn-quiet btn-sm',
  kelasKonfirmasi = 'btn btn-danger btn-sm',
  ikon,
}: {
  aksi: (fd: FormData) => Promise<void>;
  data: Record<string, string>;
  label: string;
  konfirmasi: string;
  kelas?: string;
  kelasKonfirmasi?: string;
  ikon?: ReactNode;
}) {
  const [yakin, setYakin] = useState(false);
  if (!yakin) {
    return (
      <button type="button" className={kelas} onClick={() => setYakin(true)}>
        {ikon}
        {label}
      </button>
    );
  }
  return (
    <form action={aksi} className="inline-flex items-center gap-1.5">
      {Object.entries(data).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <TombolKirim kelas={kelasKonfirmasi}>{konfirmasi}</TombolKirim>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setYakin(false)}>
        Batal
      </button>
    </form>
  );
}
