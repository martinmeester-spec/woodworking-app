import express from 'express'
import { ActivityLog, User } from '../models/index.js'

const router = express.Router()

// Get all activity logs
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, userId, action, resourceType } = req.query
    const where = {}
    
    if (userId) where.userId = userId
    if (action) where.action = action
    if (resourceType) where.resourceType = resourceType
    
    const logs = await ActivityLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    })
    res.json(logs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create activity log
router.post('/', async (req, res) => {
  try {
    const log = await ActivityLog.create(req.body)
    res.status(201).json(log)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get activity summary
router.get('/summary', async (req, res) => {
  try {
    const totalLogs = await ActivityLog.count()
    const todayLogs = await ActivityLog.count({
      where: {
        createdAt: {
          [Symbol.for('gte')]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })
    
    res.json({
      total: totalLogs,
      today: todayLogs
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
