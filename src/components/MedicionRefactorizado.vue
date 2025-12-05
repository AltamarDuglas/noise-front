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
        @click="cambiarTab('historial')"
      >
        📋 Historial de Sesiones
      </button>
      <button 
        class="tab-button" 
        :class="{ active: tabActiva === 'estadisticas' }"
        @click="cambiarTab('estadisticas')"
      >
        📈 Estadísticas
      </button>
    </nav>

    <!-- Tab: Monitor en Vivo -->
    <div v-show="tabActiva === 'monitor'" class="tab-content">
      <MonitorTab
        :medicionActiva="medicionActiva"
        :docente="docente"
        :curso="curso"
        :notaInicial="notaInicial"
        :notaActual="notaActual"
        :notaAnimando="notaAnimando"
        :tiempoSilencio="tiempoSilencio"
        :nivel="nivel"
        :color="color"
        :alertaActiva="alertaActiva"
        :alertaMensaje="alertaMensaje"
        :circleEstadoClase="circleEstadoClase"
        :gradeColorClass="gradeColorClass"
        :gradeStatusText="gradeStatusText"
        :creandoSesion="creandoSesion"
        :finalizandoSesion="finalizandoSesion"
        :sesionError="sesionError"
        :sensitivity="sensitivity"
        @start="iniciarMedicion"
        @stop="detenerMedicion"
        @update:sensitivity="sensitivity = $event"
      />
    </div>

    <!-- Tab: Historial de Sesiones -->
    <div v-show="tabActiva === 'historial'" class="tab-content">
      <HistorialTab
        :sesiones="sesiones"
        :loading="cargandoSesiones"
        :error="sesionesError"
        :deletingId="sesionEliminando"
        @delete="borrarMedicionesSesion"
      />
    </div>

    <!-- Tab: Estadísticas -->
    <div v-show="tabActiva === 'estadisticas'" class="tab-content">
      <EstadisticasTab
        :estadisticas="estadisticas"
        :loading="cargandoEstadisticas"
        :error="estadisticasError"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRuidometro } from '../composables/useRuidometro'
import MonitorTab from './MonitorTab.vue'
import HistorialTab from './HistorialTab.vue'
import EstadisticasTab from './EstadisticasTab.vue'

// Interfaces
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

// Composable
const {
  conectado,
  nivel,
  color,
  sensitivity,
  medicionActiva,
  sesionId,
  docente,
  curso,
  notaInicial,
  notaActual,
  notaAnimando,
  tiempoSilencio,
  tiempoRuidoso,
  ultimaPenalizacion,
  ultimaRegeneracion,
  estadoMensaje,
  estadoColor,
  alertaActiva,
  alertaMensaje,
  circleEstadoClase,
  gradeColorClass,
  gradeStatusText,
  actualizarNota,
  UMBRAL_ADVERTENCIA,
  UMBRAL_CRITICO,
  apiBaseUrl,
  socket,
} = useRuidometro()

// Estado local
const tabActiva = ref<'monitor' | 'historial' | 'estadisticas'>('monitor')
const creandoSesion = ref(false)
const finalizandoSesion = ref(false)
const sesionError = ref<string | null>(null)

const sesiones = ref<SesionResumen[]>([])
const cargandoSesiones = ref(false)
const sesionesError = ref<string | null>(null)
const sesionEliminando = ref<string | null>(null)

const estadisticas = ref<EstadisticasPayload | null>(null)
const cargandoEstadisticas = ref(false)
const estadisticasError = ref<string | null>(null)

// Audio y medición
let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let mic: MediaStreamAudioSourceNode | null = null
let audioStream: MediaStream | null = null
let dataArray: Uint8Array | null = null
let animationId: number | null = null
let lastPersisted = 0
let alertaAudioCtx: AudioContext | null = null
let ultimoTono = 0
let timerInterval: number | null = null

// Socket events
socket.on('sesion_error', (data: { mensaje?: string }) => {
  sesionError.value = data?.mensaje ?? 'No se pudo guardar la medición.'
})

// Lifecycle
onMounted(() => {
  cargarSesiones()
  cargarEstadisticas()
})

onBeforeUnmount(async () => {
  await liberarRecursosDeAudio()
  detenerTimerCalificacion()
  socket.disconnect()
})

// Funciones
function cambiarTab(tab: 'monitor' | 'historial' | 'estadisticas') {
  tabActiva.value = tab
  if (tab === 'historial') {
    cargarSesiones()
  } else if (tab === 'estadisticas') {
    cargarEstadisticas()
  }
}

