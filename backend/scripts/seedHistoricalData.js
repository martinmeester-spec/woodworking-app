import { User, DesignTemplate, CabinetDesign, ProductionOrder, ProductionJob, Panel, ProductionStation, QualityDefect, InventoryPart, InventoryTransaction, Machine, MachineMaintenance, PartTracking, UserAction } from '../models/index.js'
import { Op } from 'sequelize'

const STATIONS = ['wallsaw', 'cnc', 'banding', 'packaging', 'complete']
const STATUSES = ['Pending', 'Cutting', 'Drilling', 'Edge Banding', 'Assembly', 'Completed']
const DEFECT_TYPES = ['Surface Scratch', 'Edge Chip', 'Dimension Error', 'Color Mismatch', 'Warping', 'Delamination']
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']
const MATERIALS = ['Oak', 'Maple', 'Walnut', 'Cherry', 'MDF', 'Plywood']
const PART_TYPES = ['leftPanel', 'rightPanel', 'topPanel', 'bottomPanel', 'backPanel', 'shelf', 'door', 'drawer', 'divider']
const CUSTOMERS = [
  'ABC Kitchens', 'Home Designs Ltd', 'Modern Living', 'Classic Cabinets Co', 'Urban Interiors',
  'Luxury Homes Inc', 'Budget Kitchens', 'Designer Dreams', 'Custom Woodworks', 'Elite Cabinetry',
  'Family Furniture', 'Office Solutions', 'Restaurant Supply Co', 'Hotel Furnishings', 'Retail Fixtures Ltd',
  'School Furniture Inc', 'Hospital Interiors', 'Government Contracts', 'Military Housing', 'Senior Living Designs'
]

