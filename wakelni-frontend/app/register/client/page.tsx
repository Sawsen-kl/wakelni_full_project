'use client';

import { FormEvent, useState } from 'react';
import { apiPost } from '../../../lib/api';

export default function RegisterClientPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [adressePrincipale, setAdressePrincipale] = useState('');
  const [reference, setReference] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      // username = email pour simplifier
      await apiPost('/api/users/register/', {
        username: email,
        email,
        password,
        role: 'CLIENT',
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl,
        adresse_principale: adressePrincipale,
        reference,
      });

      setSuccess('Inscription client réussie ! Vous pouvez maintenant vous connecter.');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAvatarUrl('');
      setAdressePrincipale('');
      setReference('');
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: '80px',
        paddingBottom: '80px',
        backgroundColor: '#f2f2f2',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          background: 'white',
          padding: '32px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#c1121f' }}>
          Inscription Client
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ fontWeight: 600 }}>
            Prénom
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              style={inputStyle}
            />
          </label>

          <label style={{ fontWeight: 600 }}>
            Nom
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              style={inputStyle}
            />
          </label>

          <label style={{ fontWeight: 600 }}>
            Courriel
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </label>

          <label style={{ fontWeight: 600 }}>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </label>

          <label style={{ fontWeight: 600 }}>
            Confirmation du mot de passe
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </label>

          <label style={{ fontWeight: 600 }}>
            Avatar URL
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://exemple.com/mon-avatar.jpg"
              style={inputStyle}
            />
          </label>

          <label style={{ fontWeight: 600 }}>
            Adresse principale
            <input
              type="text"
              value={adressePrincipale}
              onChange={(e) => setAdressePrincipale(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={{ fontWeight: 600 }}>
            Références alimentaires
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              style={inputStyle}
            />
          </label>

          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
          {success && <p style={{ color: 'green', textAlign: 'center' }}>{success}</p>}

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Inscription...' : 'Créer le compte client'}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  marginTop: '6px',
  borderRadius: '8px',
  border: '1px solid #ccc',
};

const buttonStyle: React.CSSProperties = {
  marginTop: '10px',
  padding: '12px',
  borderRadius: '999px',
  border: 'none',
  backgroundColor: '#c1121f',
  color: 'white',
  fontWeight: '600',
  cursor: 'pointer',
};
