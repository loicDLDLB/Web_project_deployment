<template>
  <div class="admin-page">
    <h1>Admin dashboard</h1>

    <!-- Statistiques -->
    <section v-if="stats" class="stats">
      <div class="stat-card">
        <span class="stat-value">{{ stats.totalUsers - stats.totalAdmins }}</span>
        <span class="stat-label">Players</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.totalAdmins }}</span>
        <span class="stat-label">Admins</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.totalGames }}</span>
        <span class="stat-label">Games played</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.bestScore }}</span>
        <span class="stat-label">Best score</span>
        <span v-if="stats.bestPlayer" class="stat-sub">by {{ stats.bestPlayer }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.avgScore }}</span>
        <span class="stat-label">Average score</span>
      </div>
    </section>

    <h2>Registered users</h2>

    <!-- Message de retour après une action -->
    <p v-if="feedback.text" :class="['feedback', feedback.type]">{{ feedback.text }}</p>

    <p v-if="error" class="error">{{ error }}</p>

    <template v-else>
      <!-- Recherche et filtre -->
      <div class="toolbar">
        <input
          v-model="search"
          type="text"
          placeholder="Search by username or email..."
          class="search-input"
        />
        <select v-model="roleFilter" class="role-select">
          <option value="all">All roles</option>
          <option value="player">Players</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      <p class="count">Showing {{ filteredUsers.length }} of {{ users.length }} users</p>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filteredUsers" :key="u.id">
              <td>{{ u.id }}</td>
              <td>
                {{ u.username }}
                <span v-if="isMe(u)" class="me">(you)</span>
              </td>
              <td>{{ u.email }}</td>
              <td><span :class="['badge', u.role]">{{ u.role }}</span></td>
              <td>{{ new Date(u.created_at).toLocaleDateString() }}</td>
              <td class="actions">
                <template v-if="u.role === 'player'">
                  <button class="btn promote" @click="promote(u)">Make admin</button>
                  <button class="btn delete" @click="remove(u)">Delete</button>
                </template>
                <span v-else class="protected">Protected</span>
              </td>
            </tr>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="6" class="empty">No users match your search.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Fenêtre de confirmation personnalisée -->
    <div v-if="modal.open" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content" role="dialog" aria-modal="true">
        <h3>{{ modal.title }}</h3>
        <p>{{ modal.message }}</p>
        <div class="modal-buttons">
          <button class="btn cancel" :disabled="busy" @click="closeModal">Cancel</button>
          <button
            :class="['btn', modal.danger ? 'delete' : 'promote']"
            :disabled="busy"
            @click="confirmModal"
          >
            {{ busy ? 'Please wait...' : modal.confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api';
import { auth } from '../store/auth';

export default {
  name: 'Admin',
  data() {
    return {
      users: [],
      stats: null,
      error: '',
      feedback: { type: '', text: '' },
      search: '',
      roleFilter: 'all',
      busy: false,
      modal: {
        open: false,
        title: '',
        message: '',
        confirmLabel: 'Confirm',
        danger: false,
        action: null
      }
    };
  },
  computed: {
    // Liste filtrée par le texte saisi et par le rôle choisi
    filteredUsers() {
      const q = this.search.trim().toLowerCase();
      return this.users.filter((u) => {
        const matchesRole = this.roleFilter === 'all' || u.role === this.roleFilter;
        const matchesText =
          !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        return matchesRole && matchesText;
      });
    }
  },
  mounted() {
    this.refresh();
    window.addEventListener('keydown', this.onKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeydown);
  },
  methods: {
    async refresh() {
      await Promise.all([this.fetchUsers(), this.fetchStats()]);
    },

    async fetchUsers() {
      try {
        const response = await api.get('/admin/users');
        this.users = response.data;
        this.error = '';
      } catch (err) {
        const data = err.response && err.response.data;
        this.error = (data && data.error) || 'Could not load users.';
      }
    },

    async fetchStats() {
      try {
        const response = await api.get('/admin/stats');
        this.stats = response.data;
      } catch (err) {
        this.stats = null;
      }
    },

    isMe(user) {
      return !!auth.user && auth.user.id === user.id;
    },

    showFeedback(type, text) {
      this.feedback = { type, text };
    },

    // ----- Fenêtre de confirmation -----
    openModal(options) {
      this.modal = { open: true, ...options };
    },
    closeModal() {
      if (this.busy) return;
      this.modal.open = false;
      this.modal.action = null;
    },
    onKeydown(e) {
      if (e.key === 'Escape' && this.modal.open) this.closeModal();
    },
    async confirmModal() {
      if (!this.modal.action || this.busy) return;
      this.busy = true;
      try {
        const message = await this.modal.action();
        this.showFeedback('success', message);
        await this.refresh();
      } catch (err) {
        const data = err.response && err.response.data;
        this.showFeedback('error', (data && data.error) || 'Action failed.');
      } finally {
        this.busy = false;
        this.closeModal();
      }
    },

    // ----- Actions -----
    promote(user) {
      this.openModal({
        title: 'Make admin',
        message: `Make "${user.username}" an admin? This cannot be undone from the dashboard.`,
        confirmLabel: 'Make admin',
        danger: false,
        action: async () => {
          const response = await api.put(`/admin/users/${user.id}/promote`);
          return response.data.message;
        }
      });
    },

    remove(user) {
      this.openModal({
        title: 'Delete user',
        message: `Delete "${user.username}" and all of their scores? This cannot be undone.`,
        confirmLabel: 'Delete',
        danger: true,
        action: async () => {
          const response = await api.delete(`/admin/users/${user.id}`);
          return response.data.message;
        }
      });
    }
  }
};
</script>

<style scoped>
.admin-page {
  background-color: #ffffff;
  border-radius: 10px;
  padding: 28px;
  color: #475569;
}

h1 {
  margin: 0 0 20px;
  color: #0f172a;
}

h2 {
  margin: 28px 0 14px;
  color: #0f172a;
  font-size: 1.2rem;
}

.error {
  color: #dc2626;
}

/* ----- Statistiques ----- */
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}
.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 10px;
  border-radius: 10px;
  background-color: #f1f5f9;
  text-align: center;
}
.stat-value {
  font-size: 1.9rem;
  font-weight: bold;
  color: #2563eb;
}
.stat-label {
  font-size: 0.85rem;
  font-weight: 600;
}
.stat-sub {
  font-size: 0.75rem;
  opacity: 0.7;
}

