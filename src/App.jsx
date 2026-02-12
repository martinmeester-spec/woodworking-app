import { useState, useEffect } from 'react'
import { FileEdit, X, Save } from 'lucide-react'
import { api } from './services/api'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import { HelpProvider, HelpButton, HelpPanel, PAGE_HELP } from './components/UserHelp'
import Dashboard from './pages/Dashboard'
import DesignStudio3D from './pages/DesignStudio3D'
import Production from './pages/Production'
import Inventory from './pages/Inventory'
import Machines from './pages/Machines'
import Quality from './pages/Quality'
import Settings from './pages/Settings'
import Login from './pages/Login'
import UserManagement from './pages/UserManagement'
import TestCenter from './pages/TestCenter'
import Reports from './pages/Reports'
import OrderDetail from './pages/OrderDetail'
import MachineDetail from './pages/MachineDetail'
import InventoryDetail from './pages/InventoryDetail'
import DefectDetail from './pages/DefectDetail'
import UserDetail from './pages/UserDetail'
import DesignDetail from './pages/DesignDetail'
import OrdersList from './pages/OrdersList'
import Development from './pages/Development'
import Tracking from './pages/Tracking'
import ProductionFloor from './pages/ProductionFloor'
import Documentation from './pages/Documentation'
import CostEstimation from './pages/CostEstimation'
import CustomerPortal from './pages/CustomerPortal'
import CADExport from './pages/CADExport'
import MobileScanner from './pages/MobileScanner'
import Analytics from './pages/Analytics'
import AccountingIntegration from './pages/AccountingIntegration'
import BatchProcessing from './pages/BatchProcessing'
import MaintenanceTracking from './pages/MaintenanceTracking'
import { LanguageProvider } from './i18n/LanguageContext'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [detailId, setDetailId] = useState(null)
  const [listType, setListType] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showMywayEditor, setShowMywayEditor] = useState(false)
  const [mywayContent, setMywayContent] = useState('')
  const [savingMyway, setSavingMyway] = useState(false)
  const [developerMode, setDeveloperMode] = useState(false)
  const [rightClickContext, setRightClickContext] = useState(null)

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state) {
        setCurrentPage(event.state.page || 'dashboard')
        setDetailId(event.state.detailId || null)
        setListType(event.state.listType || null)
      } else {
        // No state means we're at the initial entry - go to dashboard
        setCurrentPage('dashboard')
        setDetailId(null)
        setListType(null)
      }
    }

    window.addEventListener('popstate', handlePopState)
    
    // Parse initial hash and set state
    const hash = window.location.hash.slice(1) // Remove #
    if (hash) {
      const parts = hash.split('/')
      const page = parts[0] || 'dashboard'
      const id = parts[1] || null
      setCurrentPage(page)
      setDetailId(id)
      window.history.replaceState({ page, detailId: id }, '', `#${hash}`)
    } else {
      window.history.replaceState({ page: 'dashboard' }, '', '#dashboard')
    }

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Push to history when page changes
  const navigateTo = (page, id = null, type = null) => {
    const state = { page, detailId: id, listType: type }
    const hash = id ? `#${page}/${id}` : `#${page}`
    window.history.pushState(state, '', hash)
    setCurrentPage(page)
    setDetailId(id)
    setListType(type)
  }

  const navigateToDetail = (page, id) => {
    navigateTo(page, id)
  }

  const navigateBack = (page) => {
    // Use browser back if possible, otherwise navigate
    if (window.history.length > 1) {
      window.history.back()
    } else {
      navigateTo(page)
    }
  }

  const navigateToList = (type) => {
    navigateTo('orders-list', null, type)
  }

  // Wrapper for setCurrentPage that also updates history
  const setCurrentPageWithHistory = (page) => {
    navigateTo(page)
  }

  // Load developer mode on mount
  useEffect(() => {
    const loadDeveloperMode = async () => {
      try {
        const response = await api.get('/dev/developer-mode')
        setDeveloperMode(response?.enabled || false)
      } catch (error) {
        console.error('Failed to load developer mode:', error)
      }
    }
    loadDeveloperMode()
  }, [])

  // Handle right-click for developer mode
  useEffect(() => {
    const handleContextMenu = async (e) => {
      if (!developerMode) return
      
      e.preventDefault()
      
      // Get context information from clicked element
      const target = e.target
      const elementInfo = {
        tagName: target.tagName,
        className: target.className,
        id: target.id,
        text: target.innerText?.substring(0, 100) || '',
        dataAttributes: Object.keys(target.dataset || {}).map(k => `${k}: ${target.dataset[k]}`).join(', ')
      }
      
      // Get parent context
      const parentInfo = target.parentElement ? {
        tagName: target.parentElement.tagName,
        className: target.parentElement.className,
        id: target.parentElement.id
      } : null
      
      const contextData = {
        page: currentPage,
        detailId: detailId,
        timestamp: new Date().toLocaleString(),
        element: elementInfo,
        parent: parentInfo,
        url: window.location.href
      }
      
      setRightClickContext(contextData)
      
      // Load myway content inline
      try {
        const response = await api.get('/dev/myway')
        setMywayContent(response?.content || '')
      } catch (error) {
        console.error('Failed to load myway.txt:', error)
      }
      
      setShowMywayEditor(true)
    }
    
    if (developerMode) {
      document.addEventListener('contextmenu', handleContextMenu)
    }
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [developerMode, currentPage, detailId])

  const handleDeveloperModeChange = (enabled) => {
    setDeveloperMode(enabled)
  }

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        // Ensure user has a valid role, otherwise set default Admin
        if (parsedUser && parsedUser.role) {
          setUser(parsedUser)
          setIsAuthenticated(true)
        } else {
          // Set default Admin user
          const defaultUser = { firstName: 'Admin', lastName: 'User', role: 'Admin', email: 'admin@woodworking.com' }
          setUser(defaultUser)
          setIsAuthenticated(true)
          localStorage.setItem('user', JSON.stringify(defaultUser))
        }
      } catch (e) {
        // Set default Admin user on error
        const defaultUser = { firstName: 'Admin', lastName: 'User', role: 'Admin', email: 'admin@woodworking.com' }
        setUser(defaultUser)
        setIsAuthenticated(true)
        localStorage.setItem('user', JSON.stringify(defaultUser))
      }
    } else {
      // No stored user, set default Admin user for development
      const defaultUser = { firstName: 'Admin', lastName: 'User', role: 'Admin', email: 'admin@woodworking.com' }
      setUser(defaultUser)
      setIsAuthenticated(true)
      localStorage.setItem('user', JSON.stringify(defaultUser))
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
  }

  const loadMywayContent = async () => {
    try {
      const response = await api.get('/dev/myway')
      setMywayContent(response?.content || '')
    } catch (error) {
      console.error('Failed to load myway.txt:', error)
    }
  }

  const saveMywayContent = async () => {
    setSavingMyway(true)
    try {
      // Build context string with right-click data if available
      let contextParts = [`Saved from "${currentPage}" page at ${new Date().toLocaleString()}`]
      
      if (rightClickContext) {
        if (rightClickContext.element?.tagName) {
          contextParts.push(`Element: ${rightClickContext.element.tagName}${rightClickContext.element.id ? ` #${rightClickContext.element.id}` : ''}`)
        }
        if (rightClickContext.element?.text) {
          contextParts.push(`Text: "${rightClickContext.element.text.substring(0, 50)}"`)
        }
        if (rightClickContext.detailId) {
          contextParts.push(`DetailID: ${rightClickContext.detailId}`)
        }
      }
      
      const context = `\n[Context: ${contextParts.join(' | ')}]`
      const contentWithContext = mywayContent + context
      
      await api.put('/dev/myway', { content: contentWithContext })
      setShowMywayEditor(false)
      setRightClickContext(null)
    } catch (error) {
      console.error('Failed to save myway.txt:', error)
    }
    setSavingMyway(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  // Scanner users only see the scanner view
  if (user?.role === 'Scanner') {
    return (
      <LanguageProvider>
        <MobileScanner onLogout={handleLogout} user={user} />
      </LanguageProvider>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onViewList={navigateToList} onNavigate={navigateTo} />
      case 'orders-list':
        return <OrdersList 
          listType={listType} 
          onBack={() => navigateBack('dashboard')} 
          onViewDetail={(id) => listType === 'quality' ? navigateToDetail('defect-detail', id) : navigateToDetail('order-detail', id)} 
        />
      case 'design':
        return <DesignStudio3D />
      case 'production':
        return <Production onViewDetail={(id) => navigateToDetail('order-detail', id)} />
      case 'order-detail':
        return <OrderDetail id={detailId} onBack={() => navigateBack('production')} />
      case 'inventory':
        return <Inventory onViewDetail={(id) => navigateToDetail('inventory-detail', id)} />
      case 'inventory-detail':
        return <InventoryDetail id={detailId} onBack={() => navigateBack('inventory')} />
      case 'machines':
        return <Machines onViewDetail={(id) => navigateToDetail('machine-detail', id)} />
      case 'machine-detail':
        return <MachineDetail id={detailId} onBack={() => navigateBack('machines')} />
      case 'quality':
        return <Quality onViewDetail={(id) => navigateToDetail('defect-detail', id)} />
      case 'defect-detail':
        return <DefectDetail id={detailId} onBack={() => navigateBack('quality')} />
      case 'settings':
        return <Settings />
      case 'users':
        return <UserManagement user={user} onViewDetail={(id) => navigateToDetail('user-detail', id)} />
      case 'user-detail':
        return <UserDetail id={detailId} onBack={() => navigateBack('users')} />
      case 'tests':
        return <TestCenter user={user} />
      case 'dev':
        return <Development onDeveloperModeChange={handleDeveloperModeChange} />
      case 'tracking':
        return <Tracking />
      case 'floor':
        return <ProductionFloor user={user} />
      case 'docs':
        return <Documentation />
      case 'reports':
        return <Reports onViewDetail={(type, id) => {
          if (type === 'order') navigateToDetail('order-detail', id)
          else if (type === 'inventory') navigateToDetail('inventory-detail', id)
          else if (type === 'defect') navigateToDetail('defect-detail', id)
          else if (type === 'machine') navigateToDetail('machine-detail', id)
        }} />
      case 'costs':
        return <CostEstimation />
      case 'customer-portal':
        return <CustomerPortal />
      case 'cad-export':
        return <CADExport />
      case 'mobile':
        return <MobileScanner />
      case 'analytics':
        return <Analytics />
      case 'accounting':
        return <AccountingIntegration />
      case 'batch':
        return <BatchProcessing />
      case 'maintenance':
        return <MaintenanceTracking />
      default:
        return <Dashboard />
    }
  }

  // Get help content for current page
  const getPageHelp = () => {
    const pageHelpMap = {
      'dashboard': PAGE_HELP.dashboard,
      'design': PAGE_HELP.designs,
      'production': PAGE_HELP.production,
      'floor': PAGE_HELP.floor,
      'inventory': PAGE_HELP.inventory,
      'machines': PAGE_HELP.machines,
      'quality': PAGE_HELP.quality,
      'schedule': PAGE_HELP.schedule,
      'batch': PAGE_HELP.batch,
      'maintenance': PAGE_HELP.maintenance,
      'accounting': PAGE_HELP.accounting,
      'analytics': PAGE_HELP.analytics,
      'costs': PAGE_HELP.costs
    }
    return pageHelpMap[currentPage] || []
  }

  return (
    <HelpProvider>
      <div className="min-h-screen bg-gray-100">
        <Header 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          sidebarOpen={sidebarOpen}
          user={user}
          onLogout={handleLogout}
        />
        <div className="flex">
          <Sidebar 
            isOpen={sidebarOpen} 
            currentPage={currentPage} 
            setCurrentPage={setCurrentPageWithHistory}
            userRole={user?.role || 'Admin'}
          />
          <main className={`flex-1 p-6 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
            {renderPage()}
          </main>
        </div>

        {/* Help System */}
        <HelpButton />
        <HelpPanel pageHelp={getPageHelp()} />

      {/* Floating MyWay Editor Button */}
        <button
          onClick={() => {
            loadMywayContent()
            setShowMywayEditor(true)
          }}
          className="fixed bottom-6 left-6 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 flex items-center justify-center z-50"
          title="Edit myway.txt"
        >
          <FileEdit size={24} />
        </button>

      {/* MyWay Editor Modal */}
      {showMywayEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-purple-600 text-white">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileEdit size={20} /> Edit myway.txt
                {developerMode && <span className="text-xs bg-green-500 px-2 py-1 rounded">Dev Mode</span>}
              </h3>
              <button 
                onClick={() => {
                  setShowMywayEditor(false)
                  setRightClickContext(null)
                }}
                className="p-2 hover:bg-purple-700 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Context Data Panel - shown when right-clicking in developer mode */}
            {rightClickContext && (
              <div className="p-4 bg-blue-50 border-b border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Right-Click Context</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium text-blue-700">Page:</span> {rightClickContext.page}</div>
                  <div><span className="font-medium text-blue-700">Time:</span> {rightClickContext.timestamp}</div>
                  {rightClickContext.detailId && (
                    <div><span className="font-medium text-blue-700">Detail ID:</span> {rightClickContext.detailId}</div>
                  )}
                  <div><span className="font-medium text-blue-700">Element:</span> {rightClickContext.element?.tagName}</div>
                  {rightClickContext.element?.id && (
                    <div><span className="font-medium text-blue-700">Element ID:</span> {rightClickContext.element.id}</div>
                  )}
                  {rightClickContext.element?.text && (
                    <div className="col-span-2"><span className="font-medium text-blue-700">Text:</span> {rightClickContext.element.text.substring(0, 50)}...</div>
                  )}
                </div>
                <button
                  onClick={() => {
                    const contextText = `\n\n--- Context from right-click ---\nPage: ${rightClickContext.page}\nTime: ${rightClickContext.timestamp}\nElement: ${rightClickContext.element?.tagName}${rightClickContext.element?.id ? ` #${rightClickContext.element.id}` : ''}\nText: ${rightClickContext.element?.text?.substring(0, 100) || 'N/A'}\nURL: ${rightClickContext.url}\n---\n\n`
                    setMywayContent(prev => prev + contextText)
                    setRightClickContext(null)
                  }}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Insert Context into Editor
                </button>
              </div>
            )}
            
            <div className="p-4">
              <textarea
                value={mywayContent}
                onChange={(e) => setMywayContent(e.target.value)}
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Enter your instructions here..."
              />
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowMywayEditor(false)
                  setRightClickContext(null)
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveMywayContent}
                disabled={savingMyway}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={18} /> {savingMyway ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </HelpProvider>
  )
}

export default App
