import clsx from 'clsx'
import { type ReactNode } from 'react'
import { Card, CardBody, CardTitle } from 'react-bootstrap'

type ContainerCardProps = {
  title: string
  id: string
  titleClass?: string
  description?: ReactNode
  children: ReactNode
}

const ComponentContainerCard = ({ title, id, description, children, titleClass }: ContainerCardProps) => {
  return (
    <Card>
      <CardBody>
        <CardTitle
          as={'h5'}
          className={clsx('mb-1', titleClass)}
          id={id}
          style={{
            color: 'var(--vris-text-primary)',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            marginBottom: '0.5rem'
          }}
        >
          {title}
        </CardTitle>
        {!!description && (
          <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
            {description}
          </p>
        )}
        {title && (
          <div className="section-title-divider" style={{
            borderBottom: '2px solid var(--vris-primary)',
            marginBottom: '1.5rem',
            paddingBottom: '0.5rem'
          }}></div>
        )}
        <>{children}</>
      </CardBody>
    </Card>
  )
}

export default ComponentContainerCard
