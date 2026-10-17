/**
 * Client-Side Smart Background Removal Engine for StudyMediaHub
 * High-speed HTML5 Canvas & Connected-Edge Matting segmentation
 * Runs 100% in-browser with 0 latency, 0 server cost, and works perfectly on Vercel & Mobile.
 */

// Helper: load file or blob or URL into an HTMLImageElement
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(new Error('Không thể tải ảnh: ' + (e?.message || 'Lỗi định dạng')))
    if (src instanceof File || src instanceof Blob) {
      img.src = URL.createObjectURL(src)
    } else {
      img.src = src
    }
  })
}

// Helper: Compress/downscale huge phone images (e.g. 20MB) to safe size (< 1.5MB)
export async function compressImageForUpload(file, maxDimension = 1600, quality = 0.88) {
  try {
    if (!file || !(file instanceof File || file instanceof Blob)) return file
    if (file.size < 1.5 * 1024 * 1024) return file // already small enough

    const img = await loadImage(file)
    let w = img.naturalWidth || img.width
    let h = img.naturalHeight || img.height

    if (w > maxDimension || h > maxDimension) {
      if (w > h) {
        h = Math.round((h * maxDimension) / w)
        w = maxDimension
      } else {
        w = Math.round((w * maxDimension) / h)
        h = maxDimension
      }
    }

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (blob) {
      return new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' })
    }
    return file
  } catch (err) {
    console.warn('[compressImageForUpload] Failed to compress, using original:', err)
    return file
  }
}

// Color Euclidean distance with human eye perceptual weighting
function colorDistance(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  // Perceptual coefficients: Red 0.299, Green 0.587, Blue 0.114
  return Math.sqrt(0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db)
}

/**
 * Remove background on client side
 * @param {File|Blob|string} imageSource - input image
 * @param {Object} options - config options
 * @returns {Promise<Object>} result with data_url, width, height, elapsed_seconds
 */
