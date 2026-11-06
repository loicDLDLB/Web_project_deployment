<template>
  <div class="home-container">
    <h1>Welcome to LEVEL UP</h1>
    <p>Test your skills with our interactive games.</p>
    <router-link to="/game" class="btn">Start a game</router-link>

    <!-- ZONE LEADERBOARD -->
    <div class="leaderboard-box">
      <h2 class="leaderboard-title">🏆 Leaderboard</h2>
      
      <div v-if="!auth.token" class="auth-message">
        <p>Log in to see the ranking and your stats!</p>
      </div>

      <p v-else-if="loading" class="status">Loading stats...</p>
      
      <div v-else class="stats-grid">
        <!-- COLONNE GAUCHE : TOP 5 -->
        <div class="top-players">
          <p class="intro-text">Here are the top 5 champions of LEVEL UP:</p>
          
          <table class="top-table">
            <tbody>
              <tr 
                v-for="(player, index) in top5" 
                :key="index"
                :class="{ 'first-place': index === 0 }"
              >
                <td class="rank">#{{ index + 1 }}</td>
                <td class="username">{{ player.username }}</td>
                <td class="score">{{ player.bestScore }} pts</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- COLONNE DROITE : MES STATS -->
        <div class="my-stats" v-if="myStats">
          <p class="stats-label">Your best score:</p>
          <p class="best-score">{{ myStats.bestScore }} pts</p>
          
          <p class="highlight">You beat <strong>{{ myStats.percentile }}%</strong> of all players!</p>
          
          <!-- La barre de complétion dynamique -->
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: myStats.percentile + '%' }"
            ></div>
          </div>
        </div>
        
        <div class="my-stats" v-else>
          <p>Play your first game to get ranked!</p>
        </div>
      </div>
    </div>

    <p class="status server-status">Server status : {{ serverStatus }}</p>
  </div>
</template>

<script>
import api from '../services/api';
import { auth } from '../store/auth';

export default {
  name: 'Home',
  data() {
    return { 
      serverStatus: 'checking...',
      auth, 
      loading: false,
      top5: [],
      myStats: null
    };
  },
  async mounted() {
    try {
      const response = await api.get('/health');
      this.serverStatus = 'OK';
    } catch (err) {
      this.serverStatus = 'unreachable';
    }

    if (this.auth.token) {
      this.loading = true;
      try {
        const res = await api.get('/scores/leaderboard');
        this.top5 = res.data.top5;
        this.myStats = res.data.myStats;
      } catch (err) {
        console.error('Erreur API Leaderboard:', err);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.home-container {
  max-width: 800px; 
  margin: 0 auto;
  text-align: center;
  padding-top: 20px;
}

.btn {
  display: inline-block;
  margin: 20px 0;
  padding: 10px 20px;
  background-color: #2563eb; 
  color: white;
  text-decoration: none;
  font-weight: bold;
  border-radius: 6px;
  transition: opacity 0.2s ease;
}

.btn:hover {
  opacity: 0.85;
}

.leaderboard-box {
  margin-top: 40px;
}

.leaderboard-title {
  margin-bottom: 30px;
}

.auth-message {
  opacity: 0.8;
}

/* DISPOSITION CÔTE À CÔTE */
.stats-grid {
  display: flex;
  flex-wrap: wrap; 
  gap: 40px;
  justify-content: center;
  align-items: center;
  text-align: left;
}

/* COLONNE GAUCHE */
.top-players {
  flex: 1;
  min-width: 280px;
}

.intro-text {
  font-size: 0.95rem;
  opacity: 0.8;
  margin-bottom: 12px;
}

.top-table {
  width: 100%;
  border-collapse: collapse;
}

.top-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #334155; /* Ligne de séparation */
}

.top-table tr:last-child td {
  border-bottom: none;
}

.rank {
  color: #94a3b8;
  font-size: 0.9rem;
  width: 30px;
}

.username {
  font-weight: 600;
}

.score {
  text-align: right;
  opacity: 0.9;
}

/* premier joueur */
.first-place .rank,
.first-place .username,
.first-place .score {
  color: #8b5cf6; /* Violet pour distinguer le 1er */
  font-weight: 800;
  font-size: 1.15rem;
}

/* COLONNE DROITE */
.my-stats {
  flex: 1;
  min-width: 250px;
  padding: 10px 10px 10px 50px; /* Augmentation du padding gauche (50px) pour aérer */
  border-left: 1px solid #475569; 
}

@media (max-width: 600px) {
  .my-stats {
    border-left: none;
    border-top: 1px solid #475569;
    padding: 30px 10px 10px 10px;
  }
}

.stats-label {
  margin: 0 0 5px 0;
  font-size: 1rem;
  opacity: 0.8;
}

.best-score {
  margin: 0 0 20px 0;
  font-size: 2.8rem;
  font-weight: bold;
  color: #2563eb;
}

.highlight {
  margin: 0;
  color: #2563eb;
  font-weight: bold;
  font-size: 1.1rem;
}

/* BARRE DE PROGRESSION */
.progress-bar {
  margin-top: 15px;
  width: 100%;
  height: 12px;
  background-color: #334155; 
  border-radius: 8px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #2563eb; 
  border-radius: 8px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); 
}

.status { 
  opacity: 0.7; 
  font-size: 0.85rem;
}

.server-status {
  margin-top: 60px;
}
</style>