// app/page.tsx
'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Wakelni - le goût de la maison, livré chez vous</h1>
            <p>
              Mangez chez vous des plats préparés avec amour par des cuisiniers passionnés.
              Des recettes faites maison, avec l&apos;odeur de nos parents et de nos grands-parents,
              directement dans votre salon.
            </p>

            <div className="hero-buttons">
              <Link href="/register/client" className="btn btn-client">
                Je suis client
              </Link>
              <Link href="/register/cuisinier" className="btn btn-cuisinier">
                Je suis cuisinier
              </Link>
              <Link href="/login" className="btn btn-secondary">
                Connexion
              </Link>
            </div>

            <p className="hero-subtext">
              Inscrivez-vous en quelques clics, découvrez les plats près de chez vous
              et commandez sans bouger de votre canapé.
            </p>
          </div>
        </div>
      </section>

      {/* AVANTAGES */}
      <section className="features">
        <h2>Pourquoi choisir Wakelni&nbsp;?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Mangez chez vous</h3>
            <p>
              Plus besoin de sortir&nbsp;: choisissez votre plat, un cuisinier
              s&apos;occupe de tout et vous profitez d&apos;un repas chaud à la
              maison.
            </p>
          </div>
          <div className="feature-card">
            <h3>Plats préparés avec amour</h3>
            <p>
              Des plats faits maison, préparés comme à la maison, avec des
              ingrédients simples, du temps et beaucoup de cœur.
            </p>
          </div>
          <div className="feature-card">
            <h3>Le goût de la famille</h3>
            <p>
              Retrouvez l&apos;odeur de la cuisine de vos parents et de vos
              grands-parents&nbsp;: couscous, tajine, plats traditionnels et
              recettes familiales.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
