import { MenuItemType } from '@/types/menu'

export const MENU_ITEMS: MenuItemType[] = [
  {
    key: 'general',
    label: 'GENERAL',
    isTitle: true,
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'solar:widget-5-bold-duotone',
    url: '/dashboard',
  },
  {
    key: 'events',
    label: 'Eventos',
    icon: 'solar:calendar-bold-duotone',
    children: [
      {
        key: 'events-list',
        label: 'Lista de Eventos',
        url: '/events/events-list',
        parentKey: 'events',
      },
      {
        key: 'event-add',
        label: 'Crear Evento',
        url: '/events/event-add',
        parentKey: 'events',
      },
    ],
  },
  {
    key: 'calendar',
    label: 'Calendario',
    icon: 'solar:calendar-add-bold-duotone',
    url: '/apps/calendar',
  },
  {
    key: 'users',
    label: 'Usuarios',
    icon: 'solar:users-group-rounded-bold-duotone',
    url: '/users',
  },
  {
    key: 'certificates',
    label: 'Certificados SBT (ERC-5192)',
    icon: 'solar:diploma-bold-duotone',
    url: '/certificates',
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: 'solar:user-bold-duotone',
    url: '/profile',
  },
]