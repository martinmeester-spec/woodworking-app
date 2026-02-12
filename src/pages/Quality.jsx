import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Plus, Search } from 'lucide-react'
import { api } from '../services/api'

function Quality({ onViewDetail }) {
  const [defects, setDefects] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [defectsRes, metricsRes] = await Promise.all([
          api.get('/quality/defects'),
          api.get('/quality/summary')
        ])
        setDefects(defectsRes.data || [])
        setMetrics(metricsRes.data || {})
      } catch (error) {
        console.error('Error fetching quality data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const stats = metrics ? [
    { label: 'Open Issues', value: metrics.open || 0, icon: AlertTriangle, color: 'bg-yellow-500' },
    { label: 'In Rework', value: metrics.inRework || 0, icon: XCircle, color: 'bg-orange-500' },
    { label: 'Resolved', value: metrics.resolved || 0, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Total Defects', value: metrics.total || 0, icon: AlertTriangle, color: 'bg-red-500' },
  ] : []

  const filteredDefects = (defects || []).filter(defect => {
    if (!defect) return false
    const panelId = (defect.panelId || '').toLowerCase()
    const orderId = (defect.orderId || '').toLowerCase()
    const type = (defect.type || defect.defectType || '').toLowerCase()
    const status = (defect.status || '').toLowerCase()
    
    const matchesSearch = !searchTerm || panelId.includes(searchTerm.toLowerCase()) || orderId.includes(searchTerm.toLowerCase()) || type.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  return (
    <div className="pt-14">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quality Control</h2>
          <p className="text-gray-600">Track defects and manage rework orders</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
          <Plus size={18} /> Report Defect
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center gap-4">
                <div className={`${stat.color} p-3 rounded-full text-white`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search defects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in rework">In Rework</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Panel ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Defect Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Severity</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Station</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Detected By</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDefects.map((defect) => {
                const panelId = defect.panelId || defect.panel_id || 'N/A'
                const orderId = defect.orderId || defect.order_id || 'N/A'
                const defectType = defect.type || defect.defectType || 'Unknown'
                const severity = defect.severity || 'Medium'
                const station = defect.station?.stationName || defect.stationName || 'N/A'
                const detectedBy = defect.detectedBy || defect.reportedBy || 'Unknown'
                const date = defect.date || defect.createdAt?.split('T')[0] || 'N/A'
                const status = defect.status || 'Open'
                
                return (
                <tr key={defect.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => onViewDetail && onViewDetail(defect.id)}>
                  <td className="py-3 px-4 font-medium text-amber-600 hover:underline">{panelId}</td>
                  <td className="py-3 px-4 text-gray-600">{orderId}</td>
                  <td className="py-3 px-4 text-gray-600">{defectType}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      severity === 'Critical' ? 'bg-red-100 text-red-700' :
                      severity === 'High' ? 'bg-orange-100 text-orange-700' :
                      severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{station}</td>
                  <td className="py-3 px-4 text-gray-600">{detectedBy}</td>
                  <td className="py-3 px-4 text-gray-500">{date}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      status === 'Resolved' ? 'bg-green-100 text-green-700' :
                      status === 'In Rework' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {status}
                    </span>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Quality
