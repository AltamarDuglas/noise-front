<template>
  <div class="monitor-tab">
    <div class="monitor-layout">
      <!-- Formulario de Sesión -->
      <div class="card session-card">
        <SessionForm
          :medicionActiva="medicionActiva"
          :docente="docente"
          :curso="curso"
          :notaInicial="notaInicial"
          :loading="creandoSesion"
          :stopping="finalizandoSesion"
          :error="sesionError"
          @start="handleStart"
          @stop="handleStop"
        />
      </div>

      <!-- Monitor de Ruido -->
      <div class="card monitor-card">
        <h2>🎤 Nivel de Ruido</h2>
        <NoiseMonitor
          :nivel="nivel"
          :color="color"
          :alertaActiva="alertaActiva"
          :alertaMensaje="alertaMensaje"
          :circleEstadoClase="circleEstadoClase"
          :sensitivity="sensitivity"
          @update:sensitivity="$emit('update:sensitivity', $event)"
        />
      </div>

      <!-- Sistema de Calificación -->
      <div v-if="medicionActiva" class="card grade-card">
        <h2>📝 Sistema de Calificación</h2>
        <GradeSystem
          :notaActual="notaActual"
          :notaAnimando="notaAnimando"
          :tiempoSilencio="tiempoSilencio"
          :gradeColorClass="gradeColorClass"
          :gradeStatusText="gradeStatusText"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SessionForm from './SessionForm.vue'
import NoiseMonitor from './NoiseMonitor.vue'
import GradeSystem from './GradeSystem.vue'

interface Props {
  medicionActiva: boolean
  docente: string
  curso: string
  notaInicial: number
  notaActual: number
  notaAnimando: boolean
  tiempoSilencio: number
  nivel: number
  color: string
  alertaActiva: boolean
  alertaMensaje: string
  circleEstadoClase: string
  gradeColorClass: string
  gradeStatusText: string
  creandoSesion: boolean
  finalizandoSesion: boolean
  sesionError: string | null
  sensitivity: number
}

defineProps<Props>()

const emit = defineEmits<{
  start: [{ docente: string; curso: string; notaInicial: number }]
  stop: []
  'update:sensitivity': [value: number]
}>()

function handleStart(data: { docente: string; curso: string; notaInicial: number }) {
  emit('start', data)
}

function handleStop() {
  emit('stop')
}
</script>

<style scoped>
.monitor-tab {
  width: 100%;
}

.monitor-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 768px) {
  .monitor-layout {
    grid-template-columns: 1fr 1fr;
  }
  
  .session-card {
    grid-column: 1 / 2;
  }
  
  .monitor-card {
    grid-column: 2 / 3;
    grid-row: 1 / 3;
  }
  
  .grade-card {
    grid-column: 1 / 2;
  }
}

@media (min-width: 1200px) {
  .monitor-layout {
    grid-template-columns: 1fr 1fr 1fr;
  }
  
  .session-card {
    grid-column: 1 / 2;
  }
  
  .monitor-card {
    grid-column: 2 / 3;
  }
  
  .grade-card {
    grid-column: 3 / 4;
    grid-row: 1 / 3;
  }
}

.card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.card h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  color: #333;
  font-weight: 700;
}

@media (max-width: 768px) {
  .card {
    padding: 20px;
  }
  
  .card h2 {
    font-size: 20px;
  }
}
</style>
