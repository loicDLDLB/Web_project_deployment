<template>
  <div class="layout">
    <NavBar />
    <main class="content">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>

<script>
import NavBar from './components/NavBar.vue';
import AppFooter from './components/Footer.vue';

export default {
  name: 'App',
  components: { NavBar, AppFooter }
};
</script>

<style>
body {
  margin: 0;
  background-color: #c5ebf9;
  color: #0f172a;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  transition: background-color 0.3s, color 0.3s;
}

body.dark-mode {
  background-color: #0f111a;
  color: #f8fafc;
}

* {
  box-sizing: border-box;
}

.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 12px;
}

.content {
  flex: 1;
}
</style>