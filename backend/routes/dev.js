import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ProductionOrder, ProductionJob, Panel, PartTracking, WorkLog, QualityDefect, ReworkOrder, DesignTemplate, CabinetDesign } from '../models/index.js'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MYWAY_PATH = path.resolve(__dirname, '../../../myway.txt')

// Get myway.txt content
router.get('/myway', async (req, res) => {
  try {
    if (fs.existsSync(MYWAY_PATH)) {
      const content = fs.readFileSync(MYWAY_PATH, 'utf-8')
      res.json({ content, path: MYWAY_PATH })
    } else {
      res.json({ content: '', path: MYWAY_PATH })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update myway.txt content
router.put('/myway', async (req, res) => {
  try {
    const { content } = req.body
    fs.writeFileSync(MYWAY_PATH, content, 'utf-8')
    res.json({ success: true, message: 'File saved successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete all production data (in correct order to respect foreign keys)
router.delete('/production-data', async (req, res) => {
  try {
    // Delete in order: child tables first, then parent tables
    const reworkOrders = await ReworkOrder.destroy({ where: {} })
    const qualityDefects = await QualityDefect.destroy({ where: {} })
    const workLogs = await WorkLog.destroy({ where: {} })
    const partTracking = await PartTracking.destroy({ where: {} })
    const panels = await Panel.destroy({ where: {} })
    const productionJobs = await ProductionJob.destroy({ where: {} })
    const productionOrders = await ProductionOrder.destroy({ where: {} })
    
    const deletedCounts = {
      reworkOrders,
      qualityDefects,
      workLogs,
      partTracking,
      panels,
      productionJobs,
      productionOrders
    }
    
    res.json({ 
      success: true, 
      message: 'All production data deleted successfully',
      deleted: deletedCounts
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get developer mode status
router.get('/developer-mode', async (req, res) => {
  try {
    const configPath = path.resolve(__dirname, '../../../developer-mode.json')
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      res.json(config)
    } else {
      res.json({ enabled: false })
    }
  } catch (error) {
    res.json({ enabled: false })
  }
})

// Set developer mode status
router.put('/developer-mode', async (req, res) => {
  try {
    const { enabled } = req.body
    const configPath = path.resolve(__dirname, '../../../developer-mode.json')
    fs.writeFileSync(configPath, JSON.stringify({ enabled }, null, 2), 'utf-8')
    res.json({ success: true, enabled })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Reset and seed design templates with 20 realistic cabinet designs
router.post('/reset-templates', async (req, res) => {
  try {
    // First, unlink all cabinet designs from templates
    await CabinetDesign.update({ templateId: null }, { where: {} })
    
    // Delete all existing templates
    await DesignTemplate.destroy({ where: {} })
    
    // Create 20 new realistic cabinet templates
    const templates = [
      // IKEA-inspired classics
      { templateName: 'Billy Bookcase', category: 'Bookcase', baseWidth: 800, baseHeight: 2020, baseDepth: 280, baseMaterial: 'White Melamine', modelTemplate: { compartments: 1, shelves: 5, hasBack: true, hasDoors: false } },
      { templateName: 'Billy Bookcase Wide', category: 'Bookcase', baseWidth: 800, baseHeight: 2020, baseDepth: 400, baseMaterial: 'Oak Veneer', modelTemplate: { compartments: 1, shelves: 5, hasBack: true, hasDoors: false } },
      { templateName: 'Kallax 4x4 Cube', category: 'Storage', baseWidth: 1470, baseHeight: 1470, baseDepth: 390, baseMaterial: 'White Melamine', modelTemplate: { compartments: 4, shelves: 3, hasBack: true, hasDoors: false } },
      { templateName: 'Kallax 2x4 Cube', category: 'Storage', baseWidth: 770, baseHeight: 1470, baseDepth: 390, baseMaterial: 'Birch Veneer', modelTemplate: { compartments: 2, shelves: 3, hasBack: true, hasDoors: false } },
      { templateName: 'Pax Wardrobe Single', category: 'Wardrobe', baseWidth: 500, baseHeight: 2010, baseDepth: 580, baseMaterial: 'White', modelTemplate: { compartments: 1, shelves: 2, hasBack: true, hasDoors: true } },
      { templateName: 'Pax Wardrobe Double', category: 'Wardrobe', baseWidth: 1000, baseHeight: 2010, baseDepth: 580, baseMaterial: 'Oak', modelTemplate: { compartments: 2, shelves: 2, hasBack: true, hasDoors: true } },
      
      // Kitchen cabinets
      { templateName: 'Kitchen Base Cabinet 600', category: 'Kitchen', baseWidth: 600, baseHeight: 720, baseDepth: 560, baseMaterial: 'White Shaker', modelTemplate: { compartments: 1, shelves: 1, hasBack: true, hasDoors: true } },
      { templateName: 'Kitchen Base Cabinet 800', category: 'Kitchen', baseWidth: 800, baseHeight: 720, baseDepth: 560, baseMaterial: 'Grey Shaker', modelTemplate: { compartments: 2, shelves: 1, hasBack: true, hasDoors: true } },
      { templateName: 'Kitchen Wall Cabinet 600', category: 'Kitchen', baseWidth: 600, baseHeight: 400, baseDepth: 320, baseMaterial: 'White Gloss', modelTemplate: { compartments: 1, shelves: 1, hasBack: true, hasDoors: true } },
      { templateName: 'Kitchen Wall Cabinet 800', category: 'Kitchen', baseWidth: 800, baseHeight: 400, baseDepth: 320, baseMaterial: 'White Gloss', modelTemplate: { compartments: 2, shelves: 1, hasBack: true, hasDoors: true } },
      { templateName: 'Kitchen Tall Pantry', category: 'Kitchen', baseWidth: 600, baseHeight: 2100, baseDepth: 560, baseMaterial: 'White Shaker', modelTemplate: { compartments: 1, shelves: 5, hasBack: true, hasDoors: true } },
      { templateName: 'Kitchen Corner Cabinet', category: 'Kitchen', baseWidth: 900, baseHeight: 720, baseDepth: 560, baseMaterial: 'Oak', modelTemplate: { compartments: 1, shelves: 1, hasBack: true, hasDoors: true } },
      
      // Bathroom vanities
      { templateName: 'Bathroom Vanity 600', category: 'Bathroom', baseWidth: 600, baseHeight: 500, baseDepth: 450, baseMaterial: 'White Gloss', modelTemplate: { compartments: 1, shelves: 0, hasBack: true, hasDoors: true } },
      { templateName: 'Bathroom Vanity 900', category: 'Bathroom', baseWidth: 900, baseHeight: 500, baseDepth: 450, baseMaterial: 'Grey Matt', modelTemplate: { compartments: 2, shelves: 0, hasBack: true, hasDoors: true } },
      
      // Living room
      { templateName: 'TV Stand Low', category: 'Living Room', baseWidth: 1600, baseHeight: 400, baseDepth: 400, baseMaterial: 'Walnut', modelTemplate: { compartments: 3, shelves: 0, hasBack: true, hasDoors: true } },
      { templateName: 'Sideboard Classic', category: 'Living Room', baseWidth: 1500, baseHeight: 800, baseDepth: 450, baseMaterial: 'Oak', modelTemplate: { compartments: 3, shelves: 1, hasBack: true, hasDoors: true } },
      { templateName: 'Display Cabinet Glass', category: 'Living Room', baseWidth: 800, baseHeight: 1800, baseDepth: 400, baseMaterial: 'White', modelTemplate: { compartments: 1, shelves: 4, hasBack: true, hasDoors: true } },
      
      // Office
      { templateName: 'Office Filing Cabinet', category: 'Office', baseWidth: 400, baseHeight: 720, baseDepth: 500, baseMaterial: 'Grey', modelTemplate: { compartments: 1, shelves: 2, hasBack: true, hasDoors: false } },
      { templateName: 'Office Credenza', category: 'Office', baseWidth: 1200, baseHeight: 720, baseDepth: 450, baseMaterial: 'Walnut', modelTemplate: { compartments: 3, shelves: 1, hasBack: true, hasDoors: true } },
      
      // Garage/Utility
      { templateName: 'Utility Storage Tall', category: 'Utility', baseWidth: 800, baseHeight: 1800, baseDepth: 400, baseMaterial: 'Grey Melamine', modelTemplate: { compartments: 1, shelves: 4, hasBack: true, hasDoors: true } }
    ]
    
    const created = await DesignTemplate.bulkCreate(templates)
    
    res.json({ 
      success: true, 
      message: `Created ${created.length} new design templates`,
      templates: created.map(t => ({ id: t.id, name: t.templateName, category: t.category }))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
