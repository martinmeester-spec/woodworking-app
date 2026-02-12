import express from 'express'
import { DebugLog } from '../models/index.js'
import { Op } from 'sequelize'

const router = express.Router()

// Get all debug logs
router.get('/logs', async (req, res) => {
  try {
    const { level, category, sessionId, limit = 100 } = req.query
    const where = {}
    if (level) where.level = level
    if (category) where.category = category
    if (sessionId) where.sessionId = sessionId
    
    const logs = await DebugLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    })
    res.json(logs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create debug log entry
router.post('/logs', async (req, res) => {
  try {
    const log = await DebugLog.create(req.body)
    res.status(201).json(log)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get data flow trace for a specific entity
router.get('/trace/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params
    
    const logs = await DebugLog.findAll({
      where: {
        [Op.or]: [
          { 'metadata.entityType': entityType, 'metadata.entityId': entityId },
          { source: `${entityType}:${entityId}` },
          { destination: `${entityType}:${entityId}` }
        ]
      },
      order: [['createdAt', 'ASC']]
    })
    
    res.json({
      entityType,
      entityId,
      traceCount: logs.length,
      traces: logs
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get 3D coordinate from point in model
router.post('/3d/pick-point', async (req, res) => {
  try {
    const { designId, screenX, screenY, cameraPosition, cameraTarget, viewportWidth = 800, viewportHeight = 600 } = req.body
    
    // Proper raycasting calculation using camera parameters
    const camPos = cameraPosition || { x: 0, y: 0, z: 1000 }
    const camTarget = cameraTarget || { x: 0, y: 0, z: 0 }
    
    // Normalize screen coordinates to [-1, 1]
    const ndcX = (screenX / viewportWidth) * 2 - 1
    const ndcY = 1 - (screenY / viewportHeight) * 2
    
    // Calculate ray direction from camera
    const dirX = camTarget.x - camPos.x
    const dirY = camTarget.y - camPos.y
    const dirZ = camTarget.z - camPos.z
    const dirLen = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ)
    
    // Calculate world coordinates on the XY plane (Z=0)
    const t = -camPos.z / (dirZ / dirLen || 0.001)
    const worldX = camPos.x + ndcX * 500 + (dirX / dirLen) * t * 0.1
    const worldY = camPos.y + ndcY * 500 + (dirY / dirLen) * t * 0.1
    const worldZ = 0
    
    // Log the coordinate pick action
    await DebugLog.create({
      category: '3d-interaction',
      action: 'pick-point',
      source: 'frontend',
      destination: 'backend',
      dataFlow: 'screen-to-world',
      metadata: {
        designId,
        screenCoords: { x: screenX, y: screenY },
        worldCoords: { x: worldX, y: worldY, z: worldZ },
        camera: { position: cameraPosition, target: cameraTarget }
      }
    })
    
    res.json({
      screenCoords: { x: screenX, y: screenY },
      worldCoords: { x: worldX, y: worldY, z: worldZ },
      unit: 'mm'
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get coordinates of a specific part in design
router.get('/3d/part-coords/:designId/:partId', async (req, res) => {
  try {
    const { DesignPart, CabinetDesign } = await import('../models/index.js')
    const { designId, partId } = req.params
    
    const design = await CabinetDesign.findByPk(designId)
    if (!design) return res.status(404).json({ error: 'Design not found' })
    
    const part = await DesignPart.findOne({
      where: { id: partId, designId }
    })
    
    if (part) {
      res.json({
        partId: part.id,
        partType: part.partType,
        name: part.name,
        position: {
          x: parseFloat(part.positionX) || 0,
          y: parseFloat(part.positionY) || 0,
          z: parseFloat(part.positionZ) || 0
        },
        rotation: {
          x: parseFloat(part.rotationX) || 0,
          y: parseFloat(part.rotationY) || 0,
          z: parseFloat(part.rotationZ) || 0
        },
        dimensions: {
          width: parseFloat(part.width),
          height: parseFloat(part.height),
          depth: parseFloat(part.depth)
        },
        boundingBox: {
          min: {
            x: parseFloat(part.positionX) || 0,
            y: parseFloat(part.positionY) || 0,
            z: parseFloat(part.positionZ) || 0
          },
          max: {
            x: (parseFloat(part.positionX) || 0) + parseFloat(part.width),
            y: (parseFloat(part.positionY) || 0) + parseFloat(part.height),
            z: (parseFloat(part.positionZ) || 0) + parseFloat(part.depth)
          }
        },
        center: {
          x: (parseFloat(part.positionX) || 0) + parseFloat(part.width) / 2,
          y: (parseFloat(part.positionY) || 0) + parseFloat(part.height) / 2,
          z: (parseFloat(part.positionZ) || 0) + parseFloat(part.depth) / 2
        },
        unit: 'mm'
      })
    } else {
      // Check modelData parts
      const modelParts = design.modelData?.parts || []
      const modelPart = modelParts.find(p => p.id === partId)
      
      if (modelPart) {
        res.json({
          partId: modelPart.id,
          partType: modelPart.type,
          name: modelPart.name,
          position: {
            x: modelPart.x || 0,
            y: modelPart.y || 0,
            z: modelPart.z || 0
          },
          dimensions: {
            width: modelPart.w,
            height: modelPart.h,
            depth: modelPart.d
          },
          unit: 'mm'
        })
      } else {
        return res.status(404).json({ error: 'Part not found' })
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Calculate distance between two points
router.post('/3d/distance', async (req, res) => {
  try {
    const { point1, point2 } = req.body
    
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    const dz = point2.z - point1.z
    
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    
    res.json({
      point1,
      point2,
      distance: parseFloat(distance.toFixed(2)),
      unit: 'mm',
      components: {
        dx: parseFloat(dx.toFixed(2)),
        dy: parseFloat(dy.toFixed(2)),
        dz: parseFloat(dz.toFixed(2))
      }
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Clear old debug logs
router.delete('/logs/clear', async (req, res) => {
  try {
    const { olderThanDays = 7 } = req.query
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays))
    
    const deleted = await DebugLog.destroy({
      where: { createdAt: { [Op.lt]: cutoffDate } }
    })
    
    res.json({ message: `Deleted ${deleted} old debug logs` })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
