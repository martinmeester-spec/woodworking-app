import { useState, useEffect, useRef } from 'react'
import { Plus, Save, Download, Layers, Box, Ruler, Palette, RotateCw, ArrowRight, ArrowDown, ChevronDown, ChevronUp, Move, Square, DoorOpen, Maximize2, Trash2, Copy } from 'lucide-react'
import { api } from '../services/api'

const defaultTemplates = [
  { id: 1, templateName: 'Base Cabinet', baseWidth: 600, baseHeight: 720, baseDepth: 560 },
  { id: 2, templateName: 'Wall Cabinet', baseWidth: 600, baseHeight: 400, baseDepth: 300 },
  { id: 3, templateName: 'Tall Cabinet', baseWidth: 600, baseHeight: 2100, baseDepth: 560 },
  { id: 4, templateName: 'Drawer Unit', baseWidth: 450, baseHeight: 720, baseDepth: 560 },
]

// Material definitions with colors and grain patterns
const materialLibrary = {
  'Oak': { color: '#D4A574', grainColor: '#B8956A', hasGrain: true, name: 'Oak' },
  'Maple': { color: '#F5DEB3', grainColor: '#E8D4A8', hasGrain: true, name: 'Maple' },
  'Walnut': { color: '#5D4037', grainColor: '#4E342E', hasGrain: true, name: 'Walnut' },
  'Cherry': { color: '#8B4513', grainColor: '#7A3C11', hasGrain: true, name: 'Cherry' },
  'Pine': { color: '#DEB887', grainColor: '#D2A679', hasGrain: true, name: 'Pine' },
  'Birch': { color: '#F5F5DC', grainColor: '#E8E8D0', hasGrain: true, name: 'Birch' },
  'MDF': { color: '#A0826D', grainColor: '#A0826D', hasGrain: false, name: 'MDF' },
  'Plywood': { color: '#C4A77D', grainColor: '#B89A70', hasGrain: true, name: 'Plywood' },
  'Melamine White': { color: '#FFFFFF', grainColor: '#FFFFFF', hasGrain: false, name: 'Melamine White' },
  'Melamine Black': { color: '#2C2C2C', grainColor: '#2C2C2C', hasGrain: false, name: 'Melamine Black' },
  'Melamine Gray': { color: '#808080', grainColor: '#808080', hasGrain: false, name: 'Melamine Gray' },
}

const finishes = ['Natural', 'Stained', 'Painted', 'Lacquered', 'Matte', 'Gloss']
const grainDirections = ['horizontal', 'vertical']

// Room dimensions (in mm, scaled for display)
const ROOM_SCALE = 0.15 // 1mm = 0.15px for display
const DEFAULT_ROOM = { width: 4000, depth: 3000, height: 2400 } // 4m x 3m x 2.4m

// Generate cabinet parts based on dimensions
const generateCabinetParts = (dimensions, defaultMaterial) => {
  const { width, height, depth } = dimensions
  const thickness = 18 // Standard panel thickness
  
  return [
    { id: 'left-panel', name: 'Left Side Panel', type: 'side', width: depth, height: height, thickness, material: defaultMaterial, grainDirection: 'vertical', color: null },
    { id: 'right-panel', name: 'Right Side Panel', type: 'side', width: depth, height: height, thickness, material: defaultMaterial, grainDirection: 'vertical', color: null },
    { id: 'top-panel', name: 'Top Panel', type: 'top', width: width - (thickness * 2), height: depth, thickness, material: defaultMaterial, grainDirection: 'horizontal', color: null },
    { id: 'bottom-panel', name: 'Bottom Panel', type: 'bottom', width: width - (thickness * 2), height: depth, thickness, material: defaultMaterial, grainDirection: 'horizontal', color: null },
    { id: 'back-panel', name: 'Back Panel', type: 'back', width: width - (thickness * 2), height: height - (thickness * 2), thickness: 6, material: 'Plywood', grainDirection: 'vertical', color: null },
    { id: 'door', name: 'Door', type: 'door', width: width - 4, height: height - 4, thickness, material: defaultMaterial, grainDirection: 'vertical', color: null },
  ]
}

