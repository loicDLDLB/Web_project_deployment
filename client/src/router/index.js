import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import Game from '../views/Game.vue';
import Profile from '../views/Profile.vue';
import Admin from '../views/Admin.vue';

import { auth } from '../store/auth';

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/login', name: 'login', component: Login, meta: { guestOnly: true }},
  { path: '/register', name: 'register', component: Register, meta: { guestOnly: true } },
  { path: '/game', name: 'game', component: Game, meta: { requiresAuth: true }  },
  { path: '/profile', name: 'profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/admin', name: 'admin', component: Admin, meta: { requiresAdmin: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Garde de navigation : s'exécute avant chaque changement de page
router.beforeEach((to) => {
  const loggedIn = !!auth.token && !!auth.user;

  // Page réservée aux connectés
  if (to.meta.requiresAuth && !loggedIn) {
    return '/login';
  }
  // Page réservée aux admins
  if (to.meta.requiresAdmin && (!auth.user || auth.user.role !== 'admin')) {
    return '/';
  }
  // Pages login/register inutiles quand on est déjà connecté
  if (to.meta.guestOnly && loggedIn) {
    return '/';
  }
});

export default router;