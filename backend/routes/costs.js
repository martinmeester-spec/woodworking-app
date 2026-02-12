import express from 'express'
import { CostEstimate, CabinetDesign, DesignPart, InventoryPart } from '../models/index.js'

const router = express.Router()

// Get all cost estimates
router.get('/', async (req, res) => {
  try {
    const estimates = await CostEstimate.findAll({
      include: [{ model: CabinetDesign, as: 'design' }],
      order: [['createdAt', 'DESC']]
    })
    res.json(estimates)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get cost estimate by ID
router.get('/:id', async (req, res) => {
  try {
    const estimate = await CostEstimate.findByPk(req.params.id, {
      include: [{ model: CabinetDesign, as: 'design' }]
    })
    if (!estimate) {
      return res.status(404).json({ error: 'Cost estimate not found' })
    }
    res.json(estimate)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get cost estimate for a design
router.get('/design/:designId', async (req, res) => {
  try {
    const estimate = await CostEstimate.findOne({
      where: { designId: req.params.designId },
      include: [{ model: CabinetDesign, as: 'design' }]
    })
    res.json(estimate || null)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Calculate cost estimate for a design
router.post('/calculate/:designId', async (req, res) => {
  try {
    const design = await CabinetDesign.findByPk(req.params.designId)
    if (!design) {
      return res.status(404).json({ error: 'Design not found' })
    }

    // Get design parts
    const parts = await DesignPart.findAll({
      where: { designId: req.params.designId }
    })

    // Material cost calculation based on parts
    let materialCost = 0
    const materialBreakdown = []

    // Get material prices from inventory
    const materials = await InventoryPart.findAll({
      where: { category: 'Materials' }
    })
    const materialPrices = {}
    materials.forEach(m => {
      materialPrices[m.name.toLowerCase()] = parseFloat(m.unitPrice) || 50
    })

    // Calculate based on design dimensions and parts
    const width = parseFloat(design.width) || 600
    const height = parseFloat(design.height) || 800
    const depth = parseFloat(design.depth) || 400

    // Sheet material calculation (m²)
    const sheetArea = ((width * height * 2) + (width * depth * 2) + (height * depth * 2)) / 1000000
    const sheetPrice = materialPrices['mdf'] || materialPrices['plywood'] || 45
    const sheetCost = sheetArea * sheetPrice * 1.15 // 15% waste factor

    materialBreakdown.push({
      item: 'Sheet Material',
      quantity: sheetArea.toFixed(2),
      unit: 'm²',
      unitPrice: sheetPrice,
      total: sheetCost.toFixed(2)
    })

    // Edge banding (linear meters)
    const edgeLength = ((width + height) * 4 + (depth * 4)) / 1000
    const edgePrice = 2.50
    const edgeCost = edgeLength * edgePrice

    materialBreakdown.push({
      item: 'Edge Banding',
      quantity: edgeLength.toFixed(2),
      unit: 'm',
      unitPrice: edgePrice,
      total: edgeCost.toFixed(2)
    })

    // Hardware (hinges, handles, etc.)
    const hardwareCost = parts.length > 0 ? parts.length * 15 : 45
    materialBreakdown.push({
      item: 'Hardware (hinges, handles)',
      quantity: parts.length || 3,
      unit: 'sets',
      unitPrice: 15,
      total: hardwareCost.toFixed(2)
    })

    // Fasteners
    const fastenerCost = 12
    materialBreakdown.push({
      item: 'Fasteners & Screws',
      quantity: 1,
      unit: 'kit',
      unitPrice: 12,
      total: fastenerCost.toFixed(2)
    })

    materialCost = sheetCost + edgeCost + hardwareCost + fastenerCost

    // Labor cost calculation
    const laborHours = Math.ceil((sheetArea * 2) + 1.5) // Based on complexity
    const laborRate = 35 // EUR per hour
    const laborCost = laborHours * laborRate

    // Overhead cost (machine time, utilities, etc.)
    const overheadCost = materialCost * 0.15

    // Profit margin
    const profitMargin = req.body.profitMargin || 20
    const subtotal = materialCost + laborCost + overheadCost
    const profit = subtotal * (profitMargin / 100)
    const totalCost = subtotal + profit

    // Create or update cost estimate
    const [estimate, created] = await CostEstimate.findOrCreate({
      where: { designId: req.params.designId },
      defaults: {
        materialCost,
        laborCost,
        overheadCost,
        profitMargin,
        totalCost,
        currency: 'EUR',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        notes: JSON.stringify({
          materialBreakdown,
          laborHours,
          laborRate,
          designDimensions: { width, height, depth }
        })
      }
    })

    if (!created) {
      await estimate.update({
        materialCost,
        laborCost,
        overheadCost,
        profitMargin,
        totalCost,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: JSON.stringify({
          materialBreakdown,
          laborHours,
          laborRate,
          designDimensions: { width, height, depth }
        })
      })
    }

    res.json({
      estimate,
      breakdown: {
        materials: materialBreakdown,
        labor: { hours: laborHours, rate: laborRate, total: laborCost },
        overhead: overheadCost,
        profitMargin,
        profit,
        subtotal,
        total: totalCost
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create cost estimate
router.post('/', async (req, res) => {
  try {
    const estimate = await CostEstimate.create(req.body)
    res.status(201).json(estimate)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Update cost estimate
router.put('/:id', async (req, res) => {
  try {
    const estimate = await CostEstimate.findByPk(req.params.id)
    if (!estimate) {
      return res.status(404).json({ error: 'Cost estimate not found' })
    }
    await estimate.update(req.body)
    res.json(estimate)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Delete cost estimate
router.delete('/:id', async (req, res) => {
  try {
    const estimate = await CostEstimate.findByPk(req.params.id)
    if (!estimate) {
      return res.status(404).json({ error: 'Cost estimate not found' })
    }
    await estimate.destroy()
    res.json({ message: 'Cost estimate deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get material prices
router.get('/materials/prices', async (req, res) => {
  try {
    const materials = await InventoryPart.findAll({
      where: { category: 'Materials' },
      attributes: ['id', 'name', 'unitPrice', 'unit']
    })
    res.json(materials)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
