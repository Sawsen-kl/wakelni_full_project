// lib/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

//  utilitaire pour vider le localStorage + rediriger vers /login
function clearAuthAndRedirect() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('accessToken');
    window.localStorage.removeItem('refreshToken');
    window.localStorage.removeItem('username');
    window.localStorage.removeItem('email');
    window.localStorage.removeItem('role');

    // Redirection vers la page de connexion
    window.location.href = '/login';
  }
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    let errorText = 'API error';
    try {
      const data = await res.json();
      console.error('API error data:', data);
      errorText = (data as any).detail || JSON.stringify(data);

      // 👉 Ici on détecte les problèmes de token JWT
      const lower = String(errorText).toLowerCase();
      if (
        res.status === 401 ||                       // non autorisé
        lower.includes('token not valid') ||        // "Given token not valid for any token type"
        lower.includes('not authenticated') ||
        lower.includes('credentials were not provided')
      ) {
        clearAuthAndRedirect();
        throw new Error("Votre session a expiré, veuillez vous reconnecter.");
      }
    } catch {
      // ignore
    }
    throw new Error(errorText);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function buildHeaders() {
  if (typeof window === 'undefined') {
    return { 'Content-Type': 'application/json' };
  }
  const token = window.localStorage.getItem('accessToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiGet(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  return handleResponse(res);
}

export async function apiPost(path: string, body: any) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function apiDelete(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });
  return handleResponse(res);
}

export async function apiPostForm(path: string, formData: FormData) {
  const headers = buildHeaders();
  // très important : on enlève seulement Content-Type,
  // pour laisser le navigateur mettre "multipart/form-data"
  delete headers['Content-Type'];

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  return handleResponse(res);
}

export async function apiPatch(path: string, body: any) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

