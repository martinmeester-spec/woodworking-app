import express from 'express'
import { Machine, MachineMaintenance, MachineCalibration } from '../models/index.js'

const router = express.Router()

// Get machine metrics
router.get('/metrics', async (req, res) => {
  try {
    const machines = await Machine.findAll()
    const calibrations = await MachineCalibration.findAll()
    const maintenance = await MachineMaintenance.findAll()
    
    const totalMachines = machines.length
    const operationalMachines = machines.filter(m => m.status === 'Operational').length
    const maintenanceMachines = machines.filter(m => m.status === 'Maintenance').length
    const offlineMachines = machines.filter(m => m.status === 'Offline').length
    
    const totalOperatingHours = machines.reduce((sum, m) => sum + (m.operatingHours || 0), 0)
    const avgOperatingHours = totalMachines > 0 ? Math.round(totalOperatingHours / totalMachines) : 0
    
    const passedCalibrations = calibrations.filter(c => c.result === 'Pass').length
    const failedCalibrations = calibrations.filter(c => c.result === 'Fail').length
    
    res.json({
      machines: {
        total: totalMachines,
        operational: operationalMachines,
        maintenance: maintenanceMachines,
        offline: offlineMachines,
        utilizationRate: totalMachines > 0 ? parseFloat((operationalMachines / totalMachines * 100).toFixed(1)) : 0
      },
      performance: {
        totalOperatingHours,
        avgOperatingHours
      },
      calibrations: {
        total: calibrations.length,
        passed: passedCalibrations,
        failed: failedCalibrations,
        passRate: calibrations.length > 0 ? parseFloat((passedCalibrations / calibrations.length * 100).toFixed(1)) : 0
      },
      maintenance: {
        total: maintenance.length
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all machines
router.get('/', async (req, res) => {
  try {
    const machines = await Machine.findAll({
      include: [{ model: MachineMaintenance, as: 'maintenanceRecords', limit: 5, order: [['created_at', 'DESC']] }],
      order: [['name', 'ASC']]
    })
    res.json(machines)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all calibrations (must be before /:id route)
router.get('/calibrations', async (req, res) => {
  try {
    const { machineId, result } = req.query
    const where = {}
    if (machineId) where.machineId = machineId
    if (result) where.result = result
    
    const calibrations = await MachineCalibration.findAll({
      where,
      order: [['calibrationDate', 'DESC']]
    })
    res.json(calibrations)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get machine health status (must be before /:id route)
router.get('/:id/health', async (req, res) => {
  try {
    const machine = await Machine.findByPk(req.params.id, {
      include: [{ model: MachineMaintenance, as: 'maintenanceRecords', limit: 10, order: [['created_at', 'DESC']] }]
    })
    if (!machine) return res.status(404).json({ error: 'Machine not found' })
    
    const calibrations = await MachineCalibration.findAll({
      where: { machineId: req.params.id },
      order: [['calibrationDate', 'DESC']],
      limit: 5
    })
    
    let healthScore = 100
    if (machine.status !== 'Operational') healthScore -= 30
    if (machine.operatingHours > 10000) healthScore -= 10
    if (machine.operatingHours > 20000) healthScore -= 10
    
    const lastMaintenance = machine.maintenanceRecords?.[0]
    if (lastMaintenance) {
      const daysSinceMaintenance = Math.floor((Date.now() - new Date(lastMaintenance.createdAt)) / (1000 * 60 * 60 * 24))
      if (daysSinceMaintenance > 90) healthScore -= 15
      if (daysSinceMaintenance > 180) healthScore -= 15
    }
    
    const lastCalibration = calibrations[0]
    if (lastCalibration && lastCalibration.result !== 'Pass') healthScore -= 20
    
    healthScore = Math.max(0, healthScore)
    const healthStatus = healthScore >= 80 ? 'Good' : healthScore >= 50 ? 'Fair' : 'Poor'
    
    res.json({
      machineId: machine.id,
      machineName: machine.name,
      status: machine.status,
      operatingHours: machine.operatingHours,
      healthScore,
      healthStatus,
      lastMaintenance: lastMaintenance?.createdAt,
      lastCalibration: lastCalibration?.calibrationDate,
      recentMaintenance: machine.maintenanceRecords,
      recentCalibrations: calibrations
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get machine by ID
router.get('/:id', async (req, res) => {
  try {
    const machine = await Machine.findByPk(req.params.id, {
      include: [{ model: MachineMaintenance, as: 'maintenanceRecords' }]
    })
    if (!machine) return res.status(404).json({ error: 'Machine not found' })
    res.json(machine)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create machine
router.post('/', async (req, res) => {
  try {
    const machine = await Machine.create(req.body)
    res.status(201).json(machine)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Update machine
router.put('/:id', async (req, res) => {
  try {
    const machine = await Machine.findByPk(req.params.id)
    if (!machine) return res.status(404).json({ error: 'Machine not found' })
    await machine.update(req.body)
    res.json(machine)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Delete machine
router.delete('/:id', async (req, res) => {
  try {
    const machine = await Machine.findByPk(req.params.id)
    if (!machine) return res.status(404).json({ error: 'Machine not found' })
    await machine.destroy()
    res.json({ message: 'Machine deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get machine health summary
router.get('/:id/health', async (req, res) => {
  try {
    const machine = await Machine.findByPk(req.params.id)
    if (!machine) return res.status(404).json({ error: 'Machine not found' })
    
    const health = {
      status: machine.status,
      uptime: machine.uptimePercentage,
      operatingHours: machine.operatingHours,
      lastMaintenance: machine.lastMaintenance,
      nextMaintenance: machine.nextMaintenance,
      healthScore: machine.uptimePercentage >= 95 ? 'Excellent' : 
                   machine.uptimePercentage >= 85 ? 'Good' : 
                   machine.uptimePercentage >= 70 ? 'Fair' : 'Poor'
    }
    res.json(health)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create maintenance record
router.post('/:id/maintenance', async (req, res) => {
  try {
    const machine = await Machine.findByPk(req.params.id)
    if (!machine) return res.status(404).json({ error: 'Machine not found' })
    
    const maintenance = await MachineMaintenance.create({
      ...req.body,
      machineId: machine.id,
      maintenanceId: `MAINT-${Date.now()}`
    })
    res.status(201).json(maintenance)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get all maintenance records
router.get('/maintenance/all', async (req, res) => {
  try {
    const records = await MachineMaintenance.findAll({
      include: [{ model: Machine, as: 'machine', attributes: ['id', 'name', 'machineId'] }],
      order: [['created_at', 'DESC']]
    })
    res.json(records)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create calibration record
router.post('/calibrations', async (req, res) => {
  try {
    const calibration = await MachineCalibration.create(req.body)
    res.status(201).json(calibration)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get calibrations for specific machine
router.get('/:id/calibrations', async (req, res) => {
  try {
    const calibrations = await MachineCalibration.findAll({
      where: { machineId: req.params.id },
      order: [['calibrationDate', 'DESC']]
    })
    res.json(calibrations)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
