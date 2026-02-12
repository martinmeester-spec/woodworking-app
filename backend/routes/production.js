import express from 'express'
import QRCode from 'qrcode'
import { ProductionOrder, ProductionJob, Panel, ProductionStation, CabinetDesign, WorkLog } from '../models/index.js'

const router = express.Router()

// Get all production orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await ProductionOrder.findAll({
      include: [
        { model: CabinetDesign, as: 'design', attributes: ['id', 'name', 'material', 'finish'] },
        { model: ProductionJob, as: 'jobs' }
      ],
      order: [['created_at', 'DESC']]
    })
    res.json(orders)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get order by ID
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await ProductionOrder.findByPk(req.params.id, {
      include: [
        { model: CabinetDesign, as: 'design' },
        { model: ProductionJob, as: 'jobs', include: [{ model: Panel, as: 'panels' }] }
      ]
    })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create order
router.post('/orders', async (req, res) => {
  try {
    const orderData = { ...req.body }
    
    // Validate createdBy - if invalid, find a valid user
    if (orderData.createdBy) {
      const { User } = await import('../models/index.js')
      const userExists = await User.findByPk(orderData.createdBy)
      if (!userExists) {
        const fallbackUser = await User.findOne()
        if (fallbackUser) {
          orderData.createdBy = fallbackUser.id
        } else {
          delete orderData.createdBy
        }
      }
    }
    
    const order = await ProductionOrder.create(orderData)
    res.status(201).json(order)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Update order
router.put('/orders/:id', async (req, res) => {
  try {
    const order = await ProductionOrder.findByPk(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    await order.update(req.body)
    res.json(order)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get all jobs
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await ProductionJob.findAll({
      include: [{ model: ProductionOrder, as: 'order' }],
      order: [['created_at', 'DESC']]
    })
    res.json(jobs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create job
router.post('/jobs', async (req, res) => {
  try {
    const job = await ProductionJob.create(req.body)
    res.status(201).json(job)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get all panels
router.get('/panels', async (req, res) => {
  try {
    const panels = await Panel.findAll({
      include: [
        { model: ProductionJob, as: 'job' },
        { model: ProductionStation, as: 'currentStation' }
      ],
      order: [['created_at', 'DESC']]
    })
    res.json(panels)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create panel
router.post('/panels', async (req, res) => {
  try {
    const panel = await Panel.create(req.body)
    res.status(201).json(panel)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get all stations
router.get('/stations', async (req, res) => {
  try {
    const stations = await ProductionStation.findAll({ order: [['station_name', 'ASC']] })
    res.json(stations)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update panel status (QR scan)
router.post('/panels/:id/scan', async (req, res) => {
  try {
    const panel = await Panel.findByPk(req.params.id)
    if (!panel) return res.status(404).json({ error: 'Panel not found' })
    await panel.update({ status: req.body.status, currentStationId: req.body.stationId })
    res.json(panel)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Generate QR code for panel
router.get('/panels/:id/qrcode', async (req, res) => {
  try {
    const panel = await Panel.findByPk(req.params.id)
    if (!panel) return res.status(404).json({ error: 'Panel not found' })
    
    const qrData = JSON.stringify({
      panelId: panel.id,
      qrCode: panel.qrCode,
      panelNumber: panel.panelNumber,
      material: panel.material,
      dimensions: `${panel.width}x${panel.height}x${panel.thickness}mm`
    })
    
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 200 })
    res.json({ qrCode: qrCodeDataUrl, data: JSON.parse(qrData) })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Generate QR codes for all panels in an order
router.get('/orders/:id/qrcodes', async (req, res) => {
  try {
    const order = await ProductionOrder.findByPk(req.params.id, {
      include: [{ model: ProductionJob, as: 'jobs', include: [{ model: Panel, as: 'panels' }] }]
    })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    
    const panels = order.jobs?.flatMap(j => j.panels) || []
    const qrCodes = await Promise.all(panels.map(async (panel) => {
      const qrData = JSON.stringify({
        panelId: panel.id,
        qrCode: panel.qrCode,
        panelNumber: panel.panelNumber
      })
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 150 })
      return { panelId: panel.id, panelNumber: panel.panelNumber, qrCode: qrCodeDataUrl }
    }))
    
    res.json({ orderId: order.id, orderNumber: order.orderNumber, qrCodes })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all work logs
router.get('/worklogs', async (req, res) => {
  try {
    const { stationId, panelId, limit = 50 } = req.query
    const where = {}
    if (stationId) where.stationId = stationId
    if (panelId) where.panelId = panelId
    
    const logs = await WorkLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    })
    res.json(logs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create work log (start processing panel at station)
router.post('/worklogs', async (req, res) => {
  try {
    const log = await WorkLog.create(req.body)
    res.status(201).json(log)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Complete work log (finish processing panel at station)
router.put('/worklogs/:id/complete', async (req, res) => {
  try {
    const log = await WorkLog.findByPk(req.params.id)
    if (!log) return res.status(404).json({ error: 'Work log not found' })
    
    const endTime = new Date()
    const duration = Math.round((endTime - new Date(log.startTime)) / 1000) // seconds
    
    await log.update({
      endTime,
      duration,
      status: 'Completed',
      qualityCheck: req.body.qualityCheck || false,
      notes: req.body.notes
    })
    
    res.json(log)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get production metrics
router.get('/metrics', async (req, res) => {
  try {
    const orders = await ProductionOrder.findAll()
    const panels = await Panel.findAll()
    
    const totalOrders = orders.length
    const completedOrders = orders.filter(o => o.status === 'Completed').length
    const inProgressOrders = orders.filter(o => o.status === 'In Progress').length
    const pendingOrders = orders.filter(o => o.status === 'Pending').length
    
    const totalPanels = panels.length
    const completedPanels = panels.filter(p => p.status === 'Completed').length
    const inProgressPanels = panels.filter(p => p.status === 'In Progress').length
    
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(1) : 0
    const panelCompletionRate = totalPanels > 0 ? (completedPanels / totalPanels * 100).toFixed(1) : 0
    
    res.json({
      orders: {
        total: totalOrders,
        completed: completedOrders,
        inProgress: inProgressOrders,
        pending: pendingOrders,
        completionRate: parseFloat(completionRate)
      },
      panels: {
        total: totalPanels,
        completed: completedPanels,
        inProgress: inProgressPanels,
        completionRate: parseFloat(panelCompletionRate)
      },
      efficiency: {
        orderThroughput: completedOrders,
        panelThroughput: completedPanels
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
