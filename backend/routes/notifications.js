import express from 'express'
import { Notification } from '../models/index.js'

const router = express.Router()

// Get notifications for user
router.get('/user/:userId', async (req, res) => {
  try {
    const { unreadOnly } = req.query
    const where = { userId: req.params.userId }
    if (unreadOnly === 'true') where.isRead = false
    
    const notifications = await Notification.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 50
    })
    res.json(notifications)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get unread count for user
router.get('/user/:userId/count', async (req, res) => {
  try {
    const count = await Notification.count({
      where: { userId: req.params.userId, isRead: false }
    })
    res.json({ unreadCount: count })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create notification
router.post('/', async (req, res) => {
  try {
    const notification = await Notification.create(req.body)
    res.status(201).json(notification)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id)
    if (!notification) return res.status(404).json({ error: 'Notification not found' })
    
    await notification.update({ isRead: true, readAt: new Date() })
    res.json(notification)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Mark all notifications as read for user
router.put('/user/:userId/read-all', async (req, res) => {
  try {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId: req.params.userId, isRead: false } }
    )
    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id)
    if (!notification) return res.status(404).json({ error: 'Notification not found' })
    await notification.destroy()
    res.json({ message: 'Notification deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
