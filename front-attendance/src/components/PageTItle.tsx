import { DEFAULT_PAGE_TITLE } from '@/context/constants'
import { useTitle } from '@/context/useTitleContext'
import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'

const PageTItle = ({ title }: { title: string }) => {
  const { setTitle } = useTitle()
  const defaultTitle = DEFAULT_PAGE_TITLE

  useEffect(() => {
    setTitle(title)
  }, [setTitle])
  return (
    <Helmet>
      <title>{title ? title + ' | ' + defaultTitle : defaultTitle}</title>
    </Helmet>
  )
}

export default PageTItle
