import { Menu, Bell, User, Settings, LogOut } from 'lucide-react'

function Header({ toggleSidebar, sidebarOpen, user, onLogout }) {
  return (
    <header className="bg-amber-800 text-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="p-2 hover:bg-amber-700 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪵</span>
            <h1 className="text-xl font-bold">Woodworking Cabinet System</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-amber-700 rounded-lg transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="p-2 hover:bg-amber-700 rounded-lg transition-colors">
            <Settings size={20} />
          </button>
          <div className="flex items-center gap-2 pl-4 border-l border-amber-600">
            <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
              <User size={18} />
            </div>
            <div className="text-sm">
              <p className="font-medium">{user?.firstName || 'User'}</p>
              <p className="text-xs text-amber-200">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 hover:bg-amber-700 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
