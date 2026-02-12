import { useState, useEffect } from 'react'
import { DollarSign, FileText, Download, Upload, RefreshCw, CheckCircle, AlertCircle, Link2, Settings, Calendar, Building } from 'lucide-react'
import { api } from '../services/api'

export default function AccountingIntegration() {
  const [activeTab, setActiveTab] = useState('invoices')
  const [invoices, setInvoices] = useState([])
  const [expenses, setExpenses] = useState([])
  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState({ syncing: false, message: '' })
  const [summary, setSummary] = useState(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [exactConfig, setExactConfig] = useState({ clientId: '', clientSecret: '' })
  const [configSaving, setConfigSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [invoicesData, expensesData, integrationsData, summaryData] = await Promise.all([
        api.get('/accounting/invoices'),
        api.get('/accounting/expenses'),
        api.get('/accounting/integrations'),
        api.get('/accounting/summary')
      ])
      
      setInvoices(Array.isArray(invoicesData) ? invoicesData : [])
      setExpenses(Array.isArray(expensesData) ? expensesData : [])
      setIntegrations(Array.isArray(integrationsData) ? integrationsData : [])
      setSummary(summaryData)
    } catch (error) {
      console.error('Error loading accounting data:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectToExact = async () => {
    try {
      const result = await api.get('/accounting/exact/auth-url')
      if (result?.authUrl) {
        // Redirect to Exact Online OAuth2 authorization
        window.location.href = result.authUrl
      } else if (result?.error) {
        setSyncStatus({ syncing: false, message: result.message || 'Exact Online not configured' })
      }
    } catch (error) {
      setSyncStatus({ syncing: false, message: 'Error: ' + (error.message || 'Could not get authorization URL') })
    }
  }

  const disconnectFromExact = async () => {
    try {
      await api.post('/accounting/exact/disconnect', {})
      setIntegrations(prev => prev.map(int => 
        int.id === 'exact' ? { ...int, status: 'disconnected', lastSync: null } : int
      ))
      setSyncStatus({ syncing: false, message: 'Disconnected from Exact Online' })
    } catch (error) {
      setSyncStatus({ syncing: false, message: 'Error disconnecting: ' + error.message })
    }
    setTimeout(() => setSyncStatus({ syncing: false, message: '' }), 3000)
  }

  const saveExactConfig = async () => {
    if (!exactConfig.clientId || !exactConfig.clientSecret) {
      setSyncStatus({ syncing: false, message: 'Please enter both Client ID and Client Secret' })
      return
    }
    
    setConfigSaving(true)
    try {
      const result = await api.post('/accounting/exact/configure', exactConfig)
      if (result?.success) {
        setSyncStatus({ syncing: false, message: 'Exact Online configured successfully!' })
        setShowConfigModal(false)
        loadData() // Reload to get updated integration status
      } else {
        setSyncStatus({ syncing: false, message: result?.error || 'Configuration failed' })
      }
    } catch (error) {
      setSyncStatus({ syncing: false, message: 'Error saving configuration: ' + error.message })
    } finally {
      setConfigSaving(false)
    }
    setTimeout(() => setSyncStatus({ syncing: false, message: '' }), 3000)
  }

  const navigateToTab = (tab) => {
    setActiveTab(tab)
  }

  const syncWithAccounting = async (integrationId) => {
    const integration = integrations.find(i => i.id === integrationId)
    
    // If not connected, initiate OAuth2 flow
    if (integration?.status !== 'connected') {
      if (integrationId === 'exact') {
        return connectToExact()
      }
      return
    }
    
    setSyncStatus({ syncing: true, message: `Syncing with ${integration.name}...` })
    
    try {
      const result = await api.post(`/accounting/integrations/${integrationId}/sync`, {})
      
      if (result?.success) {
        setIntegrations(prev => prev.map(int => 
          int.id === integrationId 
            ? { ...int, status: 'connected', lastSync: new Date().toISOString() }
            : int
        ))
        setSyncStatus({ syncing: false, message: result.message || 'Sync completed!' })
      } else {
        setSyncStatus({ syncing: false, message: result.error || 'Sync failed' })
      }
    } catch (error) {
      setSyncStatus({ syncing: false, message: 'Sync error: ' + error.message })
    }
    
    setTimeout(() => setSyncStatus({ syncing: false, message: '' }), 3000)
  }

  const exportToCSV = (data, filename) => {
    const headers = Object.keys(data[0] || {}).join(',')
    const rows = data.map(item => Object.values(item).join(','))
    const csv = [headers, ...rows].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${Date.now()}.csv`
    a.click()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': case 'connected': return 'bg-green-100 text-green-700'
      case 'Pending': return 'bg-yellow-100 text-yellow-700'
      case 'Overdue': case 'disconnected': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value)
  }

  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0)
  const totalPending = invoices.filter(i => i.status === 'Pending').reduce((sum, i) => sum + i.amount, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Accounting Integration</h1>
          <p className="text-gray-600">Manage invoices, expenses, and accounting system connections</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards - Clickable to navigate to relevant tabs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button 
          onClick={() => navigateToTab('invoices')}
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Revenue (Paid)</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-gray-400 mt-1">Click to view invoices →</p>
            </div>
          </div>
        </button>
        <button 
          onClick={() => navigateToTab('invoices')}
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FileText size={24} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Invoices</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</p>
              <p className="text-xs text-gray-400 mt-1">{invoices.filter(i => i.status === 'Pending').length} invoices →</p>
            </div>
          </div>
        </button>
        <button 
          onClick={() => navigateToTab('expenses')}
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <DollarSign size={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-gray-400 mt-1">{expenses.length} expenses →</p>
            </div>
          </div>
        </button>
        <button 
          onClick={() => navigateToTab('integrations')}
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Net Profit</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalRevenue - totalExpenses)}</p>
              <p className="text-xs text-gray-400 mt-1">View integrations →</p>
            </div>
          </div>
        </button>
      </div>

      {/* Sync Status */}
      {syncStatus.message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          syncStatus.syncing ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
        }`}>
          {syncStatus.syncing ? (
            <RefreshCw size={20} className="animate-spin" />
          ) : (
            <CheckCircle size={20} />
          )}
          {syncStatus.message}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b">
          <div className="flex">
            {['invoices', 'expenses', 'integrations'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-medium capitalize ${
                  activeTab === tab 
                    ? 'text-amber-600 border-b-2 border-amber-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Invoices</h3>
                <button
                  onClick={() => exportToCSV(invoices, 'invoices')}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  <Download size={18} />
                  Export CSV
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Invoice #</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Order</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Due Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(invoice => (
                      <tr key={invoice.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{invoice.id}</td>
                        <td className="px-4 py-3">{invoice.orderNumber}</td>
                        <td className="px-4 py-3">{invoice.customer}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(invoice.amount)}</td>
                        <td className="px-4 py-3">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Expenses</h3>
                <button
                  onClick={() => exportToCSV(expenses, 'expenses')}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  <Download size={18} />
                  Export CSV
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Category</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Description</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(expense => (
                      <tr key={expense.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{expense.id}</td>
                        <td className="px-4 py-3">{expense.category}</td>
                        <td className="px-4 py-3">{expense.description}</td>
                        <td className="px-4 py-3 text-right font-semibold text-red-600">
                          -{formatCurrency(expense.amount)}
                        </td>
                        <td className="px-4 py-3">{new Date(expense.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            {expense.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Accounting System Integrations</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map(integration => (
                  <div key={integration.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          {integration.id === 'exact' ? (
                            <span className="text-blue-600 font-bold text-lg">EO</span>
                          ) : (
                            <Building size={24} className="text-gray-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{integration.name}</h4>
                          {integration.description && (
                            <p className="text-xs text-gray-500">{integration.description}</p>
                          )}
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(integration.status)}`}>
                            {integration.status === 'not_configured' ? 'Not Configured' : integration.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {integration.features && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {integration.features.map(feature => (
                          <span key={feature} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {integration.lastSync && (
                      <p className="text-sm text-gray-500 mb-3">
                        Last sync: {new Date(integration.lastSync).toLocaleString()}
                        {integration.syncCount > 0 && ` (${integration.syncCount} syncs)`}
                      </p>
                    )}
                    
                    {integration.status === 'not_configured' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-yellow-800 mb-2">
                          <strong>Setup Required:</strong> Configure your Exact Online API credentials to enable this integration.
                        </p>
                        <button
                          onClick={() => setShowConfigModal(true)}
                          className="text-sm px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                        >
                          Configure Now
                        </button>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {integration.status === 'connected' ? (
                        <>
                          <button
                            onClick={() => syncWithAccounting(integration.id)}
                            disabled={syncStatus.syncing}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                          >
                            <RefreshCw size={16} className={syncStatus.syncing ? 'animate-spin' : ''} />
                            Sync Now
                          </button>
                          <button 
                            onClick={() => integration.id === 'exact' && disconnectFromExact()}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                            title="Disconnect"
                          >
                            <Link2 size={16} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => syncWithAccounting(integration.id)}
                          disabled={syncStatus.syncing || integration.status === 'not_configured'}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Link2 size={16} />
                          Connect to {integration.name}
                        </button>
                      )}
                      <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                        <Settings size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {integrations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Building size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No integrations available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Exact Online Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Configure Exact Online</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter your Exact Online API credentials. You can obtain these from the 
              <a href="https://apps.exactonline.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                Exact Online App Center
              </a>.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                <input
                  type="text"
                  value={exactConfig.clientId}
                  onChange={(e) => setExactConfig(prev => ({ ...prev, clientId: e.target.value }))}
                  placeholder="Enter your Client ID"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                <input
                  type="password"
                  value={exactConfig.clientSecret}
                  onChange={(e) => setExactConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                  placeholder="Enter your Client Secret"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={saveExactConfig}
                disabled={configSaving}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {configSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
