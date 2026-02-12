import express from 'express'
import { ProductionOrder, CabinetDesign, CostEstimate } from '../models/index.js'
import exactOnlineService from '../services/exactOnline.js'

const router = express.Router()

// Get invoices derived from completed orders
router.get('/invoices', async (req, res) => {
  try {
    const orders = await ProductionOrder.findAll({
      where: { status: 'Completed' },
      include: [{ model: CabinetDesign, as: 'design' }],
      order: [['created_at', 'DESC']]
    })

    // Get cost estimates for matching with orders
    const allCostEstimates = await CostEstimate.findAll()
    
    const invoices = orders.map((order, index) => {
      // Find matching cost estimate for this order's design
      const costEstimate = allCostEstimates.find(c => c.designId === order.designId)
      
      const materialCost = costEstimate ? parseFloat(costEstimate.materialCost) : 0
      const laborCost = costEstimate ? parseFloat(costEstimate.laborCost) : 0
      const overheadCost = costEstimate ? parseFloat(costEstimate.overheadCost) : 0
      const totalAmount = costEstimate ? parseFloat(costEstimate.totalCost) * 1.3 : (materialCost + laborCost + overheadCost) * 1.3 // 30% profit margin
      
      const createdDate = order.get('created_at') || order.createdAt || new Date()
      const updatedDate = order.get('updated_at') || order.updatedAt || new Date()
      const year = new Date(createdDate).getFullYear() || 2026

      return {
        id: `INV-${year}-${String(index + 1).padStart(3, '0')}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customer: order.customerName,
        designName: order.design?.name || 'Unknown Design',
        totalPanels: order.totalPanels,
        materialCost,
        laborCost,
        overheadCost,
        amount: totalAmount,
        status: order.completedPanels === order.totalPanels ? 'Paid' : 'Pending',
        dueDate: order.dueDate,
        createdAt: createdDate,
        completedAt: updatedDate
      }
    })

    res.json(invoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get expenses derived from cost estimates and orders
router.get('/expenses', async (req, res) => {
  try {
    const costEstimates = await CostEstimate.findAll({
      include: [{ model: CabinetDesign, as: 'design' }],
      order: [['created_at', 'DESC']],
      limit: 50
    })

    const expenses = costEstimates.map((estimate, index) => {
      const createdDate = estimate.get('created_at') || estimate.createdAt || new Date()
      const year = new Date(createdDate).getFullYear() || 2026
      
      return {
        id: `EXP-${year}-${String(index + 1).padStart(3, '0')}`,
        category: 'Materials',
        description: `Materials for ${estimate.design?.name || 'Design'}`,
        designId: estimate.designId,
        designName: estimate.design?.name,
        materialCost: parseFloat(estimate.materialCost) || 0,
        laborCost: parseFloat(estimate.laborCost) || 0,
        overheadCost: parseFloat(estimate.overheadCost) || 0,
        amount: parseFloat(estimate.totalCost) || 0,
        date: createdDate,
        status: 'Recorded',
        currency: estimate.currency || 'EUR'
      }
    })

    res.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get financial summary
router.get('/summary', async (req, res) => {
  try {
    const completedOrders = await ProductionOrder.findAll({
      where: { status: 'Completed' }
    })

    const costEstimates = await CostEstimate.findAll()

    // Calculate revenue from actual cost estimates with profit margin
    const totalRevenue = completedOrders.reduce((sum, order) => {
      const costEstimate = costEstimates.find(c => c.designId === order.designId)
      if (costEstimate) {
        return sum + parseFloat(costEstimate.totalCost) * 1.3 // 30% profit margin
      }
      return sum
    }, 0)

    const totalExpenses = costEstimates.reduce((sum, estimate) => {
      return sum + (parseFloat(estimate.totalCost) || 0)
    }, 0)

    const totalOrders = completedOrders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    res.json({
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      totalOrders,
      averageOrderValue,
      pendingInvoices: completedOrders.filter(o => o.completedPanels < o.totalPanels).length,
      paidInvoices: completedOrders.filter(o => o.completedPanels === o.totalPanels).length
    })
  } catch (error) {
    console.error('Error fetching summary:', error)
    res.status(500).json({ error: error.message })
  }
})

// Integration status tracking
let integrationSyncHistory = {
  exact: { lastSync: null, syncCount: 0, lastError: null }
}

router.get('/integrations', (req, res) => {
  const exactStatus = exactOnlineService.getConnectionStatus()
  
  const integrations = [
    {
      id: 'exact',
      name: 'Exact Online',
      description: 'Dutch accounting software for SMB',
      status: exactStatus.connected ? 'connected' : (exactStatus.configured ? 'disconnected' : 'not_configured'),
      configured: exactStatus.configured,
      lastSync: integrationSyncHistory.exact.lastSync,
      syncCount: integrationSyncHistory.exact.syncCount,
      features: ['invoices', 'expenses', 'customers', 'products']
    }
  ]
  
  res.json(integrations)
})

// Exact Online - Configure credentials
router.post('/exact/configure', (req, res) => {
  const { clientId, clientSecret } = req.body
  
  if (!clientId || !clientSecret) {
    return res.status(400).json({ 
      success: false,
      error: 'Client ID and Client Secret are required'
    })
  }
  
  // Store credentials (in production, these should be encrypted and stored securely)
  process.env.EXACT_CLIENT_ID = clientId
  process.env.EXACT_CLIENT_SECRET = clientSecret
  
  // Reinitialize the service with new credentials
  exactOnlineService.config.clientId = clientId
  exactOnlineService.config.clientSecret = clientSecret
  
  res.json({ 
    success: true, 
    message: 'Exact Online configured successfully. You can now connect.'
  })
})

// Exact Online OAuth2 - Get authorization URL
router.get('/exact/auth-url', (req, res) => {
  if (!exactOnlineService.isConfigured()) {
    return res.status(400).json({ 
      error: 'Exact Online not configured',
      message: 'Please configure your Exact Online credentials first'
    })
  }
  
  const authUrl = exactOnlineService.getAuthorizationUrl()
  res.json({ authUrl })
})

// Exact Online OAuth2 - Callback handler
router.get('/exact/callback', async (req, res) => {
  const { code, error } = req.query
  
  if (error) {
    return res.redirect(`http://localhost:3000/accounting?error=${encodeURIComponent(error)}`)
  }
  
  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' })
  }
  
  try {
    await exactOnlineService.exchangeCodeForTokens(code)
    res.redirect('http://localhost:3000/accounting?connected=true')
  } catch (err) {
    res.redirect(`http://localhost:3000/accounting?error=${encodeURIComponent(err.message)}`)
  }
})

// Exact Online - Get connection status
router.get('/exact/status', (req, res) => {
  const status = exactOnlineService.getConnectionStatus()
  res.json({
    ...status,
    syncHistory: integrationSyncHistory.exact
  })
})

// Exact Online - Disconnect
router.post('/exact/disconnect', (req, res) => {
  const result = exactOnlineService.disconnect()
  res.json(result)
})

// Exact Online - Sync invoices
router.post('/integrations/exact/sync', async (req, res) => {
  try {
    const status = exactOnlineService.getConnectionStatus()
    
    if (!status.connected) {
      return res.status(400).json({ 
        success: false, 
        error: 'Not connected to Exact Online',
        message: 'Please connect to Exact Online first'
      })
    }
    
    // Get local invoices to sync
    const orders = await ProductionOrder.findAll({
      where: { status: 'Completed' },
      include: [{ model: CabinetDesign, as: 'design' }]
    })
    
    // Get cost estimates for matching
    const allCostEstimates = await CostEstimate.findAll()
    
    const invoices = orders.map((order, index) => {
      const costEstimate = allCostEstimates.find(c => c.designId === order.designId)
      const amount = costEstimate ? parseFloat(costEstimate.totalCost) * 1.3 : 0
      
      return {
        id: `INV-${new Date(order.get('created_at') || new Date()).getFullYear()}-${String(index + 1).padStart(3, '0')}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customerName: order.customerName,
        designName: order.design?.name,
        totalPanels: order.totalPanels,
        amount,
        createdAt: order.get('created_at')
      }
    })
    
    // Sync to Exact Online
    const syncResult = await exactOnlineService.syncInvoices(invoices)
    
    // Update sync history
    integrationSyncHistory.exact = {
      lastSync: new Date().toISOString(),
      syncCount: integrationSyncHistory.exact.syncCount + 1,
      lastError: syncResult.failed > 0 ? `${syncResult.failed} invoices failed` : null
    }
    
    res.json({ 
      success: true, 
      message: `Synced ${syncResult.synced} invoices to Exact Online`,
      details: syncResult,
      integration: {
        id: 'exact',
        status: 'connected',
        lastSync: integrationSyncHistory.exact.lastSync
      }
    })
  } catch (error) {
    console.error('Sync error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Generic disconnect handler
router.post('/integrations/:id/disconnect', (req, res) => {
  const { id } = req.params
  
  if (id === 'exact') {
    const result = exactOnlineService.disconnect()
    return res.json(result)
  }
  
  res.status(404).json({ error: 'Integration not found' })
})

// Get customers from Exact Online
router.get('/exact/customers', async (req, res) => {
  try {
    const customers = await exactOnlineService.getCustomers()
    res.json(customers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get items from Exact Online
router.get('/exact/items', async (req, res) => {
  try {
    const items = await exactOnlineService.getItems()
    res.json(items)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get sales invoices from Exact Online
router.get('/exact/sales-invoices', async (req, res) => {
  try {
    const { fromDate } = req.query
    const invoices = await exactOnlineService.getSalesInvoices(fromDate)
    res.json(invoices)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get purchase invoices from Exact Online
router.get('/exact/purchase-invoices', async (req, res) => {
  try {
    const { fromDate } = req.query
    const invoices = await exactOnlineService.getPurchaseInvoices(fromDate)
    res.json(invoices)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
