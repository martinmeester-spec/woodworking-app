import { useState, useEffect } from 'react'
import { Download, FileCode, Box, Layers, Settings, CheckCircle, AlertCircle, File } from 'lucide-react'
import { api } from '../services/api'

export default function CADExport() {
  const [designs, setDesigns] = useState([])
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [exportFormat, setExportFormat] = useState('dxf')
  const [exportOptions, setExportOptions] = useState({
    includeHardware: true,
    includeDimensions: true,
    separateParts: false,
    scale: 1,
    units: 'mm'
  })
  const [exporting, setExporting] = useState(false)
  const [exportHistory, setExportHistory] = useState([])

  useEffect(() => {
    loadDesigns()
    loadExportHistory()
  }, [])

  const loadDesigns = async () => {
    try {
      const data = await api.get('/designs')
      if (Array.isArray(data)) {
        setDesigns(data)
      }
    } catch (error) {
      console.error('Error loading designs:', error)
      setDesigns([])
    }
  }

  const loadExportHistory = () => {
    const history = JSON.parse(localStorage.getItem('cadExportHistory') || '[]')
    setExportHistory(history)
  }

  const exportFormats = [
    { id: 'dxf', name: 'DXF', description: 'AutoCAD Drawing Exchange Format', icon: FileCode },
    { id: 'dwg', name: 'DWG', description: 'AutoCAD Native Format', icon: File },
    { id: 'svg', name: 'SVG', description: 'Scalable Vector Graphics', icon: Layers },
    { id: 'step', name: 'STEP', description: '3D CAD Standard Format', icon: Box },
    { id: 'stl', name: 'STL', description: '3D Printing Format', icon: Box }
  ]

  const generateDXFContent = (design) => {
    const parts = design.modelData?.parts || []
    const scale = exportOptions.scale
    
    // Generate DXF entities for each part
    let entities = ''
    let yOffset = 0
    const padding = 50 * scale
    
    parts.forEach((part, index) => {
      // Determine face dimensions based on part type orientation
      // Side panels (leftPanel, rightPanel, divider): face is h x d (height x depth)
      // Top/bottom panels (topPanel, bottomPanel, shelf): face is w x d (width x depth)  
      // Back panel: face is w x h (width x height)
      // Doors/drawers: face is w x h (width x height)
      let faceW, faceH, thickness
      const partType = part.type || ''
      
      if (partType.includes('left') || partType.includes('right') || partType === 'divider') {
        // Side panels - show height x depth face
        faceW = part.d || 560
        faceH = part.h || 720
        thickness = part.w || 18
      } else if (partType.includes('top') || partType.includes('bottom') || partType === 'shelf') {
        // Horizontal panels - show width x depth face
        faceW = part.w || 564
        faceH = part.d || 560
        thickness = part.h || 18
      } else {
        // Back panel, doors, drawers - show width x height face
        faceW = part.w || 564
        faceH = part.h || 720
        thickness = part.d || 18
      }
      
      const w = faceW * scale
      const h = faceH * scale
      const partName = part.type || `Part${index + 1}`
      const layerName = partName.replace(/\s+/g, '_')
      
      // Draw rectangle for each part (front view)
      entities += `0
LINE
8
${layerName}
10
0.0
20
${yOffset}
30
0.0
11
${w}
21
${yOffset}
31
0.0
0
LINE
8
${layerName}
10
${w}
20
${yOffset}
30
0.0
11
${w}
21
${yOffset + h}
31
0.0
0
LINE
8
${layerName}
10
${w}
20
${yOffset + h}
30
0.0
11
0.0
21
${yOffset + h}
31
0.0
0
LINE
8
${layerName}
10
0.0
20
${yOffset + h}
30
0.0
11
0.0
21
${yOffset}
31
0.0
`
      
      // Add dimensions if enabled
      if (exportOptions.includeDimensions) {
        entities += `0
TEXT
8
Dimensions
10
${w / 2}
20
${yOffset + h + 15}
30
0.0
40
12
1
${partName}: ${part.w}x${part.h}x${part.d}mm
`
      }
      
      yOffset += h + padding
    })

    return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
9
$INSUNITS
70
4
0
ENDSEC
0
SECTION
2
ENTITIES
${entities}0
TEXT
8
Title
10
0
20
-30
30
0.0
40
20
1
${design.name} - ${parts.length} parts
0
ENDSEC
0
EOF`
  }

  const generateSVGContent = (design) => {
    const parts = design.modelData?.parts || []
    const scale = exportOptions.scale
    const padding = 20
    
    // Calculate layout - arrange parts in rows
    let currentX = padding
    let currentY = padding + 40 // Leave space for title
    let rowHeight = 0
    let maxWidth = 0
    const partPositions = []
    const maxRowWidth = 800 * scale
    
    parts.forEach((part) => {
      // Determine face dimensions based on part type orientation
      let faceW, faceH
      const partType = part.type || ''
      
      if (partType.includes('left') || partType.includes('right') || partType === 'divider') {
        // Side panels - show height x depth face
        faceW = part.d || 560
        faceH = part.h || 720
      } else if (partType.includes('top') || partType.includes('bottom') || partType === 'shelf') {
        // Horizontal panels - show width x depth face
        faceW = part.w || 564
        faceH = part.d || 560
      } else {
        // Back panel, doors, drawers - show width x height face
        faceW = part.w || 564
        faceH = part.h || 720
      }
      
      const w = faceW * scale
      const h = faceH * scale
      
      // Check if we need to start a new row
      if (currentX + w > maxRowWidth && currentX > padding) {
        currentX = padding
        currentY += rowHeight + padding + (exportOptions.includeDimensions ? 30 : 0)
        rowHeight = 0
      }
      
      partPositions.push({ part, x: currentX, y: currentY, w, h })
      currentX += w + padding
      rowHeight = Math.max(rowHeight, h)
      maxWidth = Math.max(maxWidth, currentX)
    })
    
    const totalHeight = currentY + rowHeight + padding + (exportOptions.includeDimensions ? 40 : 20)
    const totalWidth = Math.max(maxWidth + padding, 400)
    
    // Generate SVG elements for each part
    const partElements = partPositions.map(({ part, x, y, w, h }, index) => {
      const partName = part.type || `Part${index + 1}`
      const color = getPartColor(part.type)
      
      return `
  <!-- ${partName} -->
  <g id="part-${index}">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" fill-opacity="0.3" stroke="${color}" stroke-width="2"/>
    <text x="${x + w/2}" y="${y + h/2}" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#333">${partName}</text>
    ${exportOptions.includeDimensions ? `
    <text x="${x + w/2}" y="${y + h + 15}" text-anchor="middle" font-size="9" fill="#666">${part.w}×${part.h}×${part.d}mm</text>
    ` : ''}
  </g>`
    }).join('')

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <title>${design.name}</title>
  <desc>Cabinet Design Export - ${parts.length} parts</desc>
  
  <!-- Background -->
  <rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="#fafafa"/>
  
  <!-- Title -->
  <text x="${totalWidth / 2}" y="25" text-anchor="middle" font-size="16" font-weight="bold" fill="#333">${design.name} (${parts.length} parts)</text>
  
  <!-- Parts -->
  ${partElements}
</svg>`
  }
  
  const getPartColor = (type) => {
    const colors = {
      leftSide: '#8B4513',
      rightSide: '#8B4513',
      top: '#A0522D',
      bottom: '#A0522D',
      back: '#D2691E',
      shelf: '#DEB887',
      door: '#CD853F',
      drawer: '#F4A460',
      divider: '#D2B48C'
    }
    return colors[type] || '#A0522D'
  }

  const handleExport = async () => {
    if (!selectedDesign) return
    
    setExporting(true)
    try {
      const design = designs.find(d => d.id === selectedDesign)
      if (!design) throw new Error('Design not found')

      let content = ''
      let mimeType = 'text/plain'
      let extension = exportFormat

      switch (exportFormat) {
        case 'dxf':
          content = generateDXFContent(design)
          mimeType = 'application/dxf'
          break
        case 'dwg':
          // DWG uses same content as DXF (text-based representation)
          content = generateDXFContent(design)
          mimeType = 'application/acad'
          extension = 'dxf' // Export as DXF since true DWG is binary
          break
        case 'svg':
          content = generateSVGContent(design)
          mimeType = 'image/svg+xml'
          break
        case 'step':
        case 'stl':
          content = JSON.stringify({
            format: exportFormat,
            design: design.name,
            parts: design.modelData?.parts || [],
            dimensions: { width: design.width, height: design.height, depth: design.depth },
            exportedAt: new Date().toISOString(),
            note: `Full ${exportFormat.toUpperCase()} export requires CAD software integration`
          }, null, 2)
          mimeType = 'application/json'
          extension = 'json'
          break
        default:
          content = generateDXFContent(design)
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${design.name.replace(/\s+/g, '_')}.${extension}`
      a.click()
      URL.revokeObjectURL(url)

      // Save to history
      const historyEntry = {
        id: Date.now(),
        designName: design.name,
        format: exportFormat,
        date: new Date().toISOString(),
        options: exportOptions
      }
      const newHistory = [historyEntry, ...exportHistory.slice(0, 9)]
      localStorage.setItem('cadExportHistory', JSON.stringify(newHistory))
      setExportHistory(newHistory)

    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed: ' + error.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">CAD Export</h1>
          <p className="text-gray-600">Export cabinet designs to CAD formats</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Design Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Box size={20} className="text-amber-600" />
            Select Design
          </h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {designs.map(design => (
              <button
                key={design.id}
                onClick={() => setSelectedDesign(design.id)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  selectedDesign === design.id 
                    ? 'border-amber-500 bg-amber-50' 
                    : 'border-gray-200 hover:border-amber-300'
                }`}
              >
                <p className="font-medium text-gray-800">{design.name}</p>
                <p className="text-sm text-gray-500">
                  {design.width} × {design.height} × {design.depth} mm
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Export Format */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileCode size={20} className="text-blue-600" />
            Export Format
          </h2>
          
          <div className="space-y-3">
            {exportFormats.map(format => (
              <button
                key={format.id}
                onClick={() => setExportFormat(format.id)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${
                  exportFormat === format.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <format.icon size={24} className={exportFormat === format.id ? 'text-blue-600' : 'text-gray-400'} />
                <div>
                  <p className="font-medium text-gray-800">{format.name}</p>
                  <p className="text-sm text-gray-500">{format.description}</p>
                </div>
                {exportFormat === format.id && (
                  <CheckCircle size={20} className="ml-auto text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Settings size={20} className="text-gray-600" />
            Export Options
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={exportOptions.includeHardware}
                onChange={(e) => setExportOptions({...exportOptions, includeHardware: e.target.checked})}
                className="w-4 h-4 text-amber-600 rounded"
              />
              <span className="text-gray-700">Include Hardware</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={exportOptions.includeDimensions}
                onChange={(e) => setExportOptions({...exportOptions, includeDimensions: e.target.checked})}
                className="w-4 h-4 text-amber-600 rounded"
              />
              <span className="text-gray-700">Include Dimensions</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={exportOptions.separateParts}
                onChange={(e) => setExportOptions({...exportOptions, separateParts: e.target.checked})}
                className="w-4 h-4 text-amber-600 rounded"
              />
              <span className="text-gray-700">Separate Parts</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scale</label>
              <select
                value={exportOptions.scale}
                onChange={(e) => setExportOptions({...exportOptions, scale: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value={0.1}>1:10</option>
                <option value={0.5}>1:2</option>
                <option value={1}>1:1</option>
                <option value={2}>2:1</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
              <select
                value={exportOptions.units}
                onChange={(e) => setExportOptions({...exportOptions, units: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="mm">Millimeters (mm)</option>
                <option value="cm">Centimeters (cm)</option>
                <option value="in">Inches (in)</option>
              </select>
            </div>

            <button
              onClick={handleExport}
              disabled={!selectedDesign || exporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              <Download size={18} />
              {exporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
            </button>
          </div>
        </div>
      </div>

      {/* Export History */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Export History</h2>
        
        {exportHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Design</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Format</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Options</th>
                </tr>
              </thead>
              <tbody>
                {exportHistory.map(entry => (
                  <tr key={entry.id} className="border-b">
                    <td className="px-4 py-3 font-medium">{entry.designName}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                        {entry.format.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(entry.date).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {entry.options?.includeDimensions && 'Dims'} 
                      {entry.options?.includeHardware && ' + Hardware'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-8 text-gray-500">No exports yet</p>
        )}
      </div>
    </div>
  )
}
