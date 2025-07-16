import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { BASE_URL } from '../base_url'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    profile: ''
  })
  const [profiles, setProfiles] = useState([])
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState(null)
  const { login, register, loading, error } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await login(username, password)
    
    // Only navigate if login was successful and profile is not 'Non-Sales'
    if (success && localStorage.getItem('profile') !== 'Non-Sales') {
      navigate('/train')
    }
    // If login failed, the AuthContext will already show the error
    // If login succeeded with 'Non-Sales' profile, AuthContext navigates to '/chatbot'
  }

  // Fetch profiles when modal opens
  const handleOpenRegisterModal = async () => {
    setShowRegisterModal(true)
    try {
      const response = await axios.get(`${BASE_URL}/api/profiles/`)
      console.log('Available profiles:', response.data)
      setProfiles(response.data)
      
      // Auto-select Non-Sales profile
      const nonSales = response.data.find((p) => p.name.toLowerCase() === 'non-sales' || p.name.toLowerCase() === 'nonsales')
      console.log('Found Non-Sales profile:', nonSales)
      if (nonSales) {
        setRegisterForm(prev => ({ ...prev, profile: nonSales.id }))
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
      setProfiles([])
    }
  }

  const handleRegisterFormChange = (e) => {
    const { name, value } = e.target
    setRegisterForm(prev => ({
      ...prev,
      [name]: value,
      email: name === 'username' ? value : prev.email
    }))
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setRegisterLoading(true)
    setRegisterError(null)

    // Ensure only Non-Sales users can register
    const selectedProfile = profiles.find((p) => p.id === registerForm.profile)
    if (!selectedProfile || (selectedProfile.name.toLowerCase() !== 'non-sales' && selectedProfile.name.toLowerCase() !== 'nonsales')) {
      setRegisterError('Only Non-Sales users can register through this form.')
      setRegisterLoading(false)
      return
    }

    console.log('Registering with profile:', selectedProfile)

    try {
      const success = await register(registerForm)
      if (success) {
        setShowRegisterModal(false)
        // Reset form
        setRegisterForm({
          username: '',
          password: '',
          first_name: '',
          last_name: '',
          email: '',
          phone_number: '',
          profile: ''
        })
      }
    } catch (error) {
      setRegisterError('Registration failed. Please try again.')
    } finally {
      setRegisterLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-800">
            Login to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6 bg-white p-6 rounded-xl shadow-lg" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-md border py-1.5 px-3 text-gray-900 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 sm:text-sm"
                placeholder="Username"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"  
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border py-1.5 px-3 text-gray-900 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 sm:text-sm pr-10"
                  placeholder="Password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-2 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    // Eye-off SVG
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M9.88 9.88A3 3 0 0012 15a3 3 0 002.12-5.12M15 12a3 3 0 00-3-3m0 0a3 3 0 00-3 3m0 0a3 3 0 003 3m0 0a3 3 0 003-3m0 0a3 3 0 00-3-3m0 0a3 3 0 00-3 3m0 0a3 3 0 003 3m0 0a3 3 0 003-3m0 0a3 3 0 00-3-3m0 0a3 3 0 00-3 3" />
                    </svg>
                  ) : (
                    // Eye SVG
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative flex w-full justify-center rounded-md bg-gray-700   py-2 px-3 text-sm font-semibold text-white hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Logging in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-sm text-center flex flex-col gap-2">
            <p className="font-medium text-gray-700 hover:text-gray-500">
              Don't have an account?{' '}
              <button 
                type="button"
                onClick={handleOpenRegisterModal}
                className="underline hover:text-gray-500"
              >
                Register here
              </button>
            </p>
            <p>
              <a
                href="/forgot-password"
                className="underline text-purple-600 hover:text-purple-800"
              >
                Forgot password?
              </a>
            </p>
          </div>
        </form>
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reg-username" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="reg-username"
                    name="username"
                    type="email"
                    required
                    value={registerForm.username}
                    onChange={handleRegisterFormChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 py-1.5 px-3 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 sm:text-sm"
                    placeholder="Email address"
                  />
                </div>

                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="reg-password"
                    name="password"
                    type="password"
                    required
                    value={registerForm.password}
                    onChange={handleRegisterFormChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 py-1.5 px-3 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 sm:text-sm"
                    placeholder="Password"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-first-name" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      id="reg-first-name"
                      name="first_name"
                      type="text"
                      required
                      value={registerForm.first_name}
                      onChange={handleRegisterFormChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 py-1.5 px-3 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 sm:text-sm"
                      placeholder="First name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="reg-last-name" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      id="reg-last-name"
                      name="last_name"
                      type="text"
                      required
                      value={registerForm.last_name}
                      onChange={handleRegisterFormChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 py-1.5 px-3 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 sm:text-sm"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    id="reg-phone"
                    name="phone_number"
                    type="text"
                    required
                    value={registerForm.phone_number}
                    onChange={handleRegisterFormChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 py-1.5 px-3 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 sm:text-sm"
                    placeholder="Phone number"
                  />
                </div>

                {/* Show selected profile for debugging */}
                {registerForm.profile && (
                  <div className="text-xs text-gray-500">
                    Profile: {profiles.find(p => p.id === registerForm.profile)?.name || 'Unknown'}
                  </div>
                )}

                {registerError && (
                  <div className="text-red-500 text-sm text-center">{registerError}</div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={registerLoading}
                    className={`flex-1 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      registerLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {registerLoading ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login