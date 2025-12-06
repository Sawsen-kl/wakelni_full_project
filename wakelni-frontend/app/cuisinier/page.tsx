// app/cuisinier/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiDelete, apiPost } from '../../lib/api';

type Plat = {
  id: string;
  nom: string;
  description: string;
  prix: string | number;
  stock: number;
  est_actif: boolean;
  photo_url?: string | null;
};

export default function CuisinierDashboardPage() {
  const router = useRouter();

  const [plats, setPlats] = useState<Plat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);

  const [checkingAuth, setCheckingAuth] = useState(true);

  // Vérification auth + infos user
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const accessToken = window.localStorage.getItem('accessToken');
    const storedUsername = window.localStorage.getItem('username');
    const storedRole = window.localStorage.getItem('role');
    const storedFirstName = window.localStorage.getItem('first_name');
    const storedLastName = window.localStorage.getItem('last_name');

    if (!accessToken) {
      router.push('/login');
      return;
    }

    if (storedRole !== 'CUISINIER') {
      router.push('/client');
      return;
    }

    setUsername(storedUsername);
    setFirstName(storedFirstName);
    setLastName(storedLastName);
    setCheckingAuth(false);
  }, [router]);

  // Charger les plats
  useEffect(() => {
    if (checkingAuth) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiGet('/api/plats/mes-plats/');
        setPlats(data);
      } catch (err: any) {
        console.error(err);
        setError('Impossible de charger vos plats.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [checkingAuth]);

  async function handleDeletePlat(id: string) {
    if (!confirm('Supprimer ce plat ?')) return;
    try {
      await apiDelete(`/api/plats/${id}/`);
      setPlats((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression du plat.');
    }
  }

  function handleEditPlat(id: string) {
    router.push(`/cuisinier/plat/${id}/edit`);
  }

  async function handleDeactivateAccount() {
    if (!confirm('Voulez-vous vraiment désactiver votre compte ?')) return;
    try {
      await apiPost('/api/users/deactivate/', {});
      alert('Compte désactivé.');
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la désactivation du compte.');
    }
  }

  const filteredPlats = plats.filter((plat) => {
    let ok = true;
    if (search.trim()) {
      const q = search.toLowerCase();
      ok =
        plat.nom.toLowerCase().includes(q) ||
        plat.description.toLowerCase().includes(q);
    }
    if (showActiveOnly) ok = ok && plat.est_actif;
    if (showLowStock) ok = ok && plat.stock < 5;
    return ok;
  });

  if (checkingAuth) {
    return <p style={{ padding: 24 }}>Vérification de la connexion...</p>;
  }

  const greetingName =
    (firstName || '') + (lastName ? ` ${lastName}` : '') || username || '';

  return (
    <div className="cuisinier-dashboard">
      {/* HEADER */}
      <div className="cuisinier-header">
        <div>
          <h1>Tableau de bord cuisinier</h1>
          <p>
            Bonjour <strong>{greetingName}</strong>
          </p>
        </div>

        <div className="cuisinier-header-actions">
          <button
            className="btn header-tab"
            onClick={() => document.getElementById('section-compte')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Mon compte
          </button>
          <button
            className="btn header-tab"
            onClick={() => router.push('/cuisinier/reclamations')}
          >
            Réclamations
          </button>
          <button
            className="btn header-tab"
            onClick={() => router.push('/cuisinier/avis')}
          >
            Avis
          </button>
          <button
            className="btn header-tab"
            onClick={() => router.push('/cuisinier/notifications')}
          >
            Notifications
          </button>
          <button
            className="btn header-tab"
            onClick={() => router.push('/cuisinier/commandes')}
          >
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

      <div className="cuisinier-content">
        {/* SECTION PLATS */}
        <section className="cuisinier-section">
          <div className="cuisinier-section-header">
            <h2>Mes plats</h2>

            <div className="cuisinier-filters">
              <input
                type="text"
                placeholder="Rechercher un plat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="filter-input"
              />

              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                />
                Plats actifs uniquement
              </label>

              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={showLowStock}
                  onChange={(e) => setShowLowStock(e.target.checked)}
                />
                Stock &lt; 5
              </label>
            </div>
          </div>

          {loading && <p>Chargement...</p>}
          {error && <p className="error-text">{error}</p>}
          {!loading && filteredPlats.length === 0 && (
            <p>
              Aucun plat ne correspond à vos critères. Essayez de modifier la
              recherche ou les filtres.
            </p>
          )}

          <div className="plats-table">
            {filteredPlats.map((plat) => (
              <div key={plat.id} className="plat-row">
                {plat.photo_url && (
                  <div className="plat-thumb">
                    <img src={plat.photo_url} alt={plat.nom} />
                  </div>
                )}
                <div className="plat-info">
                  <h3>{plat.nom}</h3>
                  <p>{plat.description}</p>
                  <p className="plat-meta">
                    Prix :{' '}
                    <strong>
                      {typeof plat.prix === 'number'
                        ? plat.prix.toFixed(2)
                        : plat.prix}{' '}
                      $
                    </strong>{' '}
                    • Stock : <strong>{plat.stock}</strong> • Statut :{' '}
                    <span
                      className={plat.est_actif ? 'badge-active' : 'badge-inactive'}
                    >
                      {plat.est_actif ? 'Actif' : 'Inactif'}
                    </span>
                  </p>
                </div>
                <div className="plat-actions">
                  <button
                    className="btn btn-secondary-light"
                    onClick={() => handleEditPlat(plat.id)}
                  >
                    Modifier
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeletePlat(plat.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION COMPTE */}
        <section id="section-compte" className="cuisinier-section">
          <h2>Mon compte</h2>
          <p>
            Ici tu pourras gérer les informations de ton profil cuisinier
            (bio, adresse, avatar, etc.).
          </p>
          <div className="account-actions">
            <button
              className="btn btn-secondary-light"
              onClick={() => router.push('/profil/cuisinier')}
            >
              Modifier mon profil
            </button>
            <button
              className="btn btn-danger-outline"
              onClick={handleDeactivateAccount}
            >
              Désactiver mon compte
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
