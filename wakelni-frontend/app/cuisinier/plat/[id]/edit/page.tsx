"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiGet, apiPatchForm, apiPost } from "../../../../../lib/api";

type PlatDetail = {
  id: string;
  nom: string;
  description: string;
  prix: string | number;
  stock: number;
  ville: string;
  adresse: string;
  ingredients: string;
  est_actif: boolean;
  photo_url?: string | null;
};

export default function EditPlatPage() {
  const router = useRouter();
  const params = useParams(); // { id: "123" }
  const id = params?.id as string;

  const [plat, setPlat] = useState<PlatDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiGet(`/api/plats/${id}/`);
        setPlat(data as PlatDetail);
      } catch (err: any) {
        console.error(err);
        setError("Impossible de charger le plat.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  function handleChange<K extends keyof PlatDetail>(field: K, value: PlatDetail[K]) {
    if (!plat) return;
    setPlat({ ...plat, [field]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!plat) return;

  try {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("nom", plat.nom);
    formData.append("description", plat.description);
    formData.append("prix", String(plat.prix));
    formData.append("stock", String(plat.stock));
    formData.append("ville", plat.ville);
    formData.append("adresse", plat.adresse);
    formData.append("ingredients", plat.ingredients);
    formData.append("est_actif", plat.est_actif ? "true" : "false");

    //  même URL que pour le DELETE et le GET détail
    await apiPatchForm(`/api/plats/${id}/`, formData);

    setSuccess("Plat mis à jour avec succès !");
    router.push("/cuisinier");
  } catch (err: any) {
    console.error("Erreur API mise à jour plat:", err);
    setError(err?.message || "Erreur lors de la mise à jour du plat.");
  } finally {
    setSaving(false);
  }
}

  if (loading) return <p style={{ padding: 24 }}>Chargement du plat...</p>;
  if (!plat) return <p>Plat introuvable.</p>;

  return (
    <div className="cuisinier-dashboard">
      <div className="cuisinier-header">
        <div>
          <h1>Modifier le plat</h1>
          <p>Mets à jour les informations de ton plat.</p>
        </div>
        <div className="cuisinier-header-actions">
          <button
            className="btn header-tab"
            onClick={() => router.push("/cuisinier")}
          >
            Retour à mes plats
          </button>
        </div>
      </div>

      <section className="cuisinier-section">
        <h2>Informations du plat</h2>

        {error && <p className="error-text">{error}</p>}
        {success && <p className="success-text">{success}</p>}

        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gap: "16px", maxWidth: 600 }}
        >
          <div>
            <label className="profile-label">Nom</label>
            <input
              value={plat.nom}
              onChange={(e) => handleChange("nom", e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label className="profile-label">Description</label>
            <textarea
              value={plat.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>

          <div>
            <label className="profile-label">Prix</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={plat.prix}
              onChange={(e) => handleChange("prix", e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label className="profile-label">Stock</label>
            <input
              type="number"
              min="0"
              value={plat.stock}
              onChange={(e) => handleChange("stock", Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label className="profile-label">Ville</label>
            <input
              value={plat.ville}
              onChange={(e) => handleChange("ville", e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label className="profile-label">Adresse</label>
            <input
              value={plat.adresse}
              onChange={(e) => handleChange("adresse", e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label className="profile-label">Ingrédients</label>
            <textarea
              value={plat.ingredients}
              onChange={(e) =>
                handleChange("ingredients", e.target.value)
              }
              rows={3}
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>

          <div>
            <label className="profile-label">
              <input
                type="checkbox"
                checked={plat.est_actif}
                onChange={(e) =>
                  handleChange("est_actif", e.target.checked)
                }
                style={{ marginRight: 8 }}
              />
              Plat actif
            </label>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-secondary-light"
              onClick={() => router.push("/cuisinier")}
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
