<template>
  <div class="historial-tab">
    <div class="card">
      <h2>📋 Historial de Sesiones</h2>
      
      <p v-if="loading" class="info-message">⏳ Cargando sesiones...</p>
      <p v-else-if="error" class="error-message">{{ error }}</p>
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
                <button
                  type="button"
                  class="btn btn-small btn-danger"
                  @click="handleDelete(sesion)"
                  :disabled="
                    sesion.mediciones === 0 ||
                    deletingId === sesion.id ||
                    loading
                  "
                >
                  {{ deletingId === sesion.id ? '⏳' : '🗑️' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

interface Props {
  sesiones: SesionResumen[]
  loading: boolean
  error: string | null
  deletingId: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  delete: [sesion: SesionResumen]
}>()

function formatearFecha(valor: string | Date): string {
  const fecha = typeof valor === 'string' ? new Date(valor) : valor
  if (Number.isNaN(fecha.getTime())) {
    return 'Fecha inválida'
  }
  return fecha.toLocaleString()
}

function getNotaClass(nota: number): string {
  if (nota >= 4.5) return 'nota-alta'
  if (nota >= 3.0) return 'nota-media'
  return 'nota-baja'
}

function handleDelete(sesion: SesionResumen) {
  if (sesion.mediciones === 0) return
  
  const confirmado = window.confirm(
    `Se eliminarán ${sesion.mediciones} mediciones de la sesión "${sesion.curso}". Esta acción no se puede deshacer. ¿Continuar?`
  )
  
  if (confirmado) {
    emit('delete', sesion)
  }
}
</script>

<style scoped>
.historial-tab {
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

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.btn-small {
  padding: 8px 16px;
  font-size: 14px;
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

@media (max-width: 768px) {
  .card {
    padding: 20px;
  }
  
  .card h2 {
    font-size: 20px;
  }
}
</style>
