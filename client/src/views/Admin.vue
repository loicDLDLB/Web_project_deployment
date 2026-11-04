<template>
  <div class="admin-page">
    <h1>Admin dashboard</h1>
    <p class="subtitle">Registered users</p>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="table-wrapper" v-else>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.id }}</td>
            <td>{{ u.username }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.role }}</td>
            <td>{{ new Date(u.created_at).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import api from '../services/api';

export default {
  name: 'Admin',
  data() {
    return { users: [], error: '' };
  },
  async mounted() {
    try {
      const response = await api.get('/admin/users');
      this.users = response.data;
    } catch (err) {
      const data = err.response && err.response.data;
      this.error = (data && data.error) || 'Could not load users.';
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
  margin: 0 0 6px;
  color: #0f172a;
}

.subtitle {
  margin: 0 0 20px;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

th {
  color: #0f172a;
}

.error {
  color: #dc2626;
}

body.dark-mode .admin-page {
  background-color: #161b22;
  color: #adb1b7;
}
body.dark-mode h1,
body.dark-mode th {
  color: #f8fafc;
}
body.dark-mode th,
body.dark-mode td {
  border-bottom-color: #30363d;
}
body.dark-mode .error {
  color: #f87171;
}
</style>