import { useState, useEffect } from 'react'
import { Plus, Search, Filter, QrCode, Play, Pause, CheckCircle, Clock, ArrowRight, Package } from 'lucide-react'
import { api } from '../services/api'
import Pagination from '../components/Pagination'

const WORKFLOW_STAGES = [
  { id: 'pending', name: 'Pending', color: 'bg-gray-400', description: 'Order received, awaiting start', statuses: ['Pending', 'Draft'] },
  { id: 'cutting', name: 'Cutting', color: 'bg-orange-500', description: 'Cutting panels to size', statuses: ['Cutting'] },
  { id: 'drilling', name: 'Drilling', color: 'bg-blue-500', description: 'CNC machining and drilling', statuses: ['Drilling'] },
  { id: 'banding', name: 'Edge Banding', color: 'bg-green-500', description: 'Edge banding application', statuses: ['Edge Banding'] },
  { id: 'packaging', name: 'Packaging', color: 'bg-purple-500', description: 'Packaging for delivery', statuses: ['Assembly'] },
  { id: 'completed', name: 'Completed', color: 'bg-emerald-500', description: 'Ready for shipping', statuses: ['Completed'] }
]

// Helper to get stage index from order status
const getStageIndexFromStatus = (status) => {
  if (!status) return 0
  const index = WORKFLOW_STAGES.findIndex(s => s.statuses.includes(status))
  return index >= 0 ? index : 0
}

