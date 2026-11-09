import ComponentContainerCard from '@/components/ComponentContainerCard'
import { Col, Row } from 'react-bootstrap'
import { Card, CardBody, CardHeader } from 'react-bootstrap'
import { Button } from 'react-bootstrap'
import { Form } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import { useAuthContext } from '@/context/useAuthContext'

const ProfilePage = () => {
  const { user } = useAuthContext()
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    institution: 'dApp Asistencia',
    role: '',
    position: '',
    department: 'Sistema Descentralizado de Asistencia',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
  })

  // Cargar datos del usuario autenticado
  useEffect(() => {
    if (user) {
      setProfileData({
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        phone: user.phone || '',
        institution: 'dApp Asistencia',
        role: user.user_type === 'admin' ? 'Administrador' : 'Usuario',
        position: user.user_type === 'admin' ? 'Administrador Principal' : 'Usuario',
        department: 'Sistema de Asistencia',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      })
    }
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Perfil actualizado:', profileData)
    // Aquí se enviarían los datos al backend
  }

  return (
    <>
      <Row>
        <Col xs={12}>
          <ComponentContainerCard
            id="perfil-usuario"
            title="Perfil de Usuario"
            description="Gestiona tu información personal y configuración de cuenta"
          >
            <Row>
              <Col md={4}>
                <Card className="text-center shadow-lg" style={{
                  background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
                  color: 'white',
                  border: 'none'
                }}>
                  <CardBody className="p-4">
                      <div className="mb-3 position-relative">
                      <div 
                        className="rounded-circle border border-3 border-white d-flex align-items-center justify-content-center"
                        style={{ 
                          width: '120px', 
                          height: '120px', 
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                          margin: '0 auto'
                        }}
                      >
                        <i className="ri-user-3-fill" style={{ fontSize: '60px', color: 'white' }}></i>
                      </div>
                      <div className="position-absolute" style={{ top: '0', right: '10px' }}>
                        <span className="badge bg-success rounded-pill p-1">
                          <i className="ri-check-line"></i>
                        </span>
                      </div>
                    </div>
                    <h4 className="mb-1 text-white fw-bold">{profileData.name}</h4>
                    <p className="text-white-50 mb-2">{profileData.position}</p>
                    <p className="text-white-75 mb-3 small">{profileData.department}</p>
                    <Button 
                      variant="light" 
                      size="sm"
                      style={{
                        borderRadius: '20px',
                        fontWeight: '600'
                      }}
                    >
                      <i className="ri-camera-line me-1"></i>
                      Cambiar Foto
                    </Button>
                  </CardBody>
                </Card>
              </Col>
              
              <Col md={8}>
                <Card>
                  <CardHeader>
                    <h5 className="card-title mb-0">Información Personal</h5>
                  </CardHeader>
                  <CardBody>
                    <Form onSubmit={handleSubmit}>
                      <Row className="mb-3">
                        <Form.Label htmlFor="name" column sm={3}>
                          Nombre Completo
                        </Form.Label>
                        <Col sm={9}>
                          <Form.Control
                            type="text"
                            id="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                            required
                          />
                        </Col>
                      </Row>
                      
                      <Row className="mb-3">
                        <Form.Label htmlFor="email" column sm={3}>
                          Email
                        </Form.Label>
                        <Col sm={9}>
                          <Form.Control
                            type="email"
                            id="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                            required
                          />
                        </Col>
                      </Row>
                      
                      <Row className="mb-3">
                        <Form.Label htmlFor="phone" column sm={3}>
                          Teléfono
                        </Form.Label>
                        <Col sm={9}>
                          <Form.Control
                            type="tel"
                            id="phone"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                            required
                          />
                        </Col>
                      </Row>
                      
                      <Row className="mb-3">
                        <Form.Label htmlFor="institution" column sm={3}>
                          Institución
                        </Form.Label>
                        <Col sm={9}>
                          <Form.Control
                            type="text"
                            id="institution"
                            value={profileData.institution}
                            onChange={(e) => setProfileData({...profileData, institution: e.target.value})}
                            required
                          />
                        </Col>
                      </Row>
                      
                      <Row className="mb-3">
                        <Form.Label htmlFor="role" column sm={3}>
                          Rol
                        </Form.Label>
                        <Col sm={9}>
                          <Form.Control
                            type="text"
                            id="role"
                            value={profileData.role}
                            onChange={(e) => setProfileData({...profileData, role: e.target.value})}
                            required
                          />
                        </Col>
                      </Row>
                      
                      <div className="d-flex gap-2">
                        <Button variant="primary" type="submit">
                          <i className="ri-save-line me-1"></i>
                          Guardar Cambios
                        </Button>
                        <Button variant="outline-secondary" type="button">
                          <i className="ri-refresh-line me-1"></i>
                          Restablecer
                        </Button>
                      </div>
                    </Form>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </ComponentContainerCard>
        </Col>
      </Row>
    </>
  )
}

export default ProfilePage