// 3D Part visualization component with grain direction
const PartPreview = ({ part, isSelected, onClick }) => {
  const mat = materialLibrary[part.material] || materialLibrary['Oak']
  const displayColor = part.color || mat.color
  const grainColor = mat.grainColor
  const hasGrain = mat.hasGrain
  
  // Create grain pattern based on direction
  const grainStyle = hasGrain ? {
    backgroundImage: part.grainDirection === 'horizontal' 
      ? `repeating-linear-gradient(90deg, ${displayColor} 0px, ${displayColor} 8px, ${grainColor} 8px, ${grainColor} 10px)`
      : `repeating-linear-gradient(0deg, ${displayColor} 0px, ${displayColor} 8px, ${grainColor} 8px, ${grainColor} 10px)`,
  } : {
    backgroundColor: displayColor,
  }
  
  return (
    <div 
      onClick={onClick}
      className={`relative cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-amber-500 ring-offset-2' : 'hover:opacity-80'}`}
      style={{
        ...grainStyle,
        width: Math.min(part.width / 10, 80),
        height: Math.min(part.height / 10, 100),
        borderRadius: '2px',
        border: '1px solid rgba(0,0,0,0.2)',
        boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
      }}
      title={`${part.name}\n${part.width}×${part.height}×${part.thickness}mm\n${part.material} - ${part.grainDirection} grain`}
    >
      {hasGrain && (
        <div className="absolute bottom-1 right-1 text-[8px] bg-black/30 text-white px-1 rounded">
          {part.grainDirection === 'horizontal' ? '→' : '↓'}
        </div>
      )}
    </div>
  )
}

