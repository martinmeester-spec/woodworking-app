import { useState, useEffect } from 'react'
import { ArrowLeft, Wrench, Activity, Clock, AlertTriangle, Settings, Calendar, CheckCircle } from 'lucide-react'
import { api } from '../services/api'

function MachineDetail({ id, onBack }) {
  const [machine, setMachine] = useState(null)
  const [calibrations, setCalibrations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [machineRes, calibrationsRes] = await Promise.all([
          api.get(`/machines/${id}`),
          api.get(`/machines/calibrations?machineId=${id}`)
        ])
        setMachine(machineRes.data)
        setCalibrations(calibrationsRes.data || [])
      } catch (error) {
        console.error('Error fetching machine:', error)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="pt-14 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (!machine) {
    return (
      <div className="pt-14">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Machine Not Found</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-14">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4">
        <ArrowLeft size={20} /> Back to Machines
      </button>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-full ${
              machine.status === 'Operational' ? 'bg-green-100 text-green-600' :
              machine.status === 'Idle' ? 'bg-yellow-100 text-yellow-600' :
              'bg-red-100 text-red-600'
            }`}>
              {machine.status === 'Operational' ? <Activity size={32} /> :
               machine.status === 'Idle' ? <Clock size={32} /> :
               <Wrench size={32} />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{machine.name}</h2>
              <p className="text-gray-500">{machine.machineId}</p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            machine.status === 'Operational' ? 'bg-green-100 text-green-700' :
            machine.status === 'Idle' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {machine.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Settings size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="text-lg font-semibold text-gray-800">{machine.type || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <Activity size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Health Score</p>
              <p className="text-lg font-semibold text-gray-800">{machine.healthScore || 100}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-full">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Operating Hours</p>
              <p className="text-lg font-semibold text-gray-800">{machine.operatingHours?.toLocaleString() || 0}h</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Maintenance</p>
              <p className="text-lg font-semibold text-gray-800">{machine.lastMaintenance ? new Date(machine.lastMaintenance).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </div>

        {machine.healthScore && (
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-2">Health Score</p>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full transition-all ${
                  machine.healthScore >= 80 ? 'bg-green-500' :
                  machine.healthScore >= 50 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${machine.healthScore}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Machine Specifications</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Model</span>
              <span className="font-medium text-gray-800">{machine.model || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Manufacturer</span>
              <span className="font-medium text-gray-800">{machine.manufacturer || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Serial Number</span>
              <span className="font-medium text-gray-800">{machine.serialNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Install Date</span>
              <span className="font-medium text-gray-800">{machine.installDate ? new Date(machine.installDate).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Location</span>
              <span className="font-medium text-gray-800">{machine.location || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Calibrations</h3>
          {calibrations.length > 0 ? (
            <div className="space-y-3">
              {calibrations.slice(0, 5).map((cal) => (
                <div key={cal.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-800">{cal.calibrationType}</p>
                    <p className="text-sm text-gray-500">{new Date(cal.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    cal.result === 'Pass' ? 'bg-green-100 text-green-700' :
                    cal.result === 'Fail' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {cal.result}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No calibration records found</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default MachineDetail
