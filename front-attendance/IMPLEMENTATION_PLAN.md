# 📋 Plan de Implementación - Mejoras en Lista de Participantes

## 🎯 Objetivos

1. ✅ Reemplazar alertas nativas por modales estéticos
2. ✅ Agregar botón "Editar" para actualizar email
3. ✅ Quitar columna "Código QR"
4. ✅ Agregar botón "Reenviar QR" por email

## 📝 Cambios Necesarios

### 1. Nuevos Estados (agregar después de línea 56)

```typescript
// Modales de participantes
const [showEditParticipantModal, setShowEditParticipantModal] = useState(false)
const [showResendQRModal, setShowResendQRModal] = useState(false)
const [showSuccessModal, setShowSuccessModal] = useState(false)
const [editingParticipant, setEditingParticipant] = useState<any>(null)
const [modalMessage, setModalMessage] = useState({ title: '', message: '' })
const [editParticipantEmail, setEditParticipantEmail] = useState('')
```

### 2. Nuevas Funciones

#### Editar Email del Participante
```typescript
const handleEditParticipant = (registration: any) => {
  setEditingParticipant(registration)
  setEditParticipantEmail(registration.participant.email)
  setShowEditParticipantModal(true)
}

const handleSaveParticipantEmail = async () => {
  if (!editingParticipant) return
  
  try {
    await httpClient.patch(`/participants/${editingParticipant.participant.id}/`, {
      email: editParticipantEmail
    })
    
    setModalMessage({
      title: '✅ Email Actualizado',
      message: `El email se actualizó correctamente a: ${editParticipantEmail}`
    })
    setShowEditParticipantModal(false)
    setShowSuccessModal(true)
    await fetchRegistrations(event!.id)
  } catch (err: any) {
    setModalMessage({
      title: '❌ Error',
      message: err.response?.data?.detail || 'Error al actualizar el email'
    })
    setShowSuccessModal(true)
  }
}
```

#### Reenviar QR por Email
```typescript
const handleResendQR = (registration: any) => {
  setEditingParticipant(registration)
  setShowResendQRModal(true)
}

const confirmResendQR = async () => {
  if (!editingParticipant) return
  
  try {
    await httpClient.post(`/registrations/${editingParticipant.id}/resend_qr/`)
    
    setModalMessage({
      title: '✅ QR Reenviado',
      message: `El código QR fue enviado a: ${editingParticipant.participant.email}`
    })
    setShowResendQRModal(false)
    setShowSuccessModal(true)
  } catch (err: any) {
    setModalMessage({
      title: '❌ Error',
      message: err.response?.data?.detail || 'Error al reenviar el QR'
    })
    setShowResendQRModal(false)
    setShowSuccessModal(true)
  }
}
```

### 3. Modificar Tabla de Participantes

#### Quitar columna "Código QR" (líneas 1218 y 1244-1246)
#### Agregar columna "Acciones"

```tsx
{/* En thead */}
<th style={{ minWidth: '150px' }}>Acciones</th>

{/* En tbody */}
<td>
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    <Button
      size="sm"
      variant="outline-primary"
      onClick={() => handleEditParticipant(registration)}
      title="Editar Email"
    >
      <i className="ri-edit-line"></i>
    </Button>
    <Button
      size="sm"
      variant="outline-success"
      onClick={() => handleResendQR(registration)}
      title="Reenviar QR"
    >
      <i className="ri-mail-send-line"></i>
    </Button>
  </div>
</td>
```

### 4. Nuevos Modales

#### Modal de Editar Email
```tsx
<Modal show={showEditParticipantModal} onHide={() => setShowEditParticipantModal(false)} centered>
  <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #8B004B 0%, #C2185B 100%)', color: 'white' }}>
    <Modal.Title>
      <i className="ri-edit-line me-2"></i>
      Editar Email del Participante
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {editingParticipant && (
      <>
        <p><strong>Participante:</strong> {editingParticipant.participant.first_name} {editingParticipant.participant.last_name}</p>
        <Form.Group>
          <Form.Label>Nuevo Email</Form.Label>
          <Form.Control
            type="email"
            value={editParticipantEmail}
            onChange={(e) => setEditParticipantEmail(e.target.value)}
          />
        </Form.Group>
      </>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowEditParticipantModal(false)}>
      Cancelar
    </Button>
    <Button 
      variant="primary" 
      onClick={handleSaveParticipantEmail}
      style={{ background: 'linear-gradient(135deg, #8B004B 0%, #C2185B 100%)', border: 'none' }}
    >
      Guardar
    </Button>
  </Modal.Footer>
</Modal>
```

