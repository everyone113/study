import test from 'node:test'
import assert from 'node:assert/strict'

// Set up lightweight headless Web Audio API mock so full engine synthesis can be exercised
class MockAudioParam {
  constructor(val = 0) { this.value = val }
  setValueAtTime(v) { this.value = v }
  setTargetAtTime(v) { this.value = v }
  linearRampToValueAtTime(v) { this.value = v }
  exponentialRampToValueAtTime(v) { this.value = v }
}

class MockAudioNode {
  constructor() {
    this.gain = new MockAudioParam(1)
    this.frequency = new MockAudioParam(440)
    this.Q = new MockAudioParam(1)
    this.threshold = new MockAudioParam(-6)
    this.knee = new MockAudioParam(10)
    this.ratio = new MockAudioParam(8)
    this.attack = new MockAudioParam(0.003)
    this.release = new MockAudioParam(0.25)
  }
  connect() {}
  start() {}
  stop() {}
}

class MockAudioContext {
  constructor() {
    this.currentTime = 0
    this.state = 'running'
    this.sampleRate = 44100
  }
  createGain() { return new MockAudioNode() }
  createDynamicsCompressor() { return new MockAudioNode() }
  createBiquadFilter() { return new MockAudioNode() }
  createOscillator() { return new MockAudioNode() }
  createChannelMerger() { return new MockAudioNode() }
  createBufferSource() { return new MockAudioNode() }
  createBuffer(channels, length, sampleRate) {
    return {
      getChannelData: () => new Float32Array(length),
      duration: length / sampleRate
    }
  }
  resume() { this.state = 'running' }
  close() { this.state = 'closed' }
}

globalThis.window = {
  AudioContext: MockAudioContext,
  webkitAudioContext: MockAudioContext
}

import {
  screenToWorld,
  worldToScreen,
  calculateFocalZoom,
  generateCubicBezierPath,
  addChildNode,
  addSiblingNode,
  deleteNode,
  renameNode,
  updateNodeNotes,
  updateNodeColor,
  toggleCollapse,
  calculateTreeLayout,
  countTreeNodes,
  findNode,
  cloneTree,
  CANVAS_BOUNDS,
  PALETTE,
  ROOT_COLOR
} from '../src/utils/mindmapTreeUtils.js'
import soundscapeEngine, {
  SOUNDSCAPE_CHANNELS,
  SOUNDSCAPE_PRESETS
} from '../src/utils/soundscapeAudioEngine.js'
import {
  escapeXml,
  exportTreeToSvg,
  convertTreeToFlashcards
} from '../src/utils/exportUtils.js'

