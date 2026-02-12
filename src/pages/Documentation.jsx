import { useState, useMemo } from 'react'
import { 
  Book, Code, Database, Layers, Settings, Users, Factory, 
  Palette, Box, QrCode, ArrowRight, CheckCircle, HelpCircle,
  FileText, Workflow, Server, Globe, Shield, Zap, Search, X
} from 'lucide-react'

const SEARCH_INDEX = [
  { section: 'overview', keywords: ['overview', 'introduction', 'welcome', 'about', 'system', 'cabinet', 'woodworking', 'benefits'] },
  { section: 'getting-started', keywords: ['getting started', 'login', 'first', 'begin', 'start', 'account', 'credentials', 'navigate'] },
  { section: 'tutorials', keywords: ['tutorial', 'video', 'learn', 'guide', 'how to', 'training', 'course', 'beginner'] },
  { section: 'design-studio', keywords: ['design', 'studio', '3d', 'template', 'cabinet', 'create', 'model', 'collision', 'part', 'dimension'] },
  { section: 'best-practices', keywords: ['best practice', 'tips', 'guidelines', 'recommendation', 'advice', 'standard', 'thickness', 'edge banding'] },
  { section: 'production', keywords: ['production', 'order', 'manufacturing', 'workflow', 'station', 'wall saw', 'cnc', 'banding', 'packaging'] },
  { section: 'tracking', keywords: ['tracking', 'qr', 'scan', 'barcode', 'trace', 'history', 'location', 'status', 'part'] },
  { section: 'users', keywords: ['user', 'role', 'permission', 'admin', 'designer', 'operator', 'account', 'access'] },
  { section: 'shortcuts', keywords: ['shortcut', 'keyboard', 'hotkey', 'control', 'mouse', 'rotate', 'zoom', 'pan', 'key'] },
  { section: 'glossary', keywords: ['glossary', 'term', 'definition', 'meaning', 'carcase', 'panel', 'shelf', 'door', 'drawer'] },
  { section: 'faq', keywords: ['faq', 'question', 'answer', 'problem', 'issue', 'help', 'troubleshoot', 'error', 'fix'] },
  { section: 'support', keywords: ['support', 'contact', 'help', 'email', 'phone', 'report', 'bug', 'feature request'] },
  { section: 'changelog', keywords: ['changelog', 'version', 'release', 'update', 'new', 'feature', 'planned', 'roadmap'] },
  { section: 'architecture', keywords: ['architecture', 'technical', 'stack', 'react', 'node', 'express', 'system', 'design'] },
  { section: 'database', keywords: ['database', 'schema', 'table', 'column', 'sql', 'postgresql', 'model', 'relation'] },
  { section: 'api', keywords: ['api', 'endpoint', 'rest', 'request', 'response', 'get', 'post', 'put', 'delete', 'route'] }
]

const SECTIONS = [
  { id: 'overview', name: 'Overview', icon: Book },
  { id: 'getting-started', name: 'Getting Started', icon: Zap },
  { id: 'tutorials', name: 'Video Tutorials', icon: Globe },
  { id: 'design-studio', name: 'Design Studio', icon: Palette },
  { id: 'best-practices', name: 'Best Practices', icon: CheckCircle },
  { id: 'production', name: 'Production Management', icon: Factory },
  { id: 'tracking', name: 'Part Tracking', icon: QrCode },
  { id: 'users', name: 'User Management', icon: Users },
  { id: 'shortcuts', name: 'Keyboard Shortcuts', icon: Settings },
  { id: 'glossary', name: 'Glossary', icon: FileText },
  { id: 'faq', name: 'FAQ & Troubleshooting', icon: HelpCircle },
  { id: 'support', name: 'Support & Contact', icon: Shield },
  { id: 'changelog', name: 'Version & Changelog', icon: Workflow },
  { id: 'architecture', name: 'Technical Architecture', icon: Code },
  { id: 'database', name: 'Database Schema', icon: Database },
  { id: 'api', name: 'API Reference', icon: Server }
]

