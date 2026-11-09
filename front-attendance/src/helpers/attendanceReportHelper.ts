import httpClient from './httpClient'

export interface AttendanceReportData {
    participant: {
        first_name: string
        last_name: string
        email: string
        identification_number: string
        participant_type: string
        type?: string // Campo alternativo
    }
    registration: {
        status: string
    }
    sessions_attended: number
    total_sessions: number
    attendance_percentage: number
    attended_sessions: string[]
}

/**
 * Genera un reporte de asistencia para un evento específico
 * @param eventId ID del evento
 * @returns Array con los datos del reporte
 */
export async function generateAttendanceReport(eventId: string): Promise<AttendanceReportData[]> {
    try {
        // Obtener todas las sesiones del evento
        const sessionsResponse = await httpClient.getEventSessions(eventId)
        const sessions = sessionsResponse.data.results || sessionsResponse.data

        if (!sessions || sessions.length === 0) {
            throw new Error('El evento no tiene sesiones configuradas')
        }

        // Obtener TODAS las inscripciones del evento
        const registrationsResponse = await httpClient.get(`/registrations/?event=${eventId}&page_size=10000`)
        const registrations = registrationsResponse.data.results || registrationsResponse.data

        if (!registrations || registrations.length === 0) {
            return []
        }

        // Mapa para almacenar información de asistencias por participante
        const attendanceMap = new Map<string, {
            attendedSessions: string[]
            sessionsAttended: number
        }>()

        // Obtener asistencias de todas las sesiones
        for (const session of sessions) {
            try {
                const attendanceResponse = await httpClient.get(`/attendances/?session=${session.id}&page_size=10000`)
                const attendances = attendanceResponse.data.results || attendanceResponse.data

                // Procesar cada asistencia
                for (const attendance of attendances) {
                    const participantId = attendance.registration.participant.id

                    if (!attendanceMap.has(participantId)) {
                        attendanceMap.set(participantId, {
                            attendedSessions: [],
                            sessionsAttended: 0
                        })
                    }

                    // Agregar esta sesión a las asistencias del participante
                    const participantData = attendanceMap.get(participantId)!
                    participantData.sessionsAttended++
                    participantData.attendedSessions.push(
                        `${session.session_name || 'Sesión'} (${session.session_date})`
                    )
                }
            } catch (err) {
                console.error(`Error obteniendo asistencias para sesión ${session.id}:`, err)
            }
        }

        // Generar reporte para TODOS los inscritos
        const reportData: AttendanceReportData[] = registrations.map((registration: any) => {
            const participantId = registration.participant.id
            const attendanceData = attendanceMap.get(participantId)

            const sessionsAttended = attendanceData?.sessionsAttended || 0
            const attendedSessions = attendanceData?.attendedSessions || []

            const attendancePercentage = sessions.length > 0
                ? Math.round((sessionsAttended / sessions.length) * 100)
                : 0

            return {
                participant: registration.participant,
                registration: {
                    status: registration.status
                },
                sessions_attended: sessionsAttended,
                total_sessions: sessions.length,
                attendance_percentage: attendancePercentage,
                attended_sessions: attendedSessions
            }
        })

        // Ordenar por apellido
        reportData.sort((a, b) =>
            a.participant.last_name.localeCompare(b.participant.last_name)
        )

        return reportData
    } catch (error) {
        console.error('Error generando reporte de asistencia:', error)
        throw error
    }
}

/**
 * Descarga el reporte de asistencia como archivo Excel usando ExcelJS
 * @param eventId ID del evento
 * @param eventName Nombre del evento
 */
