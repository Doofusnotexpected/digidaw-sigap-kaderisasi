import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        ink: 'var(--ink)',
        graphite: 'var(--graphite)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        navy: { DEFAULT: 'var(--navy)', 2: 'var(--navy-2)', line: 'var(--navy-line)', text: 'var(--navy-text)' },
        telkom: { DEFAULT: 'var(--telkom)', soft: 'var(--telkom-soft)' },
        seal: { DEFAULT: 'var(--seal)', soft: 'var(--seal-soft)' },
        amber: { DEFAULT: 'var(--amber)', soft: 'var(--amber-soft)' },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: { panel: '14px' },
    },
  },
  plugins: [],
};
export default config;
