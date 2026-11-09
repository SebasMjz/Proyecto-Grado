# Guia de ejecucion local (Backend + Frontend)

Esta guia te permite levantar el proyecto desde cero en Windows, usando dos terminales separadas.

## Requisitos previos

- Python 3.12+
- Node.js y npm
- PowerShell

## Estructura esperada

- Backend: C:/Users/sebas/Documents/GitHub/attendance
- Frontend: C:/Users/sebas/Documents/GitHub/front-attendance

## Terminal 1: Backend (Django)

### 1) Ir a la carpeta del backend

```powershell
cd C:\Users\sebas\Documents\GitHub\attendance
```

### 2) Crear venv (solo la primera vez)

```powershell
py -3 -m venv .venv
```

### 3) Activar venv

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1
```

### 4) Instalar dependencias

```powershell
pip install -r requirements.txt
```

### 5) Configurar variables de entorno para desarrollo

Si ya tienes archivo .env con valores reales, omite este paso.

```powershell
$env:SECRET_KEY='dev-local-secret-key'
$env:FRONTEND_URL='http://localhost:5173'
$env:EMAIL_USER='dev@example.com'
$env:EMAIL_PASSWD='dev-password'
```

### 6) Migraciones

```powershell
python manage.py migrate
```

### 7) Crear superusuario

```powershell
python manage.py createsuperuser
```

Completa los datos solicitados (email, nombre, apellido, password).

### 8) Levantar backend

```powershell
python manage.py runserver
```

Backend disponible en:
- http://127.0.0.1:8000/
- Admin: http://127.0.0.1:8000/admin/

## Terminal 2: Frontend (Vite + pnpm)

### 1) Ir a la carpeta del frontend

```powershell
cd C:\Users\sebas\Documents\GitHub\front-attendance
```

### 2) Instalar dependencias

El proyecto ha sido migrado a **pnpm**:

```powershell
pnpm install
```

### 3) Levantar frontend

```powershell
pnpm dev
```

Frontend disponible en:
- http://localhost:5173/

## Login de administrador

1. Abre http://127.0.0.1:8000/admin/
2. Inicia sesion con el superusuario creado en el backend.

## Crear mas superusuarios

Con backend activo o sin backend activo (solo con venv y variables), ejecuta:

```powershell
cd C:\Users\sebas\Documents\GitHub\attendance
.\.venv\Scripts\Activate.ps1
$env:SECRET_KEY='dev-local-secret-key'
$env:FRONTEND_URL='http://localhost:5173'
$env:EMAIL_USER='dev@example.com'
$env:EMAIL_PASSWD='dev-password'
python manage.py createsuperuser
```

Repite el ultimo comando cada vez que quieras crear otro.

## Detener servicios

- En la terminal del backend: Ctrl + C
- En la terminal del frontend: Ctrl + C

## Solucion de problemas rapida

### Error: Set the SECRET_KEY environment variable

Faltan variables de entorno en la sesion. Ejecuta:

```powershell
$env:SECRET_KEY='dev-local-secret-key'
$env:FRONTEND_URL='http://localhost:5173'
$env:EMAIL_USER='dev@example.com'
$env:EMAIL_PASSWD='dev-password'
```

### Error en npm install por dependencias

```powershell
npm install --legacy-peer-deps
```

### Error de estilos Sass al levantar frontend

Asegura instalacion limpia en frontend:

```powershell
npm install --legacy-peer-deps
npm run dev
```
