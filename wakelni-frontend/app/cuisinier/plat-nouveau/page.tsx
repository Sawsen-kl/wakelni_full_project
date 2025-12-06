// app/cuisinier/plat-nouveau/page.tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';      // ✅ au lieu de 'next/router'
import { apiPostForm } from '../../../lib/api';

export default function NouveauPlatPage() {
  const router = useRouter();                     // ✅ hook Next 13 app router

  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('');
  const [stock, setStock] = useState(1);
  const [ville, setVille] = useState('');
  const [adresse, setAdresse] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sécurité basique : si pas token -> login
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = window.localStorage.getItem('accessToken');
      if (!token) {
        window.location.href = '/login';
      }
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append('nom', nom);
    formData.append('description', description);
    formData.append('prix', prix);
    formData.append('stock', stock.toString());
    formData.append('ville', ville);
    formData.append('adresse', adresse);
    formData.append('ingredients', ingredients);
    formData.append('est_actif', 'true');

    if (photoFile) {
      // ⚠️ le nom "photo" doit correspondre au champ ImageField dans models.Plat
      formData.append('photo', photoFile);
    }

    try {
      setLoading(true);
      await apiPostForm('/api/plats/', formData);

      // Redirection automatique vers le tableau de bord cuisinier
      router.push('/cuisinier');
    } catch (err: any) {
      console.error('Erreur création plat :', err);
      // 👉 on affiche le vrai message renvoyé par le backend si possible
      setError(err?.message || 'Erreur lors de la création du plat.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="plat-form-page">
      <div className="plat-form-card">
        <h1 className="plat-form-title">Ajouter un nouveau plat</h1>

        <form onSubmit={handleSubmit} className="plat-form">
          <div className="plat-form-group">
            <label>Nom du plat</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              className="plat-form-input"
            />
          </div>

          <div className="plat-form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="plat-form-textarea"
            />
          </div>

          <div className="plat-form-group">
            <label>Prix</label>
            <input
              type="number"
              step="0.01"
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              required
              className="plat-form-input"
            />
          </div>

          <div className="plat-form-group">
            <label>Quantité disponible</label>
            <input
              type="number"
              min={1}
              value={stock}
              onChange={(e) => setStock(parseInt(e.target.value, 10) || 1)}
              required
              className="plat-form-input"
            />
          </div>

          <div className="plat-form-group">
            <label>Ville</label>
            <input
              type="text"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              required
              className="plat-form-input"
            />
          </div>

          <div className="plat-form-group">
            <label>Adresse (optionnel)</label>
            <input
              type="text"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="Ex : 123 Rue Principale, app. 4"
              className="plat-form-input"
            />
          </div>

          <div className="plat-form-group">
            <label>Ingrédients</label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              className="plat-form-textarea"
            />
          </div>

          <div className="plat-form-group">
            <label>Photo du plat</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              className="plat-form-input"
            />
          </div>

          {error && <p className="error-text">{error}</p>}
          {message && <p className="success-text">{message}</p>}

          <button
            type="submit"
            className="btn btn-primary plat-form-submit"
            disabled={loading}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  );
}
