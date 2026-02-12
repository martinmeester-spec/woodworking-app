import { useState, useEffect, createContext, useContext } from 'react'
import { HelpCircle, X, ChevronRight, ChevronLeft, Lightbulb, BookOpen, Play, Pause, SkipForward } from 'lucide-react'

// Context for managing help state across the app
const HelpContext = createContext()

export function HelpProvider({ children }) {
  const [helpEnabled, setHelpEnabled] = useState(() => {
    const saved = localStorage.getItem('userHelpEnabled')
    return saved !== 'false'
  })
  const [currentTour, setCurrentTour] = useState(null)
  const [tourStep, setTourStep] = useState(0)
  const [showHelpPanel, setShowHelpPanel] = useState(false)
  const [dismissedTips, setDismissedTips] = useState(() => {
    const saved = localStorage.getItem('dismissedHelpTips')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('userHelpEnabled', helpEnabled)
  }, [helpEnabled])

  useEffect(() => {
    localStorage.setItem('dismissedHelpTips', JSON.stringify(dismissedTips))
  }, [dismissedTips])

  const dismissTip = (tipId) => {
    setDismissedTips(prev => [...prev, tipId])
  }

  const resetDismissedTips = () => {
    setDismissedTips([])
    localStorage.removeItem('dismissedHelpTips')
  }

  const startTour = (tourId) => {
    setCurrentTour(tourId)
    setTourStep(0)
  }

  const endTour = () => {
    setCurrentTour(null)
    setTourStep(0)
  }

  const nextStep = () => {
    setTourStep(prev => prev + 1)
  }

  const prevStep = () => {
    setTourStep(prev => Math.max(0, prev - 1))
  }

  return (
    <HelpContext.Provider value={{
      helpEnabled,
      setHelpEnabled,
      currentTour,
      tourStep,
      startTour,
      endTour,
      nextStep,
      prevStep,
      showHelpPanel,
      setShowHelpPanel,
      dismissedTips,
      dismissTip,
      resetDismissedTips
    }}>
      {children}
    </HelpContext.Provider>
  )
}

export function useHelp() {
  return useContext(HelpContext)
}

// Floating help button that appears on every page
export function HelpButton() {
  const { helpEnabled, setHelpEnabled, setShowHelpPanel } = useHelp()

  if (!helpEnabled) return null

  return (
    <button
      onClick={() => setShowHelpPanel(true)}
      className="fixed bottom-6 right-6 w-14 h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-all hover:scale-110"
      title="Get Help"
    >
      <HelpCircle size={28} />
    </button>
  )
}

// Help panel that slides in from the right
export function HelpPanel({ pageHelp = [] }) {
  const { showHelpPanel, setShowHelpPanel, setHelpEnabled, resetDismissedTips } = useHelp()

  if (!showHelpPanel) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={() => setShowHelpPanel(false)} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
        <div className="bg-amber-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={24} />
            <h2 className="text-lg font-bold">Help & Tips</h2>
          </div>
          <button onClick={() => setShowHelpPanel(false)} className="p-1 hover:bg-white/20 rounded">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {pageHelp.length > 0 ? (
            <>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Lightbulb size={18} className="text-amber-500" />
                Tips for this page
              </h3>
              {pageHelp.map((tip, index) => (
                <HelpTipCard key={index} tip={tip} index={index} />
              ))}
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">No specific help available for this page.</p>
          )}
        </div>

        <div className="border-t p-4 space-y-2">
          <button
            onClick={resetDismissedTips}
            className="w-full py-2 px-4 text-sm text-amber-600 hover:bg-amber-50 rounded-lg"
          >
            Reset all dismissed tips
          </button>
          <button
            onClick={() => {
              setHelpEnabled(false)
              setShowHelpPanel(false)
            }}
            className="w-full py-2 px-4 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            Disable help (can re-enable in settings)
          </button>
        </div>
      </div>
    </div>
  )
}

