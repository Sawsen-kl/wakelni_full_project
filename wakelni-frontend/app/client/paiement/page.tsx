// app/client/paiement/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPatch, apiDelete, apiPost } from '../../../lib/api';

// Doit correspondre au JSON de /api/paniers/mon-panier/
type PanierItem = {
  id: string;
  plat: string; // id du plat
  plat_nom: string;
  plat_photo_url?: string | null;
  quantite: number;
  prix_unitaire: number | string;
  sous_total: number | string;
};

type Panier = {
  id: string;
  lignes: PanierItem[];
  total: number | string;
};

function formatPrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '0.00';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toFixed(2);
}

export default function PaiementPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [panier, setPanier] = useState<Panier | null>(null);
  const [loadingPanier, setLoadingPanier] = useState(true);
  const [errorPanier, setErrorPanier] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

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

  // Charger le panier (comme sur /client/panier)
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

  // PATCH quantité
  async function handleChangeQuantity(item: PanierItem, newQty: number) {
    if (newQty <= 0) {
      return handleRemoveItem(item.id);
    }

    try {
      await apiPatch(`/api/paniers/item/${item.id}/`, { quantite: newQty });
      await loadPanier();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erreur lors de la mise à jour de la quantité.');
    }
  }

  // Supprimer une ligne
  async function handleRemoveItem(itemId: string) {
    try {
      await apiDelete(`/api/paniers/item/${itemId}/`);
      await loadPanier();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erreur lors de la suppression du plat.');
    }
  }

  // Lancer Stripe
  async function handlePayer() {
    if (!panier || panier.lignes.length === 0) return;

    try {
      setProcessingPayment(true);

      const data = await apiPost('/api/paiements/create-checkout-session/', {});

      if (data?.url) {
        window.location.href = data.url; // redirection vers Stripe
      } else {
        alert("Impossible de démarrer le paiement Stripe.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erreur lors du paiement.');
    } finally {
      setProcessingPayment(false);
    }
  }

  if (checkingAuth) {
    return <p style={{ padding: 24 }}>Vérification de la connexion...</p>;
  }

  return (
    <div className="client-page">
      {/* ===== HERO PAIEMENT ===== */}
      <section className="client-hero">
        <div className="client-hero-overlay">
          <div className="client-hero-content">
            <p className="client-hero-eyebrow">Espace client</p>
            <h1 className="client-hero-title">
              Paiement Wakelni{' '}
              <span role="img" aria-label="carte">
                💳
              </span>
            </h1>
            <p className="client-hero-subtitle">
              Vérifiez le contenu de votre panier, ajustez les quantités, puis
              payez en toute sécurité avec Stripe (carte de test).
            </p>

            <div className="client-hero-buttons">
              <button
                type="button"
                className="hero-btn-secondary"
                onClick={() => router.push('/client/panier')}
              >
                Voir mon panier
              </button>
              <button
                type="button"
                className="hero-btn-secondary"
                onClick={() => router.push('/client')}
              >
                Continuer mes achats
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

      {/* ===== CONTENU ===== */}
      <div className="client-main-layout">
        <main className="client-main-column">
          <section className="client-cart-section">
            <h2 className="client-section-title">
              Récapitulatif de votre commande
            </h2>
            <p className="client-section-subtitle">
              Ajustez les quantités si nécessaire, puis cliquez sur
              &nbsp;&quot;Payer maintenant&quot; pour être redirigé vers Stripe.
            </p>

            {loadingPanier && <p>Chargement du panier...</p>}
            {errorPanier && <p className="error-text">{errorPanier}</p>}

            {!loadingPanier && (!panier || panier.lignes.length === 0) && (
              <p className="client-cart-empty">
                Votre panier est vide. Retournez voir les plats disponibles 🍽️
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
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() =>
                                  handleChangeQuantity(
                                    item,
                                    item.quantite - 1
                                  )
                                }
                              >
                                −
                              </button>
                              <span>{item.quantite}</span>
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() =>
                                  handleChangeQuantity(
                                    item,
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

                <div className="client-cart-footer">
                  <div className="client-cart-total">
                    Total : <strong>{formatPrice(panier.total)} $</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary client-cart-checkout"
                    onClick={handlePayer}
                    disabled={processingPayment}
                  >
                    {processingPayment ? 'Traitement...' : 'Payer maintenant'}
                  </button>
                </div>
              </>
            )}
          </section>
        </main>

        <aside className="client-sidebar">
          <div className="client-sidebar-card">
            <h3>Mon espace</h3>
            <ul>
              <li>
                <button onClick={() => router.push('/profil/client')}>
                  Profil
                </button>
              </li>
              <li>
                <button onClick={() => router.push('/contact')}>Contact</button>
              </li>
              <li>
                <button onClick={() => router.push('/reclamations')}>
                  Réclamations
                </button>
              </li>
            </ul>
          </div>
          <div className="client-sidebar-card">
            <h3>Astuce Wakelni</h3>
            <p>
              Vérifiez toujours le contenu de votre panier avant de payer :
              quantité, prix et plats choisis.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
