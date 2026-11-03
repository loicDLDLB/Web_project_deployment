<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-about">
        <h3>About Us</h3>
        <p>
          We are two passionate collaborators who created this gaming website out of
          our shared love for video games. Our goal is to build a place where players
          can discover new titles, share their enthusiasm, and enjoy a smooth,
          immersive experience. Whether you are a casual player or a hardcore gamer,
          we hope you'll feel right at home here.
        </p>
      </div>

      <div class="footer-columns">
        <h3>Games</h3>
        <ul>
          <li v-for="game in games" :key="game.path">
            <router-link :to="game.path">{{ game.name }}</router-link>
          </li>
        </ul>
      </div>
    </div>

    <div class="footer-contact">
      <p>
        © 2026 Level Up |
        <a href="mailto:info@levelup.com">Contact Us</a> |
        <a href="#">Privacy Policy</a> |
        <a href="#">Terms of Service</a> |
        <a href="#">Cookie Policy</a> |
        <a href="#">FAQs</a>
      </p>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'AppFooter',
  data() {
    return {
      games: [
        { name: 'Quiz', path: '/quiz' }
        // Ajoute ici les prochains jeux : { name: 'Memory', path: '/memory' }
      ]
    };
  }
};
</script>

<style scoped>
.footer {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  padding: 30px;
  border-radius: 10px;
  margin-top: 30px;
  color: #475569;
}

.footer-container {
  font-weight: 600;
  font-size: 17px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  padding: 30px 100px;
  text-align: center;
}

.footer-about {
  grid-column: span 2;
}

.footer-columns {
  grid-column: 3;
}

.footer-columns ul {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 30px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.footer-columns a,
.footer-contact a {
  text-decoration: none;
  color: #475569;
}

.footer-columns a:hover,
.footer-contact a:hover {
  color: #2563eb;
  cursor: pointer;
}

.footer-contact {
  text-align: center;
}

/* Mode sombre */
body.dark-mode .footer {
  background-color: #161b22;
  color: #adb1b7;
}
body.dark-mode .footer-columns a,
body.dark-mode .footer-contact a {
  color: #adb1b7;
}
body.dark-mode .footer-columns a:hover,
body.dark-mode .footer-contact a:hover {
  color: #00f0ff;
}

/* Responsive : tablette et téléphone */
@media (max-width: 768px) {
  .footer-container {
    grid-template-columns: 1fr;
    padding: 10px;
  }
  .footer-about,
  .footer-columns {
    grid-column: auto;
  }
}
</style>