import { useState, useEffect } from 'react'
import { Calculator, DollarSign, Package, Clock, TrendingUp, FileText, RefreshCw, Download, Printer, X, ArrowLeft } from 'lucide-react'
import { api } from '../services/api'

export default function CostEstimation() {
  const [designs, setDesigns] = useState([])
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [costBreakdown, setCostBreakdown] = useState(null)
  const [loading, setLoading] = useState(false)
  const [profitMargin, setProfitMargin] = useState(20)
  const [estimates, setEstimates] = useState([])
  const [selectedEstimate, setSelectedEstimate] = useState(null)

  useEffect(() => {
    loadDesigns()
    loadEstimates()
  }, [])

  const loadDesigns = async () => {
    try {
      const data = await api.get('/designs')
      setDesigns(data)
    } catch (error) {
      console.error('Error loading designs:', error)
    }
  }

  const loadEstimates = async () => {
    try {
      const data = await api.get('/costs')
      setEstimates(data)
    } catch (error) {
      console.error('Error loading estimates:', error)
    }
  }

  const calculateCost = async () => {
    if (!selectedDesign) return
    setLoading(true)
    try {
      const data = await api.post(`/costs/calculate/${selectedDesign}`, { profitMargin })
      setCostBreakdown(data)
      loadEstimates()
    } catch (error) {
      console.error('Error calculating cost:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value)
  }

  const exportQuote = () => {
    if (!costBreakdown) return
    const design = designs.find(d => d.id === selectedDesign)
    const quoteData = {
      date: new Date().toISOString(),
      design: design?.name,
      ...costBreakdown.breakdown
    }
    const blob = new Blob([JSON.stringify(quoteData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quote-${design?.name || 'design'}-${Date.now()}.json`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Material Cost Estimation</h1>
          <p className="text-gray-600">Calculate accurate cost estimates for cabinet designs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadEstimates}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Design Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Package size={20} className="text-amber-600" />
            Select Design
          </h2>
          
          <div className="space-y-4">
            <select
              value={selectedDesign || ''}
              onChange={(e) => setSelectedDesign(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Choose a design...</option>
              {designs.map(design => (
                <option key={design.id} value={design.id}>
                  {design.name} ({design.width}x{design.height}x{design.depth}mm)
                </option>
              ))}
            </select>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profit Margin (%)
              </label>
              <input
                type="number"
                value={profitMargin}
                onChange={(e) => setProfitMargin(Number(e.target.value))}
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              onClick={calculateCost}
              disabled={!selectedDesign || loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Calculator size={18} />
              )}
              Calculate Cost
            </button>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign size={20} className="text-green-600" />
            Cost Breakdown
          </h2>

          {costBreakdown ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">Materials</p>
                  <p className="text-xl font-bold text-blue-800">
                    {formatCurrency(costBreakdown.breakdown.materials.reduce((sum, m) => sum + parseFloat(m.total), 0))}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600">Labor</p>
                  <p className="text-xl font-bold text-purple-800">
                    {formatCurrency(costBreakdown.breakdown.labor.total)}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-600">Overhead</p>
                  <p className="text-xl font-bold text-orange-800">
                    {formatCurrency(costBreakdown.breakdown.overhead)}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">Total Price</p>
                  <p className="text-xl font-bold text-green-800">
                    {formatCurrency(costBreakdown.breakdown.total)}
                  </p>
                </div>
              </div>

              {/* Material Details */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Material Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Item</th>
                        <th className="px-4 py-2 text-right">Quantity</th>
                        <th className="px-4 py-2 text-right">Unit Price</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costBreakdown.breakdown.materials.map((item, i) => (
                        <tr key={i} className="border-b">
                          <td className="px-4 py-2">{item.item}</td>
                          <td className="px-4 py-2 text-right">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Labor Details */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Clock size={24} className="text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Estimated Labor</p>
                  <p className="font-semibold">
                    {costBreakdown.breakdown.labor.hours} hours @ {formatCurrency(costBreakdown.breakdown.labor.rate)}/hr
                  </p>
                </div>
              </div>

              {/* Profit Summary */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <TrendingUp size={24} className="text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Profit ({costBreakdown.breakdown.profitMargin}%)</p>
                    <p className="font-semibold text-green-700">{formatCurrency(costBreakdown.breakdown.profit)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Subtotal</p>
                  <p className="font-semibold">{formatCurrency(costBreakdown.breakdown.subtotal)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={exportQuote}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download size={18} />
                  Export Quote
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <Printer size={18} />
                  Print
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Calculator size={48} className="mx-auto mb-4 opacity-50" />
              <p>Select a design and click "Calculate Cost" to see the breakdown</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Estimates */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-gray-600" />
          Recent Estimates
        </h2>

        {estimates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Design</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Material</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Labor</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Overhead</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Total</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Valid Until</th>
                </tr>
              </thead>
              <tbody>
                {estimates.slice(0, 10).map(estimate => (
                  <tr 
                    key={estimate.id} 
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedEstimate(estimate)}
                  >
                    <td className="px-4 py-3">{estimate.design?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(estimate.materialCost)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(estimate.laborCost)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(estimate.overheadCost)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                      {formatCurrency(estimate.totalCost)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500">
                      {estimate.validUntil ? new Date(estimate.validUntil).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-8 text-gray-500">No estimates yet. Calculate your first cost estimate above.</p>
        )}
      </div>

      {/* Estimate Detail Modal */}
      {selectedEstimate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedEstimate(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-xl font-bold text-gray-800">Estimate Details</h2>
                </div>
                <button
                  onClick={() => setSelectedEstimate(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-100">
                  <DollarSign size={32} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{selectedEstimate.design?.name || 'Unknown Design'}</h3>
                  <p className="text-gray-500">Cost Estimate</p>
                </div>
                <span className="ml-auto text-2xl font-bold text-green-600">
                  {formatCurrency(selectedEstimate.totalCost)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package size={18} className="text-blue-600" />
                    <p className="text-sm text-gray-500">Material Cost</p>
                  </div>
                  <p className="text-xl font-semibold text-gray-800">{formatCurrency(selectedEstimate.materialCost)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={18} className="text-purple-600" />
                    <p className="text-sm text-gray-500">Labor Cost</p>
                  </div>
                  <p className="text-xl font-semibold text-gray-800">{formatCurrency(selectedEstimate.laborCost)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={18} className="text-amber-600" />
                    <p className="text-sm text-gray-500">Overhead Cost</p>
                  </div>
                  <p className="text-xl font-semibold text-gray-800">{formatCurrency(selectedEstimate.overheadCost)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator size={18} className="text-gray-600" />
                    <p className="text-sm text-gray-500">Profit Margin</p>
                  </div>
                  <p className="text-xl font-semibold text-gray-800">{selectedEstimate.profitMargin || 20}%</p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="text-green-700 font-medium">Total Estimate</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(selectedEstimate.totalCost)}</p>
                </div>
              </div>

              {selectedEstimate.validUntil && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    Valid until: {new Date(selectedEstimate.validUntil).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Printer size={18} />
                  Print
                </button>
                <button
                  onClick={() => setSelectedEstimate(null)}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
