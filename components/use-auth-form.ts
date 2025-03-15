import { useState } from "react"
import type { AuthFormState, AuthError } from "./auth-types"

interface UseAuthForm {
  formState: AuthFormState
  loading: boolean
  error: AuthError | null
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  setError: (error: AuthError | null) => void
  setLoading: (loading: boolean) => void
  resetForm: () => void
}

export const useAuthForm = (initialState: AuthFormState): UseAuthForm => {
  const [formState, setFormState] = useState<AuthFormState>(initialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormState(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormState(initialState)
    setError(null)
  }

  return {
    formState,
    loading,
    error,
    handleInputChange,
    setError,
    setLoading,
    resetForm
  }
}