import express from 'express'
import { SystemConfig, AuditLog } from '../models/index.js'

const router = express.Router()

// Get all system configs
router.get('/config', async (req, res) => {
  try {
    const { category } = req.query
    const where = {}
    if (category) where.category = category
    
    const configs = await SystemConfig.findAll({
      where,
      order: [['configKey', 'ASC']]
    })
    res.json(configs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get config by key
router.get('/config/:key', async (req, res) => {
  try {
    const config = await SystemConfig.findOne({
      where: { configKey: req.params.key }
    })
    if (!config) return res.status(404).json({ error: 'Config not found' })
    res.json(config)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create or update config
router.put('/config/:key', async (req, res) => {
  try {
    const [config, created] = await SystemConfig.upsert({
      configKey: req.params.key,
      ...req.body
    })
    res.status(created ? 201 : 200).json(config)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Create config
router.post('/config', async (req, res) => {
  try {
    const config = await SystemConfig.create(req.body)
    res.status(201).json(config)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Delete config
router.delete('/config/:key', async (req, res) => {
  try {
    const config = await SystemConfig.findOne({
      where: { configKey: req.params.key }
    })
    if (!config) return res.status(404).json({ error: 'Config not found' })
    await config.destroy()
    res.json({ message: 'Config deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all audit logs
router.get('/audit', async (req, res) => {
  try {
    const { entity, action, userId, limit = 100 } = req.query
    const where = {}
    if (entity) where.entity = entity
    if (action) where.action = action
    if (userId) where.userId = userId
    
    const logs = await AuditLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    })
    res.json(logs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create audit log
router.post('/audit', async (req, res) => {
  try {
    const log = await AuditLog.create(req.body)
    res.status(201).json(log)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
