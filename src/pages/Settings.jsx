import { useState, useEffect } from 'react'
import { Database, RefreshCw, Trash2, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { api } from '../services/api'

const SEED_OPTIONS = [
  { id: 'historical', name: '2-Year Historical Data', description: 'Comprehensive 2-year data: 3300 orders, tracking, actions (recommended)', highlight: true },
  { id: 'all', name: 'Basic Sample Data', description: 'Seed all tables with minimal sample data' },
  { id: 'users', name: 'Users Only', description: 'Create sample users (Admin, Designer, Operator)' },
  { id: 'designs', name: 'Designs Only', description: 'Create sample cabinet designs' },
  { id: 'production', name: 'Production Orders', description: 'Create sample production orders and jobs' },
  { id: 'inventory', name: 'Inventory Parts', description: 'Create sample inventory items and stock levels' },
  { id: 'machines', name: 'Machines', description: 'Create sample machines and maintenance records' },
  { id: 'quality', name: 'Quality Data', description: 'Create sample defects and quality records' },
  { id: 'tracking', name: 'Tracking Data', description: 'Create sample parts at production stations' },
]

function Settings() {
  const [dbStatus, setDbStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [selectedSeeds, setSelectedSeeds] = useState(['all'])
  const [seedProgress, setSeedProgress] = useState(null)

  useEffect(() => {
    checkDbStatus()
  }, [])

  const checkDbStatus = async () => {
    try {
      const status = await api.getDbStatus()
      setDbStatus(status)
    } catch (error) {
      setDbStatus({ status: 'disconnected', error: error.message })
    }
  }

  const handleSyncDb = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const result = await api.syncDb(false)
      setMessage({ type: 'success', text: result.message })
      await checkDbStatus()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
    setLoading(false)
  }

  const handleResetDb = async () => {
    if (!confirm('Are you sure you want to reset the database? All data will be lost!')) return
    setLoading(true)
    setMessage(null)
    try {
      const result = await api.syncDb(true)
      setMessage({ type: 'success', text: result.message })
      await checkDbStatus()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
    setLoading(false)
  }

  const handleSeedDb = async () => {
    setLoading(true)
    setMessage(null)
    setSeedProgress({ step: 'Starting...', percent: 0 })
    
    try {
      const seedTypes = selectedSeeds.includes('all') ? ['all'] : selectedSeeds
      const isHistorical = seedTypes.includes('historical')
      
      if (isHistorical) {
        // Show progress steps for historical seed
        const steps = [
          { step: 'Creating users...', percent: 5 },
          { step: 'Creating design templates...', percent: 10 },
          { step: 'Creating 250 cabinet designs...', percent: 20 },
          { step: 'Creating Year 1 orders (1000)...', percent: 35 },
          { step: 'Creating Year 2 orders (2300)...', percent: 55 },
          { step: 'Creating part tracking records...', percent: 75 },
          { step: 'Creating user actions (2 years)...', percent: 90 },
          { step: 'Finalizing...', percent: 95 },
        ]
        
        let stepIndex = 0
        const progressInterval = setInterval(() => {
          if (stepIndex < steps.length) {
            setSeedProgress(steps[stepIndex])
            stepIndex++
          }
        }, 3000)
        
        const result = await api.post('/db/seed', { types: seedTypes })
        clearInterval(progressInterval)
        setSeedProgress({ step: 'Complete!', percent: 100 })
        setMessage({ type: 'success', text: result.message || 'Historical data seeded successfully' })
      } else {
        const result = await api.post('/db/seed', { types: seedTypes })
        setSeedProgress({ step: 'Complete!', percent: 100 })
        setMessage({ type: 'success', text: result.message || 'Database seeded successfully' })
      }
    } catch (error) {
      setSeedProgress(null)
      setMessage({ type: 'error', text: error.message })
    }
    setLoading(false)
    setTimeout(() => setSeedProgress(null), 3000)
  }

  const toggleSeedOption = (id) => {
    if (id === 'all') {
      setSelectedSeeds(['all'])
    } else {
      setSelectedSeeds(prev => {
        const newSeeds = prev.filter(s => s !== 'all')
        if (newSeeds.includes(id)) {
          return newSeeds.filter(s => s !== id)
        } else {
          return [...newSeeds, id]
        }
      })
    }
  }

  return (
    <div className="pt-14">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
        <p className="text-gray-600">Manage application and database settings</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Database size={20} /> Database Status
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Connection Status</span>
              <span className={`flex items-center gap-2 font-medium ${
                dbStatus?.status === 'connected' ? 'text-green-600' : 'text-red-600'
              }`}>
                <span className={`w-3 h-3 rounded-full ${
                  dbStatus?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                {dbStatus?.status === 'connected' ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {dbStatus?.database && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Database Name</span>
                <span className="font-medium text-gray-800">{dbStatus.database}</span>
              </div>
            )}

            <button
              onClick={checkDbStatus}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw size={18} /> Refresh Status
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Database size={20} /> Database Management
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Sync Database</h4>
              <p className="text-sm text-blue-600 mb-3">Synchronize database schema without losing data.</p>
              <button
                onClick={handleSyncDb}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                Sync Database
              </button>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Seed Database</h4>
              <p className="text-sm text-green-600 mb-3">Select which data to seed:</p>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {SEED_OPTIONS.map(option => (
                  <label 
                    key={option.id}
                    className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors ${
                      selectedSeeds.includes(option.id) 
                        ? option.highlight ? 'bg-amber-200 border-2 border-amber-500' : 'bg-green-200' 
                        : option.highlight ? 'bg-amber-50 hover:bg-amber-100 border border-amber-300' : 'bg-white hover:bg-green-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSeeds.includes(option.id)}
                      onChange={() => toggleSeedOption(option.id)}
                      className="mt-1 w-4 h-4 text-green-600 rounded"
                    />
                    <div>
                      <p className={`text-sm font-medium ${option.highlight ? 'text-amber-800' : 'text-gray-800'}`}>{option.name}</p>
                      <p className={`text-xs ${option.highlight ? 'text-amber-600' : 'text-gray-500'}`}>{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
              
              {seedProgress && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800">{seedProgress.step}</span>
                    <span className="text-sm text-blue-600">{seedProgress.percent}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${seedProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}
              
              <button
                onClick={handleSeedDb}
                disabled={loading || selectedSeeds.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader size={18} className="animate-spin" /> : <Database size={18} />}
                {loading ? 'Seeding...' : 'Seed Selected Data'}
              </button>
            </div>

            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Reset Database</h4>
              <p className="text-sm text-red-600 mb-3">Drop all tables and recreate. All data will be lost!</p>
              <button
                onClick={handleResetDb}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader size={18} className="animate-spin" /> : <Trash2 size={18} />}
                Reset Database
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
