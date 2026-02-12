import { User, DesignTemplate, CabinetDesign, ProductionOrder, ProductionJob, Panel, ProductionStation, QualityDefect, InventoryPart, Machine, MachineMaintenance, PartTracking } from '../models/index.js'

const seedUsers = async () => {
  await User.bulkCreate([
    { email: 'admin@woodworking.com', passwordHash: 'test123', firstName: 'Admin', lastName: 'User', role: 'Admin', department: 'Management' },
    { email: 'manager@woodworking.com', passwordHash: 'test123', firstName: 'Manager', lastName: 'User', role: 'Manager', department: 'Production' },
    { email: 'designer@woodworking.com', passwordHash: 'test123', firstName: 'Designer', lastName: 'User', role: 'Designer', department: 'Design' },
    { email: 'operator@woodworking.com', passwordHash: 'test123', firstName: 'Operator', lastName: 'User', role: 'Operator', department: 'Production' },
    { email: 'scanner@woodworking.com', passwordHash: 'test123', firstName: 'Scanner', lastName: 'User', role: 'Scanner', department: 'Production' },
  ], { ignoreDuplicates: true })
  return 'Users seeded'
}

const seedDesigns = async () => {
  await DesignTemplate.bulkCreate([
    { templateName: 'Base Cabinet', category: 'Kitchen', baseWidth: 600, baseHeight: 720, baseDepth: 560, baseMaterial: 'Oak' },
    { templateName: 'Wall Cabinet', category: 'Kitchen', baseWidth: 600, baseHeight: 400, baseDepth: 300, baseMaterial: 'Oak' },
    { templateName: 'Tall Cabinet', category: 'Kitchen', baseWidth: 600, baseHeight: 2100, baseDepth: 560, baseMaterial: 'Oak' },
    { templateName: 'Drawer Unit', category: 'Kitchen', baseWidth: 450, baseHeight: 720, baseDepth: 560, baseMaterial: 'Maple' },
  ], { ignoreDuplicates: true })
  return 'Designs seeded'
}

const seedProduction = async () => {
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  await ProductionOrder.bulkCreate([
    { orderNumber: 'ORD-001', customerName: 'ABC Kitchens', status: 'Cutting', totalPanels: 12, completedPanels: 4, orderDate: today, dueDate: nextWeek },
    { orderNumber: 'ORD-002', customerName: 'Home Designs Ltd', status: 'Drilling', totalPanels: 8, completedPanels: 6, orderDate: today, dueDate: nextWeek },
    { orderNumber: 'ORD-003', customerName: 'Modern Living', status: 'Pending', totalPanels: 20, completedPanels: 0, orderDate: today, dueDate: nextWeek },
  ], { ignoreDuplicates: true })
  await ProductionStation.bulkCreate([
    { stationName: 'Cutting Station 1', stationType: 'Cutting', location: 'Building A', operatorName: 'John Smith', uptimePercentage: 98 },
    { stationName: 'Drilling Station', stationType: 'Drilling', location: 'Building A', operatorName: 'Jane Doe', uptimePercentage: 92 },
    { stationName: 'Edge Banding', stationType: 'Edge Banding', location: 'Building B', operatorName: 'Sarah Wilson', uptimePercentage: 96 },
    { stationName: 'Sanding Station', stationType: 'Sanding', location: 'Building B', uptimePercentage: 94 },
  ], { ignoreDuplicates: true })
  return 'Production seeded'
}

const seedInventory = async () => {
  await InventoryPart.bulkCreate([
    { partNumber: 'MAT-001', name: 'Oak Plywood 18mm', category: 'Materials', quantity: 45, minQuantity: 20, unit: 'sheets', unitCost: 85.00, status: 'In Stock' },
    { partNumber: 'MAT-002', name: 'MDF 16mm', category: 'Materials', quantity: 12, minQuantity: 15, unit: 'sheets', unitCost: 42.00, status: 'Low Stock' },
    { partNumber: 'MAT-003', name: 'Maple Veneer 3mm', category: 'Materials', quantity: 30, minQuantity: 10, unit: 'sheets', unitCost: 55.00, status: 'In Stock' },
    { partNumber: 'HW-001', name: 'Soft Close Hinges', category: 'Hardware', quantity: 250, minQuantity: 100, unit: 'pcs', unitCost: 3.50, status: 'In Stock' },
    { partNumber: 'HW-002', name: 'Drawer Slides 450mm', category: 'Hardware', quantity: 8, minQuantity: 25, unit: 'pairs', unitCost: 18.00, status: 'Critical' },
    { partNumber: 'HW-003', name: 'Cabinet Handles Chrome', category: 'Hardware', quantity: 120, minQuantity: 50, unit: 'pcs', unitCost: 5.50, status: 'In Stock' },
    { partNumber: 'FIN-001', name: 'Wood Stain Oak', category: 'Finishing', quantity: 15, minQuantity: 5, unit: 'liters', unitCost: 28.00, status: 'In Stock' },
    { partNumber: 'FIN-002', name: 'Clear Lacquer', category: 'Finishing', quantity: 3, minQuantity: 8, unit: 'liters', unitCost: 45.00, status: 'Out of Stock' },
  ], { ignoreDuplicates: true })
  return 'Inventory seeded'
}