function Documentation() {
  const [activeSection, setActiveSection] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return SEARCH_INDEX
      .filter(item => item.keywords.some(kw => kw.includes(query) || query.includes(kw)))
      .map(item => {
        const section = SECTIONS.find(s => s.id === item.section)
        return section ? { ...section, matchedKeywords: item.keywords.filter(kw => kw.includes(query) || query.includes(kw)) } : null
      })
      .filter(Boolean)
  }, [searchQuery])

  const handleSearchSelect = (sectionId) => {
    setActiveSection(sectionId)
    setSearchQuery('')
    setShowSearchResults(false)
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />
      case 'getting-started':
        return <GettingStartedSection />
      case 'tutorials':
        return <TutorialsSection />
      case 'design-studio':
        return <DesignStudioSection />
      case 'best-practices':
        return <BestPracticesSection />
      case 'production':
        return <ProductionSection />
      case 'tracking':
        return <TrackingSection />
      case 'users':
        return <UsersSection />
      case 'shortcuts':
        return <ShortcutsSection />
      case 'glossary':
        return <GlossarySection />
      case 'faq':
        return <FAQSection />
      case 'support':
        return <SupportSection />
      case 'changelog':
        return <ChangelogSection />
      case 'architecture':
        return <ArchitectureSection />
      case 'database':
        return <DatabaseSection />
      case 'api':
        return <APISection />
      default:
        return <OverviewSection />
    }
  }

  return (
    <div className="pt-14">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Documentation & Help</h2>
          <p className="text-gray-600">Complete guide to the Woodworking Cabinet System</p>
        </div>
        {/* Search Box */}
        <div className="relative">
          <div className="flex items-center bg-white rounded-lg shadow-md border border-gray-200">
            <Search size={18} className="ml-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearchResults(true)
              }}
              onFocus={() => setShowSearchResults(true)}
              className="px-3 py-2 w-64 rounded-lg focus:outline-none text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setShowSearchResults(false)
                }}
                className="mr-2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {/* Search Results Dropdown */}
          {showSearchResults && searchQuery && (
            <div className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-64 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((result) => {
                  const Icon = result.icon
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSearchSelect(result.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-left border-b border-gray-100 last:border-0"
                    >
                      <Icon size={18} className="text-amber-600" />
                      <div>
                        <div className="font-medium text-gray-800">{result.name}</div>
                        <div className="text-xs text-gray-500">
                          {result.matchedKeywords.slice(0, 3).join(', ')}
                        </div>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Book size={18} /> Contents
          </h3>
          <nav className="space-y-1">
            {SECTIONS.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                    activeSection === section.id
                      ? 'bg-amber-100 text-amber-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={16} />
                  {section.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-md p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

function OverviewSection() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Woodworking Cabinet System Overview</h3>
        <p className="text-gray-600 mb-4">
          The Woodworking Cabinet System is a comprehensive web application designed to streamline 
          the entire cabinet manufacturing process, from initial design to final production and delivery.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FeatureCard
          icon={Palette}
          title="3D Design Studio"
          description="Create custom cabinet designs with real-time 3D visualization, precise millimeter measurements, and collision detection."
        />
        <FeatureCard
          icon={Factory}
          title="Production Management"
          description="Track orders through the entire production workflow from cutting to packaging with real-time status updates."
        />
        <FeatureCard
          icon={QrCode}
          title="Part Tracking"
          description="Generate unique QR codes for each part and track their progress through production stations."
        />
        <FeatureCard
          icon={Users}
          title="User Management"
          description="Role-based access control with Admin, Designer, and Operator roles for secure team collaboration."
        />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
          <Zap size={18} /> Key Benefits
        </h4>
        <ul className="text-amber-700 space-y-1 text-sm">
          <li>• Reduce design errors with real-time collision detection</li>
          <li>• Streamline production with automated workflow tracking</li>
          <li>• Improve traceability with QR code-based part tracking</li>
          <li>• Enhance collaboration with role-based user management</li>
          <li>• Generate accurate bills of materials automatically</li>
        </ul>
      </div>
    </div>
  )
}

function TutorialsSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Video Tutorials</h3>
      
      <p className="text-gray-600">
        Learn how to use the Woodworking Cabinet System with our step-by-step video tutorials.
      </p>

      <DocSubsection title="Getting Started Series">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TutorialCard
            title="Introduction to the System"
            duration="5 min"
            description="Overview of the main features and navigation"
            level="Beginner"
          />
          <TutorialCard
            title="Creating Your First Design"
            duration="10 min"
            description="Step-by-step guide to designing a basic cabinet"
            level="Beginner"
          />
          <TutorialCard
            title="Using Design Templates"
            duration="7 min"
            description="How to browse, select, and customize templates"
            level="Beginner"
          />
          <TutorialCard
            title="Understanding 3D Controls"
            duration="8 min"
            description="Master rotation, zoom, and part selection"
            level="Beginner"
          />
        </div>
      </DocSubsection>

      <DocSubsection title="Design Studio Deep Dive">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TutorialCard
            title="Advanced Part Manipulation"
            duration="12 min"
            description="Precise positioning, resizing, and alignment"
            level="Intermediate"
          />
          <TutorialCard
            title="Working with Doors & Drawers"
            duration="15 min"
            description="Adding and configuring cabinet fronts"
            level="Intermediate"
          />
          <TutorialCard
            title="Room Visualization"
            duration="10 min"
            description="Placing cabinets in virtual room environments"
            level="Intermediate"
          />
          <TutorialCard
            title="Collision Detection & Resolution"
            duration="8 min"
            description="Finding and fixing overlapping parts"
            level="Intermediate"
          />
        </div>
      </DocSubsection>

      <DocSubsection title="Production & Tracking">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TutorialCard
            title="Creating Production Orders"
            duration="10 min"
            description="Converting designs to production orders"
            level="Intermediate"
          />
          <TutorialCard
            title="QR Code Scanning"
            duration="6 min"
            description="Using the production floor scanner"
            level="Beginner"
          />
          <TutorialCard
            title="Tracking Parts Through Stations"
            duration="12 min"
            description="Complete workflow from Wall Saw to Packaging"
            level="Intermediate"
          />
          <TutorialCard
            title="Order Management & Reporting"
            duration="15 min"
            description="Monitoring progress and generating reports"
            level="Advanced"
          />
        </div>
      </DocSubsection>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Coming Soon</h4>
        <p className="text-sm text-blue-700">
          Video tutorials are currently in production. Check back soon for interactive 
          video guides. In the meantime, use the written documentation sections for 
          detailed instructions.
        </p>
      </div>
    </div>
  )
}

function SupportSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Support & Contact</h3>
      
      <DocSubsection title="Getting Help">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Book size={24} className="text-blue-600" />
            </div>
            <h5 className="font-semibold text-blue-800 mb-2">Documentation</h5>
            <p className="text-sm text-blue-700">
              Browse this comprehensive documentation for answers to common questions.
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <HelpCircle size={24} className="text-green-600" />
            </div>
            <h5 className="font-semibold text-green-800 mb-2">FAQ</h5>
            <p className="text-sm text-green-700">
              Check the FAQ section for quick answers to frequently asked questions.
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users size={24} className="text-purple-600" />
            </div>
            <h5 className="font-semibold text-purple-800 mb-2">Administrator</h5>
            <p className="text-sm text-purple-700">
              Contact your system administrator for account and access issues.
            </p>
          </div>
        </div>
      </DocSubsection>

      <DocSubsection title="Contact Information">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-semibold text-gray-800 mb-2">Technical Support</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Email: support@woodworking-system.com</li>
                <li>Phone: +31 (0)20 123 4567</li>
                <li>Hours: Mon-Fri 9:00 - 17:00 CET</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-gray-800 mb-2">Sales & Licensing</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Email: sales@woodworking-system.com</li>
                <li>Phone: +31 (0)20 123 4568</li>
                <li>Hours: Mon-Fri 9:00 - 17:00 CET</li>
              </ul>
            </div>
          </div>
        </div>
      </DocSubsection>

      <DocSubsection title="Reporting Issues">
        <p className="text-gray-600 mb-4">
          If you encounter a bug or technical issue, please provide the following information:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li>Description of the issue and steps to reproduce</li>
          <li>Browser name and version</li>
          <li>Screenshots if applicable</li>
          <li>Order or design ID if relevant</li>
          <li>Time when the issue occurred</li>
        </ul>
      </DocSubsection>

      <DocSubsection title="Feature Requests">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800">
            Have an idea for improving the system? We welcome feature requests! 
            Contact your administrator or send suggestions to feedback@woodworking-system.com. 
            Include a detailed description of the feature and how it would benefit your workflow.
          </p>
        </div>
      </DocSubsection>
    </div>
  )
}

function GettingStartedSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Getting Started</h3>
      
      <div className="space-y-4">
        <StepCard
          number={1}
          title="Login to the System"
          description="Use your credentials to log in. Contact your administrator if you don't have an account."
        />
        <StepCard
          number={2}
          title="Create a Design"
          description="Navigate to the Design Studio to create a new cabinet design using templates or from scratch."
        />
        <StepCard
          number={3}
          title="Generate an Order"
          description="Once your design is complete, create a production order to send it to the factory floor."
        />
        <StepCard
          number={4}
          title="Track Production"
          description="Monitor your order's progress through each production station in real-time."
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <HelpCircle size={18} /> Quick Tips
        </h4>
        <ul className="text-blue-700 space-y-1 text-sm">
          <li>• Use keyboard shortcuts: Ctrl+S to save, Ctrl+Z to undo</li>
          <li>• Drag to rotate the 3D view, scroll to zoom</li>
          <li>• Click on parts to select and edit them</li>
          <li>• Use templates for faster design creation</li>
        </ul>
      </div>
    </div>
  )
}

function DesignStudioSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Design Studio Guide</h3>
      
      <p className="text-gray-600">
        The 3D Design Studio is the heart of the application, allowing you to create precise 
        cabinet designs with real-time visualization.
      </p>

      <div className="space-y-4">
        <DocSubsection title="Creating a New Design">
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Click "New Cabinet" to open the quick template generator</li>
            <li>Enter dimensions (width, height, depth) in millimeters</li>
            <li>Select cabinet type (base, wall, tall, corner)</li>
            <li>Choose options like doors, drawers, and shelves</li>
            <li>Click "Generate" to create the cabinet</li>
          </ol>
        </DocSubsection>

        <DocSubsection title="Using Templates">
          <p className="text-gray-600 mb-2">
            The template library contains 20+ pre-designed cabinet configurations:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Kitchen base cabinets (single/double door)</li>
            <li>Wall cabinets (standard/corner)</li>
            <li>Tall pantry and utility cabinets</li>
            <li>Bathroom vanities</li>
            <li>Entertainment centers</li>
            <li>Wardrobes and closet systems</li>
          </ul>
        </DocSubsection>

        <DocSubsection title="3D Viewport Controls">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <strong>Rotate View:</strong> Click and drag
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <strong>Pan View:</strong> Shift + drag
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <strong>Zoom:</strong> Mouse scroll wheel
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <strong>Select Part:</strong> Click on part
            </div>
          </div>
        </DocSubsection>

        <DocSubsection title="Room Visualization">
          <p className="text-gray-600 mb-2">
            Place your cabinet in a virtual room to see how it fits:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Toggle room visibility with the room button</li>
            <li>Customize room dimensions (width, height, depth)</li>
            <li>Show/hide individual walls, floor, and ceiling</li>
            <li>Add room elements like doors and windows</li>
            <li>Drag the cabinet to position it in the room</li>
          </ul>
        </DocSubsection>

        <DocSubsection title="Collision Detection">
          <p className="text-gray-600">
            The system automatically detects when parts overlap or collide. Colliding parts 
            are highlighted in red and pulse to draw attention. Resolve collisions before 
            sending to production to ensure accurate manufacturing.
          </p>
        </DocSubsection>
      </div>
    </div>
  )
}

function ProductionSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Production Management</h3>
      
      <p className="text-gray-600">
        The production system tracks orders through the entire manufacturing workflow.
      </p>

      <DocSubsection title="Production Workflow">
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <WorkflowStage name="Pending" color="bg-gray-400" />
          <ArrowRight size={16} className="text-gray-400" />
          <WorkflowStage name="Cutting" color="bg-orange-500" />
          <ArrowRight size={16} className="text-gray-400" />
          <WorkflowStage name="Drilling" color="bg-blue-500" />
          <ArrowRight size={16} className="text-gray-400" />
          <WorkflowStage name="Edge Banding" color="bg-green-500" />
          <ArrowRight size={16} className="text-gray-400" />
          <WorkflowStage name="Packaging" color="bg-purple-500" />
          <ArrowRight size={16} className="text-gray-400" />
          <WorkflowStage name="Completed" color="bg-emerald-500" />
        </div>
      </DocSubsection>

      <DocSubsection title="Production Stations">
        <div className="space-y-3">
          <StationInfo
            name="Wall Saw"
            description="Large panels are cut to size according to the design specifications."
          />
          <StationInfo
            name="CNC Machine"
            description="Precision drilling, routing, and edge profiling using computer-controlled machinery."
          />
          <StationInfo
            name="Edge Banding"
            description="Decorative edge tape is applied to visible panel edges."
          />
          <StationInfo
            name="Packaging"
            description="Final assembly verification and packaging for delivery."
          />
        </div>
      </DocSubsection>

      <DocSubsection title="Order Status Updates">
        <p className="text-gray-600">
          Order status automatically updates based on the progress of all parts. The status 
          reflects the minimum station that ALL parts have reached, ensuring accurate tracking.
        </p>
      </DocSubsection>
    </div>
  )
}

function TrackingSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Part Tracking System</h3>
      
      <p className="text-gray-600">
        Every part in production has a unique QR code for tracking through the manufacturing process.
      </p>

      <DocSubsection title="QR Code Generation">
        <p className="text-gray-600">
          QR codes are automatically generated when an order is sent to production. Each code contains:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2">
          <li>Part ID and name</li>
          <li>Order number</li>
          <li>Part dimensions</li>
          <li>Design reference</li>
        </ul>
      </DocSubsection>

      <DocSubsection title="Scanning Parts">
        <p className="text-gray-600">
          Operators scan parts at each station to record progress:
        </p>
        <ol className="list-decimal list-inside space-y-1 text-gray-600 mt-2">
          <li>Navigate to the Production Floor page</li>
          <li>Select your current station</li>
          <li>Use the camera scanner or enter the part ID manually</li>
          <li>The part is automatically moved to the next station</li>
        </ol>
      </DocSubsection>

      <DocSubsection title="Trace History">
        <p className="text-gray-600">
          View the complete history of any part in the order detail page:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2">
          <li>Click on an order to view details</li>
          <li>Select the "Trace History" tab</li>
          <li>See all station transitions with timestamps and operators</li>
        </ul>
      </DocSubsection>
    </div>
  )
}

function UsersSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">User Management</h3>
      
      <DocSubsection title="User Roles">
        <div className="space-y-3">
          <RoleInfo
            name="Admin"
            permissions={[
              'Full system access',
              'User management',
              'System configuration',
              'All design and production features'
            ]}
          />
          <RoleInfo
            name="Designer"
            permissions={[
              'Create and edit designs',
              'Create production orders',
              'View production status',
              'Generate bills of materials'
            ]}
          />
          <RoleInfo
            name="Operator"
            permissions={[
              'View production orders',
              'Scan parts at stations',
              'Update part status',
              'View order details'
            ]}
          />
        </div>
      </DocSubsection>

      <DocSubsection title="Managing Users (Admin Only)">
        <ol className="list-decimal list-inside space-y-1 text-gray-600">
          <li>Navigate to User Management from the sidebar</li>
          <li>Click "Add User" to create a new account</li>
          <li>Fill in user details and select a role</li>
          <li>The user will receive login credentials</li>
        </ol>
      </DocSubsection>
    </div>
  )
}

function BestPracticesSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Best Practices for Designers</h3>
      
      <DocSubsection title="Design Guidelines">
        <div className="space-y-4">
          <BestPractice
            title="Use Standard Panel Thickness"
            description="Stick to industry-standard panel thicknesses (18mm for main panels, 6mm for backs) to ensure compatibility with standard hardware and edge banding."
            tips={['18mm for side panels, tops, and bottoms', '6mm for back panels', '18mm for shelves and doors']}
          />
          <BestPractice
            title="Account for Edge Banding"
            description="When calculating final dimensions, remember that edge banding adds approximately 0.5-2mm per edge depending on the material."
            tips={['Subtract edge banding thickness from visible dimensions', 'Consider which edges will be banded', 'Use consistent banding thickness throughout']}
          />
          <BestPractice
            title="Check for Collisions"
            description="Always resolve collision warnings before sending to production. Overlapping parts will cause manufacturing issues."
            tips={['Use the collision detection feature', 'Rotate the view to check all angles', 'Pay attention to door swing clearance']}
          />
        </div>
      </DocSubsection>

      <DocSubsection title="Workflow Recommendations">
        <div className="space-y-4">
          <BestPractice
            title="Start with Templates"
            description="Use the template library as a starting point. Templates are pre-configured with correct proportions and standard dimensions."
            tips={['Browse templates by category', 'Customize dimensions after loading', 'Save your own templates for reuse']}
          />
          <BestPractice
            title="Save Frequently"
            description="Save your design regularly to avoid losing work. The system does not auto-save."
            tips={['Use Ctrl+S to quick save', 'Save before making major changes', 'Create copies for variations']}
          />
          <BestPractice
            title="Review Before Production"
            description="Always review the parts list and 3D preview before creating a production order."
            tips={['Check all dimensions are correct', 'Verify part count matches expectations', 'Confirm material selections']}
          />
        </div>
      </DocSubsection>

      <DocSubsection title="Common Mistakes to Avoid">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <h5 className="font-semibold text-red-800 mb-2">❌ Don't</h5>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Ignore collision warnings</li>
              <li>• Use non-standard dimensions without reason</li>
              <li>• Forget to account for hardware clearance</li>
              <li>• Skip the final review step</li>
            </ul>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h5 className="font-semibold text-green-800 mb-2">✓ Do</h5>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Use templates as starting points</li>
              <li>• Double-check all measurements</li>
              <li>• Test door and drawer clearances</li>
              <li>• Save designs before major changes</li>
            </ul>
          </div>
        </div>
      </DocSubsection>
    </div>
  )
}

function GlossarySection() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Glossary of Terms</h3>
      
      <DocSubsection title="Cabinet Components">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <GlossaryTerm term="Carcase" definition="The main body/box of a cabinet, excluding doors and drawers" />
          <GlossaryTerm term="Side Panel" definition="Vertical panels on the left and right sides of the cabinet" />
          <GlossaryTerm term="Top Panel" definition="Horizontal panel at the top of the cabinet" />
          <GlossaryTerm term="Bottom Panel" definition="Horizontal panel at the base of the cabinet" />
          <GlossaryTerm term="Back Panel" definition="Thin panel at the rear, typically 6mm thick" />
          <GlossaryTerm term="Shelf" definition="Horizontal panel inside the cabinet for storage" />
          <GlossaryTerm term="Door" definition="Hinged panel that covers the front opening" />
          <GlossaryTerm term="Drawer Front" definition="Visible front panel of a drawer" />
          <GlossaryTerm term="Plinth/Toe Kick" definition="Recessed base at the bottom of floor-standing cabinets" />
          <GlossaryTerm term="Rail" definition="Horizontal structural member, often at top/bottom of face frame" />
        </div>
      </DocSubsection>

      <DocSubsection title="Production Terms">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <GlossaryTerm term="Wall Saw" definition="Large saw for cutting sheet materials to rough size" />
          <GlossaryTerm term="CNC Machine" definition="Computer-controlled router for precision cutting and drilling" />
          <GlossaryTerm term="Edge Banding" definition="Process of applying decorative tape to panel edges" />
          <GlossaryTerm term="Packaging" definition="Final assembly verification and preparation for shipping" />
          <GlossaryTerm term="Part Tracking" definition="System for monitoring parts through production stages" />
          <GlossaryTerm term="QR Code" definition="Machine-readable code containing part identification data" />
          <GlossaryTerm term="Production Order" definition="Work order containing all parts for a cabinet design" />
          <GlossaryTerm term="Station" definition="Specific location/machine in the production workflow" />
        </div>
      </DocSubsection>

      <DocSubsection title="Measurements & Dimensions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <GlossaryTerm term="Width (W)" definition="Horizontal dimension, left to right when facing the cabinet" />
          <GlossaryTerm term="Height (H)" definition="Vertical dimension, floor to top" />
          <GlossaryTerm term="Depth (D)" definition="Front to back dimension" />
          <GlossaryTerm term="Thickness (T)" definition="Material thickness, typically 18mm or 6mm" />
          <GlossaryTerm term="Millimeter (mm)" definition="Standard unit of measurement (1 inch = 25.4mm)" />
          <GlossaryTerm term="Clearance" definition="Space between parts for movement or fitting" />
        </div>
      </DocSubsection>

      <DocSubsection title="System Terms">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <GlossaryTerm term="Design" definition="Complete cabinet specification with all parts and dimensions" />
          <GlossaryTerm term="Template" definition="Pre-made design that can be customized" />
          <GlossaryTerm term="Model Data" definition="JSON structure containing all 3D part information" />
          <GlossaryTerm term="Collision" definition="When two parts overlap in 3D space" />
          <GlossaryTerm term="Trace History" definition="Complete record of a part's journey through production" />
          <GlossaryTerm term="Order Status" definition="Current stage of production for an entire order" />
        </div>
      </DocSubsection>
    </div>
  )
}

function ShortcutsSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Keyboard Shortcuts & Controls</h3>
      
      <DocSubsection title="Design Studio 3D Controls">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ShortcutGroup
            title="View Controls"
            shortcuts={[
              { key: 'Click + Drag', action: 'Rotate 3D view' },
              { key: 'Shift + Drag', action: 'Pan view' },
              { key: 'Scroll Wheel', action: 'Zoom in/out' },
              { key: 'Click on Part', action: 'Select part' }
            ]}
          />
          <ShortcutGroup
            title="Part Manipulation"
            shortcuts={[
              { key: 'Click Part', action: 'Select for editing' },
              { key: 'Drag Part', action: 'Move part position' },
              { key: 'Delete/Backspace', action: 'Remove selected part' }
            ]}
          />
          <ShortcutGroup
            title="General Actions"
            shortcuts={[
              { key: 'Ctrl + S', action: 'Save design' },
              { key: 'Ctrl + Z', action: 'Undo last action' },
              { key: 'Ctrl + Y', action: 'Redo action' },
              { key: 'Escape', action: 'Deselect / Close modal' }
            ]}
          />
          <ShortcutGroup
            title="View Modes"
            shortcuts={[
              { key: 'All Parts', action: 'Show complete cabinet' },
              { key: 'Structure Only', action: 'Show panels only' },
              { key: 'Doors Only', action: 'Show doors' },
              { key: 'Shelves Only', action: 'Show shelves' }
            ]}
          />
        </div>
      </DocSubsection>

      <DocSubsection title="Production Floor Controls">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ShortcutGroup
            title="Station Navigation"
            shortcuts={[
              { key: 'Click Station Tab', action: 'Switch to station' },
              { key: 'Scan Button', action: 'Open camera scanner' },
              { key: 'Manual Entry', action: 'Type part ID directly' }
            ]}
          />
          <ShortcutGroup
            title="Part Actions"
            shortcuts={[
              { key: 'Move to Next', action: 'Advance part to next station' },
              { key: 'Complete Order', action: 'Mark all parts as shipped' }
            ]}
          />
        </div>
      </DocSubsection>

      <DocSubsection title="Global Navigation">
        <div className="bg-gray-50 p-4 rounded-lg">
          <ul className="space-y-2 text-gray-600">
            <li><strong>Sidebar:</strong> Click menu items to navigate between pages</li>
            <li><strong>Breadcrumbs:</strong> Use "Back" buttons to return to list views</li>
            <li><strong>Browser Back/Forward:</strong> Navigate through your history</li>
            <li><strong>URL Hash:</strong> Bookmark specific pages using the URL</li>
          </ul>
        </div>
      </DocSubsection>
    </div>
  )
}

function FAQSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">FAQ & Troubleshooting</h3>
      
      <DocSubsection title="Frequently Asked Questions">
        <div className="space-y-4">
          <FAQItem
            question="How do I create a new cabinet design?"
            answer="Navigate to Design Studio from the sidebar. Click 'New Cabinet' to use the quick generator, or 'Templates' to start from a pre-made design. You can also manually add parts using the part controls."
          />
          <FAQItem
            question="Why aren't my parts showing in the production queue?"
            answer="Parts only appear in the production queue after you click 'Send to Production' on the order detail page. This creates tracking records for each part at the Wall Saw station."
          />
          <FAQItem
            question="How do I scan QR codes on the production floor?"
            answer="Go to Production Floor, select your current station, and click the camera icon to open the scanner. Point your camera at the QR code. Alternatively, you can manually enter the part ID."
          />
          <FAQItem
            question="Why is the order status not updating?"
            answer="Order status updates automatically based on the minimum station ALL parts have reached. If one part is still at Wall Saw while others are at CNC, the order status will show 'Cutting' until all parts advance."
          />
          <FAQItem
            question="How do I complete an order?"
            answer="When all parts reach the Packaging station, a 'Complete Order' button appears on the order group. Click it to mark all parts as shipped and update the order status to Completed."
          />
          <FAQItem
            question="Can I edit a design after creating an order?"
            answer="Yes, but changes to the design won't affect existing orders. Each order captures a snapshot of the design at creation time. Create a new order to use the updated design."
          />
        </div>
      </DocSubsection>

      <DocSubsection title="Troubleshooting Common Issues">
        <div className="space-y-4">
          <TroubleshootItem
            issue="3D view is blank or not rendering"
            solutions={[
              'Refresh the page (F5)',
              'Check if your browser supports CSS 3D transforms',
              'Try a different browser (Chrome, Firefox, Edge recommended)',
              'Clear browser cache and reload'
            ]}
          />
          <TroubleshootItem
            issue="QR code scanner not working"
            solutions={[
              'Ensure camera permissions are granted',
              'Check if another app is using the camera',
              'Try manual part ID entry as alternative',
              'Ensure adequate lighting for QR code visibility'
            ]}
          />
          <TroubleshootItem
            issue="Parts not moving between stations"
            solutions={[
              'Verify you are at the correct station',
              'Check if the part ID is valid',
              'Ensure you have operator permissions',
              'Check network connection'
            ]}
          />
          <TroubleshootItem
            issue="Cannot create production order"
            solutions={[
              'Ensure the design is saved first',
              'Check if you have designer or admin role',
              'Verify all required fields are filled',
              'Check for any collision warnings in the design'
            ]}
          />
        </div>
      </DocSubsection>

      <DocSubsection title="Getting Help">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            If you encounter issues not covered here, please contact your system administrator 
            or check the Development page for technical details and API documentation.
          </p>
        </div>
      </DocSubsection>
    </div>
  )
}

function ChangelogSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Version & Changelog</h3>
      
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Zap size={24} className="text-amber-600" />
          </div>
          <div>
            <h4 className="font-bold text-amber-800">Current Version: 1.2.0</h4>
            <p className="text-sm text-amber-700">Released: January 2026</p>
          </div>
        </div>
      </div>

      <DocSubsection title="Version 1.0.0 - Initial Release">
        <div className="space-y-4">
          <ChangelogEntry
            version="1.0.0"
            date="January 2026"
            type="release"
            changes={[
              'Complete 3D Design Studio with CSS transforms',
              '20+ cabinet design templates',
              'Production order management system',
              'QR code-based part tracking',
              'Multi-station production workflow (Wall Saw → CNC → Banding → Packaging)',
              'Real-time order status updates',
              'Role-based user management (Admin, Designer, Operator)',
              'Comprehensive documentation and help system',
              'Activity tracking and audit logs',
              'Quality control and defect management'
            ]}
          />
        </div>
      </DocSubsection>

      <DocSubsection title="Version 1.1.0 - Feature Update">
        <div className="space-y-4">
          <ChangelogEntry
            version="1.1.0"
            date="January 2026"
            type="release"
            changes={[
              'Material cost estimation with detailed breakdowns',
              'Customer portal for real-time order tracking',
              'Export designs to CAD formats (DXF, SVG, STEP, STL)',
              'Mobile scanner app for production floor',
              'Advanced reporting and analytics dashboard',
              'Accounting system integration (QuickBooks, Xero, Sage)'
            ]}
          />
        </div>
      </DocSubsection>

      <DocSubsection title="Version 1.2.0 - Major Update">
        <div className="space-y-4">
          <ChangelogEntry
            version="1.2.0"
            date="January 2026"
            type="release"
            changes={[
              'Multi-language support (English, Dutch, German, French)',
              'Custom workflow configuration with drag-and-drop',
              'Batch order processing for bulk operations',
              'AI-powered automated scheduling optimization',
              'Machine maintenance tracking and scheduling'
            ]}
          />
        </div>
      </DocSubsection>

      <DocSubsection title="Planned Features">
        <div className="space-y-4">
          <ChangelogEntry
            version="1.3.0"
            date="Planned"
            type="planned"
            changes={[
              'Real-time collaboration features',
              'Advanced machine learning predictions',
              'IoT sensor integration',
              'Automated quality inspection with AI',
              'Supply chain optimization'
            ]}
          />
        </div>
      </DocSubsection>

      <DocSubsection title="System Requirements">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-semibold text-gray-800 mb-2">Browser Support</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Chrome 90+ (Recommended)</li>
              <li>• Firefox 88+</li>
              <li>• Edge 90+</li>
              <li>• Safari 14+</li>
            </ul>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-semibold text-gray-800 mb-2">Server Requirements</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Node.js 18+</li>
              <li>• PostgreSQL 14+</li>
              <li>• 2GB RAM minimum</li>
              <li>• 10GB disk space</li>
            </ul>
          </div>
        </div>
      </DocSubsection>
    </div>
  )
}

function ArchitectureSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Technical Architecture</h3>
      
      <DocSubsection title="Technology Stack">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TechCard
            category="Frontend"
            technologies={[
              { name: 'React 18', desc: 'UI component library' },
              { name: 'Vite', desc: 'Build tool and dev server' },
              { name: 'TailwindCSS', desc: 'Utility-first CSS framework' },
              { name: 'Lucide React', desc: 'Icon library' }
            ]}
          />
          <TechCard
            category="Backend"
            technologies={[
              { name: 'Node.js', desc: 'JavaScript runtime' },
              { name: 'Express.js', desc: 'Web framework' },
              { name: 'Sequelize', desc: 'ORM for database' },
              { name: 'PostgreSQL', desc: 'Relational database' }
            ]}
          />
          <TechCard
            category="3D Rendering"
            technologies={[
              { name: 'CSS 3D Transforms', desc: 'Hardware-accelerated 3D' },
              { name: 'Perspective', desc: '3D depth perception' },
              { name: 'preserve-3d', desc: 'Nested 3D transforms' }
            ]}
          />
          <TechCard
            category="Additional Libraries"
            technologies={[
              { name: 'QRCode', desc: 'QR code generation' },
              { name: 'UUID', desc: 'Unique identifier generation' },
              { name: 'bcrypt', desc: 'Password hashing' }
            ]}
          />
        </div>
      </DocSubsection>

      <DocSubsection title="Application Architecture">
        <div className="bg-gray-50 p-4 rounded-lg">
          <pre className="text-sm text-gray-700 overflow-x-auto">
{`┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │ Design  │  │Production│  │ Tracking│  │  Users  │    │
│  │ Studio  │  │  Floor   │  │  System │  │  Mgmt   │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘    │
│       │            │            │            │          │
│       └────────────┴────────────┴────────────┘          │
│                         │                                │
│                   API Service                            │
│                         │                                │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────┼───────────────────────────────┐
│                    Backend (Express)                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │ Designs │  │Production│  │Tracking │  │  Auth   │    │
│  │ Routes  │  │  Routes  │  │ Routes  │  │ Routes  │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘    │
│       │            │            │            │          │
│       └────────────┴────────────┴────────────┘          │
│                         │                                │
│                   Sequelize ORM                          │
│                         │                                │
└─────────────────────────┼───────────────────────────────┘
                          │ SQL
┌─────────────────────────┼───────────────────────────────┐
│                   PostgreSQL Database                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │ Designs │  │ Orders  │  │Tracking │  │  Users  │    │
│  │  Parts  │  │  Jobs   │  │ Actions │  │         │    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │
└─────────────────────────────────────────────────────────┘`}
          </pre>
        </div>
      </DocSubsection>

      <DocSubsection title="Key Design Decisions">
        <div className="space-y-3">
          <DesignDecision
            title="CSS 3D Transforms vs WebGL"
            decision="CSS 3D Transforms"
            reason="Simpler implementation, better browser compatibility, sufficient for cabinet visualization without complex lighting or textures."
          />
          <DesignDecision
            title="PostgreSQL vs MongoDB"
            decision="PostgreSQL"
            reason="Relational data model fits cabinet designs with parts, orders with jobs, and tracking records. Strong data integrity with foreign keys."
          />
          <DesignDecision
            title="REST API vs GraphQL"
            decision="REST API"
            reason="Simpler to implement and debug. Clear endpoint structure matches the application's CRUD operations."
          />
          <DesignDecision
            title="Server-side vs Client-side QR Generation"
            decision="Server-side"
            reason="Consistent QR codes across all clients. QR data stored in database for verification."
          />
        </div>
      </DocSubsection>
    </div>
  )
}

function DatabaseSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Database Schema</h3>
      
      <DocSubsection title="Entity Relationship Overview">
        <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm text-gray-700">
{`┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    Users     │       │   Designs    │       │DesignParts   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │◄──────│ id (PK)      │
│ email        │◄──┐   │ name         │       │ designId(FK) │
│ firstName    │   │   │ width        │       │ partType     │
│ lastName     │   │   │ height       │       │ width        │
│ role         │   │   │ depth        │       │ height       │
│ passwordHash │   │   │ modelData    │       │ depth        │
└──────────────┘   │   │ createdBy(FK)│───────│ qrCode       │
                   │   └──────────────┘       └──────────────┘
                   │
┌──────────────┐   │   ┌──────────────┐       ┌──────────────┐
│ProductionOrder│  │   │ProductionJob │       │    Panel     │
├──────────────┤   │   ├──────────────┤       ├──────────────┤
│ id (PK)      │◄──┼───│ id (PK)      │◄──────│ id (PK)      │
│ orderNumber  │   │   │ orderId (FK) │       │ jobId (FK)   │
│ status       │   │   │ stationId(FK)│       │ partType     │
│ designId(FK) │   │   │ status       │       │ dimensions   │
│ createdBy(FK)│───┘   │ jobNumber    │       │ status       │
│ dueDate      │       └──────────────┘       └──────────────┘
└──────────────┘
                       ┌──────────────┐       ┌──────────────┐
                       │PartTracking  │       │ UserAction   │
                       ├──────────────┤       ├──────────────┤
                       │ id (PK)      │       │ id (PK)      │
                       │ partId       │       │ userId (FK)  │
                       │ orderId (FK) │       │ action       │
                       │ station      │       │ actionType   │
                       │ scannedBy    │       │ entityType   │
                       │ scanTime     │       │ details      │
                       └──────────────┘       └──────────────┘`}
          </pre>
        </div>
      </DocSubsection>

      <DocSubsection title="Key Tables">
        <div className="space-y-4">
          <TableSchema
            name="Users"
            description="Stores user accounts and authentication data"
            columns={[
              { name: 'id', type: 'UUID', desc: 'Primary key' },
              { name: 'email', type: 'VARCHAR(255)', desc: 'Unique email address' },
              { name: 'firstName', type: 'VARCHAR(100)', desc: 'User first name' },
              { name: 'lastName', type: 'VARCHAR(100)', desc: 'User last name' },
              { name: 'role', type: 'ENUM', desc: 'admin, designer, operator' },
              { name: 'passwordHash', type: 'VARCHAR(255)', desc: 'Bcrypt hashed password' }
            ]}
          />
          <TableSchema
            name="Designs"
            description="Cabinet design specifications and 3D model data"
            columns={[
              { name: 'id', type: 'UUID', desc: 'Primary key' },
              { name: 'name', type: 'VARCHAR(255)', desc: 'Design name' },
              { name: 'width/height/depth', type: 'DECIMAL', desc: 'Overall dimensions (mm)' },
              { name: 'modelData', type: 'JSONB', desc: 'Complete 3D model with parts' },
              { name: 'createdBy', type: 'UUID (FK)', desc: 'Reference to Users' }
            ]}
          />
          <TableSchema
            name="PartTracking"
            description="Records part movements through production stations"
            columns={[
              { name: 'id', type: 'UUID', desc: 'Primary key' },
              { name: 'partId', type: 'VARCHAR(100)', desc: 'Part identifier' },
              { name: 'orderId', type: 'UUID (FK)', desc: 'Reference to ProductionOrder' },
              { name: 'station', type: 'ENUM', desc: 'wallsaw, cnc, banding, packaging, complete' },
              { name: 'scannedBy', type: 'VARCHAR(100)', desc: 'Operator who scanned' },
              { name: 'scanTime', type: 'TIMESTAMP', desc: 'When the scan occurred' }
            ]}
          />
        </div>
      </DocSubsection>
    </div>
  )
}

function APISection() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">API Reference</h3>
      
      <DocSubsection title="Authentication">
        <APIEndpoint
          method="POST"
          path="/api/auth/login"
          description="Authenticate user and receive JWT token"
          body={{ email: 'string', password: 'string' }}
          response={{ token: 'string', user: 'object' }}
        />
      </DocSubsection>

      <DocSubsection title="Designs">
        <div className="space-y-3">
          <APIEndpoint
            method="GET"
            path="/api/designs"
            description="List all designs"
          />
          <APIEndpoint
            method="POST"
            path="/api/designs"
            description="Create a new design"
            body={{ name: 'string', width: 'number', height: 'number', depth: 'number', modelData: 'object' }}
          />
          <APIEndpoint
            method="GET"
            path="/api/designs/:id"
            description="Get design by ID"
          />
          <APIEndpoint
            method="POST"
            path="/api/designs/:id/generate-qr"
            description="Generate QR codes for all parts in a design"
          />
        </div>
      </DocSubsection>

      <DocSubsection title="Production">
        <div className="space-y-3">
          <APIEndpoint
            method="GET"
            path="/api/production/orders"
            description="List all production orders"
          />
          <APIEndpoint
            method="POST"
            path="/api/production/orders"
            description="Create a new production order"
            body={{ designId: 'UUID', customerName: 'string', dueDate: 'date' }}
          />
          <APIEndpoint
            method="PUT"
            path="/api/production/orders/:id"
            description="Update order status"
            body={{ status: 'string' }}
          />
        </div>
      </DocSubsection>

      <DocSubsection title="Tracking">
        <div className="space-y-3">
          <APIEndpoint
            method="POST"
            path="/api/tracking/scan"
            description="Record a part scan at a station"
            body={{ partId: 'string', station: 'string', scannedBy: 'string' }}
          />
          <APIEndpoint
            method="GET"
            path="/api/tracking/stations/:station/parts"
            description="Get all parts currently at a station"
          />
          <APIEndpoint
            method="GET"
            path="/api/tracking/orders/:orderId/tracking"
            description="Get tracking history for an order"
          />
        </div>
      </DocSubsection>
    </div>
  )
}

