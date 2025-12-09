'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '../../../lib/api';

type StatutReclamation = 'OUVERT' | 'LU' | 'EN_COURS' | 'TRAITEE' | 'REJETEE';

type Reclamation = {
  id: string;
  client_email: string;
  client_name: string;
  commande_label: string;
  plat_nom: string | null;
  motif: string;
  motif_label: string;
  description: string;
  statut: StatutReclamation;
  statut_label: string;
  date: string;
};

const STATUT_LABELS: Record<StatutReclamation, string> = {
  OUVERT: 'Ouvert',
  LU: 'Lue par le cuisinier',
  EN_COURS: 'En cours de traitement',
  TRAITEE: 'Traitée',
  REJETEE: 'Rejetée',
};

const STATUTS_OPTIONS: { value: StatutReclamation; label: string }[] = [
  { value: 'OUVERT', label: STATUT_LABELS.OUVERT },
  { value: 'LU', label: STATUT_LABELS.LU },
  { value: 'EN_COURS', label: STATUT_LABELS.EN_COURS },
  { value: 'TRAITEE', label: STATUT_LABELS.TRAITEE },
  { value: 'REJETEE', label: STATUT_LABELS.REJETEE },
];

function classStatut(statut: StatutReclamation) {
  switch (statut) {
    case 'OUVERT':
      return 'badge-inactive';
    case 'LU':
    case 'EN_COURS':
      return 'badge-active';
    case 'TRAITEE':
      return 'badge-active';
    case 'REJETEE':
      return 'badge-inactive';
    default:
      return '';
  }
}

export default function CuisinierReclamationsPage() {
  const router = useRouter();

  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);

  // Récup du nom cuisinier pour le header
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setFirstName(window.localStorage.getItem('first_name'));
    setLastName(window.localStorage.getItem('last_name'));
  }, []);

  const greetingName =
    (firstName || '') + (lastName ? ` ${lastName}` : '') || 'Compte cuisinier';

  async function loadReclamations() {
    try {
      setLoading(true);
      setError(null);
      // ⚠️ IMPORTANT : slash final !
      const data = await apiGet('/api/reclamations/cuisinier/');
      setReclamations(data as Reclamation[]);
    } catch (err: any) {
      console.error('Erreur chargement réclamations:', err);
      setError(err.message || 'API error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReclamations();
  }, []);

  async function handleChangeStatut(id: string, nouveau: StatutReclamation) {
    const backup = [...reclamations];
    // Optimistic UI
    setReclamations((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, statut: nouveau, statut_label: STATUT_LABELS[nouveau] }
          : r
      )
    );

    try {
      const updated = await apiPost(
        `/api/reclamations/${id}/changer-statut/`,
        { statut: nouveau }
      );
      setReclamations((prev) =>
        prev.map((r) => (r.id === id ? (updated as Reclamation) : r))
      );
    } catch (err: any) {
      console.error('Erreur changement statut réclamation:', err);
      alert(err.message || 'Impossible de changer le statut.');
      setReclamations(backup); // rollback
    }
  }

  function handleLogout() {
    if (typeof window === 'undefined') return;
    window.localStorage.clear();
    router.push('/login');
  }

  return (
    <div className="cuisinier-dashboard">
      {/* ===== HEADER CUISINIER (comme Commandes) ===== */}
      <div className="cuisinier-header">
        <div>
          <h1>Réclamations reçues</h1>
          <p>
            Consulte les réclamations des clients sur tes plats et mets à jour
            leur statut (ouvert, en cours, traité…).
          </p>
        </div>

        <div className="cuisinier-header-actions">
          <button
            className="btn header-tab"
            onClick={() => router.push('/cuisinier')}
          >
            Mon compte
          </button>
          <button
            className="btn header-tab header-tab-active"
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

          <div className="client-hero-account-card">
            <div className="client-hero-avatar">
              {(firstName || 'U')[0]?.toUpperCase()}
            </div>
            <div className="client-hero-account-text">
              <span className="client-hero-name">{greetingName}</span>
              <span className="client-hero-role">Compte cuisinier</span>
            </div>
            <button onClick={handleLogout} className="client-hero-logout">
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* ===== LISTE DES RÉCLAMATIONS ===== */}
      <section className="cuisinier-section">
        <h2>Liste des réclamations</h2>

        {loading && <p>Chargement…</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && reclamations.length === 0 && (
          <p>Aucune réclamation pour le moment.</p>
        )}

        <div className="plats-table">
          {reclamations.map((r) => {
            const isLocked =
              r.statut === 'TRAITEE' || r.statut === 'REJETEE';

            return (
              <div key={r.id} className="plat-row">
                <div className="plat-info" style={{ flex: 1 }}>
                  <h3>{r.commande_label}</h3>
                  <p className="plat-meta">
                    Client : <strong>{r.client_name}</strong> (
                    {r.client_email})<br />
                    Plat : <strong>{r.plat_nom || '—'}</strong>
                    <br />
                    Motif : <strong>{r.motif_label}</strong>
                    <br />
                    Reçue le{' '}
                    {new Date(r.date).toLocaleString('fr-CA', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                  {r.description && (
                    <p style={{ marginTop: 8 }}>{r.description}</p>
                  )}
                </div>

                <div className="plat-actions">
                  <label
                    style={{ fontSize: '0.8rem', marginBottom: 4 }}
                    htmlFor={`statut-${r.id}`}
                  >
                    Statut
                  </label>

                  {isLocked ? (
                    <span className={classStatut(r.statut)}>
                      {r.statut_label}
                    </span>
                  ) : (
                    <select
                      id={`statut-${r.id}`}
                      value={r.statut}
                      onChange={(e) =>
                        handleChangeStatut(
                          r.id,
                          e.target.value as StatutReclamation
                        )
                      }
                      style={{
                        padding: '6px 10px',
                        borderRadius: 999,
                        border: '1px solid #ddd',
                      }}
                    >
                      {STATUTS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
