import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import type { AuthSession } from '../types'

const STORAGE_KEY = 'gestor-mc-session'

interface AuthContextValue {
  session: AuthSession | null
  isDiretoria: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredSession(): AuthSession | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value ? (JSON.parse(value) as AuthSession) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(readStoredSession)

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isDiretoria: session?.profile === 'DIRETORIA',
      login: async (email, password) => {
        const nextSession = await api.login(email, password)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
        setSession(nextSession)
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY)
        setSession(null)
      },
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser utilizado dentro de AuthProvider.')
  return context
}
