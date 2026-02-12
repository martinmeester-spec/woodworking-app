import { useState, useEffect } from 'react'
import { Search, Filter, Activity, Users, MapPin, Clock, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { api } from '../services/api'

function Tracking() {
  const [actions, setActions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    actionType: '',
    station: '',
    startDate: '',
    endDate: ''
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState('actions')
  const [selectedUser, setSelectedUser] = useState(null)
  const [userActions, setUserActions] = useState([])

  const fetchActions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 50 })
      if (filters.search) params.append('search', filters.search)
      if (filters.actionType) params.append('actionType', filters.actionType)
      if (filters.station) params.append('station', filters.station)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      
      const response = await api.get(`/tracking/actions?${params}`)
      // api.get returns raw data, not wrapped in { data }
      const data = response.data || response
      setActions(data.actions || [])
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Error fetching actions:', error)
    }
    setLoading(false)
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/tracking/actions/stats')
      // api.get returns raw data, not wrapped in { data }
      setStats(response.data || response)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchUserActions = async (userName) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search: userName, limit: 100 })
      const response = await api.get(`/tracking/actions?${params}`)
      const data = response.data || response
      setUserActions(data.actions || [])
      setSelectedUser(userName)
    } catch (error) {
      console.error('Error fetching user actions:', error)
    }
    setLoading(false)
  }

  const closeUserDetail = () => {
    setSelectedUser(null)
    setUserActions([])
  }

  useEffect(() => {
    fetchActions()
    fetchStats()
  }, [page, filters])

  const actionTypeColors = {
    view: 'bg-blue-100 text-blue-700',
    create: 'bg-green-100 text-green-700',
    update: 'bg-yellow-100 text-yellow-700',
    delete: 'bg-red-100 text-red-700',
    scan: 'bg-purple-100 text-purple-700',
    move: 'bg-indigo-100 text-indigo-700',
    login: 'bg-teal-100 text-teal-700',
    logout: 'bg-gray-100 text-gray-700',
    other: 'bg-gray-100 text-gray-600'
  }

  const stationColors = {
    wallsaw: 'bg-orange-100 text-orange-700',
    cnc: 'bg-blue-100 text-blue-700',
    banding: 'bg-green-100 text-green-700',
    packaging: 'bg-purple-100 text-purple-700',
    complete: 'bg-emerald-100 text-emerald-700'
  }

  return (
    <div className="pt-14">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Activity Tracking</h1>
          <p className="text-gray-600">Monitor user actions and part movements</p>
        </div>
        <button 
          onClick={() => { fetchActions(); fetchStats(); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Activity size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.totalActions}</p>
                <p className="text-sm text-gray-500">Total Actions</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <MapPin size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.actionsByType?.find(a => a.actionType === 'scan')?.count || 0}
                </p>
                <p className="text-sm text-gray-500">Scans Today</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.actionsByUser?.length || 0}</p>
                <p className="text-sm text-gray-500">Active Users</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.actionsByStation?.length || 0}</p>
                <p className="text-sm text-gray-500">Active Stations</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('actions')}
          className={`px-4 py-2 rounded-lg ${activeTab === 'actions' ? 'bg-amber-600 text-white' : 'bg-white text-gray-600'}`}
        >
          User Actions
        </button>
        <button
          onClick={() => setActiveTab('stations')}
          className={`px-4 py-2 rounded-lg ${activeTab === 'stations' ? 'bg-amber-600 text-white' : 'bg-white text-gray-600'}`}
        >
          Station Activity
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg ${activeTab === 'users' ? 'bg-amber-600 text-white' : 'bg-white text-gray-600'}`}
        >
          User Activity
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search actions, users, entities..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <Filter size={18} /> Filters {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <select
              value={filters.actionType}
              onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">All Action Types</option>
              <option value="view">View</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="scan">Scan</option>
              <option value="move">Move</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>
            <select
              value={filters.station}
              onChange={(e) => setFilters({ ...filters, station: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">All Stations</option>
              <option value="wallsaw">Wallsaw</option>
              <option value="cnc">CNC Machine</option>
              <option value="banding">Banding Machine</option>
              <option value="packaging">Packaging</option>
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="px-3 py-2 border rounded-lg"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="px-3 py-2 border rounded-lg"
              placeholder="End Date"
            />
          </div>
        )}
      </div>

      {/* Actions Table */}
      {activeTab === 'actions' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Station</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : actions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No actions found</td>
                </tr>
              ) : (
                actions.map((action) => (
                  <tr key={action.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(action.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {action.userName || 'System'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{action.action}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${actionTypeColors[action.actionType] || actionTypeColors.other}`}>
                        {action.actionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {action.entityName || action.entityType || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {action.station ? (
                        <span className={`px-2 py-1 rounded-full text-xs ${stationColors[action.station] || 'bg-gray-100'}`}>
                          {action.station}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{action.page || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {/* Pagination */}
          <div className="flex justify-between items-center px-4 py-3 border-t">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Station Activity */}
      {activeTab === 'stations' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['wallsaw', 'cnc', 'banding', 'packaging'].map(station => {
            const stationData = stats.actionsByStation?.find(s => s.station === station)
            return (
              <div key={station} className="bg-white rounded-xl shadow-md p-4">
                <div className={`inline-block px-3 py-1 rounded-full text-sm mb-3 ${stationColors[station]}`}>
                  {station.charAt(0).toUpperCase() + station.slice(1)}
                </div>
                <p className="text-3xl font-bold text-gray-800">{stationData?.count || 0}</p>
                <p className="text-sm text-gray-500">Total scans</p>
              </div>
            )
          })}
        </div>
      )}

      {/* User Activity */}
      {activeTab === 'users' && stats && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.actionsByUser?.map((user, idx) => (
                <tr 
                  key={idx} 
                  className="hover:bg-amber-50 cursor-pointer transition-colors"
                  onClick={() => fetchUserActions(user.userName)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{user.userName || 'Unknown'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-amber-50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Activity History</h2>
                <p className="text-sm text-gray-600">User: {selectedUser}</p>
              </div>
              <button 
                onClick={closeUserDetail}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="overflow-auto max-h-[60vh]">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : userActions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No actions found for this user</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Station</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {userActions.map((action) => (
                      <tr key={action.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(action.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{action.action}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${actionTypeColors[action.actionType] || actionTypeColors.other}`}>
                            {action.actionType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {action.entityName || action.entityType || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {action.station ? (
                            <span className={`px-2 py-1 rounded-full text-xs ${stationColors[action.station] || 'bg-gray-100'}`}>
                              {action.station}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{action.page || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
              <p className="text-sm text-gray-500">{userActions.length} actions found</p>
              <button 
                onClick={closeUserDetail}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tracking
