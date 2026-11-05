<template>
  <div class="game-container">
    <h1>Number Hunter</h1>
    
    <!-- Menu principal -->
    <div v-if="!isPlaying && !showPopup" class="menu">
      <p>Find the 8-digit number that matches all conditions.</p>
      <p>Press <strong>ENTER</strong> to submit. One mistake = Game Over!</p>
      <p>+30s for every level cleared.</p>
      <button @click="startGame" class="action-btn">Start Game</button>
    </div>

    <!-- Zone de jeu -->
    <div v-if="isPlaying" class="play-area">
      <div class="stats">
        <h2 :class="{ 'danger-text': timeLeft <= 10 }">⏱ Time: {{ timeLeft }}s</h2>
        <h2>⭐ Level: {{ currentLevel }} / {{ rules.length }}</h2>
      </div>

      <div class="digit-slots" @click="focusInput">
        <div 
          v-for="i in 8" 
          :key="i" 
          :class="['slot', { filled: userNumber[i-1] }]"
        >
          {{ userNumber[i-1] || '_' }}
        </div>
      </div>

      <input
        ref="numInput"
        v-model="userNumber"
        @keyup.enter="submitAnswer"
        @input="filterInput"
        type="text"
        maxlength="8"
        class="hidden-input"
        autocomplete="off"
      />
      <p class="hint">Press <strong>Enter ↵</strong> to validate.</p>

      <div class="rules-list">
        <div v-for="(rule, index) in visibleRules" :key="index" class="rule-box">
          <span class="level-badge">Lvl {{ index + 1 }}</span>
          {{ rule.text }}
        </div>
      </div>
    </div>

    <!-- Popup de fin de partie -->
    <div v-if="showPopup" class="popup-overlay">
      <div class="popup-content">
        <h2>{{ popupTitle }}</h2>
        <p>{{ popupMessage }}</p>
        <p class="final-score">Final Score: Level {{ finalScore }}</p>
        <button @click="closePopup" class="action-btn">Back to Menu</button>
      </div>
    </div>

  </div>
</template>

<script>
import api from '../services/api';

export default {
  data() {
    return {
      isPlaying: false,
      timeLeft: 60,
      timer: null,
      userNumber: '',
      currentLevel: 1,
      
      // Variables pour la popup
      showPopup: false,
      popupTitle: '',
      popupMessage: '',
      finalScore: 0,

      rules: [
        { text: "The number must be exactly 8 digits long.", isValid: (val) => val.length === 8 },
        { text: "The sum of all digits must be an even number.", isValid: (val) => val.split('').reduce((a, b) => a + parseInt(b), 0) % 2 === 0 },
        { text: "The entire number must be a multiple of 3.", isValid: (val) => val.split('').reduce((a, b) => a + parseInt(b), 0) % 3 === 0 },
        { text: "The sequence '42' must appear somewhere in the number.", isValid: (val) => val.includes('42') },
        { text: "The 3rd digit must be a prime number (2, 3, 5, or 7).", isValid: (val) => ['2', '3', '5', '7'].includes(val[2]) },
        { text: "The last digit must be a multiple of 4 (4 or 8).", isValid: (val) => ['4', '8'].includes(val[7]) },
        { text: "The number must contain exactly four odd digits.", isValid: (val) => val.split('').filter(n => parseInt(n) % 2 !== 0).length === 4 },
        { text: "The number must not contain any zeros (0).", isValid: (val) => !val.includes('0') },
        { text: "The sum of the first three digits must equal 15.", isValid: (val) => parseInt(val[0]) + parseInt(val[1]) + parseInt(val[2]) === 15 },
        { text: "The first digit must be strictly greater than the last digit.", isValid: (val) => parseInt(val[0]) > parseInt(val[7]) }
      ]
    };
  },
  computed: {
    visibleRules() {
      return this.rules.slice(0, this.currentLevel);
    }
  },
  methods: {
    startGame() {
      this.isPlaying = true;
      this.showPopup = false;
      this.timeLeft = 60;
      this.userNumber = '';
      this.currentLevel = 1;
      this.timer = setInterval(this.updateTimer, 1000);
      
      this.$nextTick(() => { this.focusInput(); });
    },
    focusInput() {
      if (this.$refs.numInput) this.$refs.numInput.focus();
    },
    filterInput() {
      this.userNumber = this.userNumber.replace(/[^0-9]/g, '');
    },
    updateTimer() {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.triggerGameOver(false, "Time's up!", "You ran out of time.");
      }
    },
    submitAnswer() {
      if (!this.isPlaying) return;

      const allValid = this.visibleRules.every(rule => rule.isValid(this.userNumber));

      if (allValid) {
        if (this.currentLevel === this.rules.length) {
          this.triggerGameOver(true, "Victory!", "Incredible! You beat all 10 rules!");
        } else {
          this.currentLevel++;
          this.timeLeft += 30;
          this.userNumber = '';
        }
      } else {
        this.triggerGameOver(false, "Game Over", "Wrong answer! A rule was not met.");
      }
    },
    async triggerGameOver(victory, title, message) {
      clearInterval(this.timer);
      this.isPlaying = false;
      this.finalScore = victory ? this.currentLevel : this.currentLevel - 1;
      
      // Affichage de la popup HTML (remplace le alert)
      this.popupTitle = title;
      this.popupMessage = message;
      this.showPopup = true;

      // Sauvegarde du score en base de données
      try {
        await api.post('/scores', { score: this.finalScore });
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du score :', error);
    }
    },
    closePopup() {
      this.showPopup = false;
    }
  },
  beforeDestroy() {
    clearInterval(this.timer);
  }
};
</script>

