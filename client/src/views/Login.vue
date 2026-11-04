<template>
  <div class="login-page">
    <div class="login-card">
      <h1>Welcome back</h1>
      <p class="subtitle">Log in to save your scores and track your progress.</p>

      <form @submit.prevent="handleSubmit" novalidate>
        <!-- Email -->
        <div class="field">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            v-model.trim="email"
            placeholder="you@example.com"
            autocomplete="email"
            :class="{ invalid: errors.email }"
          />
          <span v-if="errors.email" class="error">{{ errors.email }}</span>
        </div>

        <!-- Mot de passe -->
        <div class="field">
          <label for="password">Password</label>
          <div class="password-wrapper">
            <input
              id="password"
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              placeholder="Your password"
              autocomplete="current-password"
              :class="{ invalid: errors.password }"
            />
            <button type="button" class="toggle" @click="showPassword = !showPassword">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
          <span v-if="errors.password" class="error">{{ errors.password }}</span>
        </div>

        <!-- Erreur renvoyée par le serveur (ex : mauvais identifiants) -->
        <p v-if="serverError" class="server-error">{{ serverError }}</p>

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Log In' }}
        </button>
      </form>

      <p class="switch">
        Don't have an account?
        <router-link to="/register">Sign up</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import api from '../services/api';
import { setAuth } from '../store/auth';

export default {
  name: 'Login',
  data() {
    return {
      email: '',
      password: '',
      showPassword: false,
      errors: {},
      serverError: '',
      loading: false
    };
  },
  methods: {
    // Validation côté client
    validate() {
      this.errors = {};
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!this.email) {
        this.errors.email = 'Email is required.';
      } else if (!emailRegex.test(this.email)) {
        this.errors.email = 'Please enter a valid email address.';
      }

      if (!this.password) {
        this.errors.password = 'Password is required.';
      }

      return Object.keys(this.errors).length === 0;
    },

    async handleSubmit() {
      this.serverError = '';
      if (!this.validate()) return;

            this.loading = true;
      try {
        const response = await api.post('/auth/login', {
          email: this.email,
          password: this.password
        });

        setAuth(response.data.token, response.data.user);

        this.$router.push('/');
      } catch (err) {
        const data = err.response && err.response.data;
        this.serverError = (data && data.error) || 'Server unreachable. Please try again later.';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background-color: #ffffff;
  border-radius: 10px;
  padding: 36px 32px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  color: #475569;
}

.login-card h1 {
  margin: 0 0 8px;
  text-align: center;
  color: #0f172a;
  font-size: 1.7rem;
}

.subtitle {
  margin: 0 0 28px;
  text-align: center;
  font-size: 0.95rem;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 18px;
}

label {
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 0.95rem;
}

input {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background-color: #f1f5f9;
  color: #0f172a;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}

input.invalid {
  border-color: #dc2626;
}

.password-wrapper {
  position: relative;
}

.password-wrapper input {
  padding-right: 64px;
}

.toggle {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
}

.error {
  margin-top: 5px;
  color: #dc2626;
  font-size: 0.85rem;
}

.server-error {
  margin: 0 0 14px;
  padding: 10px;
  border-radius: 6px;
  background-color: rgba(220, 38, 38, 0.1);
  color: #dc2626;
  text-align: center;
  font-size: 0.9rem;
}

.btn-submit {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #ffffff;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: box-shadow 0.2s ease, opacity 0.2s ease;
}

.btn-submit:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch {
  margin: 22px 0 0;
  text-align: center;
  font-size: 0.95rem;
}

.switch a {
  color: #2563eb;
  font-weight: 600;
  text-decoration: none;
}

.switch a:hover {
  text-decoration: underline;
}

/* ---------- Mode sombre ---------- */
body.dark-mode .login-card {
  background-color: #161b22;
  color: #adb1b7;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

body.dark-mode .login-card h1 {
  color: #f8fafc;
}

body.dark-mode input {
  background-color: #0f111a;
  border-color: #30363d;
  color: #f8fafc;
}

body.dark-mode input:focus {
  border-color: #00f0ff;
  box-shadow: 0 0 0 3px rgba(0, 240, 255, 0.2);
}

body.dark-mode input.invalid {
  border-color: #f87171;
}

body.dark-mode .toggle,
body.dark-mode .switch a {
  color: #00f0ff;
}

body.dark-mode .error,
body.dark-mode .server-error {
  color: #f87171;
}

/* ---------- Responsive ---------- */
@media (max-width: 480px) {
  .login-card {
    padding: 28px 20px;
  }
}
</style>