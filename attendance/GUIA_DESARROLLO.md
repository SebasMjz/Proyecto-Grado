# Guía de Ejecución en Modo Desarrollo (Frontend + Backend)

Esta guía detalla paso a paso cómo configurar, instalar y levantar el ecosistema completo de la dApp (Frontend en **React + Vite** con **pnpm**, y Backend en **Django REST Framework** con **Python**).

---

## 📋 Requisitos Previos

1. **Node.js**: Versión 18 o superior (recomendado v20+ o v24).
2. **pnpm**: Gestor de paquetes oficial del frontend (`pnpm --version`).  
   *Si no lo tienes instalado*:
   ```powershell
   npm install -g pnpm
   ```
3. **Python**: Versión 3.10, 3.11 o 3.12+.
4. **PowerShell** en Windows (o terminal Bash en Linux/macOS).

---

## 🗂️ Estructura de Carpetas

- **Backend (Django API)**: `c:\Users\Sebas\Documents\Github\attendance`
- **Frontend (dApp Web3 React)**: `c:\Users\Sebas\Documents\Github\front-attendance`

---

## 🚀 Terminal 1: Backend (Django REST Framework)

### 1. Navegar a la carpeta del backend
```powershell
cd c:\Users\Sebas\Documents\Github\attendance
```

### 2. Activar el Entorno Virtual (venv)
Si ya existe la carpeta `.venv`:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1
```
*(Aparecerá `(.venv)` al inicio de tu línea de comandos).*

> **Nota (Solo la primera vez)**: Si no tienes el entorno virtual creado, créalo con:
> ```powershell
> python -m venv .venv
> .\.venv\Scripts\Activate.ps1
> pip install -r requirements.txt
> ```

### 3. Configurar Variables de Entorno de Desarrollo
Define las variables necesarias para la sesión en PowerShell (o crea un archivo `.env`):
```powershell
$env:SECRET_KEY='dev-local-secret-key-blockchain-dapp'
$env:FRONTEND_URL='http://localhost:5173'
$env:EMAIL_USER='dev@univalle.edu'
$env:EMAIL_PASSWD='dev-password'
```

### 4. Aplicar Migraciones de Base de Datos
```powershell
python manage.py migrate
```

### 5. Crear Superusuario Administrador (Opcional)
```powershell
python manage.py createsuperuser
```
*Ingresa email, nombre, apellido y contraseña.*

### 6. Iniciar el Servidor de Desarrollo Backend
```powershell
python manage.py runserver 8000
```

✅ **Backend disponible en**:
- API REST: `http://127.0.0.1:8000/`
- Panel de Administración Django: `http://127.0.0.1:8000/admin/`

---

## ⚡ Terminal 2: Frontend (dApp Web3 - React + Vite + pnpm)

### 1. Abrir una nueva terminal y navegar al frontend
```powershell
cd c:\Users\Sebas\Documents\Github\front-attendance
```

### 2. Instalación de Dependencias con pnpm
El proyecto ha sido migrado exitosamente a **pnpm**. Ejecuta:
```powershell
pnpm install
```

> **Aprobación de scripts (solo si es necesario)**:  
> Si pnpm solicita autorización para binarios de compilación (como `esbuild`), ejecuta:
> ```powershell
> pnpm approve-builds --all
> ```

### 3. Levantar Servidor de Desarrollo Frontend
```powershell
pnpm dev
```

✅ **Frontend disponible en**:
- dApp: `http://localhost:5173/`

---

## 🔗 Resumen de URLs y Puertos

| Servicio | URL Local | Descripción |
|---|---|---|
| **Frontend dApp** | `http://localhost:5173/` | Dashboard, gestión de eventos y consola de certificados SBT |
| **Backend API** | `http://127.0.0.1:8000/` | Endpoints REST de asistencia, sesiones y eventos |
| **Django Admin** | `http://127.0.0.1:8000/admin/` | Panel administrativo de base de datos |

---

## 🛠️ Comandos Frecuentes

### Frontend (`front-attendance`)
- `pnpm dev`: Inicia el servidor de desarrollo Vite con Hot Module Replacement (HMR).
- `pnpm build`: Ejecuta validación estricta de tipos TypeScript (`tsc -b`) y empaqueta la aplicación con Vite para producción.
- `pnpm lint`: Ejecuta el linter ESLint.

### Backend (`attendance`)
- `python manage.py runserver`: Inicia servidor Django.
- `python manage.py makemigrations`: Prepara nuevas migraciones de modelos.
- `python manage.py migrate`: Aplica cambios de base de datos.

---

## 💡 Solución de Problemas Comunes

1. **Error de permisos al activar `.venv` en PowerShell**:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
   ```
2. **Error `SECRET_KEY` en Django**:
   Asegúrate de exportar `$env:SECRET_KEY='tu-clave'` en la misma terminal donde ejecutas `runserver`.
3. **CORS en el Frontend al llamar al Backend**:
   Verifica que `$env:FRONTEND_URL` coincida exactamente con la URL de Vite (`http://localhost:5173`).
