// lib/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// SimpleJWT avec un prefix /api/users/ :
const REFRESH_TOKEN_PATH = '/api/users/token/refresh/';
// Si chez toi c'est /api/token/refresh/, mets plutôt :
// const REFRESH_TOKEN_PATH = '/api/token/refresh/';

//  utilitaire pour vider le localStorage + rediriger vers /login
function clearAuthAndRedirect() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('accessToken');
    window.localStorage.removeItem('refreshToken');
    window.localStorage.removeItem('username');
    window.localStorage.removeItem('email');
    window.localStorage.removeItem('role');
    window.localStorage.removeItem('first_name');
    window.localStorage.removeItem('last_name');

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
    } catch {
      // ignore
    }
    throw new Error(errorText);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function buildHeaders(tokenOverride?: string) {
  if (typeof window === 'undefined') {
    return { 'Content-Type': 'application/json' };
  }

  const token = tokenOverride ?? window.localStorage.getItem('accessToken');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// 🔄 Tente d'obtenir un nouveau access token à partir du refreshToken
async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const refresh = window.localStorage.getItem('refreshToken');
  if (!refresh) return null;

  try {
    const res = await fetch(`${BASE_URL}${REFRESH_TOKEN_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      console.error('Refresh token invalid');
      return null;
    }

    const data = await res.json();
    // SimpleJWT renvoie normalement { access: "..." }
    if (data.access) {
      window.localStorage.setItem('accessToken', data.access);
      return data.access;
    }

    return null;
  } catch (err) {
    console.error('Error refreshing token', err);
    return null;
  }
}

// 🧠 Fonction centrale : envoie la requête, gère 401, tente le refresh, rejoue la requête
async function request(
  method: string,
  path: string,
  body?: any,
  isFormData: boolean = false,
  retry: boolean = true
) {
  const url = `${BASE_URL}${path}`;
  let headers = buildHeaders();

  if (isFormData) {
    // laisser le navigateur gérer multipart/form-data
    delete (headers as any)['Content-Type'];
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  let res = await fetch(url, options);

  // Si le token est expiré / 401 et qu'on n'a pas encore essayé de refresh
  if (res.status === 401 && retry && typeof window !== 'undefined') {
    console.warn('Access token possibly expired, trying refresh...');

    const newAccessToken = await refreshAccessToken();

    if (newAccessToken) {
      // On reconstruit les headers avec le nouveau token
      headers = buildHeaders(newAccessToken);
      if (isFormData) {
        delete (headers as any)['Content-Type'];
      }

      const retryOptions: RequestInit = {
        method,
        headers,
      };
      if (body) {
        retryOptions.body = isFormData ? body : JSON.stringify(body);
      }

      // On rejoue la requête UNE SEULE FOIS
      res = await fetch(url, retryOptions);
      if (res.ok) {
        return handleResponse(res);
      }

      if (res.status === 401) {
        // Le refresh n'a pas suffi → on déconnecte
        clearAuthAndRedirect();
        throw new Error('Votre session a expiré, veuillez vous reconnecter.');
      }

      // autre erreur
      return handleResponse(res);
    } else {
      // impossible de refresh (refresh absent ou invalide)
      clearAuthAndRedirect();
      throw new Error('Votre session a expiré, veuillez vous reconnecter.');
    }
  }

  // Si 401 direct et on ne veut pas/peut pas refresh
  if (res.status === 401) {
    clearAuthAndRedirect();
    throw new Error('Votre session a expiré, veuillez vous reconnecter.');
  }

  return handleResponse(res);
}

// ====== Fonctions utilitaires exportées ======

export async function apiGet(path: string) {
  return request('GET', path);
}

export async function apiPost(path: string, body: any) {
  return request('POST', path, body);
}

export async function apiDelete(path: string) {
  return request('DELETE', path);
}

export async function apiPostForm(path: string, formData: FormData) {
  return request('POST', path, formData, true);
}

export async function apiPatch(path: string, body: any) {
  return request('PATCH', path, body);
}

export async function apiPatchForm(path: string, formData: FormData) {
  return request('PATCH', path, formData, true);
}
