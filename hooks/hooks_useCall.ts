import { useContext } from 'react'
import { CallContext } from '@/components/contexts/contexts_CallContext'

export const useCall = () => {
  const context = useContext(CallContext)
  if (!context) {
    throw new Error('useCall must be used within a CallProvider')
  }
  return context
}