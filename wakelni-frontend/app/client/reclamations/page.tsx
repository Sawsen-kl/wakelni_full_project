// app/client/reclamations/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '../../../lib/api';

type Commande = {
  id: string;
  statut: string;
};

type Reclamation = {
  id: string;
  commande_id: string;
  commande_label: string;
  motif: string;
  motif_label: string;
  description: string;
  statut: string;
  statut_label: string;
  date: string;
};

export default function ReclamationsClientPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState('');
  const [motif, setMotif] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 🔐 Auth
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('role');
    const first = localStorage.getItem('first_name');
    const last = localStorage.getItem('last_name');

    if (!token) {
      router.replace('/login');
      return;
    }

    if (role !== 'CLIENT') {
      router.replace('/cuisinier');
      return;
    }

    setFirstName(first);
    setLastName(last);
    setCheckingAuth(false);
  }, [router]);

  //  Charger commandes + réclamations
  useEffect(() => {
    if (checkingAuth) return;

    apiGet('/api/commandes/mes-commandes/').then(setCommandes);
    apiGet('/api/reclamations/mes-reclamations/').then(setReclamations);
  }, [checkingAuth]);

  function handleLogout() {
    localStorage.clear();
    window.location.href = '/login';
  }

  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Client';
  const avatarLetter = fullName[0]?.toUpperCase() || 'C';
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 📨 Envoyer réclamation
  async function handleSubmitReclamation() {
  if (!selectedCommande || !motif) {
    setSubmitError("Veuillez choisir une commande et un motif.");
    return;
  }

  try {
    setSubmitError(null);

    const payload = {
      commande_id: selectedCommande, // ← string id
      motif,                         // ← code du motif (DELAI, AUTRE…)
      description: description.trim(),
    };

    await apiPost("/api/reclamations/creer/", payload);

    // on recharge la liste
    const data = await apiGet("/api/reclamations/mes-reclamations/");
    setReclamations(data);

    // on reset le formulaire
    setShowModal(false);
    setSelectedCommande("");
    setMotif("");
    setDescription("");
  } catch (err: any) {
    console.error("Erreur création réclamation:", err);

    // on essaie d'extraire un message utile de l'API
    const apiData =
      err?.response?.data ||
      err?.data ||
      err?.message ||
      "Erreur inconnue";

    let message = "Erreur lors de l'envoi de la réclamation.";

    if (typeof apiData === "string") {
      message += " " + apiData;
    } else if (apiData.detail) {
      message += " " + apiData.detail;
    } else {
      // on affiche l'objet JSON pour voir quel champ bloque
      message += " " + JSON.stringify(apiData);
    }

    setSubmitError(message);
  }
}

  if (checkingAuth) return <p>Chargement...</p>;

  return (
    <div className="client-page">
      {/* ===== HERO ===== */}
      <section className="client-hero">
        <div className="client-hero-overlay">
          <div className="client-hero-content">
            <p className="client-hero-eyebrow">Espace client</p>
            <h1 className="client-hero-title">Mes Réclamations 📢</h1>
            <p className="client-hero-subtitle">
              Consultez vos réclamations ou envoyez-en une nouvelle.
            </p>

            <div className="client-hero-buttons">
              <button
                className="hero-btn-secondary"
                onClick={() => {
                  setErrorMessage(null);
                  setShowModal(true);
                }}
              >
                + Nouvelle réclamation
              </button>

              <button
                className="hero-btn-secondary"
                onClick={() => router.push('/client')}
              >
                Retour à l’accueil
              </button>
            </div>
          </div>

          <div className="client-hero-account-card">
            <div className="client-hero-avatar">{avatarLetter}</div>
            <div className="client-hero-account-text">
              <span className="client-hero-name">{fullName}</span>
              <span className="client-hero-role">Compte client</span>
            </div>
            <button onClick={handleLogout} className="client-hero-logout">
              Déconnexion
            </button>
          </div>
        </div>
      </section>

      {/* ===== LISTE ===== */}
      <main className="client-main-column" style={{ padding: 40 }}>
        <h2>Mes réclamations</h2>

        {reclamations.length === 0 && (
          <p>Aucune réclamation envoyée pour le moment.</p>
        )}

        <div className="reclamation-list">
          {reclamations.map((r) => (
            <div key={r.id} className="reclamation-card">
              <div className="reclamation-header-row">
                <span className="reclamation-commande">
                  {r.commande_label}
                </span>
                <span className="reclamation-motif">
                  {r.motif_label}
                </span>
              </div>

              {r.description && (
                <p className="reclamation-description">{r.description}</p>
              )}

              <div className="reclamation-footer-row">
                <span className={`reclamation-status reclamation-status-${r.statut}`}>
                  {r.statut_label.toUpperCase()}
                </span>
                <span className="reclamation-date">
                  {new Date(r.date).toLocaleDateString('fr-CA')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>


      {/* ===== MODALE ===== */}
      {showModal && (
        <div className="avis-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="avis-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="avis-modal-close"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>

            <h2 className="avis-modal-title">Nouvelle réclamation</h2>

            {errorMessage && (
              <p className="error-text" style={{ marginBottom: 16 }}>
                {errorMessage}
              </p>
            )}

            <div className="reclamation-form-vertical">
              {/* COMMANDE */}
              <label className="reclamation-label">Commande concernée</label>
              <select
                className="reclamation-select"
                value={selectedCommande}
                onChange={(e) => setSelectedCommande(e.target.value)}
              >
                <option value="">-- Sélectionner une commande --</option>
                {commandes
                  .filter((c) =>
                    ['COMPLETEE', 'PRET', 'EN_PREPARATION'].includes(c.statut)
                  )
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      Commande #{String(c.id).slice(0, 6)} - {c.statut}
                    </option>
                  ))}
              </select>

              {/* MOTIF – ⚠ valeurs = codes backend */}
              <label className="reclamation-label">Motif</label>
              <select
                className="reclamation-select"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
              >
                <option value="">-- Motif --</option>
                <option value="QUALITE_PLAT">Qualité du plat</option>
                <option value="DELAI">Retard de livraison</option>
                <option value="ERREUR_COMMANDE">Erreur dans la commande</option>
                <option value="AUTRE">Autre</option>
              </select>

              {/* DESCRIPTION */}
              <label className="reclamation-label">Description</label>
              <textarea
                className="reclamation-textarea"
                placeholder="Expliquez votre problème..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <button
                onClick={handleSubmitReclamation}
                className="btn btn-primary reclamation-submit-btn"
                disabled={submitting}
              >
                {submitting ? 'Envoi...' : 'Envoyer la réclamation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
