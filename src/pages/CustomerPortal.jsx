import { useState, useEffect } from 'react'
import { Package, Truck, CheckCircle, Clock, Search, QrCode, MapPin, Calendar, FileText, Phone, Mail } from 'lucide-react'
import { api } from '../services/api'

export default function CustomerPortal() {
  const [trackingCode, setTrackingCode] = useState('')
  const [orderData, setOrderData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    loadRecentOrders()
  }, [])

  const loadRecentOrders = async () => {
    try {
      const orders = await api.get('/production/orders')
      setRecentOrders(orders.slice(0, 5))
    } catch (err) {
      console.error('Error loading orders:', err)
    }
  }

  const trackOrder = async () => {
    if (!trackingCode.trim()) {
      setError('Please enter an order number or tracking code')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Try to find by order number first
      const orders = await api.get('/production/orders')
      const order = orders.find(o => 
        o.orderNumber?.toLowerCase().includes(trackingCode.toLowerCase()) ||
        o.id === trackingCode
      )
      
      if (order) {
        // Get tracking history
        const tracking = await api.get(`/tracking/order/${order.id}`).catch(() => [])
        setOrderData({ ...order, tracking })
      } else {
        setError('Order not found. Please check your tracking code.')
        setOrderData(null)
      }
    } catch (err) {
      setError('Error tracking order. Please try again.')
      setOrderData(null)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Cutting': 'bg-purple-100 text-purple-800',
      'Drilling': 'bg-indigo-100 text-indigo-800',
      'Edge Banding': 'bg-pink-100 text-pink-800',
      'Assembly': 'bg-orange-100 text-orange-800',
      'QC': 'bg-cyan-100 text-cyan-800',
      'Completed': 'bg-green-100 text-green-800',
      'Shipped': 'bg-emerald-100 text-emerald-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getProgressPercentage = (status) => {
    const stages = ['Pending', 'In Progress', 'Cutting', 'Drilling', 'Edge Banding', 'Assembly', 'QC', 'Completed', 'Shipped']
    const index = stages.indexOf(status)
    return Math.round(((index + 1) / stages.length) * 100)
  }

  const stages = [
    { name: 'Order Received', icon: FileText, status: 'Pending' },
    { name: 'In Production', icon: Package, status: 'In Progress' },
    { name: 'Quality Check', icon: CheckCircle, status: 'QC' },
    { name: 'Ready for Delivery', icon: Truck, status: 'Completed' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-amber-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Customer Order Portal</h1>
          <p className="text-amber-100">Track your cabinet order in real-time</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Search Box */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Search size={20} className="text-amber-600" />
            Track Your Order
          </h2>
          
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && trackOrder()}
                placeholder="Enter order number (e.g., ORD-2026-001)"
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <QrCode size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <button
              onClick={trackOrder}
              disabled={loading}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </div>

          {error && (
            <p className="mt-3 text-red-600 text-sm">{error}</p>
          )}
        </div>

        {/* Order Details */}
        {orderData && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Order Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-amber-100 text-sm">Order Number</p>
                  <h3 className="text-2xl font-bold">{orderData.orderNumber}</h3>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(orderData.status)}`}>
                  {orderData.status}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="p-6 border-b">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Production Progress</span>
                <span className="text-sm font-medium text-amber-600">{getProgressPercentage(orderData.status)}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-green-500 transition-all duration-500"
                  style={{ width: `${getProgressPercentage(orderData.status)}%` }}
                />
              </div>
            </div>

            {/* Stage Indicators */}
            <div className="p-6 border-b">
              <div className="flex justify-between">
                {stages.map((stage, i) => {
                  const stageIndex = stages.findIndex(s => s.status === orderData.status)
                  const isCompleted = i <= stageIndex
                  const isCurrent = i === stageIndex
                  
                  return (
                    <div key={stage.name} className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-amber-200' : ''}`}>
                        <stage.icon size={24} />
                      </div>
                      <p className={`mt-2 text-xs text-center ${isCompleted ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                        {stage.name}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order Info */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Order Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} />
                    <span>Order Date: {new Date(orderData.orderDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={16} />
                    <span>Due Date: {new Date(orderData.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Package size={16} />
                    <span>Total Panels: {orderData.totalPanels}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle size={16} />
                    <span>Completed: {orderData.completedPanels || 0} / {orderData.totalPanels}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Customer Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={16} />
                    <span>{orderData.customerName}</span>
                  </div>
                  {orderData.notes && (
                    <div className="flex items-start gap-2 text-gray-600">
                      <FileText size={16} className="mt-0.5" />
                      <span>{orderData.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tracking History */}
            {orderData.tracking && orderData.tracking.length > 0 && (
              <div className="p-6 bg-gray-50">
                <h4 className="font-semibold text-gray-800 mb-4">Tracking History</h4>
                <div className="space-y-3">
                  {orderData.tracking.slice(0, 10).map((event, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-amber-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {event.station} - {event.action}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.scan_time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Access - Recent Orders */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {recentOrders.map(order => (
              <button
                key={order.id}
                onClick={() => {
                  setTrackingCode(order.orderNumber)
                  setOrderData(order)
                }}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Package size={20} className="text-amber-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-800">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{order.customerName}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="tel:+31201234567" className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100">
              <Phone size={24} className="text-blue-600" />
              <div>
                <p className="font-medium text-gray-800">Call Us</p>
                <p className="text-sm text-gray-600">+31 20 123 4567</p>
              </div>
            </a>
            <a href="mailto:support@woodworking.com" className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100">
              <Mail size={24} className="text-green-600" />
              <div>
                <p className="font-medium text-gray-800">Email Support</p>
                <p className="text-sm text-gray-600">support@woodworking.com</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
