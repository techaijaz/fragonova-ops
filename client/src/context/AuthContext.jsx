import { createContext, useContext } from 'react'
import { useUser } from '../hooks/useAuth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { data: user, isLoading, isError } = useUser()

  const value = {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user && !isError
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
