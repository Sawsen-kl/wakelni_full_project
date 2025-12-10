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
      .catch((err: any) => {
        console.error(err);
        setStatus("error");
        // on récupère le message de l'API si dispo
        const apiMsg = err?.message || "";
        setMessage(
          apiMsg ||
            "Impossible de confirmer votre paiement. Si le montant n'a pas été débité, la commande ne sera pas créée."
        );
      });
  }, [searchParams]);

  // ========= TEXTES DYNAMIQUES =========
  const heroEyebrow =
    status === "ok"
      ? "PAIEMENT RÉUSSI"
      : status === "error"
      ? "PROBLÈME DE PAIEMENT"
      : "VÉRIFICATION EN COURS";

  const heroTitle =
    status === "ok"
      ? "Merci pour votre commande 🎉"
      : status === "error"
      ? "Nous n’avons pas pu confirmer votre paiement"
      : "Nous vérifions votre paiement…";

  const heroSubtitle =
    status === "ok"
      ? "Votre paiement a été validé. Votre commande est maintenant en cours de préparation."
      : status === "error"
      ? message ||
        "Un problème est survenu lors de la confirmation du paiement. Si vous n’avez pas été débité, vous pouvez réessayer."
      : "Veuillez patienter quelques instants, nous confirmons votre paiement auprès de Stripe.";

  const sectionTitle =
    status === "ok"
      ? "Votre commande est en cours de préparation"
      : status === "error"
      ? "Le paiement n’a pas pu être confirmé"
      : "Confirmation de votre paiement en cours";

  return (
    <div className="client-page">
      {/* HERO */}
      <section className="client-hero">
        <div className="client-hero-overlay">
          <div className="client-hero-content">
            <p className="client-hero-eyebrow">{heroEyebrow}</p>
            <h1 className="client-hero-title">{heroTitle}</h1>
            <p className="client-hero-subtitle">{heroSubtitle}</p>

            <div className="client-hero-buttons">
              <button
                type="button"
                className="hero-btn-secondary"
                onClick={() => router.push("/client")}
              >
                Retour à l&apos;accueil client
              </button>
              <button
                type="button"
                className="hero-btn-secondary"
                onClick={() => router.push("/client/panier")}
              >
                Voir mon panier
              </button>
              <button
                type="button"
                className="hero-btn-secondary"
                onClick={() => router.push("/client/commandes")}
              >
                Mes commandes
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Bloc d'état de la commande */}
      <main className="client-main-layout">
        <div className="client-main-column">
          <h2 className="client-section-title">{sectionTitle}</h2>

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
            <>
              <p style={{ color: "#b00020", marginBottom: 12 }}>{message}</p>
              <p style={{ fontSize: "0.9rem", color: "#555" }}>
                Vérifiez dans votre relevé bancaire si le paiement a bien été
                débité. Si ce n’est pas le cas, vous pouvez retourner à vos
                plats et réessayer le paiement.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
