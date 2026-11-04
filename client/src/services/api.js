import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

// Ajoute le jeton à chaque requête si le joueur est connecté
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

export default api;