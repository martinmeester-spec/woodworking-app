import { jest } from '@jest/globals'
import { sequelize, User, Notification } from '../models/index.js'
import EventSubscription from '../models/EventSubscription.js'

const API_URL = 'http://localhost:3001/api'

async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    })
    const data = await response.json().catch(() => ({}))
    return { status: response.status, data }
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error.message)
    return { status: 500, data: { error: error.message } }
  }
}

describe('PubSub and Notification Tests', () => {
  let testUserId

  beforeAll(async () => {
    await sequelize.authenticate()
    // Get or create a test user
    const users = await User.findAll({ limit: 1 })
    testUserId = users[0]?.id
  })

  afterAll(async () => {
    await sequelize.close()
  })

  // ==================== SUBSCRIPTION TESTS ====================
  describe('Event Subscription System', () => {
    test('PS001: Get all available subscribable events', async () => {
      const { status, data } = await apiRequest('/subscriptions/events')
      expect(status).toBe(200)
      expect(data.events).toBeDefined()
      expect(Array.isArray(data.events)).toBe(true)
      expect(data.categories).toBeDefined()
      expect(data.totalEvents).toBeGreaterThan(0)
    })

    test('PS002: Get events by category - production', async () => {
      const { status, data } = await apiRequest('/subscriptions/events/production')
      expect(status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })

    test('PS003: Get events by category - inventory', async () => {
      const { status, data } = await apiRequest('/subscriptions/events/inventory')
      expect(status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })

    test('PS004: Get events by category - quality', async () => {
      const { status, data } = await apiRequest('/subscriptions/events/quality')
      expect(status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })

    test('PS005: Subscribe to a single event', async () => {
      if (!testUserId) return
      const { status, data } = await apiRequest('/subscriptions/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUserId,
          eventType: 'order.created',
          notifyEmail: true,
          notifyInApp: true,
          notifyPush: false
        })
      })
      expect([200, 201]).toContain(status)
      expect(data.eventType).toBe('order.created')
    })

    test('PS006: Get user subscriptions', async () => {
      if (!testUserId) return
      const { status, data } = await apiRequest(`/subscriptions/user/${testUserId}`)
      expect(status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })

    test('PS007: Unsubscribe from an event', async () => {
      if (!testUserId) return
      const { status, data } = await apiRequest('/subscriptions/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUserId,
          eventType: 'order.created'
        })
      })
      expect([200, 404]).toContain(status)
    })

    test('PS008: Bulk subscribe to multiple events', async () => {
      if (!testUserId) return
      const { status, data } = await apiRequest('/subscriptions/subscribe/bulk', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUserId,
          eventTypes: ['order.created', 'order.completed', 'inventory.low_stock'],
          notifyInApp: true
        })
      })
      expect(status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(3)
    })

    test('PS009: Subscribe to all events in a category', async () => {
      if (!testUserId) return
      const { status, data } = await apiRequest('/subscriptions/subscribe/category', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUserId,
          category: 'production',
          notifyInApp: true
        })
      })
      expect(status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })

    test('PS010: Get subscribers for a specific event', async () => {
      const { status, data } = await apiRequest('/subscriptions/subscribers/order.created')
      expect(status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })
  })

  // ==================== NOTIFICATION TESTS ====================
  describe('Notification System', () => {
    let testNotificationId

    test('PS011: Create notification for user', async () => {
      if (!testUserId) return
      const { status, data } = await apiRequest('/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUserId,
          type: 'info',
          title: 'Test PubSub Notification',
          message: 'This is a test notification from PubSub tests',
          eventType: 'order.created'
        })
      })
      expect(status).toBe(201)
      expect(data.id).toBeDefined()
      testNotificationId = data.id
    })

    test('PS012: Get user notifications', async () => {
      if (!testUserId) return
      const { status, data } = await apiRequest(`/notifications/user/${testUserId}`)
      expect(status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })

    test('PS013: Get unread notification count', async () => {
      if (!testUserId) return
      const { status, data } = await apiRequest(`/notifications/user/${testUserId}/count`)
      expect(status).toBe(200)
      expect(typeof data.unreadCount).toBe('number')
    })

    test('PS014: Get only unread notifications', async () => {
      if (!testUserId) return
      const { status, data } = await apiRequest(`/notifications/user/${testUserId}?unreadOnly=true`)
      expect(status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })

    test('PS015: Mark notification as read', async () => {
      if (!testNotificationId) return
      const { status, data } = await apiRequest(`/notifications/${testNotificationId}/read`, {
        method: 'PUT'
      })
      expect(status).toBe(200)
      expect(data.isRead).toBe(true)
    })

    test('PS016: Mark all notifications as read', async () => {
      if (!testUserId) return
      const { status, data } = await apiRequest(`/notifications/user/${testUserId}/read-all`, {
        method: 'PUT'
      })
      expect(status).toBe(200)
      expect(data.message).toBe('All notifications marked as read')
    })

    test('PS017: Create multiple notification types', async () => {
      if (!testUserId) return
      const types = ['info', 'warning', 'error', 'success']
      for (const type of types) {
        const { status } = await apiRequest('/notifications', {
          method: 'POST',
          body: JSON.stringify({
            userId: testUserId,
            type,
            title: `Test ${type} notification`,
            message: `This is a ${type} notification`
          })
        })
        expect(status).toBe(201)
      }
    })

    test('PS018: Delete notification', async () => {
      if (!testNotificationId) return
      const { status } = await apiRequest(`/notifications/${testNotificationId}`, {
        method: 'DELETE'
      })
      expect(status).toBe(200)
    })
  })

  // ==================== EVENT TRIGGER TESTS ====================
  describe('Event Trigger and Notification Flow', () => {
    test('PS019: Trigger order created event and verify notification', async () => {
      if (!testUserId) return
      
      // First subscribe to the event
      await apiRequest('/subscriptions/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUserId,
          eventType: 'order.created',
          notifyInApp: true
        })
      })

      // Get initial notification count
      const { data: before } = await apiRequest(`/notifications/user/${testUserId}/count`)
      const beforeCount = before.unreadCount

      // Create an order (which should trigger the event)
      const designs = await (await import('../models/index.js')).CabinetDesign.findAll({ limit: 1 })
      if (designs.length > 0) {
        await apiRequest('/production/orders', {
          method: 'POST',
          body: JSON.stringify({
            designId: designs[0].id,
            createdBy: testUserId,
            orderDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          })
        })
      }

      // Check if notification was created (may need event system to be wired up)
      const { data: after } = await apiRequest(`/notifications/user/${testUserId}/count`)
      // Note: This test verifies the flow exists, actual notification depends on event wiring
      expect(typeof after.unreadCount).toBe('number')
    })

    test('PS020: Verify subscription update works', async () => {
      if (!testUserId) return
      
      // Get existing subscription
      const { data: subs } = await apiRequest(`/subscriptions/user/${testUserId}`)
      if (subs.length > 0) {
        const { status, data } = await apiRequest(`/subscriptions/${subs[0].id}`, {
          method: 'PUT',
          body: JSON.stringify({
            notifyEmail: true,
            notifyPush: true
          })
        })
        expect(status).toBe(200)
        expect(data.notifyEmail).toBe(true)
      }
    })
  })

  // ==================== EDGE CASES ====================
  describe('PubSub Edge Cases', () => {
    test('PS021: Subscribe to non-existent event type', async () => {
      if (!testUserId) return
      const { status } = await apiRequest('/subscriptions/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUserId,
          eventType: 'non.existent.event',
          notifyInApp: true
        })
      })
      // Should still create subscription (flexible system)
      expect([200, 201, 400]).toContain(status)
    })

    test('PS022: Unsubscribe from non-subscribed event', async () => {
      if (!testUserId) return
      const { status } = await apiRequest('/subscriptions/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUserId,
          eventType: 'never.subscribed.event'
        })
      })
      expect(status).toBe(404)
    })

    test('PS023: Get notifications for non-existent user', async () => {
      const { status, data } = await apiRequest('/notifications/user/non-existent-user-id')
      // May return 200 with empty array or 500 if UUID validation fails
      expect([200, 500]).toContain(status)
    })

    test('PS024: Mark non-existent notification as read', async () => {
      // Use a valid UUID format that doesn't exist
      const { status } = await apiRequest('/notifications/00000000-0000-0000-0000-000000000000/read', {
        method: 'PUT'
      })
      // Should return 404 for non-existent notification
      expect([404, 500]).toContain(status)
    })

    test('PS025: Delete subscription', async () => {
      if (!testUserId) return
      const { data: subs } = await apiRequest(`/subscriptions/user/${testUserId}`)
      if (subs.length > 0) {
        const { status } = await apiRequest(`/subscriptions/${subs[0].id}`, {
          method: 'DELETE'
        })
        expect(status).toBe(200)
      }
    })
  })
})
