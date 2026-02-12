import { useState, useEffect } from 'react'
import { Plus, Search, AlertTriangle, Package, TrendingDown, TrendingUp, ArrowDownCircle, ArrowUpCircle, History } from 'lucide-react'
import { api } from '../services/api'
import Pagination from '../components/Pagination'

function Inventory({ onViewDetail }) {
  const [inventoryItems, setInventoryItems] = useState([])
  const [transactions, setTransactions] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('inventory')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const [newItem, setNewItem] = useState({
    partNumber: '',
    name: '',
    category: 'materials',
    quantity: 0,
    unit: 'pcs',
    minQuantity: 5,
    unitCost: 0,
    width: '',
    height: '',
    depth: '',
    material: '',
    color: '',
    supplier: '',
    isClientMaterial: false,
    notes: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partsRes, metricsRes, transRes] = await Promise.all([
          api.get('/inventory/parts'),
          api.get('/inventory/metrics'),
          api.get('/inventory/transactions?limit=200').catch(() => [])
        ])
        setInventoryItems(Array.isArray(partsRes) ? partsRes : partsRes.data || [])
        setMetrics(metricsRes.data || metricsRes)
        // API returns array directly
        setTransactions(Array.isArray(transRes) ? transRes : (transRes.data || transRes.transactions || []))
      } catch (error) {
        console.error('Error fetching inventory data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleAddItem = async () => {
    if (!newItem.name.trim()) {
      alert('Please enter an item name')
      return
    }
    
    setSaving(true)
    try {
      const partNumber = newItem.partNumber || `INV-${Date.now().toString().slice(-6)}`
      const itemData = {
        ...newItem,
        partNumber,
        dimensions: newItem.width || newItem.height || newItem.depth 
          ? `${newItem.width || 0} x ${newItem.height || 0} x ${newItem.depth || 0}`
          : null
      }
      
      const result = await api.post('/inventory/parts', itemData)
      const createdItem = Array.isArray(result) ? result[0] : result.data || result
      setInventoryItems(prev => [createdItem, ...prev])
      
      // Reset form
      setNewItem({
        partNumber: '', name: '', category: 'materials', quantity: 0, unit: 'pcs',
        minQuantity: 5, unitCost: 0, width: '', height: '', depth: '',
        material: '', color: '', supplier: '', isClientMaterial: false, notes: ''
      })
      setShowAddModal(false)
    } catch (error) {
      console.error('Error adding item:', error)
      alert('Failed to add item: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const viewItemDetail = (item) => {
    setSelectedItem(item)
    setShowDetailModal(true)
  }

  const stats = metrics ? [
    { label: 'Total Items', value: metrics.parts?.total || 0, icon: Package, color: 'bg-blue-500' },
    { label: 'Low Stock', value: metrics.parts?.lowStock || 0, icon: TrendingDown, color: 'bg-yellow-500' },
    { label: 'Critical', value: metrics.parts?.critical || 0, icon: AlertTriangle, color: 'bg-red-500' },
    { label: 'Total Value', value: `$${(metrics.totalValue || 0).toLocaleString()}`, icon: TrendingUp, color: 'bg-green-500' },
  ] : []

  const filteredItems = (inventoryItems || []).filter(item => {
    if (!item) return false
    const name = (item.name || '').toLowerCase()
    const partNumber = (item.partNumber || '').toLowerCase()
    const category = (item.category || '').toLowerCase()
    
    const matchesSearch = !searchTerm || name.includes(searchTerm.toLowerCase()) || partNumber.includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || category === categoryFilter.toLowerCase()
    return matchesSearch && matchesCategory
  })
  
  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter])

  return (
    <div className="pt-14">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
          <p className="text-gray-600">Track materials, hardware, and supplies</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus size={18} /> Add Item
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

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-md mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'inventory' 
                ? 'text-amber-600 border-b-2 border-amber-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package size={18} />
            Inventory Items
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'transactions' 
                ? 'text-amber-600 border-b-2 border-amber-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <History size={18} />
            Transactions History
          </button>
        </div>
      </div>

      {activeTab === 'transactions' ? (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Inventory Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Item</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Quantity</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Reason</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Performed By</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(transactions) ? transactions : []).length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      No transactions recorded yet
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 100).map((txn, idx) => {
                    const item = inventoryItems.find(i => i.id === txn.partId)
                    return (
                      <tr key={txn.id || idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-600">
                          {txn.createdAt ? new Date(txn.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`flex items-center gap-1 ${
                            txn.transactionType === 'IN' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {txn.transactionType === 'IN' ? (
                              <><ArrowDownCircle size={16} /> IN</>
                            ) : (
                              <><ArrowUpCircle size={16} /> OUT</>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700 font-medium">
                          {item?.name || txn.partId?.substring(0, 8) || 'Unknown'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-semibold ${
                            txn.transactionType === 'IN' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {txn.transactionType === 'IN' ? '+' : '-'}{txn.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm">{txn.reason || '-'}</td>
                        <td className="py-3 px-4 text-gray-500 text-sm">{txn.performedByName || 'System'}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="materials">Materials</option>
            <option value="hardware">Hardware</option>
            <option value="finishing">Finishing</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Part #</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Category</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Quantity</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Min Qty</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Unit Cost</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => {
                const partNumber = item.partNumber || item.sku || 'N/A'
                const name = item.name || 'Unknown'
                const category = item.category || 'Uncategorized'
                const quantity = item.quantity ?? 0
                const unit = item.unit || 'pcs'
                const minQuantity = item.minQuantity ?? item.reorderPoint ?? 0
                const unitCost = item.unitCost ?? item.cost ?? 0
                const status = item.status || (quantity <= minQuantity ? 'Low Stock' : 'In Stock')
                
                return (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => viewItemDetail(item)}>
                  <td className="py-3 px-4 font-medium text-amber-600 hover:underline">{partNumber}</td>
                  <td className="py-3 px-4 text-gray-600">{name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">{category}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{quantity} {unit}</td>
                  <td className="py-3 px-4 text-gray-500">{minQuantity}</td>
                  <td className="py-3 px-4 text-gray-600">${Number(unitCost).toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      status === 'In Stock' ? 'bg-green-100 text-green-700' :
                      status === 'Low Stock' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {status}
                    </span>
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
          totalItems={filteredItems.length}
          itemsPerPage={itemsPerPage}
        />
      </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Inventory Item</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
                <input
                  type="text"
                  value={newItem.partNumber}
                  onChange={(e) => setNewItem(prev => ({ ...prev, partNumber: e.target.value }))}
                  placeholder="Auto-generated if empty"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Item name"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="materials">Materials</option>
                  <option value="hardware">Hardware</option>
                  <option value="finishing">Finishing</option>
                  <option value="supplies">Supplies</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material Type</label>
                <input
                  type="text"
                  value={newItem.material}
                  onChange={(e) => setNewItem(prev => ({ ...prev, material: e.target.value }))}
                  placeholder="e.g., MDF, Plywood, Oak"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color/Finish</label>
                <input
                  type="text"
                  value={newItem.color}
                  onChange={(e) => setNewItem(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="e.g., White, Oak Natural"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <input
                  type="text"
                  value={newItem.supplier}
                  onChange={(e) => setNewItem(prev => ({ ...prev, supplier: e.target.value }))}
                  placeholder="Supplier name"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions (mm)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={newItem.width}
                    onChange={(e) => setNewItem(prev => ({ ...prev, width: e.target.value }))}
                    placeholder="Width"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  <input
                    type="number"
                    value={newItem.height}
                    onChange={(e) => setNewItem(prev => ({ ...prev, height: e.target.value }))}
                    placeholder="Height"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  <input
                    type="number"
                    value={newItem.depth}
                    onChange={(e) => setNewItem(prev => ({ ...prev, depth: e.target.value }))}
                    placeholder="Depth"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="pcs">pcs</option>
                    <option value="m²">m²</option>
                    <option value="m">m</option>
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.unitCost}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min. Quantity (Reorder Point)</label>
                <input
                  type="number"
                  min="0"
                  value={newItem.minQuantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, minQuantity: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isClientMaterial"
                  checked={newItem.isClientMaterial}
                  onChange={(e) => setNewItem(prev => ({ ...prev, isClientMaterial: e.target.checked }))}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <label htmlFor="isClientMaterial" className="text-sm font-medium text-gray-700">
                  Client-Supplied Material
                </label>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            
            {newItem.isClientMaterial && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Client Material:</strong> This item is supplied by the client and will be tracked separately.
                </p>
              </div>
            )}
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{selectedItem.name}</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Part Number</span>
                <span className="font-medium">{selectedItem.partNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Category</span>
                <span className="font-medium">{selectedItem.category || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Material</span>
                <span className="font-medium">{selectedItem.material || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Color/Finish</span>
                <span className="font-medium">{selectedItem.color || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Dimensions</span>
                <span className="font-medium">{selectedItem.dimensions || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Quantity</span>
                <span className="font-medium">{selectedItem.quantity} {selectedItem.unit || 'pcs'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Unit Cost</span>
                <span className="font-medium">€{Number(selectedItem.unitCost || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Supplier</span>
                <span className="font-medium">{selectedItem.supplier || 'N/A'}</span>
              </div>
              {selectedItem.isClientMaterial && (
                <div className="p-2 bg-blue-50 rounded text-blue-800 text-sm">
                  Client-Supplied Material
                </div>
              )}
              {selectedItem.notes && (
                <div className="pt-2">
                  <span className="text-gray-500 text-sm">Notes:</span>
                  <p className="text-gray-700 mt-1">{selectedItem.notes}</p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowDetailModal(false)}
              className="w-full mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory
