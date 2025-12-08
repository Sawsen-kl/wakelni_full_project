"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPatch } from "../../../lib/api";

type ClientProfile = {
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string | null;
  adresse_principale?: string | null;
  preferences?: string | null;
};

export default function ClientProfilPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // ✅ Vérification connexion client + chargement profil
  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role");

    if (!token) {
      router.push("/login");
      return;
    }

    if (role !== "CLIENT") {
      router.push("/cuisinier");
      return;
    }

    loadProfile();
  }, [router]);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await apiGet("/api/users/me/");
      setProfile(data);
    } catch (err: any) {
      console.error(err);
      setError("Impossible de charger le profil.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field: keyof ClientProfile, value: string) {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: profile.avatar_url,
        adresse_principale: profile.adresse_principale,
        preferences: profile.preferences,
      };

      const data = await apiPatch("/api/users/me/", payload);
      setProfile(data);
      setIsEditing(false);
      setSuccess("Profil mis à jour avec succès !");
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    // On recharge les données depuis l'API pour annuler les changements
    loadProfile();
  }

  function handleLogout() {
    localStorage.clear();
    router.push("/login");
  }

  if (loading) return <p style={{ padding: 30 }}>Chargement du profil...</p>;
  if (!profile) return <p>Profil introuvable.</p>;

  const fullName = `${profile.first_name || ""} ${
    profile.last_name || ""
  }`.trim();

  return (
    <div className="client-page">
      {/* ===== HERO ===== */}
      <section className="client-hero">
        <div className="client-hero-overlay">
          <div className="client-hero-content">
            <p className="client-hero-eyebrow">ESPACE CLIENT</p>
            <h1 className="client-hero-title">Mon profil</h1>
            <p className="client-hero-subtitle">
              Consultez vos informations personnelles et mettez-les à jour si
              nécessaire.
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
            <div className="client-hero-avatar">
              {profile.first_name?.[0]?.toUpperCase() || "C"}
            </div>
            <div className="client-hero-account-text">
              <span className="client-hero-name">
                {fullName || "Compte client"}
              </span>
              <span className="client-hero-role">Compte client</span>
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
          <h2 className="client-section-title">Mes informations</h2>

          {error && <p className="error-text">{error}</p>}
          {success && <p className="success-text">{success}</p>}

          <div className="client-sidebar-card">
            {/* MODE LECTURE (STATIQUE, BEAU) */}
            {!isEditing && (
              <div
                style={{
                  display: "grid",
                  gap: "16px",
                  maxWidth: "700px",
                }}
              >
                <div>
                  <div className="profile-label">Nom complet</div>
                  <div className="profile-value">
                    {fullName || "Non renseigné"}
                  </div>
                </div>

                <div>
                  <div className="profile-label">Email</div>
                  <div className="profile-value">{profile.email}</div>
                </div>

                <div>
                  <div className="profile-label">Adresse principale</div>
                  <div className="profile-value">
                    {profile.adresse_principale || "Non renseignée"}
                  </div>
                </div>

                <div>
                  <div className="profile-label">
                    Préférences alimentaires
                  </div>
                  <div className="profile-value">
                    {profile.preferences || "Aucune préférence indiquée"}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "8px",
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary-light"
                    onClick={() => setIsEditing(true)}
                  >
                    Modifier mes informations
                  </button>
                </div>
              </div>
            )}

            {/* MODE ÉDITION (FORMULAIRE JOLI) */}
            {isEditing && (
              <form
                onSubmit={handleSave}
                style={{
                  display: "grid",
                  gap: "16px",
                  maxWidth: "700px",
                }}
              >
                <div>
                  <label className="profile-label">Email</label>
                  <input
                    value={profile.email}
                    disabled
                    style={{ width: "100%" }}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label className="profile-label">Prénom</label>
                    <input
                      value={profile.first_name || ""}
                      onChange={(e) =>
                        handleChange("first_name", e.target.value)
                      }
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label className="profile-label">Nom</label>
                    <input
                      value={profile.last_name || ""}
                      onChange={(e) =>
                        handleChange("last_name", e.target.value)
                      }
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="profile-label">Adresse principale</label>
                  <input
                    value={profile.adresse_principale || ""}
                    onChange={(e) =>
                      handleChange("adresse_principale", e.target.value)
                    }
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label className="profile-label">
                    Préférences alimentaires
                  </label>
                  <textarea
                    value={profile.preferences || ""}
                    onChange={(e) =>
                      handleChange("preferences", e.target.value)
                    }
                    rows={4}
                    style={{ width: "100%", resize: "vertical" }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                    marginTop: "8px",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary-light"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-secondary-light"
                    disabled={saving}
                  >
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
