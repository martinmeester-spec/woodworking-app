import { useState, useEffect, useRef } from 'react'
import { QrCode, Camera, CheckCircle, ArrowRight, Package, Clock, AlertCircle, Wifi, WifiOff, RefreshCw, MapPin, Layers, LogOut, ChevronDown } from 'lucide-react'
import { api } from '../services/api'

export default function MobileScanner({ onLogout, user }) {
  const [scannedCode, setScannedCode] = useState('')
  const [partInfo, setPartInfo] = useState(null)
  const [stations, setStations] = useState([])
  const [selectedStation, setSelectedStation] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [checkedInParts, setCheckedInParts] = useState({}) // Track parts checked into each station
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    loadStations()
    // Delay camera start to ensure component is mounted
    const cameraTimer = setTimeout(() => {
      startCamera()
    }, 500)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      clearTimeout(cameraTimer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      stopCamera()
    }
  }, [])

  const loadStations = async () => {
    try {
      const data = await api.get('/production/stations')
      const stationList = Array.isArray(data) ? data : data.data || [
        { id: '1', name: 'Wall Saw' },
        { id: '2', name: 'CNC' },
        { id: '3', name: 'Edge Banding' },
        { id: '4', name: 'Packaging' }
      ]
      setStations(stationList)
      if (stationList.length > 0 && !selectedStation) {
        setSelectedStation(stationList[0].id)
      }
    } catch (error) {
      console.error('Error loading stations:', error)
      const defaultStations = [
        { id: '1', name: 'Wall Saw' },
        { id: '2', name: 'CNC' },
        { id: '3', name: 'Edge Banding' },
        { id: '4', name: 'Packaging' }
      ]
      setStations(defaultStations)
      setSelectedStation(defaultStations[0].id)
    }
  }

  const startCamera = async () => {
    try {
      // Check if we're on HTTPS (required for camera on mobile)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setCameraError('Camera requires HTTPS. Use manual input below.')
        setCameraActive(false)
        return
      }
      
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera not supported in this browser. Use manual input.')
        setCameraActive(false)
        return
      }
      
      // Try environment camera first (back camera on mobile), fall back to any camera
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        })
      } catch (envError) {
        console.log('Environment camera failed, trying any camera:', envError)
        // Fall back to any available camera
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          })
        } catch (fallbackError) {
          throw fallbackError
        }
      }
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Wait for video to be ready before playing
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play()
            setCameraActive(true)
            setCameraError('')
          } catch (playError) {
            console.error('Video play error:', playError)
            setCameraError('Could not start video. Tap to retry.')
          }
        }
      } else {
        setCameraActive(true)
        setCameraError('')
      }
    } catch (error) {
      console.error('Camera error:', error)
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings.')
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setCameraError('No camera found. Use manual input below.')
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setCameraError('Camera is in use by another app. Close other apps and retry.')
      } else {
        setCameraError(`Camera error: ${error.message || 'Unknown error'}. Use manual input.`)
      }
      setCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const lookupPart = async (code) => {
    if (!code.trim()) {
      setMessage({ type: 'error', text: 'Please enter or scan a part code' })
      return
    }
    
    setLoading(true)
    setMessage({ type: '', text: '' })
    
    try {
      // Try to find the part from production orders
      const orders = await api.get('/production/orders')
      const ordersList = Array.isArray(orders) ? orders : orders.data || []
      
      // Find matching order or part
      const matchingOrder = ordersList.find(o => 
        o.orderNumber?.includes(code) || o.id?.includes(code)
      )
      
      if (matchingOrder) {
        // Get part plan from the order
        const partPlan = {
          id: code,
          partNumber: code,
          orderNumber: matchingOrder.orderNumber,
          customerName: matchingOrder.customerName,
          designName: matchingOrder.design?.name || 'Cabinet Design',
          material: 'MDF 18mm',
          dimensions: '600 x 400 x 18 mm',
          currentStation: getCurrentStation(matchingOrder.status),
          status: matchingOrder.status,
          totalPanels: matchingOrder.totalPanels,
          completedPanels: matchingOrder.completedPanels,
          workflow: [
            { station: 'Wall Saw', status: getWorkflowStatus(matchingOrder.status, 'Cutting'), sequence: 1 },
            { station: 'CNC', status: getWorkflowStatus(matchingOrder.status, 'Drilling'), sequence: 2 },
            { station: 'Edge Banding', status: getWorkflowStatus(matchingOrder.status, 'Edge Banding'), sequence: 3 },
            { station: 'Packaging', status: getWorkflowStatus(matchingOrder.status, 'Assembly'), sequence: 4 }
          ]
        }
        setPartInfo(partPlan)
        setMessage({ type: 'success', text: 'Part found!' })
      } else {
        // Create demo part info
        setPartInfo({
          id: code,
          partNumber: code,
          orderNumber: 'ORD-DEMO',
          customerName: 'Demo Customer',
          designName: 'Demo Cabinet',
          material: 'MDF 18mm',
          dimensions: '600 x 400 x 18 mm',
          currentStation: 'Wall Saw',
          status: 'In Progress',
          totalPanels: 10,
          completedPanels: 3,
          workflow: [
            { station: 'Wall Saw', status: 'completed', sequence: 1 },
            { station: 'CNC', status: 'current', sequence: 2 },
            { station: 'Edge Banding', status: 'pending', sequence: 3 },
            { station: 'Packaging', status: 'pending', sequence: 4 }
          ]
        })
        setMessage({ type: 'info', text: 'Demo part loaded' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error looking up part: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  const getCurrentStation = (status) => {
    const stationMap = {
      'Pending': 'Not Started',
      'Cutting': 'Wall Saw',
      'Drilling': 'CNC',
      'Edge Banding': 'Edge Banding',
      'Assembly': 'Packaging',
      'Completed': 'Completed'
    }
    return stationMap[status] || status
  }

  const getWorkflowStatus = (orderStatus, stageStatus) => {
    const stages = ['Pending', 'Cutting', 'Drilling', 'Edge Banding', 'Assembly', 'Completed']
    const currentIndex = stages.indexOf(orderStatus)
    const stageIndex = stages.indexOf(stageStatus)
    
    if (currentIndex > stageIndex) return 'completed'
    if (currentIndex === stageIndex) return 'current'
    return 'pending'
  }

  const getStationColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'current': return 'bg-amber-500 animate-pulse'
      default: return 'bg-gray-400'
    }
  }

  const clearScan = () => {
    setPartInfo(null)
    setScannedCode('')
    setMessage({ type: '', text: '' })
  }

  // Handle scan with check-in/check-out logic
  const handleScan = async (code) => {
    if (!code.trim() || !selectedStation) {
      setMessage({ type: 'error', text: 'Please select a station and enter a part code' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // Parse part code - format can be "ORD-xxx-parttype" or just "ORD-xxx"
      const codeParts = code.split('-')
      const orderNumber = codeParts.length >= 2 ? `${codeParts[0]}-${codeParts[1]}` : code
      const partType = codeParts.length >= 3 ? codeParts.slice(2).join('-') : null
      
      // Get part info
      const orders = await api.get('/production/orders')
      const ordersList = Array.isArray(orders) ? orders : orders.data || []
      
      const matchingOrder = ordersList.find(o => 
        o.orderNumber === orderNumber || o.orderNumber?.includes(code) || o.id?.includes(code)
      )

      const currentStationObj = stations.find(s => s.id === selectedStation)
      const stationIndex = stations.findIndex(s => s.id === selectedStation)
      const expectedStation = getExpectedStation(matchingOrder?.status)

      // Check if part is at the correct station
      if (matchingOrder && currentStationObj?.name !== expectedStation) {
        setMessage({ 
          type: 'error', 
          text: `❌ Wrong station! Part should be at "${expectedStation}", not "${currentStationObj?.name}"` 
        })
        setPartInfo({
          id: code,
          partNumber: code,
          orderNumber: matchingOrder.orderNumber,
          currentStation: expectedStation,
          status: 'Wrong Station',
          error: true
        })
        setLoading(false)
        return
      }

      // Check if part is already checked in at this station
      const partKey = `${code}-${selectedStation}`
      const isCheckedIn = checkedInParts[partKey]

      if (isCheckedIn) {
        // Second scan - CHECK OUT and move to next station
        const nextStationIndex = stationIndex + 1
        const nextStation = stations[nextStationIndex]
        
        // Update order status to next stage
        if (matchingOrder) {
          const nextStatus = getNextStatus(matchingOrder.status)
          await api.put(`/production/orders/${matchingOrder.id}`, { status: nextStatus })
        }

        // Remove from checked-in parts
        setCheckedInParts(prev => {
          const updated = { ...prev }
          delete updated[partKey]
          return updated
        })

        setMessage({ 
          type: 'success', 
          text: `✅ Checked OUT from ${currentStationObj?.name}. Moving to ${nextStation?.name || 'Completed'}!` 
        })

        setPartInfo({
          id: code,
          partNumber: code,
          orderNumber: matchingOrder?.orderNumber || 'N/A',
          currentStation: nextStation?.name || 'Completed',
          status: 'Checked Out',
          checkedOut: true
        })
      } else {
        // First scan - CHECK IN
        setCheckedInParts(prev => ({
          ...prev,
          [partKey]: { timestamp: new Date().toISOString(), code }
        }))

        setMessage({ 
          type: 'success', 
          text: `✅ Checked IN to ${currentStationObj?.name}. Scan again when done to check out.` 
        })

        setPartInfo({
          id: code,
          partNumber: code,
          partType: partType || 'Panel',
          orderNumber: matchingOrder?.orderNumber || 'N/A',
          customerName: matchingOrder?.customerName || 'N/A',
          currentStation: currentStationObj?.name,
          status: 'Checked In',
          checkedIn: true,
          totalPanels: matchingOrder?.totalPanels || 0,
          completedPanels: matchingOrder?.completedPanels || 0
        })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error processing scan: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  const getExpectedStation = (status) => {
    const stationMap = {
      'Pending': 'Wall Saw',
      'Cutting': 'Wall Saw',
      'Drilling': 'CNC',
      'Edge Banding': 'Edge Banding',
      'Assembly': 'Packaging',
      'Completed': 'Completed'
    }
    return stationMap[status] || 'Wall Saw'
  }

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'Pending': 'Cutting',
      'Cutting': 'Drilling',
      'Drilling': 'Edge Banding',
      'Edge Banding': 'Assembly',
      'Assembly': 'Completed'
    }
    return statusFlow[currentStatus] || 'Completed'
  }

  const currentStation = stations.find(s => s.id === selectedStation)

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col pt-0">
      {/* Header with Station Selector - fixed at top */}
      <div className="bg-amber-600 px-3 py-2 shrink-0 sticky top-0 z-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <QrCode size={20} />
            <span className="font-bold text-sm">Scanner</span>
          </div>
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi size={16} className="text-green-300" />
            ) : (
              <WifiOff size={16} className="text-red-300" />
            )}
            {user && (
              <span className="text-xs text-amber-100">{user.firstName}</span>
            )}
            {onLogout && (
              <button onClick={onLogout} className="p-1 hover:bg-amber-700 rounded">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
        
        </div>

      {/* TOP HALF: Camera View or Manual Input */}
      <div className="flex-1 bg-black relative min-h-0" style={{ maxHeight: '50vh' }}>
        {cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 p-4">
            <QrCode size={48} className="text-amber-500 mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">Scan Part Code</h3>
            <p className="text-gray-400 text-center text-sm mb-4">
              {cameraError || 'Enter part code manually or enable camera'}
            </p>
            
            {/* Prominent manual input */}
            <div className="w-full max-w-sm space-y-3">
              <input
                type="text"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan(scannedCode)}
                placeholder="Enter part code (e.g., ORD-202401-0001-P1)"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-lg"
                autoFocus
              />
              <button
                onClick={() => handleScan(scannedCode)}
                disabled={loading || !scannedCode}
                className="w-full px-4 py-3 bg-amber-600 text-white rounded-lg disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw size={20} className="animate-spin" /> : <QrCode size={20} />}
                {loading ? 'Looking up...' : 'Look Up Part'}
              </button>
            </div>
            
            <button
              onClick={startCamera}
              className="mt-4 px-4 py-2 text-gray-400 hover:text-white text-sm flex items-center gap-2"
            >
              <Camera size={16} />
              Try Camera Instead
            </button>
          </div>
        )}
        
        {/* Scan overlay - only show when camera is active */}
        {cameraActive && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 border-4 border-amber-500 rounded-xl opacity-70" />
            </div>
            
            {/* Manual input overlay when camera is active */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  placeholder="Or enter part code..."
                  className="flex-1 px-3 py-2 bg-gray-800/90 border border-gray-600 rounded-lg text-white"
                />
                <button
                  onClick={() => handleScan(scannedCode)}
                  disabled={loading || !scannedCode}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={20} className="animate-spin" /> : 'Scan'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* BOTTOM HALF: Part Information */}
      <div className="flex-1 overflow-y-auto bg-gray-900 min-h-0" style={{ maxHeight: '50vh' }}>
        {/* Message */}
        {message.text && (
          <div className={`mx-3 mt-3 p-3 rounded-lg flex items-center gap-2 text-sm ${
            message.type === 'success' ? 'bg-green-500/20 text-green-400' :
            message.type === 'info' ? 'bg-blue-500/20 text-blue-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : 
             message.type === 'info' ? <Package size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        {partInfo ? (
          <div className="p-3 space-y-3">
            {/* Part Header */}
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl font-bold text-amber-400">{partInfo.partNumber}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  partInfo.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                  partInfo.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {partInfo.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Order</p>
                  <p className="font-medium">{partInfo.orderNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Customer</p>
                  <p className="font-medium">{partInfo.customerName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Design</p>
                  <p className="font-medium">{partInfo.designName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Material</p>
                  <p className="font-medium">{partInfo.material}</p>
                </div>
              </div>
            </div>

            {/* Current Station */}
            <div className="bg-amber-600/20 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <MapPin size={24} className="text-amber-400" />
                <div>
                  <p className="text-xs text-amber-300">Current Station</p>
                  <p className="text-xl font-bold text-amber-400">{partInfo.currentStation}</p>
                </div>
              </div>
            </div>

            {/* Production Workflow */}
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-2">
                <Layers size={14} />
                Production Workflow
              </p>
              <div className="space-y-2">
                {partInfo.workflow.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getStationColor(step.status)}`}>
                      {step.status === 'completed' ? (
                        <CheckCircle size={16} />
                      ) : step.status === 'current' ? (
                        <ArrowRight size={16} />
                      ) : (
                        <span className="text-xs">{step.sequence}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${step.status === 'current' ? 'text-amber-400' : step.status === 'completed' ? 'text-green-400' : 'text-gray-500'}`}>
                        {step.station}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      step.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      step.status === 'current' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-gray-700 text-gray-500'
                    }`}>
                      {step.status === 'completed' ? 'Done' : step.status === 'current' ? 'Active' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress */}
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Panel Progress</span>
                <span className="text-amber-400">{partInfo.completedPanels} / {partInfo.totalPanels}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-amber-500 h-2 rounded-full transition-all"
                  style={{ width: `${(partInfo.completedPanels / partInfo.totalPanels) * 100}%` }}
                />
              </div>
            </div>

            {/* Clear Button */}
            <button
              onClick={clearScan}
              className="w-full py-3 bg-gray-800 text-gray-400 rounded-xl"
            >
              Clear & Scan New Part
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <QrCode size={48} className="text-gray-600 mb-4" />
            <p className="text-gray-500 mb-2">No part scanned</p>
            <p className="text-gray-600 text-sm">Point camera at QR code or enter part number above</p>
          </div>
        )}
      </div>

      {/* BOTTOM: Station Selection Buttons - responsive grid */}
      <div className="bg-gray-800 px-2 sm:px-4 py-3 sm:py-4 shrink-0 border-t border-gray-700">
        <p className="text-xs sm:text-sm text-gray-400 text-center mb-2 sm:mb-3">Select Your Station</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <button
            onClick={() => setSelectedStation('1')}
            className={`py-3 sm:py-5 px-2 sm:px-3 rounded-xl font-bold text-sm sm:text-base transition-all ${
              selectedStation === '1' 
                ? 'bg-amber-500 text-white shadow-lg' 
                : 'bg-gray-600 text-white hover:bg-gray-500'
            }`}
          >
            Wall Saw
          </button>
          <button
            onClick={() => setSelectedStation('2')}
            className={`py-3 sm:py-5 px-2 sm:px-3 rounded-xl font-bold text-sm sm:text-base transition-all ${
              selectedStation === '2' 
                ? 'bg-amber-500 text-white shadow-lg' 
                : 'bg-gray-600 text-white hover:bg-gray-500'
            }`}
          >
            CNC
          </button>
          <button
            onClick={() => setSelectedStation('3')}
            className={`py-3 sm:py-5 px-2 sm:px-3 rounded-xl font-bold text-sm sm:text-base transition-all ${
              selectedStation === '3' 
                ? 'bg-amber-500 text-white shadow-lg' 
                : 'bg-gray-600 text-white hover:bg-gray-500'
            }`}
          >
            Banding
          </button>
          <button
            onClick={() => setSelectedStation('4')}
            className={`py-3 sm:py-5 px-2 sm:px-3 rounded-xl font-bold text-sm sm:text-base transition-all ${
              selectedStation === '4' 
                ? 'bg-amber-500 text-white shadow-lg' 
                : 'bg-gray-600 text-white hover:bg-gray-500'
            }`}
          >
            Packaging
          </button>
        </div>
      </div>
    </div>
  )
}
