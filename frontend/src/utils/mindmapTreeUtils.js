/**
 * Mindmap Tree Manipulation & Computational Geometry Utilities
 * High performance, immutable updates, deterministic tree layout and Bézier curve math.
 */

export const CANVAS_BOUNDS = {
  MIN_ZOOM: 0.15,
  MAX_ZOOM: 3.0,
  DEFAULT_ZOOM: 1.0,
};

export const PALETTE = [
  "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6"
];

export const ROOT_COLOR = "#6366f1";

// Screen coordinate to World coordinate affine transform
export function screenToWorld(sx, sy, tx, ty, zoom) {
  return {
    wx: (sx - tx) / zoom,
    wy: (sy - ty) / zoom,
  };
}

// World coordinate to Screen coordinate affine transform
export function worldToScreen(wx, wy, tx, ty, zoom) {
  return {
    sx: wx * zoom + tx,
    sy: wy * zoom + ty,
  };
}

// Focal zoom preserving world coordinate under cursor (px, py)
export function calculateFocalZoom(currentZoom, deltaY, px, py, tx, ty) {
  const zoomFactor = 1 - deltaY * 0.0015;
  const rawNextZoom = currentZoom * zoomFactor;
  const nextZoom = Math.max(CANVAS_BOUNDS.MIN_ZOOM, Math.min(CANVAS_BOUNDS.MAX_ZOOM, rawNextZoom));
  const nextTx = px - (px - tx) * (nextZoom / currentZoom);
  const nextTy = py - (py - ty) * (nextZoom / currentZoom);
  return { zoom: nextZoom, tx: nextTx, ty: nextTy };
}

// Cubic Bézier curve connecting parent output anchor (x0, y0) to child input anchor (x3, y3)
export function generateCubicBezierPath(x0, y0, x3, y3, k = 0.5) {
  const deltaX = x3 - x0;
  const p1x = x0 + deltaX * k;
  const p1y = y0;
  const p2x = x3 - deltaX * k;
  const p2y = y3;
  return `M ${x0} ${y0} C ${p1x} ${p1y}, ${p2x} ${p2y}, ${x3} ${y3}`;
}

