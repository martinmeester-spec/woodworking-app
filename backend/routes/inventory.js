import express from 'express'
import { InventoryPart, InventoryTransaction, ReorderAlert } from '../models/index.js'

const router = express.Router()

// Get inventory metrics
router.get('/metrics', async (req, res) => {
  try {
    const parts = await InventoryPart.findAll()
    const transactions = await InventoryTransaction.findAll()
    const alerts = await ReorderAlert.findAll()
    
    const totalParts = parts.length
    const totalValue = parts.reduce((sum, p) => sum + (p.quantity * (p.unitCost || 0)), 0)
    const lowStockParts = parts.filter(p => p.status === 'Low Stock' || p.status === 'Critical').length
    const outOfStockParts = parts.filter(p => p.status === 'Out of Stock').length
    
    const inTransactions = transactions.filter(t => t.transactionType === 'IN').length
    const outTransactions = transactions.filter(t => t.transactionType === 'OUT').length
    
    const pendingAlerts = alerts.filter(a => a.status === 'Pending').length
    const acknowledgedAlerts = alerts.filter(a => a.status === 'Acknowledged').length
    
    res.json({
      parts: {
        total: totalParts,
        lowStock: lowStockParts,
        outOfStock: outOfStockParts,
        totalValue: parseFloat(totalValue.toFixed(2))
      },
      transactions: {
        total: transactions.length,
        in: inTransactions,
        out: outTransactions
      },
      alerts: {
        total: alerts.length,
        pending: pendingAlerts,
        acknowledged: acknowledgedAlerts
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get stock levels summary
router.get('/stock-levels', async (req, res) => {
  try {
    const parts = await InventoryPart.findAll()
    
    const summary = {
      total: parts.length,
      inStock: parts.filter(p => p.status === 'In Stock').length,
      lowStock: parts.filter(p => p.status === 'Low Stock').length,
      critical: parts.filter(p => p.status === 'Critical').length,
      outOfStock: parts.filter(p => p.status === 'Out of Stock').length,
      totalValue: parts.reduce((sum, p) => sum + (p.quantity * (p.unitCost || 0)), 0),
      parts: parts.map(p => ({
        id: p.id,
        name: p.name,
        partNumber: p.partNumber,
        quantity: p.quantity,
        minQuantity: p.minQuantity,
        maxQuantity: p.maxQuantity,
        status: p.status,
        unitCost: p.unitCost,
        value: p.quantity * (p.unitCost || 0)
      }))
    }
    
    res.json(summary)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all inventory parts
router.get('/parts', async (req, res) => {
  try {
    const { category, status } = req.query
    const where = {}
    if (category) where.category = category
    if (status) where.status = status
    
    const parts = await InventoryPart.findAll({ where, order: [['name', 'ASC']] })
    res.json(parts)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get part by ID
router.get('/parts/:id', async (req, res) => {
  try {
    const part = await InventoryPart.findByPk(req.params.id)
    if (!part) return res.status(404).json({ error: 'Part not found' })
    res.json(part)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create part
router.post('/parts', async (req, res) => {
  try {
    const part = await InventoryPart.create(req.body)
    res.status(201).json(part)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Update part
router.put('/parts/:id', async (req, res) => {
  try {
    const part = await InventoryPart.findByPk(req.params.id)
    if (!part) return res.status(404).json({ error: 'Part not found' })
    await part.update(req.body)
    res.json(part)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Delete part
router.delete('/parts/:id', async (req, res) => {
  try {
    const part = await InventoryPart.findByPk(req.params.id)
    if (!part) return res.status(404).json({ error: 'Part not found' })
    await part.destroy()
    res.json({ message: 'Part deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get stock levels summary
router.get('/stock-levels', async (req, res) => {
  try {
    const parts = await InventoryPart.findAll()
    const summary = {
      total: parts.length,
      inStock: parts.filter(p => p.status === 'In Stock').length,
      lowStock: parts.filter(p => p.status === 'Low Stock').length,
      critical: parts.filter(p => p.status === 'Critical').length,
      outOfStock: parts.filter(p => p.status === 'Out of Stock').length,
      totalValue: parts.reduce((sum, p) => sum + (parseFloat(p.unitCost) * p.quantity), 0)
    }
    res.json(summary)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Adjust inventory quantity
router.post('/parts/:id/adjust', async (req, res) => {
  try {
    const part = await InventoryPart.findByPk(req.params.id)
    if (!part) return res.status(404).json({ error: 'Part not found' })
    
    const { adjustment, reason } = req.body
    const newQuantity = part.quantity + adjustment
    
    let status = 'In Stock'
    if (newQuantity <= 0) status = 'Out of Stock'
    else if (newQuantity <= part.minQuantity * 0.5) status = 'Critical'
    else if (newQuantity <= part.minQuantity) status = 'Low Stock'
    
    await part.update({ quantity: newQuantity, status })
    res.json(part)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get all inventory transactions
router.get('/transactions', async (req, res) => {
  try {
    const { partId, type, limit = 50 } = req.query
    const where = {}
    if (partId) where.partId = partId
    if (type) where.type = type
    
    const transactions = await InventoryTransaction.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    })
    res.json(transactions)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create inventory transaction (stock in/out)
router.post('/transactions', async (req, res) => {
  try {
    const part = await InventoryPart.findByPk(req.body.partId)
    if (!part) return res.status(404).json({ error: 'Part not found' })
    
    const previousQuantity = part.quantity
    let newQuantity = previousQuantity
    
    if (req.body.type === 'IN' || req.body.type === 'Received') {
      newQuantity = previousQuantity + req.body.quantity
    } else if (req.body.type === 'OUT' || req.body.type === 'Used') {
      newQuantity = previousQuantity - req.body.quantity
    } else if (req.body.type === 'Adjustment') {
      newQuantity = req.body.quantity
    }
    
    const transaction = await InventoryTransaction.create({
      ...req.body,
      transactionNumber: `TXN-${Date.now()}`,
      previousQuantity,
      newQuantity
    })
    
    // Update part quantity
    await part.update({ quantity: newQuantity })
    
    res.status(201).json(transaction)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get all reorder alerts
router.get('/alerts', async (req, res) => {
  try {
    const { status } = req.query
    const where = {}
    if (status) where.status = status
    
    const alerts = await ReorderAlert.findAll({
      where,
      order: [['createdAt', 'DESC']]
    })
    res.json(alerts)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create reorder alert
router.post('/alerts', async (req, res) => {
  try {
    const alert = await ReorderAlert.create(req.body)
    res.status(201).json(alert)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Check and generate reorder alerts for low stock
router.post('/alerts/check', async (req, res) => {
  try {
    const lowStockParts = await InventoryPart.findAll({
      where: {
        status: ['Low Stock', 'Critical']
      }
    })
    
    const alerts = []
    for (const part of lowStockParts) {
      const existingAlert = await ReorderAlert.findOne({
        where: { partId: part.id, status: 'Open' }
      })
      
      if (!existingAlert) {
        const alert = await ReorderAlert.create({
          partId: part.id,
          currentQuantity: part.quantity,
          minQuantity: part.minQuantity,
          reorderQuantity: part.maxQuantity - part.quantity,
          priority: part.status === 'Critical' ? 'High' : 'Medium'
        })
        alerts.push(alert)
      }
    }
    
    res.json({ generated: alerts.length, alerts })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Acknowledge reorder alert
router.put('/alerts/:id/acknowledge', async (req, res) => {
  try {
    const alert = await ReorderAlert.findByPk(req.params.id)
    if (!alert) return res.status(404).json({ error: 'Alert not found' })
    
    await alert.update({
      status: 'Acknowledged',
      acknowledgedBy: req.body.userId,
      acknowledgedAt: new Date()
    })
    
    res.json(alert)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
