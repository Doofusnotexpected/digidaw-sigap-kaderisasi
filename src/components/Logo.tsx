export function Logo({ kecil = false }: { kecil?: boolean }) {
  const s = kecil ? 30 : 36;
  return (
    <span className="relative rounded-[9px] flex items-center justify-center shrink-0" style={{ width: s, height: s, background: 'var(--telkom)' }}>
      <svg viewBox="0 0 20 20" width={s / 2} height={s / 2} aria-hidden>
        <rect x="3" y="3" width="6" height="6" rx="1.5" fill="#fff" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" fill="#fff" />
        <path d="M9 6h2.5a2.5 2.5 0 0 1 2.5 2.5V11" stroke="#fff" strokeWidth="1.6" fill="none" />
      </svg>
    </span>
  );
}
