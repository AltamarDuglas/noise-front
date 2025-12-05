<template>
  <div class="app-container">
    <!-- Header -->
    <header class="app-header">
      <h1>🔊 Ruidómetro Escolar</h1>
      <div class="connection-status" :class="estadoColor">
        <span class="status-dot"></span>
        {{ estadoMensaje }}
      </div>
    </header>

    <!-- Tabs Navigation -->
    <nav class="tabs-nav">
      <button 
        class="tab-button" 
        :class="{ active: tabActiva === 'monitor' }"
        @click="tabActiva = 'monitor'"
      >
        📊 Monitor en Vivo
      </button>
      <button 
        class="tab-button" 
        :class="{ active: tabActiva === 'historial' }"
        @click="tabActiva = 'historial'"
      >
        📋 Historial de Sesiones
      </button>
      <button 
        class="tab-button" 
        :class="{ active: tabActiva === 'estadisticas' }"
        @click="tabActiva = 'estadisticas'"
      >
        📈 Estadísticas
      </button>
    </nav>

    <!-- Tab: Monitor en Vivo -->
    <div v-show="tabActiva === 'monitor'" class="tab-content">
      <div class="monitor-layout">
        <!-- Formulario de Sesión -->
        <div class="card session-card">
          <h2>{{ medicionActiva ? '✅ Sesión Activa' : '🎯 Nueva Sesión' }}</h2>
          
          <form v-if="!medicionActiva" class="session-form" @submit.prevent="iniciarMedicion">
            <div class="form-row">
              <div class="field">
                <label for="docente">👨‍🏫 Docente</label>
                <input
                  id="docente"
                  type="text"
                  v-model="docente"
                  :disabled="creandoSesion"
                  placeholder="Nombre del docente"
                  autocomplete="off"
                />
              </div>
              <div class="field">
                <label for="curso">🎓 Curso</label>
                <input
                  id="curso"
                  type="text"
                  v-model="curso"
                  :disabled="creandoSesion"
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
                v-model.number="notaInicial"
                :disabled="creandoSesion"
                placeholder="5.0"
                min="0"
                max="10"
                step="0.5"
                autocomplete="off"
              />
            </div>
            
            <button type="submit" class="btn btn-primary" :disabled="!puedeIniciar">
              {{ creandoSesion ? '⏳ Creando sesión...' : '▶️ Iniciar Sesión' }}
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
              @click="detenerMedicion"
              :disabled="finalizandoSesion"
            >
              {{ finalizandoSesion ? '⏳ Finalizando...' : '⏹️ Finalizar Sesión' }}
            </button>
          </div>

          <p v-if="sesionError" class="error-message">{{ sesionError }}</p>
        </div>

        <!-- Monitor de Ruido -->
        <div class="card monitor-card">
          <h2>🎤 Nivel de Ruido</h2>
          
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
                  v-model.number="sensitivity"
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
        </div>

        <!-- Sistema de Calificación -->
        <div v-if="medicionActiva" class="card grade-card">
          <h2>📝 Sistema de Calificación</h2>
          
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
              <span class="text">-0.5 puntos por ruido crítico (3s)</span>
            </div>
            <div class="info-item">
              <span class="icon">📈</span>
              <span class="text">+0.5 puntos por silencio (2 min)</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: Historial de Sesiones -->
    <div v-show="tabActiva === 'historial'" class="tab-content">
      <div class="card">
        <h2>📋 Historial de Sesiones</h2>
        
        <p v-if="cargandoSesiones" class="info-message">⏳ Cargando sesiones...</p>
        <p v-else-if="sesionesError" class="error-message">{{ sesionesError }}</p>
        <p v-else-if="sesiones.length === 0" class="info-message">
          📭 No hay sesiones registradas todavía.
        </p>
        
        <div v-else class="sessions-table-wrapper">
          <table class="sessions-table">
            <thead>
              <tr>
                <th>🎓 Curso</th>
                <th>👨‍🏫 Docente</th>
                <th>🕐 Inicio</th>
                <th>🕐 Fin</th>
                <th>⭐ Nota Inicial</th>
                <th>📊 Nota Final</th>
                <th>📏 Mediciones</th>
                <th>⚙️ Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sesion in sesiones" :key="sesion.id">
                <td><strong>{{ sesion.curso }}</strong></td>
                <td>{{ sesion.docente }}</td>
                <td>{{ formatearFecha(sesion.inicio) }}</td>
                <td>
                  {{ sesion.fin ? formatearFecha(sesion.fin) : '🟢 En curso' }}
                </td>
                <td>{{ (sesion.notaInicial ?? 5.0).toFixed(1) }}</td>
                <td :class="getNotaClass(sesion.notaActual ?? 5.0)">
                  <strong>{{ (sesion.notaActual ?? 5.0).toFixed(1) }}</strong>
                </td>
                <td>{{ sesion.mediciones }}</td>
                <td>
                  <div class="action-buttons">
                    <button
                      type="button"
                      class="btn btn-small btn-info"
                      @click="verEstadisticasSesion(sesion.id)"
                      title="Ver estadísticas detalladas"
                    >
                      📊
                    </button>
                    <button
                      type="button"
                      class="btn btn-small btn-danger"
                      @click="eliminarSesion(sesion)"
                      :disabled="
                        sesionEliminando === sesion.id ||
                        cargandoSesiones
                      "
                      title="Eliminar sesión"
                    >
                      {{
                        sesionEliminando === sesion.id
                          ? '⏳'
                          : '🗑️'
                      }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Tab: Estadísticas -->
    <div v-show="tabActiva === 'estadisticas'" class="tab-content">
      <div class="card">
        <h2>📈 Estadísticas y Análisis</h2>
        
        <p v-if="cargandoEstadisticas" class="info-message">
          ⏳ Calculando estadísticas...
        </p>
        <p v-else-if="estadisticasError" class="error-message">{{ estadisticasError }}</p>
        
        <div v-else-if="estadisticas" class="stats-content">
          <div class="stats-cards">
            <div class="stat-card">
              <div class="stat-icon">📊</div>
              <p class="stat-label">Promedio General</p>
              <p class="stat-value">
                {{ estadisticas.promedioGeneral.toFixed(1) }} dB
              </p>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📚</div>
              <p class="stat-label">Sesiones Registradas</p>
              <p class="stat-value">{{ estadisticas.totalSesiones }}</p>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📏</div>
              <p class="stat-label">Mediciones Totales</p>
              <p class="stat-value">{{ estadisticas.totalMediciones }}</p>
            </div>
          </div>

          <div class="charts-grid">
            <div class="chart-card">
              <h3>📊 Comparativa por Curso</h3>
              <p
                v-if="estadisticas.promedioPorCurso.length === 0"
                class="info-message"
              >
                📭 Todavía no hay datos por curso.
              </p>
              <canvas
                v-else
                ref="cursosChartCanvas"
                aria-label="Gráfico de promedios por curso"
              ></canvas>
            </div>
            <div class="chart-card">
              <h3>📈 Tendencia Diaria</h3>
              <p v-if="estadisticas.promedioPorDia.length === 0" class="info-message">
                📭 Reúne mediciones en distintos días para comparar.
              </p>
              <canvas
                v-else
                ref="diasChartCanvas"
                aria-label="Gráfico de promedios por día"
              ></canvas>
            </div>
          </div>
        </div>
        
        <p v-else class="info-message">
          📭 Registra mediciones para ver las estadísticas.
        </p>
      </div>
    </div>

    <!-- Modal de Estadísticas de Sesión -->
    <SesionEstadisticasModal
      :visible="modalEstadisticasVisible"
      :sesionId="sesionIdSeleccionada"
      :apiBaseUrl="apiBaseUrl"
      @close="modalEstadisticasVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { io } from 'socket.io-client'
import Chart from 'chart.js/auto'
import SesionEstadisticasModal from './SesionEstadisticasModal.vue'

interface SesionResumen {
  id: string
  docente: string
  curso: string
  inicio: string
  fin: string | null
  mediciones: number
  notaInicial: number
  notaActual: number
}

interface EstadisticaCurso {
  curso: string
  promedio: number
  mediciones: number
}

interface EstadisticaDia {
  fecha: string
  promedio: number
  mediciones: number
}

interface EstadisticasPayload {
  totalSesiones: number
  totalMediciones: number
  promedioGeneral: number
  promedioPorCurso: EstadisticaCurso[]
  promedioPorDia: EstadisticaDia[]
}

type EstadoUmbral = 'normal' | 'alerta' | 'critico'

const UMBRAL_ADVERTENCIA =
  Number(import.meta.env.VITE_UMBRAL_ADVERTENCIA ?? 45)
const UMBRAL_CRITICO =
  Number(import.meta.env.VITE_UMBRAL_CRITICO ?? 70)
const ALERTA_TONO_INTERVALO = 3000
const ALERTA_TONO_DURACION = 0.3
const ALERTA_TONO_FRECUENCIA = 880

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const socket = io(apiBaseUrl, { transports: ['websocket'] })

const nivel = ref(0)
const color = ref('green')
const medicionActiva = ref(false)
const conectado = ref(false)
const tabActiva = ref<'monitor' | 'historial' | 'estadisticas'>('monitor')
const sensitivity = ref(1.0) // Multiplicador de sensibilidad del micrófono (0.5 - 9.0)

const docente = ref('')
const curso = ref('')
const notaInicial = ref(5.0)
const sesionId = ref<string | null>(null)
const sesionError = ref<string | null>(null)

const creandoSesion = ref(false)
const finalizandoSesion = ref(false)

// Sistema de calificación
const notaActual = ref(5.0)
const notaAnimando = ref(false)
const tiempoSilencio = ref(0)
const tiempoRuidoso = ref(0)
const ultimaPenalizacion = ref(0)
const ultimaRegeneracion = ref(0)
let timerInterval: number | null = null

const sesiones = ref<SesionResumen[]>([])
const cargandoSesiones = ref(false)
const sesionesError = ref<string | null>(null)
const sesionEliminando = ref<string | null>(null)

// Modal de estadísticas de sesión
const modalEstadisticasVisible = ref(false)
const sesionIdSeleccionada = ref<string | null>(null)

const estadoUmbral = ref<EstadoUmbral>('normal')
const alertaActiva = computed(() => estadoUmbral.value !== 'normal')
const alertaMensaje = computed(() => {
  if (estadoUmbral.value === 'critico') {
    return 'Nivel critico de ruido. Reducir inmediatamente.'
  }
  if (estadoUmbral.value === 'alerta') {
    return 'Nivel elevado, baja el volumen del aula.'
  }
  return ''
})
const circleEstadoClase = computed(() => {
  if (estadoUmbral.value === 'critico') return 'circle-critico'
  if (estadoUmbral.value === 'alerta') return 'circle-alerta'
  return ''
})

// Computed para el sistema de calificación
const gradeColorClass = computed(() => {
  if (notaActual.value >= 4.5) return 'grade-green'
  if (notaActual.value >= 3.0) return 'grade-yellow'
  return 'grade-red'
})

const gradeStatusText = computed(() => {
  if (notaActual.value >= 4.5) return '¡Excelente comportamiento!'
  if (notaActual.value >= 3.0) return 'Comportamiento aceptable'
  return '¡Mejorar el comportamiento!'
})

const estadisticas = ref<EstadisticasPayload | null>(null)
const cargandoEstadisticas = ref(false)
const estadisticasError = ref<string | null>(null)

const cursosChartCanvas = ref<HTMLCanvasElement | null>(null)
const diasChartCanvas = ref<HTMLCanvasElement | null>(null)

let cursosChart: Chart | null = null
let diasChart: Chart | null = null

let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let mic: MediaStreamAudioSourceNode | null = null
let audioStream: MediaStream | null = null
let dataArray: Uint8Array | null = null
let animationId: number | null = null
let lastPersisted = 0
let alertaAudioCtx: AudioContext | null = null
let ultimoTono = 0

const estadoMensaje = computed(() =>
  conectado.value ? 'Servidor conectado' : 'Servidor desconectado',
)

const estadoColor = computed(() =>
  conectado.value ? 'status-ok' : 'status-error',
)

const puedeIniciar = computed(() => {
  return (
    !!docente.value.trim() &&
    !!curso.value.trim() &&
    notaInicial.value >= 0 &&
    notaInicial.value <= 10 &&
    !creandoSesion.value &&
    !medicionActiva.value
  )
})

watch([estadisticas, cursosChartCanvas], () => {
  renderCursosChart()
})

watch([estadisticas, diasChartCanvas], () => {
  renderDiasChart()
})

socket.on('connect', () => {
  conectado.value = true
  console.log('Conectado al servidor')
})

socket.on('connect_error', () => {
  conectado.value = false
  console.warn('No se pudo conectar al servidor.')
})

socket.on('disconnect', () => {
  conectado.value = false
  console.warn('Servidor desconectado.')
})

socket.on('actualizar_nivel', (data: { valor: number }) => {
  nivel.value = Number(data?.valor ?? 0)
  actualizarColor()
})

socket.on('sesion_error', (data: { mensaje?: string }) => {
  sesionError.value = data?.mensaje ?? 'No se pudo guardar la medicion.'
})

onMounted(() => {
  cargarSesiones()
  cargarEstadisticas()
})

function verEstadisticasSesion(sesionId: string) {
  sesionIdSeleccionada.value = sesionId
  modalEstadisticasVisible.value = true
}

function actualizarColor() {
  if (nivel.value < 20) color.value = 'green'
  else if (nivel.value < 30) color.value = 'yellow'
  else color.value = 'red'
  evaluarUmbrales()
}

function evaluarUmbrales() {
  const valor = nivel.value
  let nuevoEstado: EstadoUmbral = 'normal'

  if (valor >= UMBRAL_CRITICO) nuevoEstado = 'critico'
  else if (valor >= UMBRAL_ADVERTENCIA) nuevoEstado = 'alerta'

  if (estadoUmbral.value !== nuevoEstado) {
    estadoUmbral.value = nuevoEstado
  }

  if (nuevoEstado === 'critico' && medicionActiva.value) {
    void reproducirTonoAlerta()
  }
}

async function reproducirTonoAlerta() {
  const ahora = Date.now()
  if (ahora - ultimoTono < ALERTA_TONO_INTERVALO) {
    return
  }

  ultimoTono = ahora

  if (!alertaAudioCtx) {
    alertaAudioCtx = new AudioContext()
  }

  await alertaAudioCtx.resume().catch(() => undefined)

  const oscillator = alertaAudioCtx.createOscillator()
  const gain = alertaAudioCtx.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.value = ALERTA_TONO_FRECUENCIA
  gain.gain.value = 0.07

  oscillator.connect(gain)
  gain.connect(alertaAudioCtx.destination)

  oscillator.start()
  oscillator.stop(alertaAudioCtx.currentTime + ALERTA_TONO_DURACION)
}

// Funciones del sistema de calificación
function iniciarTimerCalificacion() {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  
  timerInterval = window.setInterval(() => {
    if (!medicionActiva.value) {
      detenerTimerCalificacion()
      return
    }

    const valor = nivel.value
    const ahora = Date.now()

    // Si el ruido es bajo o moderado (menos del umbral de advertencia)
    if (valor < UMBRAL_ADVERTENCIA) {
      tiempoSilencio.value += 1
      tiempoRuidoso.value = 0

      // Regenerar 0.5 puntos cada 120 segundos (2 minutos)
      if (tiempoSilencio.value >= 120 && ahora - ultimaRegeneracion.value > 120000) {
        regenerarNota()
        ultimaRegeneracion.value = ahora
        tiempoSilencio.value = 0
      }
    } else {
      // Hay ruido excesivo
      tiempoSilencio.value = 0
      tiempoRuidoso.value += 1

      // Penalizar 0.5 puntos si el ruido es crítico y han pasado al menos 3 segundos
      if (valor >= UMBRAL_CRITICO && tiempoRuidoso.value >= 3 && ahora - ultimaPenalizacion.value > 3000) {
        penalizarNota()
        ultimaPenalizacion.value = ahora
        tiempoRuidoso.value = 0
      }
    }
  }, 1000)
}

function detenerTimerCalificacion() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  tiempoSilencio.value = 0
  tiempoRuidoso.value = 0
}

