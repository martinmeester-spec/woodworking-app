import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { sequelize, User } from './models/index.js'

import usersRouter from './routes/users.js'
import designsRouter from './routes/designs.js'
import productionRouter from './routes/production.js'
import inventoryRouter from './routes/inventory.js'
import machinesRouter from './routes/machines.js'
import qualityRouter from './routes/quality.js'
import authRouter from './routes/auth.js'
import activityRouter from './routes/activity.js'
import systemRouter from './routes/system.js'
import customersRouter from './routes/customers.js'
import suppliersRouter from './routes/suppliers.js'
import helpRouter from './routes/help.js'
import notificationsRouter from './routes/notifications.js'
import scheduleRouter from './routes/schedule.js'
import debugRouter from './routes/debug.js'
import tutorialsRouter from './routes/tutorials.js'
import devRouter from './routes/dev.js'
import trackingRouter from './routes/tracking.js'
import subscriptionsRouter from './routes/subscriptions.js'
import testResultsRouter from './routes/testResults.js'
import productionPlansRouter from './routes/productionPlans.js'
import costsRouter from './routes/costs.js'
import accountingRouter from './routes/accounting.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// API Routes
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/designs', designsRouter)
app.use('/api/production', productionRouter)
app.use('/api/inventory', inventoryRouter)
app.use('/api/machines', machinesRouter)
app.use('/api/quality', qualityRouter)
app.use('/api/activity', activityRouter)
app.use('/api/system', systemRouter)
app.use('/api/customers', customersRouter)
app.use('/api/suppliers', suppliersRouter)
app.use('/api/help', helpRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/schedule', scheduleRouter)
app.use('/api/debug', debugRouter)
app.use('/api/tutorials', tutorialsRouter)
app.use('/api/dev', devRouter)
app.use('/api/tracking', trackingRouter)
app.use('/api/subscriptions', subscriptionsRouter)
app.use('/api/test-results', testResultsRouter)
app.use('/api/production-plans', productionPlansRouter)
app.use('/api/costs', costsRouter)
app.use('/api/accounting', accountingRouter)

// Database management endpoints
app.get('/api/db/status', async (req, res) => {
  try {
    await sequelize.authenticate()
    res.json({ status: 'connected', database: 'woodworking_db' })
  } catch (error) {
    res.status(500).json({ status: 'disconnected', error: error.message })
  }
})

app.post('/api/db/sync', async (req, res) => {
  try {
    const { force } = req.body
    await sequelize.sync({ force: force || false })
    res.json({ message: force ? 'Database reset and synced' : 'Database synced' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/db/seed', async (req, res) => {
  try {
    const { types = ['all'] } = req.body || {}
    
    // Check if historical/comprehensive seed is requested
    if (types.includes('historical') || types.includes('comprehensive')) {
      const { default: seedHistoricalData } = await import('./scripts/seedHistoricalData.js')
      const result = await seedHistoricalData()
      return res.json({ message: result?.message || 'Historical data seeded successfully', seeded: types })
    }
    
    const { default: seedData } = await import('./scripts/seedData.js')
    const result = await seedData(types)
    res.json({ message: result?.message || 'Database seeded successfully', seeded: types })
  } catch (error) {
    console.error('Seed error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Dashboard stats endpoint
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const { ProductionOrder, QualityDefect, Machine, PartTracking } = await import('./models/index.js')
    const { Op } = await import('sequelize')
    
    const orders = await ProductionOrder.findAll()
    const defects = await QualityDefect.findAll()
    const machines = await Machine.findAll()
    
    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Count panels in production from orders
    const activeOrders = orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled')
    const panelsInProduction = activeOrders.reduce((sum, o) => sum + (o.totalPanels - o.completedPanels), 0)
    
    // Count completed today from tracking records
    let completedToday = 0
    try {
      const todayTracking = await PartTracking.findAll({
        where: {
          station: 'complete',
          createdAt: { [Op.gte]: today, [Op.lt]: tomorrow }
        }
      })
      completedToday = todayTracking.length
    } catch (e) {
      // Fallback: count completed orders today
      completedToday = orders.filter(o => {
        const orderDate = new Date(o.updatedAt)
        return o.status === 'Completed' && orderDate >= today && orderDate < tomorrow
      }).length
    }
    
    const stats = {
      activeOrders: activeOrders.length,
      panelsInProduction: panelsInProduction,
      qualityIssues: defects.filter(d => d.status === 'Open' || d.status === 'In Rework').length,
      completedToday: completedToday,
      machinesRunning: machines.filter(m => m.status === 'Running').length,
      machinesTotal: machines.length
    }
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

// Seed test users
const seedTestUsers = async () => {
  const testUsers = [
    { email: 'admin@woodworking.com', passwordHash: 'test123', role: 'Admin', firstName: 'Admin', lastName: 'User', department: 'Management' },
    { email: 'manager@woodworking.com', passwordHash: 'test123', role: 'Manager', firstName: 'Manager', lastName: 'User', department: 'Production' },
    { email: 'designer@woodworking.com', passwordHash: 'test123', role: 'Designer', firstName: 'Designer', lastName: 'User', department: 'Design' },
    { email: 'operator@woodworking.com', passwordHash: 'test123', role: 'Operator', firstName: 'Operator', lastName: 'User', department: 'Production' },
    { email: 'scanner@woodworking.com', passwordHash: 'test123', role: 'Scanner', firstName: 'Scanner', lastName: 'User', department: 'Production' },
  ]
  
  for (const userData of testUsers) {
    try {
      const [user, created] = await User.findOrCreate({ 
        where: { email: userData.email },
        defaults: userData
      })
      if (created) {
        console.log(`✅ Created test user: ${userData.email}`)
      }
    } catch (error) {
      // User already exists, skip
    }
  }
}

// Start server
const startServer = async () => {
  try {
    await sequelize.authenticate()
    console.log('✅ Database connection established')
    
    // Use force: true to recreate tables if there are schema conflicts
    // Set FORCE_DB_SYNC=true environment variable to force recreate
    const forceSync = process.env.FORCE_DB_SYNC === 'true'
    await sequelize.sync({ alter: !forceSync, force: forceSync })
    console.log(`✅ Database synchronized${forceSync ? ' (forced recreate)' : ''}`)
    
    // Seed test users
    await seedTestUsers()
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
      console.log(`📊 API endpoints available at http://localhost:${PORT}/api`)
    })
  } catch (error) {
    console.error('❌ Unable to start server:', error)
    process.exit(1)
  }
}

startServer()