const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const seedHistoricalData = async () => {
  console.log('Starting comprehensive 2-year data seed...')
  
  const now = new Date()
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  
  // Get or create users
  let users = await User.findAll()
  if (users.length === 0) {
    users = await User.bulkCreate([
      { email: 'admin@woodworking.com', passwordHash: 'admin123', firstName: 'Admin', lastName: 'User', role: 'Admin', department: 'Management' },
      { email: 'john.smith@woodworking.com', passwordHash: 'password123', firstName: 'John', lastName: 'Smith', role: 'Operator', department: 'Production' },
      { email: 'jane.doe@woodworking.com', passwordHash: 'password123', firstName: 'Jane', lastName: 'Doe', role: 'Designer', department: 'Design' },
      { email: 'mike.johnson@woodworking.com', passwordHash: 'password123', firstName: 'Mike', lastName: 'Johnson', role: 'Operator', department: 'Production' },
      { email: 'sarah.wilson@woodworking.com', passwordHash: 'password123', firstName: 'Sarah', lastName: 'Wilson', role: 'Manager', department: 'Quality' },
    ], { ignoreDuplicates: true })
    users = await User.findAll()
  }
  console.log(`Users: ${users.length}`)

  // Create design templates
  await DesignTemplate.bulkCreate([
    { templateName: 'Base Cabinet 600', category: 'Kitchen', baseWidth: 600, baseHeight: 720, baseDepth: 560, baseMaterial: 'Oak' },
    { templateName: 'Wall Cabinet 600', category: 'Kitchen', baseWidth: 600, baseHeight: 400, baseDepth: 300, baseMaterial: 'Oak' },
    { templateName: 'Tall Cabinet 600', category: 'Kitchen', baseWidth: 600, baseHeight: 2100, baseDepth: 560, baseMaterial: 'Oak' },
    { templateName: 'Drawer Unit 450', category: 'Kitchen', baseWidth: 450, baseHeight: 720, baseDepth: 560, baseMaterial: 'Maple' },
    { templateName: 'Corner Cabinet', category: 'Kitchen', baseWidth: 900, baseHeight: 720, baseDepth: 560, baseMaterial: 'Oak' },
    { templateName: 'Bathroom Vanity', category: 'Bathroom', baseWidth: 800, baseHeight: 850, baseDepth: 500, baseMaterial: 'MDF' },
    { templateName: 'Office Desk Unit', category: 'Office', baseWidth: 1200, baseHeight: 750, baseDepth: 600, baseMaterial: 'Walnut' },
    { templateName: 'Bookshelf Unit', category: 'Living', baseWidth: 800, baseHeight: 1800, baseDepth: 300, baseMaterial: 'Cherry' },
  ], { ignoreDuplicates: true })
  const templates = await DesignTemplate.findAll()
  console.log(`Templates: ${templates.length}`)

  // IKEA-inspired design names
  const IKEA_NAMES = [
    'KALLAX', 'BILLY', 'MALM', 'HEMNES', 'BESTA', 'PAX', 'STUVA', 'NORDLI', 'IVAR', 'EKET',
    'METOD', 'SEKTION', 'HAVSTA', 'LIATORP', 'BRIMNES', 'SONGESAND', 'KULLEN', 'ALEX', 'MICKE', 'BEKANT',
    'GALANT', 'FJALKINGE', 'ELVARLI', 'PLATSA', 'SMASTAD', 'GODMORGON', 'ENHET', 'KNOXHULT', 'SUNNERSTA', 'VADHOLMA'
  ]
  const DESIGN_VARIANTS = ['Standard', 'Compact', 'XL', 'Corner', 'Double', 'Slim', 'Wide', 'Tall', 'Low', 'Mini']
  
  // Create cabinet designs - unique IKEA-style designs
  const designsData = []
  let designIndex = 0
  
  for (const ikeaName of IKEA_NAMES) {
    for (const variant of DESIGN_VARIANTS.slice(0, randomInt(3, 6))) {
      const template = randomElement(templates)
      const baseW = parseInt(template.baseWidth) || 600
      const baseH = parseInt(template.baseHeight) || 720
      const baseD = parseInt(template.baseDepth) || 560
      const width = baseW + randomInt(0, 100)
      const height = baseH + randomInt(0, 100)
      const depth = baseD + randomInt(0, 50)
      const material = randomElement(MATERIALS)
      
      // Generate realistic parts for each design - fixed count
      const parts = []
      const T = 18 // Panel thickness
      const backT = 6
      const interiorWidth = width - 2 * T
      
      // Standard cabinet parts (always 5 base parts)
      parts.push({ id: `left-${designIndex}`, type: 'leftPanel', x: 0, y: 0, z: 0, w: T, h: height, d: depth - backT })
      parts.push({ id: `right-${designIndex}`, type: 'rightPanel', x: width - T, y: 0, z: 0, w: T, h: height, d: depth - backT })
      parts.push({ id: `top-${designIndex}`, type: 'topPanel', x: T, y: height - T, z: 0, w: interiorWidth, h: T, d: depth - backT })
      parts.push({ id: `bottom-${designIndex}`, type: 'bottomPanel', x: T, y: 0, z: 0, w: interiorWidth, h: T, d: depth - backT })
      parts.push({ id: `back-${designIndex}`, type: 'backPanel', x: 0, y: 0, z: depth - backT, w: width, h: height, d: backT })
      
      // Add shelves based on cabinet height (1-3 shelves)
      const numShelves = Math.max(1, Math.floor((height - 2 * T) / 300))
      const shelfSpacing = (height - 2 * T) / (numShelves + 1)
      for (let s = 0; s < numShelves; s++) {
        const shelfY = T + shelfSpacing * (s + 1)
        parts.push({ 
          id: `shelf-${designIndex}-${s}`, 
          type: 'shelf', 
          x: T, 
          y: Math.round(shelfY), 
          z: 0, 
          w: interiorWidth, 
          h: T, 
          d: depth - backT - 10 
        })
      }
      
      // Store the parts count including shelves
      const partsCount = parts.length
      
      const templateId = template.id
      const userId = randomElement(users).id
      
      designsData.push({
        name: `${ikeaName} ${variant}`,
        designerId: userId,
        templateId: templateId,
        width: width,
        height: height,
        depth: depth,
        material: material,
        finish: randomElement(['Natural', 'Stained', 'Painted', 'Lacquered']),
        status: 'Approved',
        modelData: JSON.stringify({ parts: parts, partsCount: partsCount, room: { width: 3000, height: 2400, depth: 3000 }, cabinetPosition: { x: 0, y: 0, z: 0 }, version: 1 })
      })
      designIndex++
    }
  }
  await CabinetDesign.bulkCreate(designsData, { ignoreDuplicates: true })
  const designs = await CabinetDesign.findAll()
  console.log(`Designs: ${designs.length}`)

  // Create production orders - Year 1: 1000 orders, Year 2: 2300 orders
  // Orders can be single items or batches (multiple of same design)
  console.log('Creating production orders...')
  const ordersData = []
  let orderNum = 1
  
  // Helper to safely parse modelData and get parts count
  const getDesignPartsCount = (design) => {
    try {
      const modelData = typeof design.modelData === 'string' ? JSON.parse(design.modelData) : (design.modelData || {})
      // Use stored partsCount if available, otherwise count parts array
      return modelData.partsCount || (modelData.parts || []).length || 5
    } catch (e) {
      return 5 // Default to 5 parts
    }
  }
  
  // Year 1 - 1000 orders (about 83 per month)
  for (let month = 0; month < 12; month++) {
    const monthOrders = randomInt(75, 95)
    for (let i = 0; i < monthOrders; i++) {
      const orderDate = randomDate(
        new Date(twoYearsAgo.getFullYear(), twoYearsAgo.getMonth() + month, 1),
        new Date(twoYearsAgo.getFullYear(), twoYearsAgo.getMonth() + month + 1, 0)
      )
      const dueDate = new Date(orderDate.getTime() + randomInt(7, 21) * 24 * 60 * 60 * 1000)
      const design = randomElement(designs)
      const partsCount = getDesignPartsCount(design)
      
      ordersData.push({
        orderNumber: `ORD-Y1-${String(orderNum++).padStart(5, '0')}`,
        customerName: randomElement(CUSTOMERS),
        designId: design.id,
        status: 'Completed',
        totalPanels: partsCount,
        completedPanels: partsCount,
        orderDate: orderDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        priority: randomElement(['Low', 'Medium', 'High']),
        createdBy: randomElement(users).id
      })
    }
  }
  
  // Year 2 - 2300 orders (about 192 per month, showing growth)
  for (let month = 0; month < 12; month++) {
    const baseOrders = 150 + Math.floor(month * 7) // Growth throughout the year
    const monthOrders = randomInt(baseOrders - 10, baseOrders + 20)
    for (let i = 0; i < monthOrders; i++) {
      const orderDate = randomDate(
        new Date(oneYearAgo.getFullYear(), oneYearAgo.getMonth() + month, 1),
        new Date(oneYearAgo.getFullYear(), oneYearAgo.getMonth() + month + 1, 0)
      )
      const dueDate = new Date(orderDate.getTime() + randomInt(7, 21) * 24 * 60 * 60 * 1000)
      const design = randomElement(designs)
      const partsCount = getDesignPartsCount(design)
      const isRecent = month >= 10
      const isCompleted = !isRecent || Math.random() > 0.3
      
      ordersData.push({
        orderNumber: `ORD-Y2-${String(orderNum++).padStart(5, '0')}`,
        customerName: randomElement(CUSTOMERS),
        designId: design.id,
        status: isCompleted ? 'Completed' : randomElement(['Pending', 'Cutting', 'Drilling', 'Edge Banding', 'Assembly']),
        totalPanels: partsCount,
        completedPanels: isCompleted ? partsCount : randomInt(0, partsCount - 1),
        orderDate: orderDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        priority: randomElement(['Low', 'Medium', 'High', 'Urgent']),
        createdBy: randomElement(users).id
      })
    }
  }
  
  // Batch insert orders
  console.log(`Inserting ${ordersData.length} orders...`)
  for (let i = 0; i < ordersData.length; i += 500) {
    await ProductionOrder.bulkCreate(ordersData.slice(i, i + 500), { ignoreDuplicates: true })
    console.log(`  Inserted orders ${i + 1} to ${Math.min(i + 500, ordersData.length)}`)
  }
  const orders = await ProductionOrder.findAll()
  console.log(`Total orders: ${orders.length}`)

  // Create part tracking records and production plans for completed orders
  console.log('Creating part tracking records and production plans...')
  const trackingData = []
  const plansData = []
  const completedOrders = orders.filter(o => o.status === 'Completed').slice(0, 200) // Limit for faster seeding
  
  for (const order of completedOrders) {
    // Get design parts for this order
    const design = designs.find(d => d.id === order.designId)
    const numParts = design ? getDesignPartsCount(design) : (order.totalPanels || 5)
    const orderDate = new Date(order.orderDate)
    
    for (let p = 0; p < Math.min(numParts, 15); p++) { // Cap at 15 parts per order for performance
      const partId = `${order.orderNumber}-P${String(p + 1).padStart(3, '0')}`
      const partType = randomElement(PART_TYPES)
      const partDims = { w: randomInt(300, 800), h: randomInt(400, 1200), d: 18 }
      let currentTime = new Date(orderDate.getTime() + randomInt(1, 3) * 24 * 60 * 60 * 1000)
      
      // Create production plan for this part
      plansData.push({
        partId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        partName: `${partType} - ${order.orderNumber}`,
        partType,
        width: partDims.w,
        height: partDims.h,
        thickness: partDims.d || 18,
        material: design?.material || 'Oak',
        status: 'Completed',
        wallsawPlan: JSON.stringify({ cutLength: partDims.w, cutWidth: partDims.h, blade: '300mm', feedRate: 5 }),
        cncPlan: JSON.stringify({ programId: `CNC-${partId}`, drillHoles: randomInt(4, 12), estimatedTime: randomInt(2, 8) }),
        bandingPlan: JSON.stringify({ edges: ['top', 'bottom', 'left', 'right'].slice(0, randomInt(2, 4)), material: '22mm PVC', color: 'matching' }),
        packagingPlan: JSON.stringify({ boxSize: 'standard', protection: 'foam corners', label: order.orderNumber }),
        createdAt: currentTime.toISOString(),
        updatedAt: currentTime.toISOString()
      })
      
      // Track through each station
      for (const station of STATIONS) {
        trackingData.push({
          partId,
          partName: `${partType} Panel`,
          station,
          orderNumber: order.orderNumber,
          orderId: order.id,
          scannedBy: randomElement(users).id,
          scannedByName: `${randomElement(users).firstName} ${randomElement(users).lastName}`,
          scanTime: currentTime.toISOString(),
          createdAt: currentTime.toISOString(),
          updatedAt: currentTime.toISOString()
        })
        currentTime = new Date(currentTime.getTime() + randomInt(30, 240) * 60 * 1000) // 30 min to 4 hours between stations
      }
    }
  }
  
  console.log(`Inserting ${trackingData.length} tracking records...`)
  for (let i = 0; i < trackingData.length; i += 1000) {
    await PartTracking.bulkCreate(trackingData.slice(i, i + 1000), { ignoreDuplicates: true })
    console.log(`  Inserted tracking ${i + 1} to ${Math.min(i + 1000, trackingData.length)}`)
  }
  
  console.log(`Generated ${plansData.length} production plans (stored in tracking data)`)

  // Add parts currently in production (at intermediate stations)
  console.log('Adding parts at intermediate stations...')
  const inProgressOrders = orders.filter(o => o.status !== 'Completed').slice(0, 30)
  const stationsInProgress = ['wallsaw', 'cnc', 'banding', 'packaging']
  
  for (const order of inProgressOrders) {
    const design = designs.find(d => d.id === order.designId)
    const numParts = Math.min(design ? getDesignPartsCount(design) : (order.totalPanels || 5), 8)
    
    for (let p = 0; p < numParts; p++) {
      const partId = `${order.orderNumber}-P${String(p + 1).padStart(3, '0')}`
      const partType = randomElement(PART_TYPES)
      // Distribute parts across different stations
      const stationIndex = p % stationsInProgress.length
      const station = stationsInProgress[stationIndex]
      
      trackingData.push({
        partId,
        partName: `${partType} Panel`,
        station,
        orderNumber: order.orderNumber,
        orderId: order.id,
        scannedBy: randomElement(users).id,
        scannedByName: `${randomElement(users).firstName} ${randomElement(users).lastName}`,
        scanTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
  }
  
  // Insert the in-progress tracking records
  console.log(`Adding ${inProgressOrders.length * 6} in-progress parts...`)
  await PartTracking.bulkCreate(trackingData.slice(-inProgressOrders.length * 8), { ignoreDuplicates: true })

  // Create user actions (activity tracking) - reduced for faster seeding
  console.log('Creating user actions...')
  const actionsData = []
  const actionTypes = ['create', 'update', 'view', 'scan', 'move', 'login', 'other']
  const entityTypes = ['order', 'design', 'part', 'user', 'report', 'machine']
  
  for (let day = 0; day < 730; day += 7) { // Sample weekly instead of daily for speed
    const actionDate = new Date(twoYearsAgo.getTime() + day * 24 * 60 * 60 * 1000)
    const dailyActions = randomInt(20, 50) // Reduced actions per sample
    
    for (let a = 0; a < dailyActions; a++) {
      const actionTime = new Date(actionDate.getTime() + randomInt(8, 18) * 60 * 60 * 1000 + randomInt(0, 59) * 60 * 1000)
      const user = randomElement(users)
      const actionType = randomElement(actionTypes)
      const entityType = randomElement(entityTypes)
      actionsData.push({
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: user.role,
        action: `${actionType} ${entityType}`,
        actionType: actionType,
        entityType: entityType,
        entityId: null,
        entityName: `${entityType}-${randomInt(1, 1000)}`,
        page: randomElement(['dashboard', 'production', 'designs', 'inventory', 'floor', 'reports', 'settings']),
        details: { source: 'historical_seed' },
        ipAddress: `192.168.1.${randomInt(1, 254)}`,
        createdAt: actionTime.toISOString()
      })
    }
  }
  
  console.log(`Inserting ${actionsData.length} user actions...`)
  if (UserAction) {
    for (let i = 0; i < actionsData.length; i += 2000) {
      await UserAction.bulkCreate(actionsData.slice(i, i + 2000), { ignoreDuplicates: true })
      console.log(`  Inserted actions ${i + 1} to ${Math.min(i + 2000, actionsData.length)}`)
    }
  }

  // Create quality defects - skip if Panel model not available or no panels exist
  console.log('Creating quality defects...')
  try {
    // First create some panels for defects to reference
    const panelsData = []
    for (let i = 0; i < 50; i++) {
      panelsData.push({
        panelNumber: `PNL-DEF-${String(i + 1).padStart(4, '0')}`,
        status: 'Completed'
      })
    }
    await Panel.bulkCreate(panelsData, { ignoreDuplicates: true })
    const panels = await Panel.findAll({ limit: 50 })
    
    if (panels.length > 0) {
      const defectsData = []
      const defectCount = randomInt(50, 100)
      
      for (let i = 0; i < defectCount; i++) {
        const defectDate = randomDate(twoYearsAgo, now)
        const isResolved = defectDate < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        
        defectsData.push({
          panelId: randomElement(panels).id,
          defectType: randomElement(DEFECT_TYPES),
          severity: randomElement(SEVERITIES),
          status: isResolved ? 'Resolved' : randomElement(['Open', 'In Rework']),
          description: `Defect found during ${randomElement(['cutting', 'drilling', 'banding', 'assembly', 'QC'])} process`,
          detectedBy: randomElement(users).id,
          detectedByName: `${randomElement(users).firstName} ${randomElement(users).lastName}`,
          createdAt: defectDate.toISOString(),
          updatedAt: defectDate.toISOString()
        })
      }
      await QualityDefect.bulkCreate(defectsData, { ignoreDuplicates: true })
      console.log(`Quality defects: ${defectsData.length}`)
    }
  } catch (e) {
    console.log(`Skipping quality defects: ${e.message}`)
  }

  // Create inventory parts with realistic stock levels
  console.log('Creating inventory parts...')
  const inventoryData = [
    { partNumber: 'MAT-001', name: 'Oak Plywood 18mm', category: 'Materials', quantity: 145, minQuantity: 50, maxQuantity: 200, unit: 'sheets', unitCost: 85.00, status: 'In Stock' },
    { partNumber: 'MAT-002', name: 'MDF 16mm', category: 'Materials', quantity: 89, minQuantity: 40, maxQuantity: 150, unit: 'sheets', unitCost: 42.00, status: 'In Stock' },
    { partNumber: 'MAT-003', name: 'Maple Veneer 3mm', category: 'Materials', quantity: 67, minQuantity: 30, maxQuantity: 100, unit: 'sheets', unitCost: 55.00, status: 'In Stock' },
    { partNumber: 'MAT-004', name: 'Walnut Plywood 18mm', category: 'Materials', quantity: 23, minQuantity: 25, maxQuantity: 80, unit: 'sheets', unitCost: 120.00, status: 'Low Stock' },
    { partNumber: 'MAT-005', name: 'Cherry Veneer 3mm', category: 'Materials', quantity: 45, minQuantity: 20, maxQuantity: 60, unit: 'sheets', unitCost: 95.00, status: 'In Stock' },
    { partNumber: 'MAT-006', name: 'Plywood 12mm', category: 'Materials', quantity: 78, minQuantity: 30, maxQuantity: 120, unit: 'sheets', unitCost: 38.00, status: 'In Stock' },
    { partNumber: 'HW-001', name: 'Soft Close Hinges', category: 'Hardware', quantity: 1250, minQuantity: 500, maxQuantity: 2000, unit: 'pcs', unitCost: 3.50, status: 'In Stock' },
    { partNumber: 'HW-002', name: 'Drawer Slides 450mm', category: 'Hardware', quantity: 180, minQuantity: 100, maxQuantity: 400, unit: 'pairs', unitCost: 18.00, status: 'In Stock' },
    { partNumber: 'HW-003', name: 'Cabinet Handles Chrome', category: 'Hardware', quantity: 520, minQuantity: 200, maxQuantity: 800, unit: 'pcs', unitCost: 5.50, status: 'In Stock' },
    { partNumber: 'HW-004', name: 'Cam Locks', category: 'Hardware', quantity: 2100, minQuantity: 1000, maxQuantity: 3000, unit: 'pcs', unitCost: 0.45, status: 'In Stock' },
    { partNumber: 'HW-005', name: 'Shelf Supports', category: 'Hardware', quantity: 890, minQuantity: 500, maxQuantity: 1500, unit: 'pcs', unitCost: 0.25, status: 'In Stock' },
    { partNumber: 'HW-006', name: 'Drawer Slides 550mm', category: 'Hardware', quantity: 45, minQuantity: 80, maxQuantity: 300, unit: 'pairs', unitCost: 22.00, status: 'Critical' },
    { partNumber: 'FIN-001', name: 'Wood Stain Oak', category: 'Finishing', quantity: 35, minQuantity: 15, maxQuantity: 50, unit: 'liters', unitCost: 28.00, status: 'In Stock' },
    { partNumber: 'FIN-002', name: 'Clear Lacquer', category: 'Finishing', quantity: 28, minQuantity: 20, maxQuantity: 60, unit: 'liters', unitCost: 45.00, status: 'In Stock' },
    { partNumber: 'FIN-003', name: 'Edge Banding Oak 22mm', category: 'Finishing', quantity: 450, minQuantity: 200, maxQuantity: 600, unit: 'meters', unitCost: 1.20, status: 'In Stock' },
    { partNumber: 'FIN-004', name: 'Edge Banding White 22mm', category: 'Finishing', quantity: 180, minQuantity: 150, maxQuantity: 500, unit: 'meters', unitCost: 0.80, status: 'Low Stock' },
  ]
  await InventoryPart.bulkCreate(inventoryData, { ignoreDuplicates: true })
  const inventoryParts = await InventoryPart.findAll()
  console.log(`Inventory parts: ${inventoryParts.length}`)
  
  // Create inventory transactions for material usage (wallsaw cuts)
  console.log('Creating inventory transactions for material usage...')
  const transactionsData = []
  const materialParts = inventoryParts.filter(p => p.category === 'Materials')
  
  // Simulate material usage over 2 years based on completed orders
  for (const order of completedOrders.slice(0, 100)) {
    const design = designs.find(d => d.id === order.designId)
    const material = design?.material || 'Oak'
    const matchingPart = materialParts.find(p => p.name.toLowerCase().includes(material.toLowerCase())) || materialParts[0]
    
    if (matchingPart) {
      const orderDate = new Date(order.orderDate)
      const partsUsed = Math.min(order.totalPanels || 6, 10) // Parts cut from slabs
      
      transactionsData.push({
        partId: matchingPart.id,
        transactionNumber: `TXN-${order.orderNumber}`,
        transactionType: 'OUT',
        quantity: partsUsed,
        previousQuantity: matchingPart.quantity,
        newQuantity: matchingPart.quantity - partsUsed,
        reason: `Wallsaw cut for order ${order.orderNumber}`,
        performedBy: randomElement(users).id,
        performedByName: `${randomElement(users).firstName} ${randomElement(users).lastName}`,
        createdAt: orderDate.toISOString()
      })
    }
  }
  
  // Add some restock transactions
  for (const part of materialParts) {
    for (let r = 0; r < randomInt(3, 8); r++) {
      const restockDate = randomDate(twoYearsAgo, now)
      const restockQty = randomInt(20, 50)
      transactionsData.push({
        partId: part.id,
        transactionNumber: `TXN-RESTOCK-${part.partNumber}-${r}`,
        transactionType: 'IN',
        quantity: restockQty,
        previousQuantity: part.quantity,
        newQuantity: part.quantity + restockQty,
        reason: 'Supplier delivery',
        performedBy: randomElement(users).id,
        performedByName: `${randomElement(users).firstName} ${randomElement(users).lastName}`,
        createdAt: restockDate.toISOString()
      })
    }
  }
  
  if (InventoryTransaction) {
    try {
      await InventoryTransaction.bulkCreate(transactionsData, { ignoreDuplicates: true })
      console.log(`Inventory transactions: ${transactionsData.length}`)
    } catch (e) {
      console.log(`Skipping inventory transactions: ${e.message}`)
    }
  }

  // Create machines with maintenance history
  console.log('Creating machines...')
  const machinesData = [
    { machineId: 'CNC-001', name: 'CNC Router 1', type: 'CNC Router', status: 'Running', operatingHours: 8520, uptimePercentage: 97.5, lastMaintenance: '2026-01-05', nextMaintenance: '2026-02-05' },
    { machineId: 'CNC-002', name: 'CNC Router 2', type: 'CNC Router', status: 'Running', operatingHours: 7890, uptimePercentage: 96.2, lastMaintenance: '2026-01-02', nextMaintenance: '2026-02-02' },
    { machineId: 'CNC-003', name: 'CNC Router 3', type: 'CNC Router', status: 'Idle', operatingHours: 5430, uptimePercentage: 94.8, lastMaintenance: '2025-12-20', nextMaintenance: '2026-01-20' },
    { machineId: 'EB-001', name: 'Edge Bander Pro', type: 'Edge Bander', status: 'Running', operatingHours: 6150, uptimePercentage: 95.1, lastMaintenance: '2025-12-28', nextMaintenance: '2026-01-28' },
    { machineId: 'EB-002', name: 'Edge Bander Standard', type: 'Edge Bander', status: 'Running', operatingHours: 4820, uptimePercentage: 93.7, lastMaintenance: '2026-01-10', nextMaintenance: '2026-02-10' },
    { machineId: 'PS-001', name: 'Panel Saw 1', type: 'Panel Saw', status: 'Running', operatingHours: 9200, uptimePercentage: 98.2, lastMaintenance: '2026-01-08', nextMaintenance: '2026-02-08' },
    { machineId: 'PS-002', name: 'Panel Saw 2', type: 'Panel Saw', status: 'Maintenance', operatingHours: 7650, uptimePercentage: 91.5, lastMaintenance: '2026-01-15', nextMaintenance: '2026-02-15' },
    { machineId: 'DR-001', name: 'Drilling Machine 1', type: 'Drill Press', status: 'Running', operatingHours: 5890, uptimePercentage: 96.8, lastMaintenance: '2025-12-15', nextMaintenance: '2026-01-15' },
  ]
  await Machine.bulkCreate(machinesData, { ignoreDuplicates: true })
  console.log(`Machines: ${machinesData.length}`)

  // Create production stations
  await ProductionStation.bulkCreate([
    { stationName: 'Wallsaw Station 1', stationType: 'Cutting', location: 'Building A', operatorName: 'John Smith', uptimePercentage: 98 },
    { stationName: 'Wallsaw Station 2', stationType: 'Cutting', location: 'Building A', operatorName: 'Mike Johnson', uptimePercentage: 96 },
    { stationName: 'CNC Station 1', stationType: 'Drilling', location: 'Building A', operatorName: 'Jane Doe', uptimePercentage: 97 },
    { stationName: 'CNC Station 2', stationType: 'Drilling', location: 'Building A', operatorName: 'Tom Brown', uptimePercentage: 95 },
    { stationName: 'Edge Banding 1', stationType: 'Edge Banding', location: 'Building B', operatorName: 'Sarah Wilson', uptimePercentage: 96 },
    { stationName: 'Edge Banding 2', stationType: 'Edge Banding', location: 'Building B', operatorName: 'Lisa Chen', uptimePercentage: 94 },
    { stationName: 'Assembly Station', stationType: 'Assembly', location: 'Building C', operatorName: 'David Lee', uptimePercentage: 99 },
  ], { ignoreDuplicates: true })

  console.log('Historical data seed completed!')
  return { 
    message: `Seeded 2 years of data: ${orders.length} orders, ${trackingData.length} tracking records, ${actionsData.length} user actions` 
  }
}

export default seedHistoricalData
