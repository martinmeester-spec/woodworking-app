import { useState, useEffect } from 'react'
import { TrendingUp, Package, Factory, AlertTriangle, CheckCircle, Clock, RefreshCw, X, Palette, Scan, HelpCircle, ArrowRight, Zap } from 'lucide-react'
import { api } from '../services/api'

function Dashboard({ onNavigate, onViewList }) {
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)
  const [showQuickStart, setShowQuickStart] = useState(() => {
    return localStorage.getItem('hideQuickStart') !== 'true'
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [statsData, ordersData, machinesData] = await Promise.all([
        api.getDashboardStats(),
        api.getOrders(),
        api.getMachines()
      ])
      setStats(statsData)
      setOrders(ordersData.slice(0, 5))
      setMachines(machinesData.slice(0, 4))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
    setLoading(false)
  }

  const handleStatClick = (type) => {
    if (onViewList) {
      onViewList(type)
    }
  }

  const dismissQuickStart = () => {
    setShowQuickStart(false)
    localStorage.setItem('hideQuickStart', 'true')
  }

  const statCards = stats ? [
    { label: 'Active Orders', value: stats.activeOrders, icon: Factory, color: 'bg-blue-500', type: 'orders' },
    { label: 'Panels in Production', value: stats.panelsInProduction, icon: Package, color: 'bg-green-500', type: 'panels' },
    { label: 'Quality Issues', value: stats.qualityIssues, icon: AlertTriangle, color: 'bg-red-500', type: 'quality' },
    { label: 'Completed Today', value: stats.completedToday, icon: CheckCircle, color: 'bg-purple-500', type: 'completed' },
  ] : []

  return (
    <div className="pt-14">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-600">Welcome to the Woodworking Cabinet Management System</p>
      </div>

      {/* Quick Start Guide */}
      {showQuickStart && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg p-6 mb-6 text-white relative">
          <button
            onClick={dismissQuickStart}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
            title="Dismiss"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Quick Start Guide</h3>
              <p className="text-amber-100 text-sm">Get started with cabinet design and production</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <QuickStartStep
              number={1}
              icon={Palette}
              title="Create Design"
              description="Use the 3D Design Studio to create custom cabinet designs with precise dimensions"
              action="Go to Design Studio"
            />
            <QuickStartStep
              number={2}
              icon={Factory}
              title="Create Order"
              description="Convert your design into a production order with customer details"
              action="View Production"
            />
            <QuickStartStep
              number={3}
              icon={Scan}
              title="Track Parts"
              description="Scan QR codes to track parts through Wall Saw, CNC, Banding, and Packaging"
              action="Production Floor"
            />
            <QuickStartStep
              number={4}
              icon={CheckCircle}
              title="Complete"
              description="Mark orders complete when all parts finish production"
              action="View Orders"
            />
          </div>

          <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
            <p className="text-sm text-amber-100">
              <HelpCircle size={14} className="inline mr-1" />
              Need more help? Check out the Documentation page for detailed guides.
            </p>
            <button
              onClick={dismissQuickStart}
              className="text-sm text-amber-100 hover:text-white underline"
            >
              Don't show again
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div 
              key={index} 
              className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleStatClick(stat.type)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-amber-600 text-sm flex items-center gap-1">
                    Click to view list →
                  </p>
                </div>
                <div className={`${stat.color} p-4 rounded-full text-white`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Production Orders</h3>
          <div className="space-y-4">
            {orders.map((order) => {
              const progress = order.totalPanels > 0 ? Math.round((order.completedPanels / order.totalPanels) * 100) : 0
              return (
              <div 
                key={order.id} 
                className="border-b pb-4 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                onClick={() => onNavigate && onNavigate('order-detail', order.id)}
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-medium text-gray-800 hover:text-amber-600">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{order.customerName}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'Cutting' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'Finishing' ? 'bg-green-100 text-green-700' :
                    order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-amber-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500">{progress}%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{order.totalPanels} panels</p>
              </div>
            )})}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Machine Status</h3>
          <div className="space-y-4">
            {machines.map((machine, index) => (
              <div key={machine.id || index} className="flex items-center justify-between border-b pb-4 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    machine.status === 'Running' ? 'bg-green-500' :
                    machine.status === 'Idle' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-800">{machine.name}</p>
                    <p className="text-sm text-gray-500">{machine.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">{machine.uptimePercentage}%</p>
                  <p className="text-xs text-gray-500">{machine.machineId}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      </div>
  )
}

// Quick Start Step Component
function QuickStartStep({ number, icon: Icon, title, description, action }) {
  return (
    <div className="bg-white/10 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-white text-amber-600 flex items-center justify-center text-sm font-bold">
          {number}
        </div>
        <Icon size={18} />
        <span className="font-semibold">{title}</span>
      </div>
      <p className="text-sm text-amber-100 mb-2">{description}</p>
      <span className="text-xs text-white/70 flex items-center gap-1">
        {action} <ArrowRight size={12} />
      </span>
    </div>
  )
}

export default Dashboard
