'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type UserInfo = {
  first_name: string;
  last_name: string;
};

export default function Header() {
  const [user, setUser] = useState<UserInfo>({
    first_name: '',
    last_name: '',
  });

  // 👇 CACHE le header global client
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const globalHeader = document.querySelector(
      '.wakelni-header'
    ) as HTMLElement | null;

    if (globalHeader) {
      globalHeader.style.display = 'none';
    }

    // quand on quitte la page cuisinier, on le remet
    return () => {
      if (globalHeader) {
        globalHeader.style.display = '';
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const first_name = window.localStorage.getItem('first_name') || '';
    const last_name = window.localStorage.getItem('last_name') || '';

    setUser({ first_name, last_name });
  }, []);

  const fullName = `${user.first_name} ${user.last_name}`.trim();
  const avatarLetter = (user.first_name || 'U')[0]?.toUpperCase() || 'U';

  function handleLogout() {
    if (typeof window === 'undefined') return;

    window.localStorage.clear();
    window.location.href = '/login';
  }

  return (
    <header className="header">
      <div
        className="header-logo"
        onClick={() => {
          if (typeof window === 'undefined') return;
          window.location.href = '/';
        }}
        style={{ cursor: 'pointer' }}
      >
        Wakelni
      </div>

      <nav className="header-nav">
        <Link href="/cuisinier" className="header-btn">
          Mon compte
        </Link>
        <Link href="/cuisinier/reclamations" className="header-btn">
          Réclamations
        </Link>
        <Link href="/cuisinier/avis" className="header-btn">
          Avis
        </Link>
        <Link href="/cuisinier/notifications" className="header-btn">
          Notifications
        </Link>
        <Link href="/cuisinier/commandes" className="header-btn">
          Commandes
        </Link>

        <Link href="/cuisinier/plat-nouveau" className="header-btn-add">
          + Ajouter un plat
        </Link>
      </nav>

      <div className="header-right">
        <div className="client-hero-account-card">
          <div className="client-hero-avatar">{avatarLetter}</div>

          <div className="client-hero-account-text">
            <span className="client-hero-name">
              {fullName || 'Compte cuisinier'}
            </span>
            <span className="client-hero-role">Compte cuisinier</span>
          </div>

          <button onClick={handleLogout} className="client-hero-logout">
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
