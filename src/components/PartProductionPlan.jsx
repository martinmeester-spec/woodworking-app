import { useState, useEffect } from 'react'
import { 
  X, Layers, Box, Scissors, Package, ChevronRight, 
  Play, Clock, AlertTriangle, CheckCircle, Code,
  Grid, Ruler, RotateCcw, Save, Edit2, Plus, Trash2
} from 'lucide-react'
import api from '../services/api'

function PartProductionPlan({ part, onClose, initialStation, showConfirmButtons, onConfirm, confirmText, embedded }) {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeStation, setActiveStation] = useState(initialStation || 'wallsaw')
  const [slabData, setSlabData] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadPlan()
  }, [part.id])

  const loadPlan = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/production-plans/part/${part.id}`)
      setPlan(response.data)
      
      // Load slab data if available
      if (response.data.wallSawPlan?.slabId) {
        try {
          const slabResponse = await api.get(`/production-plans/slab/${response.data.wallSawPlan.slabId}`)
          setSlabData(slabResponse.data)
        } catch (e) {
          // Slab data might not exist yet
        }
      }
    } catch (error) {
      console.error('Error loading production plan:', error)
      // Create default plan structure for display
      setPlan(createDefaultDisplayPlan(part))
    } finally {
      setLoading(false)
    }
  }

  const savePlan = async () => {
    try {
      setSaving(true)
      // Use part.id or generate a unique identifier
      const partId = part.id || `part-${part.partType || part.name}-${Date.now()}`
      console.log('Saving plan for part:', partId, plan)
      
      const response = await api.post(`/production-plans/part/${encodeURIComponent(partId)}`, {
        wallSawPlan: plan.wallSawPlan,
        cncPlan: plan.cncPlan,
        bandingPlan: plan.bandingPlan,
        packagingPlan: plan.packagingPlan
      })
      console.log('Save response:', response.data)
      setHasChanges(false)
      setEditMode(false)
    } catch (error) {
      console.error('Error saving production plan:', error)
      alert(`Failed to save production plan: ${error.response?.data?.error || error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const updatePlanField = (section, field, value) => {
    setPlan(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
    setHasChanges(true)
  }

  const updateNestedField = (section, parent, field, value) => {
    setPlan(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parent]: {
          ...prev[section][parent],
          [field]: value
        }
      }
    }))
    setHasChanges(true)
  }

  const createDefaultDisplayPlan = (part) => {
    // Get the 3D dimensions of the part
    const w = parseFloat(part.width) || 600
    const h = parseFloat(part.height) || 720
    const d = parseFloat(part.depth) || parseFloat(part.thickness) || 18
    
    // For sheet goods, the cutting face is the two largest dimensions
    // The smallest dimension is the material thickness
    const dims = [w, h, d].sort((a, b) => b - a)
    const cutWidth = dims[0]
    const cutHeight = dims[1]
    const thickness = dims[2]

    // Generate a complete slab layout with all parts from a typical cabinet
    // This simulates what would happen when an order is sent to production
    const slabLayout = generateOptimalSlabLayout(part, cutWidth, cutHeight)

    return {
    wallSawPlan: {
      slabId: slabLayout.slabId,
      slabMaterial: part.material || 'MDF 18mm',
      slabWidth: 2800,
      slabHeight: 2070,
      positionX: slabLayout.currentPart.x,
      positionY: slabLayout.currentPart.y,
      partWidth: slabLayout.currentPart.width,
      partHeight: slabLayout.currentPart.height,
      cutSequence: slabLayout.currentPart.sequence,
      otherParts: slabLayout.otherParts
    },
    cncPlan: {
      programId: `CNC-${(part.id || '').substring(0, 8)}`,
      gcode: generateDefaultGCode(part),
      toolChanges: ['T1 - 6mm End Mill', 'T2 - 5mm Drill'],
      estimatedTime: 2.5,
      drillHoles: part.drilling || []
    },
    bandingPlan: {
      bandingSequence: ['top', 'bottom', 'left', 'right'],
      bandingMaterial: 'ABS 2mm',
      bandingColor: part.color || 'White',
      edges: {
        top: { band: true, order: 1 },
        bottom: { band: true, order: 2 },
        left: { band: true, order: 3 },
        right: { band: true, order: 4 }
      }
    },
    packagingPlan: {
      packageGroup: null,
      protectionType: 'Standard',
      labelPosition: 'Top',
      specialInstructions: ''
    }
  }}

  // Guillotine bin-packing algorithm for optimal slab layout
  // This algorithm places parts efficiently on a sheet using guillotine cuts
  const generateOptimalSlabLayout = (currentPart, currentCutWidth, currentCutHeight) => {
    const SLAB_WIDTH = 2800
    const SLAB_HEIGHT = 2070
    const KERF = 4 // Saw blade width
    const MARGIN = 10
    
    // Define all parts that would typically be in a cabinet order
    // These represent a realistic set of parts from one cabinet
    const allCabinetParts = [
      { id: currentPart.id, name: currentPart.name || 'Current Part', width: currentCutWidth, height: currentCutHeight, isCurrent: true },
      { id: 'left-panel', name: 'Left Panel', width: 720, height: 554 },
      { id: 'right-panel', name: 'Right Panel', width: 720, height: 554 },
      { id: 'top-panel', name: 'Top Panel', width: 564, height: 554 },
      { id: 'bottom-panel', name: 'Bottom Panel', width: 564, height: 554 },
      { id: 'back-panel', name: 'Back Panel', width: 600, height: 720 },
      { id: 'shelf-1', name: 'Shelf 1', width: 564, height: 534 },
      { id: 'shelf-2', name: 'Shelf 2', width: 564, height: 534 },
    ].filter(p => p.width > 0 && p.height > 0)
    
    // Sort parts by area (largest first) - this is key for efficient packing
    const sortedParts = [...allCabinetParts].sort((a, b) => 
      (b.width * b.height) - (a.width * a.height)
    )
    
    // Initialize free rectangles with the entire slab
    let freeRects = [{
      x: MARGIN,
      y: MARGIN,
      w: SLAB_WIDTH - 2 * MARGIN,
      h: SLAB_HEIGHT - 2 * MARGIN
    }]
    
    const placedParts = []
    let sequence = 1
    
    // Place each part using the Best Short Side Fit (BSSF) algorithm
    for (const part of sortedParts) {
      const partW = part.width + KERF
      const partH = part.height + KERF
      
      let bestRect = null
      let bestRectIndex = -1
      let bestShortSideFit = Infinity
      let bestRotated = false
      
      // Find the best free rectangle for this part
      for (let i = 0; i < freeRects.length; i++) {
        const rect = freeRects[i]
        
        // Try normal orientation
        if (rect.w >= partW && rect.h >= partH) {
          const shortSideFit = Math.min(rect.w - partW, rect.h - partH)
          if (shortSideFit < bestShortSideFit) {
            bestShortSideFit = shortSideFit
            bestRect = rect
            bestRectIndex = i
            bestRotated = false
          }
        }
        
        // Try rotated orientation
        if (rect.w >= partH && rect.h >= partW) {
          const shortSideFit = Math.min(rect.w - partH, rect.h - partW)
          if (shortSideFit < bestShortSideFit) {
            bestShortSideFit = shortSideFit
            bestRect = rect
            bestRectIndex = i
            bestRotated = true
          }
        }
      }
      
      if (bestRect) {
        const placedW = bestRotated ? partH : partW
        const placedH = bestRotated ? partW : partH
        
        placedParts.push({
          partId: part.id,
          name: part.name,
          x: bestRect.x,
          y: bestRect.y,
          width: bestRotated ? part.height : part.width,
          height: bestRotated ? part.width : part.height,
          sequence: sequence++,
          isCurrent: part.isCurrent || false,
          rotated: bestRotated
        })
        
        // Split the free rectangle (guillotine split)
        freeRects.splice(bestRectIndex, 1)
        
        // Add new free rectangles from the split
        // Right remainder
        if (bestRect.w - placedW > MARGIN) {
          freeRects.push({
            x: bestRect.x + placedW,
            y: bestRect.y,
            w: bestRect.w - placedW,
            h: placedH
          })
        }
        // Bottom remainder
        if (bestRect.h - placedH > MARGIN) {
          freeRects.push({
            x: bestRect.x,
            y: bestRect.y + placedH,
            w: bestRect.w,
            h: bestRect.h - placedH
          })
        }
        
        // Merge overlapping free rectangles (optional optimization)
        freeRects = mergeFreeRectangles(freeRects)
      }
    }
    
    // Find the current part in the placed parts
    const currentPlaced = placedParts.find(p => p.isCurrent) || placedParts[0]
    const otherParts = placedParts.filter(p => !p.isCurrent)
    
    return {
      slabId: `SLAB-${Date.now().toString(36).toUpperCase()}`,
      currentPart: {
        x: currentPlaced?.x || MARGIN,
        y: currentPlaced?.y || MARGIN,
        width: currentPlaced?.width || currentCutWidth,
        height: currentPlaced?.height || currentCutHeight,
        sequence: currentPlaced?.sequence || 1
      },
      otherParts: otherParts.map(p => ({
        partId: p.partId,
        name: p.name,
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        cutSequence: p.sequence
      })),
      efficiency: calculateSlabEfficiency(placedParts, SLAB_WIDTH, SLAB_HEIGHT)
    }
  }
  
  // Merge overlapping or adjacent free rectangles
  const mergeFreeRectangles = (rects) => {
    // Simple implementation - just return as is for now
    // A full implementation would merge adjacent rectangles
    return rects.filter(r => r.w > 10 && r.h > 10)
  }
  
  // Calculate how efficiently the slab is used
  const calculateSlabEfficiency = (placedParts, slabW, slabH) => {
    const totalPartArea = placedParts.reduce((sum, p) => sum + (p.width * p.height), 0)
    const slabArea = slabW * slabH
    return Math.round((totalPartArea / slabArea) * 100)
  }

  
  const generateDefaultGCode = (part) => {
    const w = parseFloat(part.width) || 600
    const h = parseFloat(part.height) || 720
    const d = parseFloat(part.depth) || parseFloat(part.thickness) || 18
    
    return `; Part: ${part.name || 'Unknown'}
; Dimensions: ${w} x ${h} x ${d}mm
; Generated: ${new Date().toISOString()}

G21 ; Set units to mm
G90 ; Absolute positioning
G17 ; XY plane selection

; Tool change - 6mm End Mill
T1 M6
S18000 M3 ; Spindle on

; Perimeter cut
G0 X0 Y0 Z5
G1 Z-${d} F1000
G1 X${w} F3000
G1 Y${h}
G1 X0
G1 Y0
G0 Z5

M5 ; Spindle off
G0 X0 Y0 Z50 ; Return home
M30 ; Program end`
  }

  const generateCIXCode = (part) => {
    const w = parseFloat(part.width) || 600
    const h = parseFloat(part.height) || 720
    const d = parseFloat(part.depth) || parseFloat(part.thickness) || 18
    const partName = (part.name || 'Part').replace(/[^a-zA-Z0-9]/g, '_')
    const programId = part.id ? part.id.substring(0, 8) : Date.now().toString().substring(0, 8)
    
    return `BEGIN ID CID3
  REL= 4.0
END ID

BEGIN MAINDATA
  INCH= 0
  LPX= ${w}
  LPY= ${h}
  LPZ= ${d}
  ORLST= "5"
  SIMESSION= 0
  ROTEFLAG= 0
  DRAWSIDE= 0
  MIRTEFLAG= 0
END MAINDATA

BEGIN PARTINFO
  PARTNAME= "${partName}"
  PROGRAMID= "${programId}"
  MATERIAL= "${part.material || 'MDF'}"
  THICKNESS= ${d}
  GENERATED= "${new Date().toISOString()}"
END PARTINFO

BEGIN MACRO
  NAME= PERIMETER_CUT
  PARAM,NAME= TOOL_DIA,VALUE= 6
  PARAM,NAME= DEPTH,VALUE= ${d}
  PARAM,NAME= FEED,VALUE= 3000
  PARAM,NAME= SPINDLE,VALUE= 18000
END MACRO

BEGIN ROUTING
  ID= 1
  SIDE= 0
  CRN= "1"
  Z= 0
  DP= ${d}
  DIA= 6
  RTY= rpRP
  
  BEGIN ROUTGEO
    GID= 1
    GC= 0
    DIR= dirCW
    SX= 0
    SY= 0
    EX= ${w}
    EY= 0
  END ROUTGEO
  
  BEGIN ROUTGEO
    GID= 2
    GC= 0
    DIR= dirCW
    SX= ${w}
    SY= 0
    EX= ${w}
    EY= ${h}
  END ROUTGEO
  
  BEGIN ROUTGEO
    GID= 3
    GC= 0
    DIR= dirCW
    SX= ${w}
    SY= ${h}
    EX= 0
    EY= ${h}
  END ROUTGEO
  
  BEGIN ROUTGEO
    GID= 4
    GC= 0
    DIR= dirCW
    SX= 0
    SY= ${h}
    EX= 0
    EY= 0
  END ROUTGEO
END ROUTING

BEGIN BORING
  ID= 100
  SIDE= 0
  CRN= "1"
  X= 37
  Y= 37
  Z= 0
  DP= 12
  DIA= 5
  THR= 0
  RTY= rpRP
  DIR= dirCW
END BORING

BEGIN BORING
  ID= 101
  SIDE= 0
  CRN= "1"
  X= ${w - 37}
  Y= 37
  Z= 0
  DP= 12
  DIA= 5
  THR= 0
  RTY= rpRP
  DIR= dirCW
END BORING

BEGIN BORING
  ID= 102
  SIDE= 0
  CRN= "1"
  X= 37
  Y= ${h - 37}
  Z= 0
  DP= 12
  DIA= 5
  THR= 0
  RTY= rpRP
  DIR= dirCW
END BORING

BEGIN BORING
  ID= 103
  SIDE= 0
  CRN= "1"
  X= ${w - 37}
  Y= ${h - 37}
  Z= 0
  DP= 12
  DIA= 5
  THR= 0
  RTY= rpRP
  DIR= dirCW
END BORING

END CID3`
  }

  const STATIONS = [
    { id: 'wallsaw', name: 'Wall Saw', icon: Grid, color: 'blue' },
    { id: 'cnc', name: 'CNC', icon: Code, color: 'purple' },
    { id: 'banding', name: 'Edge Banding', icon: Layers, color: 'amber' },
    { id: 'packaging', name: 'Packaging', icon: Package, color: 'green' }
  ]

  if (loading) {
    const loadingContent = (
      <div className="bg-white rounded-xl p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading production plan...</p>
      </div>
    )
    
    if (embedded) return loadingContent
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        {loadingContent}
      </div>
    )
  }

  const modalContent = (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Production Plan</h2>
            <p className="text-amber-100">{part.name || 'Part'} - {part.width}×{part.height}×{part.depth || part.thickness}mm</p>
          </div>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <button 
                  onClick={() => { setEditMode(false); loadPlan(); setHasChanges(false) }}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm flex items-center gap-1"
                >
                  Cancel
                </button>
                <button 
                  onClick={savePlan}
                  disabled={saving || !hasChanges}
                  className="px-3 py-1.5 bg-white text-amber-600 hover:bg-amber-50 rounded-lg text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button 
                onClick={() => setEditMode(true)}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm flex items-center gap-1"
              >
                <Edit2 size={16} />
                Edit Plan
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors ml-2">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Station Tabs */}
        <div className="flex border-b bg-gray-50">
          {STATIONS.map((station, index) => {
            const Icon = station.icon
            const isActive = activeStation === station.id
            return (
              <button
                key={station.id}
                onClick={() => setActiveStation(station.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 transition-colors relative ${
                  isActive 
                    ? `bg-white text-${station.color}-600 font-medium` 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive ? `bg-${station.color}-100 text-${station.color}-600` : 'bg-gray-200 text-gray-500'
                }`}>
                  {index + 1}
                </span>
                <Icon size={18} />
                <span className="hidden sm:inline">{station.name}</span>
                {index < STATIONS.length - 1 && (
                  <ChevronRight size={16} className="absolute right-0 text-gray-300" />
                )}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-auto p-6 ${showConfirmButtons ? 'pb-24' : ''}`}>
          {activeStation === 'wallsaw' && (
            <WallSawPlan 
              plan={plan?.wallSawPlan} 
              part={part} 
              slabData={slabData} 
              editMode={editMode}
              onUpdate={(field, value) => updatePlanField('wallSawPlan', field, value)}
            />
          )}
          {activeStation === 'cnc' && (
            <CNCPlan 
              plan={plan?.cncPlan} 
              part={part} 
              editMode={editMode}
              onUpdate={(field, value) => updatePlanField('cncPlan', field, value)}
              generateCIXCode={generateCIXCode}
            />
          )}
          {activeStation === 'banding' && (
            <BandingPlan 
              plan={plan?.bandingPlan} 
              part={part} 
              editMode={editMode}
              onUpdate={(field, value) => updatePlanField('bandingPlan', field, value)}
              onUpdateEdge={(edge, field, value) => updateNestedField('bandingPlan', 'edges', edge, { ...plan?.bandingPlan?.edges?.[edge], [field]: value })}
            />
          )}
          {activeStation === 'packaging' && (
            <PackagingPlan 
              plan={plan?.packagingPlan} 
              part={part} 
              editMode={editMode}
              onUpdate={(field, value) => updatePlanField('packagingPlan', field, value)}
            />
          )}
        </div>

        {/* Confirm/Cancel buttons when showConfirmButtons is true */}
        {showConfirmButtons && (
          <div className="border-t border-gray-200 bg-white p-4 flex justify-center gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
            >
              <CheckCircle size={18} />
              {confirmText || 'Confirm'}
            </button>
          </div>
        )}
      </>
  )

  // If embedded, return just the content without the modal wrapper
  if (embedded) {
    return (
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {modalContent}
      </div>
    )
  }

  // Standard modal with backdrop
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {modalContent}
      </div>
    </div>
  )
}

function WallSawPlan({ plan, part, slabData, editMode, onUpdate }) {
  if (!plan) return <div className="text-gray-500">No wall saw plan available</div>

  const SCALE = 0.25
  const slabW = plan.slabWidth * SCALE
  const slabH = plan.slabHeight * SCALE

  // Combine current part with other parts on the slab
  const allParts = [
    {
      id: part.id,
      name: part.name,
      x: plan.positionX,
      y: plan.positionY,
      width: plan.partWidth || parseFloat(part.width),
      height: plan.partHeight || parseFloat(part.height),
      isCurrent: true,
      cutSequence: plan.cutSequence
    },
    ...(plan.otherParts || []).map(p => ({ ...p, isCurrent: false }))
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Wall Saw - Slab Layout</h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Box size={16} /> {plan.slabMaterial}
          </span>
          <span className="flex items-center gap-1">
            <Ruler size={16} /> {plan.slabWidth} × {plan.slabHeight}mm
          </span>
        </div>
      </div>

      {/* Editable Fields */}
      {editMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-3">Edit Slab Settings</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-blue-700 mb-1">Material</label>
              <select
                value={plan.slabMaterial}
                onChange={(e) => onUpdate('slabMaterial', e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
              >
                <option value="MDF 18mm">MDF 18mm</option>
                <option value="MDF 12mm">MDF 12mm</option>
                <option value="Plywood 18mm">Plywood 18mm</option>
                <option value="Melamine 18mm">Melamine 18mm</option>
                <option value="Particle Board 18mm">Particle Board 18mm</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Slab Width (mm)</label>
              <input
                type="number"
                value={plan.slabWidth}
                onChange={(e) => onUpdate('slabWidth', parseInt(e.target.value))}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Slab Height (mm)</label>
              <input
                type="number"
                value={plan.slabHeight}
                onChange={(e) => onUpdate('slabHeight', parseInt(e.target.value))}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Cut Sequence</label>
              <input
                type="number"
                value={plan.cutSequence}
                onChange={(e) => onUpdate('cutSequence', parseInt(e.target.value))}
                className="w-full px-2 py-1 border rounded text-sm"
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Position X (mm)</label>
              <input
                type="number"
                value={plan.positionX}
                onChange={(e) => onUpdate('positionX', parseInt(e.target.value))}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Position Y (mm)</label>
              <input
                type="number"
                value={plan.positionY}
                onChange={(e) => onUpdate('positionY', parseInt(e.target.value))}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Part Width (mm)</label>
              <input
                type="number"
                value={plan.partWidth || part.width}
                onChange={(e) => onUpdate('partWidth', parseInt(e.target.value))}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Part Height (mm)</label>
              <input
                type="number"
                value={plan.partHeight || part.height}
                onChange={(e) => onUpdate('partHeight', parseInt(e.target.value))}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Slab Visualization */}
      <div className="bg-gray-100 rounded-xl p-6 flex justify-center">
        <div 
          className="relative bg-amber-100 border-4 border-amber-300 rounded"
          style={{ width: slabW, height: slabH }}
        >
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <defs>
              <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#92400e" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Parts on slab */}
          {allParts.map((p, i) => (
            <div
              key={p.id || i}
              className={`absolute border-2 rounded flex items-center justify-center text-xs font-medium transition-all ${
                p.isCurrent 
                  ? 'bg-blue-200 border-blue-500 text-blue-800 shadow-lg z-10' 
                  : 'bg-gray-200 border-gray-400 text-gray-600'
              }`}
              style={{
                left: p.x * SCALE,
                top: p.y * SCALE,
                width: p.width * SCALE,
                height: p.height * SCALE
              }}
              title={`${p.name}: ${p.width}×${p.height}mm`}
            >
              <div className="text-center p-1 overflow-hidden">
                <div className="font-bold">{p.cutSequence || i + 1}</div>
                <div className="truncate text-[10px]">{p.name}</div>
              </div>
            </div>
          ))}

          {/* Slab dimensions */}
          <div className="absolute -bottom-6 left-0 right-0 text-center text-xs text-gray-500">
            {plan.slabWidth}mm
          </div>
          <div className="absolute -right-8 top-0 bottom-0 flex items-center">
            <span className="text-xs text-gray-500 transform -rotate-90">{plan.slabHeight}mm</span>
          </div>
        </div>
      </div>

      {/* Cut sequence info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Cut Sequence</h4>
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
            {plan.cutSequence}
          </span>
          <span>This part is cut #{plan.cutSequence} from the slab</span>
        </div>
        <p className="text-sm text-blue-600 mt-2">
          Position: X={plan.positionX}mm, Y={plan.positionY}mm
        </p>
      </div>

      {/* Other parts on same slab */}
      {plan.otherParts && plan.otherParts.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">Other Parts on This Slab</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {plan.otherParts.map((p, i) => (
              <div key={i} className="bg-white p-2 rounded border text-sm">
                <div className="font-medium text-gray-700">{p.name}</div>
                <div className="text-gray-500 text-xs">{p.width}×{p.height}mm</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CNCPlan({ plan, part, editMode, onUpdate, generateCIXCode }) {
  const [showFullCode, setShowFullCode] = useState(false)

  if (!plan) return <div className="text-gray-500">No CNC plan available</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">CNC Program</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
            {plan.programId}
          </span>
          <span className="flex items-center gap-1 text-gray-600">
            <Clock size={16} /> ~{plan.estimatedTime} min
          </span>
        </div>
      </div>

      {/* Editable Fields */}
      {editMode && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-800 mb-3">Edit CNC Settings</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-purple-700 mb-1">Program ID</label>
              <input
                type="text"
                value={plan.programId}
                onChange={(e) => onUpdate('programId', e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-purple-700 mb-1">Estimated Time (min)</label>
              <input
                type="number"
                step="0.1"
                value={plan.estimatedTime}
                onChange={(e) => onUpdate('estimatedTime', parseFloat(e.target.value))}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-purple-700 mb-1">Tool Changes (comma separated)</label>
              <input
                type="text"
                value={(plan.toolChanges || []).join(', ')}
                onChange={(e) => onUpdate('toolChanges', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tool changes */}
      {!editMode && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-800 mb-3">Tool Changes Required</h4>
          <div className="flex flex-wrap gap-2">
            {(plan.toolChanges || []).map((tool, i) => (
              <span key={i} className="bg-white px-3 py-1 rounded-full border border-purple-200 text-sm text-purple-700">
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Drill holes visualization */}
      {plan.drillHoles && plan.drillHoles.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Drilling Operations ({plan.drillHoles.length} holes)</h4>
          <div className="relative bg-amber-100 border-2 border-amber-300 rounded mx-auto"
            style={{ 
              width: Math.min(400, parseFloat(part.width) * 0.5), 
              height: Math.min(300, parseFloat(part.height) * 0.5) 
            }}
          >
            {plan.drillHoles.map((hole, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-red-700 transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(hole.x / parseFloat(part.width)) * 100}%`,
                  top: `${(hole.y / parseFloat(part.height)) * 100}%`
                }}
                title={`Hole ${i + 1}: X=${hole.x}, Y=${hole.y}, Depth=${hole.depth}mm`}
              />
            ))}
          </div>
        </div>
      )}

      {/* G-code display */}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
          <span className="text-gray-300 text-sm font-mono">G-Code Program</span>
          <button
            onClick={() => setShowFullCode(!showFullCode)}
            className="text-gray-400 hover:text-white text-sm"
          >
            {showFullCode ? 'Show Less' : 'Show Full Code'}
          </button>
        </div>
        {editMode ? (
          <textarea
            value={plan.gcode || ''}
            onChange={(e) => onUpdate('gcode', e.target.value)}
            className="w-full p-4 bg-gray-900 text-green-400 text-sm font-mono min-h-[300px] focus:outline-none"
            placeholder="Enter G-code here..."
          />
        ) : (
          <pre className={`p-4 text-green-400 text-sm font-mono overflow-x-auto ${showFullCode ? '' : 'max-h-48'}`}>
            {plan.gcode || 'No G-code generated'}
          </pre>
        )}
      </div>

      {/* CIX File display */}
      <div className="bg-gray-900 rounded-lg overflow-hidden mt-4">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
          <span className="text-gray-300 text-sm font-mono">CIX File (Biesse/Homag Format)</span>
          <button
            onClick={() => {
              const cixContent = plan.cixCode || generateCIXCode(part)
              const blob = new Blob([cixContent], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${part.name || 'part'}.cix`
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="text-amber-400 hover:text-amber-300 text-sm flex items-center gap-1"
          >
            Download .cix
          </button>
        </div>
        <pre className={`p-4 text-cyan-400 text-sm font-mono overflow-x-auto ${showFullCode ? '' : 'max-h-48'}`}>
          {plan.cixCode || generateCIXCode(part)}
        </pre>
      </div>
    </div>
  )
}

function BandingPlan({ plan, part, editMode, onUpdate, onUpdateEdge }) {
  if (!plan) return <div className="text-gray-500">No banding plan available</div>

  const edges = plan.edges || {}
  const sequence = plan.bandingSequence || []

  const toggleEdgeBanding = (edge) => {
    if (!editMode) return
    const currentEdge = edges[edge] || { band: false, order: 0 }
    const newBand = !currentEdge.band
    const newOrder = newBand ? (sequence.length + 1) : 0
    
    // Update edges
    const newEdges = {
      ...edges,
      [edge]: { band: newBand, order: newOrder }
    }
    onUpdate('edges', newEdges)
    
    // Update sequence
    if (newBand) {
      onUpdate('bandingSequence', [...sequence, edge])
    } else {
      onUpdate('bandingSequence', sequence.filter(e => e !== edge))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Edge Banding Plan</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
            {plan.bandingMaterial}
          </span>
          <span className="flex items-center gap-1 text-gray-600">
            Color: {plan.bandingColor}
          </span>
        </div>
      </div>

      {/* Editable Fields */}
      {editMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-semibold text-amber-800 mb-3">Edit Banding Settings</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-amber-700 mb-1">Banding Material</label>
              <select
                value={plan.bandingMaterial}
                onChange={(e) => onUpdate('bandingMaterial', e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
              >
                <option value="ABS 2mm">ABS 2mm</option>
                <option value="ABS 1mm">ABS 1mm</option>
                <option value="ABS 0.5mm">ABS 0.5mm</option>
                <option value="PVC 2mm">PVC 2mm</option>
                <option value="Melamine 0.4mm">Melamine 0.4mm</option>
                <option value="Wood Veneer 0.6mm">Wood Veneer 0.6mm</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-amber-700 mb-1">Banding Color</label>
              <input
                type="text"
                value={plan.bandingColor}
                onChange={(e) => onUpdate('bandingColor', e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-amber-700 mb-1">Banding Sequence</label>
              <input
                type="text"
                value={sequence.join(', ')}
                onChange={(e) => onUpdate('bandingSequence', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="top, bottom, left, right"
              />
            </div>
          </div>
          <p className="text-xs text-amber-600 mt-2">Click on edges in the visualization below to toggle banding</p>
        </div>
      )}

      {/* Part visualization with edges */}
      <div className="bg-gray-100 rounded-xl p-8 flex justify-center">
        <div className="relative">
          {/* Part body */}
          <div 
            className="bg-amber-200 border-4 border-amber-400 rounded relative"
            style={{ width: 300, height: 200 }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-amber-800 font-medium">
              {part.name}
            </div>

            {/* Top edge */}
            <div 
              onClick={() => toggleEdgeBanding('top')}
              className={`absolute -top-3 left-4 right-4 h-3 rounded-t flex items-center justify-center text-xs font-bold transition-colors ${
                edges.top?.band ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'
              } ${editMode ? 'cursor-pointer hover:opacity-80' : ''}`}
            >
              {edges.top?.band && edges.top.order}
            </div>

            {/* Bottom edge */}
            <div 
              onClick={() => toggleEdgeBanding('bottom')}
              className={`absolute -bottom-3 left-4 right-4 h-3 rounded-b flex items-center justify-center text-xs font-bold transition-colors ${
                edges.bottom?.band ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'
              } ${editMode ? 'cursor-pointer hover:opacity-80' : ''}`}
            >
              {edges.bottom?.band && edges.bottom.order}
            </div>

            {/* Left edge */}
            <div 
              onClick={() => toggleEdgeBanding('left')}
              className={`absolute -left-3 top-4 bottom-4 w-3 rounded-l flex items-center justify-center text-xs font-bold transition-colors ${
                edges.left?.band ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'
              } ${editMode ? 'cursor-pointer hover:opacity-80' : ''}`}
            >
              <span className="transform -rotate-90">{edges.left?.band && edges.left.order}</span>
            </div>

            {/* Right edge */}
            <div 
              onClick={() => toggleEdgeBanding('right')}
              className={`absolute -right-3 top-4 bottom-4 w-3 rounded-r flex items-center justify-center text-xs font-bold transition-colors ${
                edges.right?.band ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'
              } ${editMode ? 'cursor-pointer hover:opacity-80' : ''}`}
            >
              <span className="transform rotate-90">{edges.right?.band && edges.right.order}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Edge to be banded (number = sequence)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <span>No banding required</span>
        </div>
      </div>

      {/* Banding sequence */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-800 mb-3">Banding Sequence</h4>
        <div className="flex items-center gap-2">
          {sequence.map((edge, i) => (
            <div key={i} className="flex items-center">
              <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-medium capitalize">
                {i + 1}. {edge}
              </span>
              {i < sequence.length - 1 && <ChevronRight size={16} className="text-amber-400 mx-1" />}
            </div>
          ))}
        </div>
        <p className="text-sm text-amber-700 mt-3">
          Always band opposite edges first (top/bottom, then left/right) for best results.
        </p>
      </div>

      {/* Edge details table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2">Edge</th>
              <th className="text-left px-4 py-2">Banding</th>
              <th className="text-left px-4 py-2">Sequence</th>
              <th className="text-left px-4 py-2">Length</th>
            </tr>
          </thead>
          <tbody>
            {['top', 'bottom', 'left', 'right'].map(edge => (
              <tr key={edge} className="border-t">
                <td className="px-4 py-2 font-medium capitalize">{edge}</td>
                <td className="px-4 py-2">
                  {edges[edge]?.band ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle size={14} /> Yes
                    </span>
                  ) : (
                    <span className="text-gray-400">No</span>
                  )}
                </td>
                <td className="px-4 py-2">{edges[edge]?.band ? edges[edge].order : '-'}</td>
                <td className="px-4 py-2">
                  {edge === 'top' || edge === 'bottom' 
                    ? `${part.width}mm` 
                    : `${part.height}mm`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PackagingPlan({ plan, part, editMode, onUpdate }) {
  if (!plan) return <div className="text-gray-500">No packaging plan available</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Packaging Instructions</h3>
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium text-sm">
          {plan.protectionType} Protection
        </span>
      </div>

      {/* Editable Fields */}
      {editMode && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-3">Edit Packaging Settings</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-green-700 mb-1">Protection Type</label>
              <select
                value={plan.protectionType}
                onChange={(e) => onUpdate('protectionType', e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
              >
                <option value="Standard">Standard</option>
                <option value="Light">Light</option>
                <option value="Heavy">Heavy</option>
                <option value="Fragile">Fragile</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-green-700 mb-1">Label Position</label>
              <select
                value={plan.labelPosition}
                onChange={(e) => onUpdate('labelPosition', e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
              >
                <option value="Top">Top</option>
                <option value="Bottom">Bottom</option>
                <option value="Front">Front</option>
                <option value="Back">Back</option>
                <option value="Left">Left</option>
                <option value="Right">Right</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-green-700 mb-1">Package Group</label>
              <input
                type="text"
                value={plan.packageGroup || ''}
                onChange={(e) => onUpdate('packageGroup', e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="Group ID"
              />
            </div>
            <div className="col-span-2 md:col-span-4">
              <label className="block text-xs text-green-700 mb-1">Special Instructions</label>
              <textarea
                value={plan.specialInstructions || ''}
                onChange={(e) => onUpdate('specialInstructions', e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                rows={2}
                placeholder="Enter any special packaging instructions..."
              />
            </div>
          </div>
        </div>
      )}

      {!editMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Package group */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">Package Group</h4>
            <p className="text-green-700">
              {plan.packageGroup || 'Not assigned to a package group'}
            </p>
          </div>

          {/* Label position */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Label Position</h4>
            <p className="text-blue-700">{plan.labelPosition} of part</p>
          </div>
        </div>
      )}

      {/* Protection type details */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">Protection Requirements</h4>
        <div className="space-y-2">
          {plan.protectionType === 'Standard' && (
            <>
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle size={16} className="text-green-500" />
                <span>Corner protectors on all corners</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle size={16} className="text-green-500" />
                <span>Cardboard separator between parts</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle size={16} className="text-green-500" />
                <span>Shrink wrap entire package</span>
              </div>
            </>
          )}
          {plan.protectionType === 'Heavy' && (
            <>
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle size={16} className="text-green-500" />
                <span>Foam edge protection</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle size={16} className="text-green-500" />
                <span>Double cardboard layers</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle size={16} className="text-green-500" />
                <span>Wooden crate packaging</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Special instructions */}
      {plan.specialInstructions && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
            <AlertTriangle size={16} /> Special Instructions
          </h4>
          <p className="text-yellow-700">{plan.specialInstructions}</p>
        </div>
      )}

      {/* Final checklist */}
      <div className="bg-white border rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">Packaging Checklist</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-gray-600">
            <input type="checkbox" className="rounded" />
            <span>Part dimensions verified</span>
          </label>
          <label className="flex items-center gap-2 text-gray-600">
            <input type="checkbox" className="rounded" />
            <span>Edge banding quality checked</span>
          </label>
          <label className="flex items-center gap-2 text-gray-600">
            <input type="checkbox" className="rounded" />
            <span>Surface free of defects</span>
          </label>
          <label className="flex items-center gap-2 text-gray-600">
            <input type="checkbox" className="rounded" />
            <span>QR code label applied</span>
          </label>
          <label className="flex items-center gap-2 text-gray-600">
            <input type="checkbox" className="rounded" />
            <span>Protection materials applied</span>
          </label>
        </div>
      </div>
    </div>
  )
}

export default PartProductionPlan
