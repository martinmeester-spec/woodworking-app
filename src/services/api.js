// Use environment variable or default to localhost for development
// In production with Docker, use relative path that nginx will proxy
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  // Check if we're running under a base path (Docker deployment)
  if (window.location.pathname.startsWith('/woodworking-app')) {
    return '/woodworking-app/api'
  }
  return 'http://localhost:3001/api'
}
const API_URL = getApiUrl()

// Export for use in other components
export const API_BASE_URL = API_URL

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'API Error')
  }
  return response.json()
}

export const api = {
  // Generic GET method - returns raw data
  get: async (endpoint) => {
    const response = await fetch(`${API_URL}${endpoint}`)
    return handleResponse(response)
  },
  
  // Generic PUT method
  put: async (endpoint, body) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    return handleResponse(response)
  },
  
  // Generic POST method
  post: async (endpoint, body) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    return handleResponse(response)
  },
  
  // Generic DELETE method
  delete: async (endpoint) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })
    return handleResponse(response)
  },
  
  // Dashboard
  getDashboardStats: () => fetch(`${API_URL}/dashboard/stats`).then(handleResponse),
  
  // Database Management
  getDbStatus: () => fetch(`${API_URL}/db/status`).then(handleResponse),
  syncDb: (force = false) => fetch(`${API_URL}/db/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force })
  }).then(handleResponse),
  seedDb: () => fetch(`${API_URL}/db/seed`, { method: 'POST' }).then(handleResponse),
  
  // Users
  getUsers: () => fetch(`${API_URL}/users`).then(handleResponse),
  getUser: (id) => fetch(`${API_URL}/users/${id}`).then(handleResponse),
  createUser: (data) => fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateUser: (id, data) => fetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteUser: (id) => fetch(`${API_URL}/users/${id}`, { method: 'DELETE' }).then(handleResponse),
  login: (email, password) => fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then(handleResponse),
  
  // Designs
  getDesigns: () => fetch(`${API_URL}/designs`).then(handleResponse),
  getDesign: (id) => fetch(`${API_URL}/designs/${id}`).then(handleResponse),
  createDesign: (data) => fetch(`${API_URL}/designs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateDesign: (id, data) => fetch(`${API_URL}/designs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteDesign: (id) => fetch(`${API_URL}/designs/${id}`, { method: 'DELETE' }).then(handleResponse),
  getTemplates: () => fetch(`${API_URL}/designs/templates/all`).then(handleResponse),
  getDesignParts: (id) => fetch(`${API_URL}/designs/${id}/parts`).then(handleResponse),
  createPartsWithQRCodes: (id, parts) => fetch(`${API_URL}/designs/${id}/create-parts-with-qrcodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parts })
  }).then(handleResponse),
  getPartQRCode: (designId, partId) => fetch(`${API_URL}/designs/${designId}/parts/${partId}/qrcode`).then(handleResponse),
  
  // Production
  getOrders: () => fetch(`${API_URL}/production/orders`).then(handleResponse),
  getOrder: (id) => fetch(`${API_URL}/production/orders/${id}`).then(handleResponse),
  createOrder: (data) => fetch(`${API_URL}/production/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateOrder: (id, data) => fetch(`${API_URL}/production/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  getJobs: () => fetch(`${API_URL}/production/jobs`).then(handleResponse),
  getPanels: () => fetch(`${API_URL}/production/panels`).then(handleResponse),
  getStations: () => fetch(`${API_URL}/production/stations`).then(handleResponse),
  scanPanel: (id, data) => fetch(`${API_URL}/production/panels/${id}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  
  // Inventory
  getParts: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return fetch(`${API_URL}/inventory/parts${query ? '?' + query : ''}`).then(handleResponse)
  },
  getPart: (id) => fetch(`${API_URL}/inventory/parts/${id}`).then(handleResponse),
  createPart: (data) => fetch(`${API_URL}/inventory/parts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updatePart: (id, data) => fetch(`${API_URL}/inventory/parts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deletePart: (id) => fetch(`${API_URL}/inventory/parts/${id}`, { method: 'DELETE' }).then(handleResponse),
  getStockLevels: () => fetch(`${API_URL}/inventory/stock-levels`).then(handleResponse),
  adjustInventory: (id, data) => fetch(`${API_URL}/inventory/parts/${id}/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  
  // Machines
  getMachines: () => fetch(`${API_URL}/machines`).then(handleResponse),
  getMachine: (id) => fetch(`${API_URL}/machines/${id}`).then(handleResponse),
  createMachine: (data) => fetch(`${API_URL}/machines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateMachine: (id, data) => fetch(`${API_URL}/machines/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteMachine: (id) => fetch(`${API_URL}/machines/${id}`, { method: 'DELETE' }).then(handleResponse),
  getMachineHealth: (id) => fetch(`${API_URL}/machines/${id}/health`).then(handleResponse),
  createMaintenance: (id, data) => fetch(`${API_URL}/machines/${id}/maintenance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  getAllMaintenance: () => fetch(`${API_URL}/machines/maintenance/all`).then(handleResponse),
  
  // Quality
  getDefects: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return fetch(`${API_URL}/quality/defects${query ? '?' + query : ''}`).then(handleResponse)
  },
  getDefect: (id) => fetch(`${API_URL}/quality/defects/${id}`).then(handleResponse),
  createDefect: (data) => fetch(`${API_URL}/quality/defects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateDefect: (id, data) => fetch(`${API_URL}/quality/defects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  getQualitySummary: () => fetch(`${API_URL}/quality/summary`).then(handleResponse),
}

export default api
