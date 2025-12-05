<template>
  <div class="session-card-container">
    <h2>{{ medicionActiva ? '✅ Sesión Activa' : '🎯 Nueva Sesión' }}</h2>
    
    <form v-if="!medicionActiva" class="session-form" @submit.prevent="handleSubmit">
      <div class="form-row">
        <div class="field">
          <label for="docente">👨‍🏫 Docente</label>
          <input
            id="docente"
            type="text"
            v-model="localDocente"
            :disabled="loading"
            placeholder="Nombre del docente"
            autocomplete="off"
          />
        </div>
        <div class="field">
          <label for="curso">🎓 Curso</label>
          <input
            id="curso"
            type="text"
            v-model="localCurso"
            :disabled="loading"
            placeholder="Ej: 5to A"
            autocomplete="off"
          />
        </div>
      </div>
      
      <div class="field">
        <label for="notaInicial">⭐ Nota Inicial (0-10)</label>
        <input
          id="notaInicial"
          type="number"
          v-model.number="localNotaInicial"
          :disabled="loading"
          placeholder="5.0"
          min="0"
          max="10"
          step="0.5"
          autocomplete="off"
        />
      </div>
      
      <button type="submit" class="btn btn-primary" :disabled="!canSubmit">
        {{ loading ? '⏳ Creando sesión...' : '▶️ Iniciar Sesión' }}
      </button>
    </form>

    <div v-else class="session-active-info">
      <div class="info-row">
        <span class="label">Curso:</span>
        <span class="value">{{ curso }}</span>
      </div>
      <div class="info-row">
        <span class="label">Docente:</span>
        <span class="value">{{ docente }}</span>
      </div>
      <div class="info-row">
        <span class="label">Nota Inicial:</span>
        <span class="value">{{ notaInicial.toFixed(1) }}</span>
      </div>
      
      <button
        class="btn btn-danger"
        @click="$emit('stop')"
        :disabled="stopping"
      >
        {{ stopping ? '⏳ Finalizando...' : '⏹️ Finalizar Sesión' }}
      </button>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  medicionActiva: boolean
  docente: string
  curso: string
  notaInicial: number
  loading?: boolean
  stopping?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  stopping: false,
  error: null,
})

const emit = defineEmits<{
  start: [{ docente: string; curso: string; notaInicial: number }]
  stop: []
}>()

const localDocente = ref(props.docente)
const localCurso = ref(props.curso)
const localNotaInicial = ref(props.notaInicial)

const canSubmit = computed(() => {
  return (
    !!localDocente.value.trim() &&
    !!localCurso.value.trim() &&
    localNotaInicial.value >= 0 &&
    localNotaInicial.value <= 10 &&
    !props.loading
  )
})

function handleSubmit() {
  if (!canSubmit.value) return
  
  emit('start', {
    docente: localDocente.value.trim(),
    curso: localCurso.value.trim(),
    notaInicial: localNotaInicial.value,
  })
}
</script>

<style scoped>
.session-card-container h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  color: #333;
  font-weight: 700;
}

.session-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 600px) {
  .form-row {
    grid-template-columns: 1fr 1fr;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 14px;
  font-weight: 600;
  color: #555;
}

.field input {
  padding: 12px 16px;
  border: 2px solid #e5e7f1;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.3s ease;
  font-family: inherit;
}

.field input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.field input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-danger {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 87, 108, 0.4);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.session-active-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-of-type {
  border-bottom: none;
}

.info-row .label {
  font-weight: 600;
  color: #666;
}

.info-row .value {
  font-weight: 700;
  color: #333;
  font-size: 16px;
}

.error-message {
  margin: 15px 0 0 0;
  padding: 12px 16px;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
}
</style>
