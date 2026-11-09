export interface Event {
  id: number
  name: string
  description: string
  date: string
  startTime: string
  endTime: string
  location: string
  status: 'active' | 'upcoming' | 'completed'
  maxParticipants: number
  currentParticipants: number
  requirements?: string
  image?: string
  attendanceChecks: number // Número de asistencias que puede tener el evento
}

export interface Participant {
  id: number
  name: string
  email: string
  phone: string
  institution: string
  checkIn?: string
  status: 'present' | 'absent'
  eventId: number
  avatar?: string
  attendanceChecks: { [key: number]: boolean } // Múltiples asistencias por evento
}

export const eventsData: Event[] = [
  {
    id: 1,
    name: 'Conferencia de Tecnología dApp Asistencia 2024',
    description: 'Conferencia anual sobre las últimas tendencias en tecnología, innovación y desarrollo de software',
    date: '2024-03-15',
    startTime: '09:00',
    endTime: '17:00',
    location: 'Auditorio Principal',
    status: 'active',
    maxParticipants: 200,
    currentParticipants: 150,
    requirements: 'Conocimientos básicos en programación',
    image: '/src/assets/images/eventos-vris/eventoAlice.jpg',
    attendanceChecks: 1 // Solo 1 asistencia
  },
  {
    id: 2,
    name: 'Workshop de Desarrollo Web Moderno',
    description: 'Taller práctico de desarrollo web con las últimas tecnologías: React, Node.js, y bases de datos',
    date: '2024-03-20',
    startTime: '14:00',
    endTime: '18:00',
    location: 'Sala de Computación - Edificio 320',
    status: 'upcoming',
    maxParticipants: 30,
    currentParticipants: 25,
    requirements: 'Laptop con Node.js instalado',
    image: '/src/assets/images/eventos-vris/eventoCocha.jpg',
    attendanceChecks: 3 // 3 asistencias
  },
  {
    id: 3,
    name: 'Seminario de Inteligencia Artificial',
    description: 'Introducción a la IA, machine learning y sus aplicaciones en el mundo real',
    date: '2024-03-25',
    startTime: '10:00',
    endTime: '12:00',
    location: 'Aula Magna - Facultad de Ingeniería',
    status: 'completed',
    maxParticipants: 100,
    currentParticipants: 80,
    requirements: 'Conocimientos básicos en matemáticas',
    image: '/src/assets/images/eventos-vris/eventoNose.jpg',
    attendanceChecks: 5 // 5 asistencias
  }
]

export const participantsData: Participant[] = [
  {
    id: 1,
    name: 'Juan Pérez',
    email: 'juan.perez@email.com',
    phone: '+57 300 123 4567',
    institution: 'Institución Demo',
    checkIn: '2024-03-15 08:45',
    status: 'present',
    eventId: 1,
    avatar: '/src/assets/images/users/avatar-1.jpg',
    attendanceChecks: { 1: true } // Evento 1 tiene 1 asistencia
  },
  {
    id: 2,
    name: 'María García',
    email: 'maria.garcia@email.com',
    phone: '+57 300 234 5678',
    institution: 'Universidad Nacional',
    checkIn: '2024-03-15 09:15',
    status: 'present',
    eventId: 1,
    avatar: '/src/assets/images/users/avatar-2.jpg',
    attendanceChecks: { 1: true } // Evento 1 tiene 1 asistencia
  },
  {
    id: 3,
    name: 'Carlos López',
    email: 'carlos.lopez@email.com',
    phone: '+57 300 345 6789',
    institution: 'Universidad Javeriana',
    checkIn: "null",
    status: 'absent',
    eventId: 1,
    avatar: '/src/assets/images/users/avatar-3.jpg',
    attendanceChecks: { 1: false } // Evento 1 tiene 1 asistencia
  },
  {
    id: 4,
    name: 'Ana Rodríguez',
    email: 'ana.rodriguez@email.com',
    phone: '+57 300 456 7890',
    institution: 'Universidad de los Andes',
    checkIn: '2024-03-15 09:30',
    status: 'present',
    eventId: 1,
    avatar: '/src/assets/images/users/avatar-4.jpg',
    attendanceChecks: { 1: true } // Evento 1 tiene 1 asistencia
  },
  {
    id: 5,
    name: 'Pedro Martínez',
    email: 'pedro.martinez@email.com',
    phone: '+57 300 567 8901',
    institution: 'Institución Demo',
    checkIn: "null",
    status: 'absent',
    eventId: 2,
    avatar: '/src/assets/images/users/avatar-5.jpg',
    attendanceChecks: { 1: false, 2: false, 3: false } // Evento 2 tiene 3 asistencias
  },
  {
    id: 6,
    name: 'Laura Sánchez',
    email: 'laura.sanchez@email.com',
    phone: '+57 300 678 9012',
    institution: 'Universidad Nacional',
    checkIn: '2024-03-20 13:45',
    status: 'present',
    eventId: 2,
    avatar: '/src/assets/images/users/avatar-6.jpg',
    attendanceChecks: { 1: true, 2: true, 3: false } // Evento 2 tiene 3 asistencias
  }
]
