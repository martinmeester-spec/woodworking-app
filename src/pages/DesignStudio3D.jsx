import { useState, useEffect } from 'react'
import { Plus, Save, Undo, Redo, Layers, Box, Ruler, Eye, EyeOff, AlertTriangle, Trash2, Sun, Square, Grid, Factory, FileText, Download, FolderOpen, X, ToggleLeft, ToggleRight, Move, ArrowLeftRight, ArrowUpDown, Settings } from 'lucide-react'
import { api } from '../services/api'
import DraggablePanel from '../components/DraggablePanel'

const CABINET_PARTS = {
  leftPanel: { name: 'Left Panel', color: '#8B4513', defaultSize: { w: 18, h: 720, d: 560 } },
  rightPanel: { name: 'Right Panel', color: '#8B4513', defaultSize: { w: 18, h: 720, d: 560 } },
  topPanel: { name: 'Top Panel', color: '#A0522D', defaultSize: { w: 564, h: 18, d: 560 } },
  bottomPanel: { name: 'Bottom Panel', color: '#A0522D', defaultSize: { w: 564, h: 18, d: 560 } },
  backPanel: { name: 'Back Panel', color: '#D2691E', defaultSize: { w: 564, h: 684, d: 6 } },
  shelf: { name: 'Shelf', color: '#CD853F', defaultSize: { w: 564, h: 18, d: 540 } },
  door: { name: 'Door', color: '#DEB887', defaultSize: { w: 282, h: 716, d: 18 }, movable: true },
  drawer: { name: 'Drawer', color: '#F5DEB3', defaultSize: { w: 540, h: 150, d: 500 } },
  divider: { name: 'Divider', color: '#A0522D', defaultSize: { w: 18, h: 684, d: 540 } },
}

// Generate cabinet parts from a template configuration
// shareWalls: if true, adjacent compartments share their dividing wall
// Parts use: w=width (X), h=height (Y), d=depth (Z)
const generateCabinetFromTemplate = (template, shareWalls = true) => {
  const { width, height, depth, compartments = 1, shelves = 1 } = template
  const T = 18 // Panel thickness
  const backT = 6 // Back panel thickness
  const parts = []
  
  // Calculate compartment width (interior space)
  const interiorWidth = width - 2 * T
  const dividerCount = compartments - 1
  const totalDividerWidth = shareWalls ? dividerCount * T : 0
  const compartmentWidth = (interiorWidth - totalDividerWidth) / compartments
  
  // Left side panel - vertical, full height, full depth
  // For side panels: w=thickness (along X), h=height (along Y), d=depth (along Z)
  parts.push({ 
    id: 'left', 
    type: 'leftPanel', 
    x: 0, y: 0, z: 0, 
    w: T, h: height, d: depth - backT, 
    rotation: 0 
  })
  
  // Right side panel - vertical, full height, full depth
  parts.push({ 
    id: 'right', 
    type: 'rightPanel', 
    x: width - T, y: 0, z: 0, 
    w: T, h: height, d: depth - backT, 
    rotation: 0 
  })
  
  // Top panel - horizontal, spans between sides
  parts.push({ 
    id: 'top', 
    type: 'topPanel', 
    x: T, y: height - T, z: 0, 
    w: interiorWidth, h: T, d: depth - backT, 
    rotation: 0 
  })
  
  // Bottom panel - horizontal, spans between sides
  parts.push({ 
    id: 'bottom', 
    type: 'bottomPanel', 
    x: T, y: 0, z: 0, 
    w: interiorWidth, h: T, d: depth - backT, 
    rotation: 0 
  })
  
  // Back panel - vertical, thin, at back (covers full width and height)
  parts.push({ 
    id: 'back', 
    type: 'backPanel', 
    x: 0, y: 0, z: depth - backT, 
    w: width, h: height, d: backT, 
    rotation: 0 
  })
  
  // Dividers between compartments
  for (let i = 1; i < compartments; i++) {
    const dividerX = T + i * compartmentWidth + (shareWalls ? (i - 1) * T : 0)
    parts.push({
      id: `divider-${i}`,
      type: 'divider',
      x: dividerX,
      y: T,
      z: 0,
      w: T,
      h: height - 2*T,
      d: depth - backT,
      rotation: 0,
      isShared: shareWalls
    })
  }
  
  // Shelves in each compartment
  for (let c = 0; c < compartments; c++) {
    const startX = T + c * compartmentWidth + (shareWalls ? c * T : 0)
    
    for (let s = 1; s <= shelves; s++) {
      const shelfY = T + (s * (height - 2*T)) / (shelves + 1)
      parts.push({
        id: `shelf-${c}-${s}`,
        type: 'shelf',
        x: startX,
        y: shelfY,
        z: 0,
        w: compartmentWidth,
        h: T,
        d: depth - backT - 10,
        rotation: 0
      })
    }
  }
  
  // Door(s) - one per compartment
  for (let c = 0; c < compartments; c++) {
    const doorX = T + c * compartmentWidth + (shareWalls ? c * T : 0) + 2
    const doorWidth = compartmentWidth - 4
    parts.push({
      id: `door-${c}`,
      type: 'door',
      x: doorX,
      y: T + 2,
      z: -T,
      w: doorWidth,
      h: height - 2*T - 4,
      d: T,
      rotation: 0,
      openAngle: 0
    })
  }
  
  return parts
}

const ROOM_ELEMENTS = {
  window: { name: 'Window', color: '#87CEEB', defaultSize: { w: 1000, h: 1200, d: 50 } },
  roomDoor: { name: 'Room Door', color: '#8B4513', defaultSize: { w: 900, h: 2100, d: 50 } },
  light: { name: 'Ceiling Light', color: '#FFD700', defaultSize: { w: 200, h: 50, d: 200 } },
}

const initialParts = [
  { id: 'left', type: 'leftPanel', x: 0, y: 0, z: 0, w: 18, h: 720, d: 560, rotation: 0 },
  { id: 'right', type: 'rightPanel', x: 582, y: 0, z: 0, w: 18, h: 720, d: 560, rotation: 0 },
  { id: 'top', type: 'topPanel', x: 18, y: 702, z: 0, w: 564, h: 18, d: 560, rotation: 0 },
  { id: 'bottom', type: 'bottomPanel', x: 18, y: 0, z: 0, w: 564, h: 18, d: 560, rotation: 0 },
  { id: 'back', type: 'backPanel', x: 18, y: 18, z: 554, w: 564, h: 684, d: 6, rotation: 0 },
  { id: 'shelf1', type: 'shelf', x: 18, y: 360, z: 10, w: 564, h: 18, d: 540, rotation: 0 },
  { id: 'door1', type: 'door', x: 18, y: 2, z: -20, w: 282, h: 716, d: 18, rotation: 0, openAngle: 0 },
]

const initialRoom = {
  width: 4000,
  height: 2800,
  depth: 3500,
  floorColor: '#E8DCC8',
  wallColor: '#F5F5F5',
  elements: []
}

