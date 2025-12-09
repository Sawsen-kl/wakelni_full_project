// app/cuisinier/commandes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPatch } from '../../../lib/api';

type LigneCommande = {
  id: number;
  plat_nom: string;
  quantite: number;
  sous_total: string;
};

type StatutCommande =
  | 'EN_ATTENTE'
  | 'EN_PREPARATION'
  | 'PRET'
  | 'REMIS'
  | 'COMPLETEE'
  | 'ANNULEE';

type Commande = {
  id: number;
  created_at: string;
  statut: StatutCommande;
  total: string;
  lignes: LigneCommande[];
};

const STATUT_LABELS: Record<StatutCommande, string> = {
  EN_ATTENTE: 'En attente',
  EN_PREPARATION: 'En préparation',
  PRET: 'Prêt',
  REMIS: 'Remis',
  COMPLETEE: 'Complétée',
  ANNULEE: 'Annulée',
};

const STATUT_OPTIONS: { value: StatutCommande; label: string }[] =
  Object.entries(STATUT_LABELS).map(([value, label]) => ({
    value: value as StatutCommande,
    label,
  }));

function classStatut(statut: StatutCommande) {
  switch (statut) {
    case 'COMPLETEE':
    case 'REMIS':
    case 'PRET':
    case 'EN_PREPARATION':
      return 'badge-active';
    case 'EN_ATTENTE':
    case 'ANNULEE':
    default:
      return 'badge-inactive';
  }
}

export default function CuisinierCommandesPage() {
  const router = useRouter();

  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setFirstName(window.localStorage.getItem('first_name'));
    setLastName(window.localStorage.getItem('last_name'));
  }, []);

  const greetingName =
    (firstName || '') + (lastName ? ` ${lastName}` : '') || '';

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet('/api/commandes/mes-commandes/');
      setCommandes(data as Commande[]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Impossible de charger les commandes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleChangeStatut(id: number, nouveau: StatutCommande) {
    const sauvegarde = [...commandes];

    setCommandes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, statut: nouveau } : c))
    );

    try {
      await apiPatch(`/api/commandes/${id}/changer-statut/`, {
        statut: nouveau,
      });
    } catch (err: any) {
      console.error(err);
      alert(
        err.message || 'Impossible de mettre à jour le statut, réessaye.'
      );
      setCommandes(sauvegarde);
    }
  }

  return (
    <div className="cuisinier-dashboard">
      {/* ===== HEADER CUISINIER (même style que le dashboard) ===== */}
      <div className="cuisinier-header">
        <div>
          <h1>Commandes à préparer</h1>
          <p>
            Consulte et mets à jour le statut des commandes payées par les
            clients.
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
              <span className="client-hero-name">
                {greetingName || 'Compte cuisinier'}
              </span>
              <span className="client-hero-role">Compte cuisinier</span>
            </div>
            <button
              onClick={() => {
                if (typeof window === 'undefined') return;
                window.localStorage.clear();
                router.push('/login');
              }}
              className="client-hero-logout"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* ===== LISTE DES COMMANDES ===== */}
      <section className="cuisinier-section">
        <h2>Liste des commandes</h2>

        {loading && <p>Chargement...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && commandes.length === 0 && (
          <p>Aucune commande pour le moment.</p>
        )}

        <div className="plats-table">
          {commandes.map((commande) => {
            const isLocked =
              commande.statut === 'ANNULEE' ||
              commande.statut === 'COMPLETEE';

            return (
              <div key={commande.id} className="plat-row">
                <div className="plat-info" style={{ flex: 1 }}>
                  <h3>Commande #{commande.id}</h3>
                  <p className="plat-meta">
                    Passée le{' '}
                    {new Date(commande.created_at).toLocaleString('fr-CA', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}{' '}
                    • Total : <strong>{commande.total} $</strong>
                  </p>
                  <ul
                    style={{
                      marginTop: 8,
                      paddingLeft: 18,
                      fontSize: '0.9rem',
                    }}
                  >
                    {commande.lignes.map((ligne) => (
                      <li key={ligne.id}>
                        {ligne.quantite} × {ligne.plat_nom} —{' '}
                        {ligne.sous_total} $
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="plat-actions">
                  <label
                    style={{ fontSize: '0.8rem', marginBottom: 4 }}
                    htmlFor={`statut-${commande.id}`}
                  >
                    Statut
                  </label>

                  {isLocked ? (
                    //  Statut gelé : plus de liste déroulante
                    <span className={classStatut(commande.statut)}>
                      {STATUT_LABELS[commande.statut]}
                    </span>
                  ) : (
                    //  Statuts modifiables
                    <select
                      id={`statut-${commande.id}`}
                      value={commande.statut}
                      onChange={(e) =>
                        handleChangeStatut(
                          commande.id,
                          e.target.value as StatutCommande
                        )
                      }
                      style={{
                        padding: '6px 10px',
                        borderRadius: 999,
                        border: '1px solid #ddd',
                      }}
                    >
                      {STATUT_OPTIONS.map((opt) => (
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
