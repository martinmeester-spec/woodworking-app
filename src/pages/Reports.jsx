import { useState, useEffect } from 'react'
import { FileText, Download, Calendar, Filter, BarChart3, PieChart, TrendingUp, Package, Factory, Wrench } from 'lucide-react'
import { api } from '../services/api'

const reportTypes = [
  { id: 'production', name: 'Production Report', icon: Factory, description: 'Production orders, panels, and completion rates' },
  { id: 'inventory', name: 'Inventory Report', icon: Package, description: 'Stock levels, low stock alerts, and inventory value' },
  { id: 'quality', name: 'Quality Report', icon: BarChart3, description: 'Defects, rework rates, and quality metrics' },
  { id: 'machines', name: 'Machine Report', icon: Wrench, description: 'Machine status, uptime, and maintenance' },
]

function Reports({ onViewDetail }) {
  const [selectedReport, setSelectedReport] = useState('production')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [reportData, setReportData] = useState(null)
  const [rawData, setRawData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Auto-generate report on mount and when report type changes
  useEffect(() => {
    generateReport()
  }, [selectedReport])

  const generateReport = async () => {
    setLoading(true)
    setError(null)
    try {
      let data = {}
      
      switch (selectedReport) {
        case 'production':
          let orders = []
          let stations = []
          try {
            orders = await api.getOrders() || []
            stations = await api.getStations() || []
          } catch (e) {
            console.error('Error fetching production data:', e)
            orders = []
            stations = []
          }
          setRawData(orders)
          data = {
            title: 'Production Report',
            generated: new Date().toISOString(),
            summary: {
              totalOrders: orders.length,
              completedOrders: orders.filter(o => o.status === 'Completed').length,
              inProgressOrders: orders.filter(o => o.status === 'In Progress').length,
              totalPanels: orders.reduce((sum, o) => sum + (o.totalPanels || o.panels || 0), 0),
              completedPanels: orders.reduce((sum, o) => sum + (o.completedPanels || o.completed || 0), 0),
              activeStations: stations.length
            },
            orders: orders.map(o => ({
              id: o.id,
              orderNumber: o.orderNumber || o.id,
              customer: o.customerName || o.customer || 'N/A',
              status: o.status || 'Unknown',
              panels: o.totalPanels || o.panels || 0,
              completed: o.completedPanels || o.completed || 0,
              progress: (o.totalPanels || o.panels) > 0 ? Math.round(((o.completedPanels || o.completed || 0) / (o.totalPanels || o.panels)) * 100) : 0
            }))
          }
          break
          
        case 'inventory':
          let parts = []
          let stockLevels = { total: 0, inStock: 0, lowStock: 0, outOfStock: 0, totalValue: 0 }
          try {
            const partsResponse = await api.getParts()
            parts = Array.isArray(partsResponse) ? partsResponse : []
          } catch (e) {
            console.error('Error fetching inventory parts:', e)
            parts = []
          }
          try {
            const stockResponse = await api.getStockLevels()
            if (stockResponse && typeof stockResponse === 'object') {
              stockLevels = {
                total: stockResponse.total || parts.length,
                inStock: stockResponse.inStock || 0,
                lowStock: stockResponse.lowStock || 0,
                outOfStock: stockResponse.outOfStock || 0,
                totalValue: stockResponse.totalValue || 0
              }
            }
          } catch (e) {
            console.error('Error fetching stock levels:', e)
            // Calculate from parts if API fails
            stockLevels = {
              total: parts.length,
              inStock: parts.filter(p => p.status === 'In Stock').length,
              lowStock: parts.filter(p => p.status === 'Low Stock').length,
              outOfStock: parts.filter(p => p.status === 'Out of Stock').length,
              totalValue: parts.reduce((sum, p) => sum + ((parseFloat(p.unitCost) || 0) * (p.quantity || 0)), 0)
            }
          }
          setRawData(parts)
          data = {
            title: 'Inventory Report',
            generated: new Date().toISOString(),
            summary: stockLevels,
            items: parts.length > 0 ? parts.map(p => ({
              id: p.id,
              partNumber: p.partNumber || p.id?.substring(0, 8) || 'N/A',
              name: p.name || 'Unknown',
              category: p.category || 'Uncategorized',
              quantity: p.quantity || 0,
              minQuantity: p.minQuantity || 0,
              status: p.status || (p.quantity <= 0 ? 'Out of Stock' : p.quantity <= (p.minQuantity || 10) ? 'Low Stock' : 'In Stock'),
              unitCost: p.unitCost || 0,
              totalValue: ((parseFloat(p.unitCost) || 0) * (p.quantity || 0)).toFixed(2)
            })) : []
          }
          break
          
        case 'quality':
          let defects = []
          let qualitySummary = { totalDefects: 0, openDefects: 0, resolvedDefects: 0, reworkRate: 0 }
          try {
            defects = await api.getDefects() || []
            qualitySummary = await api.getQualitySummary() || qualitySummary
          } catch (e) {
            console.error('Error fetching quality data:', e)
          }
          setRawData(defects)
          data = {
            title: 'Quality Report',
            generated: new Date().toISOString(),
            summary: qualitySummary,
            defects: defects.map(d => ({
              id: d.id,
              type: d.defectType,
              severity: d.severity,
              status: d.status,
              description: d.description,
              detectedBy: d.detectedByName
            }))
          }
          break
          
        case 'machines':
          let machines = []
          try {
            machines = await api.getMachines() || []
          } catch (e) {
            console.error('Error fetching machine data:', e)
          }
          setRawData(machines)
          data = {
            title: 'Machine Report',
            generated: new Date().toISOString(),
            summary: {
              totalMachines: machines.length,
              running: machines.filter(m => m.status === 'Running').length,
              idle: machines.filter(m => m.status === 'Idle').length,
              maintenance: machines.filter(m => m.status === 'Maintenance').length,
              avgUptime: machines.length > 0 ? (machines.reduce((sum, m) => sum + parseFloat(m.uptimePercentage || 0), 0) / machines.length).toFixed(1) : 0
            },
            machines: machines.map(m => ({
              id: m.id,
              machineId: m.machineId || m.id,
              name: m.name || 'Unknown',
              type: m.type || 'Unknown',
              status: m.status || 'Unknown',
              uptime: m.uptimePercentage || 0,
              operatingHours: m.operatingHours || 0,
              lastMaintenance: m.lastMaintenance || 'N/A',
              nextMaintenance: m.nextMaintenance || 'N/A'
            }))
          }
          break
      }
      
      setReportData(data)
    } catch (error) {
      console.error('Failed to generate report:', error)
      setError('Failed to generate report: ' + error.message)
    }
    setLoading(false)
  }

  const exportReport = (format) => {
    if (!reportData) return
    
    let content = ''
    let filename = `${reportData.title.replace(/\s+/g, '_')}_${Date.now()}`
    let mimeType = 'text/plain'
    
    if (format === 'json') {
      content = JSON.stringify(reportData, null, 2)
      filename += '.json'
      mimeType = 'application/json'
    } else if (format === 'csv') {
      const items = reportData.orders || reportData.items || reportData.defects || reportData.machines || []
      if (items.length > 0) {
        const headers = Object.keys(items[0])
        content = headers.join(',') + '\n'
        items.forEach(item => {
          content += headers.map(h => `"${item[h] || ''}"`).join(',') + '\n'
        })
      }
      filename += '.csv'
      mimeType = 'text/csv'
    } else {
      content = `${reportData.title}\n${'='.repeat(reportData.title.length)}\n\n`
      content += `Generated: ${new Date(reportData.generated).toLocaleString()}\n\n`
      content += `SUMMARY\n-------\n`
      Object.entries(reportData.summary).forEach(([key, value]) => {
        content += `${key}: ${value}\n`
      })
      content += `\nDETAILS\n-------\n`
      const items = reportData.orders || reportData.items || reportData.defects || reportData.machines || []
      items.forEach((item, i) => {
        content += `\n${i + 1}. `
        Object.entries(item).forEach(([key, value]) => {
          content += `${key}: ${value}, `
        })
        content += '\n'
      })
      filename += '.txt'
    }
    
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="pt-14">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
        <p className="text-gray-600">Generate and export reports from your data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Report Type Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Report Type</h3>
            <div className="space-y-2">
              {reportTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedReport(type.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedReport === type.id ? 'bg-amber-100 border-2 border-amber-500' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} className={selectedReport === type.id ? 'text-amber-600' : 'text-gray-500'} />
                      <div>
                        <p className="font-medium text-gray-800">{type.name}</p>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar size={18} /> Date Range
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          <button
            onClick={generateReport}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            <BarChart3 size={18} />
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {/* Report Preview */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText size={20} /> Report Preview
              </h3>
              {reportData && (
                <div className="flex gap-2">
                  <button onClick={() => exportReport('txt')} className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm flex items-center gap-1">
                    <Download size={14} /> TXT
                  </button>
                  <button onClick={() => exportReport('csv')} className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm flex items-center gap-1">
                    <Download size={14} /> CSV
                  </button>
                  <button onClick={() => exportReport('json')} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm flex items-center gap-1">
                    <Download size={14} /> JSON
                  </button>
                </div>
              )}
            </div>

            {!reportData ? (
              <div className="text-center py-12 text-gray-500">
                <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select a report type and click "Generate Report" to preview</p>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-gray-800">{reportData.title}</h4>
                  <p className="text-sm text-gray-500">Generated: {new Date(reportData.generated).toLocaleString()}</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {Object.entries(reportData.summary).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-xl font-bold text-gray-800">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                    </div>
                  ))}
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                  {(() => {
                    const items = reportData.orders || reportData.items || reportData.defects || reportData.machines || []
                    if (items.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <Package size={48} className="mx-auto mb-4 opacity-50" />
                          <p>No data available for this report</p>
                        </div>
                      )
                    }
                    return (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            {Object.keys(items[0] || {}).filter(key => key !== 'id').map(key => (
                              <th key={key} className="text-left py-2 px-3 font-semibold text-gray-600 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, i) => (
                            <tr 
                              key={i} 
                              className="border-b hover:bg-gray-50 cursor-pointer"
                              onClick={() => {
                                if (onViewDetail && item.id) {
                                  if (selectedReport === 'production') onViewDetail('order', item.id)
                                  else if (selectedReport === 'inventory') onViewDetail('inventory', item.id)
                                  else if (selectedReport === 'quality') onViewDetail('defect', item.id)
                                  else if (selectedReport === 'machines') onViewDetail('machine', item.id)
                                }
                              }}
                            >
                              {Object.entries(item).filter(([key]) => key !== 'id').map(([key, value], j) => (
                                <td key={j} className={`py-2 px-3 ${j === 0 ? 'text-amber-600 font-medium hover:underline' : 'text-gray-700'}`}>{value}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
