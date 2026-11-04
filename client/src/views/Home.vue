<template>
  <div>
    <h1>Welcome to LEVEL UP</h1>
    <p>Test your skills with our interactive games.</p>
    <router-link to="/game">Start a game</router-link>

    <p class="status">Server status : {{ serverStatus }}</p>
  </div>
</template>

<script>
import api from '../services/api';

export default {
  name: 'Home',
  data() {
    return { serverStatus: 'checking...' };
  },
  async mounted() {
    try {
      const response = await api.get('/health');
      this.serverStatus = 'OK (' + response.data.users + ' users)';
    } catch (err) {
      this.serverStatus = 'unreachable';
    }
  }
};
</script>

<style scoped>
.status { margin-top: 24px; opacity: 0.7; }
</style>