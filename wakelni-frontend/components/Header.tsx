'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header() {
  const [user, setUser] = useState<{
    first_name?: string;
    last_name?: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const first_name = localStorage.getItem('first_name') || '';
      const last_name = localStorage.getItem('last_name') || '';

      setUser({
        first_name,
        last_name,
      });
    }
  }, []);

  function handleLogout() {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      window.location.href = '/login';
    }
  }

  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
  const avatarLetter = user?.first_name?.[0]?.toUpperCase() || 'U';

  return (
    <header className="header">
      <div
            className="header-logo"
            onClick={() => {
                if (typeof window !== 'undefined') {
                localStorage.clear();     // 🔥 Déconnexion automatique
                window.location.href = '/'; // 🔥 Retour à l'accueil
                }
            }}
            style={{ cursor: 'pointer' }}
>
            Wakelni
      </div>

      <nav className="header-nav">
        <Link href="/cuisinier" className="header-btn">Mon compte</Link>
        <Link href="/cuisinier/reclamations" className="header-btn">Réclamations</Link>
        <Link href="/cuisinier/avis" className="header-btn">Avis</Link>
        <Link href="/cuisinier/notifications" className="header-btn">Notifications</Link>
        <Link href="/cuisinier/commandes" className="header-btn">Commandes</Link>

        <Link href="/cuisinier/plat-nouveau" className="header-btn-add">
          + Ajouter un plat
        </Link>
      </nav>

      <div className="header-right">
        <button onClick={handleLogout} className="header-logout">
          Déconnexion
        </button>

        <div className="header-user">
          <div className="header-avatar">{avatarLetter}</div>
          <span className="header-name">{fullName}</span>
        </div>
      </div>
    </header>
  );
}
