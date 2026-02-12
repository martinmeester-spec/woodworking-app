import { useState, useEffect } from 'react'
import { Wrench, Activity, AlertCircle, CheckCircle, Clock, Settings } from 'lucide-react'
import { api } from '../services/api'

function Machines({ onViewDetail }) {
  const [machines, setMachines] = useState([])
  const [maintenanceLog, setMaintenanceLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMachine, setSelectedMachine] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [machinesRes, calibrationsRes] = await Promise.all([
          api.get('/machines'),
          api.get('/machines/calibrations')
        ])
        setMachines(machinesRes.data || [])
        setMaintenanceLog((calibrationsRes.data || []).slice(0, 5))
      } catch (error) {
        console.error('Error fetching machines data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="pt-14">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Machine Management</h2>
          <p className="text-gray-600">Monitor and maintain production equipment</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
          <Wrench size={18} /> Schedule Maintenance
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {machines.map((machine) => (
          <div 
            key={machine.id} 
            className={`bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all hover:shadow-lg ${
              selectedMachine === machine.id ? 'ring-2 ring-amber-500' : ''
            }`}
            onClick={() => onViewDetail && onViewDetail(machine.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${
                  machine.status === 'Running' ? 'bg-green-100 text-green-600' :
                  machine.status === 'Idle' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {machine.status === 'Running' ? <Activity size={20} /> :
                   machine.status === 'Idle' ? <Clock size={20} /> :
                   <Wrench size={20} />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{machine.name}</h3>
                  <p className="text-sm text-gray-500">{machine.machineId}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                machine.status === 'Running' ? 'bg-green-100 text-green-700' :
                machine.status === 'Idle' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {machine.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Type</span>
                <span className="text-gray-800">{machine.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Uptime</span>
                <span className="text-gray-800">{machine.uptime}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Operating Hours</span>
                <span className="text-gray-800">{machine.operatingHours.toLocaleString()}h</span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Next Maintenance</span>
                  <span className="text-amber-600 font-medium">{machine.nextMaintenance}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                <Settings size={14} /> Configure
              </button>
              <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 text-sm">
                <Wrench size={14} /> Maintain
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Maintenance Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Machine</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Technician</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Notes</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceLog.map((log, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-800">{log.date}</td>
                  <td className="py-3 px-4 text-gray-600">{log.machine}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      log.type === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                      log.type === 'Preventive' ? 'bg-green-100 text-green-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{log.technician}</td>
                  <td className="py-3 px-4 text-gray-500">{log.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Machines
