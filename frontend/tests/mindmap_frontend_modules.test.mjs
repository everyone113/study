import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  CANVAS_BOUNDS,
  PALETTE,
  ROOT_COLOR,
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
  generatePresentationSequence,
  findNode,
  countTreeNodes
} from '../src/utils/mindmapTreeUtils.js';

import {
  SOUNDSCAPE_CHANNELS,
  SOUNDSCAPE_PRESETS,
  soundscapeEngine
} from '../src/utils/soundscapeAudioEngine.js';

import {
  escapeXml,
  exportTreeToSvg,
  convertTreeToFlashcards
} from '../src/utils/exportUtils.js';

describe('Frontend Source Code Verification: TreeUtils, AudioEngine & ExportUtils', () => {

  it('Verifies mindmapTreeUtils exports and calculations', () => {
    assert.strictEqual(CANVAS_BOUNDS.MIN_ZOOM, 0.15);
    assert.strictEqual(CANVAS_BOUNDS.MAX_ZOOM, 3.0);
    assert.strictEqual(ROOT_COLOR, '#6366f1');
    assert.strictEqual(PALETTE.length, 8);

    // Screen and World transforms
    const world = screenToWorld(400, 300, 100, 50, 2.0);
    assert.strictEqual(world.wx, 150);
    assert.strictEqual(world.wy, 125);

    const screen = worldToScreen(150, 125, 100, 50, 2.0);
    assert.strictEqual(screen.sx, 400);
    assert.strictEqual(screen.sy, 300);

    // Bézier generator
    const bezier = generateCubicBezierPath(0, 0, 200, 100, 0.5);
    assert.ok(bezier.startsWith('M 0 0 C 100 0, 100 100, 200 100'));

    // Tree CRUD
    const root = { id: 'node-root', text: 'Root', color: ROOT_COLOR, children: [] };
    const withChild = addChildNode(root, 'node-root', 'Child 1');
    assert.strictEqual(withChild.children.length, 1);
    assert.strictEqual(withChild.children[0].text, 'Child 1');

    const withSibling = addSiblingNode(withChild, withChild.children[0].id, 'Child 2');
    assert.strictEqual(withSibling.children.length, 2);

    const renamed = renameNode(withSibling, withSibling.children[0].id, 'Renamed Child');
    assert.strictEqual(renamed.children[0].text, 'Renamed Child');

    const withNotes = updateNodeNotes(renamed, renamed.children[0].id, 'Some notes');
    assert.strictEqual(withNotes.children[0].notes, 'Some notes');

    const withColor = updateNodeColor(withNotes, withNotes.children[0].id, '#10b981');
    assert.strictEqual(withColor.children[0].color, '#10b981');

    const collapsed = toggleCollapse(withColor, 'node-root');
    assert.strictEqual(collapsed.isCollapsed, true);
    assert.strictEqual(collapsed.collapsed, true);

    const count = countTreeNodes(withSibling);
    assert.strictEqual(count, 3);

    // Tree Layout
    const layout = calculateTreeLayout(withSibling);
    assert.strictEqual(layout.nodes.length, 3);
    assert.strictEqual(layout.connectors.length, 2);
    assert.ok(layout.bounds.width > 0);
  });

  it('Verifies soundscapeAudioEngine constants and methods', () => {
    assert.ok(SOUNDSCAPE_CHANNELS.rain);
    assert.ok(SOUNDSCAPE_CHANNELS.cafe);
    assert.ok(SOUNDSCAPE_CHANNELS.keyboard);
    assert.ok(SOUNDSCAPE_CHANNELS.waves);
    assert.ok(SOUNDSCAPE_CHANNELS.alpha);

    assert.strictEqual(SOUNDSCAPE_CHANNELS.rain.lowpassCutoff, 850);
    assert.strictEqual(SOUNDSCAPE_CHANNELS.waves.lfoPeriodSeconds, 9.0);
    assert.strictEqual(SOUNDSCAPE_CHANNELS.alpha.carrierFreq, 216);

    assert.ok(SOUNDSCAPE_PRESETS.deep_study);
    assert.ok(SOUNDSCAPE_PRESETS.coffee_flow);

    // Engine instance state inspection
    const state = soundscapeEngine.getState();
    assert.strictEqual(state.isPlaying, false);
    assert.ok(typeof state.masterVolume === 'number');

    soundscapeEngine.setMasterVolume(0.85);
    assert.strictEqual(soundscapeEngine.masterVolume, 0.85);

    soundscapeEngine.setChannelVolume('rain', 0.9);
    assert.strictEqual(soundscapeEngine.getChannelVolume('rain'), 0.9);

    const muted = soundscapeEngine.toggleChannelMute('rain');
    assert.strictEqual(muted, true);
    assert.strictEqual(soundscapeEngine.channelMutes.rain, true);
  });

  it('Verifies exportUtils methods', () => {
    const raw = `Biology & Chemistry <Cell> "DNA" 'RNA'`;
    const safe = escapeXml(raw);
    assert.ok(!safe.includes('<Cell>'));
    assert.ok(safe.includes('&lt;Cell&gt;'));

    const sampleTree = {
      id: 'node-root',
      text: 'Sample Tree',
      children: [
        { id: 'c1', text: 'Sub 1', children: [] },
        { id: 'c2', text: 'Sub 2', children: [] }
      ]
    };

    const svg = exportTreeToSvg(sampleTree);
    assert.ok(svg.includes('<svg xmlns="http://www.w3.org/2000/svg"'));
    assert.ok(svg.includes('Sample Tree'));
    assert.ok(svg.includes('Sub 1'));

    const cards = convertTreeToFlashcards(sampleTree, 'Test Deck');
    assert.strictEqual(cards.length, 1);
    assert.strictEqual(cards[0].front, 'Sample Tree');
    assert.ok(cards[0].back.includes('• Sub 1'));
  });

});