<style scoped>
.game-container { max-width: 700px; margin: 0 auto; text-align: center; font-family: 'Courier New', Courier, monospace; }
.stats { display: flex; justify-content: space-between; margin-bottom: 30px; }
.danger-text { color: #d9534f; animation: blink 1s infinite; }

/* 8 slots d'input */
.digit-slots { display: flex; gap: 15px; justify-content: center; margin-bottom: 10px; cursor: text; }
.slot { width: 50px; height: 60px; font-size: 40px; font-weight: bold; border-bottom: 4px solid #ccc; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
.slot.filled { border-bottom-color: #007bff; color: #007bff; }
.hidden-input { position: absolute; opacity: 0; pointer-events: none; }
.hint { color: #666; font-size: 14px; margin-bottom: 30px; }

/* Liste des règles */
.rules-list { display: flex; flex-direction: column; gap: 10px; }
.rule-box { padding: 15px; border-radius: 8px; text-align: left; font-weight: bold; background-color: #f8f9fa; border-left: 5px solid #007bff; }
.level-badge { background: #007bff; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; margin-right: 10px; }

/* Boutons */
.action-btn { padding: 12px 25px; font-size: 18px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 8px; }
.action-btn:hover { background: #0056b3; }

/* Popup personnalisée */
.popup-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.popup-content { background: white; padding: 40px; border-radius: 12px; text-align: center; max-width: 400px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
.popup-content h2 { margin-top: 0; color: #333; }
.final-score { font-size: 24px; font-weight: bold; color: #007bff; margin: 20px 0; }

@keyframes blink { 50% { opacity: 0.5; } }


.rule-box { 
  padding: 15px; 
  border-radius: 8px; 
  text-align: left; 
  font-weight: bold; 
  background-color: #f8f9fa !important; 
  color: #0f172a !important; 
  border-left: 5px solid #007bff; 
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

@media (prefers-color-scheme: dark) {
  .slot { border-bottom-color: #555; color: #eee; }
  .hint { color: #aaa; }
  .popup-content { background: #222; color: #eee; }
  .popup-content h2 { color: #eee; }
}
</style>