'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function NavBar() {
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const pathname = usePathname();
  const router = useRouter();

  const isHome = pathname === '/';
  const isDashboard =
    pathname.startsWith('/client') || pathname.startsWith('/cuisinier');
  const isAuthPage =
    pathname === '/login' || pathname.startsWith('/register');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedUsername = window.localStorage.getItem('username');
    const storedRole = window.localStorage.getItem('role');

    setUsername(storedUsername);
    setRole(storedRole);
    // Si pas connecté → retour à la home (sauf sur login / register)
    if (!storedUsername && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
      router.push('/');
      }
  }, []);

  const handleLogout = () => {
    if (typeof window === 'undefined') return;

    window.localStorage.removeItem('accessToken');
    window.localStorage.removeItem('refreshToken');
    window.localStorage.removeItem('username');
    window.localStorage.removeItem('email');
    window.localStorage.removeItem('role');

    setUsername(null);
    setRole(null);

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

        {/* Liens de navigation :
            - pas sur /client ni /cuisinier
            - pas sur /login ni /register
        */}
        {!isDashboard && !isAuthPage && (
          <nav className="nav-links">
            {/* Lien Plats : pas sur la home */}
            {!isHome && <Link href="/plats">Plats</Link>}

            {/* Pas connecté : n'affiche rien */}
            {!isLoggedIn && null}
            

            {/* Connecté + cuisinier → lien Tableau de bord (pas sur la home) */}
            {isLoggedIn && role === 'CUISINIER' && !isHome && (
              <Link href="/cuisinier">Tableau de bord</Link>
            )}
          </nav>
        )}

        {/* Zone droite (texte "Connecté : ...") :
            - pas sur la home
            - pas sur /client, /cuisinier
            - pas sur /login, /register
        */}
        <div className="nav-right">
          {isLoggedIn && !isHome && !isDashboard && !isAuthPage && (
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
      </div>
    </header>
  );
}
