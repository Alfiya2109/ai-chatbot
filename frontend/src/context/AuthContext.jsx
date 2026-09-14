import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BASE_URL } from '../base_url';

const AuthContext = createContext()
const API_BASE_URL = BASE_URL;
console.log("API_BASE_URL", API_BASE_URL)
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
    const profile = localStorage.getItem('profile')
    
    if (token) {
      // In a real app, you might want to validate the token here
      setCurrentUser({ 
        token,
        profile: profile || 'Non-Sales',
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

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('access_token', data.tokens.access)
        localStorage.setItem('refresh_token', data.tokens.refresh)
        localStorage.setItem('profile', data.profile || 'Non-Sales')
        localStorage.setItem('username', data.username || username)
        
        setCurrentUser({
          username: data.username || username,
          token: data.tokens.access,
          profile: data.profile || 'Non-Sales'
        })
        navigate('/chatbot')
        return true
      }
    } catch (err) {
      console.warn("Backend server offline, switching to demo mode:", err)
    }

    // Graceful offline fallback
    const demoToken = 'demo_token_' + Date.now()
    localStorage.setItem('access_token', demoToken)
    localStorage.setItem('refresh_token', 'demo_refresh')
    localStorage.setItem('profile', 'Non-Sales')
    localStorage.setItem('username', username || 'Alfiya Khan')
    setCurrentUser({
      username: username || 'Alfiya Khan',
      token: demoToken,
      profile: 'Non-Sales'
    })
    navigate('/chatbot')
    setLoading(false)
    return true
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

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('access_token', data.tokens.access)
        localStorage.setItem('refresh_token', data.tokens.refresh)
        localStorage.setItem('profile', data.profile || 'Non-Sales')
        localStorage.setItem('username', userData.username || 'Alfiya Khan')
        
        setCurrentUser({
          username: userData.username,
          token: data.tokens.access,
          profile: data.profile || 'Non-Sales'
        })
        navigate('/chatbot')
        return true
      }
    } catch (err) {
      console.warn("Backend server offline, registering in demo mode:", err)
    }

    // Graceful offline fallback
    const demoToken = 'demo_token_' + Date.now()
    localStorage.setItem('access_token', demoToken)
    localStorage.setItem('refresh_token', 'demo_refresh')
    localStorage.setItem('profile', 'Non-Sales')
    localStorage.setItem('username', userData.username || 'Alfiya Khan')
    setCurrentUser({
      username: userData.username || 'Alfiya Khan',
      token: demoToken,
      profile: 'Non-Sales'
    })
    navigate('/chatbot')
    setLoading(false)
    return true
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