import express from 'express'
import QRCode from 'qrcode'
import { CabinetDesign, DesignTemplate, User, DesignVersion, CostEstimate, DesignPart } from '../models/index.js'

const router = express.Router()

// Seed design templates with examples
router.post('/templates/seed', async (req, res) => {
  try {
    const defaultTemplates = [
      {
        templateName: 'Base Cabinet',
        category: 'Kitchen',
        baseWidth: 600,
        baseHeight: 720,
        baseDepth: 560,
        baseMaterial: 'Oak',
        modelTemplate: {
          parts: [
            { type: 'leftPanel', x: 0, y: 0, z: 0, w: 18, h: 720, d: 560 },
            { type: 'rightPanel', x: 582, y: 0, z: 0, w: 18, h: 720, d: 560 },
            { type: 'bottomPanel', x: 18, y: 0, z: 0, w: 564, h: 18, d: 560 },
            { type: 'backPanel', x: 18, y: 18, z: 554, w: 564, h: 684, d: 6 },
            { type: 'shelf', x: 18, y: 360, z: 10, w: 564, h: 18, d: 540 }
          ]
        }
      },
      {
        templateName: 'Wall Cabinet',
        category: 'Kitchen',
        baseWidth: 600,
        baseHeight: 400,
        baseDepth: 300,
        baseMaterial: 'Oak',
        modelTemplate: {
          parts: [
            { type: 'leftPanel', x: 0, y: 0, z: 0, w: 18, h: 400, d: 300 },
            { type: 'rightPanel', x: 582, y: 0, z: 0, w: 18, h: 400, d: 300 },
            { type: 'topPanel', x: 18, y: 382, z: 0, w: 564, h: 18, d: 300 },
            { type: 'bottomPanel', x: 18, y: 0, z: 0, w: 564, h: 18, d: 300 },
            { type: 'backPanel', x: 18, y: 18, z: 294, w: 564, h: 364, d: 6 }
          ]
        }
      },
      {
        templateName: 'Tall Pantry Cabinet',
        category: 'Kitchen',
        baseWidth: 600,
        baseHeight: 2100,
        baseDepth: 560,
        baseMaterial: 'Oak',
        modelTemplate: {
          parts: [
            { type: 'leftPanel', x: 0, y: 0, z: 0, w: 18, h: 2100, d: 560 },
            { type: 'rightPanel', x: 582, y: 0, z: 0, w: 18, h: 2100, d: 560 },
            { type: 'topPanel', x: 18, y: 2082, z: 0, w: 564, h: 18, d: 560 },
            { type: 'bottomPanel', x: 18, y: 0, z: 0, w: 564, h: 18, d: 560 },
            { type: 'backPanel', x: 18, y: 18, z: 554, w: 564, h: 2064, d: 6 },
            { type: 'shelf', x: 18, y: 500, z: 10, w: 564, h: 18, d: 540 },
            { type: 'shelf', x: 18, y: 1000, z: 10, w: 564, h: 18, d: 540 },
            { type: 'shelf', x: 18, y: 1500, z: 10, w: 564, h: 18, d: 540 }
          ]
        }
      },
      {
        templateName: 'Drawer Unit',
        category: 'Kitchen',
        baseWidth: 450,
        baseHeight: 720,
        baseDepth: 560,
        baseMaterial: 'Oak',
        modelTemplate: {
          parts: [
            { type: 'leftPanel', x: 0, y: 0, z: 0, w: 18, h: 720, d: 560 },
            { type: 'rightPanel', x: 432, y: 0, z: 0, w: 18, h: 720, d: 560 },
            { type: 'bottomPanel', x: 18, y: 0, z: 0, w: 414, h: 18, d: 560 },
            { type: 'backPanel', x: 18, y: 18, z: 554, w: 414, h: 684, d: 6 },
            { type: 'drawer', x: 18, y: 540, z: 20, w: 414, h: 150, d: 500 },
            { type: 'drawer', x: 18, y: 360, z: 20, w: 414, h: 150, d: 500 },
            { type: 'drawer', x: 18, y: 180, z: 20, w: 414, h: 150, d: 500 },
            { type: 'drawer', x: 18, y: 0, z: 20, w: 414, h: 150, d: 500 }
          ]
        }
      },
      {
        templateName: 'Corner Cabinet',
        category: 'Kitchen',
        baseWidth: 900,
        baseHeight: 720,
        baseDepth: 900,
        baseMaterial: 'Oak',
        modelTemplate: {
          parts: [
            { type: 'leftPanel', x: 0, y: 0, z: 0, w: 18, h: 720, d: 900 },
            { type: 'rightPanel', x: 882, y: 0, z: 0, w: 18, h: 720, d: 300 },
            { type: 'bottomPanel', x: 18, y: 0, z: 0, w: 864, h: 18, d: 882 },
            { type: 'backPanel', x: 18, y: 18, z: 894, w: 864, h: 684, d: 6 }
          ]
        }
      },
      {
        templateName: 'Bathroom Vanity',
        category: 'Bathroom',
        baseWidth: 800,
        baseHeight: 850,
        baseDepth: 500,
        baseMaterial: 'MDF',
        modelTemplate: {
          parts: [
            { type: 'leftPanel', x: 0, y: 0, z: 0, w: 18, h: 850, d: 500 },
            { type: 'rightPanel', x: 782, y: 0, z: 0, w: 18, h: 850, d: 500 },
            { type: 'bottomPanel', x: 18, y: 100, z: 0, w: 764, h: 18, d: 500 },
            { type: 'backPanel', x: 18, y: 118, z: 494, w: 764, h: 714, d: 6 },
            { type: 'door', x: 18, y: 102, z: -20, w: 380, h: 730, d: 18 },
            { type: 'door', x: 402, y: 102, z: -20, w: 380, h: 730, d: 18 }
          ]
        }
      },
      {
        templateName: 'Bookshelf',
        category: 'Living Room',
        baseWidth: 800,
        baseHeight: 1800,
        baseDepth: 300,
        baseMaterial: 'Walnut',
        modelTemplate: {
          parts: [
            { type: 'leftPanel', x: 0, y: 0, z: 0, w: 18, h: 1800, d: 300 },
            { type: 'rightPanel', x: 782, y: 0, z: 0, w: 18, h: 1800, d: 300 },
            { type: 'topPanel', x: 18, y: 1782, z: 0, w: 764, h: 18, d: 300 },
            { type: 'bottomPanel', x: 18, y: 0, z: 0, w: 764, h: 18, d: 300 },
            { type: 'backPanel', x: 18, y: 18, z: 294, w: 764, h: 1764, d: 6 },
            { type: 'shelf', x: 18, y: 350, z: 10, w: 764, h: 18, d: 280 },
            { type: 'shelf', x: 18, y: 700, z: 10, w: 764, h: 18, d: 280 },
            { type: 'shelf', x: 18, y: 1050, z: 10, w: 764, h: 18, d: 280 },
            { type: 'shelf', x: 18, y: 1400, z: 10, w: 764, h: 18, d: 280 }
          ]
        }
      },
      {
        templateName: 'TV Stand',
        category: 'Living Room',
        baseWidth: 1500,
        baseHeight: 500,
        baseDepth: 450,
        baseMaterial: 'Walnut',
        modelTemplate: {
          parts: [
            { type: 'leftPanel', x: 0, y: 0, z: 0, w: 18, h: 500, d: 450 },
            { type: 'rightPanel', x: 1482, y: 0, z: 0, w: 18, h: 500, d: 450 },
            { type: 'topPanel', x: 18, y: 482, z: 0, w: 1464, h: 18, d: 450 },
            { type: 'bottomPanel', x: 18, y: 0, z: 0, w: 1464, h: 18, d: 450 },
            { type: 'backPanel', x: 18, y: 18, z: 444, w: 1464, h: 464, d: 6 },
            { type: 'shelf', x: 18, y: 240, z: 10, w: 480, h: 18, d: 430 },
            { type: 'shelf', x: 1002, y: 240, z: 10, w: 480, h: 18, d: 430 }
          ]
        }
      }
    ]

    for (const template of defaultTemplates) {
      await DesignTemplate.findOrCreate({
        where: { templateName: template.templateName },
        defaults: template
      })
    }

    const templates = await DesignTemplate.findAll({ order: [['templateName', 'ASC']] })
    res.json({ message: 'Templates seeded successfully', count: templates.length, templates })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await DesignTemplate.findAll({
      order: [['templateName', 'ASC']]
    })
    res.json(templates)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all designs
router.get('/', async (req, res) => {
  try {
    const designs = await CabinetDesign.findAll({
      include: [
        { model: User, as: 'designer', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: DesignTemplate, as: 'template', attributes: ['id', 'templateName', 'category'] }
      ],
      order: [['created_at', 'DESC']]
    })
    res.json(designs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get design by ID
router.get('/:id', async (req, res) => {
  try {
    const design = await CabinetDesign.findByPk(req.params.id, {
      include: [
        { model: User, as: 'designer', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: DesignTemplate, as: 'template' }
      ]
    })
    if (!design) return res.status(404).json({ error: 'Design not found' })
    res.json(design)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create design
router.post('/', async (req, res) => {
  try {
    const designData = { ...req.body }
    
    // Validate designerId - if invalid, find a valid user
    if (designData.designerId) {
      const userExists = await User.findByPk(designData.designerId)
      if (!userExists) {
        // Find any valid user as fallback
        const fallbackUser = await User.findOne()
        if (fallbackUser) {
          designData.designerId = fallbackUser.id
        } else {
          delete designData.designerId // Remove if no users exist
        }
      }
    }
    
    const design = await CabinetDesign.create(designData)
    res.status(201).json(design)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Update design
router.put('/:id', async (req, res) => {
  try {
    const design = await CabinetDesign.findByPk(req.params.id)
    if (!design) return res.status(404).json({ error: 'Design not found' })
    await design.update(req.body)
    res.json(design)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Delete design
router.delete('/:id', async (req, res) => {
  try {
    const design = await CabinetDesign.findByPk(req.params.id)
    if (!design) return res.status(404).json({ error: 'Design not found' })
    await design.destroy()
    res.json({ message: 'Design deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all templates
router.get('/templates/all', async (req, res) => {
  try {
    const templates = await DesignTemplate.findAll({ order: [['template_name', 'ASC']] })
    res.json(templates)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get design versions
router.get('/:id/versions', async (req, res) => {
  try {
    const versions = await DesignVersion.findAll({
      where: { designId: req.params.id },
      order: [['versionNumber', 'DESC']]
    })
    res.json(versions)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new version of design
router.post('/:id/versions', async (req, res) => {
  try {
    const design = await CabinetDesign.findByPk(req.params.id)
    if (!design) return res.status(404).json({ error: 'Design not found' })
    
    const latestVersion = await DesignVersion.findOne({
      where: { designId: req.params.id },
      order: [['versionNumber', 'DESC']]
    })
    
    const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1
    
    const version = await DesignVersion.create({
      designId: design.id,
      versionNumber: newVersionNumber,
      name: design.name,
      modelData: design.modelData,
      width: design.width,
      height: design.height,
      depth: design.depth,
      material: design.material,
      finish: design.finish,
      changeDescription: req.body.changeDescription || `Version ${newVersionNumber}`,
      createdById: req.body.userId
    })
    
    res.status(201).json(version)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Restore design from version
router.post('/:id/versions/:versionId/restore', async (req, res) => {
  try {
    const design = await CabinetDesign.findByPk(req.params.id)
    if (!design) return res.status(404).json({ error: 'Design not found' })
    
    const version = await DesignVersion.findByPk(req.params.versionId)
    if (!version) return res.status(404).json({ error: 'Version not found' })
    
    await design.update({
      modelData: version.modelData,
      width: version.width,
      height: version.height,
      depth: version.depth,
      material: version.material,
      finish: version.finish
    })
    
    res.json({ message: 'Design restored from version', design })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Generate cost estimate for design
router.post('/:id/cost-estimate', async (req, res) => {
  try {
    const design = await CabinetDesign.findByPk(req.params.id)
    if (!design) return res.status(404).json({ error: 'Design not found' })
    
    const parts = design.modelData?.parts || []
    
    // Calculate costs based on parts
    let totalArea = 0
    parts.forEach(part => {
      totalArea += (part.w * part.h) / 1000000 // m²
    })
    
    const materialCostPerM2 = 50 // EUR per m²
    const laborCostPerPart = 15 // EUR per part
    const overheadPercentage = 0.15
    const profitMargin = req.body.profitMargin || 20
    
    const materialCost = totalArea * materialCostPerM2
    const laborCost = parts.length * laborCostPerPart
    const subtotal = materialCost + laborCost
    const overheadCost = subtotal * overheadPercentage
    const costBeforeProfit = subtotal + overheadCost
    const totalCost = costBeforeProfit * (1 + profitMargin / 100)
    
    const estimate = await CostEstimate.create({
      designId: design.id,
      materialCost: materialCost.toFixed(2),
      laborCost: laborCost.toFixed(2),
      overheadCost: overheadCost.toFixed(2),
      profitMargin,
      totalCost: totalCost.toFixed(2),
      currency: 'EUR',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: `Estimated for ${parts.length} parts, ${totalArea.toFixed(3)} m² total area`
    })
    
    res.status(201).json(estimate)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get cost estimates for design
router.get('/:id/cost-estimates', async (req, res) => {
  try {
    const estimates = await CostEstimate.findAll({
      where: { designId: req.params.id },
      order: [['createdAt', 'DESC']]
    })
    res.json(estimates)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Export design in specified format
router.post('/:id/export', async (req, res) => {
  try {
    const design = await CabinetDesign.findByPk(req.params.id, {
      include: [{ model: User, as: 'designer', attributes: ['firstName', 'lastName', 'email'] }]
    })
    if (!design) return res.status(404).json({ error: 'Design not found' })
    
    const format = req.body.format || 'json'
    const parts = design.modelData?.parts || []
    
    let exportData
    
    if (format === 'json') {
      exportData = {
        design: {
          id: design.id,
          name: design.name,
          dimensions: { width: design.width, height: design.height, depth: design.depth },
          material: design.material,
          finish: design.finish,
          status: design.status,
          designer: design.designer,
          createdAt: design.createdAt
        },
        parts: parts,
        bom: parts.map(p => ({
          partId: p.id,
          type: p.type,
          dimensions: `${p.w}x${p.h}x${p.d}mm`,
          material: p.material || design.material
        }))
      }
      res.json(exportData)
    } else if (format === 'csv') {
      const csvLines = ['Part ID,Type,Width,Height,Depth,Material']
      parts.forEach(p => {
        csvLines.push(`${p.id},${p.type},${p.w},${p.h},${p.d},${p.material || design.material}`)
      })
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="${design.name}.csv"`)
      res.send(csvLines.join('\n'))
    } else if (format === 'txt') {
      let txt = `Design: ${design.name}\n`
      txt += `Dimensions: ${design.width}x${design.height}x${design.depth}mm\n`
      txt += `Material: ${design.material}\n`
      txt += `Parts:\n`
      parts.forEach(p => {
        txt += `  - ${p.type}: ${p.w}x${p.h}x${p.d}mm\n`
      })
      res.setHeader('Content-Type', 'text/plain')
      res.send(txt)
    } else {
      res.status(400).json({ error: 'Unsupported format' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get design BOM (Bill of Materials)
router.get('/:id/bom', async (req, res) => {
  try {
    const design = await CabinetDesign.findByPk(req.params.id)
    if (!design) return res.status(404).json({ error: 'Design not found' })
    
    const parts = design.modelData?.parts || []
    
    const bom = {
      designId: design.id,
      designName: design.name,
      totalParts: parts.length,
      items: parts.map((p, idx) => ({
        lineNumber: idx + 1,
        partId: p.id,
        type: p.type,
        width: p.w,
        height: p.h,
        depth: p.d,
        material: p.material || design.material,
        area: (p.w * p.h) / 1000000, // m²
        volume: (p.w * p.h * p.d) / 1000000000 // m³
      })),
      summary: {
        totalArea: parts.reduce((sum, p) => sum + (p.w * p.h) / 1000000, 0),
        totalVolume: parts.reduce((sum, p) => sum + (p.w * p.h * p.d) / 1000000000, 0)
      }
    }
    
    res.json(bom)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all parts for a design
router.get('/:id/parts', async (req, res) => {
  try {
    const parts = await DesignPart.findAll({
      where: { designId: req.params.id },
      order: [['order', 'ASC']]
    })
    res.json(parts)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Add part to design
router.post('/:id/parts', async (req, res) => {
  try {
    const design = await CabinetDesign.findByPk(req.params.id)
    if (!design) return res.status(404).json({ error: 'Design not found' })
    
    const part = await DesignPart.create({
      ...req.body,
      designId: req.params.id
    })
    res.status(201).json(part)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Update part
router.put('/:designId/parts/:partId', async (req, res) => {
  try {
    const part = await DesignPart.findOne({
      where: { id: req.params.partId, designId: req.params.designId }
    })
    if (!part) return res.status(404).json({ error: 'Part not found' })
    await part.update(req.body)
    res.json(part)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Delete part
router.delete('/:designId/parts/:partId', async (req, res) => {
  try {
    const part = await DesignPart.findOne({
      where: { id: req.params.partId, designId: req.params.designId }
    })
    if (!part) return res.status(404).json({ error: 'Part not found' })
    await part.destroy()
    res.json({ message: 'Part deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Duplicate design
router.post('/:id/duplicate', async (req, res) => {
  try {
    const design = await CabinetDesign.findByPk(req.params.id)
    if (!design) return res.status(404).json({ error: 'Design not found' })
    
    const newDesign = await CabinetDesign.create({
      ...design.toJSON(),
      id: undefined,
      name: `${design.name} (Copy)`,
      status: 'Draft',
      createdAt: undefined,
      updatedAt: undefined
    })
    
    // Copy parts
    const parts = await DesignPart.findAll({ where: { designId: req.params.id } })
    for (const part of parts) {
      await DesignPart.create({
        ...part.toJSON(),
        id: undefined,
        designId: newDesign.id,
        createdAt: undefined,
        updatedAt: undefined
      })
    }
    
    res.status(201).json(newDesign)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get all design metrics (summary across all designs)
router.get('/metrics/summary', async (req, res) => {
  try {
    const designs = await CabinetDesign.findAll()
    const parts = await DesignPart.findAll()
    
    const totalDesigns = designs.length
    const draftDesigns = designs.filter(d => d.status === 'Draft').length
    const approvedDesigns = designs.filter(d => d.status === 'Approved').length
    const inProductionDesigns = designs.filter(d => d.status === 'In Production').length
    const completedDesigns = designs.filter(d => d.status === 'Completed').length
    
    const totalParts = parts.length
    const avgPartsPerDesign = totalDesigns > 0 ? Math.round(totalParts / totalDesigns) : 0
    
    const materials = {}
    designs.forEach(d => { if (d.material) materials[d.material] = (materials[d.material] || 0) + 1 })
    
    res.json({
      designs: {
        total: totalDesigns,
        draft: draftDesigns,
        approved: approvedDesigns,
        inProduction: inProductionDesigns,
        completed: completedDesigns
      },
      parts: {
        total: totalParts,
        avgPerDesign: avgPartsPerDesign
      },
      materials,
      completionRate: totalDesigns > 0 ? parseFloat((completedDesigns / totalDesigns * 100).toFixed(1)) : 0
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get design statistics
router.get('/:id/statistics', async (req, res) => {
  try {
    const design = await CabinetDesign.findByPk(req.params.id)
    if (!design) return res.status(404).json({ error: 'Design not found' })
    
    const parts = await DesignPart.findAll({ where: { designId: req.params.id } })
    const modelParts = design.modelData?.parts || []
    
    const totalParts = parts.length + modelParts.length
    const totalArea = parts.reduce((sum, p) => sum + (p.width * p.height) / 1000000, 0) +
                      modelParts.reduce((sum, p) => sum + (p.w * p.h) / 1000000, 0)
    const totalVolume = parts.reduce((sum, p) => sum + (p.width * p.height * p.depth) / 1000000000, 0) +
                        modelParts.reduce((sum, p) => sum + (p.w * p.h * p.d) / 1000000000, 0)
    
    const partTypes = {}
    parts.forEach(p => { partTypes[p.partType] = (partTypes[p.partType] || 0) + 1 })
    modelParts.forEach(p => { partTypes[p.type] = (partTypes[p.type] || 0) + 1 })
    
    const materials = {}
    parts.forEach(p => { if (p.material) materials[p.material] = (materials[p.material] || 0) + 1 })
    modelParts.forEach(p => { if (p.material) materials[p.material] = (materials[p.material] || 0) + 1 })
    
    res.json({
      designId: design.id,
      designName: design.name,
      dimensions: { width: design.width, height: design.height, depth: design.depth },
      totalParts,
      totalArea: parseFloat(totalArea.toFixed(4)),
      totalVolume: parseFloat(totalVolume.toFixed(6)),
      partTypes,
      materials,
      status: design.status,
      version: design.version
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Generate QR code for a specific part
router.get('/:designId/parts/:partId/qrcode', async (req, res) => {
  try {
    const part = await DesignPart.findOne({
      where: { id: req.params.partId, designId: req.params.designId }
    })
    if (!part) return res.status(404).json({ error: 'Part not found' })
    
    const design = await CabinetDesign.findByPk(req.params.designId)
    
    const qrData = JSON.stringify({
      partId: part.id,
      designId: part.designId,
      partType: part.partType,
      name: part.name,
      dimensions: `${part.width}x${part.height}x${part.depth}mm`,
      designName: design?.name || 'Unknown'
    })
    
    // Generate QR code if not already stored
    if (!part.qrCode) {
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 200 })
      await part.update({ qrCode: qrCodeDataUrl, qrCodeData: part.id })
      part.qrCode = qrCodeDataUrl
    }
    
    res.json({ 
      qrCode: part.qrCode, 
      data: JSON.parse(qrData),
      partId: part.id
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Generate QR codes for all parts in a design
router.post('/:id/generate-qrcodes', async (req, res) => {
  try {
    const design = await CabinetDesign.findByPk(req.params.id)
    if (!design) return res.status(404).json({ error: 'Design not found' })
    
    const parts = await DesignPart.findAll({ where: { designId: req.params.id } })
    
    const results = await Promise.all(parts.map(async (part) => {
      const qrData = JSON.stringify({
        partId: part.id,
        designId: part.designId,
        partType: part.partType,
        name: part.name,
        dimensions: `${part.width}x${part.height}x${part.depth}mm`,
        designName: design.name
      })
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 200 })
      await part.update({ qrCode: qrCodeDataUrl, qrCodeData: part.id })
      
      return {
        partId: part.id,
        partType: part.partType,
        qrCode: qrCodeDataUrl
      }
    }))
    
    res.json({ 
      designId: design.id, 
      designName: design.name, 
      partsUpdated: results.length,
      parts: results 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create parts from modelData and generate QR codes
router.post('/:id/create-parts-with-qrcodes', async (req, res) => {
  try {
    const design = await CabinetDesign.findByPk(req.params.id)
    if (!design) return res.status(404).json({ error: 'Design not found' })
    
    const modelParts = design.modelData?.parts || req.body.parts || []
    
    const createdParts = await Promise.all(modelParts.map(async (p, idx) => {
      // Create the part in the database
      const part = await DesignPart.create({
        designId: design.id,
        partType: p.type || p.partType,
        name: p.id || `Part ${idx + 1}`,
        width: p.w || p.width,
        height: p.h || p.height,
        depth: p.d || p.depth,
        positionX: p.x || 0,
        positionY: p.y || 0,
        positionZ: p.z || 0,
        material: p.material || design.material,
        order: idx
      })
      
      // Generate QR code
      const qrData = JSON.stringify({
        partId: part.id,
        designId: design.id,
        partType: part.partType,
        name: part.name,
        dimensions: `${part.width}x${part.height}x${part.depth}mm`,
        designName: design.name
      })
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 200 })
      await part.update({ qrCode: qrCodeDataUrl, qrCodeData: part.id })
      
      return {
        ...part.toJSON(),
        qrCode: qrCodeDataUrl
      }
    }))
    
    res.status(201).json({
      designId: design.id,
      partsCreated: createdParts.length,
      parts: createdParts
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
