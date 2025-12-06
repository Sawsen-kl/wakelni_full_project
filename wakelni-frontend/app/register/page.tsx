'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, FormEvent } from 'react';
import { apiPost } from '../../lib/api';   // <- 2 niveaux seulement maintenant

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // role = CLIENT ou CUISINIER (par défaut CLIENT)
  const roleParam = searchParams.get('role');
  const initialRole =
    roleParam === 'CUISINIER' || roleParam === 'CLIENT'
      ? roleParam
      : 'CLIENT';

  const [role, setRole] = useState(initialRole);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // met à jour le rôle si l’URL change
    if (roleParam === 'CUISINIER' || roleParam === 'CLIENT') {
      setRole(roleParam);
    }
  }, [roleParam]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1) inscription côté Django
      const data = await apiPost('/api/users/register/', {
        username,
        email,
        password,
        role, // 'CLIENT' ou 'CUISINIER'
      });

      // 2) enregistrer les infos utiles dans localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('token', data.token ?? '');
        window.localStorage.setItem('user_id', data.user?.id ?? '');
        window.localStorage.setItem('username', data.user?.username ?? '');
        window.localStorage.setItem('email', data.user?.email ?? '');
        window.localStorage.setItem('role', data.user?.role ?? role);
      }

      // 3) redirection selon le rôle
      if (role === 'CUISINIER') {
        router.push('/cuisinier');
      } else {
        router.push('/client');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Erreur lors de l'inscription. Vérifiez les champs."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>Inscription {role === 'CUISINIER' ? 'cuisinier' : 'client'}</h1>

      <div className="role-switch">
        <button
          type="button"
          className={role === 'CLIENT' ? 'active' : ''}
          onClick={() => router.push('/register?role=CLIENT')}
        >
          Je suis client
        </button>
        <button
          type="button"
          className={role === 'CUISINIER' ? 'active' : ''}
          onClick={() => router.push('/register?role=CUISINIER')}
        >
          Je suis cuisinier
        </button>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Nom d&apos;utilisateur
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Inscription…' : "S'inscrire"}
        </button>
      </form>
    </div>
  );
}
