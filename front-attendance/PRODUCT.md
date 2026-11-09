# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

1. **Organizadores y Administradores Académicos / Tech Event Leads**: Coordinadores de eventos, hackathons, seminarios, conferencias y talleres que crean eventos de corta duración, gestionan sesiones de asistencia en tiempo real mediante códigos QR dinámicos y emiten certificados digitales inmutables.
2. **Participantes y Estudiantes**: Asistentes que marcan su presencia escaneando QRs, conectan su billetera Web3 (MetaMask u otros proveedores compatibles) y reclaman/visualizan sus certificados intransferibles (Soulbound Tokens - ERC-5192) como prueba de participación verificable en blockchain.

## Product Purpose

Proveer una plataforma descentralizada (dApp) y sistema de control de asistencia ágil para eventos académicos y tecnológicos de corta duración. Garantiza la emisión instantánea, verídica e inmutable de credenciales digitales académicas atadas a la identidad criptográfica del participante, erradicando la falsificación de diplomas y la fricción de entrega de certificados en papel o PDFs fácilmente adulterables.

## Positioning

A diferencia de las plataformas tradicionales de control de asistencia (como Google Forms o sistemas LMS cerrados) y de los generadores estáticos de diplomas en PDF, esta dApp vincula de forma criptográfica la asistencia verificada con tokens intransferibles (Soulbound Tokens bajo estándar ERC-5192) en blockchain con metadatos descentralizados en IPFS. Cada credencial queda permanentemente anclada al historial académico y profesional del participante sin costo de custodia centralizada.

## Operating Context

- **Eventos presenciales e híbridos de ritmo rápido**: Hackathons, congresos científicos, simposios de posgrado, bootcamps y meetups tecnológicos de 1 a 3 días de duración.
- **Flujo en tiempo real**: Registro ágil, escaneo de código QR en dispositivo móvil o cámara web en la entrada de cada sesión, validación automática de quorum de asistencia requerida.
- **Fase de acreditación y minteo**: Cierre de evento con cálculo automático de elegibilidad y emisión en lote o individual de certificados on-chain directos a las billeteras de los aprobados.
- **Entorno Web3**: Redes EVM (Ethereum / Testnet Sepolia / Polygon) con contratos inteligentes Solidity `AcademicSBT` (ERC-721 + ERC-5192 URIStorage).

## Capabilities and Constraints

- **Gestión de Eventos y Sesiones**: Creación de eventos con fechas, ubicaciones, cupos y múltiples sesiones calendarizadas.
- **Control de Asistencia por QR**: Generación de códigos QR únicos por sesión y lector de QR integrado (html5-qrcode) para check-in instantáneo.
- **Módulo de Certificados SBT (ERC-5192)**:
  - Doble interfaz: Modo Administrador (gestión por lote, auditoría on-chain, disparo de transacciones de minteo) y Modo Participante/Estudiante (galería de diplomas obtenidos, verificación de inmutabilidad y explorador de transacciones).
  - Simulación y conexión Web3 (MetaMask/EVM) con estados de transacción detallados: preparación de metadatos IPFS, firma criptográfica, confirmación en bloque y visualización del token ID.
  - Visualizador de Diploma de Alto Impacto con sellos de verificación criptográfica, hashes y código QR de validación pública.
- **Stack Tecnológico**:
  - Frontend: React 18, Vite, TypeScript, pnpm como gestor oficial de paquetes.
  - Backend: Django REST Framework, base de datos SQLite / PostgreSQL, soporte para autenticación de usuarios.
  - Web3 / Smart Contract: Solidity ^0.8.20 con OpenZeppelin (`ERC721URIStorage`, `Ownable`, `IERC5192`).
- **Restricciones Técnicas**: UI responsiva para móviles en validación de asistencia y desktop/tablet para dashboards de administración. Mantener compatibilidad con el backend Django existente.

## Brand Commitments

- **Identidad**: dApp de Certificación y Asistencia Académica Inmutable.
- **Estética dApp Premium**: Diseño moderno con tipografía nítida (Inter / Plus Jakarta Sans), paleta deep navy/cyber slate (`#0a192f`, `#0d1b2a`) con toques luminosos ámbar/dorado (`#f59e0b`, `#fbbf24`) y acentos esmeralda de verificación criptográfica (`#10b981`), sombras sutiles con profundidad, bordes precisos, estados de carga elegantes y micro-interacciones Web3 pulidas. Cero clichés genéricos de plantillas anticuadas.
- **Tono**: Profesional, institucional, criptográficamente seguro, confiable y transparente.

## Evidence on Hand

- Contrato inteligente Solidity compilado y probado localmente: `../blockchain/contracts/AcademicSBT.sol` (`AcademicSBT`, `ERC721URIStorage`, `Ownable`, `IERC5192`).
- Mock datasets completos con registros de participantes, hashes de transacción, IPFS CIDs y estado de minteo: `src/assets/data/mock-certificates.ts`.
- Módulos funcionales de eventos, calendario, usuarios, dashboard y certificados en frontend.
- API REST Django en backend `attendance` con modelos para eventos, sesiones, inscripciones y asistencias.

## Product Principles

1. **Inmutabilidad y Confianza**: La integridad del certificado es sagrada. Cada acreditación debe reflejar con absoluta claridad su anclaje criptográfico, Token ID y hash de transacción.
2. **Cero Fricción para el Asistente**: Marcar asistencia o visualizar un certificado debe ser cuestión de dos toques en pantalla, sin curvas de aprendizaje complejas de Web3.
3. **Claridad Operativa para el Organizador**: Estadísticas legibles al instante, estados de emisión transparentes (Pendiente vs Emitido) y control preciso sobre sesiones y quorum.
4. **Acabado de Grado Producción**: Cada botón, modal, tarjeta, tipografía y estado vacío debe sentirse deliberado, cohesivo y de nivel internacional.
