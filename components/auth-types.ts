// Types and interfaces for authentication
export interface UserData {
  uid: string
  displayName: string
  email: string
  photoURL: string | null
  status: string
  createdAt: string
  lastSeen: string
}

export interface AuthFormState {
  email: string
  password: string
  name?: string
}

export interface AuthError {
  message: string
  code?: string
}