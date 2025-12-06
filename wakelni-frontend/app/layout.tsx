// app/layout.tsx
import type { ReactNode } from 'react';
import './globals.css';
import NavBar from '../components/NavBar';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
