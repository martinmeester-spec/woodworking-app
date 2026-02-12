import { useState, useRef } from 'react'
import { GripVertical, ChevronDown, ChevronUp } from 'lucide-react'

function DraggablePanel({ title, icon: Icon, children, defaultPosition = { x: 0, y: 0 }, defaultCollapsed = false }) {
  const [position, setPosition] = useState(defaultPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const panelRef = useRef(null)

  const handleMouseDown = (e) => {
    if (e.target.closest('.panel-content')) return
    setIsDragging(true)
    const rect = panelRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const parent = panelRef.current.parentElement
    const parentRect = parent.getBoundingClientRect()
    
    let newX = e.clientX - parentRect.left - dragOffset.x
    let newY = e.clientY - parentRect.top - dragOffset.y
    
    // Keep panel within bounds
    const panelRect = panelRef.current.getBoundingClientRect()
    newX = Math.max(0, Math.min(newX, parentRect.width - panelRect.width))
    newY = Math.max(0, Math.min(newY, parentRect.height - panelRect.height))
    
    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div
      ref={panelRef}
      className="absolute bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'default',
        zIndex: isDragging ? 100 : 10,
        minWidth: '200px',
        maxWidth: '280px'
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="flex items-center justify-between p-2 bg-gray-100/80 cursor-grab select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical size={14} className="text-gray-400" />
          {Icon && <Icon size={16} className="text-gray-600" />}
          <span className="font-medium text-sm text-gray-700">{title}</span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-gray-200 rounded"
        >
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>
      {!isCollapsed && (
        <div className="panel-content p-3 max-h-64 overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  )
}

export default DraggablePanel
