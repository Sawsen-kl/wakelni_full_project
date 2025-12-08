// app/client/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '../../lib/api';
import AvisForm from '../../components/AvisForm';

type Plat = {
  id: string;
  nom: string;
  description: string;
  ingredients: string;
  prix: number | string;
  stock: number;
  ville: string;
  adresse: string;
  est_actif: boolean;
  photo_url?: string | null;
  cuisinier: string; // username du cuisinier
};

type AvisItem = {
  id: string;
  note: number;
  commentaire: string;
  date: string;
  client_name: string;
};

export default function ClientPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [plats, setPlats] = useState<Plat[]>([]);
  const [loadingPlats, setLoadingPlats] = useState(true);
  const [errorPlats, setErrorPlats] = useState<string | null>(null);

  // 🔎 État pour la modale d’avis
  const [showAvisModal, setShowAvisModal] = useState(false);
  const [selectedPlat, setSelectedPlat] = useState<Plat | null>(null);
  const [avis, setAvis] = useState<AvisItem[]>([]);
  const [loadingAvis, setLoadingAvis] = useState(false);
  const [errorAvis, setErrorAvis] = useState<string | null>(null);

  // 🔐 Vérification auth
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = window.localStorage.getItem('accessToken');
    const storedRole = window.localStorage.getItem('role');
    const storedFirst = window.localStorage.getItem('first_name');
    const storedLast = window.localStorage.getItem('last_name');

    if (!token) {
      router.replace('/login');
      return;
    }

    if (storedRole === 'CUISINIER') {
      router.replace('/cuisinier');
      return;
    }

    setFirstName(storedFirst);
    setLastName(storedLast);
    setRole(storedRole);
    setCheckingAuth(false);
  }, [router]);

  //  Charger les plats (actifs)
  useEffect(() => {
    if (checkingAuth) return;

    async function loadPlats() {
      try {
        setLoadingPlats(true);
        setErrorPlats(null);
        const data = await apiGet('/api/plats/'); // PlatListCreateView renvoie seulement est_actif=True
        setPlats(data);
      } catch (err: any) {
        console.error(err);
        setErrorPlats(err?.message || 'Impossible de charger les plats.');
      } finally {
        setLoadingPlats(false);
      }
    }

    loadPlats();
  }, [checkingAuth]);

  function handleLogout() {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      window.location.href = '/login';
    }
  }

  const fullName =
    `${firstName || ''} ${lastName || ''}`.trim() || 'Client Wakelni';
  const avatarLetter = (firstName?.[0] || fullName[0] || 'C').toUpperCase();

  // 🧺 VRAI ajout au panier + redirection
  async function handleAddToCart(plat: Plat) {
    try {
      await apiPost('/api/paniers/ajouter/', {
        plat_id: plat.id,
        quantite: 1,
      });
      router.push('/client/panier');
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Erreur lors de l'ajout au panier.");
    }
  }

  // 🔎 Charger les avis pour un plat