test('Tier 5 Adversarial Hardening Suite', async (t) => {

  await t.test('1. Large Mindmap Trees & Recursive Operations Stress Test', () => {
    // 1.1 Generate massive synthetic tree: 10 branches, each with 10 subbranches, each with 10 leaves = 1 + 10 + 100 + 1000 = 1111 nodes
    const root = {
      id: 'node-root',
      text: 'Đại Viện Nghiên Cứu AI',
      color: ROOT_COLOR,
      isCollapsed: false,
      children: []
    }

    let nodeCounter = 0
    for (let i = 0; i < 10; i++) {
      const b1 = {
        id: `branch-1-${i}`,
        text: `Khoa ${i}: Chuyên Ngành Kỹ Thuật ${i}`,
        color: PALETTE[i % PALETTE.length],
        isCollapsed: false,
        children: []
      }
      for (let j = 0; j < 10; j++) {
        const b2 = {
          id: `branch-2-${i}-${j}`,
          text: `Lab ${i}.${j}: Phòng Thí Nghiệm & Thuật Toán`,
          color: b1.color,
          isCollapsed: false,
          children: []
        }
        for (let k = 0; k < 10; k++) {
          nodeCounter++
          b2.children.push({
            id: `leaf-${i}-${j}-${k}`,
            text: `Đề tài #${nodeCounter}: Mô hình lượng tử hóa & Diacritics Tiếng Việt Ứng Dụng`,
            color: b1.color,
            isCollapsed: false,
            notes: `Ghi chú chi tiết của đề tài #${nodeCounter} với ký tự đặc biệt <>&"'\nĐộ chính xác cao`,
            children: []
          })
        }
        b1.children.push(b2)
      }
      root.children.push(b1)
    }

    // Verify exact node count
    const totalCount = countTreeNodes(root)
    assert.equal(totalCount, 1111, 'Total nodes in massive tree must equal 1111')

    // Find node stress test (deepest leaf)
    const targetId = 'leaf-9-9-9'
    const foundNode = findNode(root, targetId)
    assert.ok(foundNode, 'Deepest leaf node must be found')
    assert.equal(foundNode.id, targetId)
    assert.equal(findNode(root, 'nonexistent-id-99999'), null, 'Nonexistent ID must return null')

    // Layout calculation performance and numerical integrity
    const t0 = performance.now()
    const layoutResult = calculateTreeLayout(root)
    const duration = performance.now() - t0

    assert.ok(layoutResult.nodes, 'layoutResult must contain nodes array')
    assert.equal(layoutResult.nodes.length, 1111, 'Layout should contain exactly 1111 nodes')
    assert.equal(layoutResult.connectors.length, 1110, 'Layout should contain exactly 1110 connectors')
    assert.ok(layoutResult.bounds.width > 0, 'Bounding width must be positive')
    assert.ok(layoutResult.bounds.height > 0, 'Bounding height must be positive')
    assert.ok(duration < 250, `Layout calculation for 1111 nodes took ${duration.toFixed(2)}ms (< 250ms target)`)

    // Verify all layout coordinates are finite, valid numbers
    for (const node of layoutResult.nodes) {
      assert.ok(Number.isFinite(node.x), `node.x must be finite for ${node.id}`)
      assert.ok(Number.isFinite(node.y), `node.y must be finite for ${node.id}`)
      assert.ok(Number.isFinite(node.width), `node.width must be finite for ${node.id}`)
      assert.ok(Number.isFinite(node.height), `node.height must be finite for ${node.id}`)
    }

    // Test addition and deletion at scale
    const treeWithChild = addChildNode(root, targetId, 'Sub-hypothesis Alpha')
    assert.equal(countTreeNodes(treeWithChild), 1112, 'Tree should have 1112 nodes after addChild')

    const treeAfterDelete = deleteNode(treeWithChild, targetId)
    // Deleting targetId deletes targetId AND its child Sub-hypothesis Alpha (-2 nodes)
    assert.equal(countTreeNodes(treeAfterDelete), 1110, 'Tree should have 1110 nodes after deleting target and child')

    // Root deletion protection: must throw explicit Error
    assert.throws(
      () => deleteNode(treeAfterDelete, 'node-root'),
      /Không thể xóa nút gốc/,
      'Deleting root node must throw an explicit error protecting root'
    )
  })

  await t.test('2. Coordinate Transforms & Affine Geometry Stress Invariants', () => {
    // 2.1 ScreenToWorld and WorldToScreen mathematical bijection across 1,000 random test vectors
    for (let iter = 0; iter < 1000; iter++) {
      const origWx = (Math.random() - 0.5) * 200000 // [-100000, 100000]
      const origWy = (Math.random() - 0.5) * 200000
      const tx = (Math.random() - 0.5) * 10000
      const ty = (Math.random() - 0.5) * 10000
      const zoom = CANVAS_BOUNDS.MIN_ZOOM + Math.random() * (CANVAS_BOUNDS.MAX_ZOOM - CANVAS_BOUNDS.MIN_ZOOM)

      // Project World -> Screen
      const { sx, sy } = worldToScreen(origWx, origWy, tx, ty, zoom)
      assert.ok(Number.isFinite(sx) && Number.isFinite(sy), 'Screen coords must be finite')

      // Project Screen -> World
      const { wx, wy } = screenToWorld(sx, sy, tx, ty, zoom)
      assert.ok(Math.abs(wx - origWx) < 1e-6, `wx roundtrip error: ${Math.abs(wx - origWx)}`)
      assert.ok(Math.abs(wy - origWy) < 1e-6, `wy roundtrip error: ${Math.abs(wy - origWy)}`)
    }

    // 2.2 Focal Zoom Invariance: Mouse world point must not drift during focal zoom
    const cursorScreenX = 640
    const cursorScreenY = 480
    let zoom = 1.0
    let tx = 100
    let ty = 50

    // Initial world point under cursor
    const initialWorld = screenToWorld(cursorScreenX, cursorScreenY, tx, ty, zoom)

    // Execute 50 consecutive zoom gestures (wheel ticks)
    for (let step = 0; step < 50; step++) {
      const deltaY = (step % 2 === 0 ? 1 : -1) * (15 + step * 2)
      const next = calculateFocalZoom(zoom, deltaY, cursorScreenX, cursorScreenY, tx, ty)
      zoom = next.zoom
      tx = next.tx
      ty = next.ty

      const currentWorld = screenToWorld(cursorScreenX, cursorScreenY, tx, ty, zoom)
      assert.ok(
        Math.abs(currentWorld.wx - initialWorld.wx) < 1e-9,
        `Cursor world X drifted at step ${step}: ${Math.abs(currentWorld.wx - initialWorld.wx)}`
      )
      assert.ok(
        Math.abs(currentWorld.wy - initialWorld.wy) < 1e-9,
        `Cursor world Y drifted at step ${step}: ${Math.abs(currentWorld.wy - initialWorld.wy)}`
      )
    }

    // 2.3 Extreme Zoom Clamping
    const clampedMax = calculateFocalZoom(1.0, -1000000, 500, 500, 0, 0)
    assert.equal(clampedMax.zoom, CANVAS_BOUNDS.MAX_ZOOM, 'Extreme zoom in must clamp to MAX_ZOOM (3.0)')

    const clampedMin = calculateFocalZoom(1.0, 1000000, 500, 500, 0, 0)
    assert.equal(clampedMin.zoom, CANVAS_BOUNDS.MIN_ZOOM, 'Extreme zoom out must clamp to MIN_ZOOM (0.15)')
  })

  await t.test('3. SVG Bézier Path Generation & Vector XML Stress Test', () => {
    // 3.1 Strict Bézier Path Syntax Regex
    const bezierRegex = /^M\s+(-?\d+(\.\d+)?)\s+(-?\d+(\.\d+)?)\s+C\s+(-?\d+(\.\d+)?)\s+(-?\d+(\.\d+)?),\s+(-?\d+(\.\d+)?)\s+(-?\d+(\.\d+)?),\s+(-?\d+(\.\d+)?)\s+(-?\d+(\.\d+)?)$/

    // Test standard, reverse, vertical, and coincident points
    const testCases = [
      { x0: 0, y0: 0, x3: 200, y3: 150 },
      { x0: 500, y0: 300, x3: 100, y3: 200 }, // Backward connection
      { x0: 100, y0: 50, x3: 100, y3: 400 },  // Vertical alignment
      { x0: 250, y0: 250, x3: 250, y3: 250 }, // Coincident point
      { x0: -100000, y0: -50000, x3: 100000, y3: 50000 }, // Huge coordinates
    ]

    for (const { x0, y0, x3, y3 } of testCases) {
      const path = generateCubicBezierPath(x0, y0, x3, y3)
      assert.ok(bezierRegex.test(path), `Path "${path}" failed regex verification`)
      assert.ok(path.startsWith(`M ${x0} ${y0} C `), 'Path must start with M x0 y0 C')
      assert.ok(path.endsWith(` ${x3} ${y3}`), 'Path must end with x3 y3')
    }

    // 3.2 Vector SVG Export Stress Test with Adversarial Payloads
    const evilTree = {
      id: 'node-root',
      text: 'Root <script>alert("XSS")</script> & "Dangerous" \'Characters\'',
      color: '#6366f1',
      children: [
        {
          id: 'child-1',
          text: 'Tiếng Việt Có Dấu: ắ, ế, ố, ữ, đ, ỹ & Special Symbol © ® ™',
          color: '#ec4899',
          children: [
            {
              id: 'child-1-1',
              text: 'Zero-Width & HTML Entities: &#60;&#62;&amp; <img src=x onerror=alert(1)>',
              color: '#ec4899',
              children: []
            }
          ]
        }
      ]
    }

    const svgOutput = exportTreeToSvg(evilTree, 1600, 1000)
    assert.ok(svgOutput.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'SVG must have valid XML declaration')
    assert.ok(svgOutput.includes('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"'), 'SVG must have correct root attributes')
    assert.ok(!svgOutput.includes('<script>'), 'Unescaped <script> tag must NOT appear in SVG XML')
    assert.ok(!svgOutput.includes('<img src=x'), 'Unescaped <img> tag must NOT appear in SVG XML')
    assert.ok(svgOutput.includes('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'), 'XSS payload must be properly escaped')
    assert.ok(svgOutput.includes('&amp;'), 'Ampersands must be escaped')
    assert.ok(svgOutput.includes('&quot;Dangerous&quot;'), 'Quotes must be escaped')
    assert.ok(svgOutput.endsWith('</svg>'), 'SVG must terminate with closing </svg> tag')
  })

  await t.test('4. Spaced Repetition Flashcard Extraction Validation', () => {
    // 4.1 Hierarchical extraction from multi-level tree
    const tree = {
      id: 'node-root',
      text: 'Hệ Thống Phân Tán (Distributed Systems)',
      color: '#6366f1',
      notes: 'Mô hình điện toán đám mây và cluster',
      children: [
        {
          id: 'branch-1',
          text: 'Định Lý CAP',
          color: '#3b82f6',
          notes: 'Eric Brewer 2000',
          children: [
            { id: 'leaf-1', text: 'Consistency (Nhất quán)', notes: 'Mọi node thấy cùng dữ liệu', children: [] },
            { id: 'leaf-2', text: 'Availability (Sẵn sàng)', notes: 'Mọi request đều nhận phản hồi', children: [] },
            { id: 'leaf-3', text: 'Partition Tolerance (Chịu phân vùng)', notes: 'Hệ thống hoạt động dù mạng ngắt', children: [] }
          ]
        },
        {
          id: 'branch-2',
          text: 'Mô Hình Đồng Thuận (Consensus)',
          color: '#10b981',
          notes: '',
          children: [
            { id: 'leaf-4', text: 'Raft: Dễ hiểu, Leader election & Log replication', children: [] },
            { id: 'leaf-5', text: 'Paxos: Chuẩn học thuật kinh điển của Leslie Lamport', children: [] }
          ]
        }
      ]
    }

    const cards = convertTreeToFlashcards(tree, 'Distributed Systems Exam')
    assert.ok(cards.length >= 3, `Expected at least 3 cards, got ${cards.length}`)

    // Verify card structure contract
    for (const card of cards) {
      assert.ok(card.id.startsWith('fc_'), 'Card ID must follow fc_ prefix convention')
      assert.equal(card.deck_name, 'Distributed Systems Exam')
      assert.ok(card.front && card.front.trim().length > 0, 'Card front must be non-empty')
      assert.ok(card.back && card.back.trim().length > 0, 'Card back must be non-empty')
      assert.equal(card.box, 1, 'Initial Leitner box must be 1')
      assert.ok(!isNaN(Date.parse(card.next_review)), 'next_review must be a valid ISO date')
    }

    // Verify CAP theorem card contains all 3 children
    const capCard = cards.find(c => c.front === 'Định Lý CAP')
    assert.ok(capCard, 'CAP card must exist')
    assert.ok(capCard.back.includes('Eric Brewer 2000'), 'CAP card back must include parent notes')
    assert.ok(capCard.back.includes('Consistency (Nhất quán)'), 'CAP card back must include child 1')
    assert.ok(capCard.back.includes('Availability (Sẵn sàng)'), 'CAP card back must include child 2')
    assert.ok(capCard.back.includes('Partition Tolerance (Chịu phân vùng)'), 'CAP card back must include child 3')

    // 4.2 Leaf notes extraction
    const leaf1Card = cards.find(c => c.front === 'Consistency (Nhất quán)')
    assert.ok(leaf1Card, 'Leaf node with notes must generate a flashcard')
    assert.equal(leaf1Card.back, 'Mọi node thấy cùng dữ liệu')

    // 4.3 Fallback for single node without notes
    const singleNode = { id: 'root', text: 'Khái niệm đơn độc', children: [] }
    const fallbackCards = convertTreeToFlashcards(singleNode, 'Fallback Deck')
    assert.equal(fallbackCards.length, 1, 'Single node must generate 1 fallback card')
    assert.equal(fallbackCards[0].front, 'Khái niệm đơn độc')
    assert.ok(fallbackCards[0].back.includes('Chủ đề trọng tâm'), 'Fallback back text must contain deck summary')
  })

  await t.test('5. Soundscape Engine Parameter Clamping & State Invariants', () => {
    // 5.1 Master volume clamping
    soundscapeEngine.setMasterVolume(1.85)
    assert.equal(soundscapeEngine.getState().masterVolume, 1.0, 'Master volume > 1 must clamp to 1.0')

    soundscapeEngine.setMasterVolume(-0.45)
    assert.equal(soundscapeEngine.getState().masterVolume, 0.0, 'Master volume < 0 must clamp to 0.0')

    soundscapeEngine.setMasterVolume(0.72)
    assert.equal(soundscapeEngine.getState().masterVolume, 0.72, 'Valid master volume must be accepted')

    // 5.2 Channel volume clamping across all 5 channels
    const channels = ['rain', 'cafe', 'keyboard', 'waves', 'alpha']
    for (const ch of channels) {
      soundscapeEngine.setChannelVolume(ch, 999.0)
      assert.equal(soundscapeEngine.getState().volumes[ch], 1.0, `${ch} volume > 1 must clamp to 1.0`)

      soundscapeEngine.setChannelVolume(ch, -50.0)
      assert.equal(soundscapeEngine.getState().volumes[ch], 0.0, `${ch} volume < 0 must clamp to 0.0`)

      soundscapeEngine.setChannelVolume(ch, 0.65)
      assert.equal(soundscapeEngine.getState().volumes[ch], 0.65, `${ch} valid volume must be accepted`)
    }

    // 5.3 Channel mute toggle invariants
    for (const ch of channels) {
      const initialMute = soundscapeEngine.getState().mutes[ch]
      const toggled = soundscapeEngine.toggleChannelMute(ch)
      assert.equal(toggled, !initialMute, `${ch} toggle must invert state`)
      assert.equal(soundscapeEngine.getState().mutes[ch], !initialMute)

      // Toggle back
      const restored = soundscapeEngine.toggleChannelMute(ch)
      assert.equal(restored, initialMute)
      assert.equal(soundscapeEngine.getState().mutes[ch], initialMute)
    }

    // 5.4 Soundscape Presets Invariants
    for (const [presetKey, presetDef] of Object.entries(SOUNDSCAPE_PRESETS)) {
      soundscapeEngine.applyPreset(presetKey)
      const state = soundscapeEngine.getState()
      for (const [ch, expectedVol] of Object.entries(presetDef.volumes)) {
        assert.equal(state.volumes[ch], expectedVol, `Preset ${presetKey} channel ${ch} volume must match`)
        assert.equal(state.mutes[ch], false, `Preset ${presetKey} channel ${ch} must be unmuted`)
      }
    }

    // 5.5 State listener notification verification
    let notifiedState = null
    const unsubscribe = soundscapeEngine.subscribe((s) => {
      notifiedState = s
    })

    soundscapeEngine.setMasterVolume(0.88)
    assert.ok(notifiedState, 'Subscriber should be notified on master volume change')
    assert.equal(notifiedState.masterVolume, 0.88)

    soundscapeEngine.setChannelVolume('rain', 0.42)
    assert.equal(notifiedState.volumes.rain, 0.42, 'Subscriber should receive updated channel volume')

    unsubscribe()
    notifiedState = null
    soundscapeEngine.setMasterVolume(0.5)
    assert.equal(notifiedState, null, 'Unsubscribed listener must NOT receive notifications')

    // Clean up
    soundscapeEngine.destroy()
  })
})
