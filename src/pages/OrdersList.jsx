import { useState, useEffect } from 'react'
import { ArrowLeft, Factory, Search, Filter } from 'lucide-react'
import { api } from '../services/api'

function OrdersList({ listType, onBack, onViewDetail }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const titles = {
    orders: 'Active Orders',
    panels: 'All Production Orders',
    quality: 'Quality Issues',
    completed: 'Completed Orders'
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        let response
        switch (listType) {
          case 'orders':
            response = await api.get('/production/orders')
            setItems(response.data.filter(o => o.status === 'In Progress' || o.status === 'Pending'))
            break
          case 'panels':
            response = await api.get('/production/orders')
            setItems(response.data)
            break
          case 'quality':
            response = await api.get('/quality/defects')
            setItems(response.data.filter(d => d.status !== 'Resolved'))
            break
          case 'completed':
            response = await api.get('/production/orders')
            setItems(response.data.filter(o => o.status === 'Completed'))
            break
          default:
            setItems([])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [listType])

  const filteredItems = items.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    if (listType === 'quality') {
      return (item.defectType?.toLowerCase().includes(searchLower) || 
              item.panelId?.toLowerCase().includes(searchLower))
    }
    return (item.orderNumber?.toLowerCase().includes(searchLower) || 
            item.customerName?.toLowerCase().includes(searchLower))
  })

  if (loading) {
    return (
      <div className="pt-14 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="pt-14">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4">
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{titles[listType]}</h2>
          <p className="text-gray-600">{filteredItems.length} items found</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        {listType === 'quality' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Panel ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Defect Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Severity</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr 
                    key={item.id} 
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => onViewDetail && onViewDetail(item.id)}
                  >
                    <td className="py-3 px-4 font-medium text-amber-600 hover:underline">{item.panelId}</td>
                    <td className="py-3 px-4 text-gray-600">{item.defectType}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                        item.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                        item.status === 'In Rework' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order #</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Panels</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr 
                    key={item.id} 
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => onViewDetail && onViewDetail(item.id)}
                  >
                    <td className="py-3 px-4 font-medium text-amber-600 hover:underline">{item.orderNumber || item.id}</td>
                    <td className="py-3 px-4 text-gray-600">{item.customerName || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-600">{item.totalPanels || 0}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        item.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredItems.length === 0 && (
          <p className="text-center text-gray-500 py-8">No items found</p>
        )}
      </div>
    </div>
  )
}

export default OrdersList
