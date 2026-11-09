import { lazy } from 'react'
import { Navigate, type RouteProps } from 'react-router-dom'

// Dashboard Routes
const Dashboard = lazy(() => import('@/app/(admin)/dashboard/page'))

// Events Routes
const EventsList = lazy(() => import('@/app/(admin)/events/events-list/page'))
const EventDetail = lazy(() => import('@/app/(admin)/events/event-detail/page'))
const EventAdd = lazy(() => import('@/app/(admin)/events/event-add/page'))
const SessionAttendance = lazy(() => import('@/app/(admin)/events/session-attendance/page'))

// Calendar Route
const Calendar = lazy(() => import('@/app/(admin)/apps/calendar/page'))

// Profile Route
const Profile = lazy(() => import('@/app/(admin)/profile/page'))

// Users Route
const Users = lazy(() => import('@/app/(admin)/users/page'))

// Certificates Route
const Certificates = lazy(() => import('@/app/(admin)/certificates/page'))

// Other Routes
const ComingSoon = lazy(() => import('@/app/(other)/coming-soon/page'))
const Maintenance = lazy(() => import('@/app/(other)/maintenance/page'))
const NotFound = lazy(() => import('@/app/(other)/pages-404/page'))


// Auth Routes
const SignIn = lazy(() => import('@/app/(other)/auth/sign-in/page'))
const SignUp = lazy(() => import('@/app/(other)/auth/sign-up/page'))
const MemberCertificates = lazy(() => import('@/app/(member)/certificates/page'))
const MemberCertificateDetail = lazy(() => import('@/app/(member)/certificates/detail'))
const ActivateAccount = lazy(() => import('@/app/(other)/auth/activate-account/page'))
const ResetPassword = lazy(() => import('@/app/(other)/auth/reset-pass/page'))
const ConfirmResetPassword = lazy(() => import('@/app/(other)/auth/reset-pass/ConfirmResetPassword'))
const LockScreen = lazy(() => import('@/app/(other)/auth/lock-screen/page'))
const VerifyCertificate = lazy(() => import('@/app/(other)/verify/page'))

export type RoutesProps = {
  path: RouteProps['path']
  name: string
  element: RouteProps['element']
  exact?: boolean
}

const initialRoutes: RoutesProps[] = [
  {
    path: '/',
    name: 'root',
    element: <Navigate to="/dashboard" />,
  },
]

const generalRoutes: RoutesProps[] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    element: <Dashboard />,
  },
]

const eventsRoutes: RoutesProps[] = [
  {
    name: 'Events List',
    path: '/events/events-list',
    element: <EventsList />,
  },
  {
    name: 'Event Detail',
    path: '/events/:eventId',
    element: <EventDetail />,
  },
  {
    name: 'Event Add',
    path: '/events/event-add',
    element: <EventAdd />,
  },
  {
    name: 'Session Attendance',
    path: '/events/:eventId/sessions/:sessionId/attendance',
    element: <SessionAttendance />,
  },
]

const calendarRoutes: RoutesProps[] = [
  {
    name: 'Calendar',
    path: '/apps/calendar',
    element: <Calendar />,
  },
]

const profileRoutes: RoutesProps[] = [
  {
    name: 'Profile',
    path: '/profile',
    element: <Profile />,
  },
]

const usersRoutes: RoutesProps[] = [
  {
    name: 'Users',
    path: '/users',
    element: <Users />,
  },
]


export const authRoutes: RoutesProps[] = [
  {
    name: 'Verificar certificado',
    path: '/verify/:code',
    element: <VerifyCertificate />,
  },
  {
    name: 'Login',
    path: '/auth/login',
    element: <SignIn />,
  },
  {
    name: 'Sign In',
    path: '/auth/sign-in',
    element: <SignIn />,
  },
  {
    name: 'Crear cuenta',
    path: '/auth/sign-up',
    element: <SignUp />,
  },
  {
    name: 'Activate Account',
    path: '/auth/activate-account',
    element: <ActivateAccount />,
  },
  {
    name: 'Reset Password',
    path: '/auth/reset-pass',
    element: <ResetPassword />,
  },
  {
    name: 'Confirmar nueva contraseña',
    path: '/auth/reset-password/:token',
    element: <ConfirmResetPassword />,
  },
  {
    name: 'Lock Screen',
    path: '/auth/lock-screen',
    element: <LockScreen />,
  },
  {
    name: '404 Error',
    path: '/pages-404',
    element: <NotFound />,
  },
  {
    name: 'Maintenance',
    path: '/maintenance',
    element: <Maintenance />,
  },
  {
    name: 'Coming Soon',
    path: '/coming-soon',
    element: <ComingSoon />,
  },
]

const certificatesRoutes: RoutesProps[] = [
  {
    name: 'Certificates',
    path: '/certificates',
    element: <Certificates />,
  },
]

export const appRoutes = [
  ...initialRoutes,
  ...generalRoutes,
  ...eventsRoutes,
  ...calendarRoutes,
  ...profileRoutes,
  ...usersRoutes,
  ...certificatesRoutes,
]

export const memberRoutes: RoutesProps[] = [
  {
    name: 'Detalle del certificado',
    path: '/my-certificates/:certificateId',
    element: <MemberCertificateDetail />,
  },
  {
    name: 'Mis certificados',
    path: '/my-certificates',
    element: <MemberCertificates />,
  },
]
