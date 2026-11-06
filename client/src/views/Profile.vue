<template>
  <div class="profile-page">
    <div class="profile-card">
      <h1>Hello, {{ username }}</h1>
      <p class="subtitle">Welcome to your profile.</p>
    </div>
  </div>
</template>

<script>
import { auth } from '../store/auth';

export default {
  name: 'Profile',
  computed: {
    username() {
      return auth.user ? auth.user.username : '';
    }
  }
};
</script>

<style scoped>
.profile-page {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.profile-card {
  width: 100%;
  max-width: 600px;
  background-color: #ffffff;
  border-radius: 10px;
  padding: 36px 32px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  color: #475569;
  text-align: center;
}

.profile-card h1 {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 1.8rem;
}

.subtitle {
  margin: 0;
}

/* Mode sombre */
body.dark-mode .profile-card {
  background-color: #161b22;
  color: #adb1b7;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

body.dark-mode .profile-card h1 {
  color: #f8fafc;
}
</style>