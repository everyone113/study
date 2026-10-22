/**
 * Client-Side Smart Gemini & Watermark Removal Engine for StudyMediaHub
 * High-performance HTML5 Canvas boundary diffusion & inpainting
 * Enables instant 0-latency offline removal and falls back gracefully when backend is unreachable.
 */

// Load an image from File, Blob, or URL string
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

// Compute corner bounding boxes where Google Gemini (and other AI models) watermark/logos reside
export function getGeminiCornerRect(width, height, corner) {
  const cw = Math.max(32, Math.round(width * 0.16))
  const ch = Math.max(32, Math.round(height * 0.11))
  const padX = Math.max(8, Math.round(width * 0.015))
  const padY = Math.max(8, Math.round(height * 0.015))

  switch (corner) {
    case 'bottom-right':
      return {
        x: Math.max(0, width - cw - padX),
        y: Math.max(0, height - ch - padY),
        width: Math.min(width, cw + padX + 8),
        height: Math.min(height, ch + padY + 8)
      }
    case 'bottom-left':
      return {
        x: Math.max(0, padX - 8),
        y: Math.max(0, height - ch - padY),
        width: Math.min(width, cw + 8),
        height: Math.min(height, ch + padY + 8)
      }
    case 'top-right':
      return {
        x: Math.max(0, width - cw - padX),
        y: Math.max(0, padY - 8),
        width: Math.min(width, cw + padX + 8),
        height: Math.min(height, ch + 8)
      }
    case 'top-left':
      return {
        x: Math.max(0, padX - 8),
        y: Math.max(0, padY - 8),
        width: Math.min(width, cw + 8),
        height: Math.min(height, ch + 8)
      }
    default:
      return {
        x: Math.max(0, width - cw - padX),
        y: Math.max(0, height - ch - padY),
        width: cw,
        height: ch
      }
  }
}

// Generate a binary mask canvas (white for watermark area, black elsewhere)
export function createCornerMaskCanvas(width, height, corner = 'bottom-right') {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = '#ffffff'
  const corners = corner === 'all-corners'
    ? ['bottom-right', 'bottom-left', 'top-right', 'top-left']
    : [corner]

  for (const c of corners) {
    const rect = getGeminiCornerRect(width, height, c)
    // Draw with slight rounded padding
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
  }

  return canvas
}

/**
 * Fast Client-Side Inpainting on HTML5 Canvas
 * Performs iterative heat diffusion from boundary pixels into the masked area
 */
