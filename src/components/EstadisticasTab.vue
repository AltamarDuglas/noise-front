<template>
  <div class="estadisticas-tab">
    <div class="card">
      <h2>📈 Estadísticas y Análisis</h2>
      
      <p v-if="loading" class="info-message">
        ⏳ Calculando estadísticas...
      </p>
      <p v-else-if="error" class="error-message">{{ error }}</p>
      
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
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import Chart from 'chart.js/auto'

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

interface Props {
  estadisticas: EstadisticasPayload | null
  loading: boolean
  error: string | null
}

const props = defineProps<Props>()

const cursosChartCanvas = ref<HTMLCanvasElement | null>(null)
const diasChartCanvas = ref<HTMLCanvasElement | null>(null)

let cursosChart: Chart | null = null
let diasChart: Chart | null = null

watch(() => [props.estadisticas, cursosChartCanvas.value], () => {
  renderCursosChart()
}, { deep: true })

watch(() => [props.estadisticas, diasChartCanvas.value], () => {
  renderDiasChart()
}, { deep: true })

function renderCursosChart() {
  if (cursosChart) {
    cursosChart.destroy()
    cursosChart = null
  }

  if (
    !props.estadisticas ||
    props.estadisticas.promedioPorCurso.length === 0 ||
    !cursosChartCanvas.value
  ) {
    return
  }

  const datos = props.estadisticas.promedioPorCurso
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
      maintainAspectRatio: false,
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
    !props.estadisticas ||
    props.estadisticas.promedioPorDia.length === 0 ||
    !diasChartCanvas.value
  ) {
    return
  }

  const datos = props.estadisticas.promedioPorDia
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
      maintainAspectRatio: false,
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

function formatearDia(valor: string): string {
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) {
    return valor
  }
  return fecha.toLocaleDateString()
}

onBeforeUnmount(() => {
  if (cursosChart) {
    cursosChart.destroy()
    cursosChart = null
  }
  if (diasChart) {
    diasChart.destroy()
    diasChart = null
  }
})
</script>

<style scoped>
.estadisticas-tab {
  width: 100%;
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

.error-message {
  margin: 15px 0;
  padding: 12px 16px;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  text-align: center;
}

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

@media (max-width: 768px) {
  .card {
    padding: 20px;
  }
  
  .card h2 {
    font-size: 20px;
  }
}
</style>
