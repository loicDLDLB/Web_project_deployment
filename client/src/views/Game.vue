<template>
  <div class="game-container">
    <h1>Number Hunter</h1>
    
    <!-- Menu principal -->
    <div v-if="!isPlaying && !showPopup" class="menu">
      <p>Find a number (up to 8 digits) that matches all active rules.</p>
      <p>Every time you succeed, a new rule is added.</p>
      <p>Press <strong>ENTER</strong> to submit. One mistake = Game Over!</p>
      <p>Max score: 10,000 pts. Be fast before points decay!</p>
      <button @click="startGame" class="action-btn">Start Game</button>
    </div>

    <!-- Zone de jeu -->
    <div v-if="isPlaying" class="play-area">
      <div class="stats">
        <h2 :class="{ 'danger-text': timeLeft <= 10 }">⏱ Time: {{ timeLeft }}s</h2>
        <h2>🏆 Score: {{ totalScore }}</h2>
        <h2>⭐ Lvl: {{ currentLevel }} / 10</h2>
      </div>
      
      <p class="reward-hint">Potential points for this level: <strong>+{{ currentPoints }} pts</strong></p>

      <!-- Nouvelle zone interactive avec le curseur visuel -->
      <div class="digit-slots">
        <div 
          v-for="i in 8" 
          :key="i" 
          :class="[
            'slot', 
            { filled: userNumber[i-1] },
            { active: isFocused && (cursorPosition === i - 1 || (cursorPosition === 8 && i === 8)) }
          ]"
          @click="setCursor(i - 1)"
        >
          {{ userNumber[i-1] || '_' }}
        </div>
      </div>

      <!-- L'input caché qui écoute les flèches, les clics et la frappe -->
      <input
        ref="numInput"
        v-model="userNumber"
        @keyup.enter="submitAnswer"
        @input="handleInput"
        @keyup="updateCursor"
        @click="updateCursor"
        @focus="onFocus"
        @blur="isFocused = false"
        type="text"
        maxlength="8"
        class="hidden-input"
        autocomplete="off"
      />
      <p class="hint">Use <strong>arrows ◄ ►</strong> or <strong>click</strong> to edit. Press <strong>Enter ↵</strong> to validate.</p>

      <div class="rules-list">
        <div v-for="(rule, index) in visibleRules" :key="index" class="rule-box">
          <span class="level-badge">Rule {{ index + 1 }}</span>
          {{ rule.text }}
        </div>
      </div>
    </div>

    <!-- Popup de fin de partie -->
    <div v-if="showPopup" class="popup-overlay">
      <div class="popup-content">
        <h2>{{ popupTitle }}</h2>
        <p>{{ popupMessage }}</p>
        <p class="final-score">Final Score: {{ finalScore }} / 10000 pts</p>
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
      timeLeft: 30,
      timer: null,
      userNumber: '',
      currentLevel: 1,
      totalScore: 0,
      
      // Nouvelles variables pour gérer le curseur
      cursorPosition: 0,
      isFocused: false,

      showPopup: false,
      popupTitle: '',
      popupMessage: '',
      finalScore: 0,

      activeRules: [],

      //faire un algo qui avant meme la première question. calcule calcule et donne une combinaisons des parametre de chaque question pour que il y ai au final au moins 100 reponses possibles. et ce chemin est aléatoirement trouvé et n'est pas le meme entre chaque tirage
      
      questionGenerators: [
        () => {
          const min = Math.floor(Math.random() * 5) + 2;
          return { text: `The number must have at least ${min} digits.`, isValid: (v) => v.length >= min };
        },
        () => {
          const parities = [{name: 'even', val: 0}, {name: 'odd', val: 1}];
          const p = parities[Math.floor(Math.random() * 2)];
          return { text: `The sum of all digits must be an ${p.name} number.`, isValid: (v) => v.split('').reduce((a,b) => a + Number(b), 0) % 2 === p.val };
        },
        () => {
          const s = String(Math.floor(Math.random() * 100)).padStart(2, '0');
          return { text: `The sequence '${s}' must appear somewhere in the number.`, isValid: (v) => v.includes(s) };
        },
        () => {
          const m = [2, 3, 4, 7][Math.floor(Math.random() * 2)];
          return { text: `The entire number must be a multiple of ${m}.`, isValid: (v) => v.length > 0 && Number(v) % m === 0 };
        },
        () => {
          const bad = Math.floor(Math.random() * 10); 
          return { text: `The number must not contain the digit '${bad}'.`, isValid: (v) => !v.includes(String(bad)) };
        },
        () => {
          const sum = Math.floor(Math.random() * 11) + 7; 
          return { text: `The sum of the first two digits must equal ${sum}.`, isValid: (v) => v.length >= 2 && Number(v[0]) + Number(v[1]) === sum };
        },
        () => {
          const pos = Math.floor(Math.random() * 2) + 2; 
          const suffix = pos === 2 ? 'nd' : 'rd';
          return { text: `The ${pos}${suffix} digit must be a prime number (2, 3, 5, 7).`, isValid: (v) => v.length >= pos && ['2','3','5','7'].includes(v[pos-1]) };
        },
        () => {
          const mult = [4, 8][Math.floor(Math.random() * 2)];
          return { text: `The last digit must be a multiple of ${mult}.`, isValid: (v) => v.length > 0 && Number(v[v.length-1]) % mult === 0 && Number(v[v.length-1]) !== 0 };
        },
        () => {

          const count = Math.floor(Math.random() * 4) + 1; 
          return { 
          text: `Le nombre doit contenir au minimum ${count} chiffres impairs.`, 
          isValid: (v) => v.length > 0 && v.split('').filter(n => Number(n) % 2 !== 0).length >= count 
          };
        },
        () => {
          return { text: "The first digit must be strictly greater than the last digit.", isValid: (v) => v.length > 1 && Number(v[0]) > Number(v[v.length-1]) };
        }
      ]
    };
  },
  computed: {
    currentPoints() {
      if (this.timeLeft >= 20) return 1000;
      const points = 1000 - ((20 - this.timeLeft) * 50);
      return Math.max(0, points);
    },
    visibleRules() {
      return this.activeRules.slice(0, this.currentLevel);
    }
  },
  methods: {
    startGame() {
      this.activeRules = this.questionGenerators.map(generator => generator());
      this.isPlaying = true;
      this.showPopup = false;
      this.totalScore = 0;
      this.currentLevel = 1;
      this.userNumber = ''; 
      
      this.startLevel();
    },
    startLevel() {
      this.timeLeft = 30; 
      clearInterval(this.timer);
      this.timer = setInterval(this.updateTimer, 1000);
      this.$nextTick(() => { this.focusInput(); });
    },
    
    // --- GESTION DU CURSEUR ET DES ENTREES ---
    focusInput() {
      if (this.$refs.numInput) {
        this.$refs.numInput.focus();
        this.updateCursor();
      }
    },
    onFocus() {
      this.isFocused = true;
      this.updateCursor();
    },
    handleInput() {
      // Force les chiffres uniquement et met à jour la position du curseur après l'ajout/suppression
      this.userNumber = this.userNumber.replace(/[^0-9]/g, '');
      this.$nextTick(() => { this.updateCursor(); });
    },
    updateCursor() {
      const input = this.$refs.numInput;
      if (input) {
        this.cursorPosition = input.selectionStart;
      }
    },
    setCursor(index) {
      this.isFocused = true;
      const input = this.$refs.numInput;
      if (!input) return;
      
      input.focus();
      // Empêche de cliquer plus loin que la longueur actuelle du texte
      const targetIndex = Math.min(index, this.userNumber.length);
      
      // Laisse le navigateur faire son focus avant de déplacer le curseur manuellement
      setTimeout(() => {
        input.setSelectionRange(targetIndex, targetIndex);
        this.updateCursor();
      }, 0);
    },
    // -----------------------------------------

    updateTimer() {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.triggerGameOver(false, "Time's up!", "You took too long to answer.");
      }
    },
    submitAnswer() {
      if (!this.isPlaying || this.userNumber === '') return;

      const allValid = this.visibleRules.every(rule => rule.isValid(this.userNumber));

      if (allValid) {
        this.totalScore += this.currentPoints;
        
        if (this.currentLevel === 10) {
          this.triggerGameOver(true, "Victory!", "Incredible! You matched all 10 rules!");
        } else {
          this.currentLevel++; 
          this.startLevel();   
        }
      } else {
        this.triggerGameOver(false, "Game Over", "Wrong answer! A rule was not met.");
      }
    },
    async triggerGameOver(victory, title, message) {
      clearInterval(this.timer);
      this.isPlaying = false;
      this.finalScore = this.totalScore;
      
      this.popupTitle = title;
      this.popupMessage = message;
      this.showPopup = true;

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
.stats { display: flex; justify-content: space-between; margin-bottom: 10px; }
.danger-text { color: #d9534f; animation: blink 1s infinite; }
.reward-hint { color: #28a745; font-size: 16px; margin-bottom: 25px; }

/* 8 slots d'input */
.digit-slots { display: flex; gap: 15px; justify-content: center; margin-bottom: 10px; cursor: text; }
.slot { 
  width: 50px; 
  height: 60px; 
  font-size: 40px; 
  font-weight: bold; 
  border-bottom: 4px solid #ccc; 
  background-color: transparent;
  display: flex; 
  align-items: center; 
  justify-content: center; 
  transition: all 0.2s ease;
  border-radius: 4px 4px 0 0;
}
.slot.filled { border-bottom-color: #007bff; color: #007bff; }

/* Nouveau style pour le slot actif (le curseur) */
.slot.active {
  background-color: #e6f2ff;
  border-bottom-color: #0056b3;
  transform: scale(1.05); /* Effet de zoom très léger */
}

/* L'input natif devient totalement invisible mais couvre la zone pour attraper les clics/touches si besoin */
.hidden-input { position: absolute; opacity: 0; pointer-events: none; }
.hint { color: #666; font-size: 14px; margin-bottom: 30px; }

/* Liste des règles */
.rules-list { display: flex; flex-direction: column-reverse; gap: 10px; }
.rule-box {
  padding: 15px;
  border-radius: 8px;
  text-align: left;
  font-weight: bold;
  background-color: #f8f9fa;
  color: #0f172a;
  border-left: 5px solid #007bff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
}
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
@keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

/* ---------- Mode sombre ---------- */
body.dark-mode .slot { border-bottom-color: #30363d; color: #f8fafc; }
body.dark-mode .slot.filled { border-bottom-color: #00f0ff; color: #00f0ff; }

/* Curseur actif en mode sombre */
body.dark-mode .slot.active {
  background-color: #1f2937;
  border-bottom-color: #00c8d6;
}

body.dark-mode .hint { color: #adb1b7; }
body.dark-mode .reward-hint { color: #00f0ff; }

body.dark-mode .rule-box {
  background-color: #161b22;
  color: #f8fafc;
  border-left-color: #00f0ff;
}
body.dark-mode .level-badge { background: #00f0ff; color: #0f111a; }

body.dark-mode .action-btn { background: #00f0ff; color: #0f111a; }
body.dark-mode .action-btn:hover { background: #00c8d6; }

body.dark-mode .popup-content { background: #161b22; color: #adb1b7; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6); }
body.dark-mode .popup-content h2 { color: #f8fafc; }
body.dark-mode .final-score { color: #00f0ff; }
</style>