'use client';

// Cadangan terakhir bila root layout sendiri gagal
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="id">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: 40, background: '#eef1f3', color: '#17202b' }}>
        <h1 style={{ fontSize: 20 }}>SIGAP gagal dimuat</h1>
        <p style={{ fontSize: 14 }}>Periksa terminal tempat server berjalan untuk detail error.</p>
        <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{error.message}</pre>
        <button onClick={reset} style={{ marginTop: 16, padding: '8px 14px' }}>Coba lagi</button>
      </body>
    </html>
  );
}
