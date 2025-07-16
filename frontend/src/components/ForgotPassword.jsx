import { useState } from 'react'
import axios from 'axios'
import { BASE_URL } from '../base_url'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await axios.post(`${BASE_URL}/api/forgot-password/`, { email })
      setMessage('If this email exists, a reset link has been sent.')
    } catch (err) {
      setMessage('Error sending reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-800">Forgot Password</h2>
        </div>
        <form className="mt-8 space-y-6 bg-white p-6 rounded-xl shadow-lg" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border py-1.5 px-3 text-gray-900 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-md bg-gray-700 py-2 px-3 text-sm font-semibold text-white hover:bg-gray-500 focus:outline-none ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          {message && <div className="text-center text-sm text-gray-700 mt-2">{message}</div>}
        </form>
      </div>
    </div>
  )
}

export default ForgotPassword
