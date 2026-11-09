import React, { useState, useEffect } from 'react'
import { Form } from 'react-bootstrap'

interface TimeInputProps {
    label?: string
    value: string // Formato: "HH:MM" en 12 horas
    onChange: (value: string) => void
    required?: boolean
}

const TimeInput: React.FC<TimeInputProps> = ({ label, value, onChange, required = false }) => {
    const [hours, setHours] = useState('')
    const [minutes, setMinutes] = useState('')
    const [period, setPeriod] = useState<'AM' | 'PM'>('AM')

    // Parsear el valor inicial
    useEffect(() => {
        if (value && value.includes(':')) {
            const [time] = value.split(' ')
            const [h, m] = time.split(':')

            let hour = parseInt(h) || 0
            let newPeriod: 'AM' | 'PM' = 'AM'

            if (hour >= 12) {
                newPeriod = 'PM'
                if (hour > 12) hour -= 12
            } else if (hour === 0) {
                hour = 12
            }

            setHours(hour.toString())
            setMinutes(m || '')
            setPeriod(newPeriod)
        }
    }, [value])

    // Actualizar el valor cuando cambian las partes
    const updateValue = (h: string, m: string, p: 'AM' | 'PM') => {
        if (!h || !m) return

        let hour = parseInt(h) || 0
        const minute = parseInt(m) || 0

        // Convertir a formato 24 horas
        if (p === 'PM' && hour !== 12) {
            hour += 12
        } else if (p === 'AM' && hour === 12) {
            hour = 0
        }

        const formattedHour = hour.toString().padStart(2, '0')
        const formattedMinute = minute.toString().padStart(2, '0')

        onChange(`${formattedHour}:${formattedMinute}`)
    }

    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '') // Solo números
        if (val.length <= 2) {
            setHours(val)
        }
    }

    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '') // Solo números
        if (val.length <= 2) {
            setMinutes(val)
        }
    }

    const handleHoursBlur = () => {
        if (hours) {
            let h = parseInt(hours) || 1
            // Validar rango 1-12
            if (h < 1) h = 1
            if (h > 12) h = 12
            const formatted = h.toString()
            setHours(formatted)
            updateValue(formatted, minutes, period)
        }
    }

    const handleMinutesBlur = () => {
        if (minutes) {
            let m = parseInt(minutes) || 0
            // Validar rango 0-59
            if (m < 0) m = 0
            if (m > 59) m = 59
            const formatted = m.toString().padStart(2, '0')
            setMinutes(formatted)
            updateValue(hours, formatted, period)
        }
    }

    const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
        setPeriod(newPeriod)
        if (hours && minutes) {
            updateValue(hours, minutes, newPeriod)
        }
    }

    return (
        <div>
            {label && (
                <Form.Label className="fw-bold" style={{ color: '#0a192f', fontSize: '0.95rem' }}>
                    <i className="ri-time-line me-2"></i>
                    {label} {required && '*'}
                </Form.Label>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Campos de hora y minutos */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Horas */}
                    <input
                        type="text"
                        inputMode="numeric"
                        value={hours}
                        onChange={handleHoursChange}
                        onBlur={handleHoursBlur}
                        placeholder="10"
                        maxLength={2}
                        required={required}
                        style={{
                            width: '60px',
                            padding: '0.75rem 0.5rem',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            textAlign: 'center',
                            border: '2px solid #e0e0e0',
                            borderRadius: '10px',
                            outline: 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                    />

                    {/* Separador */}
                    <span style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#0a192f',
                        userSelect: 'none'
                    }}>
                        :
                    </span>

                    {/* Minutos */}
                    <input
                        type="text"
                        inputMode="numeric"
                        value={minutes}
                        onChange={handleMinutesChange}
                        onBlur={handleMinutesBlur}
                        placeholder="00"
                        maxLength={2}
                        required={required}
                        style={{
                            width: '60px',
                            padding: '0.75rem 0.5rem',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            textAlign: 'center',
                            border: '2px solid #e0e0e0',
                            borderRadius: '10px',
                            outline: 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#ffc107'}
                    />
                </div>

                {/* Botones AM/PM */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        type="button"
                        onClick={() => handlePeriodChange('AM')}
                        style={{
                            flex: 1,
                            padding: '0.6rem',
                            fontSize: '0.95rem',
                            fontWeight: '700',
                            border: period === 'AM' ? '2px solid #0a192f' : '2px solid #e0e0e0',
                            borderRadius: '8px',
                            background: period === 'AM'
                                ? 'linear-gradient(135deg, #0a192f 0%, #ffc107 100%)'
                                : 'white',
                            color: period === 'AM' ? 'white' : '#666',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: period === 'AM' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none'
                        }}
                    >
                        AM
                    </button>
                    <button
                        type="button"
                        onClick={() => handlePeriodChange('PM')}
                        style={{
                            flex: 1,
                            padding: '0.6rem',
                            fontSize: '0.95rem',
                            fontWeight: '700',
                            border: period === 'PM' ? '2px solid #0a192f' : '2px solid #e0e0e0',
                            borderRadius: '8px',
                            background: period === 'PM'
                                ? 'linear-gradient(135deg, #0a192f 0%, #ffc107 100%)'
                                : 'white',
                            color: period === 'PM' ? 'white' : '#666',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: period === 'PM' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none'
                        }}
                    >
                        PM
                    </button>
                </div>
            </div>
        </div>
    )
}

export default TimeInput