async function iniciarMedicion(data: { docente: string; curso: string; notaInicial: number }) {
  sesionError.value = null
  creandoSesion.value = true

  try {
    await prepararAudio()

    const response = await fetch(`${apiBaseUrl}/sesiones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      const message =
        (payload as { message?: string } | null)?.message ??
        'No se pudo crear la sesión.'
      throw new Error(message)
    }

    if (!payload || typeof (payload as { id?: unknown }).id !== 'string') {
      throw new Error('Respuesta inesperada del servidor.')
    }

    sesionId.value = (payload as { id: string }).id
    docente.value = data.docente
    curso.value = data.curso
    notaInicial.value = data.notaInicial
    notaActual.value = data.notaInicial
    medicionActiva.value = true
    
    iniciarTimerCalificacion()
    medir()
    await cargarSesiones()
    await cargarEstadisticas()
  } catch (error) {
    sesionId.value = null
    sesionError.value =
      error instanceof Error ? error.message : 'No se pudo crear la sesión.'
    await liberarRecursosDeAudio()
  } finally {
    creandoSesion.value = false
  }
}

async function detenerMedicion() {
  if (!medicionActiva.value) return

  medicionActiva.value = false
  finalizandoSesion.value = true
  sesionError.value = null

  detenerTimerCalificacion()
  await liberarRecursosDeAudio()

  try {
    if (sesionId.value) {
      const response = await fetch(
        `${apiBaseUrl}/sesiones/${sesionId.value}/terminar`,
        { method: 'PATCH' },
      )
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          (payload as { message?: string } | null)?.message ??
          'No se pudo terminar la sesión.'
        throw new Error(message)
      }
    }
  } catch (error) {
    sesionError.value =
      error instanceof Error ? error.message : 'No se pudo terminar la sesión.'
  } finally {
    finalizandoSesion.value = false
    sesionId.value = null
    nivel.value = 0
    notaActual.value = notaInicial.value
  }

  await cargarSesiones()
  await cargarEstadisticas()
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

function medir() {
  if (!medicionActiva.value || !analyser || !dataArray) return

  analyser.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>)
  const promedio =
    dataArray.reduce((acc, item) => acc + item, 0) / dataArray.length

  nivel.value = Number(((promedio / 255) * 100).toFixed(1))

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

// Sistema de calificación
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

    if (valor < UMBRAL_ADVERTENCIA) {
      tiempoSilencio.value += 1
      tiempoRuidoso.value = 0

      if (tiempoSilencio.value >= 120 && ahora - ultimaRegeneracion.value > 120000) {
        regenerarNota()
        ultimaRegeneracion.value = ahora
        tiempoSilencio.value = 0
      }
    } else {
      tiempoSilencio.value = 0
      tiempoRuidoso.value += 1

      if (valor >= UMBRAL_CRITICO && tiempoRuidoso.value >= 10 && ahora - ultimaPenalizacion.value > 10000) {
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
  await reproducirSonidoPenalizacion()
}

async function regenerarNota() {
  const nuevaNota = Math.min(notaInicial.value, notaActual.value + 0.5)
  await actualizarNota(nuevaNota)
  await reproducirSonidoRegeneracion()
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

// Sesiones
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
      notaInicial: sesion.notaInicial,
      notaActual: sesion.notaActual,
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

async function borrarMedicionesSesion(sesion: SesionResumen) {
  if (!sesion?.id || sesion.mediciones === 0) return

  sesionEliminando.value = sesion.id
  sesionesError.value = null

  try {
    const response = await fetch(
      `${apiBaseUrl}/sesiones/${sesion.id}/mediciones`,
      { method: 'DELETE' },
    )
    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      const message =
        (payload as { message?: string } | null)?.message ??
        'No se pudieron borrar las mediciones.'
      throw new Error(message)
    }

    await Promise.all([cargarSesiones(), cargarEstadisticas()])
  } catch (error) {
    sesionesError.value =
      error instanceof Error
        ? error.message
        : 'No se pudieron borrar las mediciones.'
  } finally {
    if (sesionEliminando.value === sesion.id) {
      sesionEliminando.value = null
    }
  }
}

// Estadísticas
async function cargarEstadisticas() {
  cargandoEstadisticas.value = true
  estadisticasError.value = null

  try {
    const response = await fetch(`${apiBaseUrl}/estadisticas`)
    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      const message =
        (payload as { message?: string } | null)?.message ??
        'No se pudieron calcular las estadísticas.'
      throw new Error(message)
    }

    if (!payload) {
      throw new Error('Respuesta inesperada del servidor.')
    }

    estadisticas.value = payload as EstadisticasPayload
  } catch (error) {
    estadisticas.value = null
    estadisticasError.value =
      error instanceof Error
        ? error.message
        : 'No se pudieron calcular las estadísticas.'
  } finally {
    cargandoEstadisticas.value = false
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding-bottom: 40px;
}

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

.tab-content {
  padding: 0 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

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
}
</style>
