# VRIS - Sistema de Control de Asistencia a Eventos (Backend)

## 📋 Descripción General

Este es el backend del sistema de control de asistencia a eventos desarrollado con Django. El sistema permite gestionar eventos, participantes, sesiones y control de asistencia mediante códigos QR.

## 🏗️ Arquitectura del Sistema

### Modelos Principales

#### 1. **User** (Usuario del Sistema)
- **Propósito**: Usuarios administrativos del sistema (no participantes)
- **Campos principales**:
  - `email`: Identificador único
  - `first_name`, `last_name`: Nombre completo
  - `user_type`: Tipo de usuario (admin, vicerrectora, director_nacional, staff)
  - `phone`: Teléfono de contacto
  - `is_active`, `is_staff`: Permisos del sistema

#### 2. **Participant** (Participante)
- **Propósito**: Personas que participan en eventos (sin cuenta de usuario)
- **Campos principales**:
  - `first_name`, `last_name`: Nombre completo
  - `email`: Email único
  - `phone`: Teléfono
  - `identification_number`: Cédula/pasaporte
  - `type`: Tipo (Estudiante/Profesional)
  - `career`: Carrera o profesión

#### 3. **Event** (Evento)
- **Propósito**: Eventos que pueden tener múltiples sesiones
- **Campos principales**:
  - `title`: Título del evento
  - `description`: Descripción detallada
  - `location`: Ubicación
  - `capacity`: Capacidad máxima
  - `status`: Estado (Borrador, Publicado, Cancelado, Completado)
  - `start_date`, `end_date`: Fechas del evento
  - `registration_deadline`: Fecha límite de inscripción
  - `requires_attendance_for_certificate`: Si requiere asistencia para certificado
  - `minimum_attendance_percentage`: Porcentaje mínimo de asistencia

#### 4. **EventSession** (Sesión del Evento)
- **Propósito**: Sesiones individuales dentro de un evento
- **Campos principales**:
  - `event`: Evento al que pertenece
  - `session_date`: Fecha de la sesión
  - `start_time`, `end_time`: Horarios
  - `session_name`: Nombre de la sesión (opcional)
  - `is_active`: Si la sesión está activa

#### 5. **Registration** (Inscripción)
- **Propósito**: Inscripción de un participante a un evento
- **Campos principales**:
  - `event`: Evento
  - `participant`: Participante
  - `registration_code`: Código único para QR
  - `status`: Estado (Pendiente, Confirmado, Cancelado)
  - `registered_at`: Fecha de inscripción
  - `notes`: Notas adicionales

#### 6. **Attendance** (Asistencia)
- **Propósito**: Registro de asistencia a sesiones específicas
- **Campos principales**:
  - `registration`: Inscripción
  - `session`: Sesión específica
  - `checked_in_at`: Fecha y hora de check-in
  - `checked_in_by`: Usuario que procesó el check-in
  - `location`: Ubicación del check-in
  - `notes`: Notas adicionales

#### 7. **Certificate** (Certificado)
- **Propósito**: Certificados virtuales para participantes
- **Campos principales**:
  - `registration`: Inscripción asociada
  - `certificate_code`: Código único del certificado
  - `issued_at`: Fecha de emisión
  - `issued_by`: Usuario que emitió el certificado
  - `is_active`: Si el certificado está activo

## 🔄 Flujo del Sistema

### 1. **Creación de Evento**
```
User → Event → EventSession(s)
```

### 2. **Inscripción de Participante**
```
Participant → Registration → Event
```

### 3. **Control de Asistencia**
```
Registration → Attendance → EventSession
```

### 4. **Emisión de Certificado**
```
Registration → Certificate (si cumple requisitos)
```

## 🛠️ Tecnologías Utilizadas

- **Django 5.2.7**: Framework web principal
- **Django REST Framework**: API REST
- **Django Channels**: WebSockets para tiempo real
- **SQLite**: Base de datos (desarrollo)
- **QRCode**: Generación de códigos QR
- **JWT**: Autenticación
- **CORS**: Manejo de CORS para frontend

## 📁 Estructura del Proyecto

```
attendance/
├── checkvris/           # App principal
│   ├── models.py       # Modelos de datos
│   ├── admin.py        # Configuración del admin
│   ├── views.py        # Vistas de la API
│   ├── serializers.py  # Serializadores
│   └── urls.py         # URLs de la app
├── vris_attendance/    # Configuración del proyecto
│   ├── settings.py     # Configuración principal
│   ├── urls.py         # URLs principales
│   └── wsgi.py         # WSGI
├── manage.py           # Script de gestión
├── requirements.txt    # Dependencias
└── db.sqlite3         # Base de datos
```

## 🚀 Instalación y Configuración

### 1. **Instalar Dependencias**
```bash
pip install -r requirements.txt
```

### 2. **Configurar Base de Datos**
```bash
python manage.py migrate
```

### 3. **Crear Superusuario**
```bash
python manage.py createsuperuser
```

### 4. **Ejecutar Servidor**
```bash
python manage.py runserver
```

## 🔌 API Endpoints

### Flujo de certificados vigente

