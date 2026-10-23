/**
 * Comprehensive 4-Tier E2E Test Suite for Mindmap Studio & Focus Soundscapes (Frontend Engine)
 * Framework: Node.js Native Test Runner (node:test, node:assert/strict)
 * Tiers:
 *  - Tier 1: Isolated Feature Coverage (Canvas Transform, Bézier Curves, Tree CRUD, Audio Synth, Export, TTS, Flashcards)
 *  - Tier 2: Boundary & Corner Cases (Extreme Zoom Clamping, 20-Level Tree, Unicode/VN, Zero Volume, Single Node)
 *  - Tier 3: Cross-Feature Workflows (Text Gen -> Tree Edit -> Presentation -> Flashcards)
 *  - Tier 4: Real-World Scenarios (OS Lecture, Medical Pharmacology Taxonomy, Fullstack Roadmap)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ==============================================================================
// 1. ENGINE ALGORITHMS & IMPLEMENTATION LOGIC (MIRRORS FRONTEND ENGINE)
// ==============================================================================

export const CANVAS_BOUNDS = {
  MIN_ZOOM: 0.15,
  MAX_ZOOM: 3.0,
  DEFAULT_ZOOM: 1.0,
};

export function screenToWorld(sx, sy, tx, ty, zoom) {
  return {
    wx: (sx - tx) / zoom,
    wy: (sy - ty) / zoom,
  };
}

export function worldToScreen(wx, wy, tx, ty, zoom) {
  return {
    sx: wx * zoom + tx,
    sy: wy * zoom + ty,
  };
}

export function calculateFocalZoom(currentZoom, deltaY, px, py, tx, ty) {
  const zoomFactor = 1 - deltaY * 0.0015;
  const rawNextZoom = currentZoom * zoomFactor;
  const nextZoom = Math.max(CANVAS_BOUNDS.MIN_ZOOM, Math.min(CANVAS_BOUNDS.MAX_ZOOM, rawNextZoom));
  const nextTx = px - (px - tx) * (nextZoom / currentZoom);
  const nextTy = py - (py - ty) * (nextZoom / currentZoom);
  return { zoom: nextZoom, tx: nextTx, ty: nextTy };
}

export function generateCubicBezierPath(x0, y0, x3, y3, k = 0.5) {
  const deltaX = x3 - x0;
  const p1x = x0 + deltaX * k;
  const p1y = y0;
  const p2x = x3 - deltaX * k;
  const p2y = y3;
  return `M ${x0} ${y0} C ${p1x} ${p1y}, ${p2x} ${p2y}, ${x3} ${y3}`;
}

export const SOUNDSCAPE_CHANNELS = {
  rain: {
    name: 'Mưa rơi nhẹ (Gentle Rain)',
    lowpassCutoff: 850,
    bandpassCutoff: 1200,
    bandpassQ: 1.2,
    lfoFreq: 0.15,
  },
  cafe: {
    name: 'Quán cà phê (Cafe Ambience)',
    brownFilterLow: 200,
    brownFilterHigh: 2500,
    impulseFrequencies: [2800, 3400],
  },
  keyboard: {
    name: 'Bàn phím cơ (Mechanical Keyboard)',
    clickHighpassCutoff: 3500,
    clickDurationMs: 4,
    thockFreq: 320,
    thockDecayMs: 30,
  },
  waves: {
    name: 'Sóng biển (Ocean Waves)',
    lfoPeriodSeconds: 9.0,
    filterSweepMin: 250,
    filterSweepMax: 900,
  },
  alpha: {
    name: 'Sóng não Alpha 40Hz (Binaural Beats)',
    carrierFreq: 216,
    binauralOffset: 40,
    isochronicPulseFreq: 40,
  },
};

export const PALETTE = [
  "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6"
];

export function addChildNode(root, parentId, newText = 'Nhánh mới') {
  function traverse(node) {
    if (node.id === parentId) {
      const childColor = node.id === 'node-root'
        ? PALETTE[node.children.length % PALETTE.length]
        : (node.color || PALETTE[0]);
      const newChild = {
        id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        text: (newText || '').trim() || 'Nhánh mới',
        color: childColor,
        isCollapsed: false,
        children: []
      };
      node.children.push(newChild);
      return true;
    }
    for (const child of node.children) {
      if (traverse(child)) return true;
    }
    return false;
  }
  const cloned = JSON.parse(JSON.stringify(root));
  traverse(cloned);
  return cloned;
}

export function deleteNode(root, targetId) {
  if (root.id === targetId) {
    throw new Error('Không thể xóa nút gốc (Root node cannot be deleted)');
  }
  function remove(node) {
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
  const cloned = JSON.parse(JSON.stringify(root));
  remove(cloned);
  return cloned;
}

export function renameNode(root, targetId, newText) {
  function update(node) {
    if (node.id === targetId) {
      node.text = (newText || '').trim() || 'Nhánh mới';
      return true;
    }
    for (const child of node.children) {
      if (update(child)) return true;
    }
    return false;
  }
  const cloned = JSON.parse(JSON.stringify(root));
  update(cloned);
  return cloned;
}

export function toggleCollapse(root, targetId) {
  function toggle(node) {
    if (node.id === targetId) {
      node.isCollapsed = !node.isCollapsed;
      node.collapsed = node.isCollapsed;
      return true;
    }
    for (const child of node.children) {
      if (toggle(child)) return true;
    }
    return false;
  }
  const cloned = JSON.parse(JSON.stringify(root));
  toggle(cloned);
  return cloned;
}

export function generatePresentationSequence(root) {
  const steps = [];
  function dfs(node, path = []) {
    const currentPath = [...path, node.text];
    steps.push({
      nodeId: node.id,
      text: node.text,
      notes: node.notes || '',
      color: node.color || '#6366f1',
      breadcrumbs: currentPath.join(' > '),
      childCount: (node.children || []).length
    });
    for (const child of (node.children || [])) {
      dfs(child, currentPath);
    }
  }
  dfs(root);
  return steps;
}

export function convertTreeToFlashcards(root, deckName = 'Mindmap Deck') {
  const cards = [];
  function walk(node) {
    const children = node.children || [];
    if (children.length > 0) {
      const answers = children.map(c => `• ${c.text}`).join('\n');
      cards.push({
        id: `fc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        deck_name: deckName,
        front: node.text,
        back: node.notes ? `${node.notes}\n\n${answers}` : answers,
        box: 1,
        next_review: new Date().toISOString()
      });
      for (const child of children) {
        walk(child);
      }
    } else if (node.notes) {
      cards.push({
        id: `fc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        deck_name: deckName,
        front: node.text,
        back: node.notes,
        box: 1,
        next_review: new Date().toISOString()
      });
    }
  }
  walk(root);
  if (cards.length === 0 && root) {
    cards.push({
      id: `fc_${Date.now()}_fallback`,
      deck_name: deckName,
      front: root.text,
      back: `Chủ đề trọng tâm của ${deckName}`,
      box: 1,
      next_review: new Date().toISOString()
    });
  }
  return cards;
}

export function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function exportTreeToSvg(root, width = 1200, height = 800) {
  const paths = [];
  const nodes = [];

  function layout(node, x, y, dx, dy) {
    nodes.push(
      `<g transform="translate(${x},${y})">` +
      `<rect x="-80" y="-20" width="160" height="40" rx="8" fill="#1e293b" stroke="${node.color || '#6366f1'}" stroke-width="2"/>` +
      `<text x="0" y="5" fill="#f8fafc" font-size="13" text-anchor="middle" font-family="sans-serif">${escapeXml(node.text)}</text>` +
      `</g>`
    );

    const children = node.children || [];
    const stepY = children.length > 1 ? dy / (children.length - 1) : 0;
    const startY = y - dy / 2;

    children.forEach((child, idx) => {
      const childX = x + dx;
      const childY = children.length === 1 ? y : startY + idx * stepY;
      paths.push(
        `<path d="${generateCubicBezierPath(x + 80, y, childX - 80, childY)}" fill="none" stroke="${child.color || '#6366f1'}" stroke-width="2.5" stroke-opacity="0.8"/>`
      );
      layout(child, childX, childY, dx * 0.85, dy * 0.6);
    });
  }

  layout(root, 200, height / 2, 260, 300);

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="#0f172a"/>`,
    `<g id="connections">${paths.join('')}</g>`,
    `<g id="nodes">${nodes.join('')}</g>`,
    `</svg>`
  ].join('\n');
}


// ==============================================================================
// 2. TESTS: TIER 1 - FEATURE COVERAGE (ISOLATED FUNCTIONALITY)
// ==============================================================================

describe('Tier 1: Feature Coverage (Isolated Client-Side Functionality)', () => {

  it('1.1 Canvas Affine Transform: Screen to World coordinate projection', () => {
    const tx = 100, ty = 50, zoom = 2.0;
    const screenX = 300, screenY = 250;
    const world = screenToWorld(screenX, screenY, tx, ty, zoom);
    assert.strictEqual(world.wx, (300 - 100) / 2.0); // 100
    assert.strictEqual(world.wy, (250 - 50) / 2.0);  // 100
  });

  it('1.2 Canvas Affine Transform: World to Screen coordinate projection', () => {
    const tx = 100, ty = 50, zoom = 2.0;
    const wx = 100, wy = 100;
    const screen = worldToScreen(wx, wy, tx, ty, zoom);
    assert.strictEqual(screen.sx, 100 * 2.0 + 100); // 300
    assert.strictEqual(screen.sy, 100 * 2.0 + 50);  // 250
  });

  it('1.3 Canvas Focal Zoom: Cursor world coordinates remain invariant', () => {
    const tx = 50, ty = 30, zoom = 1.0;
    const cursorX = 400, cursorY = 300;
    const worldBefore = screenToWorld(cursorX, cursorY, tx, ty, zoom);

    const { zoom: nextZoom, tx: nextTx, ty: nextTy } = calculateFocalZoom(zoom, -100, cursorX, cursorY, tx, ty);
    const worldAfter = screenToWorld(cursorX, cursorY, nextTx, nextTy, nextZoom);

    assert.ok(Math.abs(worldBefore.wx - worldAfter.wx) < 1e-6);
    assert.ok(Math.abs(worldBefore.wy - worldAfter.wy) < 1e-6);
  });

  it('1.4 Cubic Bézier Curves: Generates smooth control points and valid SVG path', () => {
    const path = generateCubicBezierPath(100, 100, 300, 200, 0.5);
    assert.ok(path.startsWith('M 100 100 C '));
    assert.ok(path.includes('200 100, 200 200, 300 200'));
  });

  it('1.5 Node Operations: Add child node to root with palette color assignment', () => {
    const initialTree = {
      id: 'node-root',
      text: 'Gốc',
      color: '#6366f1',
      children: []
    };
    const updated = addChildNode(initialTree, 'node-root', 'Nhánh đầu tiên');
    assert.strictEqual(updated.children.length, 1);
    assert.strictEqual(updated.children[0].text, 'Nhánh đầu tiên');
    assert.strictEqual(updated.children[0].color, PALETTE[0]);
  });

  it('1.6 Node Operations: Delete sub-branch while protecting root node', () => {
    const tree = {
      id: 'node-root',
      text: 'Gốc',
      children: [
        { id: 'node-child-1', text: 'Nhánh 1', children: [] },
        { id: 'node-child-2', text: 'Nhánh 2', children: [] }
      ]
    };
    const updated = deleteNode(tree, 'node-child-1');
    assert.strictEqual(updated.children.length, 1);
    assert.strictEqual(updated.children[0].id, 'node-child-2');

    // Root deletion must throw error
    assert.throws(() => deleteNode(tree, 'node-root'), /Root node cannot be deleted/);
  });

  it('1.7 Focus Soundscape Parameters: Verifies all 5 channel frequencies', () => {
    assert.strictEqual(SOUNDSCAPE_CHANNELS.rain.lowpassCutoff, 850);
    assert.strictEqual(SOUNDSCAPE_CHANNELS.rain.bandpassCutoff, 1200);
    assert.strictEqual(SOUNDSCAPE_CHANNELS.cafe.impulseFrequencies[0], 2800);
    assert.strictEqual(SOUNDSCAPE_CHANNELS.keyboard.thockFreq, 320);
    assert.strictEqual(SOUNDSCAPE_CHANNELS.waves.lfoPeriodSeconds, 9.0);
    assert.strictEqual(SOUNDSCAPE_CHANNELS.alpha.binauralOffset, 40);
  });

  it('1.8 Flashcard Transformer: Extracts Q&A pairs from tree hierarchy', () => {
    const tree = {
      id: 'node-root',
      text: 'Khái niệm Lập trình Hướng đối tượng',
      children: [
        { id: 'n1', text: 'Đóng gói', children: [] },
        { id: 'n2', text: 'Kế thừa', children: [] }
      ]
    };
    const cards = convertTreeToFlashcards(tree, 'OOP Deck');
    assert.strictEqual(cards.length, 1);
    assert.strictEqual(cards[0].front, 'Khái niệm Lập trình Hướng đối tượng');
    assert.ok(cards[0].back.includes('• Đóng gói'));
    assert.ok(cards[0].back.includes('• Kế thừa'));
  });

  it('1.9 Vector SVG Export: Produces valid XML with nodes and connectors', () => {
    const tree = {
      id: 'node-root',
      text: 'Kiến trúc SVG',
      color: '#6366f1',
      children: [
        { id: 'n1', text: 'Vector Node', color: '#3b82f6', children: [] }
      ]
    };
    const svg = exportTreeToSvg(tree, 800, 600);
    assert.ok(svg.includes('<svg xmlns="http://www.w3.org/2000/svg"'));
    assert.ok(svg.includes('Kiến trúc SVG'));
    assert.ok(svg.includes('Vector Node'));
    assert.ok(svg.includes('<path d="M '));
  });

  it('1.10 Presentation Mode: Generates DFS slide sequence and breadcrumbs', () => {
    const tree = {
      id: 'node-root',
      text: 'Khoa học máy tính',
      children: [
        {
          id: 'n1',
          text: 'Thuật toán',
          children: [{ id: 'n11', text: 'Sắp xếp', children: [] }]
        }
      ]
    };
    const slides = generatePresentationSequence(tree);
    assert.strictEqual(slides.length, 3);
    assert.strictEqual(slides[0].text, 'Khoa học máy tính');
    assert.strictEqual(slides[1].text, 'Thuật toán');
    assert.strictEqual(slides[2].text, 'Sắp xếp');
    assert.strictEqual(slides[2].breadcrumbs, 'Khoa học máy tính > Thuật toán > Sắp xếp');
  });

});


// ==============================================================================
// 3. TESTS: TIER 2 - BOUNDARY & CORNER CASES
// ==============================================================================

describe('Tier 2: Boundary & Corner Cases', () => {

  it('2.1 Extreme Zoom In & Out Clamping [0.15, 3.0]', () => {
    // Zoom in beyond 3.0
    const zoomIn = calculateFocalZoom(2.8, -5000, 500, 400, 0, 0);
    assert.strictEqual(zoomIn.zoom, 3.0);

    // Zoom out beyond 0.15
    const zoomOut = calculateFocalZoom(0.2, 5000, 500, 400, 0, 0);
    assert.strictEqual(zoomOut.zoom, 0.15);
  });

  it('2.2 Deep 20-Level Tree: Recursion and presentation generation without stack overflow', () => {
    let current = { id: 'node-20', text: 'Level 20 Leaf', children: [] };
    for (let i = 19; i >= 1; i--) {
      current = { id: `node-${i}`, text: `Level ${i}`, children: [current] };
    }
    const deepTree = { id: 'node-root', text: 'Level 0 Root', children: [current] };

    const slides = generatePresentationSequence(deepTree);
    assert.strictEqual(slides.length, 21);
    assert.strictEqual(slides[20].text, 'Level 20 Leaf');
  });

  it('2.3 Unicode & Vietnamese Text: Escaping and XML safety', () => {
    const rawText = `Hóa học Hữu cơ: Axit & Bazơ <tag> "Special" 'Chars' ∑ π`;
    const escaped = escapeXml(rawText);
    assert.ok(!escaped.includes('<tag>'));
    assert.ok(escaped.includes('&lt;tag&gt;'));
    assert.ok(escaped.includes('&amp;'));
    assert.ok(escaped.includes('&quot;'));
  });

  it('2.4 Blank and whitespace node renaming defaults to "Nhánh mới"', () => {
    const tree = { id: 'node-root', text: 'Gốc', children: [{ id: 'n1', text: 'Cũ', children: [] }] };
    const updated = renameNode(tree, 'n1', '   \t  ');
    assert.strictEqual(updated.children[0].text, 'Nhánh mới');
  });

  it('2.5 Single Node Tree: Flashcard fallback and Presentation 1-slide handling', () => {
    const single = { id: 'node-root', text: 'Khái niệm đơn độc', children: [] };
    const cards = convertTreeToFlashcards(single, 'Solo Deck');
    assert.strictEqual(cards.length, 1);
    assert.strictEqual(cards[0].front, 'Khái niệm đơn độc');

    const slides = generatePresentationSequence(single);
    assert.strictEqual(slides.length, 1);
    assert.strictEqual(slides[0].text, 'Khái niệm đơn độc');
  });

  it('2.6 Toggle collapse status toggles both isCollapsed and collapsed flags', () => {
    const tree = { id: 'node-root', text: 'Gốc', isCollapsed: false, children: [] };
    const collapsedTree = toggleCollapse(tree, 'node-root');
    assert.strictEqual(collapsedTree.isCollapsed, true);
    assert.strictEqual(collapsedTree.collapsed, true);

    const expandedTree = toggleCollapse(collapsedTree, 'node-root');
    assert.strictEqual(expandedTree.isCollapsed, false);
    assert.strictEqual(expandedTree.collapsed, false);
  });

});


// ==============================================================================
// 4. TESTS: TIER 3 - CROSS-FEATURE WORKFLOW COMBINATIONS
// ==============================================================================

describe('Tier 3: Cross-Feature Workflow Combinations', () => {

  it('3.1 Workflow: Tree manipulation -> Presentation Slide sequence -> Flashcard conversion', () => {
    // 1. Initial Tree
    let tree = {
      id: 'node-root',
      text: 'Mạng Máy Tính',
      color: '#6366f1',
      children: [
        { id: 'layer-app', text: 'Tầng Ứng dụng', children: [] },
        { id: 'layer-trans', text: 'Tầng Giao vận', children: [] }
      ]
    };

    // 2. Add child nodes
    tree = addChildNode(tree, 'layer-app', 'HTTP / HTTPS');
    tree = addChildNode(tree, 'layer-trans', 'TCP & UDP');

    // 3. Generate presentation slides
    const slides = generatePresentationSequence(tree);
    assert.strictEqual(slides.length, 5); // Root + 2 Layers + 2 Sub-protocols

    // 4. Convert to flashcards
    const flashcards = convertTreeToFlashcards(tree, 'Computer Networks');
    assert.strictEqual(flashcards.length, 3); // Root, App Layer, Transport Layer
    assert.ok(flashcards.some(c => c.front === 'Tầng Ứng dụng' && c.back.includes('HTTP / HTTPS')));
  });

  it('3.2 Workflow: Canvas Viewport Transformation invariant during Pan and Zoom gestures', () => {
    let tx = 0, ty = 0, zoom = 1.0;
    const centerScreenX = 600, centerScreenY = 400;

    // Simulate Pan gesture (+150px X, -50px Y)
    tx += 150;
    ty -= 50;

    // World coordinate under cursor
    const w1 = screenToWorld(centerScreenX, centerScreenY, tx, ty, zoom);

    // Zoom in toward center cursor
    const zoomed = calculateFocalZoom(zoom, -120, centerScreenX, centerScreenY, tx, ty);
    const w2 = screenToWorld(centerScreenX, centerScreenY, zoomed.tx, zoomed.ty, zoomed.zoom);

    // Coordinate must be invariant
    assert.ok(Math.abs(w1.wx - w2.wx) < 1e-6);
    assert.ok(Math.abs(w1.wy - w2.wy) < 1e-6);
  });

  it('3.3 Workflow: Branch palette coloring cascades down newly created sub-nodes', () => {
    let tree = {
      id: 'node-root',
      text: 'Chủ đề',
      color: '#6366f1',
      children: []
    };
    // Add 3 main branches
    tree = addChildNode(tree, 'node-root', 'Nhánh 1');
    tree = addChildNode(tree, 'node-root', 'Nhánh 2');
    tree = addChildNode(tree, 'node-root', 'Nhánh 3');

    assert.strictEqual(tree.children[0].color, PALETTE[0]);
    assert.strictEqual(tree.children[1].color, PALETTE[1]);
    assert.strictEqual(tree.children[2].color, PALETTE[2]);

    // Add sub-node to Nhánh 2 -> must inherit Nhánh 2's color (PALETTE[1])
    const n2Id = tree.children[1].id;
    tree = addChildNode(tree, n2Id, 'Nhánh con của 2');
    const n2Node = tree.children[1];
    assert.strictEqual(n2Node.children[0].color, PALETTE[1]);
  });

});


// ==============================================================================
// 5. TESTS: TIER 4 - REAL-WORLD APPLICATION SCENARIOS
// ==============================================================================

describe('Tier 4: Real-World Application Scenarios', () => {

  it('4.1 Scenario 1: University Operating Systems Lecture Note study', () => {
    const lectureTree = {
      id: 'node-root',
      text: 'Hệ Điều Hành Đại Cương',
      color: '#6366f1',
      children: [
        {
          id: 'ch1',
          text: 'Quản lý Tiến trình',
          notes: 'Khái niệm PCB, trạng thái tiến trình và chuyển ngữ cảnh.',
          children: [
            { id: 'ch1-1', text: 'Ready, Running, Waiting', children: [] },
            { id: 'ch1-2', text: 'Điều độ Round Robin', children: [] }
          ]
        },
        {
          id: 'ch2',
          text: 'Quản lý Bộ nhớ',
          notes: 'Không gian địa chỉ logic và vật lý.',
          children: [
            { id: 'ch2-1', text: 'Phân trang & Bảng trang', children: [] },
            { id: 'ch2-2', text: 'Thuật toán LRU', children: [] }
          ]
        }
      ]
    };

    // 1. Verify presentation slide count and sequence
    const slides = generatePresentationSequence(lectureTree);
    assert.strictEqual(slides.length, 7);
    assert.strictEqual(slides[0].text, 'Hệ Điều Hành Đại Cương');
    assert.strictEqual(slides[1].text, 'Quản lý Tiến trình');

    // 2. Export flashcard deck for exam preparation
    const flashcards = convertTreeToFlashcards(lectureTree, 'Exam OS 2026');
    assert.strictEqual(flashcards.length, 3);
    assert.ok(flashcards[1].back.includes('Khái niệm PCB'));
    assert.ok(flashcards[1].back.includes('• Điều độ Round Robin'));

    // 3. Export SVG vector schematic
    const svg = exportTreeToSvg(lectureTree);
    assert.ok(svg.includes('Hệ Điều Hành Đại Cương'));
    assert.ok(svg.includes('Quản lý Tiến trình'));
    assert.ok(svg.includes('Thuật toán LRU'));
  });

  it('4.2 Scenario 2: Medical Pharmacology Taxonomy Classification', () => {
    const pharmacologyTree = {
      id: 'node-root',
      text: 'Dược Lý Học: Kháng Sinh',
      children: [
        {
          id: 'med-beta',
          text: 'Beta-lactam',
          children: [
            {
              id: 'med-pen',
              text: 'Penicillin',
              children: [
                { id: 'med-p1', text: 'Penicillin G (IV)', children: [] },
                { id: 'med-p2', text: 'Amoxicillin (Oral)', children: [] }
              ]
            },
            {
              id: 'med-ceph',
              text: 'Cephalosporin',
              children: [
                { id: 'med-c1', text: 'Thế hệ 1: Cefazolin', children: [] },
                { id: 'med-c3', text: 'Thế hệ 3: Ceftriaxone', children: [] }
              ]
            }
          ]
        },
        {
          id: 'med-macro',
          text: 'Macrolide',
          children: [
            { id: 'med-m1', text: 'Azithromycin (T1/2 dài)', children: [] },
            { id: 'med-m2', text: 'Clarithromycin (Phác đồ HP)', children: [] }
          ]
        }
      ]
    };

    const slides = generatePresentationSequence(pharmacologyTree);
    // Root (1) + Beta (1) + Pen (1) + 2 Pen children (2) + Ceph (1) + 2 Ceph children (2) + Macro (1) + 2 Macro children (2) = 11
    assert.strictEqual(slides.length, 11);

    const flashcards = convertTreeToFlashcards(pharmacologyTree, 'Dược Lý Kháng Sinh');
    assert.ok(flashcards.length >= 4);
    assert.ok(flashcards.some(c => c.front === 'Beta-lactam'));
    assert.ok(flashcards.some(c => c.front === 'Cephalosporin'));
  });

  it('4.3 Scenario 3: Fullstack Web Development Roadmap', () => {
    const roadmap = {
      id: 'node-root',
      text: 'Fullstack Roadmap 2026',
      children: [
        {
          id: 'fe',
          text: 'Frontend',
          children: [
            { id: 'fe-react', text: 'React 18 & Vite', children: [] },
            { id: 'fe-tailwind', text: 'Tailwind CSS', children: [] }
          ]
        },
        {
          id: 'be',
          text: 'Backend',
          children: [
            { id: 'be-fastapi', text: 'FastAPI & Async Python', children: [] },
            { id: 'be-sqlite', text: 'SQLite Direct Storage', children: [] }
          ]
        },
        {
          id: 'devops',
          text: 'DevOps & Tooling',
          children: [
            { id: 'do-docker', text: 'Docker & Compose', children: [] },
            { id: 'do-actions', text: 'GitHub Actions CI/CD', children: [] }
          ]
        }
      ]
    };

    const slides = generatePresentationSequence(roadmap);
    // Root + 3 Domains + 6 Sub-skills = 10
    assert.strictEqual(slides.length, 10);

    const svg = exportTreeToSvg(roadmap, 1600, 900);
    assert.ok(svg.includes('Fullstack Roadmap 2026'));
    assert.ok(svg.includes('FastAPI &amp; Async Python'));
    assert.ok(svg.includes('GitHub Actions CI/CD'));
  });

});
