// app/client/paiement/success/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaiementSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Ici on pourrait appeler le backend pour vérifier la session Stripe si tu veux
    console.log('Stripe session id:', sessionId);
  }, [sessionId]);

  return (
    <div className="client-page">
      <section className="client-hero">
        <div className="client-hero-overlay">
          <div className="client-hero-content">
            <p className="client-hero-eyebrow">Paiement réussi</p>
            <h1 className="client-hero-title">Merci pour votre commande 🎉</h1>
            <p className="client-hero-subtitle">
              Votre paiement a été traité avec succès. Votre commande est
              maintenant en cours de préparation.
            </p>

            <div className="client-hero-buttons">
              <button
                type="button"
                className="hero-btn-secondary"
                onClick={() => router.push('/client')}
              >
                Retour à l&apos;accueil client
              </button>
              <button
                type="button"
                className="hero-btn-secondary"
                onClick={() => router.push('/client/panier')}
              >
                Voir mon panier (il est maintenant vide)
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="client-main-layout">
        <main className="client-main-column">
          <section className="client-cart-section">
            <h2 className="client-section-title">
              Votre commande est en cours de préparation
            </h2>
            <p className="client-section-subtitle">
              Vous recevrez vos plats très bientôt. Merci d&apos;avoir choisi
              Wakelni 💛
            </p>

            {sessionId && (
              <p style={{ marginTop: 16, fontSize: 14, opacity: 0.8 }}>
                ID de session Stripe (test) : {sessionId}
              </p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