function DesignStudio() {
  const [templates, setTemplates] = useState(defaultTemplates)
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [dimensions, setDimensions] = useState({ width: 600, height: 720, depth: 560 })
  const [material, setMaterial] = useState('Oak')
  const [finish, setFinish] = useState('Natural')
  const [parts, setParts] = useState(() => generateCabinetParts({ width: 600, height: 720, depth: 560 }, 'Oak'))
  const [selectedPart, setSelectedPart] = useState(null)
  const [partsExpanded, setPartsExpanded] = useState(true)
  
  // Room layout state
  const [roomDimensions, setRoomDimensions] = useState(DEFAULT_ROOM)
  const [roomElements, setRoomElements] = useState([
    { id: 'cabinet-1', type: 'cabinet', x: 100, y: 200, width: 600, height: 720, depth: 560, material: 'Oak', wall: 'back' },
  ])
  const [wallElements, setWallElements] = useState([
    { id: 'window-1', type: 'window', wall: 'back', x: 1500, y: 800, width: 1200, height: 1000 },
    { id: 'door-1', type: 'door', wall: 'left', x: 0, y: 0, width: 900, height: 2100 },
  ])
  const [selectedElement, setSelectedElement] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const roomRef = useRef(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await api.get('/designs/templates')
        if (response.data && response.data.length > 0) {
          setTemplates(response.data)
        }
      } catch (error) {
        console.error('Error fetching templates:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [])

  // Regenerate parts when dimensions change
  useEffect(() => {
    setParts(prev => {
      const newParts = generateCabinetParts(dimensions, material)
      // Preserve existing material/grain settings
      return newParts.map(newPart => {
        const existingPart = prev.find(p => p.id === newPart.id)
        if (existingPart) {
          return { ...newPart, material: existingPart.material, grainDirection: existingPart.grainDirection, color: existingPart.color }
        }
        return newPart
      })
    })
  }, [dimensions])

  // Update part material
  const updatePartMaterial = (partId, newMaterial) => {
    setParts(prev => prev.map(p => p.id === partId ? { ...p, material: newMaterial, color: null } : p))
  }

  // Update part grain direction
  const updatePartGrain = (partId, direction) => {
    setParts(prev => prev.map(p => p.id === partId ? { ...p, grainDirection: direction } : p))
  }

  // Update part custom color
  const updatePartColor = (partId, color) => {
    setParts(prev => prev.map(p => p.id === partId ? { ...p, color: color || null } : p))
  }

  // Apply material to all parts
  const applyMaterialToAll = (newMaterial) => {
    setMaterial(newMaterial)
    setParts(prev => prev.map(p => ({ ...p, material: newMaterial, color: null })))
  }

  const selectedPartData = parts.find(p => p.id === selectedPart)

  // Drag handlers for room elements
  const handleMouseDown = (e, element, elementType) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = roomRef.current?.getBoundingClientRect()
    if (!rect) return
    
    setDragging({ ...element, elementType })
    setSelectedElement({ ...element, elementType })
    setDragOffset({
      x: e.clientX - rect.left - (element.x * ROOM_SCALE),
      y: e.clientY - rect.top - ((element.y || 0) * ROOM_SCALE)
    })
  }

  const handleMouseMove = (e) => {
    if (!dragging || !roomRef.current) return
    e.preventDefault()
    
    const rect = roomRef.current.getBoundingClientRect()
    const newX = Math.max(0, Math.min((e.clientX - rect.left - dragOffset.x) / ROOM_SCALE, roomDimensions.width - dragging.width))
    const newY = Math.max(0, Math.min((e.clientY - rect.top - dragOffset.y) / ROOM_SCALE, roomDimensions.depth - (dragging.depth || 100)))
    
    if (dragging.elementType === 'cabinet') {
      setRoomElements(prev => prev.map(el => 
        el.id === dragging.id ? { ...el, x: newX, y: newY } : el
      ))
    } else if (dragging.elementType === 'wall') {
      // Wall elements move along their wall
      setWallElements(prev => prev.map(el => {
        if (el.id !== dragging.id) return el
        if (el.wall === 'back' || el.wall === 'front') {
          return { ...el, x: Math.max(0, Math.min(newX, roomDimensions.width - el.width)) }
        } else {
          return { ...el, x: Math.max(0, Math.min(newY, roomDimensions.depth - el.width)) }
        }
      }))
    }
  }

  const handleMouseUp = (e) => {
    if (dragging) {
      e.preventDefault()
      e.stopPropagation()
    }
    setDragging(null)
  }

  // Add new cabinet to room
  const addCabinet = () => {
    const newCabinet = {
      id: `cabinet-${Date.now()}`,
      type: 'cabinet',
      x: Math.random() * (roomDimensions.width - dimensions.width),
      y: Math.random() * (roomDimensions.depth - dimensions.depth),
      width: dimensions.width,
      height: dimensions.height,
      depth: dimensions.depth,
      material: material,
      wall: 'floor'
    }
    setRoomElements(prev => [...prev, newCabinet])
    setSelectedElement({ ...newCabinet, elementType: 'cabinet' })
  }

  // Add window to wall
  const addWindow = () => {
    const newWindow = {
      id: `window-${Date.now()}`,
      type: 'window',
      wall: 'back',
      x: roomDimensions.width / 2 - 600,
      y: 800,
      width: 1200,
      height: 1000
    }
    setWallElements(prev => [...prev, newWindow])
  }

  // Add door to wall
  const addDoor = () => {
    const newDoor = {
      id: `door-${Date.now()}`,
      type: 'door',
      wall: 'left',
      x: 500,
      y: 0,
      width: 900,
      height: 2100
    }
    setWallElements(prev => [...prev, newDoor])
  }

  // Delete selected element
  const deleteSelected = () => {
    if (!selectedElement) return
    if (selectedElement.elementType === 'cabinet') {
      setRoomElements(prev => prev.filter(el => el.id !== selectedElement.id))
    } else {
      setWallElements(prev => prev.filter(el => el.id !== selectedElement.id))
    }
    setSelectedElement(null)
  }

  return (
    <div className="pt-14">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Design Studio</h2>
          <p className="text-gray-600">Create and manage cabinet designs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addCabinet} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
            <Plus size={18} /> Add Cabinet
          </button>
          <button onClick={addWindow} className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <Maximize2 size={18} /> Window
          </button>
          <button onClick={addDoor} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <DoorOpen size={18} /> Door
          </button>
          {selectedElement && (
            <button onClick={deleteSelected} className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
              <Trash2 size={18} />
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            <Save size={18} /> Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Room Layout View */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Box size={20} /> Room Layout
              <span className="text-sm font-normal text-gray-500 ml-2">Drag elements to position them</span>
              <span className="ml-auto text-xs text-gray-400">
                Room: {roomDimensions.width/1000}m × {roomDimensions.depth/1000}m
              </span>
            </h3>
            {/* Top-down room view */}
            <div 
              ref={roomRef}
              className="relative rounded-lg overflow-hidden cursor-crosshair select-none"
              style={{ 
                width: roomDimensions.width * ROOM_SCALE,
                height: roomDimensions.depth * ROOM_SCALE,
                backgroundColor: '#F5F0E8',
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 29px, #E8E0D5 29px, #E8E0D5 30px), repeating-linear-gradient(90deg, transparent, transparent 29px, #E8E0D5 29px, #E8E0D5 30px)',
                margin: '0 auto',
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={() => setSelectedElement(null)}
            >
              {/* Walls */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Back wall */}
                <div className="absolute top-0 left-0 right-0 h-3 bg-gray-400" />
                {/* Left wall */}
                <div className="absolute top-0 left-0 bottom-0 w-3 bg-gray-500" />
                {/* Right wall */}
                <div className="absolute top-0 right-0 bottom-0 w-3 bg-gray-400" />
                {/* Front (bottom) - open */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300" />
              </div>

              {/* Wall elements (windows, doors) on back wall */}
              {wallElements.filter(el => el.wall === 'back').map(element => (
                <div
                  key={element.id}
                  className={`absolute cursor-move transition-shadow ${selectedElement?.id === element.id ? 'ring-2 ring-amber-500 z-20' : 'z-10'}`}
                  style={{
                    left: element.x * ROOM_SCALE,
                    top: 0,
                    width: element.width * ROOM_SCALE,
                    height: 12,
                    backgroundColor: element.type === 'window' ? '#87CEEB' : '#8B4513',
                    border: '2px solid',
                    borderColor: element.type === 'window' ? '#5BA3C6' : '#5D3A1A',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, element, 'wall')}
                >
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-gray-600 whitespace-nowrap">
                    {element.type === 'window' ? '🪟' : '🚪'} {element.width}mm
                  </div>
                </div>
              ))}

              {/* Wall elements on left wall */}
              {wallElements.filter(el => el.wall === 'left').map(element => (
                <div
                  key={element.id}
                  className={`absolute cursor-move transition-shadow ${selectedElement?.id === element.id ? 'ring-2 ring-amber-500 z-20' : 'z-10'}`}
                  style={{
                    left: 0,
                    top: element.x * ROOM_SCALE,
                    width: 12,
                    height: element.width * ROOM_SCALE,
                    backgroundColor: element.type === 'window' ? '#87CEEB' : '#8B4513',
                    border: '2px solid',
                    borderColor: element.type === 'window' ? '#5BA3C6' : '#5D3A1A',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, element, 'wall')}
                >
                  <div className="absolute -right-6 top-1/2 -translate-y-1/2 rotate-90 text-[8px] text-gray-600 whitespace-nowrap">
                    {element.type === 'window' ? '🪟' : '🚪'}
                  </div>
                </div>
              ))}

              {/* Cabinets */}
              {roomElements.map(element => {
                const mat = materialLibrary[element.material] || materialLibrary['Oak']
                return (
                  <div
                    key={element.id}
                    className={`absolute cursor-move transition-all ${selectedElement?.id === element.id ? 'ring-2 ring-amber-500 shadow-lg z-20' : 'shadow-md z-10 hover:shadow-lg'}`}
                    style={{
                      left: element.x * ROOM_SCALE,
                      top: element.y * ROOM_SCALE,
                      width: element.width * ROOM_SCALE,
                      height: element.depth * ROOM_SCALE,
                      backgroundColor: mat.color,
                      backgroundImage: mat.hasGrain 
                        ? `repeating-linear-gradient(0deg, ${mat.color} 0px, ${mat.color} 4px, ${mat.grainColor} 4px, ${mat.grainColor} 5px)`
                        : 'none',
                      borderRadius: '2px',
                    }}
                    onMouseDown={(e) => handleMouseDown(e, element, 'cabinet')}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Move size={12} className="text-white/50" />
                    </div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-gray-600 whitespace-nowrap bg-white/80 px-1 rounded">
                      {element.width}×{element.depth}
                    </div>
                  </div>
                )
              })}

              {/* Room labels */}
              <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
                {roomElements.length} cabinet{roomElements.length !== 1 ? 's' : ''} • {wallElements.length} wall element{wallElements.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Selected element info */}
            {selectedElement && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-amber-800">
                    {selectedElement.type === 'cabinet' ? '📦 Cabinet' : selectedElement.type === 'window' ? '🪟 Window' : '🚪 Door'}
                  </span>
                  <span className="text-sm text-amber-600">
                    {selectedElement.width} × {selectedElement.depth || selectedElement.height}mm
                  </span>
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  Position: X={Math.round(selectedElement.x)}mm, Y={Math.round(selectedElement.y || selectedElement.x)}mm
                </p>
              </div>
            )}
          </div>

          {/* 3D Cabinet Preview */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Layers size={20} /> Cabinet Detail
              <span className="text-sm font-normal text-gray-500 ml-2">Click parts to edit materials</span>
            </h3>
            {/* Room environment with cabinet */}
            <div className="relative rounded-lg overflow-hidden min-h-[280px]" style={{ perspective: '1000px' }}>
              {/* Room background - walls and floor */}
              <div className="absolute inset-0">
                {/* Back wall */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-200 to-gray-300" />
                {/* Floor */}
                <div 
                  className="absolute bottom-0 left-0 right-0 h-1/3"
                  style={{
                    background: 'repeating-linear-gradient(90deg, #C4A77D 0px, #C4A77D 40px, #B89A70 40px, #B89A70 80px)',
                    transform: 'perspective(500px) rotateX(60deg)',
                    transformOrigin: 'bottom center',
                  }}
                />
                {/* Left wall shadow */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-400/30 to-transparent" />
                {/* Right wall shadow */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-400/30 to-transparent" />
              </div>
              
              {/* Cabinet inside room */}
              <div className="relative z-10 flex justify-center items-end pt-8 pb-16">
                <div 
                  className="relative"
                  style={{
                    transform: 'perspective(800px) rotateY(-15deg) rotateX(5deg)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Assembled cabinet view */}
                  <div className="relative" style={{ width: `${Math.min(dimensions.width / 4, 200)}px`, height: `${Math.min(dimensions.height / 4, 250)}px` }}>
                    {/* Back panel */}
                    {(() => {
                      const part = parts.find(p => p.id === 'back-panel')
                      const mat = materialLibrary[part?.material] || materialLibrary['Oak']
                      return (
                        <div 
                          className={`absolute inset-1 rounded cursor-pointer transition-all ${selectedPart === 'back-panel' ? 'ring-2 ring-amber-500' : ''}`}
                          onClick={() => setSelectedPart('back-panel')}
                          style={{
                            backgroundColor: part?.color || mat.color,
                            backgroundImage: mat.hasGrain 
                              ? part?.grainDirection === 'horizontal'
                                ? `repeating-linear-gradient(90deg, ${part?.color || mat.color} 0px, ${part?.color || mat.color} 6px, ${mat.grainColor} 6px, ${mat.grainColor} 8px)`
                                : `repeating-linear-gradient(0deg, ${part?.color || mat.color} 0px, ${part?.color || mat.color} 6px, ${mat.grainColor} 6px, ${mat.grainColor} 8px)`
                              : 'none',
                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)',
                          }}
                        />
                      )
                    })()}
                    
                    {/* Left panel */}
                    {(() => {
                      const part = parts.find(p => p.id === 'left-panel')
                      const mat = materialLibrary[part?.material] || materialLibrary['Oak']
                      return (
                        <div 
                          className={`absolute left-0 top-0 bottom-0 w-3 rounded-l cursor-pointer transition-all ${selectedPart === 'left-panel' ? 'ring-2 ring-amber-500' : ''}`}
                          onClick={() => setSelectedPart('left-panel')}
                          style={{
                            backgroundColor: part?.color || mat.color,
                            backgroundImage: mat.hasGrain 
                              ? `repeating-linear-gradient(0deg, ${part?.color || mat.color} 0px, ${part?.color || mat.color} 4px, ${mat.grainColor} 4px, ${mat.grainColor} 5px)`
                              : 'none',
                            boxShadow: '-2px 0 4px rgba(0,0,0,0.2)',
                          }}
                        />
                      )
                    })()}
                    
                    {/* Right panel */}
                    {(() => {
                      const part = parts.find(p => p.id === 'right-panel')
                      const mat = materialLibrary[part?.material] || materialLibrary['Oak']
                      return (
                        <div 
                          className={`absolute right-0 top-0 bottom-0 w-3 rounded-r cursor-pointer transition-all ${selectedPart === 'right-panel' ? 'ring-2 ring-amber-500' : ''}`}
                          onClick={() => setSelectedPart('right-panel')}
                          style={{
                            backgroundColor: part?.color || mat.color,
                            backgroundImage: mat.hasGrain 
                              ? `repeating-linear-gradient(0deg, ${part?.color || mat.color} 0px, ${part?.color || mat.color} 4px, ${mat.grainColor} 4px, ${mat.grainColor} 5px)`
                              : 'none',
                            boxShadow: '2px 0 4px rgba(0,0,0,0.2)',
                          }}
                        />
                      )
                    })()}
                    
                    {/* Top panel */}
                    {(() => {
                      const part = parts.find(p => p.id === 'top-panel')
                      const mat = materialLibrary[part?.material] || materialLibrary['Oak']
                      return (
                        <div 
                          className={`absolute left-0 right-0 top-0 h-3 rounded-t cursor-pointer transition-all ${selectedPart === 'top-panel' ? 'ring-2 ring-amber-500' : ''}`}
                          onClick={() => setSelectedPart('top-panel')}
                          style={{
                            backgroundColor: part?.color || mat.color,
                            backgroundImage: mat.hasGrain 
                              ? `repeating-linear-gradient(90deg, ${part?.color || mat.color} 0px, ${part?.color || mat.color} 4px, ${mat.grainColor} 4px, ${mat.grainColor} 5px)`
                              : 'none',
                            boxShadow: '0 -2px 4px rgba(0,0,0,0.2)',
                          }}
                        />
                      )
                    })()}
                    
                    {/* Bottom panel */}
                    {(() => {
                      const part = parts.find(p => p.id === 'bottom-panel')
                      const mat = materialLibrary[part?.material] || materialLibrary['Oak']
                      return (
                        <div 
                          className={`absolute left-0 right-0 bottom-0 h-3 rounded-b cursor-pointer transition-all ${selectedPart === 'bottom-panel' ? 'ring-2 ring-amber-500' : ''}`}
                          onClick={() => setSelectedPart('bottom-panel')}
                          style={{
                            backgroundColor: part?.color || mat.color,
                            backgroundImage: mat.hasGrain 
                              ? `repeating-linear-gradient(90deg, ${part?.color || mat.color} 0px, ${part?.color || mat.color} 4px, ${mat.grainColor} 4px, ${mat.grainColor} 5px)`
                              : 'none',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          }}
                        />
                      )
                    })()}
                    
                    {/* Door (slightly offset to show it's a door) */}
                    {(() => {
                      const part = parts.find(p => p.id === 'door')
                      const mat = materialLibrary[part?.material] || materialLibrary['Oak']
                      return (
                        <div 
                          className={`absolute inset-2 rounded cursor-pointer transition-all ${selectedPart === 'door' ? 'ring-2 ring-amber-500' : ''}`}
                          onClick={() => setSelectedPart('door')}
                          style={{
                            backgroundColor: part?.color || mat.color,
                            backgroundImage: mat.hasGrain 
                              ? part?.grainDirection === 'horizontal'
                                ? `repeating-linear-gradient(90deg, ${part?.color || mat.color} 0px, ${part?.color || mat.color} 8px, ${mat.grainColor} 8px, ${mat.grainColor} 10px)`
                                : `repeating-linear-gradient(0deg, ${part?.color || mat.color} 0px, ${part?.color || mat.color} 8px, ${mat.grainColor} 8px, ${mat.grainColor} 10px)`
                              : 'none',
                            boxShadow: '2px 2px 8px rgba(0,0,0,0.3)',
                            transform: 'translateZ(4px)',
                          }}
                        >
                          {/* Door handle */}
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-6 bg-gray-600 rounded" />
                        </div>
                      )
                    })()}
                  </div>
                  
                  {/* Cabinet shadow on floor */}
                  <div 
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black/20 rounded-full blur-md"
                    style={{ width: `${Math.min(dimensions.width / 4, 200) + 20}px`, height: '20px' }}
                  />
                </div>
              </div>
              
              {/* Dimensions overlay */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center bg-white/80 px-3 py-1 rounded-full">
                <p className="text-sm text-gray-700 font-medium">
                  {dimensions.width} × {dimensions.height} × {dimensions.depth} mm
                </p>
                <p className="text-xs text-amber-600">{material} - {finish}</p>
              </div>
              
              {/* Selected part indicator */}
              {selectedPart && (
                <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded text-xs">
                  Selected: {parts.find(p => p.id === selectedPart)?.name}
                </div>
              )}
            </div>
          </div>

          {/* Parts List with Material/Grain Controls */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <button 
              onClick={() => setPartsExpanded(!partsExpanded)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Layers size={20} /> Cabinet Parts ({parts.length})
              </h3>
              {partsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {partsExpanded && (
              <div className="divide-y">
                {parts.map((part) => {
                  const mat = materialLibrary[part.material] || materialLibrary['Oak']
                  const isSelected = selectedPart === part.id
                  
                  return (
                    <div 
                      key={part.id} 
                      className={`p-4 cursor-pointer transition-colors ${isSelected ? 'bg-amber-50 border-l-4 border-amber-500' : 'hover:bg-gray-50'}`}
                      onClick={() => setSelectedPart(part.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-6 h-6 rounded border"
                            style={{ 
                              backgroundColor: part.color || mat.color,
                              backgroundImage: mat.hasGrain 
                                ? part.grainDirection === 'horizontal'
                                  ? `repeating-linear-gradient(90deg, ${part.color || mat.color} 0px, ${part.color || mat.color} 3px, ${mat.grainColor} 3px, ${mat.grainColor} 4px)`
                                  : `repeating-linear-gradient(0deg, ${part.color || mat.color} 0px, ${part.color || mat.color} 3px, ${mat.grainColor} 3px, ${mat.grainColor} 4px)`
                                : 'none'
                            }}
                          />
                          <div>
                            <p className="font-medium text-gray-800">{part.name}</p>
                            <p className="text-xs text-gray-500">{part.width} × {part.height} × {part.thickness}mm</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {mat.hasGrain && (
                            <span className="flex items-center gap-1">
                              {part.grainDirection === 'horizontal' ? <ArrowRight size={12} /> : <ArrowDown size={12} />}
                              grain
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                          {/* Material selector */}
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Material</label>
                            <select
                              value={part.material}
                              onChange={(e) => updatePartMaterial(part.id, e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {Object.keys(materialLibrary).map((m) => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Grain direction (only for wood materials) */}
                          {mat.hasGrain && (
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Grain Direction</label>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); updatePartGrain(part.id, 'horizontal') }}
                                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 text-sm rounded border ${
                                    part.grainDirection === 'horizontal' 
                                      ? 'bg-amber-100 border-amber-500 text-amber-700' 
                                      : 'border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  <ArrowRight size={14} /> Horizontal
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); updatePartGrain(part.id, 'vertical') }}
                                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 text-sm rounded border ${
                                    part.grainDirection === 'vertical' 
                                      ? 'bg-amber-100 border-amber-500 text-amber-700' 
                                      : 'border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  <ArrowDown size={14} /> Vertical
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Custom color override */}
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Custom Color (optional)</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={part.color || mat.color}
                                onChange={(e) => updatePartColor(part.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                              />
                              {part.color && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); updatePartColor(part.id, null) }}
                                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                                >
                                  Reset to material
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Layers size={20} /> Templates
            </h3>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template.id)
                    setDimensions({ 
                      width: template.baseWidth || template.width || 600, 
                      height: template.baseHeight || template.height || 720, 
                      depth: template.baseDepth || template.depth || 560 
                    })
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedTemplate === template.id 
                      ? 'border-amber-500 bg-amber-50' 
                      : 'border-gray-200 hover:border-amber-300'
                  }`}
                >
                  <p className="font-medium text-gray-800">{template.templateName || template.name}</p>
                  <p className="text-xs text-gray-500">
                    {template.baseWidth || template.width} × {template.baseHeight || template.height} × {template.baseDepth || template.depth}mm
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Ruler size={20} /> Dimensions
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Width (mm)</label>
                <input
                  type="number"
                  value={dimensions.width}
                  onChange={(e) => setDimensions({ ...dimensions, width: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Height (mm)</label>
                <input
                  type="number"
                  value={dimensions.height}
                  onChange={(e) => setDimensions({ ...dimensions, height: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Depth (mm)</label>
                <input
                  type="number"
                  value={dimensions.depth}
                  onChange={(e) => setDimensions({ ...dimensions, depth: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Palette size={20} /> Materials & Finish
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Default Material</label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  {Object.keys(materialLibrary).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <button
                  onClick={() => applyMaterialToAll(material)}
                  className="w-full mt-2 px-3 py-2 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCw size={14} /> Apply to All Parts
                </button>
              </div>
              
              {/* Material swatches */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Quick Select</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(materialLibrary).slice(0, 8).map(([name, mat]) => (
                    <button
                      key={name}
                      onClick={() => applyMaterialToAll(name)}
                      className={`w-full aspect-square rounded-lg border-2 transition-all ${
                        material === name ? 'border-amber-500 ring-2 ring-amber-200' : 'border-gray-200 hover:border-amber-300'
                      }`}
                      style={{ 
                        backgroundColor: mat.color,
                        backgroundImage: mat.hasGrain 
                          ? `repeating-linear-gradient(0deg, ${mat.color} 0px, ${mat.color} 3px, ${mat.grainColor} 3px, ${mat.grainColor} 4px)`
                          : 'none'
                      }}
                      title={name}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Finish</label>
                <select
                  value={finish}
                  onChange={(e) => setFinish(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  {finishes.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DesignStudio
