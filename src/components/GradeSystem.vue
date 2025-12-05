<template>
  <div class="grade-system-container">
    <div class="grade-display" :class="gradeColorClass">
      <div class="grade-label">Nota Actual</div>
      <div class="grade-value" :class="{ 'grade-animation': notaAnimando }">
        {{ notaActual.toFixed(1) }}
      </div>
      <div class="grade-status">{{ gradeStatusText }}</div>
    </div>
    
    <div class="grade-timer" v-if="tiempoSilencio > 0">
      <div class="timer-header">
        <span>⏱️ Progreso hacia regeneración</span>
        <span class="timer-count">{{ Math.floor(tiempoSilencio) }}s / 120s</span>
      </div>
      <div class="timer-bar">
        <div 
          class="timer-progress" 
          :style="{ width: `${(tiempoSilencio / 120) * 100}%` }"
        ></div>
      </div>
      <p v-if="tiempoSilencio >= 120" class="regeneration-message">
        ✨ ¡Regenerando +0.5 puntos!
      </p>
    </div>

    <div class="grade-info">
      <div class="info-item">
        <span class="icon">📉</span>
        <span class="text">-0.5 puntos por ruido crítico (10s)</span>
      </div>
      <div class="info-item">
        <span class="icon">📈</span>
        <span class="text">+0.5 puntos por silencio (2 min)</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  notaActual: number
  notaAnimando: boolean
  tiempoSilencio: number
  gradeColorClass: string
  gradeStatusText: string
}

defineProps<Props>()
</script>

<style scoped>
.grade-system-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.grade-display {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
  transition: all 0.3s ease;
}

.grade-display.grade-green {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.grade-display.grade-yellow {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.grade-display.grade-red {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.grade-label {
  color: white;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 10px;
  opacity: 0.9;
}

.grade-value {
  color: white;
  font-size: 64px;
  font-weight: 900;
  line-height: 1;
  margin: 10px 0;
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
}

.grade-value.grade-animation {
  animation: gradeChange 0.6s ease-in-out;
}

@keyframes gradeChange {
  0% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.2) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.grade-status {
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin-top: 10px;
  opacity: 0.95;
}

.grade-timer {
  background-color: #f8f9fa;
  border-radius: 15px;
  padding: 20px;
}

.timer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #555;
}

.timer-count {
  color: #667eea;
  font-size: 16px;
}

.timer-bar {
  width: 100%;
  height: 10px;
  background-color: #e5e7f1;
  border-radius: 10px;
  overflow: hidden;
}

.timer-progress {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  transition: width 0.5s ease;
  animation: progressPulse 2s infinite;
}

@keyframes progressPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}

.regeneration-message {
  margin: 12px 0 0 0;
  text-align: center;
  color: #11998e;
  font-size: 16px;
  font-weight: 700;
  animation: celebrate 0.5s ease-in-out infinite alternate;
}

@keyframes celebrate {
  from { transform: scale(1); }
  to { transform: scale(1.05); }
}

.grade-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 10px;
}

.info-item .icon {
  font-size: 24px;
}

.info-item .text {
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

@media (max-width: 768px) {
  .grade-value {
    font-size: 48px;
  }
}
</style>