async function penalizarNota() {
  const nuevaNota = Math.max(0, notaActual.value - 0.5)
  await actualizarNota(nuevaNota)
  
  // Reproducir sonido de penalización
  await reproducirSonidoPenalizacion()
}

async function regenerarNota() {
  const nuevaNota = Math.min(notaInicial.value, notaActual.value + 0.5)
  await actualizarNota(nuevaNota)
  
  // Reproducir sonido de regeneración
  await reproducirSonidoRegeneracion()
}

async function actualizarNota(nuevaNota: number) {
  if (!sesionId.value) return

  notaActual.value = nuevaNota
  
  // Activar animación
  notaAnimando.value = true
  setTimeout(() => {
    notaAnimando.value = false
  }, 600)

  // Actualizar en el servidor
  try {
    socket.emit('actualizar_nota', {
      sesionId: sesionId.value,
      nota: nuevaNota,
    })
  } catch (error) {
    console.error('Error actualizando nota:', error)
  }
}

async function reproducirSonidoPenalizacion() {
  if (!alertaAudioCtx) {
    alertaAudioCtx = new AudioContext()
  }

  await alertaAudioCtx.resume().catch(() => undefined)

  const oscillator = alertaAudioCtx.createOscillator()
  const gain = alertaAudioCtx.createGain()

  oscillator.type = 'sawtooth'
  oscillator.frequency.value = 200
  gain.gain.value = 0.1

  oscillator.connect(gain)
  gain.connect(alertaAudioCtx.destination)

  oscillator.start()
  oscillator.stop(alertaAudioCtx.currentTime + 0.3)
}

