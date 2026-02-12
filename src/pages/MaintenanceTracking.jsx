import { useState, useEffect } from 'react'
import { Wrench, Calendar, AlertTriangle, CheckCircle, Clock, Plus, RefreshCw, Settings, Hammer, Activity, X, ArrowLeft } from 'lucide-react'
import { api } from '../services/api'

export default function MaintenanceTracking() {
  const [machines, setMachines] = useState([])
  const [maintenanceRecords, setMaintenanceRecords] = useState([])
  const [scheduledMaintenance, setScheduledMaintenance] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [selectedMaintenance, setSelectedMaintenance] = useState(null)
  const [newMaintenance, setNewMaintenance] = useState({
    type: 'Preventive',
    description: '',
    scheduledDate: '',
    estimatedDuration: 60,
    priority: 'Normal'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const machinesData = await api.get('/machines')
      setMachines(machinesData)

      // Load maintenance records from localStorage
      const records = JSON.parse(localStorage.getItem('maintenanceRecords') || '[]')
      setMaintenanceRecords(records)

      const scheduled = JSON.parse(localStorage.getItem('scheduledMaintenance') || '[]')
      setScheduledMaintenance(scheduled)

      // Generate default scheduled maintenance if empty
      if (scheduled.length === 0 && machinesData.length > 0) {
        const defaultScheduled = machinesData.map((m, i) => ({
          id: `maint-${m.id}`,
          machineId: m.id,
          machineName: m.name,
          type: 'Preventive',
          description: 'Regular maintenance check',
          scheduledDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedDuration: 60,
          priority: 'Normal',
          status: 'Scheduled'
        }))
        setScheduledMaintenance(defaultScheduled)
        localStorage.setItem('scheduledMaintenance', JSON.stringify(defaultScheduled))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addMaintenance = () => {
    if (!selectedMachine || !newMaintenance.scheduledDate) return

    const maintenance = {
      id: `maint-${Date.now()}`,
      machineId: selectedMachine.id,
      machineName: selectedMachine.name,
      ...newMaintenance,
      status: 'Scheduled',
      createdAt: new Date().toISOString()
    }

    const updated = [...scheduledMaintenance, maintenance]
    setScheduledMaintenance(updated)
    localStorage.setItem('scheduledMaintenance', JSON.stringify(updated))

    setShowAddModal(false)
    setNewMaintenance({
      type: 'Preventive',
      description: '',
      scheduledDate: '',
      estimatedDuration: 60,
      priority: 'Normal'
    })
    setSelectedMachine(null)
  }

  const completeMaintenance = (id) => {
    const maintenance = scheduledMaintenance.find(m => m.id === id)
    if (!maintenance) return

    // Move to records
    const record = {
      ...maintenance,
      status: 'Completed',
      completedAt: new Date().toISOString()
    }
    const updatedRecords = [record, ...maintenanceRecords]
    setMaintenanceRecords(updatedRecords)
    localStorage.setItem('maintenanceRecords', JSON.stringify(updatedRecords))

    // Remove from scheduled
    const updatedScheduled = scheduledMaintenance.filter(m => m.id !== id)
    setScheduledMaintenance(updatedScheduled)
    localStorage.setItem('scheduledMaintenance', JSON.stringify(updatedScheduled))
  }

  const cancelMaintenance = (id) => {
    const updatedScheduled = scheduledMaintenance.filter(m => m.id !== id)
    setScheduledMaintenance(updatedScheduled)
    localStorage.setItem('scheduledMaintenance', JSON.stringify(updatedScheduled))
  }

  const getMaintenanceStatus = (machine) => {
    const lastMaintenance = maintenanceRecords
      .filter(r => r.machineId === machine.id)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0]

    if (!lastMaintenance) return { status: 'Unknown', color: 'gray', days: null }

    const daysSince = Math.floor((Date.now() - new Date(lastMaintenance.completedAt)) / (24 * 60 * 60 * 1000))

    if (daysSince > 30) return { status: 'Overdue', color: 'red', days: daysSince }
    if (daysSince > 20) return { status: 'Due Soon', color: 'yellow', days: daysSince }
    return { status: 'OK', color: 'green', days: daysSince }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700'
      case 'Medium': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-green-100 text-green-700'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Preventive': return <Settings size={16} />
      case 'Corrective': return <Wrench size={16} />
      case 'Emergency': return <AlertTriangle size={16} />
      default: return <Hammer size={16} />
    }
  }

  const upcomingMaintenance = scheduledMaintenance
    .filter(m => new Date(m.scheduledDate) >= new Date())
    .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))

  const overdueMaintenance = scheduledMaintenance
    .filter(m => new Date(m.scheduledDate) < new Date())

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw size={48} className="text-amber-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Machine Maintenance</h1>
          <p className="text-gray-600">Track and schedule machine maintenance</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            <Plus size={18} />
            Schedule Maintenance
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wrench size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Machines</p>
              <p className="text-xl font-bold text-gray-800">{machines.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed This Month</p>
              <p className="text-xl font-bold text-gray-800">
                {maintenanceRecords.filter(r => 
                  new Date(r.completedAt).getMonth() === new Date().getMonth()
                ).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Scheduled</p>
              <p className="text-xl font-bold text-gray-800">{upcomingMaintenance.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-xl font-bold text-gray-800">{overdueMaintenance.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Machine Status */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={20} className="text-amber-600" />
            Machine Maintenance Status
          </h2>

          <div className="space-y-3">
            {machines.map(machine => {
              const maintenanceStatus = getMaintenanceStatus(machine)
              return (
                <div key={machine.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-${maintenanceStatus.color}-500`} />
                    <div>
                      <p className="font-medium text-gray-800">{machine.name}</p>
                      <p className="text-sm text-gray-500">{machine.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium bg-${maintenanceStatus.color}-100 text-${maintenanceStatus.color}-700`}>
                      {maintenanceStatus.status}
                    </span>
                    {maintenanceStatus.days !== null && (
                      <p className="text-xs text-gray-500 mt-1">
                        {maintenanceStatus.days} days since last
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming Maintenance */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            Upcoming Maintenance
          </h2>

          <div className="space-y-3">
            {upcomingMaintenance.slice(0, 5).map(maintenance => (
              <div 
                key={maintenance.id} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setSelectedMaintenance(maintenance)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {getTypeIcon(maintenance.type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{maintenance.machineName}</p>
                    <p className="text-sm text-gray-500">{maintenance.type} - {maintenance.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(maintenance.scheduledDate).toLocaleDateString()}
                  </p>
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); completeMaintenance(maintenance.id); }}
                      className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      <CheckCircle size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); cancelMaintenance(maintenance.id); }}
                      className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {upcomingMaintenance.length === 0 && (
              <p className="text-center py-4 text-gray-500">No upcoming maintenance scheduled</p>
            )}
          </div>
        </div>
      </div>

      {/* Maintenance History */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Maintenance History</h2>
        
        {maintenanceRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Machine</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Completed</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Duration</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceRecords.slice(0, 10).map(record => (
                  <tr 
                    key={record.id} 
                    className="border-b cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setSelectedMaintenance(record)}
                  >
                    <td className="px-4 py-3 font-medium">{record.machineName}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1">
                        {getTypeIcon(record.type)}
                        {record.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{record.description}</td>
                    <td className="px-4 py-3">{new Date(record.completedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{record.estimatedDuration} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-8 text-gray-500">No maintenance records yet</p>
        )}
      </div>

      {/* Add Maintenance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Schedule Maintenance</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Machine</label>
                <select
                  value={selectedMachine?.id || ''}
                  onChange={(e) => setSelectedMachine(machines.find(m => m.id === e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select machine...</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newMaintenance.type}
                  onChange={(e) => setNewMaintenance({...newMaintenance, type: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Preventive">Preventive</option>
                  <option value="Corrective">Corrective</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newMaintenance.description}
                  onChange={(e) => setNewMaintenance({...newMaintenance, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Maintenance description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                <input
                  type="date"
                  value={newMaintenance.scheduledDate}
                  onChange={(e) => setNewMaintenance({...newMaintenance, scheduledDate: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Duration (min)</label>
                <input
                  type="number"
                  value={newMaintenance.estimatedDuration}
                  onChange={(e) => setNewMaintenance({...newMaintenance, estimatedDuration: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newMaintenance.priority}
                  onChange={(e) => setNewMaintenance({...newMaintenance, priority: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Normal">Normal</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={addMaintenance}
                disabled={!selectedMachine || !newMaintenance.scheduledDate}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Detail Modal */}
      {selectedMaintenance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedMaintenance(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-xl font-bold text-gray-800">Maintenance Details</h2>
                </div>
                <button
                  onClick={() => setSelectedMaintenance(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  selectedMaintenance.status === 'Completed' ? 'bg-green-100' :
                  selectedMaintenance.status === 'In Progress' ? 'bg-blue-100' :
                  selectedMaintenance.priority === 'High' ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                  <Hammer size={32} className={`${
                    selectedMaintenance.status === 'Completed' ? 'text-green-600' :
                    selectedMaintenance.status === 'In Progress' ? 'text-blue-600' :
                    selectedMaintenance.priority === 'High' ? 'text-red-600' : 'text-yellow-600'
                  }`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{selectedMaintenance.machineName}</h3>
                  <p className="text-gray-500">{selectedMaintenance.type} Maintenance</p>
                </div>
                <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${
                  selectedMaintenance.status === 'Completed' ? 'bg-green-100 text-green-700' :
                  selectedMaintenance.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {selectedMaintenance.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Scheduled Date</p>
                  <p className="font-medium text-gray-800">
                    {new Date(selectedMaintenance.scheduledDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Estimated Duration</p>
                  <p className="font-medium text-gray-800">{selectedMaintenance.estimatedDuration} minutes</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Priority</p>
                  <p className={`font-medium ${
                    selectedMaintenance.priority === 'High' ? 'text-red-600' :
                    selectedMaintenance.priority === 'Medium' ? 'text-yellow-600' : 'text-gray-800'
                  }`}>
                    {selectedMaintenance.priority}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Type</p>
                  <p className="font-medium text-gray-800">{selectedMaintenance.type}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-800">{selectedMaintenance.description || 'No description provided'}</p>
              </div>

              {selectedMaintenance.completedAt && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">Completed</p>
                  <p className="font-medium text-green-800">
                    {new Date(selectedMaintenance.completedAt).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                {selectedMaintenance.status === 'Scheduled' && (
                  <>
                    <button
                      onClick={() => {
                        startMaintenance(selectedMaintenance)
                        setSelectedMaintenance({...selectedMaintenance, status: 'In Progress'})
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Start Maintenance
                    </button>
                    <button
                      onClick={() => setSelectedMaintenance(null)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Close
                    </button>
                  </>
                )}
                {selectedMaintenance.status === 'In Progress' && (
                  <>
                    <button
                      onClick={() => {
                        completeMaintenance(selectedMaintenance)
                        setSelectedMaintenance({...selectedMaintenance, status: 'Completed', completedAt: new Date().toISOString()})
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Mark Complete
                    </button>
                    <button
                      onClick={() => setSelectedMaintenance(null)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Close
                    </button>
                  </>
                )}
                {selectedMaintenance.status === 'Completed' && (
                  <button
                    onClick={() => setSelectedMaintenance(null)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
