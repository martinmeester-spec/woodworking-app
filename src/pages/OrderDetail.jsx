import { useState, useEffect } from 'react'
import { ArrowLeft, Package, Calendar, User, Clock, CheckCircle, AlertTriangle, QrCode, RotateCcw, ZoomIn, ZoomOut, Play, Factory, FileText } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../services/api'
import PartProductionPlan from '../components/PartProductionPlan'

const CABINET_PARTS = {
  bottom: { name: 'Bottom Panel', color: '#8B4513' },
  bottomPanel: { name: 'Bottom Panel', color: '#8B4513' },
  top: { name: 'Top Panel', color: '#A0522D' },
  topPanel: { name: 'Top Panel', color: '#A0522D' },
  left: { name: 'Left Side', color: '#CD853F' },
  leftPanel: { name: 'Left Side', color: '#CD853F' },
  right: { name: 'Right Side', color: '#DEB887' },
  rightPanel: { name: 'Right Side', color: '#DEB887' },
  back: { name: 'Back Panel', color: '#D2691E' },
  backPanel: { name: 'Back Panel', color: '#D2691E' },
  shelf: { name: 'Shelf', color: '#F4A460' },
  door: { name: 'Door', color: '#DAA520' },
  divider: { name: 'Divider', color: '#BC8F8F' }
}

// Calculate cutting dimensions (2D face) from 3D part dimensions
// For sheet goods, the cutting face is the two largest dimensions
const getCuttingDimensions = (part) => {
  const dims = [part.w, part.h, part.d].sort((a, b) => b - a)
  // Return width × height (larger × smaller of the two largest dims)
  return { width: dims[0], height: dims[1], thickness: dims[2] }
}

