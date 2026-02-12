import { useState, useEffect } from 'react'
import { ArrowLeft, Package, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Calendar, History } from 'lucide-react'
import { api } from '../services/api'

function InventoryDetail({ id, onBack }) {
  const [part, setPart] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partRes, transactionsRes] = await Promise.all([
          api.get(`/inventory/parts/${id}`),
          api.get(`/inventory/transactions?partId=${id}`)
        ])
        setPart(partRes.data)
        setTransactions(transactionsRes.data || [])
      } catch (error) {
        console.error('Error fetching inventory part:', error)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="pt-14 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (!part) {
    return (
      <div className="pt-14">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Part Not Found</h2>
        </div>
      </div>
    )
  }

  const stockStatus = part.quantity <= 0 ? 'Out of Stock' :
                      part.quantity < part.minQuantity ? 'Low Stock' : 'In Stock'

  return (
    <div className="pt-14">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4">
        <ArrowLeft size={20} /> Back to Inventory
      </button>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{part.name}</h2>
            <p className="text-gray-500">{part.partNumber}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            stockStatus === 'In Stock' ? 'bg-green-100 text-green-700' :
            stockStatus === 'Low Stock' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {stockStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Stock</p>
              <p className="text-lg font-semibold text-gray-800">{part.quantity} {part.unit}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertTriangle size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Min Quantity</p>
              <p className="text-lg font-semibold text-gray-800">{part.minQuantity} {part.unit}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Unit Cost</p>
              <p className="text-lg font-semibold text-gray-800">${part.unitCost?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <DollarSign size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-lg font-semibold text-gray-800">${((part.quantity || 0) * (part.unitCost || 0)).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Part Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Category</span>
              <span className="font-medium text-gray-800">{part.category || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Supplier</span>
              <span className="font-medium text-gray-800">{part.supplier || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Location</span>
              <span className="font-medium text-gray-800">{part.location || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Reorder Point</span>
              <span className="font-medium text-gray-800">{part.reorderPoint || part.minQuantity} {part.unit}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Last Updated</span>
              <span className="font-medium text-gray-800">{part.updatedAt ? new Date(part.updatedAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <History size={20} /> Recent Transactions
          </h3>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${tx.type === 'IN' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {tx.type === 'IN' ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-red-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{tx.type === 'IN' ? 'Stock In' : 'Stock Out'}</p>
                      <p className="text-sm text-gray-500">{tx.reason || 'No reason provided'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No transactions found</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default InventoryDetail
