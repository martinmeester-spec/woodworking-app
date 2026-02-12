import { useState, useEffect } from 'react'
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, User, Calendar, Wrench, Package } from 'lucide-react'
import { api } from '../services/api'

function DefectDetail({ id, onBack }) {
  const [defect, setDefect] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDefect = async () => {
      try {
        const response = await api.get(`/quality/defects/${id}`)
        setDefect(response.data)
      } catch (error) {
        console.error('Error fetching defect:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDefect()
  }, [id])

  if (loading) {
    return (
      <div className="pt-14 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (!defect) {
    return (
      <div className="pt-14">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Defect Not Found</h2>
        </div>
      </div>
    )
  }

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-700'
      case 'high': return 'bg-orange-100 text-orange-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return 'bg-green-100 text-green-700'
      case 'in rework': return 'bg-orange-100 text-orange-700'
      default: return 'bg-yellow-100 text-yellow-700'
    }
  }

  return (
    <div className="pt-14">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4">
        <ArrowLeft size={20} /> Back to Quality
      </button>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-full ${
              defect.severity === 'Critical' ? 'bg-red-100 text-red-600' :
              defect.severity === 'High' ? 'bg-orange-100 text-orange-600' :
              'bg-yellow-100 text-yellow-600'
            }`}>
              <AlertTriangle size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{defect.defectType}</h2>
              <p className="text-gray-500">Defect #{defect.id?.slice(0, 8)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getSeverityColor(defect.severity)}`}>
              {defect.severity}
            </span>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(defect.status)}`}>
              {defect.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Panel ID</p>
              <p className="text-lg font-semibold text-gray-800">{defect.panelId || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <Wrench size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Station</p>
              <p className="text-lg font-semibold text-gray-800">{defect.station?.name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <User size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Detected By</p>
              <p className="text-lg font-semibold text-gray-800">{defect.detectedBy?.firstName || 'Unknown'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-full">
              <Calendar size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Detected Date</p>
              <p className="text-lg font-semibold text-gray-800">{defect.createdAt ? new Date(defect.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Defect Details</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Description</p>
              <p className="text-gray-800">{defect.description || 'No description provided'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Location on Panel</p>
                <p className="font-medium text-gray-800">{defect.location || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Size/Area</p>
                <p className="font-medium text-gray-800">{defect.size || 'N/A'}</p>
              </div>
            </div>
            {defect.imageUrl && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Defect Image</p>
                <img src={defect.imageUrl} alt="Defect" className="rounded-lg max-w-full h-48 object-cover" />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Resolution</h3>
          {defect.status === 'Resolved' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle size={24} className="text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Defect Resolved</p>
                  <p className="text-sm text-green-600">{defect.resolvedAt ? new Date(defect.resolvedAt).toLocaleDateString() : ''}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Resolution Notes</p>
                <p className="text-gray-800">{defect.resolutionNotes || 'No notes provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Resolved By</p>
                <p className="font-medium text-gray-800">{defect.resolvedBy?.firstName || 'Unknown'}</p>
              </div>
            </div>
          ) : defect.status === 'In Rework' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                <Wrench size={24} className="text-orange-600" />
                <div>
                  <p className="font-medium text-orange-800">Currently in Rework</p>
                  <p className="text-sm text-orange-600">Assigned for correction</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Rework Notes</p>
                <p className="text-gray-800">{defect.reworkNotes || 'No notes provided'}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
              <XCircle size={24} className="text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Pending Resolution</p>
                <p className="text-sm text-yellow-600">Awaiting review and action</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            {defect.status !== 'Resolved' && (
              <>
                <button className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
                  Start Rework
                </button>
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Mark Resolved
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DefectDetail
