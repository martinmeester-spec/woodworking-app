import { useState, useEffect } from 'react'
import { ArrowLeft, User, Mail, Shield, Building, Calendar, Activity, Clock, Bell } from 'lucide-react'
import { api } from '../services/api'
import EventSubscriptions from '../components/EventSubscriptions'

function UserDetail({ id, onBack }) {
  const [activeTab, setActiveTab] = useState('info')
  const [userData, setUserData] = useState(null)
  const [activityLog, setActivityLog] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, activityRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/system/audit?userId=${id}`)
        ])
        // api.get returns raw data, not wrapped in { data }
        const user = userRes.data || userRes
        setUserData(user)
        const activity = activityRes.data || activityRes || []
        setActivityLog(Array.isArray(activity) ? activity : [])
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="pt-14 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="pt-14">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <User size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">User Not Found</h2>
        </div>
      </div>
    )
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-700'
      case 'Manager': return 'bg-purple-100 text-purple-700'
      case 'Designer': return 'bg-blue-100 text-blue-700'
      default: return 'bg-green-100 text-green-700'
    }
  }

  return (
    <div className="pt-14">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4">
        <ArrowLeft size={20} /> Back to Users
      </button>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'info' ? 'bg-amber-600 text-white' : 'bg-white text-gray-600'}`}
        >
          <User size={18} /> User Info
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'subscriptions' ? 'bg-amber-600 text-white' : 'bg-white text-gray-600'}`}
        >
          <Bell size={18} /> Event Subscriptions
        </button>
      </div>

      {activeTab === 'subscriptions' ? (
        <div className="bg-white rounded-xl shadow-md p-6">
          <EventSubscriptions userId={id} />
        </div>
      ) : (
        <>
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center">
            <User size={48} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {userData.firstName} {userData.lastName}
                </h2>
                <p className="text-gray-500">{userData.email}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getRoleColor(userData.role)}`}>
                {userData.role}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Mail size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-800">{userData.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <Building size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-medium text-gray-800">{userData.department || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <Calendar size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Joined</p>
              <p className="font-medium text-gray-800">{userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-full">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Login</p>
              <p className="font-medium text-gray-800">{userData.lastLogin ? new Date(userData.lastLogin).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">User Permissions</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">View Dashboard</span>
              <span className="text-green-600">✓</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Design Studio Access</span>
              <span className={userData.role === 'Admin' || userData.role === 'Manager' || userData.role === 'Designer' ? 'text-green-600' : 'text-red-600'}>
                {userData.role === 'Admin' || userData.role === 'Manager' || userData.role === 'Designer' ? '✓' : '✗'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Production Management</span>
              <span className={userData.role !== 'Designer' ? 'text-green-600' : 'text-red-600'}>
                {userData.role !== 'Designer' ? '✓' : '✗'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">User Management</span>
              <span className={userData.role === 'Admin' ? 'text-green-600' : 'text-red-600'}>
                {userData.role === 'Admin' ? '✓' : '✗'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">System Settings</span>
              <span className={userData.role === 'Admin' ? 'text-green-600' : 'text-red-600'}>
                {userData.role === 'Admin' ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={20} /> Recent Activity
          </h3>
          {activityLog.length > 0 ? (
            <div className="space-y-3">
              {activityLog.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-800">{log.action}</p>
                    <p className="text-sm text-gray-500">{log.details}</p>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  )
}

export default UserDetail
