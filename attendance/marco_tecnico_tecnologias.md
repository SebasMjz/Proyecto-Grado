# 7.2. MARCO TÉCNICO

A continuación se describen las principales tecnologías empleadas en el desarrollo del sistema de registro y control de asistencia, tanto en el backend como en el frontend.

## 7.2.1. Lenguajes de programación

- **Python**: Lenguaje de programación interpretado, multiparadigma y de alto nivel, utilizado en la capa de servidor. Su sintaxis clara y la gran cantidad de bibliotecas disponibles facilitan el desarrollo rápido de aplicaciones web robustas.
- **TypeScript / JavaScript**: TypeScript es un superconjunto tipado de JavaScript que añade tipado estático y características avanzadas del lenguaje. Se transpila a JavaScript para su ejecución en el navegador, permitiendo desarrollar una interfaz de usuario más mantenible y menos propensa a errores.

## 7.2.2. Backend

- **Django 5 (Framework web en Python)**: Framework de alto nivel que sigue el patrón Modelo–Vista–Template (MVT). Se utiliza para estructurar toda la lógica del lado del servidor, gestionar modelos de datos, autenticación, panel de administración y la configuración general del proyecto.
- **Django REST Framework (DRF)**: Conjunto de herramientas sobre Django para la construcción de APIs REST. Facilita la serialización de modelos, la definición de vistas basadas en clases y el manejo de respuestas JSON que consume el frontend.
- **Django Channels y Daphne**: Extensión asíncrona de Django que permite gestionar conexiones WebSocket y otras comunicaciones en tiempo real. Daphne actúa como servidor ASGI para servir la aplicación y habilitar el uso de canales de comunicación en tiempo real cuando el sistema lo requiera.
- **Autenticación JWT (djangorestframework-simplejwt)**: Implementación de autenticación basada en JSON Web Tokens. Permite proteger los endpoints de la API, mantener sesiones sin estado y controlar el tiempo de vida de los tokens de acceso y de refresco.
- **Gestión de entornos y configuración (django-environ)**: Librería que permite leer variables de entorno desde un archivo `.env`, desacoplando credenciales y configuraciones sensibles del código fuente. Se utiliza para gestionar claves secretas, credenciales de base de datos, URLs de frontend/backend y parámetros de servicios externos.
- **CORS (django-cors-headers)**: Middleware que habilita el intercambio de recursos entre dominios (Cross-Origin Resource Sharing), necesario para que el frontend, desplegado en un dominio diferente, pueda consumir la API sin restricciones del navegador.
- **Filtrado y exportación de datos (django-filter, django-import-export, tablib, openpyxl)**: Herramientas que permiten realizar filtrados avanzados de consultas sobre los modelos y exportar información a formatos como Excel. Esto resulta útil para generar reportes de asistencia y respaldos de la información.
- **Generación de códigos QR (qrcode, Pillow)**: Librerías de Python para generar imágenes de códigos QR que se utilizan en el proceso de registro y verificación de asistencia a los eventos.
- **Cliente HTTP y utilidades (requests, aiohttp)**: Librerías para realizar peticiones HTTP síncronas y asíncronas hacia servicios externos, por ejemplo para integraciones con APIs de mensajería.

## 7.2.3. Base de datos

- **SQLite**: Motor de base de datos relacional ligero utilizado en el entorno de desarrollo. Al estar embebido en un solo archivo, simplifica la configuración inicial del proyecto.
- **PostgreSQL**: Sistema de gestión de bases de datos relacional de código abierto utilizado en entornos de producción. Proporciona mayor robustez, escalabilidad y soporte para transacciones, ideal para almacenar de forma segura los registros de usuarios, eventos y asistencias.

## 7.2.4. Servicios externos y mensajería

- **SMTP (Gmail)**: Protocolo utilizado para el envío de correos electrónicos transaccionales, como activación de cuentas, restablecimiento de contraseña y confirmaciones de registro, utilizando los servidores SMTP de Gmail.

## 7.2.5. Frontend

