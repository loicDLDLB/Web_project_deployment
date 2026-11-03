<template>
  <header>
    <nav class="navbar">
      <router-link to="/" class="logo-link">
        <img src="@/assets/level-up-logo-grand.svg" alt="Level Up logo" />
      </router-link>

      <ul class="nav-links">
        <li>
          <a href="#" @click.prevent="toggleTheme">
            {{ isDark ? 'Light Mode' : 'Dark Mode' }}
          </a>
        </li>
        <li>
          <router-link to="/login" class="btn-login">Log In</router-link>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script>
export default {
  name: 'NavBar',
  data() {
    return { isDark: false };
  },
  mounted() {
    // Au chargement, on vérifie si le mode sombre était actif
    this.isDark = localStorage.getItem('theme') === 'dark';
    document.body.classList.toggle('dark-mode', this.isDark);
  },
  methods: {
    toggleTheme() {
      this.isDark = !this.isDark;
      document.body.classList.toggle('dark-mode', this.isDark);
      localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
    }
  }
};
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
}

.navbar img {
  height: 75px;
  width: auto;
  max-width: 100%;
  display: block;
  border-radius: 10px;
}

.nav-links {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 60px;
  margin: 0;
  padding: 0 40px 0 0;
}

.nav-links a {
  color: #475569;
  text-decoration: none;
  font-weight: 600;
  font-size: 17px;
  transition: color 0.2s ease;
}

.nav-links a:hover {
  color: #2563eb;
  cursor: pointer;
}

.nav-links .btn-login {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #fff;
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
}

.nav-links .btn-login:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  color: #fff;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
}

/* Mode sombre */
body.dark-mode .navbar {
  background-color: #161b22;
}
body.dark-mode .nav-links a:not(.btn-login) {
  color: #adb1b7;
}
body.dark-mode .nav-links a:not(.btn-login):hover {
  color: #00f0ff;
}

/* Responsive : téléphone */
@media (max-width: 600px) {
  .navbar {
    flex-direction: column;
    gap: 16px;
  }
  .navbar img {
    height: 55px;
  }
  .nav-links {
    gap: 24px;
    padding-right: 0;
  }
}
</style>