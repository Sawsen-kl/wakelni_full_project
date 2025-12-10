"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "../../../lib/api";

type LigneCommande = {
  id: number;
  plat_nom: string;
  quantite: number;
  sous_total: string;
};

type StatutCommande =
  | "EN_ATTENTE"
  | "EN_PREPARATION"
  | "PRET"
  | "REMIS"
  | "COMPLETEE"
  | "ANNULEE";

type Commande = {
  id: number;
  created_at: string;
  statut: StatutCommande;
  total: string;
  lignes: LigneCommande[];
};

export default function MesCommandesPage() {
  const router = useRouter();

  // 🧑‍💻 Infos user / auth (comme sur paiement)
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔐 Vérification auth + rôle client
  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem("accessToken");
    const storedRole = window.localStorage.getItem("role");
    const storedFirst = window.localStorage.getItem("first_name");
    const storedLast = window.localStorage.getItem("last_name");

    if (!token) {
      router.replace("/login");
      return;
    }

    // si jamais un cuisinier tombe là, on le renvoie chez lui
    if (storedRole === "CUISINIER") {
      router.replace("/cuisinier");
      return;
    }

    setFirstName(storedFirst);
    setLastName(storedLast);
    setRole(storedRole);
    setCheckingAuth(false);
  }, [router]);

  const fullName =
    `${firstName || ""} ${lastName || ""}`.trim() || "Client Wakelni";
  const avatarLetter = (firstName?.[0] || fullName[0] || "C").toUpperCase();

  function handleLogout() {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
      window.location.href = "/login";
    }
  }

  async function loadCommandes() {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet("/api/commandes/mes-commandes/");
      setCommandes(data as Commande[]);
    } catch (err: any) {
      console.error(err);
      setError("Impossible de charger vos commandes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!checkingAuth) {
      loadCommandes();
    }
  }, [checkingAuth]);

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString("fr-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function labelStatut(statut: StatutCommande) {
    switch (statut) {
      case "EN_ATTENTE":
        return "En attente";
      case "EN_PREPARATION":
        return "En préparation";
      case "PRET":
        return "Prête";
      case "REMIS":
        return "Remis au client";
      case "COMPLETEE":
        return "Complétée";
      case "ANNULEE":
        return "Annulée";
      default:
        return statut;
    }
  }

  function classStatut(statut: StatutCommande) {
    switch (statut) {
      case "EN_ATTENTE":
      case "ANNULEE":
        return "badge-inactive"; // rouge
      case "EN_PREPARATION":
      case "PRET":
      case "REMIS":
      case "COMPLETEE":
        return "badge-active"; // vert
      default:
        return "";
    }
  }

  // ✅ bouton "Confirmer la réception" (statut REMIS → COMPLETEE)
  async function handleConfirmerReception(id: number) {
    try {
      await apiPost(`/api/commandes/${id}/confirmer-reception/`, {});
      await loadCommandes();
    } catch (err: any) {
      console.error(err);
      alert(
        err.message ||
          "Impossible de confirmer la réception de la commande pour le moment."
      );
    }
  }

  // ✅ bouton "Annuler la commande" (seulement EN_ATTENTE)
  async function handleAnnulerCommande(id: number, statut: StatutCommande) {
    if (statut !== "EN_ATTENTE") {
      alert("Seules les commandes en attente peuvent être annulées.");
      return;
    }

    if (
      !window.confirm(
        "Voulez-vous vraiment annuler cette commande ? Cette action est définitive."
      )
    ) {
      return;
    }

    try {
      await apiPost(`/api/commandes/${id}/annuler/`, {});
      await loadCommandes();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "API error");
    }
  }

  if (checkingAuth) {
    return <p style={{ padding: 24 }}>Vérification de la connexion...</p>;
  }

  return (
    <div className="client-page">
      {/* HERO */}
      <section className="client-hero">
        <div className="client-hero-overlay">
          <div className="client-hero-content">
            <p className="client-hero-eyebrow">ESPACE CLIENT</p>
            <h1 className="client-hero-title">Mes commandes</h1>
            <p className="client-hero-subtitle">
              Suivez l&apos;état de vos commandes : en préparation, prêtes,
              remises ou complétées.
            </p>
            <div className="client-hero-buttons">
              <button
                type="button"
                className="hero-btn-secondary"
                onClick={() => router.push("/client")}
              >
                Retour à l&apos;accueil 
              </button>
              <button
                type="button"
                className="hero-btn-secondary"
                onClick={() => router.push("/client/panier")}
              >
                Voir mon panier
              </button>
            </div>
          </div>

          {/* 🔸 Carte compte + Déconnexion (comme sur paiement) */}
          <div className="client-hero-account-card">
            <div className="client-hero-avatar">{avatarLetter}</div>
            <div className="client-hero-account-text">
              <span className="client-hero-name">{fullName}</span>
              <span className="client-hero-role">
                {role === "CLIENT" ? "Compte client" : "Utilisateur"}
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

      {/* CONTENU */}
      <main className="client-main-layout">
        <div className="client-main-column">
          <h2 className="client-section-title">Historique de vos commandes</h2>

          {loading && <p>Chargement de vos commandes...</p>}
          {error && <p className="error-text">{error}</p>}

          {!loading && !error && commandes.length === 0 && (
            <p>
              Vous n&apos;avez pas encore passé de commande. Ajoutez des plats à
              votre panier et lancez-vous 🍽️
            </p>
          )}

          <div className="plats-table">
            {commandes.map((cmd) => (
              <div key={cmd.id} className="cuisinier-section">
                {/* Header commande */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <strong>Commande #{cmd.id}</strong>
                    <div style={{ fontSize: "0.9rem", color: "#555" }}>
                      Passée le {formatDate(cmd.created_at)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className={classStatut(cmd.statut)}>
                      {labelStatut(cmd.statut)}
                    </span>
                    <div style={{ fontWeight: 700, marginTop: 4 }}>
                      Total : {cmd.total} $
                    </div>
                  </div>
                </div>

                {/* Lignes */}
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    fontSize: "0.9rem",
                    marginBottom: 8,
                  }}
                >
                  {cmd.lignes.map((l) => (
                    <li key={l.id}>
                      {l.quantite} × {l.plat_nom} — {l.sous_total} $
                    </li>
                  ))}
                </ul>

                {/* Boutons d’action */}
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 12,
                  }}
                >
                  {/* ANNULER visible uniquement si EN_ATTENTE */}
                  {cmd.statut === "EN_ATTENTE" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleAnnulerCommande(cmd.id, cmd.statut)
                      }
                      style={{
                        padding: "8px 16px",
                        borderRadius: 999,
                        border: "none",
                        backgroundColor: "#e53935",
                        color: "#fff",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Annuler la commande
                    </button>
                  )}

                  {/* CONFIRMER visible uniquement si REMIS */}
                  {cmd.statut === "REMIS" && (
                    <button
                      type="button"
                      onClick={() => handleConfirmerReception(cmd.id)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 999,
                        border: "none",
                        backgroundColor: "#2e7d32",
                        color: "#fff",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Confirmer la réception
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="client-sidebar">
          <div className="client-sidebar-card">
            <h3>Astuce Wakelni</h3>
            <p>
              Rafraîchissez la page pour voir l&apos;état mis à jour par votre
              cuisinier (en préparation, prêt, remis…).
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
