import { reactive } from 'vue';

// Lit l'utilisateur sauvegardé (null si absent ou illisible)
function readUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch (e) {
    return null;
  }
}

// État partagé : toute modification met à jour automatiquement les composants
export const auth = reactive({
  token: localStorage.getItem('token'),
  user: readUser()
});

export function setAuth(token, user) {
  auth.token = token;
  auth.user = user;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
  auth.token = null;
  auth.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function updateUser(user) {
  auth.user = user;
  localStorage.setItem('user', JSON.stringify(user));
}