#### Modal de Confirmación Reenviar QR
```tsx
<Modal show={showResendQRModal} onHide={() => setShowResendQRModal(false)} centered>
  <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #8B004B 0%, #C2185B 100%)', color: 'white' }}>
    <Modal.Title>
      <i className="ri-mail-send-line me-2"></i>
      Reenviar Código QR
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {editingParticipant && (
      <p>
        ¿Estás seguro de reenviar el código QR a <strong>{editingParticipant.participant.email}</strong>?
      </p>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowResendQRModal(false)}>
      Cancelar
    </Button>
    <Button 
      variant="success" 
      onClick={confirmResendQR}
    >
      <i className="ri-mail-send-line me-2"></i>
      Reenviar
    </Button>
  </Modal.Footer>
</Modal>
```

#### Modal de Éxito/Error
```tsx
<Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered>
  <Modal.Header closeButton>
    <Modal.Title>{modalMessage.title}</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <p>{modalMessage.message}</p>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="primary" onClick={() => setShowSuccessModal(false)}>
      OK
    </Button>
  </Modal.Footer>
</Modal>
```

### 5. Reemplazar alert() en handleExcelUpload (líneas 94 y 99)

```typescript
// Línea 94 - Reemplazar alert de éxito
setModalMessage({
  title: '✅ Importación Completada',
  message: `Nuevos: ${resp.data.created_participants}\nActualizados: ${resp.data.updated_participants}\nRegistros al evento: ${resp.data.created_registrations}\nOmitidos: ${resp.data.skipped_rows.length}`
})
setShowSuccessModal(true)

// Línea 99 - Reemplazar alert de error
setModalMessage({
  title: '❌ Error',
  message: err?.response?.data?.detail || 'Error al importar el Excel'
})
setShowSuccessModal(true)
```

## 🎨 Diseño de Botones de Acciones

```tsx
// Botón Editar - Azul
<Button
  size="sm"
  style={{
    background: 'linear-gradient(135deg, #0066CC 0%, #0099FF 100%)',
    border: 'none',
    borderRadius: '8px',
    padding: '0.4rem 0.8rem'
  }}
>
  <i className="ri-edit-line"></i>
</Button>

// Botón Reenviar - Verde
<Button
  size="sm"
  style={{
    background: 'linear-gradient(135deg, #28a745 0%, #34ce57 100%)',
    border: 'none',
    borderRadius: '8px',
    padding: '0.4rem 0.8rem'
  }}
>
  <i className="ri-mail-send-line"></i>
</Button>
```

## ✅ Checklist de Implementación

- [ ] Agregar nuevos estados
- [ ] Crear función handleEditParticipant
- [ ] Crear función handleSaveParticipantEmail
- [ ] Crear función handleResendQR
- [ ] Crear función confirmResendQR
- [ ] Quitar columna "Código QR" del thead
- [ ] Quitar columna "Código QR" del tbody
- [ ] Agregar columna "Acciones" al thead
- [ ] Agregar columna "Acciones" al tbody con botones
- [ ] Crear Modal de Editar Email
- [ ] Crear Modal de Confirmación Reenviar QR
- [ ] Crear Modal de Éxito/Error
- [ ] Reemplazar alert() en handleExcelUpload (éxito)
- [ ] Reemplazar alert() en handleExcelUpload (error)
- [ ] Quitar línea 498 del exportQrExcel (Código QR en Excel)

## 🚀 Resultado Final

- ✅ Sin alertas nativas del navegador
- ✅ Modales estéticos con diseño guindo
- ✅ Botón para editar email del participante
- ✅ Botón para reenviar QR por email
- ✅ Sin columna de Código QR (innecesaria)
- ✅ UX profesional y consistente
