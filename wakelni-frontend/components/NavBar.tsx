// app/components/NavBar.tsx (ou où est ton composant)
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function NavBar() {
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // true si on est dans un espace “dashboard”
  const isDashboard =
    pathname.startsWith('/client') || pathname.startsWith('/cuisinier');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedUsername = window.localStorage.getItem('username');
    const storedRole = window.localStorage.getItem('role');

    setUsername(storedUsername);
    setRole(storedRole);
  }, []);

  const handleLogout = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('accessToken');
    window.localStorage.removeItem('refreshToken');
    window.localStorage.removeItem('username');
    window.localStorage.removeItem('email');
    window.localStorage.removeItem('role');
    router.push('/');
  };

  const isLoggedIn = !!username;

  return (
    <header className="wakelni-header">
      <div className="wakelni-header-inner">
        {/* Logo toujours visible */}
        <div className="logo">
          <Link href="/">Wakelni</Link>
        </div>

        {/* Liens de navigation : seulement si on N'EST PAS sur /client ou /cuisinier */}
        {!isDashboard && (
          <>
            <nav className="nav-links">
              <Link href="/plats">Plats</Link>

              {/* Pas connecté → Inscription / Connexion */}
              {!isLoggedIn && (
                <>
                  <Link href="/register/client">Inscription</Link>
                  <Link href="/login">Connexion</Link>
                </>
              )}

              {/* Connecté + cuisinier → lien tableau de bord */}
              {isLoggedIn && role === 'CUISINIER' && (
                <Link href="/cuisinier">Tableau de bord</Link>
              )}
            </nav>

            {/* Zone droite (info user + déconnexion) aussi seulement hors dashboards */}
            <div className="nav-right">
              {isLoggedIn && !isDashboard && (
                <>
                  <span className="user-info">
                    Connecté : {username} ({role || 'CLIENT'})
                  </span>
                  <button className="logout-btn" onClick={handleLogout}>
                    Déconnexion
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
