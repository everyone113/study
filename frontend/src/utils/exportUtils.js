/**
 * Mindmap Export Utilities: High-res PNG, Crisp Vector SVG, Structured JSON & Flashcards
 */

import { generateCubicBezierPath } from './mindmapTreeUtils.js'
import axios from 'axios'

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

export function downloadSvgFile(root, filename = 'mindmap.svg', width = 1400, height = 900) {
  const svgContent = exportTreeToSvg(root, width, height);
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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

export function exportToJson(mindmapDocument, filename = 'mindmap.json') {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mindmapDocument, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", filename.endsWith('.json') ? filename : `${filename}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importFromJson(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        resolve(parsed);
      } catch (err) {
        reject(new Error("File JSON không hợp lệ: " + err.message));
      }
    };
    reader.onerror = () => reject(new Error("Không thể đọc file"));
    reader.readAsText(file);
  });
}

/**
 * High-res PNG export using SVG rendering on HTML5 Canvas
 */
export function exportToPng(root, filename = 'mindmap.png', width = 1920, height = 1080) {
  return new Promise((resolve, reject) => {
    try {
      const svgString = exportTreeToSvg(root, width, height);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URLObj = window.URL || window.webkitURL || window;
      const blobURL = URLObj.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URLObj.revokeObjectURL(blobURL);
          reject(new Error("Không thể khởi tạo 2D Canvas context"));
          return;
        }

        ctx.drawImage(image, 0, 0);
        URLObj.revokeObjectURL(blobURL);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = filename.endsWith('.png') ? filename : `${filename}.png`;
        downloadLink.href = pngUrl;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        resolve(true);
      };

      image.onerror = (err) => {
        URLObj.revokeObjectURL(blobURL);
        reject(err);
      };

      image.src = blobURL;
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Spaced Repetition Flashcards Export:
 * Extracts Q&A pairs from tree, writes to Vault and calls backend flashcard sync.
 */
export async function exportToStudyMediaFlashcards(root, deckName, authContext = null) {
  const cards = convertTreeToFlashcards(root, deckName || 'Mindmap Deck');

  // 1. Save to Vault via AuthContext if available
  if (authContext && typeof authContext.getVaultItem === 'function' && typeof authContext.setVaultItem === 'function') {
    try {
      const existing = authContext.getVaultItem('flashcards', []);
      const merged = [...existing, ...cards];
      authContext.setVaultItem('flashcards', merged);
    } catch (e) {
      console.warn("Vault sync warning:", e);
    }
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem('studymedia_flashcards');
    const existing = raw ? JSON.parse(raw) : [];
    localStorage.setItem('studymedia_flashcards', JSON.stringify([...existing, ...cards]));
  } catch (e) {}

  // 2. Push to Backend Flashcards API asynchronously
  let apiExported = 0;
  try {
    for (const card of cards) {
      await axios.post('/api/tools/flashcards', {
        deck_name: card.deck_name,
        front: card.front,
        back: card.back
      });
      apiExported++;
    }
  } catch (e) {
    // Backend offline or error, already saved to vault
  }

  return {
    success: true,
    count: cards.length,
    deckName: deckName || 'Mindmap Deck',
    cards
  };
}
