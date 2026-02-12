import express from 'express'
import { Tutorial } from '../models/index.js'

const router = express.Router()

// Get all tutorials
router.get('/', async (req, res) => {
  try {
    const { category, difficulty } = req.query
    const where = { isActive: true }
    if (category) where.category = category
    if (difficulty) where.difficulty = difficulty
    
    const tutorials = await Tutorial.findAll({
      where,
      order: [['order', 'ASC'], ['title', 'ASC']]
    })
    res.json(tutorials)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get tutorial by slug
router.get('/:slug', async (req, res) => {
  try {
    const tutorial = await Tutorial.findOne({
      where: { slug: req.params.slug, isActive: true }
    })
    if (!tutorial) return res.status(404).json({ error: 'Tutorial not found' })
    res.json(tutorial)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create tutorial
router.post('/', async (req, res) => {
  try {
    const tutorial = await Tutorial.create(req.body)
    res.status(201).json(tutorial)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Seed default 3D designer tutorials
router.post('/seed', async (req, res) => {
  try {
    const defaultTutorials = [
      {
        slug: '3d-designer-intro',
        title: 'Introduction to 3D Cabinet Designer',
        category: '3D Design Studio',
        description: 'Learn the basics of the 3D cabinet designer with this interactive tutorial',
        difficulty: 'beginner',
        estimatedMinutes: 10,
        order: 1,
        steps: [
          {
            id: 1,
            title: 'Welcome to the 3D Designer',
            content: 'Welcome to the Cabinet Design Studio! This tutorial will guide you through creating your first cabinet design.',
            action: 'none',
            highlight: null,
            balloon: {
              text: '👋 Welcome! Let\'s start by exploring the interface.',
              position: 'center'
            }
          },
          {
            id: 2,
            title: 'The Toolbar',
            content: 'The toolbar at the top contains all the tools you need to create and modify your design.',
            action: 'highlight',
            highlight: '#toolbar',
            balloon: {
              text: '🔧 This is your main toolbar. Here you\'ll find tools for adding parts, materials, and more.',
              position: 'bottom'
            }
          },
          {
            id: 3,
            title: 'Create New Design',
            content: 'Click the "New Design" button to start a fresh cabinet design.',
            action: 'click',
            highlight: '#new-design-btn',
            balloon: {
              text: '➕ Click here to create a new design. A dialog will appear for basic settings.',
              position: 'right'
            }
          },
          {
            id: 4,
            title: 'Set Dimensions',
            content: 'Enter the cabinet dimensions: Width, Height, and Depth in millimeters.',
            action: 'input',
            highlight: '#dimensions-form',
            balloon: {
              text: '📏 Enter dimensions in millimeters. Standard kitchen cabinet: 600x720x560mm',
              position: 'left'
            },
            example: {
              width: 600,
              height: 720,
              depth: 560
            }
          },
          {
            id: 5,
            title: 'The 3D Viewport',
            content: 'This is where your cabinet design appears in 3D. You can rotate, pan, and zoom to view from any angle.',
            action: 'highlight',
            highlight: '#viewport',
            balloon: {
              text: '🎨 Your 3D model appears here. Use mouse to rotate (drag), pan (Shift+drag), zoom (scroll).',
              position: 'center'
            }
          },
          {
            id: 6,
            title: 'Add Side Panels',
            content: 'Every cabinet needs side panels. Click "Add Part" and select "Side Panel".',
            action: 'click',
            highlight: '#add-part-btn',
            balloon: {
              text: '📦 Click to add a new part. Side panels form the left and right walls of your cabinet.',
              position: 'right'
            }
          },
          {
            id: 7,
            title: 'Position the Part',
            content: 'Use the position controls or drag the part in the viewport to place it correctly.',
            action: 'drag',
            highlight: '#part-controls',
            balloon: {
              text: '🎯 Drag parts to position them. The grid helps align parts precisely.',
              position: 'left'
            }
          },
          {
            id: 8,
            title: 'Select Material',
            content: 'Choose a material for your part from the materials panel.',
            action: 'click',
            highlight: '#materials-panel',
            balloon: {
              text: '🪵 Select from various materials: Plywood, MDF, Solid Wood, Melamine, etc.',
              position: 'right'
            }
          },
          {
            id: 9,
            title: 'Add More Parts',
            content: 'Continue adding parts: Top, Bottom, Back Panel, Shelves, and Doors.',
            action: 'repeat',
            highlight: '#add-part-btn',
            balloon: {
              text: '🔄 Repeat the process to add all cabinet components. A basic cabinet needs: 2 sides, top, bottom, back.',
              position: 'bottom'
            }
          },
          {
            id: 10,
            title: 'Save Your Design',
            content: 'Click "Save" to store your design. You can continue editing later.',
            action: 'click',
            highlight: '#save-btn',
            balloon: {
              text: '💾 Save your work! Your design is stored in the database and can be accessed anytime.',
              position: 'left'
            }
          },
          {
            id: 11,
            title: 'Tutorial Complete!',
            content: 'Congratulations! You\'ve learned the basics of the 3D Cabinet Designer.',
            action: 'none',
            highlight: null,
            balloon: {
              text: '🎉 Great job! You\'re ready to create amazing cabinet designs. Explore more tutorials for advanced features.',
              position: 'center'
            }
          }
        ]
      },
      {
        slug: '3d-designer-advanced',
        title: 'Advanced Design Techniques',
        category: '3D Design Studio',
        description: 'Learn advanced features like collision detection, precise measurements, and hardware placement',
        difficulty: 'intermediate',
        estimatedMinutes: 15,
        order: 2,
        steps: [
          {
            id: 1,
            title: 'Collision Detection',
            content: 'Enable collision detection to prevent parts from overlapping.',
            action: 'toggle',
            highlight: '#collision-toggle',
            balloon: {
              text: '🛡️ Collision detection prevents parts from occupying the same space. Enable it for accurate designs.',
              position: 'right'
            }
          },
          {
            id: 2,
            title: 'Snap to Grid',
            content: 'Use grid snapping for precise part placement.',
            action: 'toggle',
            highlight: '#grid-snap-toggle',
            balloon: {
              text: '📐 Grid snap aligns parts to a grid (default 10mm). Great for consistent spacing.',
              position: 'right'
            }
          },
          {
            id: 3,
            title: 'Measurement Tool',
            content: 'Use the measurement tool to check distances between parts.',
            action: 'click',
            highlight: '#measure-tool',
            balloon: {
              text: '📏 Click two points to measure the distance. Essential for verifying clearances.',
              position: 'bottom'
            }
          },
          {
            id: 4,
            title: 'Add Hardware',
            content: 'Add hinges, handles, and other hardware to your design.',
            action: 'click',
            highlight: '#hardware-btn',
            balloon: {
              text: '🔩 Hardware includes hinges, handles, drawer slides. Position them accurately for production.',
              position: 'right'
            }
          },
          {
            id: 5,
            title: 'Edge Banding',
            content: 'Apply edge banding to visible edges of panels.',
            action: 'click',
            highlight: '#edge-banding-btn',
            balloon: {
              text: '🎀 Edge banding covers raw edges. Select which edges need banding for a finished look.',
              position: 'left'
            }
          }
        ]
      },
      {
        slug: 'design-to-production',
        title: 'From Design to Production',
        category: 'Production',
        description: 'Learn how to send your design to production and track progress',
        difficulty: 'beginner',
        estimatedMinutes: 8,
        order: 3,
        steps: [
          {
            id: 1,
            title: 'Review Your Design',
            content: 'Before production, review all parts and dimensions.',
            action: 'click',
            highlight: '#review-btn',
            balloon: {
              text: '👀 Always review your design before sending to production. Check all dimensions and materials.',
              position: 'center'
            }
          },
          {
            id: 2,
            title: 'Generate BOM',
            content: 'Generate a Bill of Materials to see all required parts and materials.',
            action: 'click',
            highlight: '#bom-btn',
            balloon: {
              text: '📋 The BOM lists all parts, materials, and quantities needed for production.',
              position: 'right'
            }
          },
          {
            id: 3,
            title: 'Create Production Order',
            content: 'Click "Create Production Order" to start the manufacturing process.',
            action: 'click',
            highlight: '#create-order-btn',
            balloon: {
              text: '🏭 This creates a production order with all panels. Each panel gets a unique QR code for tracking.',
              position: 'bottom'
            }
          },
          {
            id: 4,
            title: 'Track Progress',
            content: 'Monitor your order\'s progress through each production station.',
            action: 'navigate',
            highlight: '#production-link',
            balloon: {
              text: '📊 Track each panel as it moves through: Cutting → Edge Banding → Drilling → Assembly → QC',
              position: 'left'
            }
          }
        ]
      }
    ]
    
    for (const tutorial of defaultTutorials) {
      await Tutorial.upsert(tutorial)
    }
    
    res.json({ message: 'Tutorials seeded successfully', count: defaultTutorials.length })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
