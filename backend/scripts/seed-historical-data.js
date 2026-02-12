import { sequelize, User, CabinetDesign, ProductionOrder, InventoryPart, Machine, QualityDefect, PartTracking, UserAction, CostEstimate, Customer, Supplier } from '../models/index.js'

// Configuration
const START_DATE = new Date('2023-01-01')
const END_DATE = new Date('2025-01-15')
const DAYS_SPAN = Math.floor((END_DATE - START_DATE) / (1000 * 60 * 60 * 24))

// Helper functions
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateOrderNumber(date, index) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `ORD-${year}${month}-${String(index).padStart(4, '0')}`
}

// Seasonal multipliers (cabinet orders vary by season)
function getSeasonalMultiplier(month) {
  const multipliers = {
    0: 0.7,  // January - slow
    1: 0.8,  // February
    2: 1.0,  // March - picking up
    3: 1.2,  // April - spring renovation
    4: 1.3,  // May - peak
    5: 1.2,  // June
    6: 0.9,  // July - summer slowdown
    7: 0.8,  // August
    8: 1.1,  // September - fall pickup
    9: 1.2,  // October
    10: 1.0, // November
    11: 0.6  // December - holiday slow
  }
  return multipliers[month] || 1.0
}

// Cabinet types and their base prices
const CABINET_TYPES = [
  { name: 'Base Cabinet', basePrice: 450, laborHours: 4 },
  { name: 'Wall Cabinet', basePrice: 350, laborHours: 3 },
  { name: 'Tall Cabinet', basePrice: 650, laborHours: 6 },
  { name: 'Corner Cabinet', basePrice: 550, laborHours: 5 },
  { name: 'Drawer Base', basePrice: 500, laborHours: 5 },
  { name: 'Sink Base', basePrice: 480, laborHours: 4.5 },
  { name: 'Pantry Cabinet', basePrice: 750, laborHours: 7 },
  { name: 'Island Cabinet', basePrice: 900, laborHours: 8 },
  { name: 'Vanity Cabinet', basePrice: 400, laborHours: 3.5 },
  { name: 'Bookshelf Unit', basePrice: 380, laborHours: 3 }
]

const MATERIALS = ['MDF 18mm', 'Plywood 18mm', 'Particle Board 18mm', 'Solid Oak', 'Solid Walnut', 'Melamine 18mm']
const FINISHES = ['White Matte', 'White Gloss', 'Natural Oak', 'Dark Walnut', 'Gray Matte', 'Black Matte', 'Custom Color']
const ORDER_STATUSES = ['Completed', 'Completed', 'Completed', 'Completed', 'Cutting', 'In Progress', 'Pending']
const DEFECT_TYPES = ['Scratch', 'Dent', 'Chip', 'Color Mismatch', 'Dimension Error', 'Hardware Issue', 'Edge Banding', 'Surface Defect']
const DEFECT_SEVERITIES = ['Low', 'Low', 'Medium', 'Medium', 'High']
const STATIONS = ['wallsaw', 'cnc', 'banding', 'packaging', 'complete']

// Customer names for realistic data
const CUSTOMER_FIRST_NAMES = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'Robert', 'Jennifer', 'William', 'Amanda', 'James', 'Jessica', 'Thomas', 'Ashley', 'Daniel', 'Nicole', 'Christopher', 'Stephanie', 'Matthew', 'Melissa']
const CUSTOMER_LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris']

