import React, { useState, useRef, useEffect, useCallback } from 'react'
import MindmapNode from './MindmapNode'
import {
  calculateTreeLayout,
  calculateFocalZoom,
  screenToWorld,
  CANVAS_BOUNDS
} from '../../utils/mindmapTreeUtils'

export default function MindmapCanvas({
  rootNode,
  selectedNodeId,
  onSelectNode,
  onAddChild,
  onAddSibling,
  onDeleteNode,
  onRenameNode,
  onUpdateNotes,
  onUpdateColor,
  onToggleCollapse,
  zoom,
  setZoom,
  viewportTx,
  setViewportTx,
  viewportTy,
  setViewportTy,
  onResetViewCallback
}) {
  const containerRef = useRef(null)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const lastTouchDistanceRef = useRef(null)

  // Calculate hierarchical layout of visible nodes and Bézier connector curves
  const layout = React.useMemo(() => {
    return calculateTreeLayout(rootNode, {
      nodeWidth: 175,
      nodeHeight: 46,
      horizontalSpacing: 95,
      verticalSpacing: 30,
      startX: 150,
      startY: 350
    })
  }, [rootNode])

  // Center tree on initial load or when requested
  const centerTree = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const { bounds } = layout

    const targetZoom = 1.0
    const nextTx = rect.width / 2 - bounds.centerX * targetZoom
    const nextTy = rect.height / 2 - bounds.centerY * targetZoom

    setZoom(targetZoom)
    setViewportTx(nextTx)
    setViewportTy(nextTy)
  }, [layout, setZoom, setViewportTx, setViewportTy])

  // Expose reset view callback to parent
  useEffect(() => {
    if (onResetViewCallback) {
      onResetViewCallback.current = centerTree
    }
  }, [centerTree, onResetViewCallback])

  // Mouse Wheel: Focal Zoom centered at mouse cursor
  const handleWheel = (e) => {
    e.preventDefault()
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const cursorX = e.clientX - rect.left
    const cursorY = e.clientY - rect.top

    const { zoom: nextZoom, tx: nextTx, ty: nextTy } = calculateFocalZoom(
      zoom,
      e.deltaY,
      cursorX,
      cursorY,
      viewportTx,
      viewportTy
    )

    setZoom(nextZoom)
    setViewportTx(nextTx)
    setViewportTy(nextTy)
  }

  // Mouse Down: Start Pan dragging
  const handleMouseDown = (e) => {
    // Only pan on left mouse button and on canvas background
    if (e.button !== 0) return
    isDraggingRef.current = true
    dragStartRef.current = {
      x: e.clientX - viewportTx,
      y: e.clientY - viewportTy
    }
  }

  // Mouse Move: Update pan
  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return
    const nextTx = e.clientX - dragStartRef.current.x
    const nextTy = e.clientY - dragStartRef.current.y
    setViewportTx(nextTx)
    setViewportTy(nextTy)
  }

  // Mouse Up / Leave: Finish pan
  const handleMouseUp = () => {
    isDraggingRef.current = false
  }

  // Touch support for Mobile / Tablets: Pan & Pinch-to-zoom
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true
      dragStartRef.current = {
        x: e.touches[0].clientX - viewportTx,
        y: e.touches[0].clientY - viewportTy
      }
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      lastTouchDistanceRef.current = dist
    }
  }

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      setViewportTx(e.touches[0].clientX - dragStartRef.current.x)
      setViewportTy(e.touches[0].clientY - dragStartRef.current.y)
    } else if (e.touches.length === 2 && lastTouchDistanceRef.current) {
      e.preventDefault()
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const rect = containerRef.current.getBoundingClientRect()
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top

      const delta = (lastTouchDistanceRef.current - dist) * 2
      const { zoom: nextZoom, tx: nextTx, ty: nextTy } = calculateFocalZoom(
        zoom,
        delta,
        midX,
        midY,
        viewportTx,
        viewportTy
      )
      setZoom(nextZoom)
      setViewportTx(nextTx)
      setViewportTy(nextTy)
      lastTouchDistanceRef.current = dist
    }
  }

  const handleTouchEnd = () => {
    isDraggingRef.current = false
    lastTouchDistanceRef.current = null
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => onSelectNode(null)}
      className="relative flex-1 w-full h-full min-h-[600px] bg-[#0c1222] overflow-hidden select-none cursor-grab active:cursor-grabbing"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
        backgroundSize: `${30 * zoom}px ${30 * zoom}px`,
        backgroundPosition: `${viewportTx}px ${viewportTy}px`,
      }}
    >
      {/* Transformed Content Viewport Layer */}
      <div
        style={{
          transform: `translate(${viewportTx}px, ${viewportTy}px) scale(${zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '10000px',
          height: '10000px',
          pointerEvents: 'none',
        }}
      >
        {/* SVG Connectors Layer (Bézier curves) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="connectorGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {layout.connectors.map((conn) => (
            <path
              key={conn.id}
              d={conn.path}
              fill="none"
              stroke={conn.color || '#6366f1'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity="0.75"
              className="transition-all duration-200"
            />
          ))}
        </svg>

        {/* HTML Interactive Nodes Layer */}
        <div className="absolute inset-0 pointer-events-auto">
          {layout.nodes.map((node) => (
            <MindmapNode
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              onSelect={onSelectNode}
              onAddChild={onAddChild}
              onAddSibling={onAddSibling}
              onDelete={onDeleteNode}
              onRename={onRenameNode}
              onUpdateNotes={onUpdateNotes}
              onUpdateColor={onUpdateColor}
              onToggleCollapse={onToggleCollapse}
            />
          ))}
        </div>
      </div>

      {/* Canvas HUD Overlay: Info & Quick Helpers */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800/80 backdrop-blur-md shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-semibold text-slate-200">
          {layout.nodes.length} nút
        </span>
        <span className="opacity-40">•</span>
        <span className="hidden sm:inline">Kéo chuột để di chuyển • Cuộn để zoom • Nhấp đúp vào nút để sửa</span>
      </div>
    </div>
  )
}
