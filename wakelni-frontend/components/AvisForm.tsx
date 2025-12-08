'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';

type AvisFormProps = {
  platId: string;
  platNom: string;
  onSubmitted?: () => void | Promise<void>;
};

type AvisResponse = {
  id: string;
  note: number;
  commentaire: string;
  date: string;
};

export default function AvisForm({ platId, platNom, onSubmitted }: AvisFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // ✅ Charger l'avis existant (si déjà envoyé)
  useEffect(() => {
    async function loadAvis() {
      try {
        setLoadError(null);

        const data = (await apiGet(
          `/api/avis/mon-avis/?plat_id=${platId}`
        )) as AvisResponse | null;

        if (data) {
          setRating(data.note);
          setComment(data.commentaire || '');
          setHasSubmitted(true);
          setSuccessMessage('Vous avez déjà laissé un avis pour ce plat.');
        }
      } catch (err) {
        // Aucun avis → normal
      }
    }

    loadAvis();
  }, [platId]);

  const displayRating = hoverRating || rating;

  // ✅ Envoi de l'avis
  async function handleSubmit() {
    if (!rating || hasSubmitted || loading) return;

    try {
      setLoading(true);
      setSubmitError(null);
      setSuccessMessage(null);

      await apiPost('/api/avis/laisser-avis/', {
        plat: platId,
        note: rating,
        commentaire: comment.trim(),
      });

      setHasSubmitted(true);
      setSuccessMessage('Merci pour votre avis !');

      if (onSubmitted) {
        await onSubmitted(); // recharge les avis à droite
      }
    } catch (err: any) {
      console.error(err);

      let userMessage =
        "Impossible d'enregistrer votre avis pour le moment.";

      const apiDetail =
        err?.data?.detail ||
        err?.response?.data?.detail ||
        err?.detail ||
        err?.message;

      if (typeof apiDetail === 'string') {
        if (
          apiDetail.includes(
            'Vous ne pouvez noter que les plats que vous avez déjà commandés.'
          )
        ) {
          userMessage =
            "Vous ne pouvez donner un avis que sur les plats que vous avez déjà commandés.";
        } else {
          userMessage = apiDetail;
        }
      }

      setSubmitError(userMessage);
      setSuccessMessage(null);
    } finally {
      setLoading(false);
    }
  }

  const starsDisabled = loading || hasSubmitted;
  const commentDisabled = loading || !rating || hasSubmitted;
  const buttonDisabled = loading || !rating || hasSubmitted;

  return (
    <div className="avis-card">
      <h4 className="avis-title">Votre avis sur {platNom}</h4>

      {/* ⭐ ÉTOILES */}
      <div className="avis-stars-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={star <= displayRating ? 'star-btn filled' : 'star-btn'}
            disabled={starsDisabled}
            onMouseEnter={() => !starsDisabled && setHoverRating(star)}
            onMouseLeave={() => !starsDisabled && setHoverRating(0)}
            onClick={() => !starsDisabled && setRating(star)}
          >
            ★
          </button>
        ))}
        <span className="avis-score">
          {displayRating > 0 ? `${displayRating}/5` : 'Notez ce plat'}
        </span>
      </div>

      {/* 💬 COMMENTAIRE */}
      <label className="avis-label">
        Commentaire (optionnel)
        <textarea
          className="plat-comment-input"
          placeholder={
            !rating
              ? 'Choisissez d’abord une note pour activer le commentaire'
              : hasSubmitted
              ? 'Avis déjà envoyé'
              : 'Partagez votre expérience avec ce plat...'
          }
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={commentDisabled}
        />
      </label>

      {/* ❌ MESSAGE ERREUR */}
      {submitError && (
        <p className="error-text" style={{ marginTop: 4 }}>
          {submitError}
        </p>
      )}

      {/* ✅ MESSAGE SUCCÈS */}
      {successMessage && (
        <p className="success-text" style={{ marginTop: 4 }}>
          {successMessage}
        </p>
      )}

      {/* 🚀 BOUTON */}
      <div className="avis-actions">
        <button
          type="button"
          className="btn btn-primary avis-submit-btn"
          onClick={handleSubmit}
          disabled={buttonDisabled}
        >
          {hasSubmitted
            ? 'Avis envoyé'
            : loading
            ? 'Envoi...'
            : 'Envoyer mon avis'}
        </button>
      </div>
    </div>
  );
}
