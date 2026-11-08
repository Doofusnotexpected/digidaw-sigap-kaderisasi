import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', weight: ['400', '500', '600', '700', '800'] });
const jbmono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jbmono', weight: ['400', '500'] });

export const metadata: Metadata = {
  title: { default: 'SIGAP Kaderisasi', template: '%s | SIGAP Kaderisasi' },
  description: 'Regenerasi organisasi berdasarkan rekam jejak yang terverifikasi, bukan kedekatan.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${jakarta.variable} ${jbmono.variable}`}>{children}</body>
    </html>
  );
}
