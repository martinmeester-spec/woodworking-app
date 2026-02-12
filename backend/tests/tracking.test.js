import request from 'supertest'
import express from 'express'
import { jest } from '@jest/globals'

// Mock the models
jest.unstable_mockModule('../models/index.js', () => ({
  UserAction: {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
    findAll: jest.fn(),
    sequelize: { fn: jest.fn(), col: jest.fn() }
  },
  PartTracking: {
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn()
  },
  User: {}
}))

const { UserAction, PartTracking } = await import('../models/index.js')
const trackingRouter = (await import('../routes/tracking.js')).default

const app = express()
app.use(express.json())
app.use('/api/tracking', trackingRouter)

describe('Tracking API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/tracking/actions', () => {
    it('should log a user action', async () => {
      const actionData = {
        userId: 'user-123',
        userName: 'John Doe',
        action: 'Viewed dashboard',
        actionType: 'view',
        page: 'dashboard'
      }

      UserAction.create.mockResolvedValue({ id: 'action-1', ...actionData })

      const response = await request(app)
        .post('/api/tracking/actions')
        .send(actionData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(UserAction.create).toHaveBeenCalledWith(actionData)
    })
  })

  describe('GET /api/tracking/actions', () => {
    it('should return paginated actions', async () => {
      const mockActions = [
        { id: 'action-1', action: 'View', userName: 'John' },
        { id: 'action-2', action: 'Create', userName: 'Jane' }
      ]

      UserAction.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: mockActions
      })

      const response = await request(app)
        .get('/api/tracking/actions')

      expect(response.status).toBe(200)
      expect(response.body.actions).toHaveLength(2)
      expect(response.body.total).toBe(2)
    })

    it('should filter by action type', async () => {
      UserAction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })

      await request(app)
        .get('/api/tracking/actions?actionType=scan')

      expect(UserAction.findAndCountAll).toHaveBeenCalled()
    })
  })

  describe('POST /api/tracking/scan', () => {
    it('should scan a part at a station', async () => {
      const scanData = {
        partId: 'part-123',
        partName: 'Left Panel',
        station: 'wallsaw',
        scannedBy: 'user-123',
        scannedByName: 'John Doe'
      }

      PartTracking.findOne.mockResolvedValue(null)
      PartTracking.create.mockResolvedValue({ id: 'tracking-1', ...scanData })
      UserAction.create.mockResolvedValue({ id: 'action-1' })

      const response = await request(app)
        .post('/api/tracking/scan')
        .send(scanData)

      expect(response.status).toBe(201)
      expect(PartTracking.create).toHaveBeenCalled()
      expect(UserAction.create).toHaveBeenCalled()
    })

    it('should track previous station when moving parts', async () => {
      const scanData = {
        partId: 'part-123',
        station: 'cnc',
        scannedBy: 'user-123'
      }

      PartTracking.findOne.mockResolvedValue({ station: 'wallsaw' })
      PartTracking.create.mockResolvedValue({ id: 'tracking-2', ...scanData, previousStation: 'wallsaw' })
      UserAction.create.mockResolvedValue({ id: 'action-2' })

      const response = await request(app)
        .post('/api/tracking/scan')
        .send(scanData)

      expect(response.status).toBe(201)
      expect(PartTracking.create).toHaveBeenCalledWith(
        expect.objectContaining({ previousStation: 'wallsaw' })
      )
    })
  })

  describe('GET /api/tracking/parts/:partId/history', () => {
    it('should return part tracking history', async () => {
      const mockHistory = [
        { id: 'track-1', station: 'cnc', scanTime: new Date() },
        { id: 'track-2', station: 'wallsaw', scanTime: new Date() }
      ]

      PartTracking.findAll.mockResolvedValue(mockHistory)

      const response = await request(app)
        .get('/api/tracking/parts/part-123/history')

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(2)
    })
  })

  describe('GET /api/tracking/stations/:station/parts', () => {
    it('should return parts at a station', async () => {
      const mockParts = [
        { id: 'track-1', partId: 'part-1', station: 'wallsaw' },
        { id: 'track-2', partId: 'part-2', station: 'wallsaw' }
      ]

      PartTracking.findAll.mockResolvedValue(mockParts)

      const response = await request(app)
        .get('/api/tracking/stations/wallsaw/parts')

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(2)
    })
  })
})

