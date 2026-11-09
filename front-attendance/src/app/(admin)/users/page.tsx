import React, { useState, useEffect, useMemo } from 'react'
import { Row, Col, Card, CardBody, CardHeader, Button, Table, Badge, Modal, Form, Alert } from 'react-bootstrap'
import { useNotificationContext } from '@/context/useNotificationContext'
import httpClient from '@/helpers/httpClient'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  user_type: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  date_joined: string
  last_login?: string
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [visibleUsersCount, setVisibleUsersCount] = useState(10)
  const [userForm, setUserForm] = useState({
    email: '',
    user_type: 'Personal',
    first_name: '', // opcional en el flujo, se ignora en backend
    last_name: '',  // opcional en el flujo, se ignora en backend
    is_active: true,
    is_staff: false,
  })
  const { showNotification } = useNotificationContext()

  // Filtrar usuarios basado en la búsqueda
  const filteredUsers = useMemo(() => {
    const searchLower = userSearch.toLowerCase().trim()
    return users.filter((user) => {
      if (!searchLower) return true
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase()
      const email = user.email?.toLowerCase() || ''
      const userType = user.user_type?.toLowerCase() || ''

      return fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        userType.includes(searchLower)
    })
  }, [users, userSearch])

  // Mostrar solo los primeros N usuarios
  const visibleUsers = filteredUsers.slice(0, visibleUsersCount)

  // Cargar usuarios
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await httpClient.get('/users/')
      setUsers(response.data.results || response.data)
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err)
      showNotification({
        message: 'Error al cargar usuarios',
        variant: 'danger'
      })
    }
  }

  useEffect(() => { setLoading(false) }, [])

  // Pre-registro eliminado (flujo simplificado)

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingUser) {
        // Actualizar usuario existente
        await httpClient.put(`/users/${editingUser.id}/`, {
          email: userForm.email,
          user_type: userForm.user_type,
          first_name: userForm.first_name,
          last_name: userForm.last_name,
          is_active: userForm.is_active,
          is_staff: userForm.is_staff,
        })
        showNotification({
          message: 'Usuario actualizado exitosamente',
          variant: 'success'
        })
      } else {
        // Crear nuevo usuario
        await httpClient.post('/users/', {
          email: userForm.email,
          user_type: userForm.user_type,
          // nombres opcionales, backend pondrá temporales si faltan
          first_name: userForm.first_name,
          last_name: userForm.last_name,
        })
        showNotification({
          message: 'Usuario creado. Se envió código de activación al email.',
          variant: 'success'
        })
      }
      setShowUserModal(false)
      setEditingUser(null)
      setUserForm({
        email: '',
        first_name: '',
        last_name: '',
        user_type: 'Personal',
        is_active: true,
        is_staff: false,
      })
      loadUsers()
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || `Error al ${editingUser ? 'actualizar' : 'crear'} usuario`
      showNotification({
        message: errorMessage,
        variant: 'danger'
      })
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setUserForm({
      email: user.email,
      user_type: user.user_type,
      first_name: user.first_name,
      last_name: user.last_name,
      is_active: user.is_active,
      is_staff: user.is_staff,
    })
    setShowUserModal(true)
  }

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      await httpClient.delete(`/users/${userToDelete.id}/`)
      showNotification({
        message: 'Usuario eliminado exitosamente',
        variant: 'success'
      })
      setShowDeleteModal(false)
      setUserToDelete(null)
      loadUsers()
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error al eliminar usuario'
      showNotification({
        message: errorMessage,
        variant: 'danger'
      })
    }
  }

  const getUserTypeBadge = (type: string) => {
    switch (type) {
      case 'admin':
        return <Badge bg="danger">Admin</Badge>
      case 'staff':
        return <Badge bg="primary">Personal</Badge>
      case 'Estudiante':
        return <Badge bg="info">Estudiante</Badge>
      case 'vicerrectora':
        return <Badge bg="warning">Vicerrectora</Badge>
      case 'director_nacional':
        return <Badge bg="secondary">Director Nacional</Badge>
      default:
        return <Badge bg="secondary">{type}</Badge>
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ?
      <Badge bg="success">Activo</Badge> :
      <Badge bg="secondary">Inactivo</Badge>
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 text-muted">Cargando usuarios...</p>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent',
      padding: '20px 0'
    }}>
      <Row className="mb-4">
        <Col xs={12}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-2" style={{ color: 'var(--vris-text-primary)', fontWeight: '700' }}>Gestión de Usuarios</h2>
              <p style={{ color: 'var(--vris-text-secondary)' }}>Crear y administrar usuarios del sistema</p>
            </div>
            <div>
              <Button
                variant="primary"
                onClick={() => setShowUserModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '600',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)'
                }}
              >
                <i className="ri-user-settings-line me-1"></i>
                Crear Usuario
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Sección de pre-registros eliminada */}

      {/* Usuarios */}
      <Row>
        <Col xs={12}>
          <Card>
            <CardHeader style={{
              background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}>
              <h5 className="mb-0" style={{ color: '#FFFFFF', fontWeight: '700', textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)' }}>
                <i className="ri-user-line me-2"></i>
                Usuarios Registrados
              </h5>
            </CardHeader>
            <CardBody>
              {users.length === 0 ? (
                <Alert variant="info">
                  <i className="ri-information-line me-2"></i>
                  No hay usuarios registrados
                </Alert>
              ) : (
                <>
                  {/* Barra de búsqueda */}
                  <div className="mb-3">
                    <Form.Control
                      type="text"
                      placeholder="Buscar usuario por nombre, email o tipo..."
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value)
                        setVisibleUsersCount(10) // Resetear contador al buscar
                      }}
                      style={{
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                        padding: '10px 15px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Tabla con scroll */}
                  <div
                    className="table-responsive"
                    style={{
                      maxHeight: '600px',
                      overflowY: 'auto',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px'
                    }}
                    onScroll={(e) => {
                      const target = e.target as HTMLElement
                      const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight
                      // Cargar más cuando esté cerca del final (50px)
                      if (scrollBottom < 50 && visibleUsersCount < filteredUsers.length) {
                        setVisibleUsersCount(prev => Math.min(prev + 10, filteredUsers.length))
                      }
                    }}
                  >
                    <Table responsive hover className="mb-0 table-dark-header">
                      <thead style={{ position: 'sticky', top: 0, backgroundColor: '#0a192f', zIndex: 10 }}>
                        <tr style={{ color: '#ffffff' }}>
                          <th style={{ color: '#ffffff' }}>Nombre</th>
                          <th style={{ color: '#ffffff' }}>Email</th>
                          <th style={{ color: '#ffffff' }}>Tipo</th>
                          <th style={{ color: '#ffffff' }}>Estado</th>
                          <th style={{ color: '#ffffff' }}>Staff</th>
                          <th style={{ color: '#ffffff' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleUsers.map((user) => (
                          <tr key={user.id}>
                            <td>
                              <strong>{user.first_name} {user.last_name}</strong>
                            </td>
                            <td>{user.email}</td>
                            <td>{getUserTypeBadge(user.user_type)}</td>
                            <td>{getStatusBadge(user.is_active)}</td>
                            <td>
                              {user.is_staff ?
                                <Badge bg="warning">Sí</Badge> :
                                <Badge bg="light text-dark">No</Badge>
                              }
                            </td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2"
                                onClick={() => handleEditUser(user)}
                              >
                                <i className="ri-edit-line"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteUser(user)}
                              >
                                <i className="ri-delete-bin-line"></i>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Información de resultados */}
                  <div className="mt-3 text-muted small">
                    {`Mostrando ${Math.min(visibleUsersCount, filteredUsers.length)} de ${filteredUsers.length} usuarios${userSearch ? ' (filtrados)' : ''}`}
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Modal de pre-registro eliminado */}

      {/* Modal Usuario */}
      <Modal show={showUserModal} onHide={() => {
        setShowUserModal(false)
        setEditingUser(null)
        setUserForm({
          email: '',
          first_name: '',
          last_name: '',
          user_type: 'Personal',
          is_active: true,
          is_staff: false,
        })
      }} size="lg" centered>
        <Modal.Header closeButton style={{
          background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}>
          <Modal.Title style={{ color: '#FFFFFF', fontWeight: '700', textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)' }}>
            <i className="ri-user-settings-line me-2"></i>
            {editingUser ? 'Editar Usuario' : 'Crear Usuario Completo'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUserSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Usuario *</Form.Label>
                  <Form.Select
                    value={userForm.user_type}
                    onChange={(e) => setUserForm({ ...userForm, user_type: e.target.value })}
                    disabled={!!editingUser}
                  >
                    <option value="staff">Personal</option>
                    <option value="admin">Admin</option>
                    <option value="vicerrectora">Vicerrectora</option>
                    <option value="director_nacional">Director Nacional</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              {editingUser && (
                <>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Estado</Form.Label>
                      <Form.Check
                        type="switch"
                        id="is_active"
                        label={userForm.is_active ? 'Activo' : 'Inactivo'}
                        checked={userForm.is_active}
                        onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Staff</Form.Label>
                      <Form.Check
                        type="switch"
                        id="is_staff"
                        label={userForm.is_staff ? 'Sí' : 'No'}
                        checked={userForm.is_staff}
                        onChange={(e) => setUserForm({ ...userForm, is_staff: e.target.checked })}
                      />
                    </Form.Group>
                  </Col>
                </>
              )}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre (opcional)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Juan"
                    value={userForm.first_name}
                    onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellido (opcional)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Pérez"
                    value={userForm.last_name}
                    onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            {/* Opciones avanzadas eliminadas del flujo simplificado */}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleUserSubmit}
            style={{
              background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
              border: 'none',
              color: 'white',
              fontWeight: '600',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)'
            }}
          >
            <i className="ri-user-settings-line me-1"></i>
            {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Confirmación de Eliminación */}
      <Modal show={showDeleteModal} onHide={() => {
        setShowDeleteModal(false)
        setUserToDelete(null)
      }} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <i className="ri-delete-bin-line me-2"></i>
            Confirmar Eliminación
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>¿Está seguro de que desea eliminar el usuario <strong>{userToDelete?.first_name} {userToDelete?.last_name}</strong> ({userToDelete?.email})?</p>
          <Alert variant="warning" className="mb-0">
            <i className="ri-alert-line me-2"></i>
            Esta acción no se puede deshacer.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowDeleteModal(false)
            setUserToDelete(null)
          }}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDeleteUser}>
            <i className="ri-delete-bin-line me-1"></i>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default UsersPage
