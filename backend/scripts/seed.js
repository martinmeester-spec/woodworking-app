import { sequelize, User, DesignTemplate, CabinetDesign, ProductionOrder, ProductionJob, Panel, ProductionStation, QualityDefect, InventoryPart, Machine, MachineMaintenance } from '../models/index.js'
import dotenv from 'dotenv'

dotenv.config()

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...')
    
    await sequelize.sync({ force: true })
    console.log('✅ Database tables created')

    // Seed Users (use create individually to trigger beforeCreate hook for password hashing)
    const usersData = [
      { email: 'admin@woodworking.com', passwordHash: 'test123', firstName: 'Admin', lastName: 'User', role: 'Admin', department: 'Management' },
      { email: 'manager@woodworking.com', passwordHash: 'test123', firstName: 'Manager', lastName: 'User', role: 'Manager', department: 'Production' },
      { email: 'designer@woodworking.com', passwordHash: 'test123', firstName: 'Designer', lastName: 'User', role: 'Designer', department: 'Design' },
      { email: 'operator@woodworking.com', passwordHash: 'test123', firstName: 'Operator', lastName: 'User', role: 'Operator', department: 'Production' },
      { email: 'scanner@woodworking.com', passwordHash: 'test123', firstName: 'Scanner', lastName: 'User', role: 'Scanner', department: 'Production' },
    ]
    const users = []
    for (const userData of usersData) {
      const user = await User.create(userData)
      users.push(user)
    }
    console.log(`✅ Created ${users.length} users`)

    // Seed Design Templates
    const templates = await DesignTemplate.bulkCreate([
      { templateName: 'Base Cabinet', category: 'Kitchen', baseWidth: 600, baseHeight: 720, baseDepth: 560, baseMaterial: 'Oak' },
      { templateName: 'Wall Cabinet', category: 'Kitchen', baseWidth: 600, baseHeight: 400, baseDepth: 300, baseMaterial: 'Oak' },
      { templateName: 'Tall Cabinet', category: 'Kitchen', baseWidth: 600, baseHeight: 2100, baseDepth: 560, baseMaterial: 'Oak' },
      { templateName: 'Drawer Unit', category: 'Kitchen', baseWidth: 450, baseHeight: 720, baseDepth: 560, baseMaterial: 'Maple' },
      { templateName: 'Corner Cabinet', category: 'Kitchen', baseWidth: 900, baseHeight: 720, baseDepth: 560, baseMaterial: 'Walnut' },
    ])
    console.log(`✅ Created ${templates.length} design templates`)

    // Seed Cabinet Designs
    const designs = await CabinetDesign.bulkCreate([
      { designerId: users[2].id, templateId: templates[0].id, name: 'Modern Base Cabinet', width: 600, height: 720, depth: 560, material: 'Oak', finish: 'Natural', status: 'Approved' },
      { designerId: users[2].id, templateId: templates[1].id, name: 'Wall Cabinet Set', width: 600, height: 400, depth: 300, material: 'Maple', finish: 'Stained', status: 'Approved' },
      { designerId: users[2].id, templateId: templates[2].id, name: 'Tall Pantry Unit', width: 600, height: 2100, depth: 560, material: 'Walnut', finish: 'Lacquered', status: 'Approved' },
      { designerId: users[2].id, templateId: templates[3].id, name: 'Drawer Base Units', width: 450, height: 720, depth: 560, material: 'Cherry', finish: 'Matte', status: 'In Review' },
      { designerId: users[2].id, templateId: templates[4].id, name: 'Island Cabinet', width: 1200, height: 900, depth: 600, material: 'Oak', finish: 'Gloss', status: 'Approved' },
    ])
    console.log(`✅ Created ${designs.length} cabinet designs`)

    // Seed Production Stations
    const stations = await ProductionStation.bulkCreate([
      { stationName: 'Cutting Station 1', stationType: 'Cutting', location: 'Building A', operatorName: 'John Smith', uptimePercentage: 98 },
      { stationName: 'Cutting Station 2', stationType: 'Cutting', location: 'Building A', operatorName: 'Mike Johnson', uptimePercentage: 95 },
      { stationName: 'Drilling Station', stationType: 'Drilling', location: 'Building A', operatorName: 'Jane Doe', uptimePercentage: 92 },
      { stationName: 'Edge Banding', stationType: 'Edge Banding', location: 'Building B', operatorName: 'Sarah Wilson', uptimePercentage: 96 },
      { stationName: 'Sanding Station', stationType: 'Sanding', location: 'Building B', uptimePercentage: 94 },
      { stationName: 'Finishing Station', stationType: 'Finishing', location: 'Building C', uptimePercentage: 97 },
      { stationName: 'Assembly Station', stationType: 'Assembly', location: 'Building C', uptimePercentage: 99 },
      { stationName: 'QC Station', stationType: 'QC', location: 'Building C', uptimePercentage: 100 },
    ])
    console.log(`✅ Created ${stations.length} production stations`)

    // Seed Production Orders
    const orders = await ProductionOrder.bulkCreate([
      { orderNumber: 'ORD-2024-001', designId: designs[0].id, customerName: 'ABC Kitchens', orderDate: '2024-01-01', dueDate: '2024-01-15', status: 'In Progress', totalPanels: 24, completedPanels: 16, priority: 'High', createdBy: users[0].id },
      { orderNumber: 'ORD-2024-002', designId: designs[1].id, customerName: 'Modern Homes', orderDate: '2024-01-03', dueDate: '2024-01-18', status: 'Cutting', totalPanels: 18, completedPanels: 5, priority: 'Medium', createdBy: users[0].id },
      { orderNumber: 'ORD-2024-003', designId: designs[2].id, customerName: 'Elite Cabinets', orderDate: '2024-01-02', dueDate: '2024-01-12', status: 'Finishing', totalPanels: 32, completedPanels: 27, priority: 'Urgent', createdBy: users[0].id },
      { orderNumber: 'ORD-2024-004', designId: designs[3].id, customerName: 'Home Depot', orderDate: '2024-01-05', dueDate: '2024-01-20', status: 'Pending', totalPanels: 45, completedPanels: 0, priority: 'Low', createdBy: users[0].id },
      { orderNumber: 'ORD-2024-005', designId: designs[4].id, customerName: 'Custom Kitchens', orderDate: '2024-01-01', dueDate: '2024-01-10', status: 'Completed', totalPanels: 12, completedPanels: 12, priority: 'Medium', createdBy: users[0].id },
    ])
    console.log(`✅ Created ${orders.length} production orders`)

    // Seed Production Jobs
    const jobs = await ProductionJob.bulkCreate([
      { jobNumber: 'JOB-2024-001-01', orderId: orders[0].id, jobType: 'Cutting', status: 'Completed', panelCount: 24, completedPanelCount: 24, priority: 'High' },
      { jobNumber: 'JOB-2024-001-02', orderId: orders[0].id, jobType: 'Drilling', status: 'In Progress', panelCount: 24, completedPanelCount: 16, priority: 'High' },
      { jobNumber: 'JOB-2024-002-01', orderId: orders[1].id, jobType: 'Cutting', status: 'In Progress', panelCount: 18, completedPanelCount: 5, priority: 'Medium' },
      { jobNumber: 'JOB-2024-003-01', orderId: orders[2].id, jobType: 'Finishing', status: 'In Progress', panelCount: 32, completedPanelCount: 27, priority: 'Urgent' },
    ])
    console.log(`✅ Created ${jobs.length} production jobs`)

    // Seed Panels
    const panels = []
    for (let i = 1; i <= 10; i++) {
      panels.push({
        panelNumber: `P-001-${String(i).padStart(2, '0')}`,
        jobId: jobs[0].id,
        qrCode: `QR-001-${String(i).padStart(2, '0')}`,
        material: 'Oak',
        width: 600,
        height: 720,
        thickness: 18,
        status: i <= 8 ? 'Completed' : 'In Progress',
        currentStationId: stations[1].id
      })
    }
    const createdPanels = await Panel.bulkCreate(panels)
    console.log(`✅ Created ${createdPanels.length} panels`)

    // Seed Quality Defects
    const defects = await QualityDefect.bulkCreate([
      { panelId: createdPanels[0].id, stationId: stations[4].id, defectType: 'Surface Scratch', severity: 'Medium', description: 'Minor scratch on surface', detectedByName: 'John Smith', status: 'Open' },
      { panelId: createdPanels[1].id, stationId: stations[3].id, defectType: 'Edge Chip', severity: 'High', description: 'Chip on edge banding', detectedByName: 'Jane Doe', status: 'In Rework' },
      { panelId: createdPanels[2].id, stationId: stations[0].id, defectType: 'Dimension Error', severity: 'Critical', description: 'Panel cut 5mm short', detectedByName: 'Mike Johnson', status: 'Resolved' },
    ])
    console.log(`✅ Created ${defects.length} quality defects`)

    // Seed Inventory Parts
    const inventoryParts = await InventoryPart.bulkCreate([
      { partNumber: 'MAT-001', name: 'Oak Plywood 18mm', category: 'Materials', quantity: 45, minQuantity: 20, unit: 'sheets', unitCost: 85.00, status: 'In Stock' },
      { partNumber: 'MAT-002', name: 'MDF 16mm', category: 'Materials', quantity: 12, minQuantity: 15, unit: 'sheets', unitCost: 42.00, status: 'Low Stock' },
      { partNumber: 'MAT-003', name: 'Walnut Veneer', category: 'Materials', quantity: 30, minQuantity: 10, unit: 'sheets', unitCost: 120.00, status: 'In Stock' },
      { partNumber: 'MAT-004', name: 'Maple Plywood 18mm', category: 'Materials', quantity: 25, minQuantity: 15, unit: 'sheets', unitCost: 95.00, status: 'In Stock' },
      { partNumber: 'HW-001', name: 'Soft Close Hinges', category: 'Hardware', quantity: 250, minQuantity: 100, unit: 'pcs', unitCost: 3.50, status: 'In Stock' },
      { partNumber: 'HW-002', name: 'Drawer Slides 450mm', category: 'Hardware', quantity: 8, minQuantity: 25, unit: 'pairs', unitCost: 18.00, status: 'Critical' },
      { partNumber: 'HW-003', name: 'Cabinet Handles Chrome', category: 'Hardware', quantity: 180, minQuantity: 50, unit: 'pcs', unitCost: 8.50, status: 'In Stock' },
      { partNumber: 'HW-004', name: 'Shelf Supports', category: 'Hardware', quantity: 500, minQuantity: 200, unit: 'pcs', unitCost: 0.50, status: 'In Stock' },
      { partNumber: 'FIN-001', name: 'Clear Lacquer', category: 'Finishing', quantity: 5, minQuantity: 10, unit: 'liters', unitCost: 45.00, status: 'Low Stock' },
      { partNumber: 'FIN-002', name: 'Wood Stain Dark Oak', category: 'Finishing', quantity: 15, minQuantity: 5, unit: 'liters', unitCost: 35.00, status: 'In Stock' },
    ])
    console.log(`✅ Created ${inventoryParts.length} inventory parts`)

    // Seed Machines
    const machines = await Machine.bulkCreate([
      { machineId: 'CNC-001', name: 'CNC Router 1', type: 'CNC Router', manufacturer: 'Biesse', modelNumber: 'Rover A', status: 'Running', operatingHours: 4520, uptimePercentage: 98, lastMaintenance: '2024-01-05', nextMaintenance: '2024-02-05' },
      { machineId: 'CNC-002', name: 'CNC Router 2', type: 'CNC Router', manufacturer: 'Biesse', modelNumber: 'Rover B', status: 'Idle', operatingHours: 3890, uptimePercentage: 95, lastMaintenance: '2024-01-02', nextMaintenance: '2024-02-02' },
      { machineId: 'EB-001', name: 'Edge Bander Pro', type: 'Edge Bander', manufacturer: 'Homag', modelNumber: 'Edgeteq S-500', status: 'Running', operatingHours: 2150, uptimePercentage: 92, lastMaintenance: '2023-12-28', nextMaintenance: '2024-01-28' },
      { machineId: 'PS-001', name: 'Panel Saw', type: 'Panel Saw', manufacturer: 'Altendorf', modelNumber: 'F45', status: 'Maintenance', operatingHours: 5200, uptimePercentage: 88, lastMaintenance: '2024-01-08', nextMaintenance: '2024-02-08' },
      { machineId: 'DP-001', name: 'Drill Press', type: 'Drill Press', manufacturer: 'Weeke', modelNumber: 'BHX 055', status: 'Running', operatingHours: 1890, uptimePercentage: 96, lastMaintenance: '2024-01-01', nextMaintenance: '2024-02-01' },
      { machineId: 'SND-001', name: 'Wide Belt Sander', type: 'Sander', manufacturer: 'SCM', modelNumber: 'DMC SD 90', status: 'Idle', operatingHours: 2780, uptimePercentage: 94, lastMaintenance: '2023-12-20', nextMaintenance: '2024-01-20' },
    ])
    console.log(`✅ Created ${machines.length} machines`)

    // Seed Machine Maintenance
    const maintenance = await MachineMaintenance.bulkCreate([
      { maintenanceId: 'MAINT-001', machineId: machines[3].id, maintenanceType: 'Scheduled', scheduledDate: '2024-01-08', technician: 'Mike Johnson', notes: 'Blade replacement and alignment', status: 'In Progress' },
      { maintenanceId: 'MAINT-002', machineId: machines[0].id, maintenanceType: 'Preventive', scheduledDate: '2024-01-05', completedDate: '2024-01-05', technician: 'John Smith', notes: 'Lubrication and calibration', status: 'Completed' },
      { maintenanceId: 'MAINT-003', machineId: machines[1].id, maintenanceType: 'Repair', scheduledDate: '2024-01-02', completedDate: '2024-01-02', technician: 'Jane Doe', notes: 'Spindle motor repair', status: 'Completed' },
    ])
    console.log(`✅ Created ${maintenance.length} maintenance records`)

    console.log('\n🎉 Database seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()
