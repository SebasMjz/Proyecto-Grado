import { Col, Container, Row } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

const Footer = () => {
  const year = new Date().getFullYear()
  return (
    <footer
      className="footer"
      style={{
        background: 'linear-gradient(180deg, transparent 0%, rgba(9, 15, 28, 0.8) 100%)',
        padding: '1.25rem 0',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        marginTop: '3rem'
      }}
    >
      <Container fluid>
        <Row className="align-items-center g-2">
          <Col xs={12} md={6} className="text-center text-md-start">
            <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2">
              <span className="badge-sbt px-2 py-1 rounded small">ERC-5192</span>
              <span className="footer-copy">
                <strong>AcademicSBT</strong> · Protocolo Descentralizado de Asistencia y Acreditación Inmutable
              </span>
            </div>
          </Col>
          <Col xs={12} md={6} className="text-center text-md-end">
            <span className="footer-verification">
              <IconifyIcon icon="solar:shield-check-bold-duotone" className="text-success me-1" />
              Smart Contract Verificado en Blockchain · © {year}
            </span>
          </Col>
        </Row>
      </Container>
    </footer>
  )
}

export default Footer