describe('Production Floor Workflow Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Scenario: Complete production workflow for an order', () => {
    it('should track a part through all stations: wallsaw -> cnc -> banding -> packaging', async () => {
      const partId = 'part-order-001'
      const orderId = 'order-001'
      const operators = [
        { id: 'op-1', name: 'Operator 1' },
        { id: 'op-2', name: 'Operator 2' },
        { id: 'op-3', name: 'Operator 3' },
        { id: 'op-4', name: 'Operator 4' }
      ]

      // Step 1: Scan at Wallsaw
      PartTracking.findOne.mockResolvedValueOnce(null)
      PartTracking.create.mockResolvedValueOnce({ id: 'track-1', partId, station: 'wallsaw' })
      UserAction.create.mockResolvedValue({ id: 'action-1' })

      let response = await request(app)
        .post('/api/tracking/scan')
        .send({
          partId,
          partName: 'Cabinet Panel A',
          orderId,
          orderNumber: 'ORD-001',
          station: 'wallsaw',
          scannedBy: operators[0].id,
          scannedByName: operators[0].name
        })

      expect(response.status).toBe(201)

      // Step 2: Scan at CNC
      PartTracking.findOne.mockResolvedValueOnce({ station: 'wallsaw' })
      PartTracking.create.mockResolvedValueOnce({ id: 'track-2', partId, station: 'cnc', previousStation: 'wallsaw' })

      response = await request(app)
        .post('/api/tracking/scan')
        .send({
          partId,
          station: 'cnc',
          scannedBy: operators[1].id,
          scannedByName: operators[1].name
        })

      expect(response.status).toBe(201)

      // Step 3: Scan at Banding
      PartTracking.findOne.mockResolvedValueOnce({ station: 'cnc' })
      PartTracking.create.mockResolvedValueOnce({ id: 'track-3', partId, station: 'banding', previousStation: 'cnc' })

      response = await request(app)
        .post('/api/tracking/scan')
        .send({
          partId,
          station: 'banding',
          scannedBy: operators[2].id,
          scannedByName: operators[2].name
        })

      expect(response.status).toBe(201)

      // Step 4: Scan at Packaging
      PartTracking.findOne.mockResolvedValueOnce({ station: 'banding' })
      PartTracking.create.mockResolvedValueOnce({ id: 'track-4', partId, station: 'packaging', previousStation: 'banding' })

      response = await request(app)
        .post('/api/tracking/scan')
        .send({
          partId,
          station: 'packaging',
          scannedBy: operators[3].id,
          scannedByName: operators[3].name
        })

      expect(response.status).toBe(201)
    })
  })

  describe('Scenario: Part returns to CNC after banding', () => {
    it('should track a part going back to CNC: wallsaw -> cnc -> banding -> cnc -> packaging', async () => {
      const partId = 'part-rework-001'

      // Initial scan at wallsaw
      PartTracking.findOne.mockResolvedValueOnce(null)
      PartTracking.create.mockResolvedValueOnce({ id: 'track-1', partId, station: 'wallsaw' })
      UserAction.create.mockResolvedValue({ id: 'action-1' })

      await request(app)
        .post('/api/tracking/scan')
        .send({ partId, station: 'wallsaw', scannedBy: 'op-1', scannedByName: 'Op 1' })

      // Move to CNC
      PartTracking.findOne.mockResolvedValueOnce({ station: 'wallsaw' })
      PartTracking.create.mockResolvedValueOnce({ id: 'track-2', partId, station: 'cnc' })

      await request(app)
        .post('/api/tracking/scan')
        .send({ partId, station: 'cnc', scannedBy: 'op-2', scannedByName: 'Op 2' })

      // Move to Banding
      PartTracking.findOne.mockResolvedValueOnce({ station: 'cnc' })
      PartTracking.create.mockResolvedValueOnce({ id: 'track-3', partId, station: 'banding' })

      await request(app)
        .post('/api/tracking/scan')
        .send({ partId, station: 'banding', scannedBy: 'op-3', scannedByName: 'Op 3' })

      // Return to CNC (rework)
      PartTracking.findOne.mockResolvedValueOnce({ station: 'banding' })
      PartTracking.create.mockResolvedValueOnce({ id: 'track-4', partId, station: 'cnc', previousStation: 'banding' })

      const response = await request(app)
        .post('/api/tracking/scan')
        .send({ partId, station: 'cnc', scannedBy: 'op-2', scannedByName: 'Op 2', notes: 'Rework required' })

      expect(response.status).toBe(201)

      // Finally to Packaging
      PartTracking.findOne.mockResolvedValueOnce({ station: 'cnc' })
      PartTracking.create.mockResolvedValueOnce({ id: 'track-5', partId, station: 'packaging' })

      const finalResponse = await request(app)
        .post('/api/tracking/scan')
        .send({ partId, station: 'packaging', scannedBy: 'op-4', scannedByName: 'Op 4' })

      expect(finalResponse.status).toBe(201)
    })
  })

  describe('Scenario: Multiple operators working simultaneously', () => {
    it('should handle concurrent scans from different operators at different stations', async () => {
      UserAction.create.mockResolvedValue({ id: 'action-1' })

      // Operator 1 at Wallsaw
      PartTracking.findOne.mockResolvedValueOnce(null)
      PartTracking.create.mockResolvedValueOnce({ id: 'track-1', partId: 'part-A', station: 'wallsaw' })

      const scan1 = request(app)
        .post('/api/tracking/scan')
        .send({ partId: 'part-A', station: 'wallsaw', scannedBy: 'op-1', scannedByName: 'Operator 1' })

      // Operator 2 at CNC
      PartTracking.findOne.mockResolvedValueOnce({ station: 'wallsaw' })
      PartTracking.create.mockResolvedValueOnce({ id: 'track-2', partId: 'part-B', station: 'cnc' })

      const scan2 = request(app)
        .post('/api/tracking/scan')
        .send({ partId: 'part-B', station: 'cnc', scannedBy: 'op-2', scannedByName: 'Operator 2' })

      // Operator 3 at Banding
      PartTracking.findOne.mockResolvedValueOnce({ station: 'cnc' })
      PartTracking.create.mockResolvedValueOnce({ id: 'track-3', partId: 'part-C', station: 'banding' })

      const scan3 = request(app)
        .post('/api/tracking/scan')
        .send({ partId: 'part-C', station: 'banding', scannedBy: 'op-3', scannedByName: 'Operator 3' })

      const results = await Promise.all([scan1, scan2, scan3])

      results.forEach(result => {
        expect(result.status).toBe(201)
      })
    })
  })
})