async function reproducirSonidoRegeneracion() {
  if (!alertaAudioCtx) {
    alertaAudioCtx = new AudioContext()
  }

  await alertaAudioCtx.resume().catch(() => undefined)

  const oscillator = alertaAudioCtx.createOscillator()
  const gain = alertaAudioCtx.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.value = 800
  gain.gain.value = 0.08

  oscillator.connect(gain)
  gain.connect(alertaAudioCtx.destination)

  oscillator.start()
  oscillator.stop(alertaAudioCtx.currentTime + 0.2)

  // Segundo tono
  setTimeout(() => {
    const osc2 = alertaAudioCtx!.createOscillator()
    const gain2 = alertaAudioCtx!.createGain()
    
    osc2.type = 'sine'
    osc2.frequency.value = 1000
    gain2.gain.value = 0.08
    
    osc2.connect(gain2)
    gain2.connect(alertaAudioCtx!.destination)
    
    osc2.start()
    osc2.stop(alertaAudioCtx!.currentTime + 0.2)
  }, 150)
}

function formatearFecha(valor: string | Date) {
  const fecha = typeof valor === 'string' ? new Date(valor) : valor
  if (Number.isNaN(fecha.getTime())) {
    return 'Fecha invalida'
  }
  return fecha.toLocaleString()
}