1. El organizador crea evento y sesiones, confirma inscripciones y registra asistencia. El participante puede crear su cuenta después, usando **el mismo correo** de la inscripción.
2. Solo las inscripciones confirmadas con **más del 50 % de las sesiones activas** asistidas son elegibles; exactamente la mitad no basta. `GET /attendance/certificates/eligible/?event=<uuid>` lista los elegibles.
3. Tras revisar posibles correcciones, el organizador cierra definitivamente la asistencia con `POST /attendance/events/<uuid>/close-attendance/`. Desde ese momento no se pueden modificar sesiones, inscripciones ni asistencias del evento mediante la API.
4. El organizador emite individualmente con `POST /attendance/certificates/issue/` y `{"registration_id": "<uuid>"}`. El servidor revalida el umbral, congela los datos y envía un aviso por correo (el envío fallido no revierte la emisión). La cuenta puede aún no existir.
5. El titular inicia sesión y ve **solo** sus certificados en `/my-certificates`. Para recibir el SBT, vincula una billetera mediante una firma de desafío y solicita el registro en Sepolia. La cuenta emisora del backend paga el gas; el titular no necesita fondos.
6. `POST /attendance/certificates/<uuid>/sync/` consulta la confirmación; `GET /attendance/verify/<codigo>/` verifica públicamente que el hash, titular y bloqueo del token coincidan con el contrato.

La emisión en base de datos y la acuñación son estados distintos. Nunca se informa «verificado en blockchain» antes de obtener confirmación y comprobar el contrato. El SBT no se puede transferir.

Para activar Sepolia, despliega el contrato de `blockchain/` y configura `BLOCKCHAIN_RPC_URL`, `BLOCKCHAIN_CHAIN_ID=11155111`, `BLOCKCHAIN_CONTRACT_ADDRESS`, `BLOCKCHAIN_PRIVATE_KEY` y un `BACKEND_URL` público con HTTPS para sus metadatos. Las claves privadas solo se configuran en el servidor. Para mainnet se necesita otro despliegue, fondos reales y configuración separada (`BLOCKCHAIN_CHAIN_ID=1`). Los tokens de Sepolia no se trasladan automáticamente a mainnet.

### **Autenticación**
- `POST /api/auth/login/` - Iniciar sesión
- `POST /api/auth/refresh/` - Renovar token
- `POST /api/auth/logout/` - Cerrar sesión

### **Eventos**
- `GET /api/events/` - Listar eventos
- `POST /api/events/` - Crear evento
- `GET /api/events/{id}/` - Obtener evento
- `PUT /api/events/{id}/` - Actualizar evento
- `DELETE /api/events/{id}/` - Eliminar evento

### **Participantes**
- `GET /api/participants/` - Listar participantes
- `POST /api/participants/` - Crear participante
- `GET /api/participants/{id}/` - Obtener participante

### **Inscripciones**
- `GET /api/registrations/` - Listar inscripciones
- `POST /api/registrations/` - Crear inscripción
- `GET /api/registrations/{id}/` - Obtener inscripción

### **Asistencia**
- `POST /api/attendance/check-in/` - Registrar asistencia
- `GET /api/attendance/` - Listar asistencias

### **Certificados**
- `GET /api/certificates/` - Listar certificados
- `POST /api/certificates/issue/` - Emitir certificado
- `GET /api/certificates/{code}/` - Verificar certificado

## 🔐 Autenticación

El sistema utiliza JWT (JSON Web Tokens) para la autenticación:

- **Access Token**: Válido por 1 hora
- **Refresh Token**: Válido por 7 días
- **Headers requeridos**: `Authorization: Bearer <token>`

## 📱 Códigos QR

### **Generación**
- Cada inscripción genera un código QR único
- El QR contiene el `registration_code`
- Se genera dinámicamente (no se almacena)

### **Escaneo**
- El QR se escanea para registrar asistencia
- Se valida que la inscripción esté confirmada
- Se registra la asistencia a la sesión específica

## 🎯 Funcionalidades Clave

### **1. Múltiples Sesiones por Evento**
- Un evento puede tener varias sesiones
- Cada sesión tiene fecha y hora específica
- La asistencia se registra por sesión

### **2. Control de Asistencia Flexible**
- Check-in por código QR
- Validación de sesiones activas
- Registro de ubicación y notas

### **3. Sistema de Certificados**
- Certificados automáticos basados en asistencia
- Configuración flexible de requisitos
- Verificación pública de certificados

### **4. Gestión de Usuarios**
- Diferentes tipos de usuario
- Permisos granulares
- Autenticación segura

## 🔧 Configuración de Desarrollo

### **Variables de Entorno**
```python
DEBUG = True
SECRET_KEY = 'your-secret-key'
DATABASE_URL = 'sqlite:///db.sqlite3'
ALLOWED_HOSTS = ['localhost', '127.0.0.1']
```

### **CORS**
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

## 📊 Base de Datos

### **Relaciones Principales**
- `Event` → `EventSession` (1:N)
- `Event` → `Registration` (1:N)
- `Participant` → `Registration` (1:N)
- `Registration` → `Attendance` (1:N)
- `Registration` → `Certificate` (1:1)

### **Índices y Restricciones**
- Email único en User y Participant
- Registration única por Event-Participant
- Attendance única por Registration-Session

## 🚀 Despliegue

### **Producción**
1. Configurar base de datos PostgreSQL
2. Configurar variables de entorno
3. Ejecutar migraciones
4. Configurar servidor web (Nginx + Gunicorn)
5. Configurar SSL/HTTPS

### **Docker** (Opcional)
```dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

## 📝 Notas de Desarrollo

- **UUIDs**: Todos los modelos usan UUIDs como claves primarias
- **Timestamps**: Campos `created_at` y `updated_at` automáticos
- **Soft Delete**: No se implementa, se usan campos `is_active`
- **Validaciones**: Se implementan en modelos y serializadores
- **Permisos**: Se configuran por tipo de usuario

## 🔄 Integración con Frontend

El backend está diseñado para integrarse con el frontend React:

- **API REST**: Endpoints estándar
- **CORS**: Configurado para desarrollo
- **JWT**: Tokens para autenticación
- **WebSockets**: Para actualizaciones en tiempo real
- **QR Codes**: Generación dinámica de códigos

## 📞 Soporte

Para soporte técnico o consultas sobre el backend, contactar al equipo de desarrollo VRIS.
