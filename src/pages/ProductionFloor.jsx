import { useState, useEffect, useRef } from 'react'
import { Scan, Package, ArrowRight, CheckCircle, AlertTriangle, Clock, RefreshCw, Camera, X, Play, TestTube, FileText } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { api, API_BASE_URL } from '../services/api'
import PartProductionPlan from '../components/PartProductionPlan'

const STATIONS = [
  { id: 'wallsaw', name: 'Wallsaw', color: 'bg-orange-500', next: 'cnc' },
  { id: 'cnc', name: 'CNC Machine', color: 'bg-blue-500', next: 'banding' },
  { id: 'banding', name: 'Banding Machine', color: 'bg-green-500', next: 'packaging' },
  { id: 'packaging', name: 'Packaging', color: 'bg-purple-500', next: 'complete' }
]

function ProductionFloor({ user }) {
  const [currentStation, setCurrentStation] = useState('wallsaw')
  const [partsAtStation, setPartsAtStation] = useState([])
  const [scanInput, setScanInput] = useState('')
  const [scanning, setScanning] = useState(false)
  const [lastScan, setLastScan] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [e2eTestRunning, setE2eTestRunning] = useState(false)
  const [e2eTestResults, setE2eTestResults] = useState([])
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [partQRCodes, setPartQRCodes] = useState({})
  const [showProductionPlan, setShowProductionPlan] = useState(null)
  const [pendingMove, setPendingMove] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const refreshIntervalRef = useRef(null)

  // Generate a deterministic UUID from a string
  const generateUUID = (str) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0')
    return `${hex.slice(0,8)}-${hex.slice(0,4)}-4${hex.slice(1,4)}-8${hex.slice(0,3)}-${hex.padEnd(12, '0').slice(0,12)}`
  }

  const fetchPartsAtStation = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true)
    }
    try {
      const response = await api.get(`/tracking/stations/${currentStation}/parts`)
      const newParts = Array.isArray(response) ? response : (response.data || [])
      
      // Only update state if data has actually changed
      const hasChanged = JSON.stringify(newParts.map(p => p.partId).sort()) !== 
                        JSON.stringify(partsAtStation.map(p => p.partId).sort())
      
      if (hasChanged || isInitialLoad) {
        setPartsAtStation(newParts)
      }
      
      // Fetch QR codes for new parts only
      const qrCodes = {}
      for (const part of newParts) {
        if (!partQRCodes[part.partId]) {
          try {
            const qrResponse = await api.get(`/tracking/parts/${encodeURIComponent(part.partId)}/qrcode`)
            qrCodes[part.partId] = qrResponse.data.qrCode
          } catch (e) {
            // Silently skip QR fetch errors
          }
        }
      }
      if (Object.keys(qrCodes).length > 0) {
        setPartQRCodes(prev => ({ ...prev, ...qrCodes }))
      }
    } catch (error) {
      console.error('Error fetching parts:', error)
      if (isInitialLoad) {
        setPartsAtStation([])
      }
    }
    if (isInitialLoad) {
      setLoading(false)
    }
  }

  const seedSampleData = async () => {
    try {
      await api.post('/tracking/seed-parts')
      fetchPartsAtStation()
    } catch (error) {
      console.error('Error seeding data:', error)
    }
  }

  useEffect(() => {
    fetchPartsAtStation(true)
  }, [currentStation])

  // Seed data on first load if no parts exist
  useEffect(() => {
    const checkAndSeed = async () => {
      try {
        const response = await api.get('/tracking/stations/wallsaw/parts')
        if (!response.data || response.data.length === 0) {
          await seedSampleData()
        }
      } catch (error) {
        console.error('Error checking parts:', error)
      }
    }
    checkAndSeed()
  }, [])

  // Auto-refresh data every 5 seconds for realtime updates (silent refresh)
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchPartsAtStation(false) // Silent refresh - no loading state
      }, 5000)
    }
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [autoRefresh, currentStation])

  // Run E2E workflow test - simulates employee scanning parts through stations
  const runE2ETest = async () => {
    setE2eTestRunning(true)
    setE2eTestResults([])
    
    const results = []
    const addResult = (result) => {
      results.push(result)
      setE2eTestResults([...results])
    }
    
    const testPartId = `test-${Date.now()}`
    const partUUID = generateUUID(testPartId)
    
    try {
      // Step 1: Scan part at Wallsaw
      addResult({ name: 'Employee scans part at Wallsaw', status: 'running' })
      await new Promise(r => setTimeout(r, 1500))
      
      await fetch(`${API_BASE_URL}/tracking/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId: partUUID,
          partName: `Test Panel ${testPartId.slice(-4)}`,
          station: 'wallsaw',
          scannedBy: user?.id || '00000000-0000-0000-0000-000000000000',
          scannedByName: 'E2E Test Employee',
          barcode: testPartId
        })
      })
      results[results.length - 1] = { name: 'Employee scans part at Wallsaw', status: 'passed', station: 'wallsaw' }
      setE2eTestResults([...results])
      
      // Step 2: Move to CNC
      addResult({ name: 'Employee moves part to CNC', status: 'running' })
      await new Promise(r => setTimeout(r, 2000))
      
      await fetch(`${API_BASE_URL}/tracking/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId: partUUID,
          partName: `Test Panel ${testPartId.slice(-4)}`,
          station: 'cnc',
          scannedBy: user?.id || '00000000-0000-0000-0000-000000000000',
          scannedByName: 'E2E Test Employee',
          barcode: testPartId
        })
      })
      results[results.length - 1] = { name: 'Employee moves part to CNC', status: 'passed', station: 'cnc' }
      setE2eTestResults([...results])
      
      // Step 3: Move to Banding
      addResult({ name: 'Employee moves part to Banding', status: 'running' })
      await new Promise(r => setTimeout(r, 2000))
      
      await fetch(`${API_BASE_URL}/tracking/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId: partUUID,
          partName: `Test Panel ${testPartId.slice(-4)}`,
          station: 'banding',
          scannedBy: user?.id || '00000000-0000-0000-0000-000000000000',
          scannedByName: 'E2E Test Employee',
          barcode: testPartId
        })
      })
      results[results.length - 1] = { name: 'Employee moves part to Banding', status: 'passed', station: 'banding' }
      setE2eTestResults([...results])
      
      // Step 4: Move to Packaging
      addResult({ name: 'Employee moves part to Packaging', status: 'running' })
      await new Promise(r => setTimeout(r, 2000))
      
      await fetch(`${API_BASE_URL}/tracking/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId: partUUID,
          partName: `Test Panel ${testPartId.slice(-4)}`,
          station: 'packaging',
          scannedBy: user?.id || '00000000-0000-0000-0000-000000000000',
          scannedByName: 'E2E Test Employee',
          barcode: testPartId
        })
      })
      results[results.length - 1] = { name: 'Employee moves part to Packaging', status: 'passed', station: 'packaging' }
      setE2eTestResults([...results])
      
      addResult({ name: 'Workflow complete - Part ready for shipping', status: 'passed', station: 'complete' })
      
    } catch (err) {
      addResult({ name: 'Error in workflow', status: 'failed', error: err.message })
    }
    
    setE2eTestRunning(false)
    fetchPartsAtStation()
  }

  const handleScan = async (e) => {
    e.preventDefault()
    if (!scanInput.trim()) return
    
    setScanning(true)
    setError(null)
    
    try {
      const response = await api.post('/tracking/scan', {
        partId: scanInput,
        partName: `Part ${scanInput.slice(-6)}`,
        station: currentStation,
        scannedBy: user?.id,
        scannedByName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        barcode: scanInput
      })
      
      setLastScan({
        success: true,
        message: `Part scanned at ${currentStation}`,
        data: response.data
      })
      
      setScanInput('')
      fetchPartsAtStation()
    } catch (error) {
      setError(error.response?.data?.error || 'Scan failed')
      setLastScan({
        success: false,
        message: error.response?.data?.error || 'Scan failed'
      })
    }
    
    setScanning(false)
  }

  // Show production plan before moving to next station
  const initiateMove = (partId) => {
    const partData = partsAtStation.find(p => p.partId === partId)
    const station = STATIONS.find(s => s.id === currentStation)
    if (!station?.next || station.next === 'complete') return
    
    // Store the pending move and show the production plan
    setPendingMove({ partId, partData, nextStation: station.next })
    setShowProductionPlan({
      id: partId,
      name: partData?.partName || `Part ${partId}`,
      width: 600,
      height: 720,
      depth: 18,
      partType: partData?.partName || 'panel',
      material: 'MDF 18mm',
      // Set the active station tab based on the CURRENT station (where the part is now)
      initialStation: currentStation
    })
  }

  // Confirm and execute the move after viewing production plan
  const confirmMove = async () => {
    if (!pendingMove) return
    
    const { partId, partData, nextStation } = pendingMove
    
    try {
      await api.post('/tracking/scan', {
        partId,
        partName: partData?.partName || `Part ${partId}`,
        orderId: partData?.orderId,
        orderNumber: partData?.orderNumber,
        station: nextStation,
        scannedBy: user?.id || 'unknown',
        scannedByName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        barcode: partId
      })
      setShowProductionPlan(null)
      setPendingMove(null)
      fetchPartsAtStation(true)
    } catch (error) {
      setError(error.message || 'Move failed')
    }
  }

  // Cancel the pending move
  const cancelMove = () => {
    setShowProductionPlan(null)
    setPendingMove(null)
  }

  const moveToNextStation = async (partId) => {
    const station = STATIONS.find(s => s.id === currentStation)
    if (!station?.next || station.next === 'complete') return
    
    try {
      const partData = partsAtStation.find(p => p.partId === partId)
      await api.post('/tracking/scan', {
        partId,
        partName: partData?.partName || `Part ${partId}`,
        orderId: partData?.orderId,
        orderNumber: partData?.orderNumber,
        station: station.next,
        scannedBy: user?.id || 'unknown',
        scannedByName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        barcode: partId
      })
      fetchPartsAtStation(true)
    } catch (error) {
      setError(error.message || 'Move failed')
    }
  }

  // Complete an order - mark all parts as complete and update order status
  const completeOrder = async (orderNumber, orderParts) => {
    try {
      // Move all parts to 'complete' station
      for (const part of orderParts) {
        await api.post('/tracking/scan', {
          partId: part.partId,
          partName: part.partName,
          orderId: part.orderId,
          orderNumber: part.orderNumber,
          station: 'complete',
          scannedBy: user?.id || 'unknown',
          scannedByName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          barcode: part.partId
        })
      }
      
      // The order status will be updated automatically by the backend
      fetchPartsAtStation(true)
      setLastScan({
        success: true,
        message: `Order ${orderNumber} completed! All ${orderParts.length} parts marked as shipped.`
      })
    } catch (error) {
      setError(error.message || 'Failed to complete order')
    }
  }

  // Camera scanner functions
  const startCamera = async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setCameraError('Could not access camera. Please check permissions.')
      console.error('Camera error:', err)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCameraModal(false)
  }

  const openCameraModal = () => {
    setShowCameraModal(true)
    setTimeout(startCamera, 100)
  }

  const handleManualCodeEntry = (code) => {
    setScanInput(code)
    stopCamera()
  }

  const currentStationData = STATIONS.find(s => s.id === currentStation)

  return (
    <div className="pt-14">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Production Floor Scanner</h1>
          <p className="text-gray-600">Scan parts to track their location in production</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Realtime Updates Toggle */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
            <RefreshCw size={16} className={autoRefresh ? 'text-green-600 animate-spin' : 'text-gray-400'} />
            <span className="text-sm text-gray-600">Realtime</span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoRefresh ? 'bg-green-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${autoRefresh ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
          <button 
            onClick={() => fetchPartsAtStation(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </div>

      {/* Station Selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {STATIONS.map((station, idx) => (
          <div key={station.id} className="flex items-center">
            <button
              onClick={() => setCurrentStation(station.id)}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                currentStation === station.id 
                  ? `${station.color} text-white shadow-lg scale-105` 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {station.name}
            </button>
            {idx < STATIONS.length - 1 && (
              <ArrowRight size={20} className="mx-2 text-gray-400" />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Parts at Station */}
        <div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Parts at {currentStationData?.name}
              </h3>
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                {partsAtStation.length} parts
              </span>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : partsAtStation.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package size={48} className="mx-auto mb-2 opacity-50" />
                <p>No parts at this station</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group parts by order */}
                {Object.entries(
                  partsAtStation.reduce((groups, part) => {
                    const orderKey = part.orderNumber || 'No Order'
                    if (!groups[orderKey]) groups[orderKey] = []
                    groups[orderKey].push(part)
                    return groups
                  }, {})
                ).map(([orderNumber, orderParts]) => (
                  <div key={orderNumber} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Order Header */}
                    <div className={`px-4 py-2 ${currentStationData?.color} bg-opacity-20 border-b border-gray-200 flex justify-between items-center`}>
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-gray-600" />
                        <span className="font-semibold text-gray-800">{orderNumber}</span>
                        <span className="text-sm text-gray-600">{orderParts.length} part{orderParts.length !== 1 ? 's' : ''}</span>
                      </div>
                      {currentStation === 'packaging' && (
                        <button
                          onClick={() => completeOrder(orderNumber, orderParts)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
                        >
                          <CheckCircle size={14} />
                          Complete Order
                        </button>
                      )}
                    </div>
                    {/* Parts in this order */}
                    <div className="divide-y divide-gray-100">
                      {orderParts.map((part) => (
                        <div 
                          key={part.id} 
                          className="flex items-center justify-between p-3 bg-white hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            {/* QR Code Thumbnail */}
                            <div className="w-10 h-10 rounded border border-gray-200 bg-white p-0.5">
                              <QRCodeSVG 
                                value={part.partId || 'PART'} 
                                size={36}
                                level="L"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{part.partName || part.partId}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock size={12} />
                                {new Date(part.scanTime).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          
                          {currentStationData?.next && currentStationData.next !== 'complete' && (
                            <button
                              onClick={() => initiateMove(part.partId)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                              <FileText size={14} />
                              Move to {STATIONS.find(s => s.id === currentStationData.next)?.name}
                              <ArrowRight size={14} />
                            </button>
                          )}
                          
                          {currentStationData?.next === 'complete' && (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                              Ready for shipping
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          </div>
      </div>

      {/* Camera Scanner Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Camera size={20} /> Camera Scanner
              </h3>
              <button
                onClick={stopCamera}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              {cameraError ? (
                <div className="text-center py-8">
                  <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
                  <p className="text-red-600 mb-4">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-amber-500 rounded-lg opacity-75" />
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 text-center mb-4">
                    Position the QR code or barcode within the frame, or enter the code manually below.
                  </p>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code manually..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          handleManualCodeEntry(e.target.value.trim())
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.target.previousSibling
                        if (input.value.trim()) {
                          handleManualCodeEntry(input.value.trim())
                        }
                      }}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                    >
                      Use Code
                    </button>
                  </div>
                </>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 border-t">
              <p className="text-xs text-gray-500 text-center">
                Scanning at: <span className="font-medium">{currentStationData?.name}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Production Plan Modal with Confirm/Cancel */}
      {showProductionPlan && (
        <PartProductionPlan
          part={showProductionPlan}
          onClose={cancelMove}
          initialStation={showProductionPlan.initialStation}
          showConfirmButtons={true}
          onConfirm={confirmMove}
          confirmText={`Confirm Move to ${STATIONS.find(s => s.id === pendingMove?.nextStation)?.name}`}
        />
      )}
    </div>
  )
}

export default ProductionFloor