function getNotaClass(nota: number): string {
  if (nota >= 4.5) return 'nota-alta'
  if (nota >= 3.0) return 'nota-media'
  return 'nota-baja'
}

async function cargarSesiones() {
  cargandoSesiones.value = true
  sesionesError.value = null

  try {
    const response = await fetch(`${apiBaseUrl}/sesiones`)
    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      const message =
        (payload as { message?: string } | null)?.message ??
        'No se pudieron cargar las sesiones.'
      throw new Error(message)
    }

    if (!Array.isArray(payload)) {
      throw new Error('Respuesta inesperada del servidor.')
    }

    sesiones.value = (payload as SesionResumen[]).map((sesion) => ({
      id: sesion.id,
      docente: sesion.docente,
      curso: sesion.curso,
      inicio: sesion.inicio,
      fin: sesion.fin,
      mediciones: sesion.mediciones ?? 0,
      notaInicial: sesion.notaInicial ?? 5.0,
      notaActual: sesion.notaActual ?? 5.0,
    }))
  } catch (error) {
    sesionesError.value =
      error instanceof Error
        ? error.message
        : 'No se pudieron cargar las sesiones.'
  } finally {
    cargandoSesiones.value = false
  }
}

async function eliminarSesion(sesion: SesionResumen) {
  if (!sesion?.id) {
    return
  }

  const confirmado =
    typeof window === 'undefined'
      ? true
      : window.confirm(
          `Se eliminara la sesion completa de "${sesion.curso}" y sus datos asociados. Esta accion no se puede deshacer. ¿Continuar?`,
        )

  if (!confirmado) {
    return
  }

  sesionEliminando.value = sesion.id
  sesionesError.value = null

  try {
    const response = await fetch(
      `${apiBaseUrl}/sesiones/${sesion.id}`,
      { method: 'DELETE' },
    )
    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      const message =
        (payload as { message?: string } | null)?.message ??
        'No se pudo eliminar la sesion.'
      throw new Error(message)
    }

    await Promise.all([cargarSesiones(), cargarEstadisticas()])
  } catch (error) {
    sesionesError.value =
      error instanceof Error
        ? error.message
        : 'No se pudo eliminar la sesion.'
  } finally {
    if (sesionEliminando.value === sesion.id) {
      sesionEliminando.value = null
    }
  }
}

