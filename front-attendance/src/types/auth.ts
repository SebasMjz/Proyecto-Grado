export type UserType = {
  id: string
  email: string
  first_name: string
  last_name: string
  user_type: 'admin' | 'vicerrectora' | 'director_nacional' | 'staff' | 'member'
  phone?: string
  is_active: boolean
  is_staff: boolean
  date_joined: string
}

export type LoginResponse = {
  access: string
  refresh: string
  user: UserType
}

export type AuthTokens = {
  access: string
  refresh: string
}