// Individual help tip card
function HelpTipCard({ tip, index }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between text-left"
      >
        <div className="flex items-start gap-3">
          <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
            {index + 1}
          </span>
          <div>
            <h4 className="font-medium text-gray-800">{tip.title}</h4>
            {!expanded && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{tip.summary}</p>}
          </div>
        </div>
        <ChevronRight size={20} className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="mt-3 pl-9 text-sm text-gray-600 space-y-2">
          <p>{tip.details}</p>
          {tip.steps && (
            <ol className="list-decimal list-inside space-y-1 mt-2">
              {tip.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          )}
          {tip.shortcut && (
            <p className="mt-2 text-xs bg-gray-200 inline-block px-2 py-1 rounded">
              Shortcut: <kbd className="font-mono">{tip.shortcut}</kbd>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Inline help tooltip that appears next to elements
export function HelpTooltip({ id, title, content, position = 'right' }) {
  const { helpEnabled, dismissedTips, dismissTip } = useHelp()
  const [visible, setVisible] = useState(false)

  if (!helpEnabled || dismissedTips.includes(id)) return null

  const positionClasses = {
    right: 'left-full ml-2',
    left: 'right-full mr-2',
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2'
  }

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(!visible)}
        className="w-5 h-5 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center hover:bg-amber-200 transition-colors"
      >
        <HelpCircle size={14} />
      </button>
      {visible && (
        <div className={`absolute ${positionClasses[position]} z-50 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-3`}>
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-gray-800 text-sm">{title}</h4>
            <button
              onClick={(e) => {
                e.stopPropagation()
                dismissTip(id)
              }}
              className="text-gray-400 hover:text-gray-600"
              title="Don't show again"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-xs text-gray-600">{content}</p>
        </div>
      )}
    </div>
  )
}

// Contextual help banner that appears at the top of sections
export function HelpBanner({ id, title, message, type = 'info', dismissible = true }) {
  const { helpEnabled, dismissedTips, dismissTip } = useHelp()

  if (!helpEnabled || dismissedTips.includes(id)) return null

  const typeStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    tip: 'bg-amber-50 border-amber-200 text-amber-800',
    warning: 'bg-orange-50 border-orange-200 text-orange-800',
    success: 'bg-green-50 border-green-200 text-green-800'
  }

  const icons = {
    info: <HelpCircle size={18} />,
    tip: <Lightbulb size={18} />,
    warning: <HelpCircle size={18} />,
    success: <HelpCircle size={18} />
  }

  return (
    <div className={`${typeStyles[type]} border rounded-lg p-3 mb-4 flex items-start gap-3`}>
      <span className="flex-shrink-0 mt-0.5">{icons[type]}</span>
      <div className="flex-1">
        {title && <h4 className="font-medium mb-1">{title}</h4>}
        <p className="text-sm">{message}</p>
      </div>
      {dismissible && (
        <button
          onClick={() => dismissTip(id)}
          className="flex-shrink-0 p-1 hover:bg-black/10 rounded"
          title="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

// Guided tour component
export function GuidedTour({ tourId, steps }) {
  const { currentTour, tourStep, nextStep, prevStep, endTour } = useHelp()

  if (currentTour !== tourId || !steps || tourStep >= steps.length) return null

  const step = steps[tourStep]
  const isFirst = tourStep === 0
  const isLast = tourStep === steps.length - 1

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" />
      <div 
        className="absolute bg-white rounded-xl shadow-2xl p-6 max-w-md"
        style={{
          top: step.position?.top || '50%',
          left: step.position?.left || '50%',
          transform: step.position ? 'none' : 'translate(-50%, -50%)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">Step {tourStep + 1} of {steps.length}</span>
          <button onClick={endTour} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <h3 className="text-lg font-bold text-gray-800 mb-2">{step.title}</h3>
        <p className="text-gray-600 mb-6">{step.content}</p>
        
        <div className="flex items-center justify-between">
          <button
            onClick={endTour}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={prevStep}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1"
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}
            <button
              onClick={isLast ? endTour : nextStep}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-1"
            >
              {isLast ? 'Finish' : 'Next'} {!isLast && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Pre-defined help content for each page
export const PAGE_HELP = {
  dashboard: [
    {
      title: 'Dashboard Overview',
      summary: 'Your central hub for monitoring production status',
      details: 'The dashboard provides a real-time overview of your entire woodworking operation including active orders, machine status, and key metrics.',
      steps: ['Check the summary cards at the top for quick stats', 'Review active orders in the main panel', 'Monitor machine status on the right sidebar']
    },
    {
      title: 'Quick Actions',
      summary: 'Access common tasks directly from the dashboard',
      details: 'Use the quick action buttons to create new orders, designs, or access frequently used features without navigating through menus.'
    },
    {
      title: 'Notifications',
      summary: 'Stay informed about important events',
      details: 'The notification bell shows unread alerts. Click to see details about order updates, machine issues, or inventory warnings.'
    },
    {
      title: 'Production Metrics',
      summary: 'Track your production efficiency',
      details: 'View daily, weekly, and monthly production statistics to identify trends and optimize your workflow.'
    },
    {
      title: 'Machine Status',
      summary: 'Monitor all machines at a glance',
      details: 'Green indicates running, yellow is idle, red means there is an issue requiring attention.'
    },
    {
      title: 'Recent Activity',
      summary: 'See what has happened recently',
      details: 'The activity feed shows recent actions taken by all users, helping you stay informed about changes.'
    },
    {
      title: 'Order Priority',
      summary: 'Identify urgent orders quickly',
      details: 'Orders are color-coded by priority. Red indicates high priority items that need immediate attention.'
    },
    {
      title: 'Search Functionality',
      summary: 'Find anything quickly',
      details: 'Use the search bar to find orders, designs, parts, or customers by name, number, or other attributes.',
      shortcut: 'Ctrl+K'
    },
    {
      title: 'Refresh Data',
      summary: 'Get the latest information',
      details: 'Data refreshes automatically, but you can click the refresh button to manually update all displayed information.'
    },
    {
      title: 'Customization',
      summary: 'Personalize your dashboard',
      details: 'Click the settings icon to customize which widgets appear on your dashboard and their arrangement.'
    }
  ],
  
  designs: [
    {
      title: '3D Design Studio',
      summary: 'Create and edit cabinet designs in 3D',
      details: 'The 3D design studio allows you to create detailed cabinet designs with accurate dimensions and part specifications.',
      steps: ['Select a template or start from scratch', 'Adjust dimensions using the property panel', 'Add shelves, doors, and hardware', 'Preview and save your design']
    },
    {
      title: 'Camera Controls',
      summary: 'Navigate the 3D view',
      details: 'Use mouse controls to rotate, pan, and zoom the 3D view for better visualization.',
      steps: ['Left-click + drag to rotate', 'Right-click + drag to pan', 'Scroll wheel to zoom']
    },
    {
      title: 'Part Selection',
      summary: 'Select and modify individual parts',
      details: 'Click on any part in the 3D view to select it. Selected parts can be resized, moved, or deleted.'
    },
    {
      title: 'Dimension Input',
      summary: 'Enter precise measurements',
      details: 'Use the dimension fields to enter exact measurements in millimeters for precise cabinet sizing.'
    },
    {
      title: 'Material Selection',
      summary: 'Choose materials for your design',
      details: 'Select from various wood types and finishes. Material choice affects cost estimates and production requirements.'
    },
    {
      title: 'Adding Components',
      summary: 'Add shelves, doors, and drawers',
      details: 'Use the component toolbar to add additional elements to your cabinet design.'
    },
    {
      title: 'Design Templates',
      summary: 'Start from pre-made designs',
      details: 'Choose from a library of templates to quickly create common cabinet configurations.'
    },
    {
      title: 'Save and Version',
      summary: 'Keep track of design changes',
      details: 'Save your design regularly. Each save creates a version you can revert to if needed.'
    },
    {
      title: 'Export Options',
      summary: 'Export designs for production',
      details: 'Export your design as a production order, PDF drawing, or share with customers.'
    },
    {
      title: 'Cost Estimation',
      summary: 'See estimated costs',
      details: 'View real-time cost estimates based on materials, labor, and hardware requirements.'
    }
  ],

  production: [
    {
      title: 'Production Orders',
      summary: 'Manage all production orders',
      details: 'View and manage all production orders from creation to completion. Track progress and update statuses.',
      steps: ['Filter orders by status or date', 'Click an order to see details', 'Update status as work progresses']
    },
    {
      title: 'Order Status',
      summary: 'Understand order statuses',
      details: 'Orders progress through stages: Pending → In Progress → Cutting → Drilling → Edge Banding → Assembly → QC → Completed'
    },
    {
      title: 'Priority Management',
      summary: 'Set and change order priorities',
      details: 'Adjust order priority to ensure urgent jobs are completed first. High priority orders appear at the top of work queues.'
    },
    {
      title: 'Panel Tracking',
      summary: 'Track individual panels',
      details: 'Each order contains multiple panels. Track the status of each panel through the production process.'
    },
    {
      title: 'QR Code Scanning',
      summary: 'Scan panels at each station',
      details: 'Use QR codes to quickly update panel status as they move through production stations.'
    },
    {
      title: 'Due Date Alerts',
      summary: 'Never miss a deadline',
      details: 'Orders approaching their due date are highlighted. Overdue orders appear in red.'
    },
    {
      title: 'Batch Operations',
      summary: 'Update multiple orders at once',
      details: 'Select multiple orders to perform batch operations like status updates or priority changes.'
    },
    {
      title: 'Production Notes',
      summary: 'Add notes to orders',
      details: 'Add notes to orders for special instructions or to communicate between shifts.'
    },
    {
      title: 'Work Logs',
      summary: 'Track time spent on orders',
      details: 'View detailed work logs showing who worked on each order and for how long.'
    },
    {
      title: 'Quality Issues',
      summary: 'Report and track defects',
      details: 'Report quality issues directly from the order view. Track resolution and rework status.'
    }
  ],

  floor: [
    {
      title: 'Production Floor',
      summary: 'Real-time station management',
      details: 'Monitor and manage parts at each production station. Scan parts to move them through the workflow.',
      steps: ['Select your current station', 'Scan or select parts to process', 'Move parts to the next station when complete']
    },
    {
      title: 'Station Selection',
      summary: 'Switch between stations',
      details: 'Use the station tabs to switch between Wallsaw, CNC, Banding, and Packaging stations.'
    },
    {
      title: 'Part Scanning',
      summary: 'Scan parts with QR codes',
      details: 'Use a barcode scanner or camera to scan part QR codes for quick identification and status updates.'
    },
    {
      title: 'Production Plan View',
      summary: 'See detailed production plans',
      details: 'Before moving a part, review its production plan to ensure all operations are completed correctly.'
    },
    {
      title: 'Move Confirmation',
      summary: 'Confirm before moving parts',
      details: 'When moving a part to the next station, you will see the production plan for that station to review.'
    },
    {
      title: 'Order Grouping',
      summary: 'Parts grouped by order',
      details: 'Parts are grouped by order number for easy identification and batch processing.'
    },
    {
      title: 'Time Tracking',
      summary: 'Track processing time',
      details: 'The system automatically tracks how long each part spends at each station.'
    },
    {
      title: 'Error Handling',
      summary: 'Report issues with parts',
      details: 'If a part has a defect or issue, report it directly from the floor view.'
    },
    {
      title: 'Refresh Data',
      summary: 'Keep data current',
      details: 'Data auto-refreshes, but you can manually refresh to see the latest part locations.'
    },
    {
      title: 'Complete Orders',
      summary: 'Finalize orders for shipping',
      details: 'When all parts reach packaging, complete the order to mark it ready for shipping.'
    }
  ],

  inventory: [
    {
      title: 'Inventory Overview',
      summary: 'Manage all inventory items',
      details: 'Track materials, hardware, and consumables. Monitor stock levels and receive low stock alerts.',
      steps: ['View current stock levels', 'Add or remove inventory', 'Set reorder points', 'Track usage history']
    },
    {
      title: 'Stock Levels',
      summary: 'Understand stock indicators',
      details: 'Green = In Stock, Yellow = Low Stock, Red = Critical/Out of Stock. Take action on low stock items.'
    },
    {
      title: 'Adding Stock',
      summary: 'Record incoming inventory',
      details: 'When new materials arrive, record them to update stock levels and maintain accurate counts.'
    },
    {
      title: 'Using Stock',
      summary: 'Record material usage',
      details: 'When materials are used in production, record the usage to keep inventory accurate.'
    },
    {
      title: 'Reorder Alerts',
      summary: 'Automatic low stock warnings',
      details: 'Set minimum quantities for each item. Receive alerts when stock falls below the threshold.'
    },
    {
      title: 'Categories',
      summary: 'Organize by category',
      details: 'Filter inventory by category: Materials, Hardware, Finishing, Tools, or Consumables.'
    },
    {
      title: 'Search and Filter',
      summary: 'Find items quickly',
      details: 'Use search to find specific items by name, part number, or description.'
    },
    {
      title: 'Transaction History',
      summary: 'View all inventory movements',
      details: 'See a complete history of all stock additions and removals with dates and reasons.'
    },
    {
      title: 'Supplier Information',
      summary: 'Track where items come from',
      details: 'Each item can be linked to a supplier for easy reordering.'
    },
    {
      title: 'Cost Tracking',
      summary: 'Monitor inventory value',
      details: 'Track unit costs and total inventory value for financial reporting.'
    }
  ],

  machines: [
    {
      title: 'Machine Management',
      summary: 'Monitor and maintain equipment',
      details: 'Track machine status, schedule maintenance, and monitor performance metrics.',
      steps: ['View machine status at a glance', 'Click a machine for details', 'Schedule maintenance', 'View performance history']
    },
    {
      title: 'Status Indicators',
      summary: 'Understand machine states',
      details: 'Running = Active production, Idle = Available, Maintenance = Scheduled service, Error = Needs attention'
    },
    {
      title: 'Maintenance Scheduling',
      summary: 'Plan preventive maintenance',
      details: 'Schedule regular maintenance to prevent unexpected downtime and extend machine life.'
    },
    {
      title: 'Performance Metrics',
      summary: 'Track machine efficiency',
      details: 'View uptime percentage, cycle times, and production counts for each machine.'
    },
    {
      title: 'Calibration Records',
      summary: 'Track calibration history',
      details: 'Maintain records of machine calibrations for quality assurance and compliance.'
    },
    {
      title: 'Error Logging',
      summary: 'Track and resolve issues',
      details: 'View error history and resolution notes to identify recurring problems.'
    },
    {
      title: 'Operator Assignment',
      summary: 'See who operates each machine',
      details: 'View which operators are certified and currently assigned to each machine.'
    },
    {
      title: 'Utilization Reports',
      summary: 'Analyze machine usage',
      details: 'Generate reports showing machine utilization over time to optimize scheduling.'
    },
    {
      title: 'Spare Parts',
      summary: 'Track replacement parts',
      details: 'Link spare parts inventory to machines for quick access during repairs.'
    },
    {
      title: 'Documentation',
      summary: 'Access machine manuals',
      details: 'Store and access machine documentation, manuals, and troubleshooting guides.'
    }
  ],

  quality: [
    {
      title: 'Quality Control',
      summary: 'Track and resolve defects',
      details: 'Record quality issues, track resolution, and analyze trends to improve production quality.',
      steps: ['Report new defects', 'Assign for resolution', 'Track rework progress', 'Analyze quality metrics']
    },
    {
      title: 'Reporting Defects',
      summary: 'Log quality issues',
      details: 'When a defect is found, record the type, severity, and location for tracking and resolution.'
    },
    {
      title: 'Severity Levels',
      summary: 'Prioritize by severity',
      details: 'Low = Minor cosmetic, Medium = Noticeable but functional, High = Affects function, Critical = Cannot ship'
    },
    {
      title: 'Defect Types',
      summary: 'Categorize issues',
      details: 'Common types include scratches, chips, dimension errors, drilling errors, and finish defects.'
    },
    {
      title: 'Rework Orders',
      summary: 'Track repair work',
      details: 'Create rework orders for defective parts and track them through the repair process.'
    },
    {
      title: 'Root Cause Analysis',
      summary: 'Identify problem sources',
      details: 'Analyze defect patterns to identify root causes and implement preventive measures.'
    },
    {
      title: 'Quality Metrics',
      summary: 'Monitor quality trends',
      details: 'View defect rates, first-pass yield, and other quality metrics over time.'
    },
    {
      title: 'Station Analysis',
      summary: 'Identify problem stations',
      details: 'See which production stations have the highest defect rates for targeted improvement.'
    },
    {
      title: 'Photo Documentation',
      summary: 'Attach photos to defects',
      details: 'Add photos to defect reports for clear documentation and communication.'
    },
    {
      title: 'Resolution Tracking',
      summary: 'Track fix progress',
      details: 'Monitor the status of defect resolution from identification to completion.'
    }
  ],

  schedule: [
    {
      title: 'Production Schedule',
      summary: 'Plan and manage work schedules',
      details: 'View and manage the production calendar, assign work, and optimize resource allocation.',
      steps: ['View the schedule calendar', 'Drag to reschedule items', 'Check resource availability', 'Resolve conflicts']
    },
    {
      title: 'Calendar Views',
      summary: 'Switch between views',
      details: 'View the schedule by day, week, or month depending on your planning needs.'
    },
    {
      title: 'Drag and Drop',
      summary: 'Reschedule easily',
      details: 'Drag schedule items to new dates or times to quickly adjust the production plan.'
    },
    {
      title: 'Resource Allocation',
      summary: 'Assign machines and operators',
      details: 'Allocate specific machines and operators to scheduled work for optimal efficiency.'
    },
    {
      title: 'Capacity Planning',
      summary: 'Avoid overloading',
      details: 'View capacity indicators to ensure you do not schedule more work than can be completed.'
    },
    {
      title: 'Conflict Detection',
      summary: 'Identify scheduling conflicts',
      details: 'The system highlights conflicts when resources are double-booked or deadlines cannot be met.'
    },
    {
      title: 'Due Date Tracking',
      summary: 'Never miss deadlines',
      details: 'Orders are color-coded based on how close they are to their due dates.'
    },
    {
      title: 'Maintenance Windows',
      summary: 'Schedule machine downtime',
      details: 'Block time for scheduled maintenance to prevent production conflicts.'
    },
    {
      title: 'Shift Management',
      summary: 'Plan across shifts',
      details: 'Schedule work across different shifts and see handoff points clearly.'
    },
    {
      title: 'Export Schedule',
      summary: 'Share the schedule',
      details: 'Export the schedule as PDF or share digitally with team members.'
    }
  ],

  workflow: [
    {
      title: 'Workflow Configuration',
      summary: 'Customize your production workflow',
      details: 'Define the steps and sequence of your production process. Create custom workflows for different product types.',
      steps: ['View existing workflows', 'Add or remove steps', 'Reorder steps by dragging', 'Set step durations and requirements']
    },
    {
      title: 'Creating Workflows',
      summary: 'Build custom production flows',
      details: 'Create new workflows tailored to specific product types or customer requirements.'
    },
    {
      title: 'Step Configuration',
      summary: 'Define each production step',
      details: 'Set the name, duration, and requirements for each step in your workflow.'
    },
    {
      title: 'Reordering Steps',
      summary: 'Change the production sequence',
      details: 'Drag and drop steps to change their order in the production process.'
    },
    {
      title: 'Active Workflows',
      summary: 'Set the default workflow',
      details: 'Mark a workflow as active to use it as the default for new orders.'
    }
  ],

  batch: [
    {
      title: 'Batch Processing',
      summary: 'Process multiple orders together',
      details: 'Group similar orders into batches for more efficient production. Reduce setup time and improve throughput.',
      steps: ['Select orders to batch', 'Name your batch', 'Start processing', 'Track batch progress']
    },
    {
      title: 'Creating Batches',
      summary: 'Group orders efficiently',
      details: 'Select multiple pending orders and combine them into a single batch for processing.'
    },
    {
      title: 'Batch Status',
      summary: 'Track batch progress',
      details: 'Monitor the status of each batch from pending through processing to completion.'
    },
    {
      title: 'Batch Reports',
      summary: 'Export batch information',
      details: 'Generate reports for completed batches including timing, efficiency, and quality metrics.'
    }
  ],

  scheduler: [
    {
      title: 'Schedule Optimizer',
      summary: 'AI-powered production scheduling',
      details: 'Use intelligent algorithms to optimize your production schedule for maximum efficiency.',
      steps: ['Review pending orders', 'Configure optimization settings', 'Run optimization', 'Apply the optimized schedule']
    },
    {
      title: 'Optimization Settings',
      summary: 'Configure scheduling priorities',
      details: 'Set priorities like urgent orders first, minimize setup time, or balance machine workload.'
    },
    {
      title: 'Machine Load',
      summary: 'View machine utilization',
      details: 'See how work is distributed across machines and identify bottlenecks.'
    },
    {
      title: 'Efficiency Metrics',
      summary: 'Track scheduling effectiveness',
      details: 'View metrics like on-time delivery rate, machine utilization, and overall efficiency.'
    },
    {
      title: 'Apply Schedule',
      summary: 'Implement the optimized plan',
      details: 'Apply the optimized schedule to update order assignments and timelines.'
    }
  ],

  maintenance: [
    {
      title: 'Maintenance Tracking',
      summary: 'Keep machines running smoothly',
      details: 'Schedule and track maintenance activities to prevent breakdowns and extend machine life.',
      steps: ['View machine status', 'Schedule maintenance', 'Record completed work', 'Review maintenance history']
    },
    {
      title: 'Scheduling Maintenance',
      summary: 'Plan preventive maintenance',
      details: 'Schedule regular maintenance to prevent unexpected breakdowns and production delays.'
    },
    {
      title: 'Maintenance Types',
      summary: 'Understand maintenance categories',
      details: 'Preventive maintenance is scheduled, corrective fixes issues, emergency handles urgent problems.'
    },
    {
      title: 'Overdue Alerts',
      summary: 'Never miss maintenance',
      details: 'Overdue maintenance items are highlighted in red to ensure timely attention.'
    },
    {
      title: 'Maintenance History',
      summary: 'Review past maintenance',
      details: 'View the complete maintenance history for each machine to track patterns and costs.'
    }
  ],

  accounting: [
    {
      title: 'Accounting Integration',
      summary: 'Connect with your accounting system',
      details: 'Sync invoices and expenses with popular accounting software for seamless financial management.',
      steps: ['Connect your accounting system', 'Review invoices and expenses', 'Sync data', 'Export reports']
    },
    {
      title: 'Invoice Management',
      summary: 'Track customer invoices',
      details: 'View invoices generated from completed orders with payment status tracking.'
    },
    {
      title: 'Expense Tracking',
      summary: 'Monitor production costs',
      details: 'Track material, labor, and overhead expenses for accurate cost analysis.'
    },
    {
      title: 'Integration Setup',
      summary: 'Connect accounting software',
      details: 'Connect to QuickBooks, Xero, Sage, or other accounting systems for automatic data sync.'
    },
    {
      title: 'Export Options',
      summary: 'Export financial data',
      details: 'Export invoices and expenses to CSV for import into other systems or analysis.'
    }
  ],

  analytics: [
    {
      title: 'Analytics Dashboard',
      summary: 'Gain insights from your data',
      details: 'View comprehensive analytics about production, quality, and financial performance.',
      steps: ['Select date range', 'Review key metrics', 'Analyze charts', 'Export reports']
    },
    {
      title: 'Key Metrics',
      summary: 'Track important KPIs',
      details: 'Monitor order completion rates, machine efficiency, defect rates, and revenue trends.'
    },
    {
      title: 'Date Range Selection',
      summary: 'Analyze different periods',
      details: 'Select daily, weekly, monthly, or custom date ranges for your analysis.'
    },
    {
      title: 'Chart Analysis',
      summary: 'Visualize your data',
      details: 'Interactive charts show trends in orders, production, defects, and revenue.'
    },
    {
      title: 'Export Reports',
      summary: 'Share your insights',
      details: 'Export analytics data as JSON or PDF for sharing with stakeholders.'
    }
  ],

  costs: [
    {
      title: 'Cost Estimation',
      summary: 'Calculate accurate project costs',
      details: 'Generate detailed cost estimates for designs including materials, labor, and overhead.',
      steps: ['Select a design', 'Review material costs', 'Add labor and overhead', 'Generate quote']
    },
    {
      title: 'Material Costs',
      summary: 'Track material expenses',
      details: 'View costs for wood, hardware, and other materials based on current prices.'
    },
    {
      title: 'Labor Calculation',
      summary: 'Estimate labor costs',
      details: 'Calculate labor costs based on estimated production time and labor rates.'
    },
    {
      title: 'Profit Margins',
      summary: 'Set your markup',
      details: 'Apply profit margins to generate customer quotes with your desired markup.'
    },
    {
      title: 'Quote Generation',
      summary: 'Create customer quotes',
      details: 'Generate professional quotes to share with customers for approval.'
    }
  ]
}

export default {
  HelpProvider,
  useHelp,
  HelpButton,
  HelpPanel,
  HelpTooltip,
  HelpBanner,
  GuidedTour,
  PAGE_HELP
}
