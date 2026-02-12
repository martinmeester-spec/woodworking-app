import { LayoutDashboard, Palette, Factory, Package, Wrench, CheckCircle, Settings, Users, FlaskConical, BarChart3, Code, Activity, Scan, HelpCircle, Calculator, Globe, FileCode, Smartphone, TrendingUp, DollarSign, GitBranch, Layers, Calendar, Hammer } from 'lucide-react'

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Designer', 'Operator'] },
  { id: 'design', label: 'Design Studio', icon: Palette, roles: ['Admin', 'Manager', 'Designer'] },
  { id: 'cad-export', label: 'CAD Export', icon: FileCode, roles: ['Admin', 'Manager', 'Designer'] },
  { id: 'production', label: 'Production', icon: Factory, roles: ['Admin', 'Manager', 'Operator'] },
  { id: 'floor', label: 'Production Floor', icon: Scan, roles: ['Admin', 'Manager', 'Operator'] },
  { id: 'mobile', label: 'Mobile Scanner', icon: Smartphone, roles: ['Admin', 'Manager', 'Operator'] },
  { id: 'batch', label: 'Batch Processing', icon: Layers, roles: ['Admin', 'Manager'] },
  { id: 'inventory', label: 'Inventory', icon: Package, roles: ['Admin', 'Manager', 'Operator'] },
  { id: 'machines', label: 'Machines', icon: Wrench, roles: ['Admin', 'Manager', 'Operator'] },
  { id: 'maintenance', label: 'Maintenance', icon: Hammer, roles: ['Admin', 'Manager', 'Operator'] },
  { id: 'quality', label: 'Quality Control', icon: CheckCircle, roles: ['Admin', 'Manager', 'Operator'] },
  { id: 'costs', label: 'Cost Estimation', icon: Calculator, roles: ['Admin', 'Manager'] },
  { id: 'tracking', label: 'Activity Tracking', icon: Activity, roles: ['Admin', 'Manager'] },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, roles: ['Admin', 'Manager'] },
  { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['Admin', 'Manager'] },
  { id: 'accounting', label: 'Accounting', icon: DollarSign, roles: ['Admin', 'Manager'] },
  { id: 'customer-portal', label: 'Customer Portal', icon: Globe, roles: ['Admin', 'Manager'] },
  { id: 'users', label: 'User Management', icon: Users, roles: ['Admin'] },
  { id: 'tests', label: 'Test Center', icon: FlaskConical, roles: ['Admin'] },
  { id: 'dev', label: 'Development', icon: Code, roles: ['Admin'] },
  { id: 'docs', label: 'Documentation', icon: HelpCircle, roles: ['Admin', 'Manager', 'Designer', 'Operator'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['Admin', 'Manager', 'Designer', 'Operator'] },
]

function Sidebar({ isOpen, currentPage, setCurrentPage, userRole = 'Admin' }) {
  // Always show all menu items for Admin, or filter based on role
  const effectiveRole = userRole || 'Admin'
  const filteredMenuItems = effectiveRole === 'Admin' 
    ? menuItems 
    : menuItems.filter(item => item.roles.includes(effectiveRole))
  return (
    <aside className={`fixed left-0 top-14 h-full bg-gray-800 text-white transition-all duration-300 z-40 ${isOpen ? 'w-64' : 'w-16'}`}>
      <nav className="py-4">
        {isOpen && (
          <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-700 mb-2">
            Role: {effectiveRole}
          </div>
        )}
        {filteredMenuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors ${
                currentPage === item.id ? 'bg-amber-700 border-r-4 border-amber-400' : ''
              }`}
            >
              <Icon size={20} />
              {isOpen && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar
