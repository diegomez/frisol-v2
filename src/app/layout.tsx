import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Frisol v2',
  description: 'Framework 4D — Traspaso Comercial → Desarrollo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
