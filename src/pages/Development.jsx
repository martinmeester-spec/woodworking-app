import { useState, useEffect } from 'react'
import { Save, RefreshCw, FileText, Code, Trash2, ToggleLeft, ToggleRight, AlertTriangle, Database, Server, Layers, Globe, Shield, Zap, Box, Settings, GitBranch } from 'lucide-react'
import { api } from '../services/api'

function Development({ onDeveloperModeChange }) {
  const [content, setContent] = useState('')
  const [filePath, setFilePath] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [resettingTemplates, setResettingTemplates] = useState(false)
  const [developerMode, setDeveloperMode] = useState(false)
  const [message, setMessage] = useState(null)
  const [activeTab, setActiveTab] = useState('tools') // tools, architecture, database, frontend, backend, api

  useEffect(() => {
    loadFile()
    loadDeveloperMode()
  }, [])

  const loadFile = async () => {
    setLoading(true)
    try {
      const response = await api.get('/dev/myway')
      setContent(response?.content || '')
      setFilePath(response?.path || '')
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load file: ' + error.message })
    }
    setLoading(false)
  }

  const loadDeveloperMode = async () => {
    try {
      const response = await api.get('/dev/developer-mode')
      setDeveloperMode(response?.enabled || false)
    } catch (error) {
      console.error('Failed to load developer mode:', error)
    }
  }

  const toggleDeveloperMode = async () => {
    try {
      const newValue = !developerMode
      await api.put('/dev/developer-mode', { enabled: newValue })
      setDeveloperMode(newValue)
      if (onDeveloperModeChange) {
        onDeveloperModeChange(newValue)
      }
      setMessage({ type: 'success', text: `Developer mode ${newValue ? 'enabled' : 'disabled'}` })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to toggle developer mode: ' + error.message })
    }
  }

  const deleteProductionData = async () => {
    if (!confirm('⚠️ WARNING: This will permanently delete ALL production data including orders, jobs, panels, tracking, work logs, defects, and rework orders. This action cannot be undone!\n\nAre you sure you want to proceed?')) {
      return
    }
    
    setDeleting(true)
    try {
      const response = await api.delete('/dev/production-data')
      if (response?.success) {
        setMessage({ type: 'success', text: 'All production data deleted successfully!' })
      } else {
        setMessage({ type: 'error', text: response?.error || 'Failed to delete data' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete production data: ' + error.message })
    }
    setDeleting(false)
    setTimeout(() => setMessage(null), 5000)
  }

  const resetTemplates = async () => {
    if (!confirm('This will delete all existing design templates and create 20 new realistic cabinet templates. Continue?')) {
      return
    }
    
    setResettingTemplates(true)
    try {
      const response = await api.post('/dev/reset-templates', {})
      if (response?.success) {
        setMessage({ type: 'success', text: response?.message })
      } else {
        setMessage({ type: 'error', text: response?.error || 'Failed to reset templates' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reset templates: ' + error.message })
    }
    setResettingTemplates(false)
    setTimeout(() => setMessage(null), 5000)
  }

  const saveFile = async () => {
    setSaving(true)
    try {
      const response = await api.put('/dev/myway', { content })
      if (response?.success) {
        setMessage({ type: 'success', text: 'File saved successfully!' })
      } else {
        setMessage({ type: 'error', text: response?.error || 'Failed to save' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save file: ' + error.message })
    }
    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  if (loading) {
    return (
      <div className="pt-14 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  const TABS = [
    { id: 'tools', name: 'Dev Tools', icon: Settings },
    { id: 'architecture', name: 'Architecture', icon: Layers },
    { id: 'database', name: 'Database', icon: Database },
    { id: 'frontend', name: 'Frontend', icon: Globe },
    { id: 'backend', name: 'Backend', icon: Server },
    { id: 'api', name: 'API Reference', icon: Code }
  ]

  return (
    <div className="pt-14">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Code size={24} /> Development & Technical Documentation
          </h2>
          <p className="text-gray-600">Tools, architecture, and comprehensive system documentation</p>
        </div>
        {activeTab === 'tools' && (
          <div className="flex gap-2">
            <button
              onClick={loadFile}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw size={18} /> Reload
            </button>
            <button
              onClick={saveFile}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              <Save size={18} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-md mb-6">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-amber-600 text-amber-600 bg-amber-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                {tab.name}
              </button>
            )
          })}
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'tools' && (
        <>
      {/* Developer Mode Toggle & Data Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Developer Mode Card */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            {developerMode ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} className="text-gray-400" />}
            Developer Mode
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            When enabled, right-click anywhere in the app to capture context and add notes to myway.txt
          </p>
          <button
            onClick={toggleDeveloperMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              developerMode 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {developerMode ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {developerMode ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Delete Production Data Card */}
        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-red-100">
          <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} /> Danger Zone
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Delete all production data including orders, jobs, panels, tracking, work logs, defects, and rework orders.
          </p>
          <button
            onClick={deleteProductionData}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Trash2 size={18} /> {deleting ? 'Deleting...' : 'Delete All Production Data'}
          </button>
        </div>
      </div>

      {/* Reset Templates Card */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-2 border-blue-100">
        <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
          <RefreshCw size={20} /> Design Templates
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Reset all design templates with 20 new realistic cabinet designs including IKEA-style bookcases, kitchen cabinets, wardrobes, bathroom vanities, and more.
        </p>
        <button
          onClick={resetTemplates}
          disabled={resettingTemplates}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={resettingTemplates ? 'animate-spin' : ''} /> 
          {resettingTemplates ? 'Resetting...' : 'Reset Design Templates (20 New)'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4 text-gray-600">
          <FileText size={18} />
          <span className="font-mono text-sm">{filePath}</span>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            myway.txt - Development Instructions
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            placeholder="Enter your development instructions here..."
          />
        </div>

        <div className="text-sm text-gray-500">
          <p>This file contains instructions for the development process.</p>
          <p>Changes will be saved to the project root directory.</p>
        </div>
      </div>
      </>
      )}

      {/* Architecture Tab */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Layers size={24} /> System Architecture Overview
            </h3>
            <p className="text-gray-600 mb-6">
              The Woodworking Cabinet System is a full-stack web application built with modern technologies,
              following a client-server architecture with a RESTful API layer.
            </p>

            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-6">
              <pre>{`
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      React Application                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │  Design  │ │Production│ │ Tracking │ │   User   │           │   │
│  │  │  Studio  │ │   Floor  │ │  System  │ │   Mgmt   │           │   │
│  │  │  (3D)    │ │  (QR)    │ │ (History)│ │  (RBAC)  │           │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │   │
│  │       │            │            │            │                  │   │
│  │       └────────────┴────────────┴────────────┘                  │   │
│  │                         │                                        │   │
│  │                   API Service Layer                              │   │
│  │                   (fetch wrapper)                                │   │
│  └─────────────────────────┼───────────────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────────────┘
                              │ HTTP/REST (JSON)
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SERVER LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Express.js Server                            │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │ /designs │ │/production│ │/tracking │ │  /auth   │           │   │
│  │  │  routes  │ │  routes  │ │  routes  │ │  routes  │           │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │   │
│  │       │            │            │            │                  │   │
│  │       └────────────┴────────────┴────────────┘                  │   │
│  │                         │                                        │   │
│  │                   Sequelize ORM                                  │   │
│  │              (Models, Migrations, Queries)                       │   │
│  └─────────────────────────┼───────────────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────────────┘
                              │ SQL Queries
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     PostgreSQL Database                          │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │   │
│  │  │  Users  │ │ Designs │ │ Orders  │ │Tracking │ │ Actions │  │   │
│  │  │         │ │  Parts  │ │  Jobs   │ │         │ │         │  │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
              `}</pre>
            </div>

            <h4 className="font-semibold text-gray-800 mb-3">Key Architectural Decisions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-semibold text-blue-800 mb-2">CSS 3D Transforms</h5>
                <p className="text-sm text-blue-700">
                  Chosen over WebGL/Three.js for simpler implementation. CSS transforms provide 
                  hardware-accelerated 3D rendering sufficient for cabinet visualization without 
                  complex shader programming.
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="font-semibold text-green-800 mb-2">PostgreSQL + Sequelize</h5>
                <p className="text-sm text-green-700">
                  Relational database chosen for strong data integrity with foreign keys. 
                  Sequelize ORM provides type-safe queries and easy migrations.
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h5 className="font-semibold text-purple-800 mb-2">REST API Design</h5>
                <p className="text-sm text-purple-700">
                  RESTful endpoints chosen over GraphQL for simplicity. Clear resource-based 
                  URLs match the application's CRUD operations naturally.
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <h5 className="font-semibold text-amber-800 mb-2">Server-side QR Generation</h5>
                <p className="text-sm text-amber-700">
                  QR codes generated on server to ensure consistency across all clients. 
                  Stored in database for verification during scanning.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h4 className="font-semibold text-gray-800 mb-4">Data Flow: Design to Production</h4>
            <div className="flex items-center gap-2 flex-wrap text-sm mb-4">
              <span className="px-3 py-1 bg-blue-500 text-white rounded-full">1. Create Design</span>
              <span className="text-gray-400">→</span>
              <span className="px-3 py-1 bg-green-500 text-white rounded-full">2. Generate Parts</span>
              <span className="text-gray-400">→</span>
              <span className="px-3 py-1 bg-purple-500 text-white rounded-full">3. Create Order</span>
              <span className="text-gray-400">→</span>
              <span className="px-3 py-1 bg-orange-500 text-white rounded-full">4. Track Parts</span>
              <span className="text-gray-400">→</span>
              <span className="px-3 py-1 bg-emerald-500 text-white rounded-full">5. Complete</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li><strong>Design Creation:</strong> User creates cabinet in 3D Design Studio with precise dimensions</li>
              <li><strong>Part Generation:</strong> System generates individual parts (panels, doors, shelves) with QR codes</li>
              <li><strong>Order Creation:</strong> Design is converted to ProductionOrder with associated Jobs</li>
              <li><strong>Part Tracking:</strong> Each part is scanned at stations (Wall Saw → CNC → Banding → Packaging)</li>
              <li><strong>Completion:</strong> Order status updates automatically based on all parts' progress</li>
            </ol>
          </div>
        </div>
      )}

      {/* Database Tab */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Database size={24} /> Database Schema
            </h3>
            
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto mb-6">
              <pre>{`
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│       Users         │     │      Designs        │     │    DesignParts      │
├─────────────────────┤     ├─────────────────────┤     ├─────────────────────┤
│ id          UUID PK │     │ id          UUID PK │◄────│ id          UUID PK │
│ email       VARCHAR │◄─┐  │ name        VARCHAR │     │ designId    UUID FK │
│ firstName   VARCHAR │  │  │ width       DECIMAL │     │ partType    VARCHAR │
│ lastName    VARCHAR │  │  │ height      DECIMAL │     │ name        VARCHAR │
│ role        ENUM    │  │  │ depth       DECIMAL │     │ width       DECIMAL │
│ passwordHash VARCHAR│  │  │ modelData   JSONB   │     │ height      DECIMAL │
│ createdAt   TIMESTAMP│  │  │ createdBy   UUID FK │─────│ depth       DECIMAL │
│ updatedAt   TIMESTAMP│  │  │ createdAt   TIMESTAMP│    │ positionX   DECIMAL │
└─────────────────────┘  │  │ updatedAt   TIMESTAMP│    │ positionY   DECIMAL │
                         │  └─────────────────────┘     │ positionZ   DECIMAL │
                         │                              │ qrCode      TEXT    │
┌─────────────────────┐  │  ┌─────────────────────┐     │ qrCodeData  VARCHAR │
│  ProductionOrder    │  │  │   ProductionJob     │     └─────────────────────┘
├─────────────────────┤  │  ├─────────────────────┤
│ id          UUID PK │◄─┼──│ id          UUID PK │     ┌─────────────────────┐
│ orderNumber VARCHAR │  │  │ orderId     UUID FK │     │      Panel          │
│ status      VARCHAR │  │  │ stationId   UUID FK │     ├─────────────────────┤
│ designId    UUID FK │  │  │ jobNumber   VARCHAR │◄────│ id          UUID PK │
│ createdBy   UUID FK │──┘  │ jobType     VARCHAR │     │ jobId       UUID FK │
│ customerName VARCHAR│     │ status      VARCHAR │     │ partType    VARCHAR │
│ dueDate     DATE    │     │ designerId  UUID FK │     │ dimensions  VARCHAR │
│ totalPanels INTEGER │     │ createdAt   TIMESTAMP│    │ status      VARCHAR │
│ completedPanels INT │     │ updatedAt   TIMESTAMP│    │ createdAt   TIMESTAMP│
│ createdAt   TIMESTAMP│    └─────────────────────┘     └─────────────────────┘
│ updatedAt   TIMESTAMP│
└─────────────────────┘     ┌─────────────────────┐     ┌─────────────────────┐
                            │   PartTracking      │     │    UserAction       │
┌─────────────────────┐     ├─────────────────────┤     ├─────────────────────┤
│  DesignTemplate     │     │ id          UUID PK │     │ id          UUID PK │
├─────────────────────┤     │ partId      VARCHAR │     │ userId      UUID FK │
│ id          UUID PK │     │ partName    VARCHAR │     │ action      VARCHAR │
│ name        VARCHAR │     │ orderId     UUID FK │     │ actionType  VARCHAR │
│ description TEXT    │     │ orderNumber VARCHAR │     │ entityType  VARCHAR │
│ category    VARCHAR │     │ station     ENUM    │     │ entityId    UUID    │
│ modelData   JSONB   │     │ scannedBy   VARCHAR │     │ details     JSONB   │
│ thumbnail   TEXT    │     │ scannedByName VARCHAR│    │ createdAt   TIMESTAMP│
│ createdAt   TIMESTAMP│    │ scanTime    TIMESTAMP│    └─────────────────────┘
└─────────────────────┘     │ barcode     VARCHAR │
                            └─────────────────────┘
              `}</pre>
            </div>

            <h4 className="font-semibold text-gray-800 mb-3">Table Descriptions</h4>
            <div className="space-y-4">
              <TableDoc
                name="Users"
                description="User accounts with role-based access control"
                keyFields={['id (UUID)', 'email (unique)', 'role (admin/designer/operator)', 'passwordHash (bcrypt)']}
              />
              <TableDoc
                name="Designs"
                description="Cabinet designs with 3D model data stored as JSONB"
                keyFields={['id (UUID)', 'modelData (JSONB with parts array)', 'createdBy (FK to Users)']}
              />
              <TableDoc
                name="DesignParts"
                description="Individual parts extracted from designs with QR codes"
                keyFields={['designId (FK)', 'partType', 'dimensions (w/h/d)', 'qrCode (base64 data URL)']}
              />
              <TableDoc
                name="ProductionOrder"
                description="Production orders created from designs"
                keyFields={['orderNumber (unique)', 'status', 'designId (FK)', 'totalPanels/completedPanels']}
              />
              <TableDoc
                name="PartTracking"
                description="Tracks part movements through production stations"
                keyFields={['partId', 'station (enum)', 'scannedBy', 'scanTime']}
              />
            </div>
          </div>
        </div>
      )}

      {/* Frontend Tab */}
      {activeTab === 'frontend' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Globe size={24} /> Frontend Architecture
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Technology Stack</h4>
                <ul className="space-y-2">
                  <TechItem name="React 18" desc="Component-based UI with hooks" />
                  <TechItem name="Vite" desc="Fast build tool and dev server" />
                  <TechItem name="TailwindCSS" desc="Utility-first CSS framework" />
                  <TechItem name="Lucide React" desc="Beautiful icon library" />
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Key Features</h4>
                <ul className="space-y-2">
                  <TechItem name="CSS 3D Transforms" desc="Hardware-accelerated 3D rendering" />
                  <TechItem name="Responsive Design" desc="Mobile-friendly layouts" />
                  <TechItem name="Real-time Updates" desc="Polling for live data" />
                  <TechItem name="Modal Dialogs" desc="User-friendly notifications" />
                </ul>
              </div>
            </div>

            <h4 className="font-semibold text-gray-800 mb-3">Project Structure</h4>
            <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
              <pre>{`src/
├── components/           # Reusable UI components
│   ├── Header.jsx       # Top navigation bar
│   ├── Sidebar.jsx      # Side navigation menu
│   └── ...
├── pages/               # Page components
│   ├── Dashboard.jsx    # Main dashboard
│   ├── DesignStudio3D.jsx  # 3D cabinet designer
│   ├── Production.jsx   # Production orders list
│   ├── ProductionFloor.jsx # Station-based tracking
│   ├── OrderDetail.jsx  # Order details with trace
│   └── ...
├── services/
│   └── api.js          # API service wrapper
├── App.jsx             # Main app with routing
└── main.jsx            # Entry point`}</pre>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h4 className="font-semibold text-gray-800 mb-3">3D Rendering Approach</h4>
            <p className="text-gray-600 mb-4">
              The 3D cabinet visualization uses CSS 3D transforms with <code className="bg-gray-100 px-1 rounded">transform-style: preserve-3d</code> 
              and <code className="bg-gray-100 px-1 rounded">perspective</code> to create depth perception.
            </p>
            <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{`// Each part is rendered as a 3D box with 6 faces
<div style={{
  transformStyle: 'preserve-3d',
  transform: \`translate3d(\${cx}px, \${cy}px, \${cz}px)\`
}}>
  {/* Front face */}
  <div style={{ transform: 'translateZ(-depth/2)' }} />
  {/* Back face */}
  <div style={{ transform: 'translateZ(depth/2) rotateY(180deg)' }} />
  {/* Left/Right faces */}
  <div style={{ transform: 'rotateY(-90deg) translateZ(width/2)' }} />
  {/* Top/Bottom faces */}
  <div style={{ transform: 'rotateX(90deg) translateZ(height/2)' }} />
</div>`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Backend Tab */}
      {activeTab === 'backend' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Server size={24} /> Backend Architecture
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Technology Stack</h4>
                <ul className="space-y-2">
                  <TechItem name="Node.js" desc="JavaScript runtime environment" />
                  <TechItem name="Express.js" desc="Web application framework" />
                  <TechItem name="Sequelize" desc="Promise-based ORM" />
                  <TechItem name="PostgreSQL" desc="Relational database" />
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Additional Libraries</h4>
                <ul className="space-y-2">
                  <TechItem name="qrcode" desc="QR code generation" />
                  <TechItem name="uuid" desc="Unique ID generation" />
                  <TechItem name="bcrypt" desc="Password hashing" />
                  <TechItem name="cors" desc="Cross-origin requests" />
                </ul>
              </div>
            </div>

            <h4 className="font-semibold text-gray-800 mb-3">Project Structure</h4>
            <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
              <pre>{`backend/
├── models/              # Sequelize models
│   ├── User.js         # User model with auth
│   ├── Design.js       # Design with modelData
│   ├── DesignPart.js   # Individual parts
│   ├── ProductionOrder.js
│   ├── PartTracking.js # Station tracking
│   └── index.js        # Model associations
├── routes/             # Express route handlers
│   ├── auth.js        # Authentication
│   ├── designs.js     # Design CRUD + QR
│   ├── production.js  # Orders and jobs
│   ├── tracking.js    # Part scanning
│   └── dev.js         # Development tools
├── config/
│   └── database.js    # DB connection config
└── server.js          # Express app entry`}</pre>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h4 className="font-semibold text-gray-800 mb-3">Key Backend Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-semibold text-blue-800 mb-2">QR Code Generation</h5>
                <p className="text-sm text-blue-700">
                  Server generates QR codes containing part ID, dimensions, and order info. 
                  Stored as base64 data URLs in the database.
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="font-semibold text-green-800 mb-2">Order Status Updates</h5>
                <p className="text-sm text-green-700">
                  When parts are scanned, the system calculates the minimum station all parts 
                  have reached and updates the order status accordingly.
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h5 className="font-semibold text-purple-800 mb-2">UUID Validation</h5>
                <p className="text-sm text-purple-700">
                  All IDs are validated before database operations. Non-UUID values are 
                  sanitized to prevent SQL errors.
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <h5 className="font-semibold text-amber-800 mb-2">Cascade Deletes</h5>
                <p className="text-sm text-amber-700">
                  Foreign key constraints with CASCADE ensure data integrity when deleting 
                  orders, jobs, or related records.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Tab */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Code size={24} /> API Reference
            </h3>

            <div className="space-y-6">
              <APISection
                title="Authentication"
                endpoints={[
                  { method: 'POST', path: '/api/auth/login', desc: 'Login with email/password' },
                  { method: 'POST', path: '/api/auth/register', desc: 'Register new user' },
                  { method: 'GET', path: '/api/auth/me', desc: 'Get current user info' }
                ]}
              />

              <APISection
                title="Designs"
                endpoints={[
                  { method: 'GET', path: '/api/designs', desc: 'List all designs' },
                  { method: 'POST', path: '/api/designs', desc: 'Create new design' },
                  { method: 'GET', path: '/api/designs/:id', desc: 'Get design by ID' },
                  { method: 'PUT', path: '/api/designs/:id', desc: 'Update design' },
                  { method: 'DELETE', path: '/api/designs/:id', desc: 'Delete design' },
                  { method: 'POST', path: '/api/designs/:id/generate-qr', desc: 'Generate QR codes for parts' },
                  { method: 'GET', path: '/api/designs/:id/parts', desc: 'Get parts with QR codes' }
                ]}
              />

              <APISection
                title="Production"
                endpoints={[
                  { method: 'GET', path: '/api/production/orders', desc: 'List all orders' },
                  { method: 'POST', path: '/api/production/orders', desc: 'Create production order' },
                  { method: 'GET', path: '/api/production/orders/:id', desc: 'Get order details' },
                  { method: 'PUT', path: '/api/production/orders/:id', desc: 'Update order status' },
                  { method: 'GET', path: '/api/production/stations', desc: 'List production stations' }
                ]}
              />

              <APISection
                title="Tracking"
                endpoints={[
                  { method: 'POST', path: '/api/tracking/scan', desc: 'Record part scan at station' },
                  { method: 'GET', path: '/api/tracking/stations/:station/parts', desc: 'Get parts at station' },
                  { method: 'GET', path: '/api/tracking/parts/:partId/history', desc: 'Get part history' },
                  { method: 'GET', path: '/api/tracking/orders/:orderId/tracking', desc: 'Get order tracking' },
                  { method: 'GET', path: '/api/tracking/parts/:partId/qrcode', desc: 'Get QR code for part' }
                ]}
              />

              <APISection
                title="Templates"
                endpoints={[
                  { method: 'GET', path: '/api/templates', desc: 'List design templates' },
                  { method: 'POST', path: '/api/templates', desc: 'Create template from design' }
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper Components
function TableDoc({ name, description, keyFields }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h5 className="font-semibold text-gray-800">{name}</h5>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      <div className="flex flex-wrap gap-2">
        {keyFields.map((field, i) => (
          <span key={i} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-mono">{field}</span>
        ))}
      </div>
    </div>
  )
}

function TechItem({ name, desc }) {
  return (
    <li className="flex items-start gap-2">
      <Zap size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
      <span><strong className="text-gray-800">{name}:</strong> <span className="text-gray-600">{desc}</span></span>
    </li>
  )
}

function APISection({ title, endpoints }) {
  const methodColors = {
    GET: 'bg-green-100 text-green-700',
    POST: 'bg-blue-100 text-blue-700',
    PUT: 'bg-yellow-100 text-yellow-700',
    DELETE: 'bg-red-100 text-red-700'
  }
  
  return (
    <div>
      <h4 className="font-semibold text-gray-800 mb-3 border-b pb-2">{title}</h4>
      <div className="space-y-2">
        {endpoints.map((ep, i) => (
          <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${methodColors[ep.method]}`}>
              {ep.method}
            </span>
            <code className="text-sm text-gray-700 flex-1">{ep.path}</code>
            <span className="text-sm text-gray-500">{ep.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Development
