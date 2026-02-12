import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Shield, User as UserIcon } from 'lucide-react'
import { api } from '../services/api'

const defaultRoles = ['Admin', 'Manager', 'Designer', 'Operator', 'Scanner']
const defaultDepartments = ['Management', 'Production', 'Design', 'Quality', 'Maintenance']

// The 5 test users that should always exist
const testUserEmails = [
  'admin@woodworking.com',
  'manager@woodworking.com', 
  'designer@woodworking.com',
  'operator@woodworking.com',
  'scanner@woodworking.com'
]

function UserManagement({ user, onViewDetail }) {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState(defaultRoles)
  const [departments, setDepartments] = useState(defaultDepartments)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    email: '', password: '', firstName: '', lastName: '', role: 'Operator', department: ''
  })
  const [errorModal, setErrorModal] = useState({ show: false, message: '' })

  useEffect(() => {
    loadUsers()
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const configs = await api.get('/system/config')
      const rolesConfig = configs.data.find(c => c.configKey === 'user_roles')
      const deptsConfig = configs.data.find(c => c.configKey === 'departments')
      if (rolesConfig?.configValue) setRoles(JSON.parse(rolesConfig.configValue))
      if (deptsConfig?.configValue) setDepartments(JSON.parse(deptsConfig.configValue))
    } catch (error) {
      console.error('Failed to load config:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const data = await api.getUsers()
      // Filter to only show test users
      const filteredUsers = (data || []).filter(u => testUserEmails.includes(u.email))
      setUsers(filteredUsers)
    } catch (error) {
      console.error('Failed to load users:', error)
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData)
      } else {
        await api.createUser(formData)
      }
      loadUsers()
      closeModal()
    } catch (error) {
      setErrorModal({ show: true, message: error.message })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await api.deleteUser(id)
      loadUsers()
    } catch (error) {
      setErrorModal({ show: true, message: error.message })
    }
  }

  const openModal = (userToEdit = null) => {
    if (userToEdit) {
      setEditingUser(userToEdit)
      setFormData({
        email: userToEdit.email,
        firstName: userToEdit.firstName || '',
        lastName: userToEdit.lastName || '',
        role: userToEdit.role,
        department: userToEdit.department || '',
        password: ''
      })
    } else {
      setEditingUser(null)
      setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'Operator', department: '' })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingUser(null)
  }

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.firstName && u.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.lastName && u.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const isAdmin = user?.role === 'Admin'

  if (!isAdmin) {
    return (
      <div className="pt-14">
        <div className="bg-red-100 text-red-700 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p>You need Admin privileges to access User Management.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-14">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
          <p className="text-gray-600">Manage users and role-based access control</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus size={18} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">User</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Department</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => onViewDetail && onViewDetail(u.id)}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          u.role === 'Admin' ? 'bg-red-100 text-red-600' :
                          u.role === 'Manager' ? 'bg-purple-100 text-purple-600' :
                          u.role === 'Designer' ? 'bg-blue-100 text-blue-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {u.role === 'Admin' ? <Shield size={18} /> : <UserIcon size={18} />}
                        </div>
                        <div>
                          <p className="font-medium text-amber-600 hover:underline">{u.firstName} {u.lastName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        u.role === 'Admin' ? 'bg-red-100 text-red-700' :
                        u.role === 'Manager' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'Designer' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{u.department || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(u)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Password {editingUser && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required={!editingUser}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select...</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-4 bg-red-600 text-white">
              <h3 className="text-lg font-semibold">Error</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700">{errorModal.message}</p>
            </div>
            <div className="p-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setErrorModal({ show: false, message: '' })}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