function DesignStudio3D() {
  const [parts, setParts] = useState(initialParts)
  const [selectedPart, setSelectedPart] = useState(null)
  const [history, setHistory] = useState([initialParts])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [collisions, setCollisions] = useState([])
  const [viewAngle, setViewAngle] = useState({ x: 25, y: -35 })
  const [zoom, setZoom] = useState(0.12)
  const [designName, setDesignName] = useState('New Cabinet Design')
  const [saving, setSaving] = useState(false)
  const [room, setRoom] = useState(initialRoom)
  const [showRoom, setShowRoom] = useState(true)
  const [showRulers, setShowRulers] = useState(true)
  const [showDimensions, setShowDimensions] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [wallVisibility, setWallVisibility] = useState({
    floor: true,
    ceiling: true,
    backWall: true,
    leftWall: true,
    rightWall: true,
    frontWall: false // Front wall hidden by default for better view
  })
  const [alcove, setAlcove] = useState({
    enabled: false,
    wall: 'back', // which wall the alcove is on
    width: 1000,
    height: 2000,
    depth: 300,
    offsetX: 1500 // offset from left edge
  })
  const [showFaceLabels, setShowFaceLabels] = useState(false)
  const [viewMode, setViewMode] = useState('all') // all, cabinet, doors, shelves
  const [is2DMode, setIs2DMode] = useState(false) // Toggle between 2D and 3D view
  const [view2DRotation, setView2DRotation] = useState(0) // 2D view rotation in degrees
  const [panelVisibility, setPanelVisibility] = useState({
    frontPanels: true, // doors
    backPanels: true   // back panel
  })
  // Cabinet position relative to room center (0,0 = center of floor)
  const [cabinetPosition, setCabinetPosition] = useState({ x: 0, y: 0, z: 0 })
  const [cabinetRotation, setCabinetRotation] = useState(0) // 0, 90, 180, 270 degrees
  const [templates, setTemplates] = useState([])
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState(null) // 'pan', 'rotate', or 'cabinet'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [cabinetDragStart, setCabinetDragStart] = useState({ x: 0, y: 0 })
  const [cabinetHovered, setCabinetHovered] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'Medium',
    notes: ''
  })
  const [orderCreating, setOrderCreating] = useState(false)
  const [selectedRoomElement, setSelectedRoomElement] = useState(null)
  const [showQuickTemplate, setShowQuickTemplate] = useState(false)
  const [quickTemplateConfig, setQuickTemplateConfig] = useState({
    width: 600,
    height: 720,
    depth: 560,
    compartments: 1,
    shelves: 1,
    shareWalls: true
  })
  const [roomElementDragStart, setRoomElementDragStart] = useState({ x: 0, y: 0 })
  const [panel2DDragStart, setPanel2DDragStart] = useState({ x: 0, y: 0, partX: 0, partY: 0 })
  const [showSpaces, setShowSpaces] = useState(true)
  const [selectedSpace, setSelectedSpace] = useState(null)
  const [showSpaceModal, setShowSpaceModal] = useState(false)
  
  // Panel visibility states for toolbar
  const [panelVisibilityState, setPanelVisibilityState] = useState({
    roomSettings: true,
    addParts: true,
    partsList: true,
    verbinders: false,
    spaces: true
  })
  const [allPanelsHidden, setAllPanelsHidden] = useState(false)
  
  const togglePanel = (panelName) => {
    setPanelVisibilityState(prev => ({ ...prev, [panelName]: !prev[panelName] }))
  }
  
  const toggleAllPanels = () => {
    const newState = !allPanelsHidden
    setAllPanelsHidden(newState)
    if (newState) {
      // Hide all
      setPanelVisibilityState({
        roomSettings: false,
        addParts: false,
        partsList: false,
        verbinders: false,
        spaces: false
      })
    } else {
      // Show default panels
      setPanelVisibilityState({
        roomSettings: true,
        addParts: true,
        partsList: true,
        verbinders: false,
        spaces: true
      })
    }
  }
  const [spaceParts, setSpaceParts] = useState([]) // Parts placed in spaces (drawers, shelves, hinges, handles)
  const [showBoreholes, setShowBoreholes] = useState(true)
  const [customPartTypes, setCustomPartTypes] = useState([])
  const [showPartTypeModal, setShowPartTypeModal] = useState(false)
  const [newPartType, setNewPartType] = useState({ name: '', maxWidth: 500, maxHeight: 200, maxDepth: 500, boreholes: [] })
  const [infoModal, setInfoModal] = useState({ show: false, title: '', message: '', type: 'success' })

  // Default part types that can be added to spaces
  const DEFAULT_SPACE_PART_TYPES = [
    { 
      id: 'drawer', 
      name: 'Drawer', 
      maxWidth: 500, 
      maxHeight: 200, 
      maxDepth: 500, 
      color: '#8B4513',
      boreholes: [
        { x: 20, y: 50, side: 'left' },
        { x: 20, y: 150, side: 'left' },
        { x: -20, y: 50, side: 'right' },
        { x: -20, y: 150, side: 'right' }
      ]
    },
    { 
      id: 'inner-shelf', 
      name: 'Inner Shelf', 
      maxWidth: 600, 
      maxHeight: 18, 
      maxDepth: 500, 
      color: '#DEB887',
      boreholes: [
        { x: 20, y: 0, side: 'left' },
        { x: -20, y: 0, side: 'right' }
      ]
    },
    { 
      id: 'hinge', 
      name: 'Hinge', 
      maxWidth: 50, 
      maxHeight: 80, 
      maxDepth: 20, 
      color: '#C0C0C0',
      boreholes: [
        { x: 25, y: 20, side: 'front' },
        { x: 25, y: 60, side: 'front' }
      ]
    },
    { 
      id: 'handle', 
      name: 'Handle', 
      maxWidth: 150, 
      maxHeight: 30, 
      maxDepth: 30, 
      color: '#708090',
      boreholes: [
        { x: 30, y: 15, side: 'front' },
        { x: 120, y: 15, side: 'front' }
      ]
    }
  ]

  const allPartTypes = [...DEFAULT_SPACE_PART_TYPES, ...customPartTypes]

  // Add a part to a space
  const addPartToSpace = (spaceId, partTypeId, position = { x: 0, y: 0, z: 0 }) => {
    const partType = allPartTypes.find(pt => pt.id === partTypeId)
    if (!partType) return
    
    const space = spaces.find(s => s.id === spaceId)
    if (!space) return
    
    const newPart = {
      id: `space-part-${Date.now()}`,
      spaceId,
      typeId: partTypeId,
      typeName: partType.name,
      x: position.x,
      y: position.y,
      z: position.z,
      width: Math.min(partType.maxWidth, space.width - 20),
      height: Math.min(partType.maxHeight, space.height - 20),
      depth: Math.min(partType.maxDepth, space.depth - 20),
      maxWidth: partType.maxWidth,
      maxHeight: partType.maxHeight,
      maxDepth: partType.maxDepth,
      color: partType.color,
      boreholes: partType.boreholes.map((bh, idx) => ({
        ...bh,
        id: `borehole-${Date.now()}-${idx}`,
        offsetX: 0,
        offsetY: 0
      }))
    }
    
    setSpaceParts(prev => [...prev, newPart])
  }

  // Update a space part
  const updateSpacePart = (partId, updates) => {
    setSpaceParts(prev => prev.map(p => p.id === partId ? { ...p, ...updates } : p))
  }

  // Delete a space part
  const deleteSpacePart = (partId) => {
    setSpaceParts(prev => prev.filter(p => p.id !== partId))
  }

  // Update borehole position
  const updateBorehole = (partId, boreholeId, updates) => {
    setSpaceParts(prev => prev.map(p => {
      if (p.id !== partId) return p
      return {
        ...p,
        boreholes: p.boreholes.map(bh => bh.id === boreholeId ? { ...bh, ...updates } : bh)
      }
    }))
  }

  // Meubel Verbinders (Furniture Connectors) System
  const [showVerbinders, setShowVerbinders] = useState(true)
  const [verbinderPattern, setVerbinderPattern] = useState({
    spacing: 200, // mm between verbinders (20cm)
    offsetFromEdge: 32, // mm from top/bottom edge (industry standard)
    offsetX: 0, // pattern offset adjustment
    offsetY: 0
  })
  const [verbinderOffsets, setVerbinderOffsets] = useState({}) // Individual verbinder position offsets
  const [draggingVerbinder, setDraggingVerbinder] = useState(null)
  const [verbinderDragStart, setVerbinderDragStart] = useState({ x: 0, y: 0 })

  // Calculate panel connections and generate verbinders
  const calculateVerbinders = () => {
    const verbinders = []
    const tolerance = 30 // mm tolerance for detecting connections
    
    // Find vertical panels (left, right, dividers)
    const verticalPanels = parts.filter(p => ['leftPanel', 'rightPanel', 'divider'].includes(p.type))
    // Find horizontal panels (top, bottom, shelves)
    const horizontalPanels = parts.filter(p => ['topPanel', 'bottomPanel', 'shelf'].includes(p.type))
    
    // Debug: if no parts, return empty
    if (parts.length === 0) return verbinders
    
    // For each vertical panel, find horizontal panels that connect to it
    verticalPanels.forEach(vPanel => {
      const vLeft = vPanel.x
      const vRight = vPanel.x + vPanel.w
      const vBottom = vPanel.y
      const vTop = vPanel.y + vPanel.h
      
      horizontalPanels.forEach(hPanel => {
        const hLeft = hPanel.x
        const hRight = hPanel.x + hPanel.w
        const hY = hPanel.y
        
        // Check if horizontal panel starts at or near the right edge of vertical panel
        // This handles: left panel (x=0, w=18) connecting to top/bottom (x=18)
        const leftEdgeDiff = Math.abs(hLeft - vRight)
        if (leftEdgeDiff < tolerance) {
          // Connection on the right side of vertical panel
          // Place verbinders along the depth at 32mm from front and back edges, then every 200mm
          const connectionDepth = Math.min(vPanel.d, hPanel.d)
          const edgeOffset = verbinderPattern.offsetFromEdge // 32mm from edge
          const spacing = verbinderPattern.spacing // 200mm spacing
          
          // Calculate positions: first at 32mm from front, last at 32mm from back
          const availableDepth = connectionDepth - 2 * edgeOffset
          const numVerbinders = Math.max(2, Math.floor(availableDepth / spacing) + 1)
          
          for (let i = 0; i < numVerbinders; i++) {
            const zPos = hPanel.z + edgeOffset + (i * availableDepth / Math.max(1, numVerbinders - 1))
            
            verbinders.push({
              id: `verbinder-${vPanel.id}-${hPanel.id}-r-${i}`,
              panel1Id: vPanel.id,
              panel2Id: hPanel.id,
              type: 'vertical-horizontal-right',
              x: vRight - 9, // 9mm into the vertical panel (center of 18mm panel)
              y: hY + hPanel.h / 2, // Center of horizontal panel height
              z: zPos,
              holes: [
                { face: 'front', x: zPos - hPanel.z, y: hY - vBottom + hPanel.h / 2, depth: 12 },
                { face: 'side', x: zPos - hPanel.z, y: hPanel.h / 2, depth: 25 }
              ]
            })
          }
        }
        
        // Check if horizontal panel ends at the left edge of vertical panel
        if (Math.abs(hRight - vLeft) < tolerance) {
          // Connection on the left side of vertical panel
          const connectionDepth = Math.min(vPanel.d, hPanel.d)
          const edgeOffset = verbinderPattern.offsetFromEdge
          const spacing = verbinderPattern.spacing
          
          const availableDepth = connectionDepth - 2 * edgeOffset
          const numVerbinders = Math.max(2, Math.floor(availableDepth / spacing) + 1)
          
          for (let i = 0; i < numVerbinders; i++) {
            const zPos = hPanel.z + edgeOffset + (i * availableDepth / Math.max(1, numVerbinders - 1))
            
            verbinders.push({
              id: `verbinder-${vPanel.id}-${hPanel.id}-l-${i}`,
              panel1Id: vPanel.id,
              panel2Id: hPanel.id,
              type: 'vertical-horizontal-left',
              x: vLeft + 9, // 9mm into the vertical panel
              y: hY + hPanel.h / 2,
              z: zPos,
              holes: [
                { face: 'front', x: zPos - hPanel.z, y: hY - vBottom + hPanel.h / 2, depth: 12 },
                { face: 'side', x: zPos - hPanel.z, y: hPanel.h / 2, depth: 25 }
              ]
            })
          }
        }
      })
    })
    
    return verbinders
  }
  
  const verbinders = calculateVerbinders()
  
  
  // Calculate enclosed spaces in the cabinet
  // A space is an area bounded by panels on at least 4 sides (left, right, top, bottom)
  const calculateSpaces = () => {
    const spaces = []
    
    // Find boundary panels
    const leftPanels = parts.filter(p => p.type === 'leftPanel')
    const rightPanels = parts.filter(p => p.type === 'rightPanel')
    const topPanels = parts.filter(p => p.type === 'topPanel')
    const bottomPanels = parts.filter(p => p.type === 'bottomPanel')
    const dividers = parts.filter(p => p.type === 'divider')
    const shelves = parts.filter(p => p.type === 'shelf')
    const backPanels = parts.filter(p => p.type === 'backPanel')
    
    // Get all vertical boundaries (left panel, right panel, dividers)
    const verticalBoundaries = [
      ...leftPanels.map(p => ({ x: p.x + p.w, type: 'left', panel: p })),
      ...rightPanels.map(p => ({ x: p.x, type: 'right', panel: p })),
      ...dividers.map(p => ({ x: p.x, type: 'divider-left', panel: p })),
      ...dividers.map(p => ({ x: p.x + p.w, type: 'divider-right', panel: p }))
    ].sort((a, b) => a.x - b.x)
    
    // Get all horizontal boundaries (top panel, bottom panel, shelves)
    const horizontalBoundaries = [
      ...bottomPanels.map(p => ({ y: p.y + p.h, type: 'bottom', panel: p })),
      ...topPanels.map(p => ({ y: p.y, type: 'top', panel: p })),
      ...shelves.map(p => ({ y: p.y, type: 'shelf-bottom', panel: p })),
      ...shelves.map(p => ({ y: p.y + p.h, type: 'shelf-top', panel: p }))
    ].sort((a, b) => a.y - b.y)
    
    // Calculate cabinet bounds
    const cabinetLeft = leftPanels.length > 0 ? Math.min(...leftPanels.map(p => p.x + p.w)) : 0
    const cabinetRight = rightPanels.length > 0 ? Math.max(...rightPanels.map(p => p.x)) : 600
    const cabinetBottom = bottomPanels.length > 0 ? Math.max(...bottomPanels.map(p => p.y + p.h)) : 0
    const cabinetTop = topPanels.length > 0 ? Math.min(...topPanels.map(p => p.y)) : 720
    const cabinetDepth = backPanels.length > 0 ? Math.min(...backPanels.map(p => p.z)) : 560
    
    // Create unique X positions for compartments
    const xPositions = [...new Set([
      cabinetLeft,
      ...dividers.map(p => p.x),
      ...dividers.map(p => p.x + p.w),
      cabinetRight
    ])].sort((a, b) => a - b)
    
    // Create unique Y positions for shelves
    const yPositions = [...new Set([
      cabinetBottom,
      ...shelves.map(p => p.y),
      ...shelves.map(p => p.y + p.h),
      cabinetTop
    ])].sort((a, b) => a - b)
    
    // Generate spaces from grid
    let spaceId = 1
    for (let i = 0; i < xPositions.length - 1; i++) {
      for (let j = 0; j < yPositions.length - 1; j++) {
        const x1 = xPositions[i]
        const x2 = xPositions[i + 1]
        const y1 = yPositions[j]
        const y2 = yPositions[j + 1]
        
        const width = x2 - x1
        const height = y2 - y1
        const depth = cabinetDepth
        
        // Only add if it's a meaningful space (not too small)
        if (width > 10 && height > 10) {
          spaces.push({
            id: `space-${spaceId++}`,
            x: x1,
            y: y1,
            width,
            height,
            depth,
            compartmentIndex: i,
            shelfIndex: j
          })
        }
      }
    }
    
    return spaces
  }
  
  const spaces = calculateSpaces()

  // Get all boreholes for visualization (must be after spaces is defined)
  const getAllBoreholes = () => {
    const boreholes = []
    
    // Add boreholes from space parts
    spaceParts.forEach(part => {
      const space = spaces.find(s => s.id === part.spaceId)
      if (!space) return
      
      part.boreholes.forEach(bh => {
        boreholes.push({
          ...bh,
          partId: part.id,
          source: 'spacePart',
          absoluteX: space.x + part.x + bh.x + (bh.offsetX || 0),
          absoluteY: space.y + part.y + bh.y + (bh.offsetY || 0),
          absoluteZ: part.z + (bh.z || 0)
        })
      })
    })
    
    // Add boreholes from verbinders
    verbinders.forEach(verbinder => {
      const offset = verbinderOffsets[verbinder.id] || { x: 0, y: 0 }
      verbinder.holes.forEach((hole, idx) => {
        boreholes.push({
          id: `${verbinder.id}-hole-${idx}`,
          verbinderId: verbinder.id,
          source: 'verbinder',
          face: hole.face,
          depth: hole.depth,
          absoluteX: verbinder.x + offset.x + (hole.x || 0),
          absoluteY: verbinder.y + offset.y + (hole.y || 0),
          absoluteZ: verbinder.z
        })
      })
    })
    
    return boreholes
  }

  const allBoreholes = getAllBoreholes()

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [savedDesigns, setSavedDesigns] = useState([])
  const [currentDesignId, setCurrentDesignId] = useState(null)

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.02 : 0.02
    setZoom(prev => Math.max(0.03, Math.min(0.5, prev + delta)))
  }

  const handleViewportMouseDown = (e) => {
    if (e.target.closest('.draggable-panel')) return
    
    if (e.button === 0 && e.shiftKey) {
      // Shift + Left click = Pan
      setIsDragging(true)
      setDragMode('pan')
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
    } else if (e.button === 0) {
      // Left click = Rotate
      setIsDragging(true)
      setDragMode('rotate')
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleViewportMouseMove = (e) => {
    if (!isDragging) return
    
    if (dragMode === 'pan') {
      setPanOffset({ 
        x: e.clientX - dragStart.x, 
        y: e.clientY - dragStart.y 
      })
    } else if (dragMode === 'rotate') {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      setViewAngle(prev => ({
        x: Math.max(-90, Math.min(90, prev.x + deltaY * 0.5)),
        y: prev.y + deltaX * 0.5
      }))
      setDragStart({ x: e.clientX, y: e.clientY })
    } else if (dragMode === 'cabinet') {
      // Simple incremental drag - update start position each frame for smooth movement
      const screenDeltaX = e.clientX - dragStart.x
      const screenDeltaY = e.clientY - dragStart.y
      
      // Scale factor for movement speed
      const moveScale = 3 / zoom
      
      // Direct mapping: screen X moves cabinet X, screen Y moves cabinet Z
      // Negate X to fix the inverted direction
      const worldDeltaX = -screenDeltaX * moveScale
      const worldDeltaZ = screenDeltaY * moveScale  // Positive screen Y = drag down = move cabinet forward (toward viewer)
      
      // Calculate cabinet bounding box based on rotation
      const cabinetW = parts.length > 0 ? Math.max(...parts.map(p => p.x + p.w)) : 600
      const cabinetD = parts.length > 0 ? Math.max(...parts.map(p => p.z + p.d)) : 560
      const effectiveW = cabinetRotation % 180 === 0 ? cabinetW : cabinetD
      const effectiveD = cabinetRotation % 180 === 0 ? cabinetD : cabinetW
      
      // Calculate new position from current position (incremental)
      // Cabinet position is relative to floor CENTER, so bounds are +/- half room size
      let newX = cabinetPosition.x + worldDeltaX
      let newZ = cabinetPosition.z + worldDeltaZ
      
      // Clamp to room bounds - position is relative to center
      // Cabinet can move from -(room.width/2 - cabinetW/2) to +(room.width/2 - cabinetW/2)
      const maxX = (room.width - effectiveW) / 2
      const maxZ = (room.depth - effectiveD) / 2
      newX = Math.max(-maxX, Math.min(maxX, newX))
      newZ = Math.max(-maxZ, Math.min(maxZ, newZ))
      
      setCabinetPosition(prev => ({ x: newX, y: prev.y, z: newZ }))
      // Update drag start for next frame (incremental movement)
      setDragStart({ x: e.clientX, y: e.clientY })
    } else if (dragMode === 'roomElement' && selectedRoomElement) {
      const deltaX = (e.clientX - dragStart.x) / zoom
      const newX = Math.max(0, Math.min(room.width - selectedRoomElement.w, roomElementDragStart.x + deltaX * 3))
      setRoom(prev => ({
        ...prev,
        elements: prev.elements.map(el => 
          el.id === selectedRoomElement.id ? { ...el, x: newX } : el
        )
      }))
    }
  }

  const handleViewportMouseUp = () => {
    setIsDragging(false)
    setDragMode(null)
  }

  const resetView = () => {
    setViewAngle({ x: 25, y: -35 })
    setPanOffset({ x: 0, y: 0 })
    setZoom(0.12)
  }

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await api.get('/designs/templates')
        setTemplates(response.data || [])
      } catch (error) {
        console.error('Error fetching templates:', error)
      }
    }
    fetchTemplates()
  }, [])

  const loadTemplate = (template) => {
    // Generate parts from template dimensions and configuration
    const width = parseFloat(template.baseWidth) || 600
    const height = parseFloat(template.baseHeight) || 720
    const depth = parseFloat(template.baseDepth) || 560
    const compartments = template.modelTemplate?.compartments || 1
    const shelves = template.modelTemplate?.shelves || 1
    
    const templateConfig = {
      width,
      height,
      depth,
      compartments,
      shelves,
      shareWalls: true
    }
    
    const newParts = generateCabinetFromTemplate(templateConfig, true)
    setParts(newParts)
    setHistory([newParts])
    setHistoryIndex(0)
    setDesignName(template.templateName)
    // Position cabinet inside the room
    setCabinetPosition({ x: 200, y: 0, z: 200 })
    setShowTemplateLibrary(false)
  }

  const categories = ['all', ...new Set(templates.map(t => t.category).filter(Boolean))]
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory)

  const [collisionMessage, setCollisionMessage] = useState(null)

  // Check for collisions between parts
  const checkCollisions = (partsToCheck, movingPartId = null) => {
    const newCollisions = []
    for (let i = 0; i < partsToCheck.length; i++) {
      for (let j = i + 1; j < partsToCheck.length; j++) {
        const a = partsToCheck[i]
        const b = partsToCheck[j]
        
        const collisionX = a.x < b.x + b.w && a.x + a.w > b.x
        const collisionY = a.y < b.y + b.h && a.y + a.h > b.y
        const collisionZ = a.z < b.z + b.d && a.z + a.d > b.z
        
        if (collisionX && collisionY && collisionZ) {
          const isValidConnection = 
            Math.abs((a.x + a.w) - b.x) < 2 || Math.abs((b.x + b.w) - a.x) < 2 ||
            Math.abs((a.y + a.h) - b.y) < 2 || Math.abs((b.y + b.h) - a.y) < 2 ||
            Math.abs((a.z + a.d) - b.z) < 2 || Math.abs((b.z + b.d) - a.z) < 2
          
          if (!isValidConnection) {
            const partAConfig = CABINET_PARTS[a.type]
            const partBConfig = CABINET_PARTS[b.type]
            newCollisions.push({ 
              partA: a.id, 
              partB: b.id,
              partAName: partAConfig?.name || a.type,
              partBName: partBConfig?.name || b.type,
              overlapX: Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x),
              overlapY: Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y),
              overlapZ: Math.min(a.z + a.d, b.z + b.d) - Math.max(a.z, b.z)
            })
          }
        }
      }
    }
    setCollisions(newCollisions)
    
    // Set collision message for user feedback
    if (newCollisions.length > 0 && movingPartId) {
      const relevantCollision = newCollisions.find(c => c.partA === movingPartId || c.partB === movingPartId)
      if (relevantCollision) {
        const otherPartName = relevantCollision.partA === movingPartId ? relevantCollision.partBName : relevantCollision.partAName
        setCollisionMessage({
          type: 'error',
          message: `Cannot place here: Colliding with "${otherPartName}" (overlap: ${Math.round(relevantCollision.overlapX)}×${Math.round(relevantCollision.overlapY)}×${Math.round(relevantCollision.overlapZ)}mm)`
        })
        setTimeout(() => setCollisionMessage(null), 3000)
      }
    }
    
    return newCollisions
  }

  const applyQuickTemplate = () => {
    const newParts = generateCabinetFromTemplate(quickTemplateConfig, quickTemplateConfig.shareWalls)
    setParts(newParts)
    setHistory([newParts])
    setHistoryIndex(0)
    setDesignName(`Cabinet ${quickTemplateConfig.width}×${quickTemplateConfig.height}×${quickTemplateConfig.depth}`)
    // Position cabinet inside the room (near back-left corner with some margin)
    setCabinetPosition({ x: 200, y: 0, z: 200 })
    // Reset selection and other states
    setSelectedPart(null)
    setSpaceParts([])
    setVerbinderOffsets({})
    setShowQuickTemplate(false)
  }

  const updatePart = (partId, updates) => {
    const newParts = parts.map(p => p.id === partId ? { ...p, ...updates } : p)
    const collisionResult = checkCollisions(newParts, partId)
    
    if (collisionResult.length === 0 || updates.openAngle !== undefined) {
      setParts(newParts)
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(newParts)
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
      setCollisionMessage(null)
    }
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setParts(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setParts(history[historyIndex + 1])
    }
  }

  const addPart = (type) => {
    const partConfig = CABINET_PARTS[type]
    const newPart = {
      id: `${type}-${Date.now()}`,
      type,
      x: 100, y: 100, z: 100,
      w: partConfig.defaultSize.w,
      h: partConfig.defaultSize.h,
      d: partConfig.defaultSize.d,
      rotation: 0,
      openAngle: type === 'door' ? 0 : undefined
    }
    const newParts = [...parts, newPart]
    setParts(newParts)
    setSelectedPart(newPart.id)
    
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newParts)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const deletePart = (partId) => {
    const newParts = parts.filter(p => p.id !== partId)
    setParts(newParts)
    setSelectedPart(null)
    
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newParts)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const addRoomElement = (type) => {
    const config = ROOM_ELEMENTS[type]
    const newElement = {
      id: `${type}-${Date.now()}`,
      type,
      x: type === 'light' ? room.width / 2 - 100 : room.width / 2 - config.defaultSize.w / 2,
      y: type === 'light' ? room.height - 50 : type === 'window' ? 900 : 0,
      z: type === 'light' ? room.depth / 2 - 100 : 0,
      w: config.defaultSize.w,
      h: config.defaultSize.h,
      d: config.defaultSize.d,
      wall: 'back'
    }
    setRoom({ ...room, elements: [...room.elements, newElement] })
  }

  const loadSavedDesigns = async () => {
    try {
      const designs = await api.get('/designs')
      if (Array.isArray(designs)) {
        setSavedDesigns(designs)
      }
    } catch (error) {
      console.error('Error loading designs:', error)
    }
  }

  const openSaveModal = () => {
    setShowSaveModal(true)
  }

  const openOpenModal = async () => {
    await loadSavedDesigns()
    setShowOpenModal(true)
  }

  const saveDesign = async (saveAsNew = false) => {
    setSaving(true)
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      let designerId = currentUser.id
      
      if (!designerId) {
        try {
          const response = await api.get('/users')
          // API returns array directly or wrapped in data property
          const userList = Array.isArray(response) ? response : (response?.data || response || [])
          console.log('Users fetched for designerId:', userList.length, 'users')
          const adminUser = userList.find(u => u.role === 'Admin') || userList.find(u => u.role === 'Designer') || userList[0]
          if (adminUser) {
            designerId = adminUser.id
            console.log('Using designerId:', designerId, 'from user:', adminUser.email)
          }
        } catch (e) {
          console.warn('Could not fetch users for designerId:', e)
        }
      }
      
      if (!designerId) {
        setInfoModal({ show: true, title: 'Error', message: 'Please log in to save designs', type: 'error' })
        setSaving(false)
        return
      }

      const designData = {
        name: designName,
        designerId,
        modelData: { parts, room, cabinetPosition, version: 1 },
        width: 600, height: 720, depth: 560,
        material: 'Oak', finish: 'Natural', status: 'Draft'
      }

      if (currentDesignId && !saveAsNew) {
        await api.updateDesign(currentDesignId, designData)
        setInfoModal({ show: true, title: 'Design Updated', message: `"${designName}" has been updated successfully!`, type: 'success' })
      } else {
        const result = await api.createDesign(designData)
        if (result && result.id) {
          setCurrentDesignId(result.id)
        }
        setInfoModal({ show: true, title: 'Design Saved', message: `"${designName}" has been saved successfully!`, type: 'success' })
      }
      setShowSaveModal(false)
    } catch (error) {
      setInfoModal({ show: true, title: 'Error', message: 'Failed to save: ' + error.message, type: 'error' })
    }
    setSaving(false)
  }

  const openDesign = async (design) => {
    try {
      setDesignName(design.name)
      setCurrentDesignId(design.id)
      
      // Parse modelData if it's a string
      let modelData = design.modelData
      if (typeof modelData === 'string') {
        try {
          modelData = JSON.parse(modelData)
        } catch (e) {
          console.error('Failed to parse modelData:', e)
          modelData = {}
        }
      }
      
      if (modelData && modelData.parts && modelData.parts.length > 0) {
        setParts(modelData.parts)
        setHistory([modelData.parts])
        setHistoryIndex(0)
      }
      if (modelData && modelData.room) {
        setRoom(modelData.room)
      }
      if (modelData && modelData.cabinetPosition) {
        setCabinetPosition(modelData.cabinetPosition)
      }
      
      setShowOpenModal(false)
      setInfoModal({ show: true, title: 'Design Loaded', message: `"${design.name}" has been loaded successfully!`, type: 'success' })
    } catch (error) {
      setInfoModal({ show: true, title: 'Error', message: 'Failed to load design: ' + error.message, type: 'error' })
    }
  }

  const openOrderModal = () => {
    if (parts.length === 0) {
      setInfoModal({ show: true, title: 'No Parts', message: 'No parts in design to create production order', type: 'warning' })
      return
    }
    setShowOrderModal(true)
  }

  const createProductionOrder = async () => {
    if (!orderForm.customerName.trim()) return
    setOrderCreating(true)
    try {
      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      let userId = currentUser.id
      
      // If no user logged in, try to get the admin user as fallback
      if (!userId) {
        try {
          const usersResponse = await api.get('/users')
          const users = Array.isArray(usersResponse) ? usersResponse : (usersResponse.data || [])
          const adminUser = users.find(u => u.role === 'Admin') || users[0]
          if (adminUser) {
            userId = adminUser.id
          }
        } catch (e) {
          console.warn('Could not fetch users for fallback')
        }
      }
      
      if (!userId) {
        throw new Error('Please log in to create orders')
      }
      
      // First, create a new design with the current parts
      // Add holes to each part for production
      const partsWithHoles = parts.map(part => {
        const partHoles = []
        const isVerticalPanel = ['leftPanel', 'rightPanel', 'divider'].includes(part.type)
        const isHorizontalPanel = ['topPanel', 'bottomPanel', 'shelf'].includes(part.type)
        
        // Add verbinder holes for this part
        verbinders.forEach(v => {
          const isPanel1 = v.panel1Id === part.id
          const isPanel2 = v.panel2Id === part.id
          
          if (isPanel1 || isPanel2) {
            // Determine which hole goes on which panel
            // panel1 is always the vertical panel, panel2 is the horizontal panel
            if (isPanel1 && isVerticalPanel) {
              // Vertical panel gets the front hole (drilled into the face)
              partHoles.push({
                id: `${v.id}-front`,
                type: 'verbinder',
                face: 'front',
                x: v.z - part.z, // Position along depth
                y: v.y - part.y, // Position along height
                depth: 12,
                diameter: 8
              })
            } else if (isPanel2 && isHorizontalPanel) {
              // Horizontal panel gets the side hole (drilled into the edge)
              partHoles.push({
                id: `${v.id}-side`,
                type: 'verbinder',
                face: 'side',
                x: v.z - part.z, // Position along depth
                y: 9, // Center of panel thickness (18/2)
                depth: 25,
                diameter: 8
              })
            }
          }
        })
        
        // Add space part boreholes that affect this panel
        spaceParts.forEach(sp => {
          const space = spaces.find(s => s.id === sp.spaceId)
          if (!space) return
          
          sp.boreholes.forEach(bh => {
            const absX = space.x + sp.x + bh.x + (bh.offsetX || 0)
            const absY = space.y + sp.y + bh.y + (bh.offsetY || 0)
            
            // Check if this borehole is on this part's surface
            if (absX >= part.x && absX <= part.x + part.w &&
                absY >= part.y && absY <= part.y + part.h) {
              partHoles.push({
                id: bh.id,
                type: 'borehole',
                face: bh.side,
                x: absX - part.x,
                y: absY - part.y,
                depth: 12,
                diameter: 5 // Standard borehole diameter
              })
            }
          })
        })
        
        return {
          ...part,
          holes: partHoles
        }
      })

      const designData = {
        name: designName,
        width: Math.max(...parts.map(p => p.x + p.w)),
        height: Math.max(...parts.map(p => p.y + p.h)),
        depth: Math.max(...parts.map(p => p.z + p.d)),
        material: 'Oak',
        finish: 'Natural',
        status: 'Approved',
        modelData: { 
          parts: partsWithHoles,
          spaceParts: spaceParts,
          verbinders: verbinders,
          verbinderPattern: verbinderPattern
        },
        designerId: userId
      }
      
      const newDesign = await api.createDesign(designData)
      
      // Create parts with QR codes for the design (include holes data)
      try {
        await api.createPartsWithQRCodes(newDesign.id, partsWithHoles)
      } catch (e) {
        console.warn('Failed to create parts with QR codes, continuing with order creation')
      }
      
      // Now create the production order with the new design
      const orderData = {
        orderNumber: `ORD-${Date.now()}`,
        customerName: orderForm.customerName,
        orderDate: new Date().toISOString().split('T')[0],
        dueDate: orderForm.dueDate,
        status: 'Pending',
        totalPanels: parts.length,
        completedPanels: 0,
        priority: orderForm.priority,
        notes: orderForm.notes || `Design: ${designName}. Parts: ${parts.map(p => CABINET_PARTS[p.type]?.name).join(', ')}`,
        designId: newDesign.id,
        createdBy: userId
      }
      
      await api.createOrder(orderData)
      
      setShowOrderModal(false)
      setOrderForm({ customerName: '', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], priority: 'Medium', notes: '' })
    } catch (error) {
      setInfoModal({ show: true, title: 'Error', message: `Failed to create order: ${error.message}`, type: 'error' })
    }
    setOrderCreating(false)
  }

  const generateBOM = () => {
    if (parts.length === 0) {
      setInfoModal({ show: true, title: 'No Parts', message: 'No parts in design to generate BOM', type: 'warning' })
      return
    }

    // Calculate material requirements
    const materialSummary = {}
    let totalArea = 0
    
    parts.forEach(part => {
      const config = CABINET_PARTS[part.type]
      const area = (part.w * part.h) / 1000000 // Convert to m²
      totalArea += area
      
      const material = part.type.includes('door') ? 'Door Panel' : 
                       part.type.includes('back') ? 'Back Panel (6mm)' : 
                       'Main Panel (18mm)'
      
      if (!materialSummary[material]) {
        materialSummary[material] = { count: 0, area: 0, parts: [] }
      }
      materialSummary[material].count++
      materialSummary[material].area += area
      materialSummary[material].parts.push({
        name: config.name,
        dimensions: `${part.w}×${part.h}×${part.d}mm`
      })
    })

    // Generate BOM text
    let bomText = `BILL OF MATERIALS\n`
    bomText += `================\n`
    bomText += `Design: ${designName}\n`
    bomText += `Date: ${new Date().toLocaleDateString()}\n`
    bomText += `Total Parts: ${parts.length}\n`
    bomText += `Total Area: ${totalArea.toFixed(3)} m²\n\n`
    
    bomText += `MATERIALS REQUIRED\n`
    bomText += `------------------\n`
    Object.entries(materialSummary).forEach(([material, data]) => {
      bomText += `\n${material}:\n`
      bomText += `  Quantity: ${data.count} pieces\n`
      bomText += `  Total Area: ${data.area.toFixed(3)} m²\n`
      bomText += `  Parts:\n`
      data.parts.forEach(p => {
        bomText += `    - ${p.name}: ${p.dimensions}\n`
      })
    })

    bomText += `\nHARDWARE REQUIRED\n`
    bomText += `------------------\n`
    const doorCount = parts.filter(p => p.type === 'door').length
    const shelfCount = parts.filter(p => p.type === 'shelf').length
    const drawerCount = parts.filter(p => p.type === 'drawer').length
    
    if (doorCount > 0) bomText += `  Soft Close Hinges: ${doorCount * 2} pcs\n`
    if (doorCount > 0) bomText += `  Door Handles: ${doorCount} pcs\n`
    if (shelfCount > 0) bomText += `  Shelf Supports: ${shelfCount * 4} pcs\n`
    if (drawerCount > 0) bomText += `  Drawer Slides: ${drawerCount} pairs\n`
    bomText += `  Meubel Verbinders: ${verbinders.length} pcs\n`
    bomText += `  Cam Locks: ${Math.ceil(parts.length * 1.5)} pcs\n`
    bomText += `  Dowels: ${parts.length * 4} pcs\n`

    // Add hole drilling information
    bomText += `\nDRILLING OPERATIONS\n`
    bomText += `-------------------\n`
    bomText += `Total Verbinder Holes: ${verbinders.length * 2} (front + side)\n`
    bomText += `Total Boreholes: ${allBoreholes.length}\n\n`
    
    bomText += `PART HOLE DETAILS\n`
    bomText += `-----------------\n`
    parts.forEach(part => {
      const config = CABINET_PARTS[part.type]
      const partVerbinders = verbinders.filter(v => v.panel1Id === part.id || v.panel2Id === part.id)
      const verbinderHoleCount = partVerbinders.length * 2
      
      // Count boreholes on this part
      let partBoreholes = 0
      spaceParts.forEach(sp => {
        const space = spaces.find(s => s.id === sp.spaceId)
        if (!space) return
        sp.boreholes.forEach(bh => {
          const absX = space.x + sp.x + bh.x + (bh.offsetX || 0)
          const absY = space.y + sp.y + bh.y + (bh.offsetY || 0)
          if (absX >= part.x && absX <= part.x + part.w &&
              absY >= part.y && absY <= part.y + part.h) {
            partBoreholes++
          }
        })
      })
      
      if (verbinderHoleCount > 0 || partBoreholes > 0) {
        bomText += `\n${config.name} (${part.w}×${part.h}×${part.d}mm):\n`
        if (verbinderHoleCount > 0) {
          bomText += `  Verbinder holes: ${verbinderHoleCount}\n`
          partVerbinders.forEach((v, idx) => {
            bomText += `    - V${idx + 1}: X=${Math.round(v.x - part.x)}mm, Y=${Math.round(v.y - part.y)}mm\n`
            bomText += `      Front: Ø8mm, 12mm deep\n`
            bomText += `      Side: Ø8mm, 25mm deep\n`
          })
        }
        if (partBoreholes > 0) {
          bomText += `  Boreholes: ${partBoreholes} (Ø5mm, 12mm deep)\n`
        }
      }
    })

    // Download as text file
    const blob = new Blob([bomText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `BOM_${designName.replace(/\s+/g, '_')}_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Generate CIX code (Biesse format) for CNC machines
  const generateCIX = () => {
    if (parts.length === 0) {
      setInfoModal({ show: true, title: 'No Parts', message: 'No parts in design to generate CIX code', type: 'warning' })
      return
    }

    let cixCode = `BEGIN ID CID3\n`
    cixCode += `REL= 5.0\n`
    cixCode += `[HEADER]\n`
    cixCode += `TYPE=PANEL\n`
    cixCode += `NAME="${designName}"\n`
    cixCode += `DATE=${new Date().toISOString().split('T')[0]}\n\n`

    parts.forEach((part, partIndex) => {
      const config = CABINET_PARTS[part.type]
      const partVerbinders = verbinders.filter(v => v.panel1Id === part.id || v.panel2Id === part.id)
      
      cixCode += `[PANEL_${partIndex + 1}]\n`
      cixCode += `NAME="${config.name}_${partIndex + 1}"\n`
      cixCode += `LPX=${part.w}\n`
      cixCode += `LPY=${part.h}\n`
      cixCode += `LPZ=${part.d}\n`
      cixCode += `MATERIAL="MDF_18"\n\n`
      
      // Add drilling operations
      cixCode += `[DRILLING]\n`
      let drillIndex = 1
      
      // Verbinder holes
      partVerbinders.forEach((v, vIdx) => {
        const relX = v.x - part.x
        const relY = v.y - part.y
        
        // Front hole (face 1)
        cixCode += `BV,${drillIndex},${relX.toFixed(1)},${relY.toFixed(1)},0,8,12,1,0,0\n`
        drillIndex++
        
        // Side hole (face 2 or 4 depending on direction)
        const sideOffset = v.holes[1].x
        cixCode += `BV,${drillIndex},${(relX + sideOffset).toFixed(1)},${relY.toFixed(1)},0,8,25,${sideOffset > 0 ? 2 : 4},0,0\n`
        drillIndex++
      })
      
      // Space part boreholes
      spaceParts.forEach(sp => {
        const space = spaces.find(s => s.id === sp.spaceId)
        if (!space) return
        
        sp.boreholes.forEach(bh => {
          const absX = space.x + sp.x + bh.x + (bh.offsetX || 0)
          const absY = space.y + sp.y + bh.y + (bh.offsetY || 0)
          
          if (absX >= part.x && absX <= part.x + part.w &&
              absY >= part.y && absY <= part.y + part.h) {
            const relX = absX - part.x
            const relY = absY - part.y
            const face = bh.side === 'front' ? 1 : bh.side === 'back' ? 3 : bh.side === 'left' ? 4 : bh.side === 'right' ? 2 : bh.side === 'top' ? 5 : 6
            cixCode += `BV,${drillIndex},${relX.toFixed(1)},${relY.toFixed(1)},0,5,12,${face},0,0\n`
            drillIndex++
          }
        })
      })
      
      cixCode += `\n`
    })

    cixCode += `END ID CID3\n`

    // Download CIX file
    const blob = new Blob([cixCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CNC_${designName.replace(/\s+/g, '_')}_${Date.now()}.cix`
    a.click()
    URL.revokeObjectURL(url)
    
    setInfoModal({ show: true, title: 'CIX Generated', message: `CIX code generated for ${parts.length} parts with all drilling operations`, type: 'success' })
  }

  // Generate G-code for standard CNC machines
  const generateGCode = () => {
    if (parts.length === 0) {
      setInfoModal({ show: true, title: 'No Parts', message: 'No parts in design to generate G-code', type: 'warning' })
      return
    }

    let gcode = `; G-code for ${designName}\n`
    gcode += `; Generated: ${new Date().toISOString()}\n`
    gcode += `; Total parts: ${parts.length}\n\n`
    gcode += `G21 ; Set units to millimeters\n`
    gcode += `G90 ; Absolute positioning\n`
    gcode += `G17 ; XY plane selection\n\n`

    parts.forEach((part, partIndex) => {
      const config = CABINET_PARTS[part.type]
      const partVerbinders = verbinders.filter(v => v.panel1Id === part.id || v.panel2Id === part.id)
      
      gcode += `; ========================================\n`
      gcode += `; Part ${partIndex + 1}: ${config.name}\n`
      gcode += `; Dimensions: ${part.w} x ${part.h} x ${part.d} mm\n`
      gcode += `; ========================================\n\n`
      
      gcode += `; Tool change - 8mm drill for verbinders\n`
      gcode += `M6 T1 ; 8mm drill bit\n`
      gcode += `S12000 ; Spindle speed\n`
      gcode += `M3 ; Spindle on\n\n`
      
      // Verbinder holes
      if (partVerbinders.length > 0) {
        gcode += `; Verbinder holes (8mm diameter)\n`
        partVerbinders.forEach((v, vIdx) => {
          const relX = v.x - part.x
          const relY = v.y - part.y
          
          // Front hole
          gcode += `G0 X${relX.toFixed(2)} Y${relY.toFixed(2)} Z5 ; Move to position V${vIdx + 1} front\n`
          gcode += `G1 Z-12 F500 ; Drill 12mm deep\n`
          gcode += `G0 Z5 ; Retract\n`
          
          // Side hole (simplified - actual implementation would need workpiece rotation)
          gcode += `; Side hole at offset ${v.holes[1].x}mm (requires workpiece rotation)\n`
        })
        gcode += `\n`
      }
      
      // Space part boreholes
      const partBoreholes = []
      spaceParts.forEach(sp => {
        const space = spaces.find(s => s.id === sp.spaceId)
        if (!space) return
        
        sp.boreholes.forEach(bh => {
          const absX = space.x + sp.x + bh.x + (bh.offsetX || 0)
          const absY = space.y + sp.y + bh.y + (bh.offsetY || 0)
          
          if (absX >= part.x && absX <= part.x + part.w &&
              absY >= part.y && absY <= part.y + part.h) {
            partBoreholes.push({
              x: absX - part.x,
              y: absY - part.y,
              side: bh.side
            })
          }
        })
      })
      
      if (partBoreholes.length > 0) {
        gcode += `; Tool change - 5mm drill for boreholes\n`
        gcode += `M6 T2 ; 5mm drill bit\n`
        gcode += `S12000\n`
        gcode += `M3\n\n`
        
        gcode += `; Boreholes (5mm diameter)\n`
        partBoreholes.forEach((bh, bhIdx) => {
          gcode += `G0 X${bh.x.toFixed(2)} Y${bh.y.toFixed(2)} Z5 ; Move to borehole ${bhIdx + 1} (${bh.side})\n`
          gcode += `G1 Z-12 F400 ; Drill 12mm deep\n`
          gcode += `G0 Z5 ; Retract\n`
        })
        gcode += `\n`
      }
      
      gcode += `M5 ; Spindle off\n`
      gcode += `G0 Z50 ; Safe height\n\n`
    })

    gcode += `; End of program\n`
    gcode += `M30 ; Program end\n`

    // Download G-code file
    const blob = new Blob([gcode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CNC_${designName.replace(/\s+/g, '_')}_${Date.now()}.nc`
    a.click()
    URL.revokeObjectURL(url)
    
    setInfoModal({ show: true, title: 'G-code Generated', message: `G-code generated for ${parts.length} parts with all drilling operations`, type: 'success' })
  }

  const getFilteredParts = () => {
    let filtered = parts
    
    // Filter by view mode
    switch (viewMode) {
      case 'doors': 
        filtered = parts.filter(p => p.type === 'door')
        break
      case 'shelves': 
        filtered = parts.filter(p => p.type === 'shelf')
        break
      case 'structure': 
        filtered = parts.filter(p => ['leftPanel', 'rightPanel', 'topPanel', 'bottomPanel', 'backPanel'].includes(p.type))
        break
      default: 
        filtered = parts
    }
    
    // Filter by panel visibility
    if (!panelVisibility.frontPanels) {
      filtered = filtered.filter(p => p.type !== 'door')
    }
    if (!panelVisibility.backPanels) {
      filtered = filtered.filter(p => p.type !== 'backPanel')
    }
    
    return filtered
  }

  const selectedPartData = parts.find(p => p.id === selectedPart)
  const hasCollisions = collisions.length > 0
  const filteredParts = getFilteredParts()
  const scale = zoom

  return (
    <div className="pt-14">
      <div className="flex justify-between items-center mb-4">
        <div>
          <input
            type="text"
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            className="text-2xl font-bold text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-amber-500 focus:outline-none"
          />
          <p className="text-gray-600">3D Cabinet Designer - Millimeter Precision</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowQuickTemplate(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors" title="Quick Cabinet Generator">
            <Box size={18} /> New Cabinet
          </button>
          <button onClick={() => setShowTemplateLibrary(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors" title="Template Library">
            <FolderOpen size={18} /> Templates
          </button>
          <button onClick={openOpenModal} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700" title="Open Design">
            <FolderOpen size={18} /> Open
          </button>
          <button onClick={undo} disabled={historyIndex <= 0} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50" title="Undo">
            <Undo size={20} />
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50" title="Redo">
            <Redo size={20} />
          </button>
          <button onClick={openSaveModal} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
            <Save size={18} /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={openOrderModal} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Factory size={18} /> Create Order
          </button>
          <button onClick={generateBOM} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <FileText size={18} /> BOM
          </button>
          <button onClick={generateCIX} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700" title="Generate CIX code for Biesse CNC">
            <Settings size={18} /> CIX
          </button>
          <button onClick={generateGCode} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700" title="Generate G-code for CNC">
            <Settings size={18} /> G-code
          </button>
        </div>
      </div>

      {hasCollisions && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={20} />
            <span className="font-semibold">Collision detected! Parts are overlapping.</span>
          </div>
          <div className="text-sm space-y-1">
            {collisions.map((collision, idx) => (
              <div key={idx} className="flex items-center gap-2 pl-7">
                <span>• "{collision.partAName}" overlaps with "{collision.partBName}"</span>
                <span className="text-xs text-red-500">
                  ({Math.round(collision.overlapX)}×{Math.round(collision.overlapY)}×{Math.round(collision.overlapZ)}mm)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {collisionMessage && (
        <div className="mb-4 p-3 bg-orange-100 text-orange-700 rounded-lg flex items-center gap-2 animate-pulse">
          <AlertTriangle size={20} />
          <span>{collisionMessage.message}</span>
        </div>
      )}

      {/* View Controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* 2D/3D Toggle Button */}
        <button 
          onClick={() => setIs2DMode(!is2DMode)} 
          className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow font-medium transition-all ${
            is2DMode 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-amber-600 text-white hover:bg-amber-700'
          }`}
          title={is2DMode ? 'Switch to 3D View' : 'Switch to 2D View'}
        >
          {is2DMode ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          {is2DMode ? '2D Mode' : '3D Mode'}
        </button>

        {/* Panel Visibility Controls (for both 2D and 3D) */}
        <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow">
          <button 
            onClick={() => setPanelVisibility(prev => ({ ...prev, frontPanels: !prev.frontPanels }))} 
            className={`px-3 py-2 rounded text-xs font-medium ${panelVisibility.frontPanels ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`} 
            title="Toggle Front Panels (Doors)"
          >
            {panelVisibility.frontPanels ? <Eye size={14} className="inline mr-1" /> : <EyeOff size={14} className="inline mr-1" />}
            Front
          </button>
          <button 
            onClick={() => setPanelVisibility(prev => ({ ...prev, backPanels: !prev.backPanels }))} 
            className={`px-3 py-2 rounded text-xs font-medium ${panelVisibility.backPanels ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`} 
            title="Toggle Back Panels"
          >
            {panelVisibility.backPanels ? <Eye size={14} className="inline mr-1" /> : <EyeOff size={14} className="inline mr-1" />}
            Back
          </button>
          <button 
            onClick={() => setShowSpaces(!showSpaces)} 
            className={`px-3 py-2 rounded text-xs font-medium ${showSpaces ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'}`} 
            title="Toggle Space Dimensions"
          >
            {showSpaces ? <Eye size={14} className="inline mr-1" /> : <EyeOff size={14} className="inline mr-1" />}
            Spaces ({spaces.length})
          </button>
          <button 
            onClick={() => setShowBoreholes(!showBoreholes)} 
            className={`px-3 py-2 rounded text-xs font-medium ${showBoreholes ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-400'}`} 
            title="Toggle Boreholes"
          >
            {showBoreholes ? <Eye size={14} className="inline mr-1" /> : <EyeOff size={14} className="inline mr-1" />}
            Boreholes ({allBoreholes.length})
          </button>
          <button 
            onClick={() => setShowVerbinders(!showVerbinders)} 
            className={`px-3 py-2 rounded text-xs font-medium ${showVerbinders ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`} 
            title="Toggle Meubel Verbinders"
          >
            {showVerbinders ? <Eye size={14} className="inline mr-1" /> : <EyeOff size={14} className="inline mr-1" />}
            Verbinders ({verbinders.length})
          </button>
        </div>

        <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow">
          <button onClick={() => setShowRoom(!showRoom)} className={`p-2 rounded ${showRoom ? 'bg-amber-100 text-amber-700' : 'text-gray-500'}`} title="Toggle Room">
            <Square size={18} />
          </button>
          <button onClick={() => setShowGrid(!showGrid)} className={`p-2 rounded ${showGrid ? 'bg-amber-100 text-amber-700' : 'text-gray-500'}`} title="Toggle Grid">
            <Grid size={18} />
          </button>
          <button onClick={() => setShowRulers(!showRulers)} className={`p-2 rounded ${showRulers ? 'bg-amber-100 text-amber-700' : 'text-gray-500'}`} title="Toggle Rulers">
            <Ruler size={18} />
          </button>
          <button onClick={() => setShowDimensions(!showDimensions)} className={`p-2 rounded ${showDimensions ? 'bg-amber-100 text-amber-700' : 'text-gray-500'}`} title="Toggle Dimensions">
            {showDimensions ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button onClick={() => setShowFaceLabels(!showFaceLabels)} className={`p-2 rounded ${showFaceLabels ? 'bg-amber-100 text-amber-700' : 'text-gray-500'}`} title="Toggle Face Labels (F/B/L/R/T/Bo)">
            <span className="text-xs font-bold">F</span>
          </button>
        </div>
        <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="px-3 py-2 bg-white rounded-lg shadow text-sm">
          <option value="all">All Parts</option>
          <option value="structure">Structure Only</option>
          <option value="doors">Doors Only</option>
          <option value="shelves">Shelves Only</option>
        </select>
        <div className="flex items-center gap-2 bg-white rounded-lg p-2 shadow">
          <span className="text-xs text-gray-500">Zoom:</span>
          <input type="range" min="0.03" max="0.5" step="0.01" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-24" />
          <span className="text-xs text-gray-600">{Math.round(zoom * 1000)}%</span>
        </div>
        <button onClick={resetView} className="px-3 py-2 bg-white rounded-lg shadow text-sm hover:bg-gray-50">Reset View</button>
        <div className="bg-white/80 rounded-lg px-3 py-2 text-xs text-gray-500">
          <span className="font-medium">Controls:</span> Drag to rotate • Shift+Drag to pan • Scroll to zoom
        </div>
      </div>

      <div className="relative">
        {/* Left Vertical Toolbar - inside viewport */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-40 bg-gray-800 rounded-lg shadow-lg p-2 flex flex-col gap-2">
          <button
            onClick={toggleAllPanels}
            className={`p-2 rounded-lg transition-colors ${allPanelsHidden ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
            title={allPanelsHidden ? 'Show All Panels' : 'Hide All Panels'}
          >
            {allPanelsHidden ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
          
          <div className="border-t border-gray-600 my-1" />
          
          <button
            onClick={() => togglePanel('roomSettings')}
            className={`p-2 rounded-lg transition-colors ${panelVisibilityState.roomSettings ? 'bg-amber-500 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
            title="Room Settings"
          >
            <Square size={20} />
          </button>
          
          <button
            onClick={() => togglePanel('addParts')}
            className={`p-2 rounded-lg transition-colors ${panelVisibilityState.addParts ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
            title="Add Parts"
          >
            <Plus size={20} />
          </button>
          
          <button
            onClick={() => togglePanel('partsList')}
            className={`p-2 rounded-lg transition-colors ${panelVisibilityState.partsList ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
            title="Parts List"
          >
            <Layers size={20} />
          </button>
          
          <button
            onClick={() => togglePanel('verbinders')}
            className={`p-2 rounded-lg transition-colors ${panelVisibilityState.verbinders ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
            title="Verbinder Settings"
          >
            <Settings size={20} />
          </button>
          
          <button
            onClick={() => togglePanel('spaces')}
            className={`p-2 rounded-lg transition-colors ${panelVisibilityState.spaces ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
            title="Spaces"
          >
            <Box size={20} />
          </button>
        </div>

        {/* 2D/3D Viewport - Full Width */}
        <div className="bg-white rounded-xl shadow-md p-4">
          {/* 2D Mode View */}
          {is2DMode ? (
            <div 
              className={`bg-gradient-to-b from-gray-100 to-gray-50 rounded-lg h-[calc(100vh-280px)] min-h-[500px] overflow-hidden relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onWheel={handleWheel}
              onMouseDown={(e) => {
                if (e.target.closest('.draggable-panel')) return
                if (e.target.closest('.cabinet-part-2d')) return // Don't pan when clicking on parts
                // Left click to pan in 2D mode (middle click or right click also works)
                if (e.button === 0 || e.button === 1 || e.button === 2) {
                  setIsDragging(true)
                  setDragMode('pan')
                  setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
                }
              }}
              onMouseMove={(e) => {
                // Handle verbinder dragging
                if (draggingVerbinder) {
                  const scaleFactor = zoom * 8
                  const deltaX = (e.clientX - verbinderDragStart.x) / scaleFactor
                  const deltaY = -(e.clientY - verbinderDragStart.y) / scaleFactor
                  setVerbinderOffsets(prev => ({
                    ...prev,
                    [draggingVerbinder]: {
                      x: verbinderDragStart.offsetX + deltaX,
                      y: verbinderDragStart.offsetY + deltaY
                    }
                  }))
                  return
                }
                
                if (!isDragging) return
                if (dragMode === 'pan') {
                  setPanOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
                } else if (dragMode === 'panel2D' && selectedPart) {
                  const selectedPartData = parts.find(p => p.id === selectedPart)
                  if (!selectedPartData) return
                  
                  const isVerticalPanel = ['leftPanel', 'rightPanel', 'divider'].includes(selectedPartData.type)
                  const isHorizontalPanel = ['topPanel', 'bottomPanel', 'shelf'].includes(selectedPartData.type)
                  
                  const scaleFactor = zoom * 8
                  const deltaX = (e.clientX - panel2DDragStart.x) / scaleFactor
                  const deltaY = -(e.clientY - panel2DDragStart.y) / scaleFactor // Invert Y for bottom-up coordinate
                  
                  if (isVerticalPanel) {
                    // Only allow horizontal movement for vertical panels
                    const newX = Math.max(0, panel2DDragStart.partX + deltaX)
                    const roundedNewX = Math.round(newX)
                    const panelThickness = selectedPartData.w
                    const oldX = panel2DDragStart.partX
                    const xDiff = roundedNewX - oldX
                    
                    // Update the vertical panel position
                    updatePart(selectedPart, { x: roundedNewX })
                    
                    // Resize horizontal panels to fit the new vertical panel position
                    const isLeftSide = selectedPartData.type === 'leftPanel'
                    const isRightSide = selectedPartData.type === 'rightPanel'
                    const isDividerPanel = selectedPartData.type === 'divider'
                    
                    parts.forEach(p => {
                      if (p.id === selectedPart) return
                      const isHorizPart = ['topPanel', 'bottomPanel', 'shelf', 'backPanel'].includes(p.type)
                      
                      if (isHorizPart) {
                        const panelLeftEdge = p.x
                        const panelRightEdge = p.x + p.w
                        const oldVerticalLeft = oldX
                        const oldVerticalRight = oldX + panelThickness
                        const newVerticalLeft = roundedNewX
                        const newVerticalRight = roundedNewX + panelThickness
                        
                        if (isLeftSide) {
                          // Left panel moved: horizontal panels that start at or near the old left panel edge
                          // should move their start position and adjust width
                          if (Math.abs(panelLeftEdge - oldVerticalRight) < 25) {
                            const newStartX = newVerticalRight
                            const newWidth = Math.max(50, panelRightEdge - newStartX)
                            updatePart(p.id, { x: newStartX, w: newWidth })
                          }
                        } else if (isRightSide) {
                          // Right panel moved: horizontal panels that end at or near the old right panel edge
                          // should adjust their width
                          if (Math.abs(panelRightEdge - oldVerticalLeft) < 25) {
                            const newWidth = Math.max(50, newVerticalLeft - panelLeftEdge)
                            updatePart(p.id, { w: newWidth })
                          }
                        } else if (isDividerPanel) {
                          // Divider moved: resize panels that touch the divider on either side
                          // Panel ends at the divider's left edge
                          if (Math.abs(panelRightEdge - oldVerticalLeft) < 25) {
                            const newWidth = Math.max(50, newVerticalLeft - panelLeftEdge)
                            updatePart(p.id, { w: newWidth })
                          }
                          // Panel starts at the divider's right edge
                          else if (Math.abs(panelLeftEdge - oldVerticalRight) < 25) {
                            const newStartX = newVerticalRight
                            const newWidth = Math.max(50, panelRightEdge - newStartX)
                            updatePart(p.id, { x: newStartX, w: newWidth })
                          }
                        }
                      }
                    })
                  } else if (isHorizontalPanel) {
                    // Only allow vertical movement for horizontal panels
                    const newY = Math.max(0, panel2DDragStart.partY + deltaY)
                    const roundedNewY = Math.round(newY)
                    const oldY = selectedPartData.y
                    const yDiff = roundedNewY - oldY
                    
                    updatePart(selectedPart, { y: roundedNewY })
                    
                    // Scale vertical panels that are connected to this horizontal panel
                    if (yDiff !== 0) {
                      const isTopPanel = selectedPartData.type === 'topPanel'
                      const isBottomPanel = selectedPartData.type === 'bottomPanel'
                      const isShelfPanel = selectedPartData.type === 'shelf'
                      
                      parts.forEach(p => {
                        if (p.id === selectedPart) return
                        const isVertPart = ['leftPanel', 'rightPanel', 'divider'].includes(p.type)
                        
                        if (isVertPart) {
                          // If moving bottom panel up, shrink vertical panels from bottom
                          if (isBottomPanel) {
                            const newHeight = Math.max(50, p.h - yDiff)
                            const newPosY = p.y + yDiff
                            updatePart(p.id, { y: Math.max(0, newPosY), h: newHeight })
                          }
                          // If moving top panel down, shrink vertical panels from top
                          else if (isTopPanel) {
                            const newHeight = Math.max(50, p.h + yDiff)
                            updatePart(p.id, { h: newHeight })
                          }
                        }
                      })
                    }
                  }
                }
              }}
              onMouseUp={() => {
                handleViewportMouseUp()
                setDraggingVerbinder(null)
              }}
              onMouseLeave={() => {
                handleViewportMouseUp()
                setDraggingVerbinder(null)
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* 2D View Controls */}
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                <div className="bg-white rounded-lg shadow-lg p-2">
                  <label className="text-xs text-gray-500 block mb-1">Rotation</label>
                  <div className="flex gap-1">
                    {[0, 90, 180, 270].map(angle => (
                      <button
                        key={angle}
                        onClick={() => setView2DRotation(angle)}
                        className={`px-2 py-1 text-xs rounded ${view2DRotation === angle ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        {angle}°
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2D Canvas */}
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px)`
                }}
              >
                <div 
                  style={{
                    transform: `scale(${zoom * 8}) rotate(${view2DRotation}deg)`,
                    transformOrigin: 'center center'
                  }}
                >
                  {/* Grid background */}
                  {showGrid && (
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        width: '1000px',
                        height: '1000px',
                        marginLeft: '-500px',
                        marginTop: '-500px',
                        backgroundImage: 'repeating-linear-gradient(0deg, #ddd 0, #ddd 1px, transparent 1px, transparent 50px), repeating-linear-gradient(90deg, #ddd 0, #ddd 1px, transparent 1px, transparent 50px)',
                        backgroundSize: '50px 50px',
                        opacity: 0.5
                      }}
                    />
                  )}
                  
                  {/* Cabinet parts in 2D (front view - X/Y plane) */}
                  {filteredParts.map((part) => {
                    const config = CABINET_PARTS[part.type]
                    const isSelected = selectedPart === part.id
                    const isVerticalPanel = ['leftPanel', 'rightPanel', 'divider'].includes(part.type)
                    const isHorizontalPanel = ['topPanel', 'bottomPanel', 'shelf'].includes(part.type)
                    
                    return (
                      <div
                        key={part.id}
                        onClick={() => setSelectedPart(part.id)}
                        onMouseDown={(e) => {
                          if (isVerticalPanel || isHorizontalPanel) {
                            e.stopPropagation()
                            setSelectedPart(part.id)
                            setIsDragging(true)
                            setDragMode('panel2D')
                            setPanel2DDragStart({ x: e.clientX, y: e.clientY, partX: part.x, partY: part.y })
                          }
                        }}
                        className={`cabinet-part-2d absolute transition-all ${
                          isVerticalPanel ? 'cursor-ew-resize' : 
                          isHorizontalPanel ? 'cursor-ns-resize' : 
                          'cursor-pointer'
                        } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:ring-2 hover:ring-blue-300'}`}
                        style={{
                          left: `${part.x}px`,
                          bottom: `${part.y}px`,
                          width: `${part.w}px`,
                          height: `${part.h}px`,
                          backgroundColor: config.color,
                          border: `1px solid ${isSelected ? '#3b82f6' : 'rgba(0,0,0,0.3)'}`,
                          boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.5)' : '1px 1px 3px rgba(0,0,0,0.2)',
                          zIndex: isSelected ? 100 : (part.type === 'door' ? 50 : 10)
                        }}
                        title={`${config.name}: ${part.w}×${part.h}×${part.d}mm\n${isVerticalPanel ? 'Drag left/right to move' : isHorizontalPanel ? 'Drag up/down to move' : ''}`}
                      >
                        {/* Part label */}
                        {showDimensions && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[8px] text-white bg-black/50 px-1 rounded">
                              {part.w}×{part.h}
                            </span>
                          </div>
                        )}
                        
                        {/* Drag handles for panels in 2D mode */}
                        {isSelected && isVerticalPanel && (
                          <div className="absolute inset-y-0 -left-3 w-3 flex items-center justify-center cursor-ew-resize bg-blue-500/50 rounded-l">
                            <ArrowLeftRight size={10} className="text-white" />
                          </div>
                        )}
                        {isSelected && isHorizontalPanel && (
                          <div className="absolute inset-x-0 -bottom-3 h-3 flex items-center justify-center cursor-ns-resize bg-blue-500/50 rounded-b">
                            <ArrowUpDown size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                  
                  {/* Spaces visualization in 2D */}
                  {showSpaces && spaces.map((space) => (
                    <div
                      key={space.id}
                      className="absolute cursor-pointer hover:bg-purple-200/30 transition-colors"
                      style={{
                        left: `${space.x}px`,
                        bottom: `${space.y}px`,
                        width: `${space.width}px`,
                        height: `${space.height}px`,
                        backgroundColor: selectedSpace === space.id ? 'rgba(147, 51, 234, 0.2)' : 'rgba(147, 51, 234, 0.1)',
                        border: selectedSpace === space.id ? '2px solid rgba(147, 51, 234, 0.8)' : '1px dashed rgba(147, 51, 234, 0.5)',
                        zIndex: 5
                      }}
                      onClick={() => setSelectedSpace(space.id)}
                      onDoubleClick={() => {
                        setSelectedSpace(space.id)
                        setShowSpaceModal(true)
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-purple-600/90 text-white text-[7px] px-1 py-0.5 rounded shadow-sm">
                          <div className="font-bold">{space.width}×{space.height}×{space.depth}</div>
                          <div className="text-purple-200 text-center">mm (dbl-click)</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Boreholes visualization in 2D */}
                  {showBoreholes && allBoreholes.map((bh) => (
                    <div
                      key={bh.id}
                      className="absolute rounded-full cursor-move"
                      style={{
                        left: `${bh.absoluteX - 3}px`,
                        bottom: `${bh.absoluteY - 3}px`,
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#333',
                        border: '1px solid #000',
                        zIndex: 200,
                        boxShadow: '0 0 2px rgba(0,0,0,0.5)'
                      }}
                      title={`Borehole - ${bh.side} side\nDrag to move`}
                    />
                  ))}
                  
                  {/* Space parts visualization in 2D */}
                  {spaceParts.map((part) => {
                    const space = spaces.find(s => s.id === part.spaceId)
                    if (!space) return null
                    
                    return (
                      <div
                        key={part.id}
                        className="absolute border-2 border-dashed"
                        style={{
                          left: `${space.x + part.x}px`,
                          bottom: `${space.y + part.y}px`,
                          width: `${part.width}px`,
                          height: `${part.height}px`,
                          backgroundColor: `${part.color}40`,
                          borderColor: part.color,
                          zIndex: 15
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[8px] font-medium bg-white/80 px-1 rounded">
                            {part.typeName}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Verbinders visualization in 2D */}
                  {showVerbinders && verbinders.map((verbinder) => {
                    const offset = verbinderOffsets[verbinder.id] || { x: 0, y: 0 }
                    return (
                      <div
                        key={verbinder.id}
                        className="absolute cursor-move verbinder-2d"
                        style={{
                          left: `${verbinder.x + offset.x - 8}px`,
                          bottom: `${verbinder.y + offset.y - 8}px`,
                          width: '16px',
                          height: '16px',
                          zIndex: 250
                        }}
                        title={`Meubel Verbinder\nType: ${verbinder.type}\nDrag to move`}
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          setDraggingVerbinder(verbinder.id)
                          setVerbinderDragStart({ 
                            x: e.clientX, 
                            y: e.clientY,
                            offsetX: offset.x,
                            offsetY: offset.y
                          })
                        }}
                      >
                        {/* Verbinder symbol - two connected holes */}
                        <div className="relative w-full h-full">
                          {/* Front hole */}
                          <div 
                            className="absolute rounded-full bg-orange-500 border border-orange-700"
                            style={{
                              width: '6px',
                              height: '6px',
                              left: '2px',
                              top: '5px'
                            }}
                          />
                          {/* Side hole */}
                          <div 
                            className="absolute rounded-full bg-orange-300 border border-orange-500"
                            style={{
                              width: '6px',
                              height: '6px',
                              right: '2px',
                              top: '5px'
                            }}
                          />
                          {/* Connection line */}
                          <div 
                            className="absolute bg-orange-400"
                            style={{
                              width: '4px',
                              height: '2px',
                              left: '6px',
                              top: '7px'
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 2D View info */}
              <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg p-3 shadow">
                <p className="text-sm font-medium text-blue-600">2D Front View</p>
                <p className="text-xs text-gray-500">Rotation: {view2DRotation}° • Zoom: {Math.round(zoom * 800)}%</p>
                <p className="text-xs text-gray-400 mt-1">Shift+Drag to pan • Scroll to zoom</p>
                <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                  <p><ArrowLeftRight size={12} className="inline mr-1" /> Vertical panels: drag left/right</p>
                  <p><ArrowUpDown size={12} className="inline mr-1" /> Horizontal panels: drag up/down</p>
                </div>
              </div>

              {/* Info panel */}
              <div className="absolute top-2 right-2 bg-white/90 rounded p-2 text-xs">
                <p>Cabinet Parts: {filteredParts.length}</p>
                <p className="text-blue-600 font-medium">2D Mode Active</p>
              </div>
            </div>
          ) : (
          /* 3D Mode View */
          <div 
            className={`bg-gradient-to-b from-sky-200 to-sky-100 rounded-lg h-[calc(100vh-280px)] min-h-[500px] overflow-hidden relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ perspective: '2000px' }}
            onWheel={handleWheel}
            onMouseDown={handleViewportMouseDown}
            onMouseMove={handleViewportMouseMove}
            onMouseUp={handleViewportMouseUp}
            onMouseLeave={handleViewportMouseUp}
            onContextMenu={(e) => e.preventDefault()}
          >
            
            {/* Rulers */}
            {showRulers && (
              <>
                <div className="absolute top-0 left-12 right-0 h-6 bg-white/80 flex items-end border-b">
                  {[...Array(Math.ceil(room.width / 500))].map((_, i) => (
                    <div key={i} className="flex-shrink-0" style={{ width: `${500 * scale}px` }}>
                      <span className="text-[10px] text-gray-500">{i * 500}mm</span>
                    </div>
                  ))}
                </div>
                <div className="absolute top-6 left-0 bottom-0 w-12 bg-white/80 flex flex-col items-end border-r">
                  {[...Array(Math.ceil(room.height / 500))].map((_, i) => (
                    <div key={i} className="flex-shrink-0 pr-1" style={{ height: `${500 * scale}px` }}>
                      <span className="text-[10px] text-gray-500">{i * 500}mm</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) rotateX(${viewAngle.x}deg) rotateY(${viewAngle.y}deg)`,
                transformStyle: 'preserve-3d',
                marginTop: showRulers ? '24px' : '0',
                marginLeft: showRulers ? '48px' : '0'
              }}
            >
              {/* Room with visibility controls
                  Coordinate system: 0,0,0 is back-left corner at floor level
                  X = width (left to right), Y = height (floor to ceiling), Z = depth (back to front)
                  CSS 3D: positive X is right, positive Y is down, positive Z is toward viewer
                  So we need to flip Y (negate it) to match our coordinate system
              */}
              {showRoom && (
                <div style={{ 
                  transformStyle: 'preserve-3d', 
                  position: 'absolute',
                  // Offset so room center is at origin for rotation
                  transform: `translate3d(${-room.width * scale / 2}px, ${room.height * scale / 2}px, ${-room.depth * scale / 2}px)`
                }}>
                  {/* Floor - horizontal plane at y=0 (bottom) */}
                  {wallVisibility.floor && (
                    <div
                      style={{
                        position: 'absolute',
                        width: `${room.width * scale}px`,
                        height: `${room.depth * scale}px`,
                        backgroundColor: room.floorColor,
                        opacity: 0.85,
                        transform: `rotateX(-90deg)`,
                        transformOrigin: 'top left',
                        backgroundImage: showGrid ? 'repeating-linear-gradient(0deg, #ccc 0, #ccc 1px, transparent 1px, transparent 100px), repeating-linear-gradient(90deg, #ccc 0, #ccc 1px, transparent 1px, transparent 100px)' : 'none',
                        backgroundSize: `${100 * scale}px ${100 * scale}px`
                      }}
                    >
                      <div style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: '#666', background: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: '3px' }}>
                        {room.width}mm × {room.depth}mm
                      </div>
                    </div>
                  )}
                  {/* Ceiling - horizontal plane at y=room.height (top) */}
                  {wallVisibility.ceiling && (
                    <div
                      style={{
                        position: 'absolute',
                        width: `${room.width * scale}px`,
                        height: `${room.depth * scale}px`,
                        backgroundColor: '#FAFAFA',
                        opacity: 0.4,
                        transform: `translateY(${-room.height * scale}px) rotateX(-90deg)`,
                        transformOrigin: 'top left',
                        border: '1px solid #ddd'
                      }}
                    />
                  )}
                  {/* Back wall - vertical plane at z=0 */}
                  {wallVisibility.backWall && (
                    <div
                      style={{
                        position: 'absolute',
                        width: `${room.width * scale}px`,
                        height: `${room.height * scale}px`,
                        backgroundColor: room.wallColor,
                        opacity: 0.85,
                        transform: `translateY(${-room.height * scale}px)`,
                        transformOrigin: 'top left',
                        border: '1px solid #ddd'
                      }}
                    >
                      <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', fontSize: '11px', color: '#555', background: 'rgba(255,255,255,0.9)', padding: '3px 8px', borderRadius: '4px', fontWeight: '500' }}>
                        {room.width}mm
                      </div>
                      <div style={{ position: 'absolute', top: '50%', left: 10, transform: 'translateY(-50%)', fontSize: '11px', color: '#555', background: 'rgba(255,255,255,0.9)', padding: '3px 8px', borderRadius: '4px', fontWeight: '500' }}>
                        {room.height}mm
                      </div>
                    </div>
                  )}
                  {/* Left wall - vertical plane at x=0 */}
                  {wallVisibility.leftWall && (
                    <div
                      style={{
                        position: 'absolute',
                        width: `${room.depth * scale}px`,
                        height: `${room.height * scale}px`,
                        backgroundColor: '#ECECEC',
                        opacity: 0.75,
                        transform: `translateY(${-room.height * scale}px) rotateY(90deg)`,
                        transformOrigin: 'top left',
                        border: '1px solid #ddd'
                      }}
                    >
                      <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', fontSize: '11px', color: '#555', background: 'rgba(255,255,255,0.9)', padding: '3px 8px', borderRadius: '4px', fontWeight: '500' }}>
                        {room.depth}mm
                      </div>
                    </div>
                  )}
                  {/* Right wall - vertical plane at x=room.width */}
                  {wallVisibility.rightWall && (
                    <div
                      style={{
                        position: 'absolute',
                        width: `${room.depth * scale}px`,
                        height: `${room.height * scale}px`,
                        backgroundColor: '#E8E8E8',
                        opacity: 0.75,
                        transform: `translateX(${room.width * scale}px) translateY(${-room.height * scale}px) rotateY(90deg)`,
                        transformOrigin: 'top left',
                        border: '1px solid #ddd'
                      }}
                    >
                      <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', fontSize: '11px', color: '#555', background: 'rgba(255,255,255,0.9)', padding: '3px 8px', borderRadius: '4px', fontWeight: '500' }}>
                        {room.depth}mm
                      </div>
                    </div>
                  )}
                  {/* Front wall - vertical plane at z=room.depth */}
                  {wallVisibility.frontWall && (
                    <div
                      style={{
                        position: 'absolute',
                        width: `${room.width * scale}px`,
                        height: `${room.height * scale}px`,
                        backgroundColor: 'rgba(200, 200, 200, 0.3)',
                        transform: `translateY(${-room.height * scale}px) translateZ(${room.depth * scale}px)`,
                        transformOrigin: 'top left',
                        border: '1px dashed #aaa'
                      }}
                    />
                  )}
                  {/* Room elements - Draggable doors/windows */}
                  {(room.elements || []).map((el) => {
                    const config = ROOM_ELEMENTS[el.type]
                    const isSelected = selectedRoomElement?.id === el.id
                    return (
                      <div
                        key={el.id}
                        className="cursor-move"
                        style={{
                          position: 'absolute',
                          width: `${el.w * scale}px`,
                          height: `${el.h * scale}px`,
                          backgroundColor: config.color,
                          transform: el.type === 'light' 
                            ? `translate3d(${el.x * scale}px, ${-el.y * scale}px, ${el.z * scale}px)`
                            : `translate3d(${el.x * scale}px, ${(-el.y - el.h) * scale}px, 5px)`,
                          boxShadow: isSelected ? '0 0 15px rgba(59, 130, 246, 0.8)' : el.type === 'light' ? '0 0 30px rgba(255,215,0,0.5)' : '2px 2px 5px rgba(0,0,0,0.2)',
                          border: isSelected ? '3px solid #3b82f6' : '2px solid rgba(0,0,0,0.1)',
                          zIndex: isSelected ? 100 : 10
                        }}
                        title={`${config.name}: ${el.w}×${el.h}mm - Drag to move`}
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          setIsDragging(true)
                          setDragMode('roomElement')
                          setSelectedRoomElement(el)
                          setDragStart({ x: e.clientX, y: e.clientY })
                          setRoomElementDragStart({ x: el.x, y: el.y })
                        }}
                      />
                    )
                  })}
                  
                  {/* Cabinet - positioned on the floor surface */}
                  {/* Use same transform as floor (rotateX -90deg) then translate on that plane */}
                  <div 
                    className="cursor-move"
                    style={{ 
                      transformStyle: 'preserve-3d', 
                      position: 'absolute',
                      // Same base transform as floor to be on the floor plane
                      // Then offset to center: X=width/2, "Y" on floor plane = depth/2
                      transform: `rotateX(-90deg) translate3d(${(room.width/2 + cabinetPosition.x) * scale}px, ${(room.depth/2 + cabinetPosition.z) * scale}px, ${cabinetPosition.y * scale}px) rotateX(90deg) rotateY(${cabinetRotation}deg)`,
                      transformOrigin: 'top left'
                    }}
                    onMouseDown={(e) => {
                      if (e.target.closest('.draggable-panel')) return
                      e.stopPropagation()
                      setIsDragging(true)
                      setDragMode('cabinet')
                      setDragStart({ x: e.clientX, y: e.clientY })
                      setCabinetDragStart({ x: cabinetPosition.x, y: cabinetPosition.z })
                    }}
                  >
                    {filteredParts.map((part) => {
                      const config = CABINET_PARTS[part.type]
                      const isSelected = selectedPart === part.id
                      const collision = collisions.find(c => c.partA === part.id || c.partB === part.id)
                      const hasCollision = !!collision
                      const collidingPartName = collision 
                        ? (collision.partA === part.id ? collision.partBName : collision.partAName)
                        : null
                      
                      const color = hasCollision ? '#ff4444' : config.color
                      const borderColor = hasCollision ? '#ff0000' : isSelected ? '#3b82f6' : 'rgba(0,0,0,0.3)'
                      
                      const pw = part.w * scale
                      const ph = part.h * scale
                      const pd = part.d * scale
                      
                      // Part position - cabinet uses standard coords: x=right, y=up, z=front
                      // After rotateX(90deg) counter-rotation, we're back to normal CSS space
                      // Position at center of box for easier face placement
                      const cx = (part.x + part.w/2) * scale
                      const cy = -(part.y + part.h/2) * scale  // Negate Y for CSS (up is negative)
                      const cz = (part.z + part.d/2) * scale
                      
                      return (
                        <div
                          key={part.id}
                          onClick={() => setSelectedPart(part.id)}
                          className={`absolute cursor-pointer ${hasCollision ? 'animate-pulse' : ''}`}
                          style={{
                            transformStyle: 'preserve-3d',
                            transform: `translate3d(${cx}px, ${cy}px, ${cz}px)`
                          }}
                          title={hasCollision ? `⚠️ Collision with ${collidingPartName}` : `${config.name}: ${part.w}×${part.h}×${part.d}mm`}
                        >
                          {/* Front face (facing +Z, toward viewer) */}
                          <div style={{
                            position: 'absolute',
                            width: `${pw}px`,
                            height: `${ph}px`,
                            marginLeft: `${-pw/2}px`,
                            marginTop: `${-ph/2}px`,
                            backgroundColor: color,
                            border: `2px solid ${borderColor}`,
                            boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none',
                            transform: `translateZ(${pd/2}px)`
                          }}>
                            {showFaceLabels && <span style={{ fontSize: '8px', color: '#fff', textShadow: '1px 1px 1px #000', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>Front</span>}
                          </div>
                          {/* Back face (facing -Z) */}
                          <div style={{
                            position: 'absolute',
                            width: `${pw}px`,
                            height: `${ph}px`,
                            marginLeft: `${-pw/2}px`,
                            marginTop: `${-ph/2}px`,
                            backgroundColor: color,
                            border: `2px solid ${borderColor}`,
                            transform: `translateZ(${-pd/2}px) rotateY(180deg)`,
                            opacity: 0.9
                          }}>
                            {showFaceLabels && <span style={{ fontSize: '8px', color: '#fff', textShadow: '1px 1px 1px #000', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>Back</span>}
                          </div>
                          {/* Top face (facing -Y, up) */}
                          <div style={{
                            position: 'absolute',
                            width: `${pw}px`,
                            height: `${pd}px`,
                            marginLeft: `${-pw/2}px`,
                            marginTop: `${-pd/2}px`,
                            backgroundColor: color,
                            border: `2px solid ${borderColor}`,
                            transform: `rotateX(90deg) translateZ(${ph/2}px)`,
                            opacity: 0.85
                          }} />
                          {/* Bottom face (facing +Y, down) */}
                          <div style={{
                            position: 'absolute',
                            width: `${pw}px`,
                            height: `${pd}px`,
                            marginLeft: `${-pw/2}px`,
                            marginTop: `${-pd/2}px`,
                            backgroundColor: color,
                            border: `2px solid ${borderColor}`,
                            transform: `rotateX(-90deg) translateZ(${ph/2}px)`,
                            opacity: 0.85
                          }} />
                          {/* Left face (facing -X) */}
                          <div style={{
                            position: 'absolute',
                            width: `${pd}px`,
                            height: `${ph}px`,
                            marginLeft: `${-pd/2}px`,
                            marginTop: `${-ph/2}px`,
                            backgroundColor: color,
                            border: `2px solid ${borderColor}`,
                            transform: `rotateY(-90deg) translateZ(${pw/2}px)`,
                            opacity: 0.8
                          }} />
                          {/* Right face (facing +X) */}
                          <div style={{
                            position: 'absolute',
                            width: `${pd}px`,
                            height: `${ph}px`,
                            marginLeft: `${-pd/2}px`,
                            marginTop: `${-ph/2}px`,
                            backgroundColor: color,
                            border: `2px solid ${borderColor}`,
                            transform: `rotateY(90deg) translateZ(${pw/2}px)`,
                            opacity: 0.8
                          }} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Cabinet when room is hidden - show at viewport center */}
              {!showRoom && (
              <div 
                className="cursor-move"
                style={{ 
                  transformStyle: 'preserve-3d', 
                  position: 'absolute'
                }}
                onMouseDown={(e) => {
                  if (e.target.closest('.draggable-panel')) return
                  e.stopPropagation()
                  setIsDragging(true)
                  setDragMode('cabinet')
                  setDragStart({ x: e.clientX, y: e.clientY })
                  setCabinetDragStart({ x: cabinetPosition.x, y: cabinetPosition.z })
                }}
              >
                {filteredParts.map((part) => {
                  const config = CABINET_PARTS[part.type]
                  const isSelected = selectedPart === part.id
                  const collision = collisions.find(c => c.partA === part.id || c.partB === part.id)
                  const hasCollision = !!collision
                  const collidingPartName = collision 
                    ? (collision.partA === part.id ? collision.partBName : collision.partAName)
                    : null
                  
                  // Render panel as 3D box with actual dimensions
                  // w = width (X), h = height (Y), d = depth (Z)
                  const color = hasCollision ? '#ff4444' : config.color
                  const borderColor = hasCollision ? '#ff0000' : isSelected ? '#3b82f6' : 'rgba(0,0,0,0.3)'
                  
                  // Scale dimensions
                  const pw = part.w * scale
                  const ph = part.h * scale
                  const pd = part.d * scale
                  
                  // Position at center of the box
                  const cx = (part.x + part.w/2) * scale
                  const cy = -(part.y + part.h/2) * scale
                  const cz = (part.z + part.d/2) * scale
                  
                  return (
                    <div
                      key={part.id}
                      onClick={() => setSelectedPart(part.id)}
                      className={`absolute cursor-pointer ${hasCollision ? 'animate-pulse' : ''}`}
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: `translate3d(${cx}px, ${cy}px, ${cz}px) ${part.openAngle ? `rotateY(${part.openAngle}deg)` : ''}`,
                        zIndex: hasCollision ? 100 : isSelected ? 50 : 1
                      }}
                      title={`${config.name}: ${part.w}×${part.h}×${part.d}mm`}
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
                        boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.6)' : 'none'
                      }}>
                        {showDimensions && pw > 20 && ph > 15 && (
                          <span className="absolute inset-0 flex items-center justify-center text-[7px] text-white bg-black/40 rounded">
                            {part.w}×{part.h}
                          </span>
                        )}
                        {showFaceLabels && <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">F</span>}
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
                      }}>
                        {showFaceLabels && <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">B</span>}
                      </div>
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
                      }}>
                        {showFaceLabels && pd > 8 && <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow-md">R</span>}
                      </div>
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
                      }}>
                        {showFaceLabels && pd > 8 && <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow-md">L</span>}
                      </div>
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
                      }}>
                        {showFaceLabels && pd > 8 && <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow-md">T</span>}
                      </div>
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
                      }}>
                        {showFaceLabels && pd > 8 && <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow-md">Bo</span>}
                      </div>
                    </div>
                  )
                })}
                
                {/* Verbinders in 3D */}
                {showVerbinders && verbinders.map((verbinder) => {
                  const offset = verbinderOffsets[verbinder.id] || { x: 0, y: 0 }
                  const vx = (verbinder.x + offset.x) * scale
                  const vy = -(verbinder.y + offset.y) * scale
                  const vz = verbinder.z * scale
                  
                  return (
                    <div
                      key={verbinder.id}
                      className="absolute"
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: `translate3d(${vx}px, ${vy}px, ${vz}px)`,
                        zIndex: 200
                      }}
                      title={`Meubel Verbinder: ${verbinder.type}`}
                    >
                      {/* Verbinder as small sphere */}
                      <div
                        className="rounded-full bg-orange-500 border-2 border-orange-700"
                        style={{
                          width: '8px',
                          height: '8px',
                          marginLeft: '-4px',
                          marginTop: '-4px',
                          boxShadow: '0 0 4px rgba(255, 165, 0, 0.8)'
                        }}
                      />
                    </div>
                  )
                })}
              </div>
              )}
            </div>

            {/* View buttons */}
            <div className="absolute bottom-4 left-4 flex gap-2">
              <button onClick={() => setViewAngle({ x: 25, y: -35 })} className="px-3 py-1 bg-white rounded shadow text-sm hover:bg-gray-50">Front</button>
              <button onClick={() => setViewAngle({ x: 25, y: -125 })} className="px-3 py-1 bg-white rounded shadow text-sm hover:bg-gray-50">Side</button>
              <button onClick={() => setViewAngle({ x: -85, y: 0 })} className="px-3 py-1 bg-white rounded shadow text-sm hover:bg-gray-50">Top</button>
              <button onClick={() => setViewAngle({ x: 0, y: 0 })} className="px-3 py-1 bg-white rounded shadow text-sm hover:bg-gray-50">Front 2D</button>
            </div>

            {/* Info panel */}
            <div className="absolute top-2 right-2 bg-white/90 rounded p-2 text-xs">
              <p>Room: {room.width}×{room.depth}×{room.height}mm</p>
              <p>Parts: {parts.length}</p>
            </div>
          </div>
          )}
        </div>

        {/* Draggable Floating Panels */}
        {panelVisibilityState.roomSettings && (
        <DraggablePanel title="Room Settings" icon={Square} defaultPosition={{ x: 10, y: 10 }}>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <label className="text-xs text-gray-500">Width</label>
                <input type="number" value={room.width} onChange={(e) => setRoom({...room, width: parseInt(e.target.value) || 1000})} className="w-full px-2 py-1 border rounded text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Height</label>
                <input type="number" value={room.height} onChange={(e) => setRoom({...room, height: parseInt(e.target.value) || 1000})} className="w-full px-2 py-1 border rounded text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Depth</label>
                <input type="number" value={room.depth} onChange={(e) => setRoom({...room, depth: parseInt(e.target.value) || 1000})} className="w-full px-2 py-1 border rounded text-sm" />
              </div>
            </div>
            <div className="flex gap-1 mb-3">
              <button onClick={() => addRoomElement('window')} className="flex-1 p-1 text-xs bg-sky-100 text-sky-700 rounded hover:bg-sky-200">+ Window</button>
              <button onClick={() => addRoomElement('roomDoor')} className="flex-1 p-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200">+ Door</button>
            </div>
            <div className="border-t pt-2">
              <label className="text-xs text-gray-500 font-medium">Cabinet Position in Room</label>
              <div className="grid grid-cols-3 gap-1 mt-1">
                <div>
                  <label className="text-[10px] text-gray-400">X</label>
                  <input type="number" value={cabinetPosition.x} onChange={(e) => setCabinetPosition({...cabinetPosition, x: parseInt(e.target.value) || 0})} className="w-full px-1 py-1 border rounded text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400">Y</label>
                  <input type="number" value={cabinetPosition.y} onChange={(e) => setCabinetPosition({...cabinetPosition, y: parseInt(e.target.value) || 0})} className="w-full px-1 py-1 border rounded text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400">Z</label>
                  <input type="number" value={cabinetPosition.z} onChange={(e) => setCabinetPosition({...cabinetPosition, z: parseInt(e.target.value) || 0})} className="w-full px-1 py-1 border rounded text-xs" />
                </div>
              </div>
              <button 
                onClick={() => setCabinetPosition({ x: room.width / 2, y: 0, z: room.depth / 2 })} 
                className="w-full mt-2 p-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Center Cabinet
              </button>
            </div>
            
            <div className="mt-3 pt-3 border-t">
              <label className="text-xs text-gray-500 block mb-2">Cabinet Rotation</label>
              <div className="flex gap-1">
                {[0, 90, 180, 270].map(angle => (
                  <button
                    key={angle}
                    onClick={() => setCabinetRotation(angle)}
                    className={`flex-1 px-2 py-1 text-xs rounded ${cabinetRotation === angle ? 'bg-amber-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    {angle}°
                  </button>
                ))}
              </div>
              <div className="flex gap-1 mt-2">
                <button
                  onClick={() => {
                    const cabinetW = parts.length > 0 ? Math.max(...parts.map(p => p.x + p.w)) : 600
                    const cabinetD = parts.length > 0 ? Math.max(...parts.map(p => p.z + p.d)) : 560
                    setCabinetPosition({ x: 0, y: 0, z: 0 })
                  }}
                  className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Snap to Corner
                </button>
                <button
                  onClick={() => {
                    const cabinetW = parts.length > 0 ? Math.max(...parts.map(p => p.x + p.w)) : 600
                    setCabinetPosition(prev => ({ ...prev, x: 0 }))
                  }}
                  className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Snap to Wall
                </button>
              </div>
            </div>
            
            {/* Wall Visibility Controls */}
            <div className="mt-3 pt-3 border-t">
              <label className="text-xs text-gray-500 font-medium block mb-2">Wall Visibility</label>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { key: 'floor', label: 'Floor' },
                  { key: 'ceiling', label: 'Ceiling' },
                  { key: 'backWall', label: 'Back' },
                  { key: 'frontWall', label: 'Front' },
                  { key: 'leftWall', label: 'Left' },
                  { key: 'rightWall', label: 'Right' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setWallVisibility(prev => ({ ...prev, [key]: !prev[key] }))}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      wallVisibility[key] 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {wallVisibility[key] ? '✓' : '○'} {label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setWallVisibility({ floor: true, ceiling: false, backWall: true, leftWall: true, rightWall: true, frontWall: false })}
                className="w-full mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              >
                Reset Walls
              </button>
            </div>
            
            {/* Alcove Settings */}
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500 font-medium">Alcove</label>
                <button
                  onClick={() => setAlcove(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`px-2 py-1 text-xs rounded ${alcove.enabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  {alcove.enabled ? 'On' : 'Off'}
                </button>
              </div>
              {alcove.enabled && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-1">
                    <div>
                      <label className="text-[10px] text-gray-400">Width</label>
                      <input type="number" value={alcove.width} onChange={(e) => setAlcove({...alcove, width: parseInt(e.target.value) || 500})} className="w-full px-1 py-1 border rounded text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400">Height</label>
                      <input type="number" value={alcove.height} onChange={(e) => setAlcove({...alcove, height: parseInt(e.target.value) || 1000})} className="w-full px-1 py-1 border rounded text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400">Depth</label>
                      <input type="number" value={alcove.depth} onChange={(e) => setAlcove({...alcove, depth: parseInt(e.target.value) || 200})} className="w-full px-1 py-1 border rounded text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">Offset from Left</label>
                    <input type="number" value={alcove.offsetX} onChange={(e) => setAlcove({...alcove, offsetX: parseInt(e.target.value) || 0})} className="w-full px-1 py-1 border rounded text-xs" />
                  </div>
                </div>
              )}
            </div>
          </DraggablePanel>
        )}

        {panelVisibilityState.addParts && (
        <DraggablePanel title="Add Parts" icon={Plus} defaultPosition={{ x: 10, y: 200 }}>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(CABINET_PARTS).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => addPart(key)}
                  className="p-1 text-xs bg-gray-100 rounded hover:bg-amber-100 transition-colors text-left"
                  style={{ borderLeft: `3px solid ${config.color}` }}
                >
                  {config.name}
                </button>
              ))}
            </div>
          </DraggablePanel>
        )}

          {selectedPartData && (
            <DraggablePanel title={CABINET_PARTS[selectedPartData.type].name} icon={Ruler} defaultPosition={{ x: 10, y: 400 }}>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500">Position (mm)</label>
                  <div className="grid grid-cols-3 gap-1">
                    <input type="number" value={selectedPartData.x} onChange={(e) => updatePart(selectedPart, { x: parseInt(e.target.value) || 0 })} className="w-full px-1 py-1 border rounded text-xs" placeholder="X" />
                    <input type="number" value={selectedPartData.y} onChange={(e) => updatePart(selectedPart, { y: parseInt(e.target.value) || 0 })} className="w-full px-1 py-1 border rounded text-xs" placeholder="Y" />
                    <input type="number" value={selectedPartData.z} onChange={(e) => updatePart(selectedPart, { z: parseInt(e.target.value) || 0 })} className="w-full px-1 py-1 border rounded text-xs" placeholder="Z" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Size (mm)</label>
                  <div className="grid grid-cols-3 gap-1">
                    <input type="number" value={selectedPartData.w} onChange={(e) => updatePart(selectedPart, { w: parseInt(e.target.value) || 1 })} className="w-full px-1 py-1 border rounded text-xs" placeholder="W" />
                    <input type="number" value={selectedPartData.h} onChange={(e) => updatePart(selectedPart, { h: parseInt(e.target.value) || 1 })} className="w-full px-1 py-1 border rounded text-xs" placeholder="H" />
                    <input type="number" value={selectedPartData.d} onChange={(e) => updatePart(selectedPart, { d: parseInt(e.target.value) || 1 })} className="w-full px-1 py-1 border rounded text-xs" placeholder="D" />
                  </div>
                </div>
                {selectedPartData.type === 'door' && (
                  <div>
                    <label className="text-xs text-gray-500">Open: {selectedPartData.openAngle || 0}°</label>
                    <input type="range" min="0" max="120" value={selectedPartData.openAngle || 0} onChange={(e) => updatePart(selectedPart, { openAngle: parseInt(e.target.value) })} className="w-full" />
                  </div>
                )}
                <button onClick={() => deletePart(selectedPart)} className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </DraggablePanel>
          )}

          {panelVisibilityState.partsList && (
          <DraggablePanel title={`Parts (${parts.length})`} icon={Layers} defaultPosition={{ x: 220, y: 10 }} defaultCollapsed={true}>
            <div className="space-y-1">
              {parts.map((part) => {
                const config = CABINET_PARTS[part.type]
                const hasCollision = collisions.some(c => c.partA === part.id || c.partB === part.id)
                return (
                  <button
                    key={part.id}
                    onClick={() => setSelectedPart(part.id)}
                    className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between ${
                      selectedPart === part.id ? 'bg-amber-100' : 'hover:bg-gray-100'
                    } ${hasCollision ? 'border-l-2 border-red-500' : ''}`}
                  >
                    <span>{config.name}</span>
                    <span className="text-[9px] text-gray-400">{part.w}×{part.h}×{part.d}</span>
                  </button>
                )
              })}
            </div>
          </DraggablePanel>
          )}

          {/* Verbinder Settings Panel */}
          {panelVisibilityState.verbinders && (
          <DraggablePanel title={`Verbinders (${verbinders.length})`} icon={Settings} defaultPosition={{ x: 220, y: 10 }} defaultCollapsed={true}>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Spacing (mm)</label>
                <input
                  type="number"
                  value={verbinderPattern.spacing}
                  onChange={(e) => setVerbinderPattern(prev => ({ ...prev, spacing: parseInt(e.target.value) || 100 }))}
                  className="w-full px-2 py-1 border rounded text-sm"
                  min="50"
                  max="500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Edge Offset (mm)</label>
                <input
                  type="number"
                  value={verbinderPattern.offsetFromEdge}
                  onChange={(e) => setVerbinderPattern(prev => ({ ...prev, offsetFromEdge: parseInt(e.target.value) || 30 }))}
                  className="w-full px-2 py-1 border rounded text-sm"
                  min="20"
                  max="200"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Pattern X Offset</label>
                  <input
                    type="number"
                    value={verbinderPattern.offsetX}
                    onChange={(e) => setVerbinderPattern(prev => ({ ...prev, offsetX: parseInt(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Pattern Y Offset</label>
                  <input
                    type="number"
                    value={verbinderPattern.offsetY}
                    onChange={(e) => setVerbinderPattern(prev => ({ ...prev, offsetY: parseInt(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
              </div>
              <button
                onClick={() => setVerbinderPattern({ spacing: 200, offsetFromEdge: 50, offsetX: 0, offsetY: 0 })}
                className="w-full px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              >
                Reset Pattern
              </button>
              <div className="pt-2 border-t text-xs text-gray-500">
                <p className="font-medium mb-1">Meubel Verbinder Info:</p>
                <p>• Front hole: 12mm deep</p>
                <p>• Side hole: 25mm deep</p>
                <p>• Auto-placed at panel connections</p>
              </div>
            </div>
          </DraggablePanel>
          )}

          {/* Spaces Panel */}
          {panelVisibilityState.spaces && (
          <DraggablePanel title={`Spaces (${spaces.length})`} icon={Box} defaultPosition={{ x: 220, y: 200 }} defaultCollapsed={false}>
            <div className="space-y-2">
              {spaces.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">No enclosed spaces detected</p>
              ) : (
                spaces.map((space, index) => (
                  <div 
                    key={space.id}
                    className="bg-purple-50 border border-purple-200 rounded p-2"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-purple-700">Space {index + 1}</span>
                      <span className="text-[10px] text-purple-500">
                        C{space.compartmentIndex + 1} / S{space.shelfIndex + 1}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      <div className="bg-white rounded px-1 py-0.5 text-center">
                        <div className="text-gray-400">W</div>
                        <div className="font-medium text-gray-700">{space.width}</div>
                      </div>
                      <div className="bg-white rounded px-1 py-0.5 text-center">
                        <div className="text-gray-400">H</div>
                        <div className="font-medium text-gray-700">{space.height}</div>
                      </div>
                      <div className="bg-white rounded px-1 py-0.5 text-center">
                        <div className="text-gray-400">D</div>
                        <div className="font-medium text-gray-700">{space.depth}</div>
                      </div>
                    </div>
                    <div className="text-[9px] text-purple-400 mt-1 text-center">
                      Volume: {((space.width * space.height * space.depth) / 1000000000).toFixed(3)} m³
                    </div>
                  </div>
                ))
              )}
            </div>
          </DraggablePanel>
          )}
      </div>

      {/* Template Library Modal */}
      {showTemplateLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-purple-600 text-white">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FolderOpen size={20} /> Template Library
              </h3>
              <button 
                onClick={() => setShowTemplateLibrary(false)}
                className="p-2 hover:bg-purple-700 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 border-b">
              <div className="flex gap-2 flex-wrap">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === cat 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat === 'all' ? 'All Templates' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <div 
                      key={template.id} 
                      className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer hover:border-purple-500"
                      onClick={() => loadTemplate(template)}
                    >
                      {/* Mini 3D Preview */}
                      <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center overflow-hidden" style={{ perspective: '400px' }}>
                        {(() => {
                          const w = parseFloat(template.baseWidth) || 600
                          const h = parseFloat(template.baseHeight) || 720
                          const d = parseFloat(template.baseDepth) || 400
                          const maxDim = Math.max(w, h, d)
                          const scale = 80 / maxDim
                          const sw = w * scale
                          const sh = h * scale
                          const sd = d * scale * 0.5
                          const compartments = template.modelTemplate?.compartments || 1
                          const shelves = template.modelTemplate?.shelves || 0
                          
                          return (
                            <div 
                              style={{ 
                                transform: 'rotateX(-15deg) rotateY(-25deg)',
                                transformStyle: 'preserve-3d',
                                position: 'relative',
                                width: sw,
                                height: sh
                              }}
                            >
                              {/* Front face */}
                              <div style={{
                                position: 'absolute',
                                width: sw,
                                height: sh,
                                background: 'linear-gradient(135deg, #D2691E 0%, #8B4513 100%)',
                                border: '1px solid #654321',
                                transform: `translateZ(${sd/2}px)`,
                                boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.2), inset -2px -2px 4px rgba(0,0,0,0.2)'
                              }}>
                                {/* Compartment dividers */}
                                {Array.from({ length: compartments - 1 }).map((_, i) => (
                                  <div key={`div-${i}`} style={{
                                    position: 'absolute',
                                    left: `${((i + 1) / compartments) * 100}%`,
                                    top: '5%',
                                    width: '2px',
                                    height: '90%',
                                    background: '#654321'
                                  }} />
                                ))}
                                {/* Shelves */}
                                {Array.from({ length: shelves }).map((_, i) => (
                                  <div key={`shelf-${i}`} style={{
                                    position: 'absolute',
                                    left: '5%',
                                    top: `${((i + 1) / (shelves + 1)) * 100}%`,
                                    width: '90%',
                                    height: '2px',
                                    background: '#A0522D'
                                  }} />
                                ))}
                              </div>
                              {/* Top face */}
                              <div style={{
                                position: 'absolute',
                                width: sw,
                                height: sd,
                                background: 'linear-gradient(180deg, #DEB887 0%, #D2691E 100%)',
                                border: '1px solid #654321',
                                transform: `rotateX(90deg) translateZ(${sh/2}px) translateY(${-sd/2}px)`
                              }} />
                              {/* Right face */}
                              <div style={{
                                position: 'absolute',
                                width: sd,
                                height: sh,
                                background: 'linear-gradient(90deg, #A0522D 0%, #8B4513 100%)',
                                border: '1px solid #654321',
                                transform: `rotateY(90deg) translateZ(${sw/2}px) translateX(${sd/2}px)`
                              }} />
                            </div>
                          )
                        })()}
                      </div>
                      <h4 className="font-semibold text-gray-800">{template.templateName}</h4>
                      <p className="text-sm text-gray-500">{template.category}</p>
                      <div className="mt-2 text-xs text-gray-400">
                        {template.baseWidth} × {template.baseHeight} × {template.baseDepth} mm
                      </div>
                      <div className="mt-2 text-xs text-purple-600">
                        {template.modelTemplate?.compartments || 1} compartment{(template.modelTemplate?.compartments || 1) > 1 ? 's' : ''} • {template.modelTemplate?.shelves || 0} shelves
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {template.baseMaterial}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Box size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No templates found</p>
                  <p className="text-sm mt-2">Try selecting a different category</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 text-sm text-gray-500">
              Click on a template to load it into the designer. Your current design will be replaced.
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-green-600 text-white">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Factory size={20} /> Create Production Order
              </h3>
              <button 
                onClick={() => setShowOrderModal(false)}
                className="p-2 hover:bg-green-700 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2">Order Summary</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Design:</span> {designName}</p>
                  <p><span className="font-medium">Total Parts:</span> {parts.length}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-2">Parts to be produced:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {parts.map((part, idx) => {
                      const config = CABINET_PARTS[part.type]
                      return (
                        <div key={part.id} className="flex justify-between text-xs bg-white px-2 py-1 rounded border">
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded" style={{ backgroundColor: config?.color || '#ccc' }} />
                            {config?.name || part.type}
                          </span>
                          <span className="text-gray-400">{part.w}×{part.h}×{part.d}mm</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={orderForm.customerName}
                  onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={orderForm.dueDate}
                  onChange={(e) => setOrderForm({...orderForm, dueDate: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={orderForm.priority}
                  onChange={(e) => setOrderForm({...orderForm, priority: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Special instructions..."
                />
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowOrderModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={createProductionOrder}
                disabled={orderCreating || !orderForm.customerName.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {orderCreating ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Cabinet Generator Modal */}
      {showQuickTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-indigo-600 text-white">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Box size={20} /> Quick Cabinet Generator
              </h3>
              <button 
                onClick={() => setShowQuickTemplate(false)}
                className="p-2 hover:bg-indigo-700 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width (mm)</label>
                  <input
                    type="number"
                    value={quickTemplateConfig.width}
                    onChange={(e) => setQuickTemplateConfig({...quickTemplateConfig, width: parseInt(e.target.value) || 600})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (mm)</label>
                  <input
                    type="number"
                    value={quickTemplateConfig.height}
                    onChange={(e) => setQuickTemplateConfig({...quickTemplateConfig, height: parseInt(e.target.value) || 720})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Depth (mm)</label>
                  <input
                    type="number"
                    value={quickTemplateConfig.depth}
                    onChange={(e) => setQuickTemplateConfig({...quickTemplateConfig, depth: parseInt(e.target.value) || 560})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compartments</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={quickTemplateConfig.compartments}
                    onChange={(e) => setQuickTemplateConfig({...quickTemplateConfig, compartments: Math.max(1, Math.min(6, parseInt(e.target.value) || 1))})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shelves per Compartment</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={quickTemplateConfig.shelves}
                    onChange={(e) => setQuickTemplateConfig({...quickTemplateConfig, shelves: Math.max(0, Math.min(5, parseInt(e.target.value) || 0))})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quickTemplateConfig.shareWalls}
                    onChange={(e) => setQuickTemplateConfig({...quickTemplateConfig, shareWalls: e.target.checked})}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-medium text-gray-800">Share walls between compartments</span>
                    <p className="text-xs text-gray-500 mt-1">
                      {quickTemplateConfig.shareWalls 
                        ? 'Adjacent compartments share a single divider panel (saves material)'
                        : 'Each compartment has its own walls (stronger but uses more material)'}
                    </p>
                  </div>
                </label>
              </div>

              <div className="bg-indigo-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-indigo-800">Preview:</p>
                <p className="text-indigo-600">
                  {quickTemplateConfig.compartments} compartment{quickTemplateConfig.compartments > 1 ? 's' : ''} × {quickTemplateConfig.shelves} shelf{quickTemplateConfig.shelves !== 1 ? 'ves' : ''} each
                </p>
                <p className="text-indigo-600">
                  ~{5 + (quickTemplateConfig.compartments - 1) + (quickTemplateConfig.compartments * quickTemplateConfig.shelves)} parts total
                </p>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowQuickTemplate(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={applyQuickTemplate}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Box size={18} /> Generate Cabinet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Design Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-4 bg-amber-600 text-white">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Save size={20} /> Save Design
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Design Name</label>
                <input
                  type="text"
                  value={designName}
                  onChange={(e) => setDesignName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter design name..."
                />
              </div>
              {currentDesignId && (
                <p className="text-sm text-gray-500">
                  This will update the existing design. Use "Save as New" to create a copy.
                </p>
              )}
            </div>
            <div className="p-4 bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              {currentDesignId && (
                <button
                  onClick={() => saveDesign(true)}
                  disabled={saving || !designName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Save as New
                </button>
              )}
              <button
                onClick={() => saveDesign(false)}
                disabled={saving || !designName.trim()}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : currentDesignId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open Design Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden max-h-[80vh]">
            <div className="p-4 bg-gray-600 text-white flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FolderOpen size={20} /> Open Design
              </h3>
              <button onClick={() => setShowOpenModal(false)} className="p-1 hover:bg-gray-500 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96">
              {savedDesigns.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {savedDesigns.map(design => (
                    <button
                      key={design.id}
                      onClick={() => openDesign(design)}
                      className="w-full p-4 text-left bg-gray-50 hover:bg-amber-50 border-2 border-transparent hover:border-amber-500 rounded-lg transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800">{design.name}</h4>
                          <p className="text-sm text-gray-500">
                            {design.width}mm × {design.height}mm × {design.depth}mm
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {design.material} - {design.finish} | {design.status}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(design.updated_at || design.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No saved designs found</p>
                  <p className="text-sm">Create and save a design to see it here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info/Success Modal */}
      {infoModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className={`p-4 text-white ${
              infoModal.type === 'error' ? 'bg-red-600' : 
              infoModal.type === 'warning' ? 'bg-amber-600' : 
              'bg-green-600'
            }`}>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {infoModal.type === 'error' ? <AlertTriangle size={20} /> : 
                 infoModal.type === 'warning' ? <AlertTriangle size={20} /> : 
                 <Save size={20} />}
                {infoModal.title}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700">{infoModal.message}</p>
            </div>
            <div className="p-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setInfoModal({ show: false, title: '', message: '', type: 'success' })}
                className={`px-6 py-2 text-white rounded-lg ${
                  infoModal.type === 'error' ? 'bg-red-600 hover:bg-red-700' : 
                  infoModal.type === 'warning' ? 'bg-amber-600 hover:bg-amber-700' : 
                  'bg-green-600 hover:bg-green-700'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Space Details Modal */}
      {showSpaceModal && selectedSpace && (() => {
        const space = spaces.find(s => s.id === selectedSpace)
        if (!space) return null
        const partsInSpace = spaceParts.filter(p => p.spaceId === selectedSpace)
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden max-h-[90vh]">
              <div className="p-4 bg-purple-600 text-white flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Box size={20} /> Space Details
                </h3>
                <button onClick={() => setShowSpaceModal(false)} className="p-1 hover:bg-purple-500 rounded">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* Space Dimensions */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Dimensions</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="text-xs text-purple-500 mb-1">Width</div>
                      <div className="text-2xl font-bold text-purple-700">{space.width}</div>
                      <div className="text-xs text-purple-400">mm</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="text-xs text-purple-500 mb-1">Height</div>
                      <div className="text-2xl font-bold text-purple-700">{space.height}</div>
                      <div className="text-xs text-purple-400">mm</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="text-xs text-purple-500 mb-1">Depth</div>
                      <div className="text-2xl font-bold text-purple-700">{space.depth}</div>
                      <div className="text-xs text-purple-400">mm</div>
                    </div>
                  </div>
                  <div className="mt-3 text-center text-sm text-gray-500">
                    Volume: {((space.width * space.height * space.depth) / 1000000000).toFixed(4)} m³
                  </div>
                </div>

                {/* Add Parts Section */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Add Parts to Space</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {allPartTypes.map(partType => (
                      <button
                        key={partType.id}
                        onClick={() => addPartToSpace(selectedSpace, partType.id)}
                        className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                        disabled={partType.maxWidth > space.width || partType.maxHeight > space.height}
                      >
                        <div 
                          className="w-8 h-8 rounded" 
                          style={{ backgroundColor: partType.color }}
                        />
                        <div>
                          <div className="font-medium text-sm">{partType.name}</div>
                          <div className="text-xs text-gray-400">
                            Max: {partType.maxWidth}×{partType.maxHeight}×{partType.maxDepth}mm
                          </div>
                          <div className="text-xs text-gray-400">
                            {partType.boreholes.length} boreholes
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowPartTypeModal(true)}
                    className="mt-3 w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors"
                  >
                    + Define New Part Type
                  </button>
                </div>

                {/* Parts in Space */}
                {partsInSpace.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Parts in this Space ({partsInSpace.length})</h4>
                    <div className="space-y-2">
                      {partsInSpace.map(part => (
                        <div key={part.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: part.color }} />
                              <span className="font-medium">{part.typeName}</span>
                            </div>
                            <button
                              onClick={() => deleteSpacePart(part.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <label className="text-gray-400">Width</label>
                              <input
                                type="number"
                                value={part.width}
                                onChange={(e) => updateSpacePart(part.id, { width: Math.min(parseInt(e.target.value) || 0, part.maxWidth, space.width) })}
                                className="w-full px-2 py-1 border rounded"
                              />
                            </div>
                            <div>
                              <label className="text-gray-400">Height</label>
                              <input
                                type="number"
                                value={part.height}
                                onChange={(e) => updateSpacePart(part.id, { height: Math.min(parseInt(e.target.value) || 0, part.maxHeight, space.height) })}
                                className="w-full px-2 py-1 border rounded"
                              />
                            </div>
                            <div>
                              <label className="text-gray-400">Depth</label>
                              <input
                                type="number"
                                value={part.depth}
                                onChange={(e) => updateSpacePart(part.id, { depth: Math.min(parseInt(e.target.value) || 0, part.maxDepth, space.depth) })}
                                className="w-full px-2 py-1 border rounded"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                            <div>
                              <label className="text-gray-400">Pos X</label>
                              <input
                                type="number"
                                value={part.x}
                                onChange={(e) => updateSpacePart(part.id, { x: parseInt(e.target.value) || 0 })}
                                className="w-full px-2 py-1 border rounded"
                              />
                            </div>
                            <div>
                              <label className="text-gray-400">Pos Y</label>
                              <input
                                type="number"
                                value={part.y}
                                onChange={(e) => updateSpacePart(part.id, { y: parseInt(e.target.value) || 0 })}
                                className="w-full px-2 py-1 border rounded"
                              />
                            </div>
                            <div>
                              <label className="text-gray-400">Pos Z</label>
                              <input
                                type="number"
                                value={part.z}
                                onChange={(e) => updateSpacePart(part.id, { z: parseInt(e.target.value) || 0 })}
                                className="w-full px-2 py-1 border rounded"
                              />
                            </div>
                          </div>
                          {/* Boreholes */}
                          <div className="mt-2 pt-2 border-t">
                            <div className="text-xs text-gray-500 mb-1">Boreholes ({part.boreholes.length})</div>
                            <div className="flex flex-wrap gap-1">
                              {part.boreholes.map((bh, idx) => (
                                <div key={bh.id} className="bg-gray-100 rounded px-2 py-1 text-xs flex items-center gap-1">
                                  <span className="w-2 h-2 bg-gray-800 rounded-full" />
                                  <span>{bh.side}</span>
                                  <input
                                    type="number"
                                    value={bh.offsetX || 0}
                                    onChange={(e) => updateBorehole(part.id, bh.id, { offsetX: parseInt(e.target.value) || 0 })}
                                    className="w-10 px-1 border rounded text-xs"
                                    title="X offset"
                                  />
                                  <input
                                    type="number"
                                    value={bh.offsetY || 0}
                                    onChange={(e) => updateBorehole(part.id, bh.id, { offsetY: parseInt(e.target.value) || 0 })}
                                    className="w-10 px-1 border rounded text-xs"
                                    title="Y offset"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={() => setShowSpaceModal(false)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Define New Part Type Modal */}
      {showPartTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="text-lg font-semibold">Define New Part Type</h3>
              <button onClick={() => setShowPartTypeModal(false)} className="p-1 hover:bg-indigo-500 rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Part Name</label>
                <input
                  type="text"
                  value={newPartType.name}
                  onChange={(e) => setNewPartType(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Custom Drawer"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Width</label>
                  <input
                    type="number"
                    value={newPartType.maxWidth}
                    onChange={(e) => setNewPartType(prev => ({ ...prev, maxWidth: parseInt(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Height</label>
                  <input
                    type="number"
                    value={newPartType.maxHeight}
                    onChange={(e) => setNewPartType(prev => ({ ...prev, maxHeight: parseInt(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Depth</label>
                  <input
                    type="number"
                    value={newPartType.maxDepth}
                    onChange={(e) => setNewPartType(prev => ({ ...prev, maxDepth: parseInt(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Boreholes</label>
                <div className="space-y-2">
                  {newPartType.boreholes.map((bh, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="number"
                        value={bh.x}
                        onChange={(e) => {
                          const updated = [...newPartType.boreholes]
                          updated[idx] = { ...bh, x: parseInt(e.target.value) || 0 }
                          setNewPartType(prev => ({ ...prev, boreholes: updated }))
                        }}
                        className="w-16 px-2 py-1 border rounded text-sm"
                        placeholder="X"
                      />
                      <input
                        type="number"
                        value={bh.y}
                        onChange={(e) => {
                          const updated = [...newPartType.boreholes]
                          updated[idx] = { ...bh, y: parseInt(e.target.value) || 0 }
                          setNewPartType(prev => ({ ...prev, boreholes: updated }))
                        }}
                        className="w-16 px-2 py-1 border rounded text-sm"
                        placeholder="Y"
                      />
                      <select
                        value={bh.side}
                        onChange={(e) => {
                          const updated = [...newPartType.boreholes]
                          updated[idx] = { ...bh, side: e.target.value }
                          setNewPartType(prev => ({ ...prev, boreholes: updated }))
                        }}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                        <option value="front">Front</option>
                        <option value="back">Back</option>
                      </select>
                      <button
                        onClick={() => {
                          const updated = newPartType.boreholes.filter((_, i) => i !== idx)
                          setNewPartType(prev => ({ ...prev, boreholes: updated }))
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setNewPartType(prev => ({ 
                      ...prev, 
                      boreholes: [...prev.boreholes, { x: 20, y: 20, side: 'left' }] 
                    }))}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    + Add Borehole
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setShowPartTypeModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newPartType.name.trim()) return
                  const newType = {
                    ...newPartType,
                    id: `custom-${Date.now()}`,
                    color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
                  }
                  setCustomPartTypes(prev => [...prev, newType])
                  setNewPartType({ name: '', maxWidth: 500, maxHeight: 200, maxDepth: 500, boreholes: [] })
                  setShowPartTypeModal(false)
                }}
                disabled={!newPartType.name.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Create Part Type
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DesignStudio3D
