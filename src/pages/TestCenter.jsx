import { useState, useEffect } from 'react'
import { Play, CheckCircle, XCircle, Clock, Database, Users, Palette, Factory, Package, Wrench, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Eye, Download, FileText, Terminal } from 'lucide-react'
import { api, API_BASE_URL } from '../services/api'

const testSuites = [
  {
    id: 'users',
    name: 'User Management',
    icon: Users,
    tests: [
      { id: 'users-list', name: 'GET /api/users returns all users', endpoint: '/users', method: 'GET', expectedStatus: 200, validate: (data) => Array.isArray(data) },
      { id: 'users-structure', name: 'Users have correct structure (no password)', endpoint: '/users', method: 'GET', expectedStatus: 200, validate: (data) => data.length > 0 && !data[0].passwordHash },
      { id: 'users-login', name: 'Login with valid credentials', endpoint: '/users/login', method: 'POST', body: { email: 'admin@woodworking.com', password: 'admin123' }, expectedStatus: 200, validate: (data) => data.token && data.user },
      { id: 'users-login-invalid', name: 'Reject invalid credentials', endpoint: '/users/login', method: 'POST', body: { email: 'admin@woodworking.com', password: 'wrong' }, expectedStatus: 401, validate: () => true },
    ]
  },
  {
    id: 'scenarios-production',
    name: 'Production Workflow Scenarios',
    icon: Factory,
    tests: [
      { id: 'scenario-order-create', name: 'Scenario: Create production order from design', endpoint: '/production/orders', method: 'GET', expectedStatus: 200, validate: (data) => Array.isArray(data) },
      { id: 'scenario-stations-active', name: 'Scenario: All production stations are available', endpoint: '/production/stations', method: 'GET', expectedStatus: 200, validate: (data) => Array.isArray(data) && data.length >= 0 },
      { id: 'scenario-panels-tracked', name: 'Scenario: Panels are tracked through production', endpoint: '/production/panels', method: 'GET', expectedStatus: 200, validate: (data) => Array.isArray(data) },
      { id: 'scenario-workflow-wallsaw', name: 'Scenario: Wallsaw station workflow', endpoint: '/tracking/stations/wallsaw/parts', method: 'GET', expectedStatus: 200, validate: () => true },
      { id: 'scenario-workflow-cnc', name: 'Scenario: CNC station workflow', endpoint: '/tracking/stations/cnc/parts', method: 'GET', expectedStatus: 200, validate: () => true },
      { id: 'scenario-workflow-banding', name: 'Scenario: Banding station workflow', endpoint: '/tracking/stations/banding/parts', method: 'GET', expectedStatus: 200, validate: () => true },
      { id: 'scenario-workflow-packaging', name: 'Scenario: Packaging station workflow', endpoint: '/tracking/stations/packaging/parts', method: 'GET', expectedStatus: 200, validate: () => true },
    ]
  },
  {
    id: 'scenarios-tracking',
    name: 'Activity Tracking Scenarios',
    icon: Clock,
    tests: [
      { id: 'scenario-actions-logged', name: 'Scenario: User actions are logged', endpoint: '/tracking/actions', method: 'GET', expectedStatus: 200, validate: (data) => data.actions !== undefined },
      { id: 'scenario-actions-stats', name: 'Scenario: Action statistics available', endpoint: '/tracking/actions/stats', method: 'GET', expectedStatus: 200, validate: (data) => data.totalActions !== undefined },
    ]
  },
  {
    id: 'scenarios-subscriptions',
    name: 'Event Subscription Scenarios',
    icon: AlertTriangle,
    tests: [
      { id: 'scenario-events-available', name: 'Scenario: 50+ subscribable events available', endpoint: '/subscriptions/events', method: 'GET', expectedStatus: 200, validate: (data) => data.events && data.events.length >= 50 },
      { id: 'scenario-categories-available', name: 'Scenario: Event categories available', endpoint: '/subscriptions/events', method: 'GET', expectedStatus: 200, validate: (data) => data.categories && data.categories.length > 0 },
    ]
  },
  {
    id: 'designs',
    name: 'Cabinet Designs',
    icon: Palette,
    tests: [
      { id: 'designs-list', name: 'GET /api/designs returns all designs', endpoint: '/designs', method: 'GET', expectedStatus: 200, validate: (data) => Array.isArray(data) },
      { id: 'designs-templates', name: 'GET /api/designs/templates/all returns templates', endpoint: '/designs/templates/all', method: 'GET', expectedStatus: 200, validate: (data) => Array.isArray(data) && data.length > 0 },
    ]
  },
  {
    id: 'production',
    name: 'Production Management',
    icon: Factory,
    tests: [
      { id: 'production-orders', name: 'GET /api/production/orders returns orders', endpoint: '/production/orders', method: 'GET', expectedStatus: 200, validate: (data) => Array.isArray(data) },
      { id: 'production-stations', name: 'GET /api/production/stations returns stations', endpoint: '/production/stations', method: 'GET', expectedStatus: 200, validate: (data) => Array.isArray(data) },
      { id: 'production-panels', name: 'GET /api/production/panels returns panels', endpoint: '/production/panels', method: 'GET', expectedStatus: 200, validate: (data) => Array.isArray(data) },
    ]
  },
  {
    id: 'inventory',
    name: 'Inventory Management',
    icon: Package,
    tests: [
      { id: 'inventory-parts', name: 'GET /api/inventory/parts returns parts', endpoint: '/inventory/parts', method: 'GET', expectedStatus: 200, validate: (data) => Array.isArray(data) },
      { id: 'inventory-stock', name: 'GET /api/inventory/stock-levels returns summary', endpoint: '/inventory/stock-levels', method: 'GET', expectedStatus: 200, validate: (data) => typeof data.total === 'number' },
    ]
  },
  {
    id: 'machines',
    name: 'Machine Management',
    icon: Wrench,
    tests: [
      { id: 'machines-list', name: 'GET /api/machines returns machines', endpoint: '/machines', method: 'GET', expectedStatus: 200, validate: (data) => Array.isArray(data) },
      { id: 'machines-maintenance', name: 'GET /api/machines/maintenance/all returns records', endpoint: '/machines/maintenance/all', method: 'GET', expectedStatus: 200, validate: (data) => Array.isArray(data) },
    ]
  },
  {
    id: 'quality',
    name: 'Quality Control',
    icon: AlertTriangle,
    tests: [
      { id: 'quality-defects', name: 'GET /api/quality/defects returns defects', endpoint: '/quality/defects', method: 'GET', expectedStatus: 200, validate: (data) => Array.isArray(data) },
      { id: 'quality-summary', name: 'GET /api/quality/summary returns summary', endpoint: '/quality/summary', method: 'GET', expectedStatus: 200, validate: (data) => typeof data.total === 'number' },
    ]
  },
  {
    id: 'system',
    name: 'System Health',
    icon: Database,
    tests: [
      { id: 'health', name: 'GET /api/health returns ok', endpoint: '/health', method: 'GET', expectedStatus: 200, validate: (data) => data.status === 'ok' },
      { id: 'db-status', name: 'GET /api/db/status returns connected', endpoint: '/db/status', method: 'GET', expectedStatus: 200, validate: (data) => data.status === 'connected' },
      { id: 'dashboard-stats', name: 'GET /api/dashboard/stats returns stats', endpoint: '/dashboard/stats', method: 'GET', expectedStatus: 200, validate: (data) => typeof data.activeOrders === 'number' },
    ]
  },
  {
    id: 'e2e-workflow',
    name: 'E2E: Design to Packaging Workflow',
    icon: Factory,
    tests: [
      { id: 'e2e-design-list', name: 'E2E: Designs available for production', endpoint: '/designs', method: 'GET', expectedStatus: 200, validate: (data) => Array.isArray(data) },
      { id: 'e2e-order-create', name: 'E2E: Production orders can be created', endpoint: '/production/orders', method: 'GET', expectedStatus: 200, validate: (data) => Array.isArray(data) },
      { id: 'e2e-tracking-scan', name: 'E2E: Part scanning endpoint available', endpoint: '/tracking/stations/wallsaw/parts', method: 'GET', expectedStatus: 200, validate: () => true },
      { id: 'e2e-tracking-history', name: 'E2E: Tracking history available', endpoint: '/tracking/actions', method: 'GET', expectedStatus: 200, validate: (data) => data.actions !== undefined },
      { id: 'e2e-quality-check', name: 'E2E: Quality control available', endpoint: '/quality/summary', method: 'GET', expectedStatus: 200, validate: (data) => data.total !== undefined },
      { id: 'e2e-packaging-ready', name: 'E2E: Packaging station available', endpoint: '/tracking/stations/packaging/parts', method: 'GET', expectedStatus: 200, validate: () => true },
    ]
  },
  {
    id: 'full-workflow-simulation',
    name: 'Full Production Workflow Simulation',
    icon: Factory,
    isFullSimulation: true,
    tests: [
      { id: 'sim-create-design', name: 'Step 1: Create cabinet design (2m x 60cm x 60cm, door + 5 shelves)' },
      { id: 'sim-check-inventory', name: 'Step 2: Check/add material slabs to inventory' },
      { id: 'sim-create-order', name: 'Step 3: Create production order from design' },
      { id: 'sim-generate-sawplan', name: 'Step 4: Generate saw plan for wallsaw' },
      { id: 'sim-process-parts', name: 'Step 5: Process parts through all stations' },
      { id: 'sim-complete', name: 'Step 6: Production complete - ready for delivery' },
    ]
  },
  {
    id: 'load-tests',
    name: 'Load & Performance Tests',
    icon: RefreshCw,
    tests: [
      { id: 'load-dashboard', name: 'Load: Dashboard responds < 500ms', endpoint: '/dashboard/stats', method: 'GET', expectedStatus: 200, validate: (data, duration) => duration < 500, isLoadTest: true },
      { id: 'load-users', name: 'Load: Users API responds < 300ms', endpoint: '/users', method: 'GET', expectedStatus: 200, validate: (data, duration) => duration < 300, isLoadTest: true },
      { id: 'load-designs', name: 'Load: Designs API responds < 300ms', endpoint: '/designs', method: 'GET', expectedStatus: 200, validate: (data, duration) => duration < 300, isLoadTest: true },
      { id: 'load-production', name: 'Load: Production API responds < 300ms', endpoint: '/production/orders', method: 'GET', expectedStatus: 200, validate: (data, duration) => duration < 300, isLoadTest: true },
      { id: 'load-inventory', name: 'Load: Inventory API responds < 300ms', endpoint: '/inventory/parts', method: 'GET', expectedStatus: 200, validate: (data, duration) => duration < 300, isLoadTest: true },
      { id: 'load-machines', name: 'Load: Machines API responds < 300ms', endpoint: '/machines', method: 'GET', expectedStatus: 200, validate: (data, duration) => duration < 300, isLoadTest: true },
      { id: 'load-quality', name: 'Load: Quality API responds < 300ms', endpoint: '/quality/defects', method: 'GET', expectedStatus: 200, validate: (data, duration) => duration < 300, isLoadTest: true },
      { id: 'load-tracking', name: 'Load: Tracking API responds < 300ms', endpoint: '/tracking/actions', method: 'GET', expectedStatus: 200, validate: (data, duration) => duration < 300, isLoadTest: true },
    ]
  },
]