export async function inpaintCanvasClient(imgSource, maskSource, options = {}) {
  const img = imgSource instanceof HTMLImageElement ? imgSource : await loadImage(imgSource)
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height

  // Setup main canvas
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  const imgData = ctx.getImageData(0, 0, w, h)
  const data = imgData.data

  // Setup mask canvas
  let maskCanvas
  if (maskSource instanceof HTMLCanvasElement) {
    maskCanvas = maskSource
  } else if (maskSource instanceof File || maskSource instanceof Blob) {
    const mImg = await loadImage(maskSource)
    maskCanvas = document.createElement('canvas')
    maskCanvas.width = w
    maskCanvas.height = h
    const mCtx = maskCanvas.getContext('2d')
    mCtx.drawImage(mImg, 0, 0, w, h)
  } else if (typeof maskSource === 'string' && ['bottom-right', 'bottom-left', 'top-right', 'top-left', 'all-corners'].includes(maskSource)) {
    maskCanvas = createCornerMaskCanvas(w, h, maskSource)
  } else {
    // Default fallback to bottom-right corner
    maskCanvas = createCornerMaskCanvas(w, h, 'bottom-right')
  }

  const mCtx = maskCanvas.getContext('2d', { willReadFrequently: true })
  const mImgData = mCtx.getImageData(0, 0, w, h)
  const mData = mImgData.data

  // Build binary mask array: 1 = masked (to inpaint), 0 = source pixel
  const mask = new Uint8Array(w * h)
  let maskPixelCount = 0
  let minX = w, maxX = 0, minY = h, maxY = 0

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      // Consider white, red, or high alpha mask
      const isMasked = (mData[idx] > 50 || mData[idx + 1] > 50 || mData[idx + 2] > 50) && mData[idx + 3] > 50
      if (isMasked) {
        mask[y * w + x] = 1
        maskPixelCount++
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  // If no pixels masked, return original
  if (maskPixelCount === 0) {
    const dataUrl = canvas.toDataURL('image/png')
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'))
    return { dataUrl, blob, width: w, height: h }
  }

  // Expand bounding box with safe padding
  const pad = 12
  const bMinX = Math.max(0, minX - pad)
  const bMaxX = Math.min(w - 1, maxX + pad)
  const bMinY = Math.max(0, minY - pad)
  const bMaxY = Math.min(h - 1, maxY + pad)

  // Collect boundary color samples around the mask
  let avgR = 0, avgG = 0, avgB = 0, boundaryCount = 0
  for (let y = bMinY; y <= bMaxY; y++) {
    for (let x = bMinX; x <= bMaxX; x++) {
      const pIdx = y * w + x
      if (mask[pIdx] === 0) {
        // Check if adjacent to mask
        let isBoundary = false
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const ny = y + dy
            const nx = x + dx
            if (nx >= 0 && nx < w && ny >= 0 && ny < h && mask[ny * w + nx] === 1) {
              isBoundary = true
              break
            }
          }
          if (isBoundary) break
        }
        if (isBoundary) {
          const cIdx = pIdx * 4
          avgR += data[cIdx]
          avgG += data[cIdx + 1]
          avgB += data[cIdx + 2]
          boundaryCount++
        }
      }
    }
  }

  if (boundaryCount > 0) {
    avgR = Math.round(avgR / boundaryCount)
    avgG = Math.round(avgG / boundaryCount)
    avgB = Math.round(avgB / boundaryCount)
  }

  // Pass 1: Initialize all masked pixels with neighboring boundary interpolation
  for (let y = bMinY; y <= bMaxY; y++) {
    for (let x = bMinX; x <= bMaxX; x++) {
      const pIdx = y * w + x
      if (mask[pIdx] === 1) {
        const cIdx = pIdx * 4
        data[cIdx] = avgR
        data[cIdx + 1] = avgG
        data[cIdx + 2] = avgB
        data[cIdx + 3] = 255
      }
    }
  }

  // Pass 2: Iterative heat diffusion (Laplacian smoothing) on masked pixels
  const iterations = options.iterations || 14
  for (let iter = 0; iter < iterations; iter++) {
    for (let y = bMinY; y <= bMaxY; y++) {
      for (let x = bMinX; x <= bMaxX; x++) {
        const pIdx = y * w + x
        if (mask[pIdx] === 1) {
          let sumR = 0, sumG = 0, sumB = 0, count = 0
          const neighbors = [
            [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
            [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1]
          ]
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const nIdx = (ny * w + nx) * 4
              sumR += data[nIdx]
              sumG += data[nIdx + 1]
              sumB += data[nIdx + 2]
              count++
            }
          }
          if (count > 0) {
            const cIdx = pIdx * 4
            data[cIdx] = Math.round(sumR / count)
            data[cIdx + 1] = Math.round(sumG / count)
            data[cIdx + 2] = Math.round(sumB / count)
          }
        }
      }
    }
  }

  // Pass 3: Subtle grain texture so the inpaint doesn't look artificially flat
  for (let y = bMinY; y <= bMaxY; y++) {
    for (let x = bMinX; x <= bMaxX; x++) {
      const pIdx = y * w + x
      if (mask[pIdx] === 1) {
        const cIdx = pIdx * 4
        const noise = (Math.random() - 0.5) * 4
        data[cIdx] = Math.max(0, Math.min(255, Math.round(data[cIdx] + noise)))
        data[cIdx + 1] = Math.max(0, Math.min(255, Math.round(data[cIdx + 1] + noise)))
        data[cIdx + 2] = Math.max(0, Math.min(255, Math.round(data[cIdx + 2] + noise)))
      }
    }
  }

  ctx.putImageData(imgData, 0, 0)
  const dataUrl = canvas.toDataURL('image/png')
  const blob = await new Promise(r => canvas.toBlob(r, 'image/png'))

  return {
    dataUrl,
    blob,
    width: w,
    height: h,
    canvas
  }
}

/**
 * Hybrid Watermark Remover:
 * Tries the high-precision OpenCV backend first.
 * If server is offline or fails, automatically falls back to client-side inpainter.
 */
export async function removeWatermarkHybrid(file, options = {}) {
  const {
    maskBlob = null,
    corner = 'bottom-right',
    inpaintRadius = 4,
    dilateRadius = 5,
    method = 'telea',
    onProgress = null
  } = options

  if (onProgress) onProgress('Đang tải và xử lý hình ảnh...')

  try {
    const formData = new FormData()
    formData.append('file', file)
    if (maskBlob) {
      formData.append('mask', maskBlob, 'mask.png')
    }
    if (corner) {
      formData.append('corner', corner)
    }
    formData.append('inpaint_radius', String(inpaintRadius))
    formData.append('dilate_radius', String(dilateRadius))
    formData.append('method', method)

    const res = await fetch('/api/tools/remove-watermark', {
      method: 'POST',
      body: formData
    })

    if (res.ok) {
      const json = await res.json()
      return {
        ...json,
        engine: 'opencv_backend',
        message: 'Xóa logo thành công bằng OpenCV Telea Inpainting'
      }
    }
  } catch (err) {
    console.warn('[removeWatermarkHybrid] Backend API failed, falling back to client canvas:', err)
  }

  // Client-side fallback
  if (onProgress) onProgress('Đang xử lý trực tiếp trên trình duyệt...')
  const clientRes = await inpaintCanvasClient(file, maskBlob || corner)
  return {
    status: 'success',
    engine: 'client_canvas',
    result_url: clientRes.dataUrl,
    data_url: clientRes.dataUrl,
    blob: clientRes.blob,
    width: clientRes.width,
    height: clientRes.height,
    message: 'Xóa logo thành công (Trình duyệt Offline Inpainting)'
  }
}
