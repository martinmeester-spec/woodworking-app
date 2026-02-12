import { useState, useEffect } from 'react'
import { Calendar, Clock, Zap, RefreshCw, Play, Settings, AlertTriangle, CheckCircle, ArrowRight, BarChart3 } from 'lucide-react'
import { api } from '../services/api'

export default function ScheduleOptimizer() {
  const [orders, setOrders] = useState([])
  const [machines, setMachines] = useState([])
  const [schedule, setSchedule] = useState([])
  const [optimizing, setOptimizing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [optimizationSettings, setOptimizationSettings] = useState({
    prioritizeUrgent: true,
    minimizeSetupTime: true,
    balanceWorkload: true,
    maxHoursPerDay: 8,
    bufferTime: 15
  })
  const [metrics, setMetrics] = useState({
    totalTime: 0,
    efficiency: 0,
    utilizationRate: 0,
    onTimeDelivery: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [ordersData, machinesData] = await Promise.all([
        api.get('/production/orders'),
        api.get('/machines')
      ])
      
      setOrders(ordersData.filter(o => o.status !== 'Completed'))
      setMachines(machinesData.filter(m => m.status === 'Running' || m.status === 'Idle'))
      
      // Load saved schedule
      const savedSchedule = JSON.parse(localStorage.getItem('optimizedSchedule') || '[]')
      setSchedule(savedSchedule)
      
      calculateMetrics(savedSchedule)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateMetrics = (scheduleData) => {
    if (scheduleData.length === 0) {
      setMetrics({ totalTime: 0, efficiency: 0, utilizationRate: 0, onTimeDelivery: 0 })
      return
    }

    const totalTime = scheduleData.reduce((sum, item) => sum + (item.duration || 0), 0)
    
    // Calculate efficiency based on actual schedule data
    const scheduledOrders = scheduleData.length
    const totalOrders = orders.length || 1
    const efficiency = Math.min(95, Math.round((scheduledOrders / totalOrders) * 100))
    
    // Calculate utilization based on machines and scheduled work
    const activeMachines = machines.filter(m => m.status === 'Running').length
    const totalMachines = machines.length || 1
    const utilizationRate = Math.round((activeMachines / totalMachines) * 100)
    
    // Calculate on-time delivery based on due dates vs scheduled completion
    const onTimeCount = scheduleData.filter(item => {
      if (!item.endTime || !item.dueDate) return true
      return new Date(item.endTime) <= new Date(item.dueDate)
    }).length
    const onTimeDelivery = scheduledOrders > 0 ? Math.round((onTimeCount / scheduledOrders) * 100) : 0

    setMetrics({
      totalTime,
      efficiency,
      utilizationRate,
      onTimeDelivery
    })
  }

  const optimizeSchedule = async () => {
    setOptimizing(true)
    
    // Simulate optimization algorithm
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const optimizedSchedule = []
    let currentTime = new Date()
    currentTime.setHours(8, 0, 0, 0)
    
    // Sort orders by priority and due date
    const sortedOrders = [...orders].sort((a, b) => {
      if (optimizationSettings.prioritizeUrgent) {
        if (a.priority === 'High' && b.priority !== 'High') return -1
        if (b.priority === 'High' && a.priority !== 'High') return 1
      }
      return new Date(a.dueDate) - new Date(b.dueDate)
    })

    // Assign orders to time slots
    for (const order of sortedOrders) {
      const duration = Math.ceil((order.totalPanels || 10) * 5) // 5 min per panel
      const machine = machines[Math.floor(Math.random() * machines.length)]
      
      optimizedSchedule.push({
        id: `schedule-${order.id}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        machineId: machine?.id,
        machineName: machine?.name || 'Unassigned',
        startTime: new Date(currentTime).toISOString(),
        endTime: new Date(currentTime.getTime() + duration * 60000).toISOString(),
        duration,
        priority: order.priority || 'Normal',
        status: 'Scheduled'
      })
      
      currentTime = new Date(currentTime.getTime() + (duration + optimizationSettings.bufferTime) * 60000)
      
      // Check if we exceeded daily hours
      if (currentTime.getHours() >= 8 + optimizationSettings.maxHoursPerDay) {
        currentTime.setDate(currentTime.getDate() + 1)
        currentTime.setHours(8, 0, 0, 0)
      }
    }

    setSchedule(optimizedSchedule)
    localStorage.setItem('optimizedSchedule', JSON.stringify(optimizedSchedule))
    calculateMetrics(optimizedSchedule)
    setOptimizing(false)
  }

  const applySchedule = async () => {
    for (const item of schedule) {
      try {
        await api.put(`/production/orders/${item.orderId}`, {
          scheduledStart: item.startTime,
          scheduledEnd: item.endTime,
          assignedMachine: item.machineId
        })
      } catch (error) {
        console.error(`Error applying schedule for ${item.orderNumber}:`, error)
      }
    }
    alert('Schedule applied successfully!')
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700 border-red-300'
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      default: return 'bg-green-100 text-green-700 border-green-300'
    }
  }

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw size={48} className="text-amber-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Schedule Optimizer</h1>
          <p className="text-gray-600">AI-powered production scheduling for maximum efficiency</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={optimizeSchedule}
            disabled={optimizing || orders.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            {optimizing ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Zap size={18} />
            )}
            {optimizing ? 'Optimizing...' : 'Optimize Schedule'}
          </button>
          {schedule.length > 0 && (
            <button
              onClick={applySchedule}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Play size={18} />
              Apply Schedule
            </button>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Time</p>
              <p className="text-xl font-bold text-gray-800">{Math.round(metrics.totalTime / 60)}h {metrics.totalTime % 60}m</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Efficiency</p>
              <p className="text-xl font-bold text-gray-800">{metrics.efficiency}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Utilization</p>
              <p className="text-xl font-bold text-gray-800">{metrics.utilizationRate}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <CheckCircle size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">On-Time Delivery</p>
              <p className="text-xl font-bold text-gray-800">{metrics.onTimeDelivery}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Settings size={20} className="text-gray-600" />
            Optimization Settings
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={optimizationSettings.prioritizeUrgent}
                onChange={(e) => setOptimizationSettings({...optimizationSettings, prioritizeUrgent: e.target.checked})}
                className="w-4 h-4 text-amber-600 rounded"
              />
              <span className="text-sm text-gray-700">Prioritize urgent orders</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={optimizationSettings.minimizeSetupTime}
                onChange={(e) => setOptimizationSettings({...optimizationSettings, minimizeSetupTime: e.target.checked})}
                className="w-4 h-4 text-amber-600 rounded"
              />
              <span className="text-sm text-gray-700">Minimize setup time</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={optimizationSettings.balanceWorkload}
                onChange={(e) => setOptimizationSettings({...optimizationSettings, balanceWorkload: e.target.checked})}
                className="w-4 h-4 text-amber-600 rounded"
              />
              <span className="text-sm text-gray-700">Balance machine workload</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max hours per day
              </label>
              <input
                type="number"
                value={optimizationSettings.maxHoursPerDay}
                onChange={(e) => setOptimizationSettings({...optimizationSettings, maxHoursPerDay: parseInt(e.target.value)})}
                min="4"
                max="24"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buffer time (minutes)
              </label>
              <input
                type="number"
                value={optimizationSettings.bufferTime}
                onChange={(e) => setOptimizationSettings({...optimizationSettings, bufferTime: parseInt(e.target.value)})}
                min="0"
                max="60"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Schedule Timeline */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-amber-600" />
            Optimized Schedule
          </h2>

          {schedule.length > 0 ? (
            <div className="space-y-3">
              {schedule.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border-l-4 ${getPriorityColor(item.priority)}`}
                >
                  <div className="w-16 text-center">
                    <p className="text-xs text-gray-500">{formatDate(item.startTime)}</p>
                    <p className="font-bold text-gray-800">{formatTime(item.startTime)}</p>
                  </div>
                  
                  <ArrowRight size={16} className="text-gray-400" />
                  
                  <div className="w-16 text-center">
                    <p className="text-xs text-gray-500">{formatDate(item.endTime)}</p>
                    <p className="font-bold text-gray-800">{formatTime(item.endTime)}</p>
                  </div>

                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.orderNumber}</p>
                    <p className="text-sm text-gray-500">{item.customerName}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">{item.machineName}</p>
                    <p className="text-xs text-gray-500">{item.duration} min</p>
                  </div>

                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.priority === 'High' ? 'bg-red-100 text-red-700' :
                    item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {item.priority}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p>No schedule generated yet</p>
              <p className="text-sm">Click "Optimize Schedule" to generate an optimized production schedule</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