- **React 18**: Biblioteca de JavaScript para la construcción de interfaces de usuario basadas en componentes. Se utiliza para desarrollar una SPA (Single Page Application) que consume la API del backend y ofrece una experiencia de usuario fluida en el panel de administración y en los módulos de registro y consulta.
- **React Router DOM**: Librería para el manejo de rutas en aplicaciones React. Permite definir navegación declarativa entre las diferentes vistas del sistema sin recargar la página.
- **Vite 5**: Herramienta moderna de construcción y empaquetado (bundler) para proyectos frontend. Aporta un entorno de desarrollo rápido con recarga en caliente y una compilación optimizada para producción.
- **TypeScript en el frontend**: Aporta tipado estático sobre React, lo que mejora la mantenibilidad del código, el autocompletado y la detección temprana de errores durante el desarrollo.

## 7.2.6. Estilos y componentes de interfaz

- **Sass / SCSS**: Preprocesador de CSS utilizado para definir hojas de estilo modulares y reutilizables. Permite el uso de variables, mixins y anidamiento, facilitando la personalización del tema visual del sistema.
- **Bootstrap 5 y React-Bootstrap**: Framework de estilos CSS y su integración en componentes React. Se utilizan para construir una interfaz responsiva, consistente y adaptada a distintos dispositivos.
- **Bibliotecas de interfaz adicionales**:
  - **FullCalendar**: Componente de calendario interactivo empleado para la visualización de eventos y sesiones de forma gráfica.
  - **Swiper**: Librería de sliders/carouseles para mostrar contenido de forma dinámica.
  - **React Toastify**: Sistema de notificaciones tipo "toast" para informar al usuario sobre acciones realizadas (éxitos, errores, avisos).
  - **Simplebar**: Mejora la apariencia y el comportamiento de las barras de desplazamiento dentro de ciertos componentes.

## 7.2.7. Formularios, validación y manejo de datos en el frontend

- **React Hook Form**: Librería ligera para la gestión de formularios en React basada en hooks. Facilita el control de estados, validaciones y envío de formularios sin código repetitivo.
- **Yup**: Librería de validación de esquemas que se integra con React Hook Form para definir reglas de validación declarativas sobre los datos ingresados por el usuario.
- **TanStack React Table**: Herramienta para construir tablas dinámicas con paginación, ordenamiento y filtrado en el frontend, útil para visualizar listas de eventos, participantes y registros de asistencia.
- **ExcelJS**: Librería JavaScript para generar y manipular archivos de Excel en el navegador, permitiendo al usuario exportar reportes de asistencia directamente desde la interfaz.

## 7.2.8. Otras herramientas y librerías de apoyo

- **Axios**: Cliente HTTP utilizado en el frontend para consumir la API REST del backend, gestionar cabeceras de autenticación y manejar respuestas y errores de forma centralizada.
- **HTML5-QRcode**: Librería de JavaScript para leer códigos QR desde la cámara del dispositivo. Se emplea para escanear los códigos de los participantes y registrar su asistencia en tiempo real.
- **Librerías de gráficos (ApexCharts / React-ApexCharts)**: Permiten generar visualizaciones interactivas (gráficos de barras, líneas, pastel, etc.), utilizadas para mostrar estadísticas de eventos y reportes de asistencia.
- **Librerías de utilidades y experiencia de usuario**: Se emplean diversas dependencias adicionales (por ejemplo, `dayjs`, `moment`, `react-dropzone`, `react-select`, `react-quill`, entre otras) para el manejo de fechas, carga de archivos, selección avanzada de opciones y edición de texto enriquecido.

## 7.2.9. Herramientas de desarrollo y calidad de código

- **TypeScript Compiler (tsc)**: Compilador de TypeScript que transpila el código fuente a JavaScript compatible con los navegadores.
- **ESLint**: Herramienta de análisis estático para JavaScript/TypeScript que ayuda a mantener un estilo de código consistente y a detectar errores comunes durante el desarrollo.
- **Prettier**: Formateador de código automatizado que asegura una presentación uniforme del código fuente, mejorando su legibilidad.

En conjunto, este ecosistema de tecnologías permite implementar una solución web completa: un backend robusto y seguro para la gestión de datos de asistencia, y un frontend moderno e interactivo que ofrece a los usuarios finales una experiencia ágil, intuitiva y accesible desde distintos dispositivos.