// app/client/panier/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiDelete, apiPatch, apiPost } from '../../../lib/api';

// On aligne les types sur ce que renvoie l'API /api/paniers/mon-panier/
type PanierItem = {
  id: string;
  plat: string;                 // id du plat
  plat_nom: string;             // nom renvoyé par le serializer
  plat_photo_url?: string | null; // URL de la photo renvoyée par le serializer
  quantite: number;
  prix_unitaire: number | string;
  sous_total: number | string;
};

type Panier = {
  id: string;
  lignes: PanierItem[];
  total: number | string;
};

// helper prix
function formatPrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '0.00';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) {
    return String(value);
  }
  return num.toFixed(2);
}

export default function PanierPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [panier, setPanier] = useState<Panier | null>(null);
  const [loadingPanier, setLoadingPanier] = useState(true);
  const [errorPanier, setErrorPanier] = useState<string | null>(null);

  // Vérif auth
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

  const fullName =
    `${firstName || ''} ${lastName || ''}`.trim() || 'Client Wakelni';
  const avatarLetter = (firstName?.[0] || fullName[0] || 'C').toUpperCase();

  function handleLogout() {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      window.location.href = '/login';
    }
  }

  // Charger panier
  async function loadPanier() {
    try {
      setLoadingPanier(true);
      setErrorPanier(null);
      const data = await apiGet('/api/paniers/mon-panier/');
      setPanier(data);
    } catch (err: any) {
      console.error(err);
      setErrorPanier(err.message || 'Impossible de charger le panier.');
    } finally {
      setLoadingPanier(false);
    }
  }

  useEffect(() => {
    if (!checkingAuth) {
      loadPanier();
    }
  }, [checkingAuth]);

  // 🔁 Changer la quantité ( + / - )
  async function handleChangeQuantity(itemId: string, newQty: number) {
    try {
      if (newQty <= 0) {
        // si on descend à 0 ou moins → on supprime la ligne
        await apiDelete(`/api/paniers/item/${itemId}/delete/`);
      } else {
        await apiPatch(`/api/paniers/item/${itemId}/`, { quantite: newQty });
      }
      await loadPanier();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erreur lors de la mise à jour de la quantité.');
    }
  }

  // ❌ Supprimer un item (bouton "Retirer")
  async function handleRemoveItem(itemId: string) {
    try {
      await apiDelete(`/api/paniers/item/${itemId}/delete/`);
      await loadPanier();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erreur lors de la suppression du plat.');
    }
  }

  const [processingCheckout, setProcessingCheckout] = useState(false);
  async function handleCommander() {
    if (!panier || panier.lignes.length === 0) return;

  try {
    setProcessingCheckout(true);

    // On demande au backend de créer une session Stripe
    const data = await apiPost('/api/paiements/create-checkout-session/', {});

    // Le backend doit renvoyer { url: "https://checkout.stripe.com/..." }
    if (data?.url) {
      window.location.href = data.url;  // redirection vers Stripe
    } else {
      alert("Impossible de démarrer le paiement Stripe.");
    }
  } catch (err: any) {
    console.error(err);
    alert(err.message || 'Erreur lors du démarrage du paiement.');
  } finally {
    setProcessingCheckout(false);
  }
}

  if (checkingAuth) {
    return <p style={{ padding: 24 }}>Vérification de la connexion...</p>;
  }


  async function handleViderPanier() {
  if (!confirm("Voulez-vous vraiment vider votre panier ?")) return;

  try {
    await apiDelete('/api/paniers/vider/');
    await loadPanier();
  } catch (err: any) {
    console.error(err);
    alert(err.message || "Erreur lors du vidage du panier.");
  }
}


  return (
    <div className="client-page">
      {/* ===== HERO ===== */}
      <section className="client-hero">
        <div className="client-hero-overlay">
          <div className="client-hero-content">
            <p className="client-hero-eyebrow">Espace client</p>
            <h1 className="client-hero-title">Mon panier Wakelni 🧺</h1>
            <p className="client-hero-subtitle">
              Retrouvez ici tous les plats ajoutés à votre panier. Vérifiez le
              contenu, le total, puis passez à la commande en un clic.
            </p>

            <div className="client-hero-buttons">
              <button
                type="button"
                className="hero-btn-secondary"
                onClick={() => router.push('/client')}
              >
                Continuer mes achats
              </button>
              {/* bouton Mes commandes */}
              <button type="button" className="hero-btn-secondary" onClick={() => router.push("/client/commandes")}>
                Mes commandes
              </button>
            </div>
          </div>

          {/* Carte compte */}
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

      {/* ===== CONTENU ===== */}
      <div className="client-main-layout">
        <main className="client-main-column">
          <section className="client-cart-section">
            <h2 className="client-section-title">Résumé de votre panier</h2>
            <p className="client-section-subtitle">
              Modifiez le contenu si nécessaire, puis cliquez sur &quot;
              Commander&quot; pour passer au paiement.
            </p>

            {loadingPanier && <p>Chargement du panier...</p>}
            {errorPanier && <p className="error-text">{errorPanier}</p>}

            {!loadingPanier && (!panier || panier.lignes.length === 0) && (
              <p className="client-cart-empty">
                Votre panier est vide pour le moment. Retournez voir les plats
                disponibles pour ajouter vos coups de cœur 🍽️
              </p>
            )}

            {panier && panier.lignes.length > 0 && (
              <>
                <div className="client-cart-items">
                  {panier.lignes.map((item) => {
                    const name = item.plat_nom || 'Plat';
                    const photo = item.plat_photo_url || null;

                    return (
                      <div key={item.id} className="client-cart-item">
                        {/* mini image */}
                        <div className="client-cart-thumb">
                          {photo ? (
                            <img
                              src={photo}
                              alt={name}
                              className="thumb-image"
                            />
                          ) : (
                            <div className="thumb-placeholder">
                              {name[0].toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* infos */}
                        <div className="client-cart-info">
                          <div className="client-cart-title-row">
                            <span className="client-cart-plat-name">
                              {name}
                            </span>
                            <span className="client-cart-plat-price">
                              {formatPrice(item.prix_unitaire)} $
                            </span>
                          </div>

                          <div className="client-cart-meta">
                            {/* contrôle quantité */}
                            <div className="client-cart-qty">
                              <button
                                type="button"
                                onClick={() =>
                                  handleChangeQuantity(
                                    item.id,
                                    item.quantite - 1
                                  )
                                }
                              >
                                −
                              </button>
                              <span>{item.quantite}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleChangeQuantity(
                                    item.id,
                                    item.quantite + 1
                                  )
                                }
                              >
                                +
                              </button>
                            </div>

                            <span>
                              Sous-total : {formatPrice(item.sous_total)} $
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="client-cart-remove"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          Retirer
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* total */}
                <div className="client-cart-footer">
                  <div className="client-cart-total">
                    Total : <strong>{formatPrice(panier.total)} $</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary client-cart-checkout"
                    onClick={handleViderPanier}
                  >
                    Vider le panier
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary client-cart-checkout"
                    onClick={handleCommander}
                  >
                    Commander
                  </button>
                </div>
              </>
            )}
          </section>
        </main>

        {/* Sidebar */}
        <aside className="client-sidebar">
          <div className="client-sidebar-card">
            <h3>Astuce Wakelni</h3>
            <p>
              Vérifiez toujours le contenu de votre panier avant de passer
              commande : quantité, prix et plats choisis.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
