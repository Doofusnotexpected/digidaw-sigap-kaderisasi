'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { LoaderCircle } from 'lucide-react';

/** Tombol kirim yang otomatis nonaktif saat server action berjalan */
export function TombolKirim({ children, kelas = 'btn btn-primary', nama, nilai, disabled }: { children: ReactNode; kelas?: string; nama?: string; nilai?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={kelas} disabled={pending || disabled} name={nama} value={nilai} aria-busy={pending}>
      {pending && <LoaderCircle className="w-4 h-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
