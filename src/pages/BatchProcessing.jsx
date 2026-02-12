import { useState, useEffect } from 'react'
import { Layers, Upload, Play, Pause, CheckCircle, AlertCircle, Clock, Package, RefreshCw, Download, Trash2 } from 'lucide-react'
import { api } from '../services/api'

export default function BatchProcessing() {
  const [batches, setBatches] = useState([])
  const [orders, setOrders] = useState([])
  const [selectedOrders, setSelectedOrders] = useState([])
  const [batchName, setBatchName] = useState('')
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const ordersData = await api.get('/production/orders')
      const savedBatches = JSON.parse(localStorage.getItem('productionBatches') || '[]')
      setBatches(savedBatches)
      
      // Get all order IDs that are already in a batch (not completed)
      const ordersInBatches = new Set()
      savedBatches.forEach(batch => {
        if (batch.status !== 'Completed') {
          batch.orders.forEach(o => ordersInBatches.add(o.id))
        }
      })
      
      // Filter to only show pending/draft orders that are NOT already in a batch
      const availableOrders = ordersData.filter(o => 
        (o.status === 'Pending' || o.status === 'Draft') && !ordersInBatches.has(o.id)
      )
      setOrders(availableOrders)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const selectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(orders.map(o => o.id))
    }
  }

  const createBatch = () => {
    if (selectedOrders.length === 0) return

    const generatedName = batchName.trim() || `Batch ${new Date().toLocaleDateString()} - ${selectedOrders.length} orders`
    
    const newBatch = {
      id: `BATCH-${Date.now()}`,
      name: generatedName,
      createdAt: new Date().toISOString(),
      status: 'Pending',
      orders: selectedOrders.map(id => {
        const order = orders.find(o => o.id === id)
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          totalPanels: order.totalPanels,
          status: 'Pending'
        }
      }),
      totalPanels: selectedOrders.reduce((sum, id) => {
        const order = orders.find(o => o.id === id)
        return sum + (order?.totalPanels || 0)
      }, 0),
      completedPanels: 0,
      progress: 0
    }

    const updatedBatches = [newBatch, ...batches]
    setBatches(updatedBatches)
    localStorage.setItem('productionBatches', JSON.stringify(updatedBatches))
    
    setSelectedOrders([])
    setBatchName('')
  }

  const startBatch = async (batchId) => {
    setProcessing(true)
    const batch = batches.find(b => b.id === batchId)
    if (!batch) return

    // Update batch status to Processing
    const updatedBatches = batches.map(b => 
      b.id === batchId ? { ...b, status: 'Processing', startedAt: new Date().toISOString() } : b
    )
    setBatches(updatedBatches)
    localStorage.setItem('productionBatches', JSON.stringify(updatedBatches))

    // Send all orders to production floor
    for (const order of batch.orders) {
      try {
        // Update order status to Cutting
        await api.put(`/production/orders/${order.id}`, { status: 'Cutting' })
        
        // Create tracking record to send parts to first station (wallsaw)
        await api.post('/tracking/scan', {
          partId: `ORDER-${order.id}`,
          partName: `Order ${order.orderNumber}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          station: 'wallsaw',
          scannedBy: 'batch-system',
          scannedByName: 'Batch Processing',
          notes: `Batch ${batch.name} started - sent to production floor`
        })
      } catch (error) {
        console.error(`Error starting order ${order.orderNumber}:`, error)
      }
    }

    setProcessing(false)
    loadData()
  }

  // Check batch completion - called when orders are updated
  const checkBatchCompletion = async () => {
    const allOrders = await api.get('/production/orders')
    const ordersList = Array.isArray(allOrders) ? allOrders : allOrders.data || []
    
    const updatedBatches = batches.map(batch => {
      if (batch.status !== 'Processing') return batch
      
      // Check if all orders in this batch are completed
      const batchOrderIds = batch.orders.map(o => o.id)
      const batchOrders = ordersList.filter(o => batchOrderIds.includes(o.id))
      const allCompleted = batchOrders.length > 0 && batchOrders.every(o => o.status === 'Completed')
      
      // Calculate progress
      const completedCount = batchOrders.filter(o => o.status === 'Completed').length
      const progress = batchOrders.length > 0 ? Math.round((completedCount / batchOrders.length) * 100) : 0
      
      if (allCompleted) {
        return { ...batch, status: 'Completed', completedAt: new Date().toISOString(), progress: 100 }
      }
      
      return { ...batch, progress }
    })
    
    setBatches(updatedBatches)
    localStorage.setItem('productionBatches', JSON.stringify(updatedBatches))
  }

  // Poll for batch completion every 5 seconds when there are processing batches
  useEffect(() => {
    const hasProcessingBatches = batches.some(b => b.status === 'Processing')
    if (!hasProcessingBatches) return
    
    const interval = setInterval(() => {
      checkBatchCompletion()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [batches])

  const pauseBatch = (batchId) => {
    const updatedBatches = batches.map(b => 
      b.id === batchId ? { ...b, status: 'Paused' } : b
    )
    setBatches(updatedBatches)
    localStorage.setItem('productionBatches', JSON.stringify(updatedBatches))
  }

  const completeBatch = (batchId) => {
    const updatedBatches = batches.map(b => 
      b.id === batchId ? { ...b, status: 'Completed', completedAt: new Date().toISOString(), progress: 100 } : b
    )
    setBatches(updatedBatches)
    localStorage.setItem('productionBatches', JSON.stringify(updatedBatches))
  }

  const deleteBatch = (batchId) => {
    const updatedBatches = batches.filter(b => b.id !== batchId)
    setBatches(updatedBatches)
    localStorage.setItem('productionBatches', JSON.stringify(updatedBatches))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700'
      case 'Processing': return 'bg-blue-100 text-blue-700'
      case 'Paused': return 'bg-orange-100 text-orange-700'
      case 'Completed': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const exportBatchReport = (batch) => {
    const report = {
      ...batch,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${batch.id}-report.json`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Batch Order Processing</h1>
          <p className="text-gray-600">Process multiple orders together for efficiency</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Package size={20} className="text-amber-600" />
            Available Orders
          </h2>

          <div className="mb-4">
            <input
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="Batch name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-between mb-3">
            <button
              onClick={selectAll}
              className="text-sm text-amber-600 hover:text-amber-700"
            >
              {selectedOrders.length === orders.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-sm text-gray-500">
              {selectedOrders.length} selected
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {orders.map(order => (
              <label
                key={order.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedOrders.includes(order.id) 
                    ? 'bg-amber-50 border-2 border-amber-500' 
                    : 'bg-gray-50 border-2 border-transparent hover:border-amber-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedOrders.includes(order.id)}
                  onChange={() => toggleOrderSelection(order.id)}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500">{order.customerName}</p>
                </div>
                <span className="text-sm text-gray-500">{order.totalPanels} panels</span>
              </label>
            ))}
            {orders.length === 0 && (
              <p className="text-center py-4 text-gray-500">No pending orders</p>
            )}
          </div>

          <button
            onClick={createBatch}
            disabled={selectedOrders.length === 0}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Layers size={18} />
            Create Batch ({selectedOrders.length} orders)
          </button>
        </div>

        {/* Active Batches */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Layers size={20} className="text-blue-600" />
            Production Batches
          </h2>

          <div className="space-y-4">
            {batches.map(batch => (
              <div key={batch.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{batch.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                        {batch.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{batch.id}</p>
                  </div>
                  <div className="flex gap-2">
                    {batch.status === 'Pending' && (
                      <button
                        onClick={() => startBatch(batch.id)}
                        disabled={processing}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      >
                        <Play size={18} />
                      </button>
                    )}
                    {batch.status === 'Processing' && (
                      <>
                        <button
                          onClick={() => pauseBatch(batch.id)}
                          className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
                        >
                          <Pause size={18} />
                        </button>
                        <button
                          onClick={() => completeBatch(batch.id)}
                          className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                        >
                          <CheckCircle size={18} />
                        </button>
                      </>
                    )}
                    {batch.status === 'Paused' && (
                      <button
                        onClick={() => startBatch(batch.id)}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      >
                        <Play size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => exportBatchReport(batch)}
                      className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => deleteBatch(batch.id)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{batch.progress || 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-green-500 transition-all duration-300"
                      style={{ width: `${batch.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-lg font-bold text-gray-800">{batch.orders.length}</p>
                    <p className="text-xs text-gray-500">Orders</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-lg font-bold text-gray-800">{batch.totalPanels}</p>
                    <p className="text-xs text-gray-500">Total Panels</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-lg font-bold text-gray-800">{batch.completedPanels}</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                </div>

                {/* Orders List */}
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">Orders in batch:</p>
                  <div className="flex flex-wrap gap-2">
                    {batch.orders.map(order => (
                      <span 
                        key={order.id}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {order.orderNumber}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {batches.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Layers size={48} className="mx-auto mb-4 opacity-50" />
                <p>No batches created yet</p>
                <p className="text-sm">Select orders and create a batch to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