async function cargarEstadisticas() {
  cargandoEstadisticas.value = true
  estadisticasError.value = null

  interface EstadisticasApiPayload {
    totalSesiones?: unknown
    totalMediciones?: unknown
    promedioGeneral?: unknown
    promedioPorCurso?: Array<Partial<EstadisticaCurso>>
    promedioPorDia?: Array<Partial<EstadisticaDia>>
  }

  try {
    const response = await fetch(`${apiBaseUrl}/estadisticas`)
    const payload = (await response.json().catch(() => null)) as
      | EstadisticasApiPayload
      | null

    if (!response.ok) {
      const message =
        (payload as { message?: string } | null)?.message ??
        'No se pudieron calcular las estadisticas.'
      throw new Error(message)
    }

    if (!payload) {
      throw new Error('Respuesta inesperada del servidor.')
    }

    const promedioPorCurso = Array.isArray(payload.promedioPorCurso)
      ? payload.promedioPorCurso.map((curso) => {
          const promedio = Number(curso?.promedio ?? 0)
          const mediciones = Number(curso?.mediciones ?? 0)
          return {
            curso:
              typeof curso?.curso === 'string'
                ? curso.curso
                : 'Sin curso asignado',
            promedio: Number.isFinite(promedio) ? promedio : 0,
            mediciones: Number.isFinite(mediciones) ? mediciones : 0,
          }
        })
      : []

    const promedioPorDia = Array.isArray(payload.promedioPorDia)
      ? payload.promedioPorDia.map((dia) => {
          const promedio = Number(dia?.promedio ?? 0)
          const mediciones = Number(dia?.mediciones ?? 0)
          return {
            fecha: typeof dia?.fecha === 'string' ? dia.fecha : '',
            promedio: Number.isFinite(promedio) ? promedio : 0,
            mediciones: Number.isFinite(mediciones) ? mediciones : 0,
          }
        })
      : []

    estadisticas.value = {
      totalSesiones: Number(payload.totalSesiones ?? 0),
      totalMediciones: Number(payload.totalMediciones ?? 0),
      promedioGeneral: Number(payload.promedioGeneral ?? 0),
      promedioPorCurso,
      promedioPorDia: promedioPorDia.filter((dia) => !!dia.fecha),
    }
  } catch (error) {
    estadisticas.value = null
    estadisticasError.value =
      error instanceof Error
        ? error.message
        : 'No se pudieron calcular las estadisticas.'
    destruirGraficas()
  } finally {
    cargandoEstadisticas.value = false
  }
}