export async function removeBackgroundClient(imageSource, options = {}) {
  const t0 = performance.now()
  const {
    tolerance = 42,      // Range 10 - 90: sensitivity to background color
    feather = 16,        // Range 0 - 40: edge transition softness
    maxDimension = 1600, // Maximum width/height for responsive performance
    targetColor = null   // Optional {r, g, b} to target specific background color
  } = options

  const img = await loadImage(imageSource)
  let w = img.naturalWidth || img.width
  let h = img.naturalHeight || img.height

  // Scale down if exceeds maxDimension
  if (w > maxDimension || h > maxDimension) {
    if (w > h) {
      h = Math.round((h * maxDimension) / w)
      w = maxDimension
    } else {
      w = Math.round((w * maxDimension) / h)
      h = maxDimension
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)

  const imgData = ctx.getImageData(0, 0, w, h)
  const data = imgData.data

  // Step 1: Detect background color palette
  let bgR = 255, bgG = 255, bgB = 255

  if (targetColor && typeof targetColor.r === 'number') {
    bgR = targetColor.r
    bgG = targetColor.g
    bgB = targetColor.b
  } else {
    // Sample border pixels (corners + distributed along edges)
    const samples = []
    const stepX = Math.max(1, Math.floor(w / 40))
    const stepY = Math.max(1, Math.floor(h / 40))

    // Top & bottom rows
    for (let x = 0; x < w; x += stepX) {
      const idxTop = (0 * w + x) * 4
      const idxBot = ((h - 1) * w + x) * 4
      samples.push([data[idxTop], data[idxTop + 1], data[idxTop + 2]])
      samples.push([data[idxBot], data[idxBot + 1], data[idxBot + 2]])
    }

    // Left & right columns
    for (let y = 0; y < h; y += stepY) {
      const idxLeft = (y * w + 0) * 4
      const idxRight = (y * w + (w - 1)) * 4
      samples.push([data[idxLeft], data[idxLeft + 1], data[idxLeft + 2]])
      samples.push([data[idxRight], data[idxRight + 1], data[idxRight + 2]])
    }

    // Add corners twice for weight
    const cornerIdxs = [0, (w - 1) * 4, ((h - 1) * w) * 4, ((h - 1) * w + (w - 1)) * 4]
    for (const cIdx of cornerIdxs) {
      samples.push([data[cIdx], data[cIdx + 1], data[cIdx + 2]])
      samples.push([data[cIdx], data[cIdx + 1], data[cIdx + 2]])
    }

    // Average sample color
    let sumR = 0, sumG = 0, sumB = 0
    for (const s of samples) {
      sumR += s[0]
      sumG += s[1]
      sumB += s[2]
    }
    bgR = Math.round(sumR / samples.length)
    bgG = Math.round(sumG / samples.length)
    bgB = Math.round(sumB / samples.length)
  }

  // Step 2: Connected-Component Edge Flood Fill
  // Start from perimeter: any connected border pixel with distance <= tolerance is definitely background.
  // This prevents carving into internal object areas having similar colors (e.g. white clothes on white wall).
  const totalPixels = w * h
  const isBg = new Uint8Array(totalPixels)
  const queue = new Int32Array(totalPixels)
  let qHead = 0
  let qTail = 0

  const borderTol = tolerance * 1.15

  // Enqueue perimeter background pixels
  const pushIfBg = (x, y) => {
    const pIdx = y * w + x
    if (isBg[pIdx]) return
    const dIdx = pIdx * 4
    const dist = colorDistance(data[dIdx], data[dIdx + 1], data[dIdx + 2], bgR, bgG, bgB)
    if (dist <= borderTol) {
      isBg[pIdx] = 1
      queue[qTail++] = pIdx
    }
  }

  for (let x = 0; x < w; x++) {
    pushIfBg(x, 0)
    pushIfBg(x, h - 1)
  }
  for (let y = 1; y < h - 1; y++) {
    pushIfBg(0, y)
    pushIfBg(w - 1, y)
  }

  // BFS Flood Fill
  while (qHead < qTail) {
    const curr = queue[qHead++]
    const cx = curr % w
    const cy = Math.floor(curr / w)

    // Check 4 neighbors
    const neighbors = []
    if (cx > 0) neighbors.push(curr - 1)
    if (cx < w - 1) neighbors.push(curr + 1)
    if (cy > 0) neighbors.push(curr - w)
    if (cy < h - 1) neighbors.push(curr + w)

    for (let i = 0; i < neighbors.length; i++) {
      const nIdx = neighbors[i]
      if (isBg[nIdx]) continue

      const ndIdx = nIdx * 4
      const dist = colorDistance(data[ndIdx], data[ndIdx + 1], data[ndIdx + 2], bgR, bgG, bgB)
      if (dist <= tolerance) {
        isBg[nIdx] = 1
        queue[qTail++] = nIdx
      }
    }
  }

  // Step 3: Compute Alpha Transparency with Feathering
  const alphaBuffer = new Uint8Array(totalPixels)

  for (let i = 0; i < totalPixels; i++) {
    const dIdx = i * 4
    const r = data[dIdx]
    const g = data[dIdx + 1]
    const b = data[dIdx + 2]
    const dist = colorDistance(r, g, b, bgR, bgG, bgB)

    if (isBg[i]) {
      // Background region: full transparent or smooth transition near edge
      if (dist <= tolerance - feather * 0.5) {
        alphaBuffer[i] = 0
      } else {
        const factor = Math.max(0, Math.min(1, (dist - (tolerance - feather * 0.5)) / feather))
        alphaBuffer[i] = Math.round(factor * 255)
      }
    } else {
      // Foreground region:
      // If color is very close to bg (like small isolated background holes), soften it
      if (dist <= tolerance * 0.75) {
        const factor = Math.max(0, Math.min(1, (dist - (tolerance * 0.4)) / (tolerance * 0.35)))
        alphaBuffer[i] = Math.round(factor * 255)
      } else {
        alphaBuffer[i] = 255
      }
    }
  }

  // Step 4: Alpha Smoothing (Edge anti-aliasing)
  for (let y = 1; y < h - 1; y++) {
    const row = y * w
    for (let x = 1; x < w - 1; x++) {
      const idx = row + x
      const a = alphaBuffer[idx]
      // Only smooth boundary transition pixels
      if (a > 0 && a < 255) {
        const avg = (
          alphaBuffer[idx - 1] +
          alphaBuffer[idx + 1] +
          alphaBuffer[idx - w] +
          alphaBuffer[idx + w] +
          a * 2
        ) / 6
        data[idx * 4 + 3] = Math.round(avg)
      } else {
        data[idx * 4 + 3] = a
      }
    }
  }

  ctx.putImageData(imgData, 0, 0)
  const dataUrl = canvas.toDataURL('image/png')
  const elapsed = Math.round((performance.now() - t0)) / 1000

  return {
    status: 'success',
    data_url: dataUrl,
    result_url: dataUrl,
    width: w,
    height: h,
    elapsed_seconds: elapsed,
    engine: 'client_canvas'
  }
}
