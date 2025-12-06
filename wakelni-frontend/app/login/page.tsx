'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiPost('/api/users/login/', {
        identifier,
        password,
      });

      if (typeof window !== 'undefined') {
        if (data.access) localStorage.setItem('accessToken', data.access);
        if (data.refresh) localStorage.setItem('refreshToken', data.refresh);

        if (data.user) {
          if (data.user.email) localStorage.setItem('email', data.user.email);
          if (data.user.username) localStorage.setItem('username', data.user.username);
          if (data.user.role) localStorage.setItem('role', data.user.role);

          //  AJOUT  NOM & PRENOM
          if (data.user.first_name)
            localStorage.setItem('first_name', data.user.first_name);

          if (data.user.last_name)
            localStorage.setItem('last_name', data.user.last_name);
        }
      }

      const role = data.user?.role || 'CLIENT';

      if (role === 'CUISINIER') router.push('/cuisinier');
      else router.push('/client');
    } catch (err: any) {
      console.error('Login error', err);
      setError(
        err?.message === 'API error'
          ? 'Identifiants invalides.'
          : err?.message || 'Erreur lors de la connexion.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Connectez-vous</h1>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">
            Courriel ou nom d&apos;utilisateur
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="login-input"
              placeholder="ex: sawsen.k@gmail.com"
            />
          </label>

          <label className="login-label">
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
              placeholder="Votre mot de passe"
            />
          </label>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Continuer'}
          </button>

          <div className="login-divider">
            <span>ou</span>
          </div>

          <div className="login-alt-buttons">
            <button type="button" className="login-alt-btn" disabled>
              Continuer avec Google (bientôt)
            </button>
            <button type="button" className="login-alt-btn" disabled>
              Continuer avec Apple (bientôt)
            </button>
          </div>

          <p className="login-bottom-text">
            Pas encore de compte ?{' '}
            <a href="/register/client" className="login-link">
              Créer un compte client
            </a>{' '}
            ou{' '}
            <a href="/register/cuisinier" className="login-link">
              un compte cuisinier
            </a>.
          </p>
        </form>
      </div>
    </div>
  );
}
