"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPatch } from "../../../lib/api";

type CuisinierProfile = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string | null;
  adresse?: string | null;
  bio?: string | null;
};

export default function CuisinierProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<CuisinierProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Pour le header (comme Réclamations)
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);

  //  Vérification connexion cuisinier + chargement profil
  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role");

    if (!token) {
      router.push("/login");
      return;
    }

    if (role !== "CUISINIER") {
      router.push("/client");
      return;
    }

    // nom pour le header
    setFirstName(localStorage.getItem("first_name"));
    setLastName(localStorage.getItem("last_name"));

    loadProfile();
  }, [router]);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet("/api/users/me/");
      setProfile(data);
    } catch (err: any) {
      console.error(err);
      setError("Impossible de charger le profil cuisinier.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field: keyof CuisinierProfile, value: string) {
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
        adresse: profile.adresse,
        bio: profile.bio,
      };

      const data = await apiPatch("/api/users/me/", payload);
      setProfile(data);
      setIsEditing(false);
      setSuccess("Profil cuisinier mis à jour avec succès !");
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la mise à jour du profil.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    loadProfile();
  }

  function handleLogout() {
    if (typeof window === "undefined") return;
    localStorage.clear();
    router.push("/login");
  }

  if (loading) return <p style={{ padding: 30 }}>Chargement du profil...</p>;
  if (!profile) return <p>Profil cuisinier introuvable.</p>;

  const fullName = `${profile.first_name || ""} ${
    profile.last_name || ""
  }`.trim();

  const greetingName =
    (firstName || "") + (lastName ? ` ${lastName}` : "") || "Compte cuisinier";

  return (
    <div className="cuisinier-dashboard">
      {/* ===== HEADER CUISINIER (même style que Réclamations) ===== */}
      <div className="cuisinier-header">
        <div>
          <h1>Mon profil cuisinier</h1>
          <p>Consulte et modifie les informations de ton compte.</p>
        </div>

        <div className="cuisinier-header-actions">
          <button
            className="btn header-tab header-tab-active"
            onClick={() => router.push("/cuisinier/profile")}
          >
            Mon compte
          </button>
          <button
            className="btn header-tab"
            onClick={() => router.push("/cuisinier/reclamations")}
          >
            Réclamations
          </button>
          <button
            className="btn header-tab"
            onClick={() => router.push("/cuisinier/avis")}
          >
            Avis
          </button>
          <button
            className="btn header-tab"
            onClick={() => router.push("/cuisinier/commandes")}
          >
            Commandes
          </button>
          <button
            className="btn btn-primary header-add-plat"
            onClick={() => router.push("/cuisinier/plat-nouveau")}
          >
            + Ajouter un plat
          </button>

          {/* Carte compte cuisinier (comme dans Réclamations) */}
          <div className="client-hero-account-card">
            <div className="client-hero-avatar">
              {(firstName || "U")[0]?.toUpperCase()}
            </div>
            <div className="client-hero-account-text">
              <span className="client-hero-name">
                {greetingName || "Compte cuisinier"}
              </span>
              <span className="client-hero-role">Compte cuisinier</span>
            </div>
            <button onClick={handleLogout} className="client-hero-logout">
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* ===== CONTENU PROFIL ===== */}
      <main className="client-main-layout">
        <div className="client-main-column">
          <h2 className="client-section-title">Mes informations</h2>

          {error && <p className="error-text">{error}</p>}
          {success && <p className="success-text">{success}</p>}

          <div className="client-sidebar-card">
            {/* MODE LECTURE */}
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
                  <div className="profile-label">Nom d'utilisateur</div>
                  <div className="profile-value">
                    {profile.username || "Non renseigné"}
                  </div>
                </div>

                <div>
                  <div className="profile-label">Email</div>
                  <div className="profile-value">{profile.email}</div>
                </div>

                <div>
                  <div className="profile-label">Adresse</div>
                  <div className="profile-value">
                    {profile.adresse || "Non renseignée"}
                  </div>
                </div>

                <div>
                  <div className="profile-label">Biographie</div>
                  <div className="profile-value">
                    {profile.bio || "Aucune biographie renseignée"}
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

            {/* MODE ÉDITION */}
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
                      value={profile.first_name}
                      onChange={(e) =>
                        handleChange("first_name", e.target.value)
                      }
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label className="profile-label">Nom</label>
                    <input
                      value={profile.last_name}
                      onChange={(e) =>
                        handleChange("last_name", e.target.value)
                      }
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="profile-label">Adresse</label>
                  <input
                    value={profile.adresse || ""}
                    onChange={(e) => handleChange("adresse", e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label className="profile-label">Biographie</label>
                  <textarea
                    value={profile.bio || ""}
                    onChange={(e) => handleChange("bio", e.target.value)}
                    rows={4}
                    style={{ width: "100%", resize: "vertical" }}
                  />
                </div>

                <div>
                  <label className="profile-label">Avatar (URL)</label>
                  <input
                    value={profile.avatar_url || ""}
                    onChange={(e) =>
                      handleChange("avatar_url", e.target.value)
                    }
                    style={{ width: "100%" }}
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