async function fetchAvisForPlat(platId: string) {
  try {
    setLoadingAvis(true);
    setErrorAvis(null);

    //  URL CORRECTE : /api/avis/avis-par-plat/?plat_id=...
    const data = await apiGet(`/api/avis/avis-par-plat/?plat_id=${platId}`);

    // on adapte le JSON renvoyé par AvisCuisinierSerializer
    const mapped = (data as any[]).map((a) => ({
      id: a.id,
      note: a.note,
      commentaire: a.commentaire,
      date: a.date,
      client_name: a.client_nom || a.client_email, // fallback
    }));

    setAvis(mapped);
  } catch (err: any) {
    console.error(err);
    setErrorAvis(
      err?.message || 'Impossible de charger les avis pour ce plat.'
    );
  } finally {
    setLoadingAvis(false);
  }
}

  // 📌 Ouvrir la modale d'avis
  async function handleOpenAvisModal(plat: Plat) {
    setSelectedPlat(plat);
    setShowAvisModal(true);
    await fetchAvisForPlat(plat.id);
  }

  // 🔒 Fermer la modale
  function handleCloseAvisModal() {
    setShowAvisModal(false);
    setSelectedPlat(null);
    setAvis([]);
    setErrorAvis(null);
  }

  if (checkingAuth) {
    return <p style={{ padding: 24 }}>Vérification de la connexion...</p>;
  }

  return (
    <div className="client-page">
      {/* ===== HERO CLIENT ===== */}
      <section className="client-hero">
        <div className="client-hero-overlay">
          <div className="client-hero-content">
            <p className="client-hero-eyebrow">Espace client</p>
            <h1 className="client-hero-title">
              Bonsoir, {fullName} 👋
            </h1>
            <p className="client-hero-subtitle">
              Découvrez les plats faits maison près de chez vous, ajoutez-les
              au panier et laissez un avis pour soutenir vos cuisiniers
              préférés.
            </p>

            <div className="client-hero-buttons">
              <button
                type="button"
                className="hero-btn-secondary"
                onClick={() => {
                  const platsSection = document.getElementById('plats-client');
                  platsSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Voir les plats disponibles
              </button>

              <button
                type="button"
                className="hero-btn-secondary"
                onClick={() => router.push('/client/panier')}
              >
                Mon panier
              </button>

              {/* bouton Mes commandes */}
              <button
                type="button"
                className="hero-btn-secondary"
                onClick={() => router.push('/client/commandes')}
              >
                Mes commandes
              </button>
            </div>
          </div>

          {/* Carte compte en haut à droite */}
          <div className="client-hero-account-card">
            <div className="client-hero-avatar">{avatarLetter}</div>
            <div className="client-hero-account-text">
              <span className="client-hero-name">{fullName}</span>
              <span className="client-hero-role">
                {role === 'CLIENT' ? 'Compte client' : 'Utilisateur'}
              </span>
            </div>
            <button
              type="button"
              className="client-hero-logout"
              onClick={handleLogout}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </section>

      {/* ===== CONTENU PRINCIPAL ===== */}
      <div className="client-main-layout">
        {/* Colonne principale */}
        <main className="client-main-column">
          <section id="plats-client">
            <h2 className="client-section-title">
              Plats disponibles près de chez vous
            </h2>
            <p className="client-section-subtitle">
              Cliquez sur un plat pour donner ton avis, ajoutez-le à votre
              panier et laissez une note pour aider les autres gourmands.
            </p>

            {loadingPlats && <p>Chargement des plats...</p>}
            {errorPlats && <p className="error-text">{errorPlats}</p>}

            {!loadingPlats && plats.length === 0 && (
              <p>
                Aucun plat n&apos;est disponible pour le moment. Revenez plus
                tard 😋
              </p>
            )}

            <div className="plat-grid-client">
              {plats.map((plat) => {
                const chefInitial =
                  plat.cuisinier?.[0]?.toUpperCase?.() || 'C';

                return (
                  <article key={plat.id} className="plat-card-client">
                    {/* IMAGE CLIQUABLE => ouvre la modale d'avis */}
                    <button
                      type="button"
                      className="plat-client-image-wrapper"
                      onClick={() => handleOpenAvisModal(plat)}
                    >
                      {plat.photo_url ? (
                        <img
                          src={plat.photo_url}
                          alt={plat.nom}
                          className="plat-client-image"
                        />
                      ) : (
                        <div className="plat-client-image placeholder">
                          Photo à venir
                        </div>
                      )}
                    </button>

                    <div className="plat-client-body">
                      <div className="plat-client-chef">
                        <div className="chef-avatar">{chefInitial}</div>
                        <div>
                          <div className="chef-name">{plat.cuisinier}</div>
                          <div className="chef-location">
                            {plat.ville || 'Ville inconnue'}
                          </div>
                        </div>
                      </div>

                      <h3 className="plat-client-title">{plat.nom}</h3>
                      <p className="plat-client-description">
                        {plat.description || 'Plat maison délicieux.'}
                      </p>

                      <p className="plat-client-meta">
                        <span className="plat-price">
                          {typeof plat.prix === 'number'
                            ? plat.prix.toFixed(2)
                            : plat.prix}{' '}
                          $
                        </span>
                        <span className="plat-stock">
                          {plat.stock > 0
                            ? `${plat.stock} portion(s) disponible(s)`
                            : 'Rupture de stock'}
                        </span>
                      </p>

                      <button
                        className="btn btn-primary client-add-cart-btn"
                        onClick={() => handleAddToCart(plat)}
                        disabled={plat.stock === 0}
                      >
                        {plat.stock === 0
                          ? 'Indisponible'
                          : 'Ajouter au panier'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </main>

        {/* Sidebar droite */}
        <aside className="client-sidebar">
          <div className="client-sidebar-card">
            <h3>Mon espace</h3>
            <ul>
              <li>
                <button
                  type="button"
                  onClick={() => router.push('/client/profile')}
                >
                  Profil
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => router.push('/client/contact')}
                >
                  Contact
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => router.push('/reclamations')}
                >
                  Réclamations
                </button>
              </li>
            </ul>
          </div>

          <div className="client-sidebar-card">
            <h3>Astuce Wakelni</h3>
            <p>
              Ajoutez vos plats préférés au panier, puis laissez une note
              et un commentaire pour aider les autres clients à choisir.
            </p>
          </div>
        </aside>
      </div>

      {/* ===== MODALE AVIS ===== */}
      {showAvisModal && selectedPlat && (
        <div className="avis-modal-overlay" onClick={handleCloseAvisModal}>
          <div
            className="avis-modal"
            onClick={(e) => e.stopPropagation()} // pour ne pas fermer en cliquant dans la modale
          >
            <button
              type="button"
              className="avis-modal-close"
              onClick={handleCloseAvisModal}
            >
              ✕
            </button>

            <h2 className="avis-modal-title">
              Avis sur {selectedPlat.nom}
            </h2>

            <div className="avis-modal-content">
              {/* Colonne gauche : formulaire d'avis */}
              <div className="avis-modal-left">
                <AvisForm
                  platId={selectedPlat.id}
                  platNom={selectedPlat.nom}
                  onSubmitted={async () => {
                    // après envoi, on recharge la liste d'avis
                    await fetchAvisForPlat(selectedPlat.id);
                  }}
                />
              </div>

              {/* Colonne droite : liste des avis existants */}
              <div className="avis-modal-right">
                <h3 className="avis-list-title">Avis des autres clients</h3>

                {loadingAvis && <p>Chargement des avis…</p>}
                {errorAvis && <p className="error-text">{errorAvis}</p>}

                {!loadingAvis && !errorAvis && avis.length === 0 && (
                  <p>Aucun avis pour l’instant. Soyez le premier à commenter !</p>
                )}

                <ul className="avis-list">
                  {avis.map((a) => (
                    <li key={a.id} className="avis-item">
                      <div className="avis-item-header">
                        <strong>{a.client_name}</strong>
                        <span className="avis-item-stars">
                          {'★'.repeat(a.note).padEnd(5, '☆')}
                        </span>
                      </div>
                      {a.commentaire && (
                        <p className="avis-item-comment">
                          {a.commentaire}
                        </p>
                      )}
                      <small className="avis-item-date">
                        {new Date(a.date).toLocaleString('fr-CA', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
