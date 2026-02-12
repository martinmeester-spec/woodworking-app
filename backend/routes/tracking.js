import express from 'express'
import { Op } from 'sequelize'
import QRCode from 'qrcode'
import { UserAction, PartTracking, User, ProductionOrder, InventoryPart, CabinetDesign } from '../models/index.js'

const router = express.Router()

// Station order for determining order progress
const STATION_ORDER = ['wallsaw', 'cnc', 'banding', 'packaging', 'complete']
const STATION_TO_STATUS = {
  'wallsaw': 'Cutting',
  'cnc': 'Drilling',
  'banding': 'Edge Banding',
  'packaging': 'Assembly',
  'complete': 'Completed'
}

// Log a user action
router.post('/actions', async (req, res) => {
  try {
    const action = await UserAction.create(req.body)
    res.status(201).json(action)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get all user actions with filtering and pagination
router.get('/actions', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      userId, 
      actionType, 
      entityType, 
      station,
      startDate, 
      endDate,
      search 
    } = req.query

    const where = {}
    
    if (userId) where.userId = userId
    if (actionType) where.actionType = actionType
    if (entityType) where.entityType = entityType
    if (station) where.station = station
    
    if (startDate || endDate) {
      where.created_at = {}
      if (startDate) where.created_at[Op.gte] = new Date(startDate)
      if (endDate) where.created_at[Op.lte] = new Date(endDate)
    }
    
    if (search) {
      where[Op.or] = [
        { action: { [Op.iLike]: `%${search}%` } },
        { entityName: { [Op.iLike]: `%${search}%` } },
        { userName: { [Op.iLike]: `%${search}%` } }
      ]
    }

    const { count, rows } = await UserAction.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    })

    res.json({
      actions: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get action statistics
router.get('/actions/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const where = {}
    
    if (startDate || endDate) {
      where.created_at = {}
      if (startDate) where.created_at[Op.gte] = new Date(startDate)
      if (endDate) where.created_at[Op.lte] = new Date(endDate)
    }

    const totalActions = await UserAction.count({ where })
    
    const actionsByType = await UserAction.findAll({
      where,
      attributes: ['actionType', [UserAction.sequelize.fn('COUNT', '*'), 'count']],
      group: ['actionType']
    })
    
    const actionsByUser = await UserAction.findAll({
      where,
      attributes: ['userName', [UserAction.sequelize.fn('COUNT', '*'), 'count']],
      group: ['userName'],
      order: [[UserAction.sequelize.fn('COUNT', '*'), 'DESC']],
      limit: 10
    })
    
    const actionsByStation = await UserAction.findAll({
      where: { ...where, station: { [Op.ne]: null } },
      attributes: ['station', [UserAction.sequelize.fn('COUNT', '*'), 'count']],
      group: ['station']
    })

    res.json({
      totalActions,
      actionsByType,
      actionsByUser,
      actionsByStation
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Scan a part at a station
router.post('/scan', async (req, res) => {
  try {
    const { partId, partName, orderId, orderNumber, station, scannedBy, scannedByName, barcode, notes } = req.body
    
    // Get the last tracking record for this part to determine previous station
    const lastTracking = await PartTracking.findOne({
      where: { partId },
      order: [['scan_time', 'DESC']]
    })
    
    // Validate UUID format
    const isValidUUID = (str) => {
      if (!str) return false
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      return uuidRegex.test(str)
    }
    
    // Sanitize UUID fields - use null if not valid UUID
    const validOrderId = isValidUUID(orderId) ? orderId : (lastTracking?.orderId || null)
    const validScannedBy = isValidUUID(scannedBy) ? scannedBy : null
    
    // Check inventory when scanning at wallsaw station
    if (station === 'wallsaw') {
      try {
        // Get the order to find the design and material
        let material = 'Plywood' // Default material
        if (validOrderId) {
          const order = await ProductionOrder.findByPk(validOrderId)
          if (order?.designId) {
            const design = await CabinetDesign.findByPk(order.designId)
            if (design?.material) {
              material = design.material
            }
          }
        }
        
        // Find matching inventory item (slab/sheet material)
        const inventoryItem = await InventoryPart.findOne({
          where: {
            [Op.or]: [
              { name: { [Op.iLike]: `%${material}%` } },
              { category: 'Materials' }
            ],
            quantity: { [Op.gt]: 0 }
          },
          order: [['quantity', 'DESC']]
        })
        
        if (!inventoryItem) {
          return res.status(400).json({ 
            error: `No ${material} slabs available in inventory. Please restock before cutting.`,
            inventoryError: true
          })
        }
        
        // Deduct from inventory (1 unit per part cut)
        await inventoryItem.update({
          quantity: inventoryItem.quantity - 1,
          status: inventoryItem.quantity - 1 <= 0 ? 'Out of Stock' : 
                  inventoryItem.quantity - 1 <= inventoryItem.minQuantity ? 'Low Stock' : 'In Stock'
        })
        
        console.log(`Inventory deducted: ${inventoryItem.name} now has ${inventoryItem.quantity - 1} units`)
      } catch (invError) {
        console.warn('Inventory check warning:', invError.message)
        // Continue with scan even if inventory check fails
      }
    }
    
    const tracking = await PartTracking.create({
      partId,
      partName,
      orderId: validOrderId,
      orderNumber: orderNumber || lastTracking?.orderNumber || null,
      station,
      previousStation: lastTracking?.station || null,
      scannedBy: scannedBy || 'system',
      scannedByName,
      barcode,
      notes,
      status: 'arrived'
    })
    
    // Also log this as a user action (skip UUID fields that aren't valid)
    await UserAction.create({
      userId: validScannedBy,
      userName: scannedByName,
      action: `Scanned part at ${station}`,
      actionType: 'scan',
      entityType: 'part',
      entityId: null, // partId is not a UUID, store in details instead
      entityName: partName,
      station,
      previousStation: lastTracking?.station || null,
      details: { partId, orderId: validOrderId, orderNumber, barcode }
    })
    
    // Update order status based on the minimum station all parts have reached
    if (validOrderId) {
      try {
        // Get all parts for this order
        const allOrderParts = await PartTracking.findAll({
          where: { orderId: validOrderId },
          order: [['scan_time', 'DESC']]
        })
        
        // Group by partId and get latest station for each
        const latestByPart = {}
        for (const record of allOrderParts) {
          if (!latestByPart[record.partId]) {
            latestByPart[record.partId] = record.station
          }
        }
        
        // Find the minimum station index (the furthest all parts have reached)
        const partStations = Object.values(latestByPart)
        if (partStations.length > 0) {
          const minStationIndex = Math.min(...partStations.map(s => STATION_ORDER.indexOf(s)))
          const minStation = STATION_ORDER[minStationIndex]
          const newStatus = STATION_TO_STATUS[minStation] || 'In Progress'
          
          // Update the order status
          await ProductionOrder.update(
            { status: newStatus },
            { where: { id: validOrderId } }
          )
        }
      } catch (orderUpdateError) {
        console.warn('Could not update order status:', orderUpdateError.message)
      }
    }
    
    res.status(201).json(tracking)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get part tracking history
router.get('/parts/:partId/history', async (req, res) => {
  try {
    const history = await PartTracking.findAll({
      where: { partId: req.params.partId },
      order: [['scan_time', 'DESC']]
    })
    res.json(history)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all parts at a specific station
router.get('/stations/:station/parts', async (req, res) => {
  try {
    // Get ALL tracking records to find parts whose LATEST record is at this station
    const allParts = await PartTracking.findAll({
      order: [['scan_time', 'DESC']]
    })
    
    // Group by partId and get the latest record for each
    const latestByPart = {}
    for (const part of allParts) {
      if (!latestByPart[part.partId]) {
        latestByPart[part.partId] = part
      }
    }
    
    // Filter to only show parts whose latest record is at the requested station
    const partsAtStation = Object.values(latestByPart).filter(
      part => part.station === req.params.station
    )
    
    res.json(partsAtStation)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get order tracking summary
router.get('/orders/:orderId/tracking', async (req, res) => {
  try {
    const tracking = await PartTracking.findAll({
      where: { orderId: req.params.orderId },
      order: [['scan_time', 'DESC']]
    })
    
    // Group by part and get current station for each
    const partStatus = {}
    for (const record of tracking) {
      if (!partStatus[record.partId]) {
        partStatus[record.partId] = {
          partId: record.partId,
          partName: record.partName,
          currentStation: record.station,
          lastScan: record.scanTime,
          history: []
        }
      }
      partStatus[record.partId].history.push(record)
    }
    
    res.json(Object.values(partStatus))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update part status at station
router.put('/parts/:trackingId/status', async (req, res) => {
  try {
    const tracking = await PartTracking.findByPk(req.params.trackingId)
    if (!tracking) return res.status(404).json({ error: 'Tracking record not found' })
    
    await tracking.update(req.body)
    res.json(tracking)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Seed sample parts for production floor
router.post('/seed-parts', async (req, res) => {
  try {
    const sampleParts = [
      { partId: 'PNL-001', partName: 'Cabinet Side Panel A', station: 'wallsaw', orderId: 'ORD-001', scannedBy: 'system', scannedByName: 'System Seed' },
      { partId: 'PNL-002', partName: 'Cabinet Side Panel B', station: 'wallsaw', orderId: 'ORD-001', scannedBy: 'system', scannedByName: 'System Seed' },
      { partId: 'PNL-003', partName: 'Cabinet Top Panel', station: 'cnc', orderId: 'ORD-001', scannedBy: 'system', scannedByName: 'System Seed' },
      { partId: 'PNL-004', partName: 'Cabinet Bottom Panel', station: 'cnc', orderId: 'ORD-001', scannedBy: 'system', scannedByName: 'System Seed' },
      { partId: 'PNL-005', partName: 'Drawer Front', station: 'banding', orderId: 'ORD-002', scannedBy: 'system', scannedByName: 'System Seed' },
      { partId: 'PNL-006', partName: 'Drawer Side Left', station: 'banding', orderId: 'ORD-002', scannedBy: 'system', scannedByName: 'System Seed' },
      { partId: 'PNL-007', partName: 'Drawer Side Right', station: 'packaging', orderId: 'ORD-002', scannedBy: 'system', scannedByName: 'System Seed' },
      { partId: 'PNL-008', partName: 'Shelf Panel 1', station: 'wallsaw', orderId: 'ORD-003', scannedBy: 'system', scannedByName: 'System Seed' },
      { partId: 'PNL-009', partName: 'Shelf Panel 2', station: 'wallsaw', orderId: 'ORD-003', scannedBy: 'system', scannedByName: 'System Seed' },
      { partId: 'PNL-010', partName: 'Back Panel', station: 'cnc', orderId: 'ORD-003', scannedBy: 'system', scannedByName: 'System Seed' }
    ]
    
    const created = []
    for (const part of sampleParts) {
      const existing = await PartTracking.findOne({ where: { partId: part.partId, station: part.station } })
      if (!existing) {
        const record = await PartTracking.create({
          ...part,
          scanTime: new Date(),
          barcode: part.partId
        })
        created.push(record)
      }
    }
    
    res.json({ message: `Seeded ${created.length} parts`, parts: created })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Generate QR code for a part - uses same format as design parts for consistency
router.get('/parts/:partId/qrcode', async (req, res) => {
  try {
    const { partId } = req.params
    
    // Get the latest tracking record for this part
    const tracking = await PartTracking.findOne({
      where: { partId },
      order: [['scan_time', 'DESC']]
    })
    
    // Generate QR code data - same format as design parts QR codes
    const qrData = JSON.stringify({
      partId,
      designId: tracking?.orderId || null,
      partType: tracking?.partName || partId,
      name: tracking?.partName || partId,
      dimensions: tracking?.notes?.replace('Dimensions: ', '') || 'N/A',
      orderNumber: tracking?.orderNumber || null
    })
    
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 150, margin: 1 })
    
    res.json({ 
      partId,
      qrCode: qrCodeDataUrl,
      partName: tracking?.partName,
      orderNumber: tracking?.orderNumber
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
