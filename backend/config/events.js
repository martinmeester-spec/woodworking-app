// All subscribable events in the application (50+ events)
export const EVENT_CATEGORIES = {
  PRODUCTION: 'production',
  INVENTORY: 'inventory',
  QUALITY: 'quality',
  MACHINES: 'machines',
  DESIGNS: 'designs',
  ORDERS: 'orders',
  USERS: 'users',
  SYSTEM: 'system',
  TRACKING: 'tracking',
  MAINTENANCE: 'maintenance'
}

export const SUBSCRIBABLE_EVENTS = [
  // Production Events (10)
  { type: 'production.order.created', category: 'production', name: 'New Production Order Created', description: 'When a new production order is created' },
  { type: 'production.order.started', category: 'production', name: 'Production Order Started', description: 'When production begins on an order' },
  { type: 'production.order.completed', category: 'production', name: 'Production Order Completed', description: 'When a production order is finished' },
  { type: 'production.order.delayed', category: 'production', name: 'Production Order Delayed', description: 'When an order is delayed past due date' },
  { type: 'production.order.cancelled', category: 'production', name: 'Production Order Cancelled', description: 'When a production order is cancelled' },
  { type: 'production.panel.completed', category: 'production', name: 'Panel Completed', description: 'When a panel finishes production' },
  { type: 'production.station.started', category: 'production', name: 'Station Work Started', description: 'When work begins at a station' },
  { type: 'production.station.completed', category: 'production', name: 'Station Work Completed', description: 'When work completes at a station' },
  { type: 'production.bottleneck.detected', category: 'production', name: 'Bottleneck Detected', description: 'When a production bottleneck is detected' },
  { type: 'production.efficiency.low', category: 'production', name: 'Low Production Efficiency', description: 'When production efficiency drops below threshold' },

  // Inventory Events (8)
  { type: 'inventory.stock.low', category: 'inventory', name: 'Low Stock Alert', description: 'When stock falls below minimum level' },
  { type: 'inventory.stock.out', category: 'inventory', name: 'Out of Stock Alert', description: 'When an item is out of stock' },
  { type: 'inventory.stock.received', category: 'inventory', name: 'Stock Received', description: 'When new stock is received' },
  { type: 'inventory.stock.adjusted', category: 'inventory', name: 'Stock Adjusted', description: 'When stock levels are manually adjusted' },
  { type: 'inventory.part.created', category: 'inventory', name: 'New Part Added', description: 'When a new inventory part is added' },
  { type: 'inventory.part.updated', category: 'inventory', name: 'Part Updated', description: 'When an inventory part is updated' },
  { type: 'inventory.reorder.needed', category: 'inventory', name: 'Reorder Needed', description: 'When parts need to be reordered' },
  { type: 'inventory.value.threshold', category: 'inventory', name: 'Inventory Value Threshold', description: 'When total inventory value exceeds threshold' },

  // Quality Events (7)
  { type: 'quality.defect.reported', category: 'quality', name: 'Defect Reported', description: 'When a new defect is reported' },
  { type: 'quality.defect.resolved', category: 'quality', name: 'Defect Resolved', description: 'When a defect is resolved' },
  { type: 'quality.defect.critical', category: 'quality', name: 'Critical Defect', description: 'When a critical defect is found' },
  { type: 'quality.inspection.passed', category: 'quality', name: 'Inspection Passed', description: 'When a quality inspection passes' },
  { type: 'quality.inspection.failed', category: 'quality', name: 'Inspection Failed', description: 'When a quality inspection fails' },
  { type: 'quality.rework.required', category: 'quality', name: 'Rework Required', description: 'When rework is needed on a part' },
  { type: 'quality.rate.threshold', category: 'quality', name: 'Quality Rate Below Threshold', description: 'When quality rate drops below threshold' },

  // Machine Events (8)
  { type: 'machine.status.changed', category: 'machines', name: 'Machine Status Changed', description: 'When a machine status changes' },
  { type: 'machine.error.occurred', category: 'machines', name: 'Machine Error', description: 'When a machine error occurs' },
  { type: 'machine.maintenance.due', category: 'machines', name: 'Maintenance Due', description: 'When machine maintenance is due' },
  { type: 'machine.maintenance.completed', category: 'machines', name: 'Maintenance Completed', description: 'When machine maintenance is completed' },
  { type: 'machine.calibration.needed', category: 'machines', name: 'Calibration Needed', description: 'When machine calibration is needed' },
  { type: 'machine.uptime.low', category: 'machines', name: 'Low Machine Uptime', description: 'When machine uptime drops below threshold' },
  { type: 'machine.offline', category: 'machines', name: 'Machine Offline', description: 'When a machine goes offline' },
  { type: 'machine.online', category: 'machines', name: 'Machine Online', description: 'When a machine comes online' },

  // Design Events (6)
  { type: 'design.created', category: 'designs', name: 'Design Created', description: 'When a new design is created' },
  { type: 'design.updated', category: 'designs', name: 'Design Updated', description: 'When a design is updated' },
  { type: 'design.approved', category: 'designs', name: 'Design Approved', description: 'When a design is approved' },
  { type: 'design.rejected', category: 'designs', name: 'Design Rejected', description: 'When a design is rejected' },
  { type: 'design.version.created', category: 'designs', name: 'Design Version Created', description: 'When a new design version is created' },
  { type: 'design.template.added', category: 'designs', name: 'Template Added', description: 'When a new design template is added' },

  // Order Events (5)
  { type: 'order.placed', category: 'orders', name: 'Order Placed', description: 'When a new order is placed' },
  { type: 'order.confirmed', category: 'orders', name: 'Order Confirmed', description: 'When an order is confirmed' },
  { type: 'order.shipped', category: 'orders', name: 'Order Shipped', description: 'When an order is shipped' },
  { type: 'order.delivered', category: 'orders', name: 'Order Delivered', description: 'When an order is delivered' },
  { type: 'order.returned', category: 'orders', name: 'Order Returned', description: 'When an order is returned' },

  // User Events (5)
  { type: 'user.created', category: 'users', name: 'User Created', description: 'When a new user is created' },
  { type: 'user.updated', category: 'users', name: 'User Updated', description: 'When a user is updated' },
  { type: 'user.login', category: 'users', name: 'User Login', description: 'When a user logs in' },
  { type: 'user.role.changed', category: 'users', name: 'User Role Changed', description: 'When a user role is changed' },
  { type: 'user.deactivated', category: 'users', name: 'User Deactivated', description: 'When a user is deactivated' },

  // Tracking Events (6)
  { type: 'tracking.part.scanned', category: 'tracking', name: 'Part Scanned', description: 'When a part is scanned at a station' },
  { type: 'tracking.part.moved', category: 'tracking', name: 'Part Moved', description: 'When a part moves to a new station' },
  { type: 'tracking.part.completed', category: 'tracking', name: 'Part Completed', description: 'When a part completes all stations' },
  { type: 'tracking.station.busy', category: 'tracking', name: 'Station Busy', description: 'When a station has many parts queued' },
  { type: 'tracking.rework.started', category: 'tracking', name: 'Rework Started', description: 'When a part goes back for rework' },
  { type: 'tracking.delay.detected', category: 'tracking', name: 'Delay Detected', description: 'When a part is delayed at a station' },

  // System Events (5)
  { type: 'system.backup.completed', category: 'system', name: 'Backup Completed', description: 'When a system backup completes' },
  { type: 'system.error.occurred', category: 'system', name: 'System Error', description: 'When a system error occurs' },
  { type: 'system.update.available', category: 'system', name: 'Update Available', description: 'When a system update is available' },
  { type: 'system.performance.degraded', category: 'system', name: 'Performance Degraded', description: 'When system performance degrades' },
  { type: 'system.scheduled.task', category: 'system', name: 'Scheduled Task', description: 'When a scheduled task runs' }
]

export const getEventsByCategory = (category) => {
  return SUBSCRIBABLE_EVENTS.filter(e => e.category === category)
}

export const getAllCategories = () => {
  return [...new Set(SUBSCRIBABLE_EVENTS.map(e => e.category))]
}

export default SUBSCRIBABLE_EVENTS
