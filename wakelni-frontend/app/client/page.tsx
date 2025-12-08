// app/client/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '../../lib/api';

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

export default function ClientPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [plats, setPlats] = useState<Plat[]>([]);
  const [loadingPlats, setLoadingPlats] = useState(true);
  const [errorPlats, setErrorPlats] = useState<string | null>(null);

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});

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

  function handleRatingChange(platId: string, value: number) {
    setRatings((prev) => ({ ...prev, [platId]: value }));
  }

  function handleCommentChange(platId: string, value: string) {
    setComments((prev) => ({ ...prev, [platId]: value }));
  }

  // 🧺 VRAI ajout au panier + redirection
  async function handleAddToCart(plat: Plat) {
    try {
      await apiPost('/api/paniers/ajouter/', {
        plat_id: plat.id,
        quantite: 1,
      });
      // option : petit message
      // alert(`"${plat.nom}" a été ajouté à votre panier.`);
      router.push('/client/panier');
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Erreur lors de l'ajout au panier.");
    }
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
              <button type="button" className="hero-btn-secondary" onClick={() => router.push("/client/commandes")}>
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
              Cliquez sur un plat pour voir les détails, ajoutez-le à votre
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
                const rating = ratings[plat.id] || 0;
                const comment = comments[plat.id] || '';
                const chefInitial =
                  plat.cuisinier?.[0]?.toUpperCase?.() || 'C';

                return (
                  <article key={plat.id} className="plat-card-client">
                    <div className="plat-client-image-wrapper">
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
                    </div>

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

                      <div className="plat-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={
                              star <= rating ? 'star-btn filled' : 'star-btn'
                            }
                            onClick={() =>
                              handleRatingChange(plat.id, star)
                            }
                          >
                            ★
                          </button>
                        ))}
                        <span className="rating-text">
                          {rating > 0 ? `${rating}/5` : 'Notez ce plat'}
                        </span>
                      </div>

                      <textarea
                        className="plat-comment-input"
                        placeholder="Laissez un commentaire sur ce plat..."
                        value={comment}
                        onChange={(e) =>
                          handleCommentChange(plat.id, e.target.value)
                        }
                      />

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
    </div>
  );
}
