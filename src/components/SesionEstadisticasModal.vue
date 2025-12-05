<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <!-- Header -->
      <div class="modal-header">
        <h2>📊 Estadísticas de Sesión</h2>
        <button class="btn-close" @click="$emit('close')" title="Cerrar">✕</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="modal-body">
        <p class="info-message">⏳ Cargando estadísticas...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="modal-body">
        <p class="error-message">{{ error }}</p>
        <button class="btn btn-primary" @click="$emit('close')">Cerrar</button>
      </div>

      <!-- Estadísticas -->
      <div v-else-if="estadisticas" class="modal-body">
        <!-- Info básica -->
        <div class="session-info">
          <div class="info-badge">
            <span class="icon">👨‍🏫</span>
            <span>{{ estadisticas.docente }}</span>
          </div>
          <div class="info-badge">
            <span class="icon">🎓</span>
            <span>{{ estadisticas.curso }}</span>
          </div>
          <div class="info-badge">
            <span class="icon">⏱️</span>
            <span>{{ estadisticas.duracionMinutos }} min</span>
          </div>
        </div>

        <!-- Cards de métricas -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon">📝</div>
            <div class="metric-label">Nota</div>
            <div class="metric-value">
              {{ estadisticas.notaInicial.toFixed(1) }} → {{ estadisticas.notaFinal.toFixed(1) }}
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon">📊</div>
            <div class="metric-label">Promedio</div>
            <div class="metric-value">{{ estadisticas.promedioRuido.toFixed(1) }} dB</div>
          </div>

          <div class="metric-card">
            <div class="metric-icon">📈</div>
            <div class="metric-label">Máximo</div>
            <div class="metric-value">{{ estadisticas.nivelMaximo.toFixed(1) }} dB</div>
          </div>

          <div class="metric-card">
            <div class="metric-icon">📉</div>
            <div class="metric-label">Mínimo</div>
            <div class="metric-value">{{ estadisticas.nivelMinimo.toFixed(1) }} dB</div>
          </div>

          <div class="metric-card">
            <div class="metric-icon">📏</div>
            <div class="metric-label">Mediciones</div>
            <div class="metric-value">{{ estadisticas.totalMediciones.toLocaleString() }}</div>
          </div>
        </div>

        <!-- Gráfico -->
        <div v-if="estadisticas.medicionesPorMinuto.length > 0" class="chart-section">
          <h3>📈 Evolución del Ruido por Minuto</h3>
          <canvas ref="chartCanvas"></canvas>
        </div>
        <p v-else class="info-message">
          📭 No hay suficientes datos para mostrar el gráfico.
        </p>

        <!-- Botón cerrar -->
        <div class="modal-footer">
          <button class="btn btn-primary" @click="$emit('close')">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import Chart from 'chart.js/auto'

interface EstadisticasSesion {
  sesionId: string
  docente: string
  curso: string
  inicio: Date
  fin: Date | null
  duracionMinutos: number
  notaInicial: number
  notaFinal: number
  totalMediciones: number
  promedioRuido: number
  nivelMaximo: number
  nivelMinimo: number
  medicionesPorMinuto: Array<{
    minuto: number
    promedio: number
    cantidad: number
  }>
}

interface Props {
  visible: boolean
  sesionId: string | null
  apiBaseUrl: string
}

const props = defineProps<Props>()
defineEmits<{ close: [] }>()

const estadisticas = ref<EstadisticasSesion | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

watch(() => [props.visible, props.sesionId], async () => {
  if (props.visible && props.sesionId) {
    await cargarEstadisticas()
  } else {
    estadisticas.value = null
    destruirGrafico()
  }
}, { immediate: true })

watch(() => [estadisticas.value, chartCanvas.value], () => {
  renderGrafico()
}, { deep: true })

async function cargarEstadisticas() {
  if (!props.sesionId) return

  loading.value = true
  error.value = null

  try {
    const response = await fetch(`${props.apiBaseUrl}/sesiones/${props.sesionId}/estadisticas`)
    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      const message = (payload as { message?: string } | null)?.message ?? 'No se pudieron cargar las estadísticas.'
      throw new Error(message)
    }

    estadisticas.value = payload as EstadisticasSesion
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error desconocido'
  } finally {
    loading.value = false
  }
}

function renderGrafico() {
  destruirGrafico()

  if (!estadisticas.value || !chartCanvas.value || estadisticas.value.medicionesPorMinuto.length === 0) {
    return
  }

  const datos = estadisticas.value.medicionesPorMinuto

  chart = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels: datos.map((item) => `Min ${item.minuto}`),
      datasets: [
        {
          label: 'Promedio (dB)',
          data: datos.map((item) => Number(item.promedio.toFixed(1))),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const minuto = datos[context.dataIndex]
              return [
                `Promedio: ${minuto.promedio.toFixed(1)} dB`,
                `Mediciones: ${minuto.cantidad}`,
              ]
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Nivel de Ruido (dB)' },
        },
        x: {
          title: { display: true, text: 'Tiempo' },
        },
      },
    },
  })
}

function destruirGrafico() {
  if (chart) {
    chart.destroy()
    chart = null
  }
}

onBeforeUnmount(() => {
  destruirGrafico()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px;
  border-bottom: 2px solid #f0f0f0;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
  font-weight: 700;
}

.btn-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background-color: #f0f0f0;
  color: #333;
}

.modal-body {
  padding: 30px;
}

.session-info {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.info-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: #f8f9fa;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #555;
}

.info-badge .icon {
  font-size: 18px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.metric-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 16px;
  text-align: center;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  transition: transform 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-5px);
}

.metric-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.metric-label {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 20px;
  font-weight: 900;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.chart-section {
  margin-bottom: 30px;
}

.chart-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.chart-section canvas {
  width: 100% !important;
  height: 300px !important;
}

.info-message {
  text-align: center;
  padding: 20px;
  background-color: #d1ecf1;
  color: #0c5460;
  border-radius: 10px;
  font-weight: 600;
  margin: 20px 0;
}

.error-message {
  text-align: center;
  padding: 20px;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 10px;
  font-weight: 600;
  margin: 20px 0;
}

.modal-footer {
  display: flex;
  justify-content: center;
  padding-top: 20px;
}

.btn {
  padding: 12px 32px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

@media (max-width: 768px) {
  .modal-content {
    max-height: 95vh;
  }

  .modal-header {
    padding: 20px;
  }

  .modal-header h2 {
    font-size: 20px;
  }

  .modal-body {
    padding: 20px;
  }

  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .metric-icon {
    font-size: 24px;
  }

  .metric-value {
    font-size: 16px;
  }
}
</style>