// Helper Components
function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Icon size={20} className="text-amber-600" />
        </div>
        <h4 className="font-semibold text-gray-800">{title}</h4>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold flex-shrink-0">
        {number}
      </div>
      <div>
        <h4 className="font-semibold text-gray-800">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  )
}

function DocSubsection({ title, children }) {
  return (
    <div className="border-l-4 border-amber-400 pl-4">
      <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>
      {children}
    </div>
  )
}

function WorkflowStage({ name, color }) {
  return (
    <span className={`px-3 py-1 ${color} text-white rounded-full text-xs font-medium`}>
      {name}
    </span>
  )
}

function StationInfo({ name, description }) {
  return (
    <div className="bg-gray-50 p-3 rounded">
      <strong className="text-gray-800">{name}:</strong>
      <span className="text-gray-600 ml-2">{description}</span>
    </div>
  )
}

function RoleInfo({ name, permissions }) {
  return (
    <div className="bg-gray-50 p-3 rounded">
      <h5 className="font-semibold text-gray-800 mb-2">{name}</h5>
      <ul className="text-sm text-gray-600 space-y-1">
        {permissions.map((p, i) => (
          <li key={i} className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-500" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  )
}

function TechCard({ category, technologies }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h5 className="font-semibold text-gray-800 mb-2">{category}</h5>
      <ul className="space-y-1 text-sm">
        {technologies.map((tech, i) => (
          <li key={i}>
            <strong className="text-gray-700">{tech.name}:</strong>
            <span className="text-gray-600 ml-1">{tech.desc}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DesignDecision({ title, decision, reason }) {
  return (
    <div className="bg-gray-50 p-3 rounded">
      <h5 className="font-semibold text-gray-800">{title}</h5>
      <p className="text-sm">
        <span className="text-amber-600 font-medium">Decision: {decision}</span>
      </p>
      <p className="text-sm text-gray-600">{reason}</p>
    </div>
  )
}

function TableSchema({ name, description, columns }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2">
        <h5 className="font-semibold text-gray-800">{name}</h5>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-2">Column</th>
            <th className="text-left px-4 py-2">Type</th>
            <th className="text-left px-4 py-2">Description</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((col, i) => (
            <tr key={i} className="border-t">
              <td className="px-4 py-2 font-mono text-xs">{col.name}</td>
              <td className="px-4 py-2 text-gray-600">{col.type}</td>
              <td className="px-4 py-2 text-gray-600">{col.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function APIEndpoint({ method, path, description, body, response }) {
  const methodColors = {
    GET: 'bg-green-100 text-green-700',
    POST: 'bg-blue-100 text-blue-700',
    PUT: 'bg-yellow-100 text-yellow-700',
    DELETE: 'bg-red-100 text-red-700'
  }
  
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${methodColors[method]}`}>
          {method}
        </span>
        <code className="text-sm text-gray-700">{path}</code>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
      {body && (
        <div className="mt-2">
          <span className="text-xs text-gray-500">Request Body:</span>
          <pre className="text-xs bg-gray-50 p-2 rounded mt-1">{JSON.stringify(body, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

function ShortcutGroup({ title, shortcuts }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h5 className="font-semibold text-gray-800 mb-3">{title}</h5>
      <div className="space-y-2">
        {shortcuts.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">{s.key}</kbd>
            <span className="text-gray-600">{s.action}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FAQItem({ question, answer }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h5 className="font-semibold text-gray-800 mb-2">{question}</h5>
      <p className="text-sm text-gray-600">{answer}</p>
    </div>
  )
}

function TroubleshootItem({ issue, solutions }) {
  return (
    <div className="bg-red-50 border border-red-100 p-4 rounded-lg">
      <h5 className="font-semibold text-red-800 mb-2">{issue}</h5>
      <ul className="space-y-1">
        {solutions.map((s, i) => (
          <li key={i} className="text-sm text-red-700 flex items-start gap-2">
            <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ChangelogEntry({ version, date, type, changes }) {
  const typeColors = {
    release: 'bg-green-100 text-green-700 border-green-200',
    planned: 'bg-blue-100 text-blue-700 border-blue-200',
    bugfix: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  }
  
  return (
    <div className={`border rounded-lg p-4 ${typeColors[type] || 'bg-gray-100'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold">v{version}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            type === 'release' ? 'bg-green-200' : type === 'planned' ? 'bg-blue-200' : 'bg-yellow-200'
          }`}>
            {type === 'release' ? 'Released' : type === 'planned' ? 'Planned' : 'Bugfix'}
          </span>
        </div>
        <span className="text-sm">{date}</span>
      </div>
      <ul className="space-y-1">
        {changes.map((change, i) => (
          <li key={i} className="text-sm flex items-start gap-2">
            <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
            {change}
          </li>
        ))}
      </ul>
    </div>
  )
}

function BestPractice({ title, description, tips }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h5 className="font-semibold text-amber-800 mb-2">{title}</h5>
      <p className="text-sm text-amber-700 mb-3">{description}</p>
      <ul className="space-y-1">
        {tips.map((tip, i) => (
          <li key={i} className="text-sm text-amber-600 flex items-start gap-2">
            <CheckCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
            {tip}
          </li>
        ))}
      </ul>
    </div>
  )
}

function GlossaryTerm({ term, definition }) {
  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <dt className="font-semibold text-gray-800">{term}</dt>
      <dd className="text-sm text-gray-600">{definition}</dd>
    </div>
  )
}

function TutorialCard({ title, duration, description, level }) {
  const levelColors = {
    Beginner: 'bg-green-100 text-green-700',
    Intermediate: 'bg-blue-100 text-blue-700',
    Advanced: 'bg-purple-100 text-purple-700'
  }
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-amber-300 transition-colors cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <h5 className="font-semibold text-gray-800">{title}</h5>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelColors[level]}`}>
          {level}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Globe size={12} />
        <span>{duration}</span>
      </div>
    </div>
  )
}

export default Documentation
