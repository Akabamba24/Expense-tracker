import { createContext, useEffect, useState } from 'react'
import { authApi, setAuthToken } from '../services/api.js'

const STORAGE_KEY = 'expense-tracker-auth'

const AuthContext = createContext(null)

function persistAuth(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function clearPersistedAuth() {
  localStorage.removeItem(STORAGE_KEY)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState('')
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const restoreSession = async () => {
      const storedAuth = localStorage.getItem(STORAGE_KEY)

      if (!storedAuth) {
        setAuthReady(true)
        return
      }

      try {
        const parsedAuth = JSON.parse(storedAuth)

        if (!parsedAuth?.token) {
          clearPersistedAuth()
          setAuthReady(true)
          return
        }

        setAuthToken(parsedAuth.token)
        const profile = await authApi.getMe()

        setToken(parsedAuth.token)
        setUser(profile)
        persistAuth({ token: parsedAuth.token, user: profile })
      } catch {
        setAuthToken('')
        clearPersistedAuth()
      } finally {
        setAuthReady(true)
      }
    }

    restoreSession()
  }, [])

  const applyAuth = (payload) => {
    setAuthToken(payload.token)
    setToken(payload.token)
    setUser({
      _id: payload._id,
      name: payload.name,
      email: payload.email,
    })

    persistAuth({
      token: payload.token,
      user: {
        _id: payload._id,
        name: payload.name,
        email: payload.email,
      },
    })
  }

  const login = async (credentials) => {
    const payload = await authApi.login(credentials)
    applyAuth(payload)
    return payload
  }

  const register = async (formData) => {
    const payload = await authApi.register(formData)
    applyAuth(payload)
    return payload
  }

  const logout = () => {
    setAuthToken('')
    setToken('')
    setUser(null)
    clearPersistedAuth()
  }

  return (
    <AuthContext.Provider
      value={{
        authReady,
        isAuthenticated: Boolean(user && token),
        login,
        logout,
        register,
        token,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