async function seedHistoricalData() {
  console.log('🌱 Starting historical data seed...')
  console.log(`📅 Date range: ${START_DATE.toDateString()} to ${END_DATE.toDateString()} (${DAYS_SPAN} days)`)
  
  try {
    await sequelize.authenticate()
    console.log('✅ Database connected')

    // Get existing users
    const users = await User.findAll()
    if (users.length === 0) {
      console.log('❌ No users found. Please run the main seed first.')
      return
    }
    console.log(`👥 Found ${users.length} users`)

    // Get existing machines
    let machines = await Machine.findAll()
    if (machines.length === 0) {
      console.log('🔧 Creating machines...')
      machines = await Machine.bulkCreate([
        { name: 'Wall Saw 1', type: 'wallsaw', status: 'Active', location: 'Bay 1' },
        { name: 'Wall Saw 2', type: 'wallsaw', status: 'Active', location: 'Bay 2' },
        { name: 'CNC Router 1', type: 'cnc', status: 'Active', location: 'Bay 3' },
        { name: 'CNC Router 2', type: 'cnc', status: 'Active', location: 'Bay 4' },
        { name: 'Edge Bander 1', type: 'banding', status: 'Active', location: 'Bay 5' },
        { name: 'Edge Bander 2', type: 'banding', status: 'Maintenance', location: 'Bay 6' },
        { name: 'Packaging Station 1', type: 'packaging', status: 'Active', location: 'Bay 7' }
      ])
    }
    console.log(`🔧 ${machines.length} machines available`)

    // Create customers
    console.log('👤 Creating customers...')
    const customers = []
    for (let i = 0; i < 150; i++) {
      const firstName = randomElement(CUSTOMER_FIRST_NAMES)
      const lastName = randomElement(CUSTOMER_LAST_NAMES)
      customers.push({
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
        phone: `+1${randomInt(200, 999)}${randomInt(100, 999)}${randomInt(1000, 9999)}`,
        address: `${randomInt(100, 9999)} ${randomElement(['Oak', 'Maple', 'Pine', 'Cedar', 'Elm'])} ${randomElement(['Street', 'Avenue', 'Road', 'Lane', 'Drive'])}`,
        city: randomElement(['Amsterdam', 'Rotterdam', 'Utrecht', 'The Hague', 'Eindhoven', 'Groningen']),
        status: 'Active',
        createdAt: randomDate(START_DATE, END_DATE)
      })
    }
    await Customer.bulkCreate(customers, { ignoreDuplicates: true }).catch(() => {})
    console.log(`✅ Created ${customers.length} customers`)

    // Generate orders by month
    console.log('📦 Generating production orders...')
    let totalOrders = 0
    let totalRevenue = 0
    let totalCost = 0
    const ordersByMonth = {}
    const revenueByMonth = {}
    const costByMonth = {}

    // Process each month
    const currentDate = new Date(START_DATE)
    while (currentDate < END_DATE) {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
      
      // Base orders per month with seasonal variation
      const baseOrdersPerMonth = 45
      const seasonalMultiplier = getSeasonalMultiplier(month)
      const yearGrowth = 1 + ((year - 2023) * 0.15) // 15% YoY growth
      const ordersThisMonth = Math.floor(baseOrdersPerMonth * seasonalMultiplier * yearGrowth * randomFloat(0.8, 1.2))
      
      ordersByMonth[monthKey] = ordersThisMonth
      revenueByMonth[monthKey] = 0
      costByMonth[monthKey] = 0

      // Generate orders for this month
      for (let i = 0; i < ordersThisMonth; i++) {
        const orderDate = new Date(year, month, randomInt(1, 28))
        const cabinetType = randomElement(CABINET_TYPES)
        const quantity = randomInt(1, 12)
        const material = randomElement(MATERIALS)
        const finish = randomElement(FINISHES)
        
        // Calculate pricing with some variation
        const materialMultiplier = material.includes('Solid') ? 1.8 : material.includes('Plywood') ? 1.2 : 1.0
        const unitPrice = cabinetType.basePrice * materialMultiplier * randomFloat(0.9, 1.15)
        const totalPrice = unitPrice * quantity
        const laborCost = cabinetType.laborHours * quantity * 45 // $45/hour labor
        const materialCost = totalPrice * 0.35
        const overheadCost = totalPrice * 0.1
        const totalCostForOrder = laborCost + materialCost + overheadCost
        const profit = totalPrice - totalCostForOrder

        // Determine status based on date
        const daysSinceOrder = Math.floor((END_DATE - orderDate) / (1000 * 60 * 60 * 24))
        let status
        if (daysSinceOrder > 30) {
          status = 'Completed'
        } else if (daysSinceOrder > 14) {
          status = randomElement(['Completed', 'Completed', 'Cutting'])
        } else if (daysSinceOrder > 7) {
          status = randomElement(['Cutting', 'In Progress', 'Pending'])
        } else {
          status = randomElement(['Pending', 'Draft', 'In Progress'])
        }

        const orderNumber = generateOrderNumber(orderDate, totalOrders + 1)
        const customer = randomElement(customers)

        try {
          // Create design
          const design = await CabinetDesign.create({
            name: `${cabinetType.name} - ${customer.name}`,
            description: `${quantity}x ${cabinetType.name} in ${material} with ${finish} finish`,
            width: randomInt(300, 1200),
            height: randomInt(600, 2400),
            depth: randomInt(300, 600),
            material: material,
            finish: finish,
            status: 'Approved',
            createdBy: randomElement(users).id,
            createdAt: orderDate
          })

          // Create production order
          const order = await ProductionOrder.create({
            orderNumber: orderNumber,
            designId: design.id,
            customerName: customer.name,
            status: status,
            priority: randomElement(['Normal', 'Normal', 'Normal', 'High', 'Rush']),
            totalPanels: quantity * randomInt(4, 8),
            completedPanels: status === 'Completed' ? quantity * randomInt(4, 8) : randomInt(0, quantity * 4),
            dueDate: new Date(orderDate.getTime() + randomInt(7, 30) * 24 * 60 * 60 * 1000),
            notes: `${cabinetType.name} order for ${customer.name}`,
            createdAt: orderDate,
            updatedAt: status === 'Completed' ? new Date(orderDate.getTime() + randomInt(5, 25) * 24 * 60 * 60 * 1000) : orderDate
          })

          // Create cost estimate
          await CostEstimate.create({
            designId: design.id,
            materialCost: materialCost,
            laborCost: laborCost,
            overheadCost: overheadCost,
            totalCost: totalPrice,
            profitMargin: ((profit / totalPrice) * 100).toFixed(1),
            validUntil: new Date(orderDate.getTime() + 30 * 24 * 60 * 60 * 1000),
            createdAt: orderDate
          }).catch(() => {})

          // Create part tracking records for completed orders
          if (status === 'Completed' || status === 'Cutting') {
            const numParts = randomInt(3, 8)
            for (let p = 0; p < numParts; p++) {
              const partDate = new Date(orderDate.getTime() + randomInt(1, 20) * 24 * 60 * 60 * 1000)
              await PartTracking.create({
                orderId: order.id,
                partId: `${orderNumber}-P${p + 1}`,
                partName: `Part ${p + 1}`,
                station: status === 'Completed' ? 'complete' : randomElement(STATIONS),
                status: status === 'Completed' ? 'Complete' : 'In Progress',
                scannedBy: randomElement(users).id.toString(),
                scanTime: partDate,
                createdAt: partDate
              }).catch(() => {})
            }
          }

          // Create quality defects (about 5% of orders have defects)
          if (Math.random() < 0.05 && status === 'Completed') {
            await QualityDefect.create({
              orderId: order.id,
              defectType: randomElement(DEFECT_TYPES),
              severity: randomElement(DEFECT_SEVERITIES),
              description: `Defect found during ${randomElement(['cutting', 'assembly', 'finishing', 'inspection'])}`,
              status: randomElement(['Resolved', 'Resolved', 'Resolved', 'Open']),
              reportedBy: randomElement(users).id,
              createdAt: new Date(orderDate.getTime() + randomInt(3, 15) * 24 * 60 * 60 * 1000)
            }).catch(() => {})
          }

          totalOrders++
          totalRevenue += totalPrice
          totalCost += totalCostForOrder
          revenueByMonth[monthKey] += totalPrice
          costByMonth[monthKey] += totalCostForOrder

        } catch (error) {
          // Skip duplicate orders
        }
      }

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    console.log(`✅ Created ${totalOrders} production orders`)
    console.log(`💰 Total Revenue: €${totalRevenue.toLocaleString()}`)
    console.log(`📊 Total Cost: €${totalCost.toLocaleString()}`)
    console.log(`📈 Total Profit: €${(totalRevenue - totalCost).toLocaleString()}`)

    // Create user actions for activity tracking
    console.log('📝 Creating user actions...')
    const actionTypes = ['view', 'create', 'update', 'scan', 'move', 'login']
    const actionCount = 5000
    for (let i = 0; i < actionCount; i++) {
      const actionDate = randomDate(START_DATE, END_DATE)
      const user = randomElement(users)
      await UserAction.create({
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        action: randomElement(actionTypes),
        details: `${randomElement(actionTypes)} action on ${randomElement(['order', 'design', 'part', 'machine', 'inventory'])}`,
        station: randomElement([...STATIONS, null, null]),
        createdAt: actionDate
      }).catch(() => {})
    }
    console.log(`✅ Created ${actionCount} user actions`)

    // Create inventory transactions
    console.log('📦 Creating inventory data...')
    const inventoryItems = [
      { name: 'MDF 18mm Sheet', category: 'Sheet Material', unit: 'sheet', basePrice: 45 },
      { name: 'Plywood 18mm Sheet', category: 'Sheet Material', unit: 'sheet', basePrice: 65 },
      { name: 'Edge Banding White 2mm', category: 'Edge Banding', unit: 'roll', basePrice: 25 },
      { name: 'Edge Banding Oak 2mm', category: 'Edge Banding', unit: 'roll', basePrice: 35 },
      { name: 'Hinges Soft-Close', category: 'Hardware', unit: 'pair', basePrice: 8 },
      { name: 'Drawer Slides 500mm', category: 'Hardware', unit: 'pair', basePrice: 22 },
      { name: 'Shelf Pins', category: 'Hardware', unit: 'pack', basePrice: 5 },
      { name: 'Wood Screws 4x40', category: 'Fasteners', unit: 'box', basePrice: 12 },
      { name: 'Dowels 8mm', category: 'Fasteners', unit: 'pack', basePrice: 8 },
      { name: 'Wood Glue PVA', category: 'Adhesives', unit: 'bottle', basePrice: 15 }
    ]

    for (const item of inventoryItems) {
      await InventoryPart.findOrCreate({
        where: { name: item.name },
        defaults: {
          ...item,
          quantity: randomInt(50, 500),
          minQuantity: randomInt(20, 50),
          location: `Warehouse ${randomElement(['A', 'B', 'C'])}-${randomInt(1, 10)}`,
          status: 'In Stock'
        }
      })
    }
    console.log(`✅ Created ${inventoryItems.length} inventory items`)

    // Print monthly summary
    console.log('\n📊 Monthly Summary:')
    console.log('Month\t\tOrders\tRevenue\t\tCost\t\tProfit')
    console.log('─'.repeat(70))
    
    Object.keys(ordersByMonth).sort().forEach(month => {
      const orders = ordersByMonth[month]
      const revenue = revenueByMonth[month]
      const cost = costByMonth[month]
      const profit = revenue - cost
      console.log(`${month}\t\t${orders}\t€${Math.round(revenue).toLocaleString()}\t\t€${Math.round(cost).toLocaleString()}\t\t€${Math.round(profit).toLocaleString()}`)
    })

    console.log('\n✅ Historical data seed completed!')
    
  } catch (error) {
    console.error('❌ Error seeding data:', error)
  } finally {
    await sequelize.close()
  }
}

// Run the seed
seedHistoricalData()
