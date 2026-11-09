// Helper para formatear fechas de manera consistente
// El backend Django está configurado para America/La_Paz (Bolivia, UTC-4)
// Estos helpers aseguran que las fechas se manejen correctamente sin problemas de zona horaria

/**
 * Formatea una fecha en formato ISO (YYYY-MM-DD) sin considerar zona horaria
 * Esto evita que las fechas se muestren con un día de diferencia
 */
export const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return ''

    // Si ya está en formato YYYY-MM-DD, retornar tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString
    }

    // Parsear la fecha sin considerar zona horaria
    const date = new Date(dateString + 'T00:00:00')
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

/**
 * Formatea una fecha para mostrar en español (ej: "sábado, 7 de diciembre de 2025")
 */
export const formatDateToSpanish = (dateString: string): string => {
    if (!dateString) return ''

    // Crear fecha sin considerar zona horaria
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)

    return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

/**
 * Formatea una fecha para mostrar de forma corta (ej: "07/12/2025")
 */
export const formatDateShort = (dateString: string): string => {
    if (!dateString) return ''

    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)

    return date.toLocaleDateString('es-ES')
}

/**
 * Formatea una hora en formato 24h a 12h con AM/PM
 */
export const formatTimeTo12Hour = (time24: string): string => {
    if (!time24) return ''

    const [hours, minutes] = time24.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hours12 = hours % 12 || 12

    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD (sin zona horaria)
 */
export const getTodayDate = (): string => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

/**
 * Compara dos fechas (retorna true si date1 es después de date2)
 */
export const isDateAfter = (date1: string, date2: string): boolean => {
    const [y1, m1, d1] = date1.split('-').map(Number)
    const [y2, m2, d2] = date2.split('-').map(Number)

    const d1Obj = new Date(y1, m1 - 1, d1)
    const d2Obj = new Date(y2, m2 - 1, d2)

    return d1Obj > d2Obj
}

/**
 * Calcula la diferencia en días entre dos fechas
 */
export const getDaysDifference = (startDate: string, endDate: string): number => {
    const [y1, m1, d1] = startDate.split('-').map(Number)
    const [y2, m2, d2] = endDate.split('-').map(Number)

    const start = new Date(y1, m1 - 1, d1)
    const end = new Date(y2, m2 - 1, d2)

    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
}
