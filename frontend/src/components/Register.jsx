import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { BASE_URL } from '../base_url'

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    profile: ''
  })
  const [profiles, setProfiles] = useState([])

  useEffect(() => {
    // Fetch profiles from backend
    axios.get(`${BASE_URL}/api/profiles/`)
      .then(res => setProfiles(res.data))
      .catch(() => setProfiles([]))
  }, []) // fetch only once on mount

  // Debug: Log profiles to verify data
  useEffect(() => {
    console.log('Profiles loaded:', profiles)
  }, [profiles])

  // Remove profile input and set default profile to first non-sales profile
  useEffect(() => {
    if (profiles.length > 0) {
      const nonSales = profiles.find((p) => p.name.toLowerCase() !== 'sales');
      if (nonSales) {
        setFormData((prev) => ({ ...prev, profile: nonSales.id }));
      }
    }
  }, [profiles]);

  const { register, loading, error } = useAuth()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
      email: name === 'username' ? value : prev.email
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Prevent registration if no non-sales profile is available
    const selectedProfile = profiles.find((p) => p.id === formData.profile);
    if (!selectedProfile || selectedProfile.name.toLowerCase() === 'sales') {
      alert('Only non-sales users can register.');
      return;
    }
    await register(formData)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Create an account
          </h2>
        </div>
        <form className="mt-8 space-y-6 bg-white p-6 rounded-lg shadow-md" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm py-1.5 px-2 focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm py-1.5 px-2 focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm py-1.5 px-2 focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm py-1.5 px-2 focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                />
              </div>
            </div>
           
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone_number"
                name="phone_number"
                type="text"
                required
                value={formData.phone_number}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm py-1.5 px-2 focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
              />
            </div>
            
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative flex w-full justify-center rounded-md bg-gray-900 py-2 px-3 text-sm font-semibold text-white hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>

          <div className="text-sm text-center">
            <p className="font-medium text-gray-600 hover:text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="underline">
                Login here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register