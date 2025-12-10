'use client';

import { FormEvent, useState } from 'react';
import { apiPost } from '../../../lib/api';

export default function RegisterCuisinierPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [adresse, setAdresse] = useState('');
  const [bio, setBio] = useState('');
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
      const payload = {
        username: email,
        email,
        password,
        role: 'CUISINIER',
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl,
        adresse,
        bio,
      };

      console.log('🔹 Envoi inscription cuisinier:', payload);

      const API_BASE =
        process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

      const res = await fetch(`${API_BASE}/api/users/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      console.log('🔹 Status Django:', res.status);
      console.log('🔹 Réponse brute Django:', text);

      if (!res.ok) {
        alert(`Erreur API ${res.status}: ${text}`);
        setError(text || "Erreur lors de l'inscription.");
        return;
      }

      setSuccess('Inscription cuisinier réussie ! Vous pouvez maintenant vous connecter.');

      // Reset des champs
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAvatarUrl('');
      setAdresse('');
      setBio('');

    } catch (err: any) {
      console.error('❌ Exception JS dans handleSubmit:', err);
      alert('Exception JS: ' + (err?.message ?? 'inconnue'));
      setError("Erreur lors de l'inscription (voir console).");
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
          Inscription Cuisinier
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
            Adresse de la cuisine
            <input
              type="text"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={{ fontWeight: 600 }}>
            Bio / description
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </label>

          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
          {success && <p style={{ color: 'green', textAlign: 'center' }}>{success}</p>}

          {/* BOUTON SE CONNECTER APRÈS SUCCÈS */}
          {success && (
            <div style={{ textAlign: "center" }}>
              <a
                href="/login"
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  backgroundColor: "#0066cc",
                  color: "white",
                  borderRadius: "25px",
                  marginTop: "10px",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Se connecter
              </a>
            </div>
          )}

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Inscription...' : 'Créer le compte cuisinier'}
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
