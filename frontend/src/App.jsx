import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Register from './components/Register'
import Chatbot from './components/Chatbot'
import Config from './components/Config'
import FeedbackDashboard from './components/FeedbackDashboard'
import { AuthProvider } from './context/AuthContext'
import CreateAgent from './components/CreateAgent'
import './index.css';
import { BASE_URL } from './base_url'

function App() {
  // Joget SSO auto-login logic
  useEffect(() => {
    // Only run if not already logged in
    if (!localStorage.getItem('access_token')) {
      fetch('https://jogetdx9preview.iqratechnology.com:8443/jw/web/json/directory/user/sso', {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(async user => {
          if (user && user.username) {
            // Call backend to get JWT
            console.log("joget working")
            const res = await fetch(`${BASE_URL}/api/joget-sso-login/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: user.username })
            });
            if (res.ok) {
              const data = await res.json();
              localStorage.setItem('access_token', data.access);
              // Optionally: set user info in localStorage/context
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<FeedbackDashboard />} />
          <Route
            path="/chatbot"
            element={
              <ProtectedRoute>
                <Chatbot />
              </ProtectedRoute>
            }
          />
          <Route
            path="/config"
            element={
              <SalesProtectedRoute>
                <Config />
              </SalesProtectedRoute>
            }
          />
          <Route path="/train" element={<CreateAgent />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

// Protected route component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('access_token')
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

// Sales-only protected route component
function SalesProtectedRoute({ children }) {
  const token = localStorage.getItem('access_token')
  const profile = localStorage.getItem('profile')
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  if (profile == 'User' || profile == 'Non-Sales') {
    return <Navigate to="/chatbot" replace />
  }
  
  return children
}

export default App