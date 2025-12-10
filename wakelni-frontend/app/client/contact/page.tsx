// app/client/contact/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ContactPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  //  Vérif auth comme les autres pages client
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

  if (checkingAuth) {
    return <p style={{ padding: 24 }}>Vérification de la connexion...</p>;
  }

  return (
    <div className="client-page">
      {/* ===== HERO CONTACT ===== */}
      <section className="client-hero">
        <div className="client-hero-overlay">
          <div className="client-hero-content">
            <p className="client-hero-eyebrow">ESPACE CLIENT</p>
            <h1 className="client-hero-title">Contactez l&apos;équipe Wakelni</h1>
            <p className="client-hero-subtitle">
              Une question sur une commande, un plat ou votre compte&nbsp;?
              Écrivez-nous ou appelez-nous, nous sommes là pour vous aider.
            </p>

            <div className="client-hero-buttons">
              <button
                type="button"
                className="hero-btn-secondary"
                onClick={() => router.push("/client")}
              >
                Retour à l&apos;accueil
              </button>
            </div>
          </div>

          {/* Carte compte en haut à droite */}
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

      {/* ===== CONTENU ===== */}
      <main className="client-main-layout">
        <div className="client-main-column">
          <h2 className="client-section-title">Comment nous joindre</h2>

          {/* Téléphone */}
          <div className="client-sidebar-card" style={{ marginBottom: 16 }}>
            <h3>Service client par téléphone</h3>
            <p>
              <strong>Tél&nbsp;:</strong> +1 (514) 555-1234
            </p>
            <p>
              <strong>Disponibilité&nbsp;:</strong> Lundi au vendredi, 9h à 18h
            </p>
            <p>
              Idéal pour les questions urgentes concernant une commande en cours
              (retard, problème de livraison, etc.).
            </p>
          </div>

          {/* Courriel */}
          <div className="client-sidebar-card" style={{ marginBottom: 16 }}>
            <h3>Courriel</h3>
            <p>
              <strong>Adresse&nbsp;:</strong>{" "}
              <a href="mailto:support@wakelni.ca">support@wakelni.ca</a>
            </p>
            <p>
              Utilisez ce courriel pour les questions générales, les
              suggestions ou les problèmes techniques avec l&apos;application.
            </p>
          </div>

          {/* Adresse / zone de service */}
          <div className="client-sidebar-card" style={{ marginBottom: 16 }}>
            <h3>Zone de service</h3>
            <p>
              Wakelni dessert actuellement les régions de{" "}
              <strong>Montréal</strong> et <strong>Laval</strong>.
            </p>
            <p>
              Les plats sont préparés par des cuisiniers partenaires à domicile
              et remis en main propre ou via un point de rencontre convenu.
            </p>
          </div>

          {/* Horaires */}
          <div className="client-sidebar-card" style={{ marginBottom: 16 }}>
            <h3>Horaires de support</h3>
            <ul>
              <li>Lundi – Vendredi : 9h00 – 18h00</li>
              <li>Samedi : 10h00 – 16h00</li>
              <li>Dimanche : fermé (support par courriel uniquement)</li>
            </ul>
          </div>

          {/* Lien réclamations */}
          <div className="client-sidebar-card">
            <h3>Un problème avec une commande&nbsp;?</h3>
            <p>
              Si vous avez reçu un plat non conforme, en retard ou si quelque
              chose ne s&apos;est pas bien passé, vous pouvez déposer une
              réclamation détaillée directement depuis votre espace client.
            </p>
            <button
              type="button"
              className="hero-btn-primary"
              onClick={() => router.push("/reclamations")}
            >
              Accéder aux réclamations
            </button>
          </div>
        </div>

        {/* Sidebar droite (facultative) */}
        <aside className="client-sidebar">
          <div className="client-sidebar-card">
            <h3>Conseils pour un traitement rapide</h3>
            <ul>
              <li>Indiquez le numéro de commande concernée.</li>
              <li>Précisez la date et l&apos;heure du problème.</li>
              <li>
                Ajoutez une capture d&apos;écran ou une photo si nécessaire.
              </li>
            </ul>
          </div>
          <div className="client-sidebar-card">
            <h3>FAQ à venir</h3>
            <p>
              Une rubrique de questions fréquentes sera bientôt disponible pour
              répondre rapidement aux questions les plus courantes.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
