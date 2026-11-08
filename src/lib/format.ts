// Format tampilan (zona waktu WIB)
const fTanggal = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' });
const fWaktu = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });

export const tanggal = (s?: string | null) => (s ? fTanggal.format(new Date(s.length === 10 ? `${s}T00:00:00+07:00` : s)) : '-');
export const waktu = (s?: string | null) => (s ? fWaktu.format(new Date(s)).replace(/\./g, ':') : '-');
export const potongHash = (h?: string | null, n = 8) => (h ? `${h.slice(0, n)}…${h.slice(-4)}` : '');
export const persen = (n: number) => `${Math.round(n * 100)}%`;
export const satuDesimal = (n: number | string | null | undefined) => (n === null || n === undefined ? '-' : Number(n).toFixed(1).replace('.', ','));
export const inisial = (nama: string) =>
  nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
export const hariIni = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
