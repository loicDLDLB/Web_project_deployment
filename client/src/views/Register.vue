<template>
  <div class="login-page">
    <div class="login-card">
      <h1>Create your account</h1>
      <p class="subtitle">Join Level Up to save your scores and compete with others.</p>

      <form @submit.prevent="handleSubmit" novalidate>
        <!-- Username -->
        <div class="field">
          <label for="username">Username</label>
          <input
            id="username"
            type="text"
            v-model.trim="username"
            placeholder="Your username"
            autocomplete="username"
            :class="{ invalid: errors.username }"
          />
          <span v-if="errors.username" class="error">{{ errors.username }}</span>
        </div>

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

        <!-- Password -->
        <div class="field">
          <label for="password">Password</label>
          <div class="password-wrapper">
            <input
              id="password"
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              placeholder="At least 8 characters"
              autocomplete="new-password"
              :class="{ invalid: errors.password }"
            />
            <button type="button" class="toggle" @click="showPassword = !showPassword">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
          <span class="hint">8+ characters, with an uppercase letter, a lowercase letter and a number.</span>
          <span v-if="errors.password" class="error">{{ errors.password }}</span>
        </div>

        <!-- Confirm password -->
        <div class="field">
          <label for="confirm">Confirm password</label>
          <input
            id="confirm"
            :type="showPassword ? 'text' : 'password'"
            v-model="confirm"
            placeholder="Repeat your password"
            autocomplete="new-password"
            :class="{ invalid: errors.confirm }"
          />
          <span v-if="errors.confirm" class="error">{{ errors.confirm }}</span>
        </div>

        <p v-if="serverError" class="server-error">{{ serverError }}</p>

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Sign Up' }}
        </button>
      </form>

      <p class="switch">
        Already have an account?
        <router-link to="/login">Log in</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import api from '../services/api';

export default {
  name: 'Register',
  data() {
    return {
      username: '',
      email: '',
      password: '',
      confirm: '',
      showPassword: false,
      errors: {},
      serverError: '',
      loading: false
    };
  },
  methods: {
    validate() {
      this.errors = {};
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const usernameRegex = /^[A-Za-z0-9_]+$/;

      if (!this.username) {
        this.errors.username = 'Username is required.';
      } else if (this.username.length < 3 || this.username.length > 20) {
        this.errors.username = 'Username must be between 3 and 20 characters.';
      } else if (!usernameRegex.test(this.username)) {
        this.errors.username = 'Only letters, numbers and underscores are allowed.';
      }

      if (!this.email) {
        this.errors.email = 'Email is required.';
      } else if (!emailRegex.test(this.email)) {
        this.errors.email = 'Please enter a valid email address.';
      }

      if (!this.password) {
        this.errors.password = 'Password is required.';
      } else if (this.password.length < 8) {
        this.errors.password = 'Password must be at least 8 characters.';
      } else if (!/[A-Z]/.test(this.password) || !/[a-z]/.test(this.password) || !/[0-9]/.test(this.password)) {
        this.errors.password = 'Password needs an uppercase letter, a lowercase letter and a number.';
      }

      if (this.confirm !== this.password) {
        this.errors.confirm = 'Passwords do not match.';
      }

      return Object.keys(this.errors).length === 0;
    },

    async handleSubmit() {
      this.serverError = '';
      if (!this.validate()) return;

      this.loading = true;
      try {
        await api.post('/auth/register', {
          username: this.username,
          email: this.email,
          password: this.password
        });
        // Compte créé : on envoie le joueur se connecter
        this.$router.push('/login');
      } catch (err) {
        const data = err.response && err.response.data;
        if (data && data.errors) {
          // Erreurs de validation renvoyées par le serveur, champ par champ
          this.errors = data.errors;
        } else if (data && data.error) {
          this.serverError = data.error;
        } else {
          this.serverError = 'Server unreachable. Please try again later.';
        }
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

.hint {
  margin-top: 5px;
  font-size: 0.8rem;
  opacity: 0.8;
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