const seedMachines = async () => {
  await Machine.bulkCreate([
    { machineId: 'CNC-001', name: 'CNC Router 1', type: 'CNC Router', status: 'Running', operatingHours: 4520, uptimePercentage: 98, lastMaintenance: '2024-01-05', nextMaintenance: '2024-02-05' },
    { machineId: 'CNC-002', name: 'CNC Router 2', type: 'CNC Router', status: 'Idle', operatingHours: 3890, uptimePercentage: 95, lastMaintenance: '2024-01-02', nextMaintenance: '2024-02-02' },
    { machineId: 'EB-001', name: 'Edge Bander Pro', type: 'Edge Bander', status: 'Running', operatingHours: 2150, uptimePercentage: 92, lastMaintenance: '2023-12-28', nextMaintenance: '2024-01-28' },
    { machineId: 'PS-001', name: 'Panel Saw', type: 'Panel Saw', status: 'Maintenance', operatingHours: 5200, uptimePercentage: 88, lastMaintenance: '2024-01-08', nextMaintenance: '2024-02-08' },
  ], { ignoreDuplicates: true })
  return 'Machines seeded'
}

const seedQuality = async () => {
  await QualityDefect.bulkCreate([
    { defectType: 'Surface Scratch', severity: 'Minor', status: 'Open', description: 'Light scratch on cabinet door surface', detectedByName: 'John Smith' },
    { defectType: 'Edge Chip', severity: 'Major', status: 'In Progress', description: 'Chip on edge banding corner', detectedByName: 'Jane Doe' },
    { defectType: 'Dimension Error', severity: 'Critical', status: 'Resolved', description: 'Panel cut 5mm too short', detectedByName: 'Mike Johnson' },
  ], { ignoreDuplicates: true })
  return 'Quality seeded'
}

const seedTracking = async () => {
  if (PartTracking) {
    await PartTracking.bulkCreate([
      { partId: 'PNL-001', partName: 'Cabinet Side Panel A', station: 'wallsaw', orderNumber: 'ORD-001', scannedBy: 'system', scannedByName: 'System Seed' },
      { partId: 'PNL-002', partName: 'Cabinet Side Panel B', station: 'wallsaw', orderNumber: 'ORD-001', scannedBy: 'system', scannedByName: 'System Seed' },
      { partId: 'PNL-003', partName: 'Cabinet Top Panel', station: 'cnc', orderNumber: 'ORD-001', scannedBy: 'system', scannedByName: 'System Seed' },
      { partId: 'PNL-004', partName: 'Drawer Front', station: 'banding', orderNumber: 'ORD-002', scannedBy: 'system', scannedByName: 'System Seed' },
      { partId: 'PNL-005', partName: 'Shelf Panel', station: 'packaging', orderNumber: 'ORD-002', scannedBy: 'system', scannedByName: 'System Seed' },
    ], { ignoreDuplicates: true })
  }
  return 'Tracking seeded'
}

const seedData = async (types = ['all']) => {
  const results = []
  const shouldSeed = (type) => types.includes('all') || types.includes(type)
  
  if (shouldSeed('users')) results.push(await seedUsers())
  if (shouldSeed('designs')) results.push(await seedDesigns())
  if (shouldSeed('production')) results.push(await seedProduction())
  if (shouldSeed('inventory')) results.push(await seedInventory())
  if (shouldSeed('machines')) results.push(await seedMachines())
  if (shouldSeed('quality')) results.push(await seedQuality())
  if (shouldSeed('tracking')) results.push(await seedTracking())
  
  return { message: `Seed completed: ${results.join(', ')}` }
}

export default seedData