async function iniciarMedicion() {
  if (!puedeIniciar.value) {
    sesionError.value = 'Completa docente y curso antes de iniciar.'
    return
  }

  sesionError.value = null
  creandoSesion.value = true

  try {
    await prepararAudio()

    const response = await fetch(`${apiBaseUrl}/sesiones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        docente: docente.value.trim(),
        curso: curso.value.trim(),
        notaInicial: notaInicial.value,
      }),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      const message =
        (payload as { message?: string } | null)?.message ??
        'No se pudo crear la sesion.'
      throw new Error(message)
    }

    if (
      !payload ||
      typeof (payload as { id?: unknown }).id !== 'string'
    ) {
      throw new Error('Respuesta inesperada del servidor.')
    }

    sesionId.value = (payload as { id: string }).id
    notaActual.value = notaInicial.value
    medicionActiva.value = true
    
    // Iniciar timer de calificación
    iniciarTimerCalificacion()
    
    medir()
    await cargarSesiones()
    await cargarEstadisticas()
  } catch (error) {
    sesionId.value = null
    sesionError.value =
      error instanceof Error ? error.message : 'No se pudo crear la sesion.'
    await liberarRecursosDeAudio()
  } finally {
    creandoSesion.value = false
  }
}

async function prepararAudio() {
  audioCtx = new AudioContext()
  audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  analyser = audioCtx.createAnalyser()
  mic = audioCtx.createMediaStreamSource(audioStream)
  mic.connect(analyser)
  dataArray = new Uint8Array(analyser.frequencyBinCount)
  lastPersisted = 0
}

async function liberarRecursosDeAudio() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId)
    animationId = null
  }

  if (audioCtx) {
    await audioCtx.close().catch(() => undefined)
    audioCtx = null
  }

  if (audioStream) {
    audioStream.getTracks().forEach((track) => track.stop())
    audioStream = null
  }

  analyser = null
  mic = null
  dataArray = null

  if (alertaAudioCtx) {
    await alertaAudioCtx.close().catch(() => undefined)
    alertaAudioCtx = null
  }
  ultimoTono = 0
}

async function detenerMedicion() {
  if (!medicionActiva.value) return

  medicionActiva.value = false
  finalizandoSesion.value = true
  sesionError.value = null

  // Detener timer de calificación
  detenerTimerCalificacion()

  await liberarRecursosDeAudio()

  try {
    if (sesionId.value) {
      const response = await fetch(
        `${apiBaseUrl}/sesiones/${sesionId.value}/terminar`,
        {
          method: 'PATCH',
        },
      )
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          (payload as { message?: string } | null)?.message ??
          'No se pudo terminar la sesion.'
        throw new Error(message)
      }
    }
  } catch (error) {
    sesionError.value =
      error instanceof Error ? error.message : 'No se pudo terminar la sesion.'
  } finally {
    finalizandoSesion.value = false
    sesionId.value = null
    nivel.value = 0
    notaActual.value = notaInicial.value
    actualizarColor()
  }

  await cargarSesiones()
  await cargarEstadisticas()
}

function renderCursosChart() {
  if (cursosChart) {
    cursosChart.destroy()
    cursosChart = null
  }

  if (
    !estadisticas.value ||
    estadisticas.value.promedioPorCurso.length === 0 ||
    !cursosChartCanvas.value
  ) {
    return
  }

  const datos = estadisticas.value.promedioPorCurso
  cursosChart = new Chart(cursosChartCanvas.value, {
    type: 'bar',
    data: {
      labels: datos.map((item) => item.curso),
      datasets: [
        {
          label: 'Promedio (dB)',
          data: datos.map((item) => Number(item.promedio.toFixed(1))),
          backgroundColor: '#0066ff',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'dB' },
        },
      },
    },
  })
}

function renderDiasChart() {
  if (diasChart) {
    diasChart.destroy()
    diasChart = null
  }

  if (
    !estadisticas.value ||
    estadisticas.value.promedioPorDia.length === 0 ||
    !diasChartCanvas.value
  ) {
    return
  }

  const datos = estadisticas.value.promedioPorDia
  diasChart = new Chart(diasChartCanvas.value, {
    type: 'line',
    data: {
      labels: datos.map((item) => formatearDia(item.fecha)),
      datasets: [
        {
          label: 'Promedio (dB)',
          data: datos.map((item) => Number(item.promedio.toFixed(1))),
          borderColor: '#ff7f11',
          backgroundColor: 'rgba(255, 127, 17, 0.25)',
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'dB' },
        },
      },
    },
  })
}

function medir() {
  if (!medicionActiva.value || !analyser || !dataArray) return

  analyser.getByteFrequencyData(dataArray)
  const promedio =
    dataArray.reduce((acc, item) => acc + item, 0) / dataArray.length

  // Aplicar sensibilidad (multiplicador 0.5 - 2.0)
  nivel.value = Number((((promedio / 255) * 100) * sensitivity.value).toFixed(1))
  actualizarColor()

  const ahora = Date.now()
  if (sesionId.value && ahora - lastPersisted > 1000) {
    socket.emit('nivel_ruido', {
      valor: nivel.value,
      sesionId: sesionId.value,
    })
    lastPersisted = ahora
  }

  animationId = requestAnimationFrame(medir)
}

function formatearDia(valor: string) {
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) {
    return valor
  }
  return fecha.toLocaleDateString()
}

function destruirGraficas() {
  if (cursosChart) {
    cursosChart.destroy()
    cursosChart = null
  }
  if (diasChart) {
    diasChart.destroy()
    diasChart = null
  }
}

onBeforeUnmount(async () => {
  await liberarRecursosDeAudio()
  destruirGraficas()
  socket.disconnect()
})
</script>

<style scoped>
/* === RESET Y BASE === */
* {
  box-sizing: border-box;
}

.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding-bottom: 40px;
}

/* === HEADER === */
.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 20px 30px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.app-header h1 {
  margin: 0;
  font-size: 28px;
  color: #333;
  font-weight: 700;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.connection-status.status-ok {
  background-color: #d4edda;
  color: #155724;
}

.connection-status.status-error {
  background-color: #f8d7da;
  color: #721c24;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: currentColor;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* === TABS NAVIGATION === */
.tabs-nav {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  flex-wrap: wrap;
}

.tab-button {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 2px solid transparent;
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.tab-button.active {
  background: white;
  color: #667eea;
  border-color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* === TAB CONTENT === */
.tab-content {
  padding: 0 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* === CARDS === */
.card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  margin-bottom: 20px;
}

.card h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  color: #333;
  font-weight: 700;
}

.card h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #555;
  font-weight: 600;
}

/* === MONITOR LAYOUT === */
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

/* === FORMULARIO DE SESIÓN === */
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

/* === BOTONES === */
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

.btn-small {
  padding: 8px 16px;
  font-size: 14px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* === SESIÓN ACTIVA INFO === */
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

/* === MONITOR DE RUIDO === */
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

/* === SISTEMA DE CALIFICACIÓN === */
.grade-display {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
  transition: all 0.3s ease;
  margin-bottom: 20px;
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

/* === TIMER DE REGENERACIÓN === */
.grade-timer {
  background-color: #f8f9fa;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
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

/* === GRADE INFO === */
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

/* === MENSAJES === */
.error-message {
  margin: 15px 0 0 0;
  padding: 12px 16px;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
}

.info-message {
  margin: 15px 0;
  padding: 12px 16px;
  background-color: #d1ecf1;
  color: #0c5460;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  text-align: center;
}

/* === TABLA DE SESIONES === */
.sessions-table-wrapper {
  width: 100%;
  overflow-x: auto;
  margin-top: 20px;
}

.sessions-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.sessions-table th,
.sessions-table td {
  padding: 14px 16px;
  text-align: left;
  font-size: 14px;
  border-bottom: 1px solid #e5e7f1;
}

.sessions-table th {
  background-color: #f8f9fa;
  font-weight: 700;
  color: #555;
  position: sticky;
  top: 0;
  z-index: 10;
}

.sessions-table tbody tr {
  transition: background-color 0.2s ease;
}

.sessions-table tbody tr:hover {
  background-color: #f8f9fa;
}

.nota-alta {
  color: #11998e;
  font-weight: 700;
}

.nota-media {
  color: #f5576c;
  font-weight: 700;
}

.nota-baja {
  color: #fa709a;
  font-weight: 700;
}

/* === ESTADÍSTICAS === */
.stats-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  text-align: center;
  color: white;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.stat-label {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  margin: 0;
  font-size: 32px;
  font-weight: 900;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* === GRÁFICOS === */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 25px;
}

@media (min-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.chart-card {
  background-color: #f8f9fa;
  border-radius: 16px;
  padding: 25px;
}

.chart-card h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  font-weight: 700;
}

.chart-card canvas {
  width: 100% !important;
  height: 300px !important;
}

/* === RESPONSIVE === */
@media (max-width: 768px) {
  .app-header {
    padding: 15px 20px;
  }
  
  .app-header h1 {
    font-size: 22px;
  }
  
  .tabs-nav {
    padding: 15px;
  }
  
  .tab-button {
    padding: 10px 16px;
    font-size: 14px;
  }
  
  .card {
    padding: 20px;
  }
  
  .card h2 {
    font-size: 20px;
  }
  
  .grade-value {
    font-size: 48px;
  }
  
  .circle {
    width: 140px;
    height: 140px;
  }
  
  .nivel-display {
    font-size: 28px;
  }
}

/* === CONTROL DE SENSIBILIDAD === */
.sensitivity-control {
  width: 100%;
  max-width: 300px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
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
  .sensitivity-control {
    max-width: 100%;
  }
}

/* === BOTONES DE ACCIÓN === */
.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.btn-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-info:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
</style>
