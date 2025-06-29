import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Login from './components/Login'
import Register from './components/Register'
import Chatbot from './components/Chatbot'
import Config from './components/Config'
import FeedbackDashboard from './components/FeedbackDashboard'
import { AuthProvider } from './context/AuthContext'
import CreateAgent from './components/CreateAgent'
import './index.css'
 
function App() {
  useEffect(() => {
  // Notify parent that iframe is ready
  if (window.parent !== window) {
    window.parent.postMessage({ type: "iframe-ready" }, "*");
  }
}, []);
  // ✅ Joget SSO auto-login logic
  useEffect(() => {
    const handleMessage = (event) => {
      // console.log("📨 Message received in iframe:", event)
 
      // Only accept messages from Joget origin
      // ...existing code...
      // console.log("🌍 Message origin:", event.origin)
      // Only accept messages from Joget origin
      if (event.origin !== "https://jogetdx8dev.iqratechnology.com:8443") {
        // console.warn("⚠️ Message origin not allowed:", event.origin)
        return
      }
      const { token, username } = event.data
      if (token && username) {
        console.log("🔐 Token received:", token)
        console.log("👤 Username received:", username)
        localStorage.setItem("access_token", token)
        localStorage.setItem("username", username)
        console.log("✅ User logged in successfully")
      }
    }
 
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])
 
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100">
        <AutoRedirect /> {/* ✅ This checks token and redirects to /chatbot */}
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
 
// ✅ AutoRedirect component
function AutoRedirect() {
  const navigate = useNavigate()
  const location = useLocation()
 
  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (token && location.pathname === "/login") {
      console.log("🔁 Redirecting from /login to /chatbot")
      navigate("/chatbot", { replace: true })
    }
  }, [location.pathname, navigate])
 
  return null
}
 
// 🔐 Protected route component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token")
 
  if (!token) {
    return <Navigate to="/login" replace />
  }
 
  return children
}
 
// 🔐 Sales-only protected route component
function SalesProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token")
  const role = localStorage.getItem("user_role")
  const profile = localStorage.getItem("profile")

  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Check for role and profile restrictions
  if (
    (profile && (profile.toLowerCase() === "non-sales" || profile.toLowerCase() === "nonsales"))
  ) {
    return <Navigate to="/chatbot" replace />
  }

  return children
}
 
export default App

