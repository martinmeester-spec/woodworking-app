import express from 'express'
import { PartProductionPlan, DesignPart } from '../models/index.js'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

// Get production plan for a specific part
router.get('/part/:partId', async (req, res) => {
  try {
    const { partId } = req.params
    let plan = await PartProductionPlan.findOne({ where: { partId } })
    
    if (!plan) {
      // Create default plan if none exists
      const part = await DesignPart.findByPk(partId)
      if (!part) {
        return res.status(404).json({ error: 'Part not found' })
      }
      
      plan = await createDefaultPlan(part)
    }
    
    res.json(plan)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all production plans for an order
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params
    const plans = await PartProductionPlan.findAll({ where: { orderId } })
    res.json(plans)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create or update production plan for a part
router.post('/part/:partId', async (req, res) => {
  try {
    const { partId } = req.params
    const { orderId, wallSawPlan, cncPlan, bandingPlan, packagingPlan } = req.body
    
    console.log('Saving production plan for part:', partId)
    console.log('Request body:', JSON.stringify(req.body, null, 2))
    
    let plan = await PartProductionPlan.findOne({ where: { partId } })
    
    if (plan) {
      // Update existing plan
      await plan.update({
        orderId: orderId || plan.orderId,
        wallSawPlan: wallSawPlan || plan.wallSawPlan,
        cncPlan: cncPlan || plan.cncPlan,
        bandingPlan: bandingPlan || plan.bandingPlan,
        packagingPlan: packagingPlan || plan.packagingPlan
      })
      console.log('Updated existing plan:', plan.id)
    } else {
      // Create new plan - partId can be any string identifier
      plan = await PartProductionPlan.create({
        partId,
        orderId: orderId || null,
        wallSawPlan: wallSawPlan || {},
        cncPlan: cncPlan || {},
        bandingPlan: bandingPlan || {},
        packagingPlan: packagingPlan || {}
      })
      console.log('Created new plan:', plan.id)
    }
    
    // Reload to get the full plan with defaults
    plan = await PartProductionPlan.findByPk(plan.id)
    res.json(plan)
  } catch (error) {
    console.error('Error saving production plan:', error)
    res.status(500).json({ error: error.message })
  }
})

// Generate default plans for all parts in an order
router.post('/generate/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params
    const { parts } = req.body // Array of parts with their details
    
    const plans = []
    
    // Group parts by material for slab optimization
    const partsByMaterial = {}
    parts.forEach(part => {
      const material = part.material || 'MDF 18mm'
      if (!partsByMaterial[material]) {
        partsByMaterial[material] = []
      }
      partsByMaterial[material].push(part)
    })
    
    // Create slabs and assign parts
    for (const material of Object.keys(partsByMaterial)) {
      const materialParts = partsByMaterial[material]
      const slabs = optimizeSlabLayout(materialParts, material)
      
      for (const slab of slabs) {
        for (const partPlacement of slab.parts) {
          const plan = await createPlanForPart(partPlacement.part, orderId, slab, partPlacement)
          plans.push(plan)
        }
      }
    }
    
    res.json({ message: `Generated ${plans.length} production plans`, plans })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get slab visualization data for wall saw
router.get('/slab/:slabId', async (req, res) => {
  try {
    const { slabId } = req.params
    const plans = await PartProductionPlan.findAll()
    
    // Find all parts on this slab
    const slabParts = plans.filter(p => 
      p.wallSawPlan && p.wallSawPlan.slabId === slabId
    )
    
    if (slabParts.length === 0) {
      return res.status(404).json({ error: 'Slab not found' })
    }
    
    const slabData = {
      slabId,
      material: slabParts[0].wallSawPlan.slabMaterial,
      width: slabParts[0].wallSawPlan.slabWidth,
      height: slabParts[0].wallSawPlan.slabHeight,
      parts: slabParts.map(p => ({
        partId: p.partId,
        x: p.wallSawPlan.positionX,
        y: p.wallSawPlan.positionY,
        width: p.wallSawPlan.partWidth,
        height: p.wallSawPlan.partHeight,
        cutSequence: p.wallSawPlan.cutSequence
      }))
    }
    
    res.json(slabData)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Helper function to create default plan for a part
async function createDefaultPlan(part) {
  const slabId = uuidv4()
  
  // Determine which edges need banding based on part type
  const bandingEdges = determineBandingEdges(part)
  
  // Generate default G-code for CNC
  const gcode = generateDefaultGCode(part)
  
  const plan = await PartProductionPlan.create({
    partId: part.id,
    wallSawPlan: {
      slabId,
      slabMaterial: part.material || 'MDF 18mm',
      slabWidth: 2800,
      slabHeight: 2070,
      positionX: 10,
      positionY: 10,
      partWidth: parseFloat(part.width),
      partHeight: parseFloat(part.height),
      cutSequence: 1,
      otherParts: []
    },
    cncPlan: {
      programId: `CNC-${part.id.substring(0, 8)}`,
      gcode,
      toolChanges: ['T1 - 6mm End Mill', 'T2 - 5mm Drill'],
      estimatedTime: calculateCNCTime(part),
      drillHoles: part.drilling || [],
      routingPaths: [],
      pocketOperations: []
    },
    bandingPlan: {
      bandingSequence: bandingEdges.sequence,
      bandingMaterial: 'ABS 2mm',
      bandingColor: part.color || 'White',
      edges: bandingEdges.edges
    },
    packagingPlan: {
      packageGroup: null,
      protectionType: 'Standard',
      labelPosition: 'Top',
      specialInstructions: ''
    }
  })
  
  return plan
}

// Helper function to create plan for a part with slab placement
async function createPlanForPart(part, orderId, slab, placement) {
  const bandingEdges = determineBandingEdges(part)
  const gcode = generateDefaultGCode(part)
  
  const plan = await PartProductionPlan.create({
    partId: part.id,
    orderId,
    wallSawPlan: {
      slabId: slab.id,
      slabMaterial: slab.material,
      slabWidth: slab.width,
      slabHeight: slab.height,
      positionX: placement.x,
      positionY: placement.y,
      partWidth: parseFloat(part.width),
      partHeight: parseFloat(part.height),
      cutSequence: placement.sequence,
      otherParts: slab.parts.filter(p => p.part.id !== part.id).map(p => ({
        partId: p.part.id,
        name: p.part.name,
        x: p.x,
        y: p.y,
        width: parseFloat(p.part.width),
        height: parseFloat(p.part.height)
      }))
    },
    cncPlan: {
      programId: `CNC-${part.id.substring(0, 8)}`,
      gcode,
      toolChanges: ['T1 - 6mm End Mill', 'T2 - 5mm Drill'],
      estimatedTime: calculateCNCTime(part),
      drillHoles: part.drilling || [],
      routingPaths: [],
      pocketOperations: []
    },
    bandingPlan: {
      bandingSequence: bandingEdges.sequence,
      bandingMaterial: 'ABS 2mm',
      bandingColor: part.color || 'White',
      edges: bandingEdges.edges
    },
    packagingPlan: {
      packageGroup: orderId,
      protectionType: 'Standard',
      labelPosition: 'Top',
      specialInstructions: ''
    }
  })
  
  return plan
}

// Simple bin-packing algorithm for slab optimization
function optimizeSlabLayout(parts, material) {
  const SLAB_WIDTH = 2800
  const SLAB_HEIGHT = 2070
  const KERF = 4 // Saw blade width
  const MARGIN = 10
  
  const slabs = []
  let currentSlab = {
    id: uuidv4(),
    material,
    width: SLAB_WIDTH,
    height: SLAB_HEIGHT,
    parts: [],
    freeRects: [{ x: MARGIN, y: MARGIN, w: SLAB_WIDTH - 2 * MARGIN, h: SLAB_HEIGHT - 2 * MARGIN }]
  }
  
  // Sort parts by area (largest first)
  const sortedParts = [...parts].sort((a, b) => 
    (parseFloat(b.width) * parseFloat(b.height)) - (parseFloat(a.width) * parseFloat(a.height))
  )
  
  let sequence = 1
  
  for (const part of sortedParts) {
    const partW = parseFloat(part.width) + KERF
    const partH = parseFloat(part.height) + KERF
    
    // Try to fit in current slab
    let placed = false
    for (let i = 0; i < currentSlab.freeRects.length; i++) {
      const rect = currentSlab.freeRects[i]
      if (rect.w >= partW && rect.h >= partH) {
        // Place part
        currentSlab.parts.push({
          part,
          x: rect.x,
          y: rect.y,
          sequence: sequence++
        })
        
        // Split remaining space
        currentSlab.freeRects.splice(i, 1)
        if (rect.w - partW > MARGIN) {
          currentSlab.freeRects.push({
            x: rect.x + partW,
            y: rect.y,
            w: rect.w - partW,
            h: partH
          })
        }
        if (rect.h - partH > MARGIN) {
          currentSlab.freeRects.push({
            x: rect.x,
            y: rect.y + partH,
            w: rect.w,
            h: rect.h - partH
          })
        }
        
        placed = true
        break
      }
    }
    
    if (!placed) {
      // Start new slab
      slabs.push(currentSlab)
      currentSlab = {
        id: uuidv4(),
        material,
        width: SLAB_WIDTH,
        height: SLAB_HEIGHT,
        parts: [],
        freeRects: [{ x: MARGIN, y: MARGIN, w: SLAB_WIDTH - 2 * MARGIN, h: SLAB_HEIGHT - 2 * MARGIN }]
      }
      sequence = 1
      
      // Place on new slab
      currentSlab.parts.push({
        part,
        x: MARGIN,
        y: MARGIN,
        sequence: sequence++
      })
      
      currentSlab.freeRects = [
        { x: MARGIN + partW, y: MARGIN, w: SLAB_WIDTH - 2 * MARGIN - partW, h: partH },
        { x: MARGIN, y: MARGIN + partH, w: SLAB_WIDTH - 2 * MARGIN, h: SLAB_HEIGHT - 2 * MARGIN - partH }
      ]
    }
  }
  
  if (currentSlab.parts.length > 0) {
    slabs.push(currentSlab)
  }
  
  return slabs
}

// Determine which edges need banding based on part type
function determineBandingEdges(part) {
  const partType = (part.partType || part.name || '').toLowerCase()
  
  // Default: all visible edges get banding
  let edges = {
    top: { band: true, order: 1 },
    bottom: { band: true, order: 2 },
    left: { band: true, order: 3 },
    right: { band: true, order: 4 }
  }
  
  // Customize based on part type
  if (partType.includes('back')) {
    // Back panels typically don't need banding
    edges = {
      top: { band: false, order: 0 },
      bottom: { band: false, order: 0 },
      left: { band: false, order: 0 },
      right: { band: false, order: 0 }
    }
  } else if (partType.includes('shelf')) {
    // Shelves only need front edge banded
    edges = {
      top: { band: true, order: 1 },
      bottom: { band: false, order: 0 },
      left: { band: false, order: 0 },
      right: { band: false, order: 0 }
    }
  } else if (partType.includes('side') || partType.includes('left') || partType.includes('right')) {
    // Side panels need front and top/bottom edges
    edges = {
      top: { band: true, order: 1 },
      bottom: { band: true, order: 2 },
      left: { band: true, order: 3 },
      right: { band: false, order: 0 }
    }
  }
  
  // Build sequence array
  const sequence = Object.entries(edges)
    .filter(([_, v]) => v.band)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([edge]) => edge)
  
  return { edges, sequence }
}

// Generate default G-code for a part
function generateDefaultGCode(part) {
  const w = parseFloat(part.width)
  const h = parseFloat(part.height)
  const d = parseFloat(part.depth) || parseFloat(part.thickness) || 18
  
  let gcode = `; Part: ${part.name || 'Unknown'}\n`
  gcode += `; Dimensions: ${w} x ${h} x ${d}mm\n`
  gcode += `; Generated: ${new Date().toISOString()}\n\n`
  gcode += `G21 ; Set units to mm\n`
  gcode += `G90 ; Absolute positioning\n`
  gcode += `G17 ; XY plane selection\n\n`
  gcode += `; Tool change - 6mm End Mill\n`
  gcode += `T1 M6\n`
  gcode += `S18000 M3 ; Spindle on\n\n`
  gcode += `; Perimeter cut\n`
  gcode += `G0 X0 Y0 Z5\n`
  gcode += `G1 Z-${d} F1000\n`
  gcode += `G1 X${w} F3000\n`
  gcode += `G1 Y${h}\n`
  gcode += `G1 X0\n`
  gcode += `G1 Y0\n`
  gcode += `G0 Z5\n\n`
  
  // Add drilling operations if specified
  if (part.drilling && part.drilling.length > 0) {
    gcode += `; Tool change - 5mm Drill\n`
    gcode += `T2 M6\n`
    gcode += `S12000 M3\n\n`
    gcode += `; Drilling operations\n`
    part.drilling.forEach((hole, i) => {
      gcode += `; Hole ${i + 1}\n`
      gcode += `G0 X${hole.x} Y${hole.y} Z5\n`
      gcode += `G1 Z-${hole.depth || 12} F500\n`
      gcode += `G0 Z5\n`
    })
  }
  
  gcode += `\nM5 ; Spindle off\n`
  gcode += `G0 X0 Y0 Z50 ; Return home\n`
  gcode += `M30 ; Program end\n`
  
  return gcode
}

// Calculate estimated CNC time in minutes
function calculateCNCTime(part) {
  const w = parseFloat(part.width)
  const h = parseFloat(part.height)
  const perimeter = 2 * (w + h)
  const drillCount = (part.drilling || []).length
  
  // Rough estimate: 3m/min feed rate for perimeter, 5 sec per hole
  const perimeterTime = perimeter / 3000
  const drillTime = drillCount * (5 / 60)
  const toolChangeTime = drillCount > 0 ? 0.5 : 0
  
  return Math.ceil((perimeterTime + drillTime + toolChangeTime) * 10) / 10
}

export default router
