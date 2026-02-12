import express from 'express'
import { QualityDefect, ReworkOrder, Panel, ProductionStation } from '../models/index.js'

const router = express.Router()

// Get all defects
router.get('/defects', async (req, res) => {
  try {
    const { status, severity } = req.query
    const where = {}
    if (status) where.status = status
    if (severity) where.severity = severity
    
    const defects = await QualityDefect.findAll({
      where,
      include: [
        { model: Panel, as: 'panel', attributes: ['id', 'panelNumber', 'material'] },
        { model: ProductionStation, as: 'station', attributes: ['id', 'stationName', 'stationType'] }
      ],
      order: [['created_at', 'DESC']]
    })
    res.json(defects)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get defect by ID
router.get('/defects/:id', async (req, res) => {
  try {
    const defect = await QualityDefect.findByPk(req.params.id, {
      include: [
        { model: Panel, as: 'panel' },
        { model: ProductionStation, as: 'station' }
      ]
    })
    if (!defect) return res.status(404).json({ error: 'Defect not found' })
    res.json(defect)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create defect
router.post('/defects', async (req, res) => {
  try {
    const defect = await QualityDefect.create(req.body)
    
    // Update panel status to Defective
    if (req.body.panelId) {
      await Panel.update({ status: 'Defective' }, { where: { id: req.body.panelId } })
    }
    
    res.status(201).json(defect)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Update defect
router.put('/defects/:id', async (req, res) => {
  try {
    const defect = await QualityDefect.findByPk(req.params.id)
    if (!defect) return res.status(404).json({ error: 'Defect not found' })
    
    await defect.update(req.body)
    
    // If resolved, update panel status
    if (req.body.status === 'Resolved') {
      await defect.update({ resolvedAt: new Date() })
      await Panel.update({ status: 'Completed' }, { where: { id: defect.panelId } })
    }
    
    res.json(defect)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get quality summary
router.get('/summary', async (req, res) => {
  try {
    const defects = await QualityDefect.findAll()
    const summary = {
      total: defects.length,
      open: defects.filter(d => d.status === 'Open').length,
      inRework: defects.filter(d => d.status === 'In Rework').length,
      resolved: defects.filter(d => d.status === 'Resolved').length,
      critical: defects.filter(d => d.severity === 'Critical').length,
      high: defects.filter(d => d.severity === 'High').length,
      medium: defects.filter(d => d.severity === 'Medium').length,
      low: defects.filter(d => d.severity === 'Low').length
    }
    res.json(summary)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all rework orders
router.get('/rework', async (req, res) => {
  try {
    const { status } = req.query
    const where = {}
    if (status) where.status = status
    
    const orders = await ReworkOrder.findAll({
      where,
      order: [['createdAt', 'DESC']]
    })
    res.json(orders)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create rework order
router.post('/rework', async (req, res) => {
  try {
    const reworkNumber = `RW-${Date.now()}`
    const order = await ReworkOrder.create({
      ...req.body,
      reworkNumber
    })
    
    // Update panel status to Rework
    if (req.body.panelId) {
      await Panel.update({ status: 'Rework' }, { where: { id: req.body.panelId } })
    }
    
    res.status(201).json(order)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Complete rework order
router.put('/rework/:id/complete', async (req, res) => {
  try {
    const order = await ReworkOrder.findByPk(req.params.id)
    if (!order) return res.status(404).json({ error: 'Rework order not found' })
    
    await order.update({
      status: 'Completed',
      completedAt: new Date(),
      notes: req.body.notes
    })
    
    // Update panel status back to In Progress or Completed
    await Panel.update({ status: 'Completed' }, { where: { id: order.panelId } })
    
    res.json(order)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get quality metrics
router.get('/metrics', async (req, res) => {
  try {
    const defects = await QualityDefect.findAll()
    const reworkOrders = await ReworkOrder.findAll()
    const panels = await Panel.findAll()
    
    const totalPanels = panels.length
    const defectivePanels = panels.filter(p => p.status === 'Defective' || p.status === 'Rework').length
    const defectRate = totalPanels > 0 ? (defectivePanels / totalPanels * 100).toFixed(2) : 0
    
    const totalDefects = defects.length
    const resolvedDefects = defects.filter(d => d.status === 'Resolved').length
    const resolutionRate = totalDefects > 0 ? (resolvedDefects / totalDefects * 100).toFixed(2) : 0
    
    const totalRework = reworkOrders.length
    const completedRework = reworkOrders.filter(r => r.status === 'Completed').length
    const reworkCompletionRate = totalRework > 0 ? (completedRework / totalRework * 100).toFixed(2) : 0
    
    res.json({
      defects: {
        total: totalDefects,
        resolved: resolvedDefects,
        open: totalDefects - resolvedDefects,
        resolutionRate: parseFloat(resolutionRate)
      },
      rework: {
        total: totalRework,
        completed: completedRework,
        pending: totalRework - completedRework,
        completionRate: parseFloat(reworkCompletionRate)
      },
      quality: {
        totalPanels,
        defectivePanels,
        defectRate: parseFloat(defectRate),
        passRate: parseFloat((100 - parseFloat(defectRate)).toFixed(2))
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
