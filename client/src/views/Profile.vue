<template>
  <div class="profile-container">
    <h1>Hello, {{ auth.user?.username }}</h1>
    <p class="subtitle">Manage your account and view your progress.</p>

    <div class="profile-form">
      <h2>Account Settings</h2>
      <form @submit.prevent="updateProfile">
        <label>Username</label>
        <input type="text" v-model="form.username" required />
        
        <label>Email</label>
        <input type="email" v-model="form.email" required />

        <label>New Password (optional)</label>
        <input type="password" v-model="form.password" placeholder="Leave blank to keep current" />

        <p v-if="msg" :class="msgType">{{ msg }}</p>
        <button type="submit" class="btn" :disabled="saving">Save Changes</button>
      </form>
    </div>

    <!-- SECTION STATISTIQUES STYLISÉE -->
    <div class="stats-section">
      <h2>Your Stats</h2>
      <p v-if="loading">Loading...</p>
      
      <div v-else class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">Games Played</span>
          <span class="stat-value">{{ stats.gamesPlayed }}</span>
        </div>
        
        <div class="stat-card">
          <span class="stat-label">Average Score</span>
          <span class="stat-value">{{ stats.averageScore }} pts</span>
        </div>
        
        <div class="stat-card">
          <span class="stat-label">Best Score</span>
          <span class="stat-value highlight">{{ stats.bestScore }} pts</span>
        </div>
        
        <div class="stat-card">
          <span class="stat-label">Percentile</span>
          <span class="stat-value highlight">Top {{ stats.percentile }}%</span>
        </div>
      </div>
    </div>

    <div class="history-section">
      <details>
        <summary>View last 10 games</summary>
        <p v-if="history.length === 0">No games played yet.</p>
        <table v-else class="history-table">
          <tbody>
            <tr v-for="(game, index) in history" :key="index">
              <td>{{ formatDate(game.played_at) }}</td>
              <td class="score">{{ game.score }} pts</td>
            </tr>
          </tbody>
        </table>
      </details>
    </div>
  </div>
</template>

<script>
import api from '../services/api';
import { auth } from '../store/auth';

export default {
  name: 'Profile',
  data() {
    return {
      auth,
      loading: true,
      saving: false,
      msg: '',
      msgType: '',
      form: {
        username: '',
        email: '',
        password: ''
      },
      stats: {
        gamesPlayed: 0,
        averageScore: 0,
        bestScore: 0,
        percentile: 100
      },
      history: []
    };
  },
  async mounted() {
    if (this.auth.user) {
      this.form.username = this.auth.user.username;
      this.form.email = this.auth.user.email || ''; 
    }
    await this.loadData();
  },
  methods: {
    async loadData() {
      try {
        const [resStats, resHistory] = await Promise.all([
          api.get('/scores/my-stats'),
          api.get('/scores/my-history')
        ]);
        this.stats = resStats.data;
        this.history = resHistory.data;
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        this.loading = false;
      }
    },
    async updateProfile() {
      this.saving = true;
      this.msg = '';
      
      try {
        const res = await api.put('/users/profile', this.form);
        this.msg = 'Profile updated successfully!';
        this.msgType = 'success';
        
        if (res.data.user) {
          this.auth.user.username = res.data.user.username;
          this.auth.user.email = res.data.user.email;
        }
        this.form.password = '';
      } catch (err) {
        this.msg = err.response?.data?.error || 'Failed to update profile.';
        this.msgType = 'error';
      } finally {
        this.saving = false;
      }
    },
    formatDate(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString();
    }
  }
};
</script>

<style scoped>
.profile-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
}

.subtitle {
  opacity: 0.8;
  margin-bottom: 40px;
}

h2 {
  font-size: 1.2rem;
  margin-bottom: 15px;
  text-align: left;
  border-bottom: 1px solid #475569;
  padding-bottom: 5px;
}

.profile-form, .stats-section, .history-section {
  margin-bottom: 40px;
  text-align: left;
}

/* Formulaire */
form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
label {
  font-size: 0.9rem;
  font-weight: bold;
}
input {
  padding: 10px;
  border: 1px solid #475569;
  border-radius: 6px;
  background: transparent;
  color: inherit;
}

.btn {
  margin-top: 10px;
  padding: 10px;
  background-color: #2563eb;
  color: white;
  border: none;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
}
.btn:hover:not(:disabled) {
  opacity: 0.85;
}

.success { color: #4ade80; }
.error { color: #f87171; }

/* Nouveaux encadrés pour les statistiques */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 2 colonnes */
  gap: 15px;
  margin-top: 10px;
}

.stat-card {
  background: rgba(128, 128, 128, 0.08); /* Fond discret adaptatif */
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.stat-label {
  font-size: 0.85rem;
  opacity: 0.8;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: bold;
}

.highlight {
  color: #2563eb;
}
:global(body.dark-mode) .highlight {
  color: #00f0ff;
}

/* Historique */
details {
  background: rgba(128, 128, 128, 0.08);
  padding: 10px 15px;
  border-radius: 8px;
  border: 1px solid #475569;
}
summary {
  cursor: pointer;
  font-weight: bold;
}

.history-table {
  width: 100%;
  margin-top: 15px;
  border-collapse: collapse;
}
.history-table td {
  padding: 8px 0;
  border-bottom: 1px solid #334155;
}
.score {
  text-align: right;
  font-weight: bold;
}
</style>