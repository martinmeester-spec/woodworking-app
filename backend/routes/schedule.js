import express from 'express'
import { ProductionSchedule, ProductionOrder, User, Machine } from '../models/index.js'
import { Op } from 'sequelize'

const router = express.Router()

// Get all scheduled items
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, status, type } = req.query
    const where = {}
    
    if (startDate && endDate) {
      where.startDate = { [Op.between]: [new Date(startDate), new Date(endDate)] }
    }
    if (status) where.status = status
    if (type) where.scheduleType = type
    
    const schedules = await ProductionSchedule.findAll({
      where,
      order: [['startDate', 'ASC']]
    })
    res.json(schedules)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get schedule by ID
router.get('/:id', async (req, res) => {
  try {
    const schedule = await ProductionSchedule.findByPk(req.params.id)
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' })
    res.json(schedule)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get schedule for a specific month
router.get('/month/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)
    
    const schedules = await ProductionSchedule.findAll({
      where: {
        [Op.or]: [
          { startDate: { [Op.between]: [startDate, endDate] } },
          { endDate: { [Op.between]: [startDate, endDate] } },
          {
            startDate: { [Op.lte]: startDate },
            endDate: { [Op.gte]: endDate }
          }
        ]
      },
      order: [['startDate', 'ASC']]
    })
    res.json(schedules)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create schedule item
router.post('/', async (req, res) => {
  try {
    const schedule = await ProductionSchedule.create(req.body)
    res.status(201).json(schedule)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Update schedule item
router.put('/:id', async (req, res) => {
  try {
    const schedule = await ProductionSchedule.findByPk(req.params.id)
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' })
    await schedule.update(req.body)
    res.json(schedule)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Delete schedule item
router.delete('/:id', async (req, res) => {
  try {
    const schedule = await ProductionSchedule.findByPk(req.params.id)
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' })
    await schedule.destroy()
    res.json({ message: 'Schedule deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Schedule production order (creates schedule from order)
router.post('/from-order/:orderId', async (req, res) => {
  try {
    const order = await ProductionOrder.findByPk(req.params.orderId)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    
    const { startDate, estimatedHours, assignedTo, machineId } = req.body
    const endDate = new Date(startDate)
    endDate.setHours(endDate.getHours() + (estimatedHours || 8))
    
    const schedule = await ProductionSchedule.create({
      orderId: order.id,
      title: `Production: ${order.orderNumber}`,
      description: `Production order ${order.orderNumber}`,
      scheduleType: 'production',
      startDate: new Date(startDate),
      endDate,
      status: 'Scheduled',
      priority: order.priority || 'normal',
      assignedTo,
      machineId,
      estimatedHours: estimatedHours || 8,
      color: '#3b82f6'
    })
    
    res.status(201).json(schedule)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get upcoming schedules (next 7 days)
router.get('/upcoming/week', async (req, res) => {
  try {
    const now = new Date()
    const weekLater = new Date()
    weekLater.setDate(weekLater.getDate() + 7)
    
    const schedules = await ProductionSchedule.findAll({
      where: {
        startDate: { [Op.between]: [now, weekLater] }
      },
      order: [['startDate', 'ASC']]
    })
    res.json(schedules)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get schedule summary/metrics
router.get('/metrics/summary', async (req, res) => {
  try {
    const schedules = await ProductionSchedule.findAll()
    
    const total = schedules.length
    const scheduled = schedules.filter(s => s.status === 'Scheduled').length
    const inProgress = schedules.filter(s => s.status === 'In Progress').length
    const completed = schedules.filter(s => s.status === 'Completed').length
    const overdue = schedules.filter(s => s.status === 'Scheduled' && new Date(s.endDate) < new Date()).length
    
    const totalEstimatedHours = schedules.reduce((sum, s) => sum + (parseFloat(s.estimatedHours) || 0), 0)
    const totalActualHours = schedules.reduce((sum, s) => sum + (parseFloat(s.actualHours) || 0), 0)
    
    res.json({
      total,
      scheduled,
      inProgress,
      completed,
      overdue,
      totalEstimatedHours,
      totalActualHours,
      completionRate: total > 0 ? parseFloat((completed / total * 100).toFixed(1)) : 0
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
