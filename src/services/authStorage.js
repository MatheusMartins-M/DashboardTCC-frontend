const STORAGE_KEYS = {
  access: "accessToken",
  refresh: "refreshToken",
  user: "authUser",
};

export function saveAuth({ access, refresh, usuario }) {
  if (access) sessionStorage.setItem(STORAGE_KEYS.access, access);
  if (refresh) sessionStorage.setItem(STORAGE_KEYS.refresh, refresh);
  if (usuario) sessionStorage.setItem(STORAGE_KEYS.user, JSON.stringify(usuario));
}

export function saveAccessToken(access) {
  if (access) sessionStorage.setItem(STORAGE_KEYS.access, access);
}

export function clearAuth() {
  sessionStorage.removeItem(STORAGE_KEYS.access);
  sessionStorage.removeItem(STORAGE_KEYS.refresh);
  sessionStorage.removeItem(STORAGE_KEYS.user);
}

export function getAccessToken() {
  return sessionStorage.getItem(STORAGE_KEYS.access);
}

export function getRefreshToken() {
  return sessionStorage.getItem(STORAGE_KEYS.refresh);
}

export function getAuthUser() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.user);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}

export function isAdmin() {
  const user = getAuthUser();
  return user?.tipo_permissao === "ADMIN";
}

export function getPermissoes() {
  return getAuthUser()?.permissoes || [];
}

export function hasPermissao(codename) {
  if (isAdmin()) return true;
  return getPermissoes().includes(codename);
}

export function updateAuthUser(usuario) {
  if (!usuario) return;
  const atual = getAuthUser() || {};
  saveAuth({
    access: getAccessToken(),
    refresh: getRefreshToken(),
    usuario: { ...atual, ...usuario },
  });
}