export async function downloadAttendanceReportExcel(eventId: string, eventName: string): Promise<void> {
    try {
        // Importar dinámicamente exceljs (ya está instalado en el proyecto)
        const ExcelJS = await import('exceljs')

        // Generar datos del reporte
        const reportData = await generateAttendanceReport(eventId)

        if (reportData.length === 0) {
            throw new Error('No hay participantes inscritos en este evento')
        }

        // Crear workbook y worksheet
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Reporte de Asistencia')

        // Definir columnas
        worksheet.columns = [
            { header: '#', key: 'index', width: 5 },
            { header: 'Nombre', key: 'first_name', width: 15 },
            { header: 'Apellido', key: 'last_name', width: 15 },
            { header: 'Tipo', key: 'type', width: 12 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Teléfono', key: 'phone', width: 15 },
            { header: 'Estado', key: 'status', width: 12 },
            { header: 'Sesiones Asistidas', key: 'sessions_attended', width: 18 },
            { header: 'Porcentaje', key: 'percentage', width: 12 },
            { header: 'Detalle de Sesiones', key: 'session_details', width: 50 }
        ]

        // Estilo del encabezado
        worksheet.getRow(1).font = { bold: true, size: 11 }
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF8B004B' } // Color principal del proyecto
        }
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }
        worksheet.getRow(1).height = 25

        // Agregar datos
        reportData.forEach((item, index) => {
            const row = worksheet.addRow({
                index: index + 1,
                first_name: item.participant.first_name,
                last_name: item.participant.last_name,
                type: item.participant.participant_type || item.participant.type || 'N/A',
                email: item.participant.email,
                phone: item.participant.identification_number,
                status: item.registration.status,
                sessions_attended: `${item.sessions_attended}/${item.total_sessions}`,
                percentage: `${item.attendance_percentage}%`,
                session_details: item.attended_sessions.join(', ') || 'Ninguna'
            })

            // Colorear la fila según el porcentaje de asistencia
            const percentage = item.attendance_percentage
            let fillColor = 'FFFFFFFF' // Blanco por defecto

            if (percentage >= 80) {
                fillColor = 'FFD4EDDA' // Verde claro
            } else if (percentage >= 50) {
                fillColor = 'FFFFF3CD' // Amarillo claro
            } else if (percentage > 0) {
                fillColor = 'FFF8D7DA' // Rojo claro
            }

            row.eachCell((cell: any) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: fillColor }
                }
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                }
                cell.alignment = { vertical: 'middle' }
            })

            // Centrar columnas numéricas
            row.getCell('index').alignment = { vertical: 'middle', horizontal: 'center' }
            row.getCell('sessions_attended').alignment = { vertical: 'middle', horizontal: 'center' }
            row.getCell('percentage').alignment = { vertical: 'middle', horizontal: 'center' }
        })

        // Generar archivo y descargar
        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')

        link.setAttribute('href', url)
        const fileName = `Reporte_Asistencia_${eventName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
        link.setAttribute('download', fileName)
        link.style.visibility = 'hidden'

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

    } catch (error) {
        console.error('Error descargando reporte Excel:', error)
        throw error
    }
}

/**
 * Descarga el reporte de asistencia como archivo CSV
 * @param eventId ID del evento
 * @param eventName Nombre del evento
 */
export async function downloadAttendanceReportCSV(eventId: string, eventName: string): Promise<void> {
    try {
        const reportData = await generateAttendanceReport(eventId)

        if (reportData.length === 0) {
            throw new Error('No hay participantes inscritos en este evento')
        }

        // Preparar CSV
        const headers = [
            '#',
            'Nombre',
            'Apellido',
            'Tipo',
            'Email',
            'Teléfono',
            'Estado',
            'Sesiones Asistidas',
            'Porcentaje',
            'Detalle de Sesiones'
        ]

        const rows = reportData.map((item, index) => [
            index + 1,
            item.participant.first_name,
            item.participant.last_name,
            item.participant.participant_type || item.participant.type || 'N/A',
            item.participant.email,
            item.participant.identification_number,
            item.registration.status,
            `${item.sessions_attended}/${item.total_sessions}`,
            `${item.attendance_percentage}%`,
            item.attended_sessions.join(', ') || 'Ninguna'
        ])

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n')

        // Crear blob y descargar
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)

        link.setAttribute('href', url)
        link.setAttribute('download', `Reporte_Asistencia_${eventName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

    } catch (error) {
        console.error('Error descargando reporte CSV:', error)
        throw error
    }
}
