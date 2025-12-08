"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiPost } from "../../../../lib/api";

type Status = "loading" | "ok" | "error";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const raw = searchParams.get("session_id");
    if (!raw) {
      setStatus("error");
      setMessage("Aucun identifiant de session fourni.");
      return;
    }

    // ✅ enlever les { } éventuels dans l'URL
    const cleaned = raw.replace(/^\{/, "").replace(/\}$/, "");
    setSessionId(cleaned);

    apiPost("/api/paiements/confirm/", { session_id: cleaned })
      .then(() => {
        setStatus("ok");
        setMessage("Votre commande est en cours de préparation.");
      })
      .catch((err) => {
        console.error(err);
        setStatus("error");
        setMessage("Impossible de confirmer votre paiement.");
      });
  }, [searchParams]);

  return (
    <div className="client-page">
      {/* HERO */}
      <section className="client-hero">
        <div className="client-hero-overlay">
          <div className="client-hero-content">
            <p className="client-hero-eyebrow">PAIEMENT RÉUSSI</p>
            <h1 className="client-hero-title">Merci pour votre commande 🎉</h1>
            <p className="client-hero-subtitle">
              Votre paiement a été traité avec succès. Votre commande est
              maintenant en cours de préparation.
            </p>

            <div className="client-hero-buttons">
              <button onClick={() => router.push("/client")}>
                Retour à l&apos;accueil client
              </button>
              <button onClick={() => router.push("/client/panier")}>
                Voir mon panier
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Bloc d'état de la commande */}
      <main className="client-main-layout">
        <div className="client-main-column">
          <h2 className="client-section-title">
            Votre commande est en cours de préparation
          </h2>

          {status === "loading" && (
            <p>Confirmation de votre paiement en cours...</p>
          )}

          {status === "ok" && (
            <>
              <p>
                Vous recevrez vos plats très bientôt. Merci d&apos;avoir choisi
                Wakelni 💛
              </p>
              {sessionId && (
                <p style={{ fontSize: "0.85rem", color: "#666" }}>
                  ID de session Stripe (test) : {sessionId}
                </p>
              )}
            </>
          )}

          {status === "error" && (
            <p style={{ color: "#b00020" }}>
              {message ||
                "Un problème est survenu lors de la confirmation du paiement."}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
