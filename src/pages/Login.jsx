import { useState } from 'react'
import { LogIn, User, Shield, Palette, Wrench, QrCode } from 'lucide-react'
import { api } from '../services/api'

const testUsers = [
  { email: 'admin@woodworking.com', password: 'test123', role: 'Admin', icon: Shield, color: 'bg-red-500' },
  { email: 'manager@woodworking.com', password: 'test123', role: 'Manager', icon: User, color: 'bg-purple-500' },
  { email: 'designer@woodworking.com', password: 'test123', role: 'Designer', icon: Palette, color: 'bg-blue-500' },
  { email: 'operator@woodworking.com', password: 'test123', role: 'Operator', icon: Wrench, color: 'bg-green-500' },
  { email: 'scanner@woodworking.com', password: 'test123', role: 'Scanner', icon: QrCode, color: 'bg-amber-500' },
]

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await api.login(email, password)
      localStorage.setItem('token', result.token)
      localStorage.setItem('user', JSON.stringify(result.user))
      onLogin(result.user)
    } catch (err) {
      setError(err.message || 'Login failed')
    }
    setLoading(false)
  }

  const fillTestUser = (user) => {
    setEmail(user.email)
    setPassword(user.password)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-800 to-amber-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🪵</div>
          <h1 className="text-2xl font-bold text-gray-800">Woodworking Cabinet System</h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            <LogIn size={20} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Test Users (Click to fill)</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {testUsers.map((user) => {
              const Icon = user.icon
              return (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => fillTestUser(user)}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className={`${user.color} p-2 rounded-full text-white`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{user.role}</p>
                    <p className="text-xs text-gray-500">{user.email.split('@')[0]}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