function OrderDetail({ id, onBack }) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedPart, setSelectedPart] = useState(null)
  const [selectedPartQR, setSelectedPartQR] = useState(null)
  const [loadingQR, setLoadingQR] = useState(false)
  const [cabinetRotation, setCabinetRotation] = useState({ x: -25, y: 35 })
  const [partRotation, setPartRotation] = useState({ x: -15, y: 25 })
  const [zoom, setZoom] = useState(1)
  const [designParts, setDesignParts] = useState([])
  const [sendingToProduction, setSendingToProduction] = useState(false)
  const [successModal, setSuccessModal] = useState({ show: false, title: '', message: '' })
  const [activeTab, setActiveTab] = useState('overview') // 'overview' or 'trace'
  const [trackingHistory, setTrackingHistory] = useState([])
  const [loadingTrace, setLoadingTrace] = useState(false)
  const [showProductionPlan, setShowProductionPlan] = useState(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/production/orders/${id}`)
        // api.get returns raw data, not wrapped in { data }
        const orderData = response.data || response
        setOrder(orderData)
        
        // Fetch design parts with QR codes if design exists
        if (orderData?.design?.id || orderData?.designId) {
          try {
            const designId = orderData.design?.id || orderData.designId
            const partsResponse = await api.get(`/designs/${designId}/parts`)
            const partsData = partsResponse.data || partsResponse
            if (partsData && partsData.length > 0) {
              setDesignParts(partsData)
            }
          } catch (e) {
            console.log('No design parts found, using generated parts')
          }
        }
      } catch (error) {
        console.error('Error fetching order:', error)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchOrder()
  }, [id])

  // Fetch tracking history when trace tab is selected
  useEffect(() => {
    const fetchTrackingHistory = async () => {
      if (activeTab !== 'trace' || !order?.orderNumber) return
      setLoadingTrace(true)
      try {
        const response = await api.get(`/tracking/orders/${id}/tracking`)
        const trackingData = response.data || response || []
        setTrackingHistory(Array.isArray(trackingData) ? trackingData : [])
      } catch (error) {
        console.error('Error fetching tracking history:', error)
        setTrackingHistory([])
      }
      setLoadingTrace(false)
    }
    fetchTrackingHistory()
  }, [activeTab, order?.orderNumber, id])

  // Fetch QR code when a part is selected
  useEffect(() => {
    const fetchQRCode = async () => {
      if (!selectedPart || !order?.design?.id) {
        setSelectedPartQR(null)
        return
      }
      
      // Find the part in designParts
      const dbPart = designParts.find(p => p.name === selectedPart || p.id === selectedPart)
      
      if (dbPart?.qrCode) {
        setSelectedPartQR(dbPart.qrCode)
        return
      }
      
      if (dbPart?.id) {
        setLoadingQR(true)
        try {
          const response = await api.get(`/designs/${order.design.id}/parts/${dbPart.id}/qrcode`)
          const qrData = response.data || response
          setSelectedPartQR(qrData.qrCode || qrData)
        } catch (error) {
          console.error('Error fetching QR code:', error)
          setSelectedPartQR(null)
        } finally {
          setLoadingQR(false)
        }
      } else {
        setSelectedPartQR(null)
      }
    }
    fetchQRCode()
  }, [selectedPart, order?.design?.id, designParts])

  if (loading) {
    return (
      <div className="pt-14 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="pt-14">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Order Not Found</h2>
        </div>
      </div>
    )
  }

  const completionRate = order.totalPanels ? Math.round((order.completedPanels / order.totalPanels) * 100) : 0

  // Generate cabinet parts based on design modelData or database parts
  const generateParts = () => {
    // First try to use parts from the design's modelData
    const modelParts = order.design?.modelData?.parts
    if (modelParts && modelParts.length > 0) {
      return modelParts.map(p => ({
        id: p.id,
        type: p.type,
        w: p.w,
        h: p.h,
        d: p.d,
        x: p.x || 0,
        y: p.y || 0,
        z: p.z || 0,
        holes: p.holes || [] // Include borehole data
      }))
    }
    
    // If we have database parts, use those
    if (designParts.length > 0) {
      return designParts.map(p => ({
        id: p.name || p.id,
        type: p.partType,
        w: parseFloat(p.width),
        h: parseFloat(p.height),
        d: parseFloat(p.depth),
        x: parseFloat(p.positionX) || 0,
        y: parseFloat(p.positionY) || 0,
        z: parseFloat(p.positionZ) || 0,
        qrCode: p.qrCode
      }))
    }
    
    // Fallback: generate default parts based on design dimensions
    const design = order.design || { width: 600, height: 720, depth: 560 }
    const W = parseFloat(design.width) || 600
    const H = parseFloat(design.height) || 720
    const D = parseFloat(design.depth) || 560
    const T = 18
    const backT = 6
    
    return [
      { id: 'left', type: 'leftPanel', w: T, h: H, d: D - backT, x: 0, y: 0, z: 0 },
      { id: 'right', type: 'rightPanel', w: T, h: H, d: D - backT, x: W - T, y: 0, z: 0 },
      { id: 'top', type: 'topPanel', w: W - 2*T, h: T, d: D - backT, x: T, y: H - T, z: 0 },
      { id: 'bottom', type: 'bottomPanel', w: W - 2*T, h: T, d: D - backT, x: T, y: 0, z: 0 },
      { id: 'back', type: 'backPanel', w: W, h: H, d: backT, x: 0, y: 0, z: D - backT },
      { id: 'shelf', type: 'shelf', w: W - 2*T, h: T, d: D - backT - T, x: T, y: Math.floor(H/2), z: 0 }
    ]
  }

  const parts = generateParts()
  const scale = 0.25

  // Send order to production floor (Wall Saw station)
  const sendToProduction = async () => {
    if (sendingToProduction) return
    setSendingToProduction(true)
    try {
      // Generate parts fresh to ensure we have the latest data
      const partsToSend = generateParts()
      console.log('Parts to send:', partsToSend)
      
      if (!partsToSend || partsToSend.length === 0) {
        setSuccessModal({
          show: true,
          title: 'Error',
          message: 'No parts found in this order to send to production.'
        })
        setSendingToProduction(false)
        return
      }
      
      // Create tracking records for all parts at the wallsaw station
      let panelCount = 0
      
      // Get current user from localStorage for tracking
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      
      for (let i = 0; i < partsToSend.length; i++) {
        const part = partsToSend[i]
        const config = CABINET_PARTS[part.type]
        // Use the part's existing ID if available (from design parts), otherwise generate one
        const partId = part.id || `${order.orderNumber}-${part.type}-${i}`
        try {
          // Create tracking record at wallsaw station
          await api.post('/tracking/scan', {
            partId: partId,
            partName: config?.name || part.type,
            orderId: id,
            orderNumber: order.orderNumber,
            station: 'wallsaw',
            scannedBy: currentUser?.id || 'system',
            scannedByName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'System',
            barcode: partId,
            notes: `Dimensions: ${part.w}×${part.h}×${part.d}mm`
          })
          panelCount++
        } catch (e) {
          console.warn(`Failed to create tracking for ${part.type}:`, e)
        }
      }
      
      // Update order status to Cutting and panel count
      await api.put(`/production/orders/${id}`, { 
        status: 'Cutting',
        totalPanels: panelCount
      })
      
      // Refresh order data
      const response = await api.get(`/production/orders/${id}`)
      const orderData = response.data || response
      setOrder(orderData)
      
      setSuccessModal({
        show: true,
        title: 'Sent to Production',
        message: `${panelCount} parts are now queued at the Wall Saw station.`
      })
    } catch (error) {
      setSuccessModal({
        show: true,
        title: 'Error',
        message: `Failed to send to production: ${error.message}`
      })
    } finally {
      setSendingToProduction(false)
    }
  }

  const render3DPart = (part, isHighlighted, s = scale) => {
    const config = CABINET_PARTS[part.type]
    const color = config?.color || '#ccc'
    const borderColor = isHighlighted ? '#3b82f6' : 'rgba(0,0,0,0.3)'
    
    // Scale dimensions directly like DesignStudio3D
    const pw = part.w * s
    const ph = part.h * s
    const pd = part.d * s
    
    // Position at center of the box
    const cx = (part.x + part.w/2) * s
    const cy = -(part.y + part.h/2) * s
    const cz = (part.z + part.d/2) * s
    
    return (
      <div
        key={part.id}
        style={{
          position: 'absolute',
          transformStyle: 'preserve-3d',
          transform: `translate3d(${cx}px, ${cy}px, ${cz}px)`,
          opacity: isHighlighted ? 1 : (selectedPart && selectedPart !== part.id ? 0.4 : 1),
          transition: 'opacity 0.2s ease'
        }}
        title={`${config?.name || part.type}: ${part.w}×${part.h}×${part.d}mm`}
      >
        {/* Front face (facing -Z) */}
        <div style={{
          position: 'absolute',
          width: `${pw}px`,
          height: `${ph}px`,
          marginLeft: `${-pw/2}px`,
          marginTop: `${-ph/2}px`,
          backgroundColor: color,
          border: `1px solid ${borderColor}`,
          transform: `translateZ(${-pd/2}px)`,
          boxShadow: isHighlighted ? '0 0 10px rgba(59, 130, 246, 0.6)' : 'none'
        }}>
          {pw > 30 && ph > 20 && (
            <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white bg-black/30 rounded">
              {part.w}×{part.h}
            </span>
          )}
        </div>
        {/* Back face (facing +Z) */}
        <div style={{
          position: 'absolute',
          width: `${pw}px`,
          height: `${ph}px`,
          marginLeft: `${-pw/2}px`,
          marginTop: `${-ph/2}px`,
          backgroundColor: color,
          border: `1px solid ${borderColor}`,
          transform: `translateZ(${pd/2}px) rotateY(180deg)`,
          filter: 'brightness(0.85)'
        }} />
        {/* Right face (facing +X) */}
        <div style={{
          position: 'absolute',
          width: `${pd}px`,
          height: `${ph}px`,
          marginLeft: `${-pd/2}px`,
          marginTop: `${-ph/2}px`,
          backgroundColor: color,
          border: `1px solid ${borderColor}`,
          transform: `rotateY(90deg) translateZ(${pw/2}px)`,
          filter: 'brightness(0.75)'
        }} />
        {/* Left face (facing -X) */}
        <div style={{
          position: 'absolute',
          width: `${pd}px`,
          height: `${ph}px`,
          marginLeft: `${-pd/2}px`,
          marginTop: `${-ph/2}px`,
          backgroundColor: color,
          border: `1px solid ${borderColor}`,
          transform: `rotateY(-90deg) translateZ(${pw/2}px)`,
          filter: 'brightness(0.75)'
        }} />
        {/* Top face (facing -Y) */}
        <div style={{
          position: 'absolute',
          width: `${pw}px`,
          height: `${pd}px`,
          marginLeft: `${-pw/2}px`,
          marginTop: `${-pd/2}px`,
          backgroundColor: color,
          border: `1px solid ${borderColor}`,
          transform: `rotateX(90deg) translateZ(${ph/2}px)`,
          filter: 'brightness(1.1)'
        }} />
        {/* Bottom face (facing +Y) */}
        <div style={{
          position: 'absolute',
          width: `${pw}px`,
          height: `${pd}px`,
          marginLeft: `${-pw/2}px`,
          marginTop: `${-pd/2}px`,
          backgroundColor: color,
          border: `1px solid ${borderColor}`,
          transform: `rotateX(-90deg) translateZ(${ph/2}px)`,
          filter: 'brightness(0.65)'
        }} />
      </div>
    )
  }

  return (
    <div className="pt-14">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-amber-600 mb-4">
        <ArrowLeft size={20} /> Back to Orders
      </button>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{order.orderNumber || order.id}</h2>
            <p className="text-gray-500">Production Order Details</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              order.status === 'Completed' ? 'bg-green-100 text-green-700' :
              order.status === 'In Progress' || order.status === 'Cutting' ? 'bg-blue-100 text-blue-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {order.status}
            </span>
            {(order.status === 'Pending' || order.status === 'Draft' || order.status === 'In Progress' || !order.status) && order.status !== 'Cutting' && order.status !== 'Completed' && (
              <button
                onClick={sendToProduction}
                disabled={sendingToProduction}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {sendingToProduction ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Factory size={18} />
                    Send to Production
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'overview' 
                ? 'border-amber-600 text-amber-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('trace')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'trace' 
                ? 'border-amber-600 text-amber-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Trace History
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
        {/* Order QR Code - Always visible */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <QRCodeSVG 
                value={order.orderNumber || order.id || 'ORDER'} 
                size={128}
                level="M"
                includeMargin={true}
              />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <QrCode size={18} />
                Order QR Code
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                Scan this code to track this order through production stations.
              </p>
              <div className="text-sm text-gray-500 space-y-1">
                <p><span className="font-medium">Order:</span> {order.orderNumber}</p>
                <p><span className="font-medium">Customer:</span> {order.customerName || 'N/A'}</p>
                <p><span className="font-medium">Status:</span> {order.status}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Panels</p>
              <p className="text-lg font-semibold text-gray-800">{order.totalPanels || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-lg font-semibold text-gray-800">{order.completedPanels || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-full">
              <Calendar size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="text-lg font-semibold text-gray-800">{order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <User size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Created By</p>
              <p className="text-lg font-semibold text-gray-800">{order.creator?.firstName || 'Unknown'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-2">Completion Progress</p>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-amber-600 h-4 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
          <p className="text-right text-sm text-gray-500 mt-1">{completionRate}%</p>
        </div>
        </div>

      {/* Parts and 3D Views Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cabinet Parts & 3D Preview</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Parts List */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 mb-3">Parts ({parts.length})</h4>
            <div className="max-h-96 overflow-y-auto space-y-1">
              {parts.map((part) => {
                const config = CABINET_PARTS[part.type]
                const isSelected = selectedPart === part.id
                return (
                  <div
                    key={part.id}
                    className={`flex items-center gap-2 p-2 rounded transition-all text-sm ${
                      isSelected ? 'bg-blue-100 border-l-4 border-blue-500' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div 
                      className="w-3 h-3 rounded-sm flex-shrink-0 cursor-pointer" 
                      style={{ backgroundColor: config?.color || '#ccc' }}
                      onClick={() => setSelectedPart(isSelected ? null : part.id)}
                    />
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setSelectedPart(isSelected ? null : part.id)}
                    >
                      <span className="font-medium text-gray-800 block truncate">{config?.name || part.type}</span>
                      <span className="text-xs text-gray-500">{(() => { const cut = getCuttingDimensions(part); return `${cut.width}×${cut.height}×${cut.thickness}mm`; })()}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowProductionPlan(part)
                      }}
                      className="p-1 hover:bg-amber-100 rounded text-amber-600 hover:text-amber-700"
                      title="View Production Plan"
                    >
                      <FileText size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 3D Cabinet View - Larger */}
          <div className="lg:col-span-2 bg-gradient-to-b from-sky-200 to-sky-100 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-700">Full Cabinet View</h4>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCabinetRotation({ x: -25, y: 35 })}
                  className="px-2 py-1 bg-white/80 hover:bg-white rounded text-xs text-gray-600"
                  title="Reset view"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
            <div 
              className="relative h-80 flex items-center justify-center overflow-hidden rounded-lg"
              style={{ perspective: '1500px' }}
            >
              <div
                style={{
                  transformStyle: 'preserve-3d',
                  transform: `rotateX(${cabinetRotation.x}deg) rotateY(${cabinetRotation.y}deg)`,
                  transition: 'transform 0.3s ease'
                }}
              >
                {parts.map((part) => render3DPart(part, selectedPart === part.id, 0.22))}
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-3">
              <button 
                onClick={() => setCabinetRotation(r => ({ ...r, x: r.x + 10 }))}
                className="px-3 py-1.5 bg-white/80 hover:bg-white rounded text-xs text-gray-700"
              >
                ↑ Tilt
              </button>
              <button 
                onClick={() => setCabinetRotation(r => ({ ...r, y: r.y - 15 }))}
                className="px-3 py-1.5 bg-white/80 hover:bg-white rounded text-xs text-gray-700"
              >
                ← Rotate
              </button>
              <button 
                onClick={() => setCabinetRotation(r => ({ ...r, y: r.y + 15 }))}
                className="px-3 py-1.5 bg-white/80 hover:bg-white rounded text-xs text-gray-700"
              >
                Rotate →
              </button>
              <button 
                onClick={() => setCabinetRotation(r => ({ ...r, x: r.x - 10 }))}
                className="px-3 py-1.5 bg-white/80 hover:bg-white rounded text-xs text-gray-700"
              >
                ↓ Tilt
              </button>
            </div>
          </div>

          {/* Selected Part 3D View */}
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-4">
            <h4 className="font-medium text-white mb-2">
              {selectedPart ? (() => {
                const part = parts.find(p => p.id === selectedPart)
                const config = part ? CABINET_PARTS[part.type] : null
                return `${config?.name || selectedPart} - ${part?.w}×${part?.h}×${part?.d}mm`
              })() : 'Select a Part'}
            </h4>
            <div 
              className="relative h-72 flex items-center justify-center overflow-hidden"
              style={{ perspective: '800px' }}
            >
              {selectedPart ? (
                <div
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `rotateX(${partRotation.x}deg) rotateY(${partRotation.y}deg)`,
                    transition: 'transform 0.3s ease'
                  }}
                >
                  {(() => {
                    const part = parts.find(p => p.id === selectedPart)
                    if (!part) return null
                    const config = CABINET_PARTS[part.type]
                    const s = 0.4
                    const pw = part.w * s
                    const ph = part.h * s
                    const pd = part.d * s
                    const color = config?.color || '#ccc'
                    
                    return (
                      <div style={{ transformStyle: 'preserve-3d', position: 'relative' }}>
                        {/* Front */}
                        <div style={{
                          position: 'absolute',
                          width: `${pw}px`,
                          height: `${ph}px`,
                          marginLeft: `${-pw/2}px`,
                          marginTop: `${-ph/2}px`,
                          backgroundColor: color,
                          transform: `translateZ(${pd/2}px)`,
                          border: '2px solid rgba(255,255,255,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                          fontSize: '14px',
                          boxShadow: '0 0 20px rgba(0,0,0,0.3)'
                        }}>
                          {config?.name}
                        </div>
                        {/* Back */}
                        <div style={{
                          position: 'absolute',
                          width: `${pw}px`,
                          height: `${ph}px`,
                          marginLeft: `${-pw/2}px`,
                          marginTop: `${-ph/2}px`,
                          backgroundColor: color,
                          transform: `translateZ(${-pd/2}px) rotateY(180deg)`,
                          border: '2px solid rgba(255,255,255,0.2)',
                          filter: 'brightness(0.8)'
                        }} />
                        {/* Top */}
                        <div style={{
                          position: 'absolute',
                          width: `${pw}px`,
                          height: `${pd}px`,
                          marginLeft: `${-pw/2}px`,
                          marginTop: `${-pd/2}px`,
                          backgroundColor: color,
                          transform: `rotateX(90deg) translateZ(${ph/2}px)`,
                          border: '2px solid rgba(255,255,255,0.2)',
                          filter: 'brightness(1.1)'
                        }} />
                        {/* Bottom */}
                        <div style={{
                          position: 'absolute',
                          width: `${pw}px`,
                          height: `${pd}px`,
                          marginLeft: `${-pw/2}px`,
                          marginTop: `${-pd/2}px`,
                          backgroundColor: color,
                          transform: `rotateX(-90deg) translateZ(${ph/2}px)`,
                          border: '2px solid rgba(255,255,255,0.2)',
                          filter: 'brightness(0.7)'
                        }} />
                        {/* Left */}
                        <div style={{
                          position: 'absolute',
                          width: `${pd}px`,
                          height: `${ph}px`,
                          marginLeft: `${-pd/2}px`,
                          marginTop: `${-ph/2}px`,
                          backgroundColor: color,
                          transform: `rotateY(-90deg) translateZ(${pw/2}px)`,
                          border: '2px solid rgba(255,255,255,0.2)',
                          filter: 'brightness(0.85)'
                        }} />
                        {/* Right */}
                        <div style={{
                          position: 'absolute',
                          width: `${pd}px`,
                          height: `${ph}px`,
                          marginLeft: `${-pd/2}px`,
                          marginTop: `${-ph/2}px`,
                          backgroundColor: color,
                          transform: `rotateY(90deg) translateZ(${pw/2}px)`,
                          border: '2px solid rgba(255,255,255,0.2)',
                          filter: 'brightness(0.85)'
                        }} />
                        
                        {/* Boreholes visualization on appropriate faces */}
                        {part.holes && part.holes.map((hole, idx) => {
                          const holeX = (hole.x || 0) * s
                          const holeY = (hole.y || 0) * s
                          const isSideHole = hole.face === 'side'
                          const isFrontHole = hole.face === 'front'
                          
                          // For side holes (on horizontal panels), show on the left/right edge
                          if (isSideHole) {
                            return (
                              <div
                                key={`hole-${idx}`}
                                style={{
                                  position: 'absolute',
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: '#00cc66',
                                  border: '2px solid #009944',
                                  marginLeft: `${-pd/2}px`,
                                  marginTop: `${-holeY - ph/2}px`,
                                  transform: `rotateY(-90deg) translateZ(${pw/2 + 2}px) translateX(${holeX - pd/2}px)`,
                                  boxShadow: '0 0 6px rgba(0, 204, 102, 0.8)'
                                }}
                                title={`Side Hole #${idx + 1}: Depth ${hole.depth}mm, Face: ${hole.face}`}
                              />
                            )
                          }
                          
                          // For front holes (on vertical panels), show on the front face
                          return (
                            <div
                              key={`hole-${idx}`}
                              style={{
                                position: 'absolute',
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: '#ff6600',
                                border: '2px solid #cc4400',
                                marginLeft: `${holeX - pw/2}px`,
                                marginTop: `${-holeY - ph/2}px`,
                                transform: `translateZ(${pd/2 + 2}px)`,
                                boxShadow: '0 0 6px rgba(255, 102, 0, 0.8)'
                              }}
                              title={`Front Hole #${idx + 1}: Depth ${hole.depth}mm, Face: ${hole.face}`}
                            />
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <p className="text-gray-400 text-center">Click on a part in the list to see its detail view</p>
              )}
            </div>
            {selectedPart && (
              <div className="flex justify-center gap-2 mt-2">
                <button 
                  onClick={() => setPartRotation(r => ({ ...r, y: r.y - 15 }))}
                  className="px-2 py-1 bg-blue-200 hover:bg-blue-300 rounded text-xs"
                >
                  ← Rotate
                </button>
                <button 
                  onClick={() => setPartRotation(r => ({ ...r, y: r.y + 15 }))}
                  className="px-2 py-1 bg-blue-200 hover:bg-blue-300 rounded text-xs"
                >
                  Rotate →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* QR Code Section - shown when a part is selected */}
        {selectedPart && (
          <div className="mt-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
            <h4 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
              <QrCode size={20} />
              Part QR Code
            </h4>
            <div className="flex items-center gap-6">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <QRCodeSVG 
                  value={`${order.orderNumber || order.id}-${selectedPart}`} 
                  size={180}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-gray-800 mb-2">
                  {CABINET_PARTS[parts.find(p => p.id === selectedPart)?.type]?.name || selectedPart}
                </h5>
                {(() => {
                  const part = parts.find(p => p.id === selectedPart)
                  if (!part) return null
                  return (
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Dimensions:</span> {part.w} × {part.h} × {part.d} mm</p>
                      <p><span className="font-medium">Position:</span> X:{part.x}, Y:{part.y}, Z:{part.z}</p>
                      <p><span className="font-medium">Type:</span> {part.type}</p>
                      {part.holes && part.holes.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="font-medium text-orange-600">Boreholes: {part.holes.length}</p>
                          <div className="mt-1 max-h-24 overflow-y-auto text-xs">
                            {part.holes.map((hole, idx) => (
                              <div key={idx} className="flex gap-2 text-gray-500">
                                <span>#{idx + 1}</span>
                                <span>X:{hole.x?.toFixed(0) || 0}</span>
                                <span>Y:{hole.y?.toFixed(0) || 0}</span>
                                <span>D:{hole.depth || 12}mm</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
                <p className="mt-3 text-xs text-gray-500">
                  Scan this QR code to track this part through production
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {order.design && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Design Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Design Name</p>
              <p className="font-medium text-gray-800">{order.design.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Dimensions</p>
              <p className="font-medium text-gray-800">{order.design.width} × {order.design.height} × {order.design.depth} mm</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Material</p>
              <p className="font-medium text-gray-800">{order.design.material}</p>
            </div>
          </div>
        </div>
      )}

      {order.jobs && order.jobs.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Production Jobs</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Job ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Station</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Panels</th>
                </tr>
              </thead>
              <tbody>
                {order.jobs.map((job) => (
                  <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{job.id}</td>
                    <td className="py-3 px-4 text-gray-600">{job.station?.name || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        job.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        job.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{job.panels?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>
      )}

      {/* Trace History Tab */}
      {activeTab === 'trace' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Production Trace History</h3>
          {loadingTrace ? (
            <div className="text-center py-8 text-gray-500">Loading trace history...</div>
          ) : trackingHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock size={48} className="mx-auto mb-2 opacity-50" />
              <p>No tracking history available for this order.</p>
              <p className="text-sm mt-2">Parts will appear here once they enter production.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Part</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Station</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Operator</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {trackingHistory.flatMap((partData) => 
                    partData.history.map((event, idx) => (
                      <tr key={`${partData.partId}-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium text-gray-800">{partData.partName}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            event.station === 'complete' ? 'bg-emerald-100 text-emerald-700' :
                            event.station === 'packaging' ? 'bg-purple-100 text-purple-700' :
                            event.station === 'banding' ? 'bg-green-100 text-green-700' :
                            event.station === 'cnc' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {event.station === 'wallsaw' ? 'Wall Saw' :
                             event.station === 'cnc' ? 'CNC' :
                             event.station === 'banding' ? 'Banding' :
                             event.station === 'packaging' ? 'Packaging' :
                             event.station === 'complete' ? 'Complete' :
                             event.station}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-600">{event.scannedByName || 'System'}</td>
                        <td className="py-2 px-3 text-gray-500 text-xs">{new Date(event.scanTime).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Success/Info Modal */}
      {successModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className={`p-4 ${successModal.title === 'Error' ? 'bg-red-600' : 'bg-green-600'} text-white`}>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {successModal.title === 'Error' ? (
                  <AlertTriangle size={20} />
                ) : (
                  <CheckCircle size={20} />
                )}
                {successModal.title}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700">{successModal.message}</p>
            </div>
            <div className="p-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSuccessModal({ show: false, title: '', message: '' })}
                className={`px-6 py-2 ${successModal.title === 'Error' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Production Plan Modal */}
      {showProductionPlan && (
        <PartProductionPlan
          part={{
            id: showProductionPlan.id,
            name: CABINET_PARTS[showProductionPlan.type]?.name || showProductionPlan.type,
            width: showProductionPlan.w,
            height: showProductionPlan.h,
            depth: showProductionPlan.d,
            thickness: showProductionPlan.d,
            material: showProductionPlan.material || 'MDF 18mm',
            color: showProductionPlan.color,
            partType: showProductionPlan.type,
            drilling: showProductionPlan.drilling || []
          }}
          onClose={() => setShowProductionPlan(null)}
        />
      )}
    </div>
  )
}

export default OrderDetail