function Production({ onViewDetail }) {
  const [orders, setOrders] = useState([])
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showTimeline, setShowTimeline] = useState(true)
  const [showNewOrderModal, setShowNewOrderModal] = useState(false)
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    designId: '',
    totalPanels: 10,
    dueDate: ''
  })
  const [designs, setDesigns] = useState([])
  const [creating, setCreating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, stationsRes, designsRes] = await Promise.all([
          api.get('/production/orders'),
          api.get('/production/stations'),
          api.get('/designs')
        ])
        setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes.data || [])
        setStations(Array.isArray(stationsRes) ? stationsRes : stationsRes.data || [])
        setDesigns(Array.isArray(designsRes) ? designsRes : designsRes.data || [])
      } catch (error) {
        console.error('Error fetching production data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleCreateOrder = async () => {
    if (!newOrder.customerName || !newOrder.designId) {
      alert('Please fill in customer name and select a design')
      return
    }
    
    setCreating(true)
    try {
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`
      const today = new Date().toISOString().split('T')[0]
      const result = await api.post('/production/orders', {
        orderNumber,
        customerName: newOrder.customerName,
        designId: newOrder.designId,
        totalPanels: newOrder.totalPanels,
        completedPanels: 0,
        status: 'Pending',
        orderDate: today,
        dueDate: newOrder.dueDate || today
      })
      
      // Add new order to list
      const createdOrder = Array.isArray(result) ? result[0] : result.data || result
      setOrders(prev => [createdOrder, ...prev])
      
      // Reset form and close modal
      setNewOrder({ customerName: '', designId: '', totalPanels: 10, dueDate: '' })
      setShowNewOrderModal(false)
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  const filteredOrders = (orders || []).filter(order => {
    if (!order) return false
    const orderId = (order.id || order.orderNumber || '').toString().toLowerCase()
    const customer = (order.customer || order.customerName || '').toLowerCase()
    const status = (order.status || '').toLowerCase()
    
    const matchesSearch = !searchTerm || orderId.includes(searchTerm.toLowerCase()) || customer.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })
  
  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  return (
    <div className="pt-14">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Production Management</h2>
          <p className="text-gray-600">Track and manage production orders</p>
        </div>
        <button 
          onClick={() => setShowNewOrderModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus size={18} /> New Order
        </button>
      </div>

      {/* Production Timeline */}
      {showTimeline && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock size={20} /> Production Workflow Timeline
            </h3>
            <button 
              onClick={() => setShowTimeline(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Hide
            </button>
          </div>
          
          {/* Workflow Stages */}
          <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
            {WORKFLOW_STAGES.map((stage, idx) => {
              const ordersAtStage = (orders || []).filter(o => o && stage.statuses.includes(o.status)).length
              return (
                <div key={stage.id} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[100px]">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full ${stage.color} flex items-center justify-center text-white font-bold shadow-lg`}>
                        {idx + 1}
                      </div>
                      {ordersAtStage > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {ordersAtStage}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-700 mt-2">{stage.name}</p>
                    <p className="text-xs text-gray-500 text-center max-w-[100px]">{stage.description}</p>
                  </div>
                  {idx < WORKFLOW_STAGES.length - 1 && (
                    <ArrowRight size={24} className="text-gray-300 mx-2 flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Orders in Timeline */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-600 mb-3">Active Orders in Pipeline</h4>
            <div className="space-y-3">
              {(orders || []).filter(o => o && o.status !== 'Completed').slice(0, 5).map((order) => {
                const currentStageIndex = getStageIndexFromStatus(order.status)
                const progress = ((currentStageIndex + 1) / WORKFLOW_STAGES.length) * 100
                const orderDisplay = order.orderNumber || order.id
                const customerDisplay = order.customerName || order.customer || 'Unknown'
                const dueDateDisplay = order.dueDate || 'N/A'
                const completedPanels = order.completedPanels || order.completed || 0
                const totalPanels = order.totalPanels || order.panels || 0
                
                return (
                  <div 
                    key={order.id} 
                    className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 cursor-pointer"
                    onClick={() => onViewDetail && onViewDetail(order.id)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <Package size={18} className="text-amber-600" />
                        <span className="font-medium text-gray-800">{orderDisplay}</span>
                        <span className="text-sm text-gray-500">{customerDisplay}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${WORKFLOW_STAGES[currentStageIndex]?.color || 'bg-gray-400'} text-white`}>
                        {order.status || 'Unknown'}
                      </span>
                    </div>
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="absolute h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                      {WORKFLOW_STAGES.map((stage, idx) => (
                        <div 
                          key={stage.id}
                          className={`absolute top-0 w-1 h-full ${idx <= currentStageIndex ? 'bg-amber-700' : 'bg-gray-300'}`}
                          style={{ left: `${((idx + 1) / WORKFLOW_STAGES.length) * 100}%` }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">Due: {dueDateDisplay}</span>
                      <span className="text-xs text-gray-500">{completedPanels}/{totalPanels} panels</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {!showTimeline && (
        <button 
          onClick={() => setShowTimeline(true)}
          className="mb-4 text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
        >
          <Clock size={16} /> Show Production Timeline
        </button>
      )}


      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="cutting">Cutting</option>
              <option value="drilling">Drilling</option>
              <option value="edge banding">Edge Banding</option>
              <option value="assembly">Assembly</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Design</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Progress</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Due Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => {
                const orderDisplay = order.orderNumber || order.id
                const customerDisplay = order.customerName || order.customer || 'Unknown'
                const designDisplay = order.design?.name || order.designName || 'N/A'
                const completedPanels = order.completedPanels || order.completed || 0
                const totalPanels = order.totalPanels || order.panels || 1
                const dueDateDisplay = order.dueDate || 'N/A'
                const progressPercent = totalPanels > 0 ? (completedPanels / totalPanels) * 100 : 0
                
                return (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => onViewDetail && onViewDetail(order.id)}>
                  <td className="py-3 px-4 font-medium text-gray-800 text-amber-600 hover:underline">{orderDisplay}</td>
                  <td className="py-3 px-4 text-gray-600">{customerDisplay}</td>
                  <td className="py-3 px-4 text-gray-600">{designDisplay}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-amber-600 h-2 rounded-full"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500">{completedPanels}/{totalPanels}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'Cutting' ? 'bg-orange-100 text-orange-700' :
                      order.status === 'Drilling' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'Edge Banding' ? 'bg-green-100 text-green-700' :
                      order.status === 'Assembly' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{dueDateDisplay}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded">
                        <QrCode size={18} />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded">
                        <CheckCircle size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredOrders.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* New Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Order</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={newOrder.customerName}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Enter customer name"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Design *</label>
                <select
                  value={newOrder.designId}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, designId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">Select a design...</option>
                  {designs.map(design => (
                    <option key={design.id} value={design.id}>{design.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Panels</label>
                <input
                  type="number"
                  min="1"
                  value={newOrder.totalPanels}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, totalPanels: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newOrder.dueDate}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={creating}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Production