export function generateNodeId() {
  return `node-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

// Deep clone helper
export function cloneTree(root) {
  return JSON.parse(JSON.stringify(root));
}

// Find a node by ID in tree
export function findNode(root, targetId) {
  if (!root) return null;
  if (root.id === targetId) return root;
  for (const child of (root.children || [])) {
    const found = findNode(child, targetId);
    if (found) return found;
  }
  return null;
}

// Count total nodes in tree
export function countTreeNodes(root) {
  if (!root) return 0;
  let count = 1;
  for (const child of (root.children || [])) {
    count += countTreeNodes(child);
  }
  return count;
}
export const countNodes = countTreeNodes;

// Add child node
export function addChildNode(root, parentId, newText = 'Nhánh mới') {
  function traverse(node) {
    if (node.id === parentId) {
      const childColor = node.id === 'node-root'
        ? PALETTE[(node.children || []).length % PALETTE.length]
        : (node.color || PALETTE[0]);
      const newChild = {
        id: generateNodeId(),
        text: (newText || '').trim() || 'Nhánh mới',
        color: childColor,
        isCollapsed: false,
        collapsed: false,
        notes: '',
        children: []
      };
      if (!node.children) node.children = [];
      node.children.push(newChild);
      return true;
    }
    for (const child of (node.children || [])) {
      if (traverse(child)) return true;
    }
    return false;
  }
  const cloned = cloneTree(root);
  traverse(cloned);
  return cloned;
}

// Add sibling node under the same parent
export function addSiblingNode(root, targetId, newText = 'Nhánh mới') {
  if (root.id === targetId) {
    // Adding sibling to root -> add a new child to root instead
    return addChildNode(root, targetId, newText);
  }
  function traverse(parent) {
    const children = parent.children || [];
    const idx = children.findIndex(c => c.id === targetId);
    if (idx !== -1) {
      const target = children[idx];
      const newSibling = {
        id: generateNodeId(),
        text: (newText || '').trim() || 'Nhánh mới',
        color: target.color || PALETTE[0],
        isCollapsed: false,
        collapsed: false,
        notes: '',
        children: []
      };
      children.splice(idx + 1, 0, newSibling);
      return true;
    }
    for (const child of children) {
      if (traverse(child)) return true;
    }
    return false;
  }
  const cloned = cloneTree(root);
  traverse(cloned);
  return cloned;
}

// Delete node from tree (protecting root)
export function deleteNode(root, targetId) {
  if (root.id === targetId) {
    throw new Error('Không thể xóa nút gốc (Root node cannot be deleted)');
  }
  function remove(node) {
    if (!node.children) return false;
    const idx = node.children.findIndex(c => c.id === targetId);
    if (idx !== -1) {
      node.children.splice(idx, 1);
      return true;
    }
    for (const child of node.children) {
      if (remove(child)) return true;
    }
    return false;
  }
  const cloned = cloneTree(root);
  remove(cloned);
  return cloned;
}

// Rename node text
export function renameNode(root, targetId, newText) {
  function update(node) {
    if (node.id === targetId) {
      node.text = (newText || '').trim() || 'Nhánh mới';
      return true;
    }
    for (const child of (node.children || [])) {
      if (update(child)) return true;
    }
    return false;
  }
  const cloned = cloneTree(root);
  update(cloned);
  return cloned;
}

// Update node notes
export function updateNodeNotes(root, targetId, notes) {
  function update(node) {
    if (node.id === targetId) {
      node.notes = notes || '';
      return true;
    }
    for (const child of (node.children || [])) {
      if (update(child)) return true;
    }
    return false;
  }
  const cloned = cloneTree(root);
  update(cloned);
  return cloned;
}

// Update branch/node color (optionally propagate to children)
export function updateNodeColor(root, targetId, color, propagate = true) {
  function update(node, forceColor = null) {
    if (node.id === targetId || forceColor) {
      const activeColor = forceColor || color;
      node.color = activeColor;
      if (propagate && node.children) {
        for (const child of node.children) {
          update(child, activeColor);
        }
      }
      return true;
    }
    for (const child of (node.children || [])) {
      if (update(child, null)) return true;
    }
    return false;
  }
  const cloned = cloneTree(root);
  update(cloned);
  return cloned;
}

// Toggle collapse/expand status
export function toggleCollapse(root, targetId) {
  function toggle(node) {
    if (node.id === targetId) {
      const next = !node.isCollapsed;
      node.isCollapsed = next;
      node.collapsed = next;
      return true;
    }
    for (const child of (node.children || [])) {
      if (toggle(child)) return true;
    }
    return false;
  }
  const cloned = cloneTree(root);
  toggle(cloned);
  return cloned;
}

// Generate sequential DFS slide presentation array
export function generatePresentationSequence(root) {
  const steps = [];
  function dfs(node, path = []) {
    const currentPath = [...path, node.text];
    steps.push({
      nodeId: node.id,
      text: node.text,
      notes: node.notes || '',
      color: node.color || ROOT_COLOR,
      breadcrumbs: currentPath.join(' > '),
      childCount: (node.children || []).length
    });
    for (const child of (node.children || [])) {
      dfs(child, currentPath);
    }
  }
  if (root) dfs(root);
  return steps;
}

/**
 * Hierarchical Auto-Layout Engine:
 * Computes bounding boxes, tree subtree heights, assigns (x, y) coordinates for all visible nodes,
 * and builds Bézier connector curves.
 */
export function calculateTreeLayout(root, options = {}) {
  const {
    nodeWidth = 180,
    nodeHeight = 52,
    horizontalSpacing = 90,
    verticalSpacing = 28,
    startX = 120,
    startY = 400
  } = options;

  if (!root) {
    return {
      nodes: [],
      connectors: [],
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 }
    };
  }

  // Measure subtree heights recursively
  function measureSubtree(node) {
    const isCollapsed = Boolean(node.isCollapsed || node.collapsed);
    const children = (!isCollapsed && node.children) ? node.children : [];

    if (children.length === 0) {
      node._subtreeHeight = nodeHeight;
      return nodeHeight;
    }

    let totalChildrenHeight = 0;
    children.forEach((child, idx) => {
      totalChildrenHeight += measureSubtree(child);
      if (idx < children.length - 1) {
        totalChildrenHeight += verticalSpacing;
      }
    });

    node._subtreeHeight = Math.max(nodeHeight, totalChildrenHeight);
    return node._subtreeHeight;
  }

  measureSubtree(root);

  const positionedNodes = [];
  const connectors = [];

  // Position nodes starting from root
  function positionSubtree(node, x, y, level = 0) {
    const isCollapsed = Boolean(node.isCollapsed || node.collapsed);
    const visibleChildren = (!isCollapsed && node.children) ? node.children : [];
    const hiddenCount = isCollapsed && node.children ? node.children.length : 0;

    const positionedNode = {
      ...node,
      x,
      y,
      width: nodeWidth,
      height: nodeHeight,
      level,
      isCollapsed,
      hiddenCount,
    };
    positionedNodes.push(positionedNode);

    if (visibleChildren.length === 0) return;

    // Anchor points: Right middle of parent
    const parentAnchorX = x + nodeWidth;
    const parentAnchorY = y + nodeHeight / 2;

    const totalHeight = node._subtreeHeight;
    let currentY = y + nodeHeight / 2 - totalHeight / 2;

    visibleChildren.forEach((child) => {
      const childH = child._subtreeHeight;
      const childY = currentY + childH / 2 - nodeHeight / 2;
      const childX = x + nodeWidth + horizontalSpacing;

      // Anchor point: Left middle of child
      const childAnchorX = childX;
      const childAnchorY = childY + nodeHeight / 2;

      const path = generateCubicBezierPath(parentAnchorX, parentAnchorY, childAnchorX, childAnchorY, 0.48);
      connectors.push({
        id: `conn-${node.id}-${child.id}`,
        fromId: node.id,
        toId: child.id,
        x0: parentAnchorX,
        y0: parentAnchorY,
        x3: childAnchorX,
        y3: childAnchorY,
        path,
        color: child.color || node.color || ROOT_COLOR,
      });

      positionSubtree(child, childX, childY, level + 1);
      currentY += childH + verticalSpacing;
    });
  }

  positionSubtree(root, startX, startY, 0);

  // Compute overall bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  positionedNodes.forEach((n) => {
    if (n.x < minX) minX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.x + n.width > maxX) maxX = n.x + n.width;
    if (n.y + n.height > maxY) maxY = n.y + n.height;
  });

  const width = Math.max(100, maxX - minX);
  const height = Math.max(100, maxY - minY);
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;

  return {
    nodes: positionedNodes,
    connectors,
    bounds: { minX, minY, maxX, maxY, width, height, centerX, centerY }
  };
}
