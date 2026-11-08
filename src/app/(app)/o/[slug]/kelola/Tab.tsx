import Link from 'next/link';

export default function Tab({ slug, aktif }: { slug: string; aktif: 'anggota' | 'periode' }) {
  const t = [
    { k: 'anggota', href: `/o/${slug}/kelola`, label: 'Anggota dan peran' },
    { k: 'periode', href: `/o/${slug}/kelola/periode`, label: 'Periode, bobot, dan slot' },
  ];
  return (
    <nav className="flex gap-1 p-1 rounded-[10px] bg-surface border w-fit" style={{ borderColor: 'var(--line)' }}>
      {t.map((x) => (
        <Link key={x.k} href={x.href} aria-current={aktif === x.k ? 'page' : undefined} className="px-3.5 py-2 rounded-[7px] text-sm font-semibold" style={{ background: aktif === x.k ? 'var(--navy)' : 'transparent', color: aktif === x.k ? '#fff' : 'var(--graphite)' }}>
          {x.label}
        </Link>
      ))}
    </nav>
  );
}
