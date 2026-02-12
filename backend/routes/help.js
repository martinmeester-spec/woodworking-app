import express from 'express'
import { HelpArticle } from '../models/index.js'
import { Op } from 'sequelize'

const router = express.Router()

// Get all help articles
router.get('/articles', async (req, res) => {
  try {
    const { category, search } = req.query
    const where = { isPublished: true }
    if (category) where.category = category
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
        { summary: { [Op.iLike]: `%${search}%` } }
      ]
    }
    
    const articles = await HelpArticle.findAll({
      where,
      order: [['order', 'ASC'], ['title', 'ASC']]
    })
    res.json(articles)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get help article by slug
router.get('/articles/:slug', async (req, res) => {
  try {
    const article = await HelpArticle.findOne({
      where: { slug: req.params.slug, isPublished: true }
    })
    if (!article) return res.status(404).json({ error: 'Article not found' })
    res.json(article)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get help categories
router.get('/categories', async (req, res) => {
  try {
    const articles = await HelpArticle.findAll({
      where: { isPublished: true },
      attributes: ['category'],
      group: ['category']
    })
    const categories = [...new Set(articles.map(a => a.category))]
    res.json(categories)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create help article (admin)
router.post('/articles', async (req, res) => {
  try {
    const article = await HelpArticle.create(req.body)
    res.status(201).json(article)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Update help article (admin)
router.put('/articles/:id', async (req, res) => {
  try {
    const article = await HelpArticle.findByPk(req.params.id)
    if (!article) return res.status(404).json({ error: 'Article not found' })
    await article.update(req.body)
    res.json(article)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Seed default help articles
router.post('/seed', async (req, res) => {
  try {
    const defaultArticles = [
      {
        slug: 'getting-started',
        title: 'Getting Started with Cabinet Design',
        category: '3D Design Studio',
        summary: 'Learn the basics of creating your first cabinet design',
        content: `# Getting Started with Cabinet Design

Welcome to the Woodworking Cabinet Management System! This guide will help you create your first cabinet design.

## Step 1: Create a New Design
1. Navigate to the Design Studio
2. Click "New Design" button
3. Enter a name for your design
4. Set the basic dimensions (width, height, depth)

## Step 2: Add Cabinet Parts
- **Side Panels**: Click "Add Side Panel" to add left and right sides
- **Top/Bottom**: Add horizontal panels for top and bottom
- **Back Panel**: Add a back panel for structural support
- **Shelves**: Add internal shelves as needed
- **Doors**: Add front doors with hinges

## Step 3: Configure Materials
Select materials for each part:
- Plywood (various thicknesses)
- MDF
- Solid Wood
- Melamine

## Tips
- Use the grid snap for precise positioning
- Enable collision detection to prevent overlapping parts
- Save your design frequently`,
        examples: [
          { title: 'Basic Kitchen Cabinet', dimensions: '600x720x560mm' },
          { title: 'Wall Cabinet', dimensions: '800x400x300mm' },
          { title: 'Tall Pantry', dimensions: '600x2100x560mm' }
        ],
        order: 1
      },
      {
        slug: 'design-studio-tools',
        title: '3D Design Studio Tools',
        category: '3D Design Studio',
        summary: 'Complete guide to all design studio tools and features',
        content: `# 3D Design Studio Tools

## Navigation Tools
- **Rotate View**: Click and drag to rotate the 3D view
- **Pan**: Hold Shift + drag to pan the view
- **Zoom**: Use mouse wheel to zoom in/out
- **Reset View**: Press 'R' to reset to default view

## Part Tools
- **Add Part**: Click to add new cabinet parts
- **Select**: Click on parts to select them
- **Move**: Drag selected parts to reposition
- **Resize**: Use handles to resize parts
- **Delete**: Press Delete key to remove selected parts

## Measurement Tools
- **Rulers**: Toggle rulers for precise measurements
- **Dimensions**: Show/hide dimension labels
- **Grid**: Enable snap-to-grid for alignment

## Material Tools
- **Material Picker**: Select materials for parts
- **Texture Preview**: See realistic material textures
- **Cost Calculator**: View estimated material costs

## Export Options
- **Save Design**: Save to your account
- **Export BOM**: Generate Bill of Materials
- **Export PDF**: Create printable plans
- **Export DXF**: Export for CNC machines`,
        examples: [
          { title: 'Using Grid Snap', description: 'Enable grid snap for 10mm precision' },
          { title: 'Material Selection', description: 'Right-click part to change material' }
        ],
        order: 2
      },
      {
        slug: 'production-orders',
        title: 'Creating Production Orders',
        category: 'Production',
        summary: 'How to create and manage production orders from designs',
        content: `# Creating Production Orders

## From Design to Production
1. Open a completed design
2. Click "Create Production Order"
3. Set order details (customer, due date)
4. Review generated panels
5. Submit order

## Order Workflow
- **Draft**: Initial order creation
- **Pending**: Awaiting approval
- **In Progress**: Currently in production
- **Completed**: All panels finished
- **Shipped**: Delivered to customer

## Panel Tracking
Each panel gets a unique QR code for tracking through production stations:
- Cutting
- Edge Banding
- Drilling
- Assembly
- Quality Check
- Packaging`,
        order: 3
      },
      {
        slug: 'inventory-management',
        title: 'Inventory Management Guide',
        category: 'Inventory',
        summary: 'Managing materials, parts, and stock levels',
        content: `# Inventory Management

## Stock Tracking
- View current stock levels
- Set minimum/maximum quantities
- Receive low stock alerts

## Transactions
- **IN**: Record incoming materials
- **OUT**: Track material usage
- **ADJUST**: Correct inventory counts

## Reorder Alerts
Configure automatic alerts when stock falls below minimum levels.

## Suppliers
Manage supplier information and lead times for efficient ordering.`,
        order: 4
      },
      {
        slug: 'quality-control',
        title: 'Quality Control Process',
        category: 'Quality',
        summary: 'Managing defects and rework orders',
        content: `# Quality Control

## Defect Reporting
1. Scan panel QR code
2. Select defect type
3. Set severity level
4. Add description and photos
5. Submit defect report

## Rework Orders
When defects are found:
1. Create rework order
2. Assign to station
3. Track repair progress
4. Complete quality check
5. Return to production flow

## Quality Metrics
Monitor quality performance:
- Defect rate
- First-pass yield
- Rework completion time`,
        order: 5
      }
    ]
    
    for (const article of defaultArticles) {
      await HelpArticle.upsert(article)
    }
    
    res.json({ message: 'Help articles seeded successfully', count: defaultArticles.length })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