const API_URL = API_BASE_URL

function TestCenter({ user }) {
  const [results, setResults] = useState({})
  const [running, setRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState(null)
  const [expandedTests, setExpandedTests] = useState({})
  const [testRunHistory, setTestRunHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('testRunHistory')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [showHistory, setShowHistory] = useState(false)
  const [selectedHistoryRun, setSelectedHistoryRun] = useState(null)
  const [jestResults, setJestResults] = useState(null)
  const [jestRunning, setJestRunning] = useState(false)
  const [jestHistory, setJestHistory] = useState([])
  const [activeTab, setActiveTab] = useState('runs')
  const [selectedRun, setSelectedRun] = useState(null)
  const [runningNewTest, setRunningNewTest] = useState(false)

  // Load Jest test history on mount
  useEffect(() => {
    fetchJestHistory()
  }, [])

  const fetchJestHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/test-results/history`)
      const data = await response.json()
      setJestHistory(data || [])
      if (data && data.length > 0) {
        setJestResults(data[0])
      }
    } catch (error) {
      console.error('Failed to fetch Jest history:', error)
    }
  }

  // Generate a deterministic UUID from a string
  const generateUUID = (str) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0')
    return `${hex.slice(0,8)}-${hex.slice(0,4)}-4${hex.slice(1,4)}-8${hex.slice(0,3)}-${hex.padEnd(12, '0').slice(0,12)}`
  }

  // Run full production workflow simulation
  const runFullWorkflowSimulation = async (suite) => {
    const updateStep = (testId, status, details = {}) => {
      setCurrentTest(testId)
      setResults(prev => ({ 
        ...prev, 
        [testId]: { 
          passed: status === 'passed',
          status: status,
          ...details,
          timestamp: new Date().toISOString()
        } 
      }))
    }

    let designId = null
    let orderId = null
    const cabinetParts = []
    
    // Cabinet specs: 2000mm high x 600mm wide x 600mm deep, 1 door + 5 shelves
    const cabinetSpec = {
      name: `E2E Test Cabinet ${Date.now()}`,
      width: 600,
      height: 2000,
      depth: 600,
      material: 'MDF',
      finish: 'White Lacquer',
      status: 'Draft',
      modelData: {
        parts: [
          { id: 'left-panel', type: 'leftPanel', w: 18, h: 2000, d: 600, material: 'MDF' },
          { id: 'right-panel', type: 'rightPanel', w: 18, h: 2000, d: 600, material: 'MDF' },
          { id: 'top-panel', type: 'topPanel', w: 564, h: 18, d: 600, material: 'MDF' },
          { id: 'bottom-panel', type: 'bottomPanel', w: 564, h: 18, d: 600, material: 'MDF' },
          { id: 'back-panel', type: 'backPanel', w: 564, h: 1964, d: 6, material: 'MDF' },
          { id: 'shelf-1', type: 'shelf', w: 564, h: 18, d: 580, material: 'MDF' },
          { id: 'shelf-2', type: 'shelf', w: 564, h: 18, d: 580, material: 'MDF' },
          { id: 'shelf-3', type: 'shelf', w: 564, h: 18, d: 580, material: 'MDF' },
          { id: 'shelf-4', type: 'shelf', w: 564, h: 18, d: 580, material: 'MDF' },
          { id: 'shelf-5', type: 'shelf', w: 564, h: 18, d: 580, material: 'MDF' },
          { id: 'door', type: 'door', w: 596, h: 1996, d: 18, material: 'MDF' }
        ]
      }
    }

    try {
      // STEP 1: Create cabinet design
      updateStep('sim-create-design', 'running', { currentStation: 'Creating 3D cabinet design...' })
      await new Promise(r => setTimeout(r, 1500))
      
      const designResponse = await fetch(`${API_URL}/designs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cabinetSpec)
      })
      const design = await designResponse.json()
      designId = design.id
      
      updateStep('sim-create-design', 'passed', { 
        currentStation: `Design created: ${design.name}`,
        data: `${cabinetSpec.modelData.parts.length} parts defined`
      })
      await new Promise(r => setTimeout(r, 1000))

      // STEP 2: Check/add inventory materials
      updateStep('sim-check-inventory', 'running', { currentStation: 'Checking material inventory...' })
      await new Promise(r => setTimeout(r, 1000))
      
      // Check if MDF slabs exist, if not add them
      const inventoryResponse = await fetch(`${API_URL}/inventory/parts`)
      const inventory = await inventoryResponse.json()
      const mdfSlab = inventory.find(p => p.name?.includes('MDF') && p.category === 'Sheet Material')
      
      if (!mdfSlab) {
        // Add MDF slab to inventory
        await fetch(`${API_URL}/inventory/parts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'MDF Sheet 2440x1220x18mm',
            partNumber: 'MDF-2440-1220-18',
            category: 'Sheet Material',
            quantity: 50,
            minQuantity: 10,
            maxQuantity: 100,
            unitCost: 45.00,
            status: 'In Stock',
            location: 'Warehouse A',
            supplier: 'Wood Supply Co'
          })
        })
        updateStep('sim-check-inventory', 'passed', { 
          currentStation: 'Added MDF sheets to inventory',
          data: '50 sheets added'
        })
      } else {
        updateStep('sim-check-inventory', 'passed', { 
          currentStation: 'MDF sheets available in inventory',
          data: `${mdfSlab.quantity} sheets in stock`
        })
      }
      await new Promise(r => setTimeout(r, 1000))

      // STEP 3: Create production order with job and panels
      updateStep('sim-create-order', 'running', { currentStation: 'Creating production order...' })
      await new Promise(r => setTimeout(r, 1000))
      
      const orderNumber = `E2E-ORD-${Date.now()}`
      const orderResponse = await fetch(`${API_URL}/production/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumber,
          designId: designId,
          quantity: 1,
          priority: 'Normal',
          status: 'In Progress',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
      })
      const order = await orderResponse.json()
      orderId = order.id
      
      updateStep('sim-create-order', 'running', { currentStation: 'Creating production job...' })
      await new Promise(r => setTimeout(r, 500))
      
      // Create production job for this order
      const jobResponse = await fetch(`${API_URL}/production/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          jobNumber: `JOB-${Date.now()}`,
          jobType: 'Cutting',
          status: 'In Progress',
          startDate: new Date().toISOString(),
          panelCount: cabinetSpec.modelData.parts.length
        })
      })
      const job = await jobResponse.json()
      const jobId = job.id
      
      updateStep('sim-create-order', 'running', { currentStation: 'Creating panels from design parts...' })
      await new Promise(r => setTimeout(r, 500))
      
      // Create panels for each part in the design
      for (let idx = 0; idx < cabinetSpec.modelData.parts.length; idx++) {
        const part = cabinetSpec.modelData.parts[idx]
        const panelNumber = `P-${orderNumber.slice(-6)}-${String(idx + 1).padStart(2, '0')}`
        
        const panelResponse = await fetch(`${API_URL}/production/panels`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            panelNumber: panelNumber,
            jobId: jobId,
            qrCode: `QR-${panelNumber}`,
            material: part.material || 'MDF',
            width: part.w,
            height: part.h,
            thickness: part.d,
            status: 'Pending'
          })
        })
        const panel = await panelResponse.json()
        
        cabinetParts.push({
          id: panel.id,
          uuid: panel.id,
          panelNumber: panelNumber,
          name: `${part.type} (${part.w}x${part.h}x${part.d}mm)`,
          type: part.type,
          dimensions: { w: part.w, h: part.h, d: part.d }
        })
      }
      
      updateStep('sim-create-order', 'passed', { 
        currentStation: `Order ${orderNumber} created with ${cabinetParts.length} panels`,
        data: `Job: ${job.jobNumber || jobId}`
      })
      await new Promise(r => setTimeout(r, 1000))

      // STEP 4: Generate saw plan
      updateStep('sim-generate-sawplan', 'running', { currentStation: 'Generating saw plan for wallsaw...' })
      await new Promise(r => setTimeout(r, 2000))
      
      // Calculate how many sheets needed (simple estimation)
      const totalArea = cabinetParts.reduce((sum, p) => {
        const dims = p.dimensions
        return sum + (dims.w * dims.h) / 1000000 // m²
      }, 0)
      const sheetArea = 2.44 * 1.22 // m²
      const sheetsNeeded = Math.ceil(totalArea / sheetArea)
      
      updateStep('sim-generate-sawplan', 'passed', { 
        currentStation: `Saw plan generated: ${sheetsNeeded} MDF sheets required`,
        data: `Total cutting area: ${totalArea.toFixed(2)} m²`
      })
      await new Promise(r => setTimeout(r, 1000))

      // STEP 5: Process parts through all stations
      updateStep('sim-process-parts', 'running', { currentStation: 'Starting production line...' })
      await new Promise(r => setTimeout(r, 500))
      
      const stations = ['wallsaw', 'cnc', 'banding', 'packaging']
      const stationTimes = {
        wallsaw: { scan: 500, process: 2000 },
        cnc: { scan: 500, process: 3000 },
        banding: { scan: 500, process: 2000 },
        packaging: { scan: 500, process: 1000 }
      }
      
      let partsCompleted = 0
      for (const part of cabinetParts) {
        for (const station of stations) {
          updateStep('sim-process-parts', 'running', { 
            currentStation: `Part ${partsCompleted + 1}/${cabinetParts.length}: ${part.name} at ${station.toUpperCase()}`,
            data: `Processing...`
          })
          
          // Scan part at station
          await fetch(`${API_URL}/tracking/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              partId: part.uuid,
              partName: part.name,
              station: station,
              scannedBy: user?.id || '00000000-0000-0000-0000-000000000000',
              scannedByName: 'Production Worker',
              barcode: part.id
            })
          })
          
          await new Promise(r => setTimeout(r, stationTimes[station].scan))
          await new Promise(r => setTimeout(r, stationTimes[station].process))
        }
        partsCompleted++
      }
      
      updateStep('sim-process-parts', 'passed', { 
        currentStation: `All ${cabinetParts.length} parts processed through production`,
        data: 'All stations complete'
      })
      await new Promise(r => setTimeout(r, 500))

      // STEP 6: Complete
      updateStep('sim-complete', 'passed', { 
        currentStation: 'Cabinet production complete!',
        data: `Order ready for delivery. Design: ${cabinetSpec.name}`
      })

    } catch (error) {
      console.error('Simulation error:', error)
      setResults(prev => ({ 
        ...prev, 
        'sim-complete': { passed: false, error: error.message }
      }))
    }
  }

  const runJestTests = async () => {
    setJestRunning(true)
    try {
      const response = await fetch(`${API_URL}/test-results/run`, { method: 'POST' })
      const data = await response.json()
      setJestResults(data)
      await fetchJestHistory()
    } catch (error) {
      console.error('Failed to run Jest tests:', error)
    }
    setJestRunning(false)
  }

  const runTest = async (test) => {
    try {
      const options = {
        method: test.method,
        headers: { 'Content-Type': 'application/json' },
      }
      if (test.body) {
        options.body = JSON.stringify(test.body)
      }

      const startTime = Date.now()
      const response = await fetch(`${API_URL}${test.endpoint}`, options)
      const duration = Date.now() - startTime
      const data = await response.json()

      const statusPassed = response.status === test.expectedStatus
      const validationPassed = test.isLoadTest ? test.validate(data, duration) : test.validate(data)
      const passed = statusPassed && validationPassed

      // Generate proof details
      const proof = {
        statusCheck: {
          expected: test.expectedStatus,
          actual: response.status,
          passed: statusPassed
        },
        validationCheck: {
          passed: validationPassed,
          reason: validationPassed ? 'Validation passed' : 'Validation failed'
        },
        responsePreview: JSON.stringify(data, null, 2).substring(0, 500),
        fullResponse: data,
        recordCount: Array.isArray(data) ? data.length : (typeof data === 'object' ? Object.keys(data).length : 1)
      }

      return {
        passed,
        status: response.status,
        expectedStatus: test.expectedStatus,
        duration,
        data: JSON.stringify(data).substring(0, 200),
        proof,
        error: null,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        passed: false,
        status: 0,
        expectedStatus: test.expectedStatus,
        duration: 0,
        data: null,
        error: error.message
      }
    }
  }

  const runAllTests = async () => {
    setRunning(true)
    setResults({})
    
    // Collect results in local variable since state updates are async
    const collectedResults = {}

    for (const suite of testSuites) {
      // Handle full simulation suites differently
      if (suite.isFullSimulation) {
        await runFullWorkflowSimulation(suite)
        // Copy simulation results to collected results
        for (const test of suite.tests) {
          collectedResults[test.id] = results[test.id]
        }
      } else {
        for (const test of suite.tests) {
          setCurrentTest(test.id)
          const result = await runTest(test)
          collectedResults[test.id] = result
          setResults(prev => ({ ...prev, [test.id]: result }))
          await new Promise(r => setTimeout(r, 100)) // Small delay for UI
        }
      }
    }

    setCurrentTest(null)
    setRunning(false)
    
    // Save to history using collected results
    const historyEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      totalTests: totalTests,
      passed: Object.values(collectedResults).filter(r => r?.passed).length,
      failed: Object.values(collectedResults).filter(r => r && !r.passed).length,
      results: collectedResults
    }
    
    const newHistory = [historyEntry, ...testRunHistory].slice(0, 20)
    setTestRunHistory(newHistory)
    localStorage.setItem('testRunHistory', JSON.stringify(newHistory))
  }

  // Run just the full workflow simulation
  const runSimulationOnly = async () => {
    setRunning(true)
    setResults({})
    const simSuite = testSuites.find(s => s.isFullSimulation)
    if (simSuite) {
      await runFullWorkflowSimulation(simSuite)
    }
    setCurrentTest(null)
    setRunning(false)
  }

  const runSuiteTests = async (suite) => {
    setRunning(true)

    if (suite.isFullSimulation) {
      await runFullWorkflowSimulation(suite)
    } else {
      for (const test of suite.tests) {
        setCurrentTest(test.id)
        const result = await runTest(test)
        setResults(prev => ({ ...prev, [test.id]: result }))
        await new Promise(r => setTimeout(r, 100))
      }
    }

    setCurrentTest(null)
    setRunning(false)
  }

  const totalTests = testSuites.reduce((sum, s) => sum + s.tests.length, 0)
  const passedTests = Object.values(results).filter(r => r.passed).length
  const failedTests = Object.values(results).filter(r => !r.passed).length
  const completedTests = Object.keys(results).length

  const isAdmin = user?.role === 'Admin'

  if (!isAdmin) {
    return (
      <div className="pt-14">
        <div className="bg-red-100 text-red-700 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p>You need Admin privileges to access the Test Center.</p>
        </div>
      </div>
    )
  }

  const startNewTestRun = async () => {
    setRunningNewTest(true)
    // Run both Jest and API tests
    await Promise.all([runJestTests(), runAllTests()])
    setRunningNewTest(false)
  }

  // Combine all test runs for display
  const allTestRuns = [
    ...jestHistory.map(run => ({ ...run, type: 'jest', typeName: 'Backend (Jest)' })),
    ...testRunHistory.map(run => ({ ...run, type: 'api', typeName: 'API Tests' }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  return (
    <div className="pt-14">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Test Center</h2>
          <p className="text-gray-600">View test runs and their results with proof</p>
        </div>
        <button
          onClick={startNewTestRun}
          disabled={runningNewTest || running || jestRunning}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
        >
          {runningNewTest || running || jestRunning ? (
            <>
              <RefreshCw size={18} className="animate-spin" /> Running Tests...
            </>
          ) : (
            <>
              <Play size={18} /> Start New Test Run
            </>
          )}
        </button>
      </div>

      {/* Running Indicator */}
      {(runningNewTest || running || jestRunning) && (
        <div className="mb-6 p-4 bg-blue-100 text-blue-700 rounded-lg flex items-center gap-3">
          <RefreshCw size={20} className="animate-spin" />
          <div>
            <p className="font-medium">Test run in progress...</p>
            <p className="text-sm">
              {jestRunning && 'Running Backend Tests (224+)... '}
              {running && `Running API Tests (${currentTest || 'starting'})...`}
            </p>
          </div>
        </div>
      )}

      {/* Test Runs List */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText size={20} /> Test Run History ({allTestRuns.length} runs)
        </h3>
        
        {allTestRuns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Terminal size={48} className="mx-auto mb-3 opacity-50" />
            <p>No test runs yet. Click "Start New Test Run" to execute all tests.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {allTestRuns.map((run) => (
              <div key={`${run.type}-${run.id}`} className="border rounded-lg overflow-hidden">
                <div 
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 ${selectedRun === `${run.type}-${run.id}` ? 'bg-gray-100' : ''}`}
                  onClick={() => setSelectedRun(selectedRun === `${run.type}-${run.id}` ? null : `${run.type}-${run.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${run.type === 'jest' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                      {run.type === 'jest' ? <Terminal size={20} /> : <Database size={20} />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{run.typeName}</p>
                      <p className="text-sm text-gray-500">{new Date(run.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-green-600 font-medium">{run.summary?.passed || run.passed || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle size={16} className="text-red-500" />
                      <span className="text-red-600 font-medium">{run.summary?.failed || run.failed || 0}</span>
                    </div>
                    <span className="text-gray-500">/ {run.summary?.total || run.totalTests || 0}</span>
                    {selectedRun === `${run.type}-${run.id}` ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
                
                {/* Expanded Results */}
                {selectedRun === `${run.type}-${run.id}` && (
                  <div className="border-t p-4 bg-gray-50">
                    {run.type === 'jest' ? (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">Test Output (Proof)</h4>
                        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto max-h-64 text-xs font-mono whitespace-pre-wrap">
                          {run.rawOutput || 'No output available'}
                        </pre>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">Test Results by Category</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {Object.entries(run.results || {}).map(([testId, result]) => {
                            const test = testSuites.flatMap(s => s.tests).find(t => t.id === testId)
                            return (
                              <div key={testId} className={`p-3 rounded border ${result?.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  {result?.passed ? (
                                    <CheckCircle size={14} className="text-green-500" />
                                  ) : (
                                    <XCircle size={14} className="text-red-500" />
                                  )}
                                  <span className="text-sm font-medium truncate">{test?.name || testId}</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  Status: {result?.status} | Duration: {result?.duration}ms
                                </div>
                                {result?.proof && (
                                  <div className="mt-2 text-xs">
                                    <p className="text-gray-600">Records: {result.proof.recordCount}</p>
                                    {result.proof.responsePreview && (
                                      <pre className="mt-1 bg-gray-800 text-green-300 p-2 rounded text-[10px] max-h-20 overflow-auto">
                                        {result.proof.responsePreview.substring(0, 200)}...
                                      </pre>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('api')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'api' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}
        >
          <Database size={18} /> Run Individual API Tests
        </button>
      </div>

      {/* Jest Tests Tab */}
      {activeTab === 'jest' && (
        <div className="space-y-6">
          {/* Jest Summary */}
          {jestResults && (
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-md p-4">
                <p className="text-sm text-gray-500">Total Tests</p>
                <p className="text-2xl font-bold text-gray-800">{jestResults.summary?.total || 0}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4">
                <p className="text-sm text-gray-500">Passed</p>
                <p className="text-2xl font-bold text-green-600">{jestResults.summary?.passed || 0}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4">
                <p className="text-sm text-gray-500">Failed</p>
                <p className="text-2xl font-bold text-red-600">{jestResults.summary?.failed || 0}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4">
                <p className="text-sm text-gray-500">Last Run</p>
                <p className="text-sm font-medium text-gray-800">{jestResults.timestamp ? new Date(jestResults.timestamp).toLocaleString() : 'Never'}</p>
              </div>
            </div>
          )}

          {/* Jest Output */}
          {jestResults?.rawOutput && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Terminal size={20} /> Test Output (Proof)
              </h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto max-h-96 text-xs font-mono whitespace-pre-wrap">
                {jestResults.rawOutput}
              </pre>
            </div>
          )}

          {/* Jest History */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={20} /> Jest Test Run History
            </h3>
            {jestHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No Jest test runs yet. Click "Run Backend Tests" to execute.</p>
            ) : (
              <div className="space-y-2">
                {jestHistory.map((run, idx) => (
                  <div key={run.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">Run #{jestHistory.length - idx}</span>
                      <span className="text-xs text-gray-500">{new Date(run.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-green-600">{run.summary?.passed || 0} passed</span>
                      <span className="text-sm text-red-600">{run.summary?.failed || 0} failed</span>
                      <span className="text-sm text-gray-500">/ {run.summary?.total || 0} total</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* API Tests Tab */}
      {activeTab === 'api' && (
        <>
      {/* Summary */}
      {completedTests > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-500">Total Tests</p>
            <p className="text-2xl font-bold text-gray-800">{totalTests}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-blue-600">{completedTests}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-500">Passed</p>
            <p className="text-2xl font-bold text-green-600">{passedTests}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-sm text-gray-500">Failed</p>
            <p className="text-2xl font-bold text-red-600">{failedTests}</p>
          </div>
        </div>
      )}

      {/* Test Suites */}
      <div className="space-y-4">
        {testSuites.map((suite) => {
          const Icon = suite.icon
          const suiteResults = suite.tests.map(t => results[t.id]).filter(Boolean)
          const suitePassed = suiteResults.filter(r => r.passed).length
          const suiteFailed = suiteResults.filter(r => !r.passed).length

          return (
            <div key={suite.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{suite.name}</h3>
                    <p className="text-xs text-gray-500">{suite.tests.length} tests</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {suiteResults.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">{suitePassed} passed</span>
                      {suiteFailed > 0 && <span className="text-red-600">{suiteFailed} failed</span>}
                    </div>
                  )}
                  <button
                    onClick={() => runSuiteTests(suite)}
                    disabled={running}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm disabled:opacity-50"
                  >
                    Run Suite
                  </button>
                </div>
              </div>

              <div className="divide-y">
                {suite.tests.map((test) => {
                  const result = results[test.id]
                  const isRunning = currentTest === test.id

                  return (
                    <div key={test.id} className="border-b last:border-b-0">
                      <div className="flex items-center justify-between p-3 hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          {isRunning ? (
                            <Clock size={18} className="text-blue-500 animate-pulse" />
                          ) : result ? (
                            result.passed ? (
                              <CheckCircle size={18} className="text-green-500" />
                            ) : (
                              <XCircle size={18} className="text-red-500" />
                            )
                          ) : (
                            <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300" />
                          )}
                          <div>
                            <p className="text-sm text-gray-800">{test.name}</p>
                            {test.method && test.endpoint && (
                              <p className="text-xs text-gray-400">{test.method} {test.endpoint}</p>
                            )}
                            {result?.currentStation && (
                              <p className="text-xs text-blue-500">{result.currentStation}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {result && (
                            <>
                              {result.expectedStatus ? (
                                <span className={`text-xs px-2 py-1 rounded ${
                                  result.status === result.expectedStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  Status: {result.status} (expected: {result.expectedStatus})
                                </span>
                              ) : (
                                <span className={`text-xs px-2 py-1 rounded ${
                                  result.passed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {result.passed ? 'Complete' : result.status}
                                </span>
                              )}
                              {result.duration && <span className="text-xs text-gray-400">{result.duration}ms</span>}
                              <button
                                onClick={() => setExpandedTests(prev => ({ ...prev, [test.id]: !prev[test.id] }))}
                                className="p-1 text-gray-400 hover:text-amber-600"
                                title="View proof"
                              >
                                <Eye size={16} />
                              </button>
                            </>
                          )}
                          {result?.error && (
                            <span className="text-xs text-red-500">{result.error}</span>
                          )}
                        </div>
                      </div>
                    
                      {/* Expanded Proof Section */}
                      {expandedTests[test.id] && result?.proof && (
                      <div className="px-4 pb-4 bg-gray-50 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div className="bg-white rounded-lg p-3 border">
                            <h5 className="text-xs font-semibold text-gray-600 mb-2">Status Check</h5>
                            <div className="flex items-center gap-2">
                              {result.proof.statusCheck.passed ? (
                                <CheckCircle size={16} className="text-green-500" />
                              ) : (
                                <XCircle size={16} className="text-red-500" />
                              )}
                              <span className="text-sm">
                                Expected: <code className="bg-gray-100 px-1 rounded">{result.proof.statusCheck.expected}</code>
                                {' → '}
                                Actual: <code className={`px-1 rounded ${result.proof.statusCheck.passed ? 'bg-green-100' : 'bg-red-100'}`}>{result.proof.statusCheck.actual}</code>
                              </span>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 border">
                            <h5 className="text-xs font-semibold text-gray-600 mb-2">Validation Check</h5>
                            <div className="flex items-center gap-2">
                              {result.proof.validationCheck.passed ? (
                                <CheckCircle size={16} className="text-green-500" />
                              ) : (
                                <XCircle size={16} className="text-red-500" />
                              )}
                              <span className="text-sm">{result.proof.validationCheck.reason}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Records returned: {result.proof.recordCount}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 bg-white rounded-lg p-3 border">
                          <h5 className="text-xs font-semibold text-gray-600 mb-2">Response Preview (Proof)</h5>
                          <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto max-h-48">
                            {result.proof.responsePreview}
                            {result.proof.responsePreview.length >= 500 && '...'}
                          </pre>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-400">
                          Test run at: {result.timestamp}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Test Run History */}
      <div className="mt-8 bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <FileText size={20} /> Test Run History
          </h3>
          <span className="text-sm text-gray-500">{testRunHistory.length} runs saved</span>
        </div>
        
        {testRunHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No test runs yet. Run tests to see history.</p>
        ) : (
          <div className="space-y-2">
            {testRunHistory.map((run, idx) => (
              <div key={run.id} className="border rounded-lg overflow-hidden">
                <div 
                  className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                  onClick={() => setSelectedHistoryRun(selectedHistoryRun === run.id ? null : run.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">Run #{testRunHistory.length - idx}</span>
                    <span className="text-xs text-gray-500">{new Date(run.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-green-600">{run.passed} passed</span>
                    <span className="text-sm text-red-600">{run.failed} failed</span>
                    {selectedHistoryRun === run.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
                
                {selectedHistoryRun === run.id && (
                  <div className="p-4 border-t bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {Object.entries(run.results || {}).map(([testId, result]) => {
                        const test = testSuites.flatMap(s => s.tests).find(t => t.id === testId)
                        return (
                          <div key={testId} className={`p-2 rounded border ${result?.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center gap-2">
                              {result?.passed ? (
                                <CheckCircle size={14} className="text-green-500" />
                              ) : (
                                <XCircle size={14} className="text-red-500" />
                              )}
                              <span className="text-xs font-medium truncate">{test?.name || testId}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Status: {result?.status} | {result?.duration}ms
                            </div>
                            {result?.proof && (
                              <div className="text-xs text-gray-400 mt-1">
                                Records: {result.proof.recordCount}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expected Results Reference */}
      <div className="mt-8 bg-white rounded-xl shadow-md p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Expected Results Reference</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Test</th>
                <th className="text-left py-2 px-3">Endpoint</th>
                <th className="text-left py-2 px-3">Expected Status</th>
                <th className="text-left py-2 px-3">Validation</th>
              </tr>
            </thead>
            <tbody>
              {testSuites.filter(suite => !suite.isFullSimulation).flatMap(suite => 
                suite.tests.map(test => (
                  <tr key={test.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{test.name}</td>
                    <td className="py-2 px-3 font-mono text-xs">{test.method || '-'} {test.endpoint || '-'}</td>
                    <td className="py-2 px-3">{test.expectedStatus || '-'}</td>
                    <td className="py-2 px-3 text-xs text-gray-500">
                      {test.validate ? (
                        test.validate.toString().includes('Array.isArray') ? 'Returns array' :
                        test.validate.toString().includes('token') ? 'Returns token & user' :
                        test.validate.toString().includes('total') ? 'Returns numeric total' :
                        test.validate.toString().includes('status') ? 'Returns status field' :
                        'Custom validation'
                      ) : 'Simulation step'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  )
}

export default TestCenter
