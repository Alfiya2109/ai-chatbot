import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()
const API_BASE_URL = 'http://localhost:8000'; // Django backend server URL

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  // Check if there's a token on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const role = localStorage.getItem('user_role')
    
    if (token) {
      // In a real app, you might want to validate the token here
      setCurrentUser({ 
        token,
        role: role || 'user'
      })
    }
  }, [])

  async function login(username, password) {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      
      // Store tokens in localStorage
      localStorage.setItem('access_token', data.tokens.access)
      localStorage.setItem('refresh_token', data.tokens.refresh)
      localStorage.setItem('user_role', data.role || 'user')
      
      setCurrentUser({
        username: data.username,
        token: data.tokens.access,
        role: data.role || 'user'
      })
      
      navigate('/chatbot')
      return true
    } catch (error) {
      setError(error.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  async function register(userData) {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      if (!response.ok) {
        throw new Error('Registration failed')
      }

      const data = await response.json()
      
      // Store tokens in localStorage
      localStorage.setItem('access_token', data.tokens.access)
      localStorage.setItem('refresh_token', data.tokens.refresh)
      localStorage.setItem('user_role', userData.role || 'user')
      
      setCurrentUser({
        username: userData.username,
        token: data.tokens.access,
        role: userData.role || 'user'
      })
      
      navigate('/chatbot')
      return true
    } catch (error) {
      setError(error.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setCurrentUser(null)
    navigate('/login')
  }

  // Token refresh function
  async function refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }
      
      const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      })
      
      if (!response.ok) {
        throw new Error('Token refresh failed')
      }
      
      const data = await response.json()
      localStorage.setItem('access_token', data.access)
      
      return data.access
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
      return null
    }
  }

  const value = {
    currentUser,
    login,
    register,
    logout,
    refreshToken,
    loading,
    error
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 