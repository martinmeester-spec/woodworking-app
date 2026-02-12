import { jest } from '@jest/globals'
import { sequelize, User, CabinetDesign, ProductionOrder, InventoryPart } from '../models/index.js'

const API_URL = 'http://localhost:3001/api'

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  })
  const data = await response.json().catch(() => ({}))
  return { status: response.status, data }
}

// Helper to measure response time
async function timedRequest(endpoint, options = {}) {
  const start = Date.now()
  const result = await apiRequest(endpoint, options)
  const duration = Date.now() - start
  return { ...result, duration }
}

describe('Stress and Load Tests', () => {
  
  beforeAll(async () => {
    await sequelize.authenticate()
  })

  afterAll(async () => {
    await sequelize.close()
  })

  // ==================== LOAD TESTS ====================
  describe('Load Tests - Concurrent Requests', () => {
    
    test('LOAD001: 10 concurrent GET requests to /users', async () => {
      const requests = Array(10).fill().map(() => timedRequest('/users'))
      const results = await Promise.all(requests)
      
      const allSuccessful = results.every(r => r.status === 200)
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length
      
      console.log(`10 concurrent /users requests - Avg: ${avgDuration}ms`)
      expect(allSuccessful).toBe(true)
      expect(avgDuration).toBeLessThan(5000) // Should complete within 5 seconds
    })

    test('LOAD002: 10 concurrent GET requests to /designs', async () => {
      const requests = Array(10).fill().map(() => timedRequest('/designs'))
      const results = await Promise.all(requests)
      
      const allSuccessful = results.every(r => r.status === 200)
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length
      
      console.log(`10 concurrent /designs requests - Avg: ${avgDuration}ms`)
      expect(allSuccessful).toBe(true)
    })

    test('LOAD003: 10 concurrent GET requests to /production/orders', async () => {
      const requests = Array(10).fill().map(() => timedRequest('/production/orders'))
      const results = await Promise.all(requests)
      
      const allSuccessful = results.every(r => r.status === 200)
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length
      
      console.log(`10 concurrent /production/orders requests - Avg: ${avgDuration}ms`)
      expect(allSuccessful).toBe(true)
    })

    test('LOAD004: 10 concurrent GET requests to /inventory/parts', async () => {
      const requests = Array(10).fill().map(() => timedRequest('/inventory/parts'))
      const results = await Promise.all(requests)
      
      const allSuccessful = results.every(r => r.status === 200)
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length
      
      console.log(`10 concurrent /inventory/parts requests - Avg: ${avgDuration}ms`)
      expect(allSuccessful).toBe(true)
    })

    test('LOAD005: 10 concurrent GET requests to /machines', async () => {
      const requests = Array(10).fill().map(() => timedRequest('/machines'))
      const results = await Promise.all(requests)
      
      const allSuccessful = results.every(r => r.status === 200)
      expect(allSuccessful).toBe(true)
    })

    test('LOAD006: 20 concurrent mixed endpoint requests', async () => {
      const endpoints = ['/users', '/designs', '/production/orders', '/inventory/parts', '/machines']
      const requests = Array(20).fill().map((_, i) => 
        timedRequest(endpoints[i % endpoints.length])
      )
      const results = await Promise.all(requests)
      
      const successCount = results.filter(r => r.status === 200).length
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length
      
      console.log(`20 mixed concurrent requests - Success: ${successCount}/20, Avg: ${avgDuration}ms`)
      expect(successCount).toBeGreaterThanOrEqual(18) // Allow 10% failure rate
    })

    test('LOAD007: 50 concurrent GET requests to /health', async () => {
      const requests = Array(50).fill().map(() => timedRequest('/health'))
      const results = await Promise.all(requests)
      
      const successCount = results.filter(r => r.status === 200).length
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length
      
      console.log(`50 concurrent /health requests - Success: ${successCount}/50, Avg: ${avgDuration}ms`)
      expect(successCount).toBeGreaterThanOrEqual(45)
    })

    test('LOAD008: Sequential burst of 20 requests', async () => {
      const durations = []
      for (let i = 0; i < 20; i++) {
        const { duration, status } = await timedRequest('/users')
        durations.push(duration)
        expect(status).toBe(200)
      }
      
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
      console.log(`20 sequential /users requests - Avg: ${avgDuration}ms`)
      expect(avgDuration).toBeLessThan(2000)
    })

    test('LOAD009: 10 concurrent POST requests (create notifications)', async () => {
      const users = await User.findAll({ limit: 1 })
      if (users.length === 0) return
      
      const requests = Array(10).fill().map((_, i) => 
        timedRequest('/notifications', {
          method: 'POST',
          body: JSON.stringify({
            userId: users[0].id,
            type: 'info',
            title: `Load Test Notification ${i}`,
            message: 'Created during load test'
          })
        })
      )
      const results = await Promise.all(requests)
      
      const successCount = results.filter(r => r.status === 201).length
      console.log(`10 concurrent POST /notifications - Success: ${successCount}/10`)
      expect(successCount).toBeGreaterThanOrEqual(8)
    })

    test('LOAD010: Mixed read/write concurrent operations', async () => {
      const users = await User.findAll({ limit: 1 })
      if (users.length === 0) return
      
      const requests = [
        timedRequest('/users'),
        timedRequest('/designs'),
        timedRequest('/production/orders'),
        timedRequest('/notifications', {
          method: 'POST',
          body: JSON.stringify({
            userId: users[0].id,
            type: 'info',
            title: 'Mixed Load Test',
            message: 'Test'
          })
        }),
        timedRequest('/inventory/parts'),
        timedRequest('/machines'),
        timedRequest('/quality/defects'),
        timedRequest('/schedule'),
        timedRequest('/customers'),
        timedRequest('/suppliers')
      ]
      
      const results = await Promise.all(requests)
      const successCount = results.filter(r => [200, 201].includes(r.status)).length
      expect(successCount).toBeGreaterThanOrEqual(8)
    })
  })

  // ==================== STRESS TESTS ====================
  describe('Stress Tests - High Volume Operations', () => {
    
    test('STRESS001: Create 20 designs rapidly', async () => {
      const users = await User.findAll({ limit: 1 })
      if (users.length === 0) return
      
      const startCount = await CabinetDesign.count()
      const startTime = Date.now()
      
      const requests = Array(20).fill().map((_, i) => 
        apiRequest('/designs', {
          method: 'POST',
          body: JSON.stringify({
            name: `Stress Test Design ${Date.now()}-${i}`,
            designerId: users[0].id,
            width: 600 + i * 10,
            height: 720,
            depth: 560,
            material: 'MDF'
          })
        })
      )
      
      const results = await Promise.all(requests)
      const duration = Date.now() - startTime
      const successCount = results.filter(r => r.status === 201).length
      
      console.log(`Created ${successCount}/20 designs in ${duration}ms`)
      expect(successCount).toBeGreaterThanOrEqual(15)
    })

    test('STRESS002: Create 20 inventory transactions rapidly', async () => {
      const parts = await InventoryPart.findAll({ limit: 1 })
      if (parts.length === 0) return
      
      const startTime = Date.now()
      
      const requests = Array(20).fill().map((_, i) => 
        apiRequest('/inventory/transactions', {
          method: 'POST',
          body: JSON.stringify({
            partId: parts[0].id,
            type: i % 2 === 0 ? 'IN' : 'OUT',
            quantity: 1,
            reason: `Stress test transaction ${i}`
          })
        })
      )
      
      const results = await Promise.all(requests)
      const duration = Date.now() - startTime
      const successCount = results.filter(r => r.status === 201).length
      
      console.log(`Created ${successCount}/20 transactions in ${duration}ms`)
      expect(successCount).toBeGreaterThanOrEqual(10) // Allow for some failures under stress
    })

    test('STRESS003: Rapid design updates', async () => {
      const designs = await CabinetDesign.findAll({ limit: 1 })
      if (designs.length === 0) return
      
      const startTime = Date.now()
      
      for (let i = 0; i < 10; i++) {
        const { status } = await apiRequest(`/designs/${designs[0].id}`, {
          method: 'PUT',
          body: JSON.stringify({ width: 600 + i * 5 })
        })
        expect(status).toBe(200)
      }
      
      const duration = Date.now() - startTime
      console.log(`10 rapid design updates in ${duration}ms`)
      expect(duration).toBeLessThan(10000)
    })

    test('STRESS004: Concurrent subscription operations', async () => {
      const users = await User.findAll({ limit: 1 })
      if (users.length === 0) return
      
      const eventTypes = [
        'order.created', 'order.completed', 'inventory.low_stock',
        'machine.error', 'quality.defect_found', 'design.approved'
      ]
      
      const requests = eventTypes.map(eventType => 
        apiRequest('/subscriptions/subscribe', {
          method: 'POST',
          body: JSON.stringify({
            userId: users[0].id,
            eventType,
            notifyInApp: true
          })
        })
      )
      
      const results = await Promise.all(requests)
      const successCount = results.filter(r => [200, 201].includes(r.status)).length
      expect(successCount).toBe(eventTypes.length)
    })

    test('STRESS005: Database query stress - multiple joins', async () => {
      const startTime = Date.now()
      
      // These endpoints typically involve joins
      const requests = [
        timedRequest('/production/orders'),
        timedRequest('/designs'),
        timedRequest('/quality/defects'),
        timedRequest('/production/metrics'),
        timedRequest('/inventory/metrics')
      ]
      
      const results = await Promise.all(requests)
      const duration = Date.now() - startTime
      const allSuccessful = results.every(r => r.status === 200)
      
      console.log(`5 complex queries completed in ${duration}ms`)
      expect(allSuccessful).toBe(true)
    })

    test('STRESS006: Rapid notification creation and retrieval', async () => {
      const users = await User.findAll({ limit: 1 })
      if (users.length === 0) return
      
      // Create 15 notifications
      const createRequests = Array(15).fill().map((_, i) => 
        apiRequest('/notifications', {
          method: 'POST',
          body: JSON.stringify({
            userId: users[0].id,
            type: ['info', 'warning', 'error'][i % 3],
            title: `Stress Notification ${i}`,
            message: `Message ${i}`
          })
        })
      )
      
      await Promise.all(createRequests)
      
      // Immediately retrieve
      const { status, data } = await apiRequest(`/notifications/user/${users[0].id}`)
      expect(status).toBe(200)
      expect(data.length).toBeGreaterThan(0)
    })

    test('STRESS007: Concurrent read during write operations', async () => {
      const users = await User.findAll({ limit: 1 })
      if (users.length === 0) return
      
      // Mix of reads and writes
      const operations = [
        apiRequest('/users'),
        apiRequest('/designs'),
        apiRequest('/notifications', {
          method: 'POST',
          body: JSON.stringify({
            userId: users[0].id,
            type: 'info',
            title: 'Concurrent Test',
            message: 'Test'
          })
        }),
        apiRequest('/production/orders'),
        apiRequest('/inventory/parts'),
        apiRequest('/notifications', {
          method: 'POST',
          body: JSON.stringify({
            userId: users[0].id,
            type: 'warning',
            title: 'Concurrent Test 2',
            message: 'Test'
          })
        }),
        apiRequest('/machines'),
        apiRequest('/quality/defects')
      ]
      
      const results = await Promise.all(operations)
      const successCount = results.filter(r => [200, 201].includes(r.status)).length
      expect(successCount).toBeGreaterThanOrEqual(6)
    })

    test('STRESS008: Sustained load over time', async () => {
      const iterations = 5
      const requestsPerIteration = 10
      const results = []
      
      for (let i = 0; i < iterations; i++) {
        const iterationStart = Date.now()
        const requests = Array(requestsPerIteration).fill().map(() => 
          apiRequest('/health')
        )
        const iterationResults = await Promise.all(requests)
        const iterationDuration = Date.now() - iterationStart
        
        results.push({
          iteration: i + 1,
          duration: iterationDuration,
          successCount: iterationResults.filter(r => r.status === 200).length
        })
        
        // Small delay between iterations
        await new Promise(r => setTimeout(r, 100))
      }
      
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / iterations
      const totalSuccess = results.reduce((sum, r) => sum + r.successCount, 0)
      
      console.log(`Sustained load: ${totalSuccess}/${iterations * requestsPerIteration} successful, Avg iteration: ${avgDuration}ms`)
      expect(totalSuccess).toBeGreaterThanOrEqual(iterations * requestsPerIteration * 0.9)
    })

    test('STRESS009: Large payload handling', async () => {
      const users = await User.findAll({ limit: 1 })
      if (users.length === 0) return
      
      // Create design with large modelData
      const largeParts = Array(50).fill().map((_, i) => ({
        id: `part-${i}`,
        type: 'panel',
        x: i * 10,
        y: i * 10,
        z: 0,
        w: 100,
        h: 100,
        d: 18
      }))
      
      const { status } = await apiRequest('/designs', {
        method: 'POST',
        body: JSON.stringify({
          name: `Large Design ${Date.now()}`,
          designerId: users[0].id,
          width: 2000,
          height: 2000,
          depth: 600,
          material: 'Plywood',
          modelData: { parts: largeParts, version: 1 }
        })
      })
      
      expect(status).toBe(201)
    })

    test('STRESS010: Rapid endpoint switching', async () => {
      const endpoints = [
        '/users', '/designs', '/production/orders', '/inventory/parts',
        '/machines', '/quality/defects', '/schedule', '/customers',
        '/suppliers', '/health'
      ]
      
      const startTime = Date.now()
      
      for (let i = 0; i < 30; i++) {
        const endpoint = endpoints[i % endpoints.length]
        const { status } = await apiRequest(endpoint)
        expect(status).toBe(200)
      }
      
      const duration = Date.now() - startTime
      console.log(`30 rapid endpoint switches in ${duration}ms`)
      expect(duration).toBeLessThan(30000)
    })
  })

  // ==================== PERFORMANCE BENCHMARKS ====================
  describe('Performance Benchmarks', () => {
    
    test('PERF001: Response time benchmark - GET /users', async () => {
      const durations = []
      for (let i = 0; i < 5; i++) {
        const { duration } = await timedRequest('/users')
        durations.push(duration)
      }
      
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length
      const max = Math.max(...durations)
      const min = Math.min(...durations)
      
      console.log(`/users - Avg: ${avg}ms, Min: ${min}ms, Max: ${max}ms`)
      expect(avg).toBeLessThan(2000)
    })

    test('PERF002: Response time benchmark - GET /designs', async () => {
      const durations = []
      for (let i = 0; i < 5; i++) {
        const { duration } = await timedRequest('/designs')
        durations.push(duration)
      }
      
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length
      console.log(`/designs - Avg: ${avg}ms`)
      expect(avg).toBeLessThan(2000)
    })

    test('PERF003: Response time benchmark - GET /production/orders', async () => {
      const durations = []
      for (let i = 0; i < 5; i++) {
        const { duration } = await timedRequest('/production/orders')
        durations.push(duration)
      }
      
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length
      console.log(`/production/orders - Avg: ${avg}ms`)
      expect(avg).toBeLessThan(2000)
    })

    test('PERF004: Database connection pool stress', async () => {
      // Rapid sequential queries to stress connection pool
      const startTime = Date.now()
      
      for (let i = 0; i < 20; i++) {
        await User.count()
        await CabinetDesign.count()
        await ProductionOrder.count()
      }
      
      const duration = Date.now() - startTime
      console.log(`60 DB queries in ${duration}ms`)
      expect(duration).toBeLessThan(10000)
    })

    test('PERF005: API throughput test', async () => {
      const startTime = Date.now()
      const targetRequests = 50
      let completedRequests = 0
      
      const requests = Array(targetRequests).fill().map(async () => {
        const { status } = await apiRequest('/health')
        if (status === 200) completedRequests++
      })
      
      await Promise.all(requests)
      const duration = Date.now() - startTime
      const throughput = (completedRequests / duration) * 1000
      
      console.log(`Throughput: ${throughput.toFixed(2)} requests/second`)
      expect(completedRequests).toBe(targetRequests)
    })
  })
})
