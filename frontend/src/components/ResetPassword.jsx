import { useState } from 'react'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import { BASE_URL } from '../base_url'

function useQuery() {
  return new URLSearchParams(useLocation().search)
}


function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const query = useQuery()
  const navigate = useNavigate()
  const uid = query.get('uid')
  const token = query.get('token')

  // Prevent logged-in users from accessing reset-password page
  if (localStorage.getItem('access_token')) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    if (!password || password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await axios.post(`${BASE_URL}/api/reset-password/`, {
        uid,
        token,
        new_password: password
      })
      setMessage('Password reset successful! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setMessage('Invalid or expired link.')
    } finally {
      setLoading(false)
    }
  }

  // Modal overlay for password reset
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border py-1.5 px-3 text-gray-900 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 sm:text-sm"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border py-1.5 px-3 text-gray-900 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 sm:text-sm"
              placeholder="Confirm new password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-md bg-gray-700 py-2 px-3 text-sm font-semibold text-white hover:bg-gray-500 focus:outline-none ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
          {message && <div className="text-center text-sm text-gray-700 mt-2">{message}</div>}
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
