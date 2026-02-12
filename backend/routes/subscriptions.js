import express from 'express'
import { Op } from 'sequelize'
import EventSubscription from '../models/EventSubscription.js'
import { SUBSCRIBABLE_EVENTS, getAllCategories, getEventsByCategory } from '../config/events.js'

const router = express.Router()

// Get all available events
router.get('/events', (req, res) => {
  res.json({
    events: SUBSCRIBABLE_EVENTS,
    categories: getAllCategories(),
    totalEvents: SUBSCRIBABLE_EVENTS.length
  })
})

// Get events by category
router.get('/events/:category', (req, res) => {
  const events = getEventsByCategory(req.params.category)
  res.json(events)
})

// Get user subscriptions
router.get('/user/:userId', async (req, res) => {
  try {
    const subscriptions = await EventSubscription.findAll({
      where: { userId: req.params.userId }
    })
    res.json(subscriptions)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Subscribe to an event
router.post('/subscribe', async (req, res) => {
  try {
    const { userId, eventType, notifyEmail, notifyInApp, notifyPush } = req.body
    
    // Check if already subscribed
    const existing = await EventSubscription.findOne({
      where: { userId, eventType }
    })
    
    if (existing) {
      await existing.update({ isEnabled: true, notifyEmail, notifyInApp, notifyPush })
      return res.json(existing)
    }
    
    // Find event category
    const event = SUBSCRIBABLE_EVENTS.find(e => e.type === eventType)
    
    const subscription = await EventSubscription.create({
      userId,
      eventType,
      eventCategory: event?.category || 'other',
      notifyEmail: notifyEmail || false,
      notifyInApp: notifyInApp !== false,
      notifyPush: notifyPush || false
    })
    
    res.status(201).json(subscription)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Unsubscribe from an event
router.post('/unsubscribe', async (req, res) => {
  try {
    const { userId, eventType } = req.body
    
    const subscription = await EventSubscription.findOne({
      where: { userId, eventType }
    })
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' })
    }
    
    await subscription.update({ isEnabled: false })
    res.json({ message: 'Unsubscribed successfully' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Bulk subscribe to multiple events
router.post('/subscribe/bulk', async (req, res) => {
  try {
    const { userId, eventTypes, notifyEmail, notifyInApp, notifyPush } = req.body
    
    const subscriptions = await Promise.all(
      eventTypes.map(async (eventType) => {
        const event = SUBSCRIBABLE_EVENTS.find(e => e.type === eventType)
        const [subscription] = await EventSubscription.findOrCreate({
          where: { userId, eventType },
          defaults: {
            eventCategory: event?.category || 'other',
            notifyEmail: notifyEmail || false,
            notifyInApp: notifyInApp !== false,
            notifyPush: notifyPush || false
          }
        })
        await subscription.update({ isEnabled: true })
        return subscription
      })
    )
    
    res.json(subscriptions)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Subscribe to all events in a category
router.post('/subscribe/category', async (req, res) => {
  try {
    const { userId, category, notifyEmail, notifyInApp, notifyPush } = req.body
    
    const events = getEventsByCategory(category)
    
    const subscriptions = await Promise.all(
      events.map(async (event) => {
        const [subscription] = await EventSubscription.findOrCreate({
          where: { userId, eventType: event.type },
          defaults: {
            eventCategory: category,
            notifyEmail: notifyEmail || false,
            notifyInApp: notifyInApp !== false,
            notifyPush: notifyPush || false
          }
        })
        await subscription.update({ isEnabled: true })
        return subscription
      })
    )
    
    res.json(subscriptions)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Update subscription settings
router.put('/:subscriptionId', async (req, res) => {
  try {
    const subscription = await EventSubscription.findByPk(req.params.subscriptionId)
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' })
    }
    
    await subscription.update(req.body)
    res.json(subscription)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Delete subscription
router.delete('/:subscriptionId', async (req, res) => {
  try {
    const subscription = await EventSubscription.findByPk(req.params.subscriptionId)
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' })
    }
    
    await subscription.destroy()
    res.json({ message: 'Subscription deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get subscribers for an event (for publishing)
router.get('/subscribers/:eventType', async (req, res) => {
  try {
    const subscriptions = await EventSubscription.findAll({
      where: { 
        eventType: req.params.eventType,
        isEnabled: true
      }
    })
    res.json(subscriptions)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
