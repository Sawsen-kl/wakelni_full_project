// app/cuisinier/avis/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '../../../lib/api';
import Header from '../../../components/Header';

type AvisCuisinier = {
  id: string;
  plat_nom: string;
  note: number;
  commentaire: string;
  date: string;
  client_email: string;
  client_nom: string;
};

export default function CuisinierAvisPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [avis, setAvis] = useState<AvisCuisinier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // vérif auth + rôle cuisinier
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = window.localStorage.getItem('accessToken');
    const role = window.localStorage.getItem('role');

    if (!token) {
      router.replace('/login');
      return;
    }
    if (role !== 'CUISINIER') {
      router.replace('/client');
      return;
    }

    setCheckingAuth(false);
  }, [router]);

  // charger les avis
  useEffect(() => {
    if (checkingAuth) return;

    async function loadAvis() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiGet('/api/avis/avis-cuisinier/');
        setAvis(data as AvisCuisinier[]);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Impossible de charger les avis.');
      } finally {
        setLoading(false);
      }
    }

    loadAvis();
  }, [checkingAuth]);

  if (checkingAuth) {
    return <p style={{ padding: 24 }}>Vérification de la connexion...</p>;
  }

  function formatDate(dateIso: string) {
    const d = new Date(dateIso);
    return d.toLocaleString('fr-CA', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  function renderStars(note: number) {
    return (
      <span>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= note ? 'star-filled' : 'star-empty'}>
            ★
          </span>
        ))}
      </span>
    );
  }

  return (
    <>
      <Header />

      <div className="cuisinier-dashboard">
        {/* Sous-header identique aux autres pages cuisinier */}
        <div className="cuisinier-header">
          <div>
            <h1>Avis de vos clients</h1>
            <p>
              Consulte les notes et commentaires laissés sur tes plats
              pour comprendre ce que tes clients apprécient le plus.
            </p>
          </div>

          <div className="cuisinier-header-actions">
            <button className="btn header-tab" onClick={() => router.push('/cuisinier')}>
              Mon compte
            </button>
            <button className="btn header-tab" onClick={() => router.push('/cuisinier/reclamations')}>
              Réclamations
            </button>
            <button className="btn header-tab header-tab-active">Avis</button>
            <button className="btn header-tab" onClick={() => router.push('/cuisinier/notifications')}>
              Notifications
            </button>
            <button className="btn header-tab" onClick={() => router.push('/cuisinier/commandes')}>
              Commandes
            </button>
            <button
              className="btn btn-primary header-add-plat"
              onClick={() => router.push('/cuisinier/plat-nouveau')}
            >
              + Ajouter un plat
            </button>
          </div>
        </div>

        <section className="cuisinier-section">
          <h2>Derniers avis reçus</h2>

          {loading && <p>Chargement des avis...</p>}
          {error && <p className="error-text">{error}</p>}

          {!loading && !error && avis.length === 0 && (
            <p>
              Aucun avis pour le moment. Encourage tes clients à noter
              et commenter leurs plats préférés 🙂
            </p>
          )}

          <div className="plats-table">
            {avis.map((a) => (
              <div key={a.id} className="plat-row">
                <div className="plat-info" style={{ flex: 1 }}>
                  <h3>{a.plat_nom}</h3>
                  <p className="plat-meta">
                    {renderStars(a.note)} &nbsp;
                    <span style={{ fontSize: '0.9rem', color: '#777' }}>
                      {a.note}/5 • {formatDate(a.date)}
                    </span>
                  </p>
                  {a.commentaire && (
                    <p style={{ marginTop: 8 }}>{a.commentaire}</p>
                  )}
                </div>

                <div className="plat-actions" style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.9rem', marginBottom: 4 }}>
                    Client :
                  </p>
                  <p style={{ fontWeight: 600 }}>{a.client_nom || a.client_email}</p>
                  {a.client_nom && (
                    <p style={{ fontSize: '0.85rem', color: '#777' }}>
                      {a.client_email}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