/* ----- Recherche et filtre ----- */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.search-input {
  flex: 1;
  min-width: 200px;
}
.search-input,
.role-select {
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background-color: #f1f5f9;
  color: #0f172a;
  font-size: 0.95rem;
  outline: none;
}
.search-input:focus,
.role-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}
.count {
  margin: 10px 0;
  font-size: 0.85rem;
  opacity: 0.8;
}

/* ----- Tableau ----- */
.table-wrapper {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}
th {
  color: #0f172a;
}
.empty {
  text-align: center;
  opacity: 0.7;
}

/* Message de retour */
.feedback {
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 0.95rem;
}
.feedback.success {
  background-color: rgba(22, 163, 74, 0.12);
  color: #15803d;
}
.feedback.error {
  background-color: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

/* Badges de rôle */
.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}
.badge.player {
  background-color: #e2e8f0;
  color: #475569;
}
.badge.admin {
  background-color: rgba(37, 99, 235, 0.15);
  color: #2563eb;
}
.me {
  margin-left: 4px;
  font-size: 0.8rem;
  opacity: 0.7;
}

/* Boutons */
.actions {
  white-space: nowrap;
}
.btn {
  padding: 6px 12px;
  margin-right: 6px;
  border: none;
  border-radius: 6px;
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
}
.btn:hover {
  opacity: 0.85;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn.promote {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}
.btn.delete {
  background-color: #dc2626;
}
.btn.cancel {
  background-color: #94a3b8;
}
.protected {
  font-size: 0.85rem;
  opacity: 0.6;
}

/* ----- Fenêtre de confirmation ----- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
}
.modal-content {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  padding: 28px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}
.modal-content h3 {
  margin: 0 0 10px;
  color: #0f172a;
}
.modal-content p {
  margin: 0 0 22px;
}
.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.modal-buttons .btn {
  margin-right: 0;
  padding: 9px 16px;
}

/* ---------- Mode sombre ---------- */
body.dark-mode .admin-page {
  background-color: #161b22;
  color: #adb1b7;
}
body.dark-mode h1,
body.dark-mode h2,
body.dark-mode th {
  color: #f8fafc;
}
body.dark-mode th,
body.dark-mode td {
  border-bottom-color: #30363d;
}
body.dark-mode .error,
body.dark-mode .feedback.error {
  color: #f87171;
}
body.dark-mode .feedback.success {
  color: #4ade80;
}
body.dark-mode .stat-card {
  background-color: #0f111a;
}
body.dark-mode .stat-value {
  color: #00f0ff;
}
body.dark-mode .search-input,
body.dark-mode .role-select {
  background-color: #0f111a;
  border-color: #30363d;
  color: #f8fafc;
}
body.dark-mode .search-input:focus,
body.dark-mode .role-select:focus {
  border-color: #00f0ff;
  box-shadow: 0 0 0 3px rgba(0, 240, 255, 0.2);
}
body.dark-mode .badge.player {
  background-color: #30363d;
  color: #adb1b7;
}
body.dark-mode .badge.admin {
  background-color: rgba(0, 240, 255, 0.15);
  color: #00f0ff;
}
body.dark-mode .btn.promote {
  background: #00f0ff;
  color: #0f111a;
}
body.dark-mode .modal-content {
  background-color: #161b22;
  color: #adb1b7;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
}
body.dark-mode .modal-content h3 {
  color: #f8fafc;
}

/* ---------- Responsive ---------- */
@media (max-width: 600px) {
  .admin-page {
    padding: 18px;
  }
}
</style>