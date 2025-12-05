<template>
  <div class="noise-monitor">
    <div
      class="circle"
      :class="circleEstadoClase"
      :style="{ backgroundColor: color }"
    ></div>
    <div class="nivel-display">{{ nivel.toFixed(1) }} dB</div>
    <p v-if="alertaActiva" class="alerta-mensaje" aria-live="assertive">
      {{ alertaMensaje }}
    </p>
    
    <!-- Control de Sensibilidad -->
    <div class="sensitivity-control">
      <label for="sensitivity">Sensibilidad del Micrófono</label>
      <div class="sensitivity-slider">
        <span class="sensitivity-label">Baja</span>
        <input
          id="sensitivity"
          type="range"
          :value="sensitivity"
          @input="$emit('update:sensitivity', Number(($event.target as HTMLInputElement).value))"
          min="0.5"
          max="9.0"
          step="0.1"
          class="slider"
        />
        <span class="sensitivity-label">Alta</span>
      </div>
      <div class="sensitivity-value">
        Multiplicador: {{ sensitivity.toFixed(1) }}x
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  nivel: number
  color: string
  alertaActiva: boolean
  alertaMensaje: string
  circleEstadoClase: string
  sensitivity: number
}

defineProps<Props>()

defineEmits<{
  'update:sensitivity': [value: number]
}>()
</script>

<style scoped>
.noise-monitor {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px 0;
}

.circle {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.circle-alerta {
  animation: pulse 1.2s infinite ease-in-out;
  box-shadow: 0 0 40px rgba(255, 193, 7, 0.6);
}

.circle-critico {
  animation: flash 0.6s infinite;
  box-shadow: 0 0 50px rgba(231, 76, 60, 0.8);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes flash {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.08); opacity: 0.4; }
}

.nivel-display {
  font-size: 36px;
  font-weight: 800;
  color: #333;
}

.alerta-mensaje {
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: #d35400;
  margin: 0;
  padding: 10px 20px;
  background-color: #fff3cd;
  border-radius: 10px;
}

/* Control de Sensibilidad */
.sensitivity-control {
  width: 100%;
  max-width: 300px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sensitivity-control label {
  font-size: 14px;
  font-weight: 600;
  color: #555;
  text-align: center;
}

.sensitivity-slider {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sensitivity-label {
  font-size: 12px;
  color: #666;
  min-width: 35px;
  text-align: center;
}

.slider {
  flex: 1;
  height: 6px;
  border-radius: 5px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  border: 3px solid #667eea;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  border: 3px solid #667eea;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.sensitivity-value {
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #667eea;
}

@media (max-width: 768px) {
  .circle {
    width: 140px;
    height: 140px;
  }
  
  .nivel-display {
    font-size: 28px;
  }
  
  .sensitivity-control {
    max-width: 100%;
  }
}
</style>
