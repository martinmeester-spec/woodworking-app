import { useState, useEffect } from 'react'
import { ArrowLeft, Box, Ruler, Palette, Calendar, User, History, Download, Factory } from 'lucide-react'
import { api } from '../services/api'

function DesignDetail({ id, onBack }) {
  const [design, setDesign] = useState(null)
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [designRes, versionsRes] = await Promise.all([
          api.get(`/designs/${id}`),
          api.get(`/designs/${id}/versions`)
        ])
        setDesign(designRes.data)
        setVersions(versionsRes.data || [])
      } catch (error) {
        console.error('Error fetching design:', error)
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

  if (!design) {
    return (
      <div className="pt-14">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <Box size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Design Not Found</h2>
        </div>
      </div>
    )
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-700'
      case 'in review': return 'bg-yellow-100 text-yellow-700'
      case 'draft': return 'bg-gray-100 text-gray-700'
      default: return 'bg-blue-100 text-blue-700'
    }
  }

  return (
    <div className="pt-14">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4">
        <ArrowLeft size={20} /> Back to Designs
      </button>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{design.name}</h2>
            <p className="text-gray-500">{design.description || 'Cabinet Design'}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(design.status)}`}>
            {design.status || 'Draft'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Ruler size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Dimensions</p>
              <p className="text-lg font-semibold text-gray-800">{design.width} × {design.height} × {design.depth} mm</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-full">
              <Palette size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Material</p>
              <p className="text-lg font-semibold text-gray-800">{design.material || 'Oak'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <User size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Designer</p>
              <p className="text-lg font-semibold text-gray-800">{design.designer?.firstName || 'Unknown'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-lg font-semibold text-gray-800">{design.createdAt ? new Date(design.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
            <Factory size={18} /> Create Production Order
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download size={18} /> Export BOM
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Design Specifications</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Width</span>
              <span className="font-medium text-gray-800">{design.width} mm</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Height</span>
              <span className="font-medium text-gray-800">{design.height} mm</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Depth</span>
              <span className="font-medium text-gray-800">{design.depth} mm</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Material</span>
              <span className="font-medium text-gray-800">{design.material || 'Oak'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Finish</span>
              <span className="font-medium text-gray-800">{design.finish || 'Natural'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Parts Count</span>
              <span className="font-medium text-gray-800">{design.modelData?.parts?.length || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <History size={20} /> Version History
          </h3>
          {versions.length > 0 ? (
            <div className="space-y-3">
              {versions.slice(0, 5).map((version) => (
                <div key={version.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-800">Version {version.versionNumber}</p>
                    <p className="text-sm text-gray-500">{version.changeNotes || 'No notes'}</p>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(version.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No version history</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default DesignDetail
