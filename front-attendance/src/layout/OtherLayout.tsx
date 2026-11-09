// import Preloader from '@/components/Preloader'
import Preloader from '@/components/Preloader'
import { ChildrenType } from '@/types/component-props'
import { Suspense } from 'react'

const OtherLayout = ({ children }: ChildrenType) => {
  return <Suspense fallback={<Preloader />}>{children}</Suspense>
}

export default OtherLayout
