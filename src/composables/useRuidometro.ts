import { ref, computed } from 'vue'
import { io } from 'socket.io-client'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const socket = io(apiBaseUrl, { transports: ['websocket'] })

const UMBRAL_ADVERTENCIA = Number(import.meta.env.VITE_UMBRAL_ADVERTENCIA ?? 45)
const UMBRAL_CRITICO = Number(import.meta.env.VITE_UMBRAL_CRITICO ?? 70)

export function useRuidometro() {
    // Estado de conexión
    const conectado = ref(false)
    const nivel = ref(0)
    const color = ref('green')
    const sensitivity = ref(1.0) // Multiplicador de sensibilidad (0.5 - 9.0)

    // Estado de sesión
    const medicionActiva = ref(false)
    const sesionId = ref<string | null>(null)
    const docente = ref('')
    const curso = ref('')
    const notaInicial = ref(5.0)
    const notaActual = ref(5.0)

    // Estado de calificación
    const notaAnimando = ref(false)
    const tiempoSilencio = ref(0)
    const tiempoRuidoso = ref(0)
    const ultimaPenalizacion = ref(0)
    const ultimaRegeneracion = ref(0)

    // Estado de umbrales
    type EstadoUmbral = 'normal' | 'alerta' | 'critico'
    const estadoUmbral = ref<EstadoUmbral>('normal')

    // Computed
    const estadoMensaje = computed(() =>
        conectado.value ? 'Servidor conectado' : 'Servidor desconectado'
    )

    const estadoColor = computed(() =>
        conectado.value ? 'status-ok' : 'status-error'
    )

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

    // Socket events
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

    // Funciones
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

    return {
        // Estado
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
        estadoUmbral,

        // Computed
        estadoMensaje,
        estadoColor,
        alertaActiva,
        alertaMensaje,
        circleEstadoClase,
        gradeColorClass,
        gradeStatusText,

        // Funciones
        actualizarColor,
        evaluarUmbrales,
        actualizarNota,

        // Constantes
        UMBRAL_ADVERTENCIA,
        UMBRAL_CRITICO,
        apiBaseUrl,
        socket,
    }
}
