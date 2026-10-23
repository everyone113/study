/**
 * Pure Client-Side Forensics Utility Engine
 * Provides independent, robust client-side algorithms for:
 * 1. Hashes (SHA-256 via Web Crypto API, MD5 in pure JS)
 * 2. Binary EXIF / GPS parser (JPEG APP1 marker)
 * 3. Filename Digital Fingerprint & OSINT pattern decoder
 * 4. Canvas-based Error Level Analysis (ELA) with JET heatmap
 * 5. Astronomical SunCalc & Reverse Chronolocation (NOAA model)
 * 6. Micro-Text enhancement filters (Otsu binarization, Laplacian edge, contrast)
 */

// --- 1. HASH CALCULATIONS ---
function md5Cycle(x, k) {
  let a = x[0], b = x[1], c = x[2], d = x[3]
  a = ff(a, b, c, d, k[0], 7, -680876936)
  d = ff(d, a, b, c, k[1], 12, -389564586)
  c = ff(c, d, a, b, k[2], 17, 606105819)
  b = ff(b, c, d, a, k[3], 22, -1044525330)
  a = ff(a, b, c, d, k[4], 7, -176418897)
  d = ff(d, a, b, c, k[5], 12, 1200080426)
  c = ff(c, d, a, b, k[6], 17, -1473231341)
  b = ff(b, c, d, a, k[7], 22, -45705983)
  a = ff(a, b, c, d, k[8], 7, 1770035416)
  d = ff(d, a, b, c, k[9], 12, -1958414417)
  c = ff(c, d, a, b, k[10], 17, -42063)
  b = ff(b, c, d, a, k[11], 22, -1990404162)
  a = ff(a, b, c, d, k[12], 7, 1804603682)
  d = ff(d, a, b, c, k[13], 12, -40341101)
  c = ff(c, d, a, b, k[14], 17, -1502002290)
  b = ff(b, c, d, a, k[15], 22, 1236535329)

  a = gg(a, b, c, d, k[1], 5, -165796510)
  d = gg(d, a, b, c, k[6], 9, -1069501632)
  c = gg(c, d, a, b, k[11], 14, 643717713)
  b = gg(b, c, d, a, k[0], 20, -373897302)
  a = gg(a, b, c, d, k[5], 5, -701558691)
  d = gg(d, a, b, c, k[10], 9, 38016083)
  c = gg(c, d, a, b, k[15], 14, -660478335)
  b = gg(b, c, d, a, k[4], 20, -405537848)
  a = gg(a, b, c, d, k[9], 5, 568446438)
  d = gg(d, a, b, c, k[14], 9, -1019803690)
  c = gg(c, d, a, b, k[3], 14, -187363961)
  b = gg(b, c, d, a, k[8], 20, 1163531501)
  a = gg(a, b, c, d, k[13], 5, -1444681467)
  d = gg(d, a, b, c, k[2], 9, -51403784)
  c = gg(c, d, a, b, k[7], 14, 1735328473)
  b = gg(b, c, d, a, k[12], 20, -1926607734)

  a = hh(a, b, c, d, k[5], 4, -378558)
  d = hh(d, a, b, c, k[8], 11, -2022574463)
  c = hh(c, d, a, b, k[11], 16, 1839030562)
  b = hh(b, c, d, a, k[14], 23, -35309556)
  a = hh(a, b, c, d, k[1], 4, -1530992060)
  d = hh(d, a, b, c, k[4], 11, 1272893353)
  c = hh(c, d, a, b, k[7], 16, -155497632)
  b = hh(b, c, d, a, k[10], 23, -1094730640)
  a = hh(a, b, c, d, k[13], 4, 681279174)
  d = hh(d, a, b, c, k[0], 11, -358537222)
  c = hh(c, d, a, b, k[3], 16, -722521979)
  b = hh(b, c, d, a, k[6], 23, 76029189)
  a = hh(a, b, c, d, k[9], 4, -640364487)
  d = hh(d, a, b, c, k[12], 11, -421815835)
  c = hh(c, d, a, b, k[15], 16, 530742520)
  b = hh(b, c, d, a, k[2], 23, -995338651)

  a = ii(a, b, c, d, k[0], 6, -198630844)
  d = ii(d, a, b, c, k[7], 10, 1126891415)
  c = ii(c, d, a, b, k[14], 15, -1416354905)
  b = ii(b, c, d, a, k[5], 21, -57434055)
  a = ii(a, b, c, d, k[12], 6, 1700485571)
  d = ii(d, a, b, c, k[3], 10, -1894986606)
  c = ii(c, d, a, b, k[10], 15, -1051523)
  b = ii(b, c, d, a, k[1], 21, -2054922799)
  a = ii(a, b, c, d, k[8], 6, 1873313359)
  d = ii(d, a, b, c, k[15], 10, -30611744)
  c = ii(c, d, a, b, k[6], 15, -1560198380)
  b = ii(b, c, d, a, k[13], 21, 1309151649)
  a = ii(a, b, c, d, k[4], 6, -145523070)
  d = ii(d, a, b, c, k[11], 10, -1120210379)
  c = ii(c, d, a, b, k[2], 15, 718787259)
  b = ii(b, c, d, a, k[9], 21, -343485551)

  x[0] = add32(a, x[0])
  x[1] = add32(b, x[1])
  x[2] = add32(c, x[2])
  x[3] = add32(d, x[3])
}

function cmn(q, a, b, x, s, t) {
  a = add32(add32(a, q), add32(x, t))
  return add32((a << s) | (a >>> (32 - s)), b)
}
function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t) }
function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t) }
function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t) }
function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t) }
function add32(a, b) { return (a + b) & 0xFFFFFFFF }

export function calculateMd5(bytes) {
  const n = bytes.length
  let state = [1732584193, -271733879, -1732584194, 271733878]
  let i
  for (i = 64; i <= n; i += 64) {
    const k = []
    for (let j = 0; j < 16; j++) {
      const idx = i - 64 + j * 4
      k[j] = bytes[idx] | (bytes[idx + 1] << 8) | (bytes[idx + 2] << 16) | (bytes[idx + 3] << 24)
    }
    md5Cycle(state, k)
  }
  const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  const rem = n - (i - 64)
  for (let j = 0; j < rem; j++) {
    tail[j >> 2] |= bytes[i - 64 + j] << ((j % 4) << 3)
  }
  tail[rem >> 2] |= 0x80 << ((rem % 4) << 3)
  if (rem > 55) {
    md5Cycle(state, tail)
    for (let j = 0; j < 16; j++) tail[j] = 0
  }
  tail[14] = (n * 8) & 0xFFFFFFFF
  tail[15] = Math.floor((n * 8) / 0x100000000)
  md5Cycle(state, tail)

  const hexChars = '0123456789abcdef'
  let out = ''
  for (let j = 0; j < 4; j++) {
    for (let k = 0; k < 4; k++) {
      const b = (state[j] >> (k * 8)) & 0xFF
      out += hexChars.charAt((b >> 4) & 0x0F) + hexChars.charAt(b & 0x0F)
    }
  }
  return out
}

export async function computeClientHashes(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer)
  let sha256 = ''
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch (e) {
    sha256 = 'N/A'
  }
  const md5 = calculateMd5(bytes)
  return { md5, sha256 }
}

// --- 2. CLIENT-SIDE EXIF / GPS PARSER ---
export function parseClientExif(arrayBuffer) {
  const view = new DataView(arrayBuffer)
  const result = {
    has_exif: false,
    make: null,
    model: null,
    software: null,
    datetime_original: null,
    exposure_time: null,
    f_number: null,
    iso: null,
    focal_length: null,
    lens_model: null,
    gps: {
      has_gps: false,
      latitude: null,
      longitude: null,
      altitude: null,
      google_maps_url: null,
      osm_url: null
    }
  }

  // Check JPEG SOI (0xFFD8)
  if (view.byteLength < 4 || view.getUint16(0) !== 0xFFD8) {
    return result
  }

  let offset = 2
  const length = view.byteLength

  while (offset < length - 2) {
    const marker = view.getUint16(offset)
    offset += 2
    if (marker === 0xFFE1) { // APP1 Exif Marker
      const app1Length = view.getUint16(offset)
      offset += 2
      // Verify 'Exif\0\0'
      const exifSig = String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3)
      )
      if (exifSig === 'Exif') {
        const tiffOffset = offset + 6
        const isLittleEndian = view.getUint16(tiffOffset) === 0x4949
        const firstIFDOffset = view.getUint32(tiffOffset + 4, isLittleEndian)
        parseIFD(view, tiffOffset, tiffOffset + firstIFDOffset, isLittleEndian, result)
        result.has_exif = true
      }
      break
    } else if ((marker & 0xFF00) === 0xFF00 && marker !== 0xFF00) {
      const segLength = view.getUint16(offset)
      offset += segLength
    } else {
      break
    }
  }

  return result
}

function parseIFD(view, tiffOffset, ifdOffset, littleEndian, res) {
  if (ifdOffset + 2 > view.byteLength) return
  const numEntries = view.getUint16(ifdOffset, littleEndian)
  let exifSubOffset = 0
  let gpsOffset = 0

  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifdOffset + 2 + i * 12
    if (entryOffset + 12 > view.byteLength) break
    const tag = view.getUint16(entryOffset, littleEndian)
    const type = view.getUint16(entryOffset + 2, littleEndian)
    const count = view.getUint32(entryOffset + 4, littleEndian)
    const valOffset = entryOffset + 8

    if (tag === 0x010F) res.make = readString(view, tiffOffset, valOffset, count, littleEndian)
    else if (tag === 0x0110) res.model = readString(view, tiffOffset, valOffset, count, littleEndian)
    else if (tag === 0x0131) res.software = readString(view, tiffOffset, valOffset, count, littleEndian)
    else if (tag === 0x8769) exifSubOffset = tiffOffset + view.getUint32(valOffset, littleEndian)
    else if (tag === 0x8825) gpsOffset = tiffOffset + view.getUint32(valOffset, littleEndian)
  }

  // Parse Exif SubIFD
  if (exifSubOffset > 0 && exifSubOffset + 2 <= view.byteLength) {
    const numSub = view.getUint16(exifSubOffset, littleEndian)
    for (let i = 0; i < numSub; i++) {
      const entryOffset = exifSubOffset + 2 + i * 12
      if (entryOffset + 12 > view.byteLength) break
      const tag = view.getUint16(entryOffset, littleEndian)
      const valOffset = entryOffset + 8
      const count = view.getUint32(entryOffset + 4, littleEndian)

      if (tag === 0x9003) res.datetime_original = readString(view, tiffOffset, valOffset, count, littleEndian)
      else if (tag === 0x829A) {
        const num = readRational(view, tiffOffset, valOffset, littleEndian)
        if (num) res.exposure_time = num < 1 ? `1/${Math.round(1 / num)} s` : `${num.toFixed(1)} s`
      } else if (tag === 0x829D) {
        const f = readRational(view, tiffOffset, valOffset, littleEndian)
        if (f) res.f_number = `f/${f.toFixed(1)}`
      } else if (tag === 0x8827) {
        res.iso = view.getUint16(valOffset, littleEndian)
      } else if (tag === 0x920A) {
        const fl = readRational(view, tiffOffset, valOffset, littleEndian)
        if (fl) res.focal_length = `${fl.toFixed(1)} mm`
      } else if (tag === 0xA434) {
        res.lens_model = readString(view, tiffOffset, valOffset, count, littleEndian)
      }
    }
  }

  // Parse GPS IFD
  if (gpsOffset > 0 && gpsOffset + 2 <= view.byteLength) {
    const numGps = view.getUint16(gpsOffset, littleEndian)
    let latRef = 'N', lonRef = 'E'
    let latDeg = null, lonDeg = null, alt = null

    for (let i = 0; i < numGps; i++) {
      const entryOffset = gpsOffset + 2 + i * 12
      if (entryOffset + 12 > view.byteLength) break
      const tag = view.getUint16(entryOffset, littleEndian)
      const valOffset = entryOffset + 8

      if (tag === 1) latRef = String.fromCharCode(view.getUint8(valOffset))
      else if (tag === 2) latDeg = readGpsCoords(view, tiffOffset, valOffset, littleEndian)
      else if (tag === 3) lonRef = String.fromCharCode(view.getUint8(valOffset))
      else if (tag === 4) lonDeg = readGpsCoords(view, tiffOffset, valOffset, littleEndian)
      else if (tag === 6) alt = readRational(view, tiffOffset, valOffset, littleEndian)
    }

    if (latDeg !== null && lonDeg !== null) {
      let lat = latDeg
      let lon = lonDeg
      if (latRef === 'S') lat = -lat
      if (lonRef === 'W') lon = -lon

      res.gps = {
        has_gps: true,
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lon.toFixed(6)),
        altitude: alt ? parseFloat(alt.toFixed(1)) : null,
        google_maps_url: `https://www.google.com/maps?q=${lat.toFixed(6)},${lon.toFixed(6)}`,
        osm_url: `https://www.openstreetmap.org/?mlat=${lat.toFixed(6)}&mlon=${lon.toFixed(6)}#map=16/${lat.toFixed(6)}/${lon.toFixed(6)}`
      }
    }
  }
}

function readString(view, tiffOffset, valOffset, count, littleEndian) {
  let offset = count > 4 ? tiffOffset + view.getUint32(valOffset, littleEndian) : valOffset
  let str = ''
  for (let i = 0; i < count && offset + i < view.byteLength; i++) {
    const code = view.getUint8(offset + i)
    if (code === 0) break
    str += String.fromCharCode(code)
  }
  return str.trim()
}

function readRational(view, tiffOffset, valOffset, littleEndian) {
  const ptr = tiffOffset + view.getUint32(valOffset, littleEndian)
  if (ptr + 8 > view.byteLength) return null
  const num = view.getUint32(ptr, littleEndian)
  const den = view.getUint32(ptr + 4, littleEndian)
  return den !== 0 ? num / den : null
}

function readGpsCoords(view, tiffOffset, valOffset, littleEndian) {
  const ptr = tiffOffset + view.getUint32(valOffset, littleEndian)
  if (ptr + 24 > view.byteLength) return null
  const dNum = view.getUint32(ptr, littleEndian)
  const dDen = view.getUint32(ptr + 4, littleEndian)
  const mNum = view.getUint32(ptr + 8, littleEndian)
  const mDen = view.getUint32(ptr + 12, littleEndian)
  const sNum = view.getUint32(ptr + 16, littleEndian)
  const sDen = view.getUint32(ptr + 20, littleEndian)

  const d = dDen ? dNum / dDen : 0
  const m = mDen ? mNum / mDen : 0
  const s = sDen ? sNum / sDen : 0
  return d + m / 60.0 + s / 3600.0
}

// --- 3. FILENAME DIGITAL FINGERPRINT DECODER ---
export function decodeFilenameFingerprint(filename) {
  const res = {
    matched: false,
    platform: 'Tệp Tiêu Chuẩn',
    pattern_name: null,
    photo_id: null,
    user_id: null,
    unix_timestamp: null,
    iso_datetime: null,
    extracted_datetime: null,
    osint_links: [],
    details: {},
    confidence: 'none',
    description: 'Không phát hiện cấu trúc tên tệp mạng xã hội đặc biệt.'
  }

  if (!filename) return res

  // Telegram Desktop: photo_2024-05-15_14-30-45.jpg
  const tgMatch = filename.match(/^photo_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/i)
  if (tgMatch) {
    const [_, y, m, d, hr, mn, sc] = tgMatch
    const dateObj = new Date(Date.UTC(+y, +m - 1, +d, +hr, +mn, +sc))
    const ts = Math.floor(dateObj.getTime() / 1000)
    return {
      matched: true,
      platform: 'Telegram',
      pattern_name: 'Telegram Desktop Export',
      unix_timestamp: ts,
      iso_datetime: dateObj.toISOString(),
      extracted_datetime: `${d}/${m}/${y} ${hr}:${mn}:${sc} UTC`,
      osint_links: [],
      confidence: 'high',
      description: 'Ảnh tải về từ ứng dụng Telegram Desktop với mốc thời gian UTC được gắn trực tiếp vào tên tệp.'
    }
  }

  // Telegram Cloud/Epoch
  const tgEpoch = filename.match(/(?:telegram|tg|photo)[_-](\d{10,13})/i)
  if (tgEpoch) {
    let ts = parseInt(tgEpoch[1], 10)
    if (ts > 1e11) ts = Math.floor(ts / 1000)
    const dateObj = new Date(ts * 1000)
    return {
      matched: true,
      platform: 'Telegram',
      pattern_name: 'Telegram Cloud Hash',
      unix_timestamp: ts,
      iso_datetime: dateObj.toISOString(),
      extracted_datetime: dateObj.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      osint_links: [],
      confidence: 'medium',
      description: 'Ảnh lưu từ bộ nhớ đám mây Telegram với Unix timestamp tương ứng thời điểm lưu.'
    }
  }

  // Facebook FB_IMG mobile
  const fbImg = filename.match(/^FB_IMG_(\d{10,13})/i)
  if (fbImg) {
    let ts = parseInt(fbImg[1], 10)
    if (ts > 1e11) ts = Math.floor(ts / 1000)
    const dateObj = new Date(ts * 1000)
    return {
      matched: true,
      platform: 'Facebook',
      pattern_name: 'Facebook Mobile App Save (FB_IMG)',
      unix_timestamp: ts,
      iso_datetime: dateObj.toISOString(),
      extracted_datetime: dateObj.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      osint_links: [],
      confidence: 'high',
      description: 'Ảnh được lưu từ ứng dụng Facebook Android/iOS. Chứa timestamp thời điểm tải về máy.'
    }
  }

  // Facebook Messenger received_id
  const fbRec = filename.match(/^received_(\d{10,20})/i)
  if (fbRec) {
    const fbid = fbRec[1]
    return {
      matched: true,
      platform: 'Facebook Messenger',
      pattern_name: 'Facebook Messenger Attachment',
      photo_id: fbid,
      unix_timestamp: null,
      iso_datetime: null,
      extracted_datetime: null,
      osint_links: [`https://www.facebook.com/photo.php?fbid=${fbid}`],
      confidence: 'high',
      description: `Ảnh nhận qua cuộc trò chuyện Messenger với mã ID đính kèm ${fbid}.`
    }
  }

  // Facebook Classic CDN: 12345678_10203040506070809_1715783400_n.jpg
  const fbClassic = filename.match(/^(\d{6,16})_(\d{10,20})_(\d{10,20})_([anoqs])\./i)
  if (fbClassic) {
    const [_, uid, fbid, part3, typeCode] = fbClassic
    let ts = parseInt(part3, 10)
    let dateStr = null
    if (ts >= 1000000000 && ts <= 2100000000) {
      dateStr = new Date(ts * 1000).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
    } else {
      ts = null
    }
    return {
      matched: true,
      platform: 'Facebook',
      pattern_name: 'Facebook CDN Classic Hash',
      photo_id: fbid,
      user_id: uid,
      unix_timestamp: ts,
      iso_datetime: ts ? new Date(ts * 1000).toISOString() : null,
      extracted_datetime: dateStr,
      osint_links: [
        `https://www.facebook.com/photo.php?fbid=${fbid}`,
        `https://www.facebook.com/${uid}`
      ],
      confidence: 'high',
      description: `Định dạng tải về từ máy chủ CDN Facebook. Bóc tách được User ID (${uid}) và Photo ID (${fbid}).`
    }
  }

  // Zalo: zalo_1715783400 or zalo_20240515_143000
  const zaloDate = filename.match(/^(?:zalo_)?(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/i)
  if (zaloDate && filename.toLowerCase().includes('zalo')) {
    const [_, y, m, d, hr, mn, sc] = zaloDate
    const dateObj = new Date(+y, +m - 1, +d, +hr, +mn, +sc)
    return {
      matched: true,
      platform: 'Zalo',
      pattern_name: 'Zalo Media Export',
      unix_timestamp: Math.floor(dateObj.getTime() / 1000),
      iso_datetime: dateObj.toISOString(),
      extracted_datetime: `${d}/${m}/${y} ${hr}:${mn}:${sc} (Giờ địa phương)`,
      confidence: 'high',
      description: 'Ảnh được lưu từ ứng dụng Zalo với định dạng ngày giờ chụp/gửi.'
    }
  }

  // Android Camera: IMG_20240515_143000
  const androidCam = filename.match(/(?:IMG|PXL|VID)_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/i)
  if (androidCam) {
    const [_, y, m, d, hr, mn, sc] = androidCam
    const dateObj = new Date(+y, +m - 1, +d, +hr, +mn, +sc)
    return {
      matched: true,
      platform: 'Camera Gốc (Android/Pixel)',
      pattern_name: 'Standard Camera Filename',
      unix_timestamp: Math.floor(dateObj.getTime() / 1000),
      iso_datetime: dateObj.toISOString(),
      extracted_datetime: `${d}/${m}/${y} ${hr}:${mn}:${sc}`,
      confidence: 'high',
      description: 'Quy chuẩn đặt tên tệp tự động của ứng dụng máy ảnh gốc trên thiết bị Android.'
    }
  }

  return res
}

// --- 4. CANVAS-BASED ERROR LEVEL ANALYSIS (ELA) ---
// JET colormap lookup table generator (0..255 -> [R, G, B])
function getJetColor(val) {
  // val from 0 to 255
  const v = val / 255
  let r = 0, g = 0, b = 0
  if (v < 0.125) {
    b = 0.5 + 4 * v
  } else if (v < 0.375) {
    b = 1
    g = 4 * (v - 0.125)
  } else if (v < 0.625) {
    b = 1 - 4 * (v - 0.375)
    g = 1
    r = 4 * (v - 0.375)
  } else if (v < 0.875) {
    g = 1 - 4 * (v - 0.625)
    r = 1
  } else {
    r = 1 - 2 * (v - 0.875)
  }
  return [
    Math.round(Math.min(1, Math.max(0, r)) * 255),
    Math.round(Math.min(1, Math.max(0, g)) * 255),
    Math.round(Math.min(1, Math.max(0, b)) * 255)
  ]
}

export function computeClientEla(imageElement, quality = 90, scale = 15) {
  return new Promise((resolve, reject) => {
    try {
      const w = imageElement.naturalWidth || imageElement.width
      const h = imageElement.naturalHeight || imageElement.height
      if (!w || !h) {
        throw new Error('Kích thước ảnh không hợp lệ')
      }

      // 1. Draw original on canvas
      const origCanvas = document.createElement('canvas')
      origCanvas.width = w
      origCanvas.height = h
      const origCtx = origCanvas.getContext('2d')
      origCtx.drawImage(imageElement, 0, 0)
      const origData = origCtx.getImageData(0, 0, w, h)

      // 2. Compress to JPEG data URL at specified quality
      const q = Math.max(0.1, Math.min(1.0, quality / 100))
      const jpegDataUrl = origCanvas.toDataURL('image/jpeg', q)

      // 3. Load compressed JPEG
      const compImg = new Image()
      compImg.onload = () => {
        const compCanvas = document.createElement('canvas')
        compCanvas.width = w
        compCanvas.height = h
        const compCtx = compCanvas.getContext('2d')
        compCtx.drawImage(compImg, 0, 0)
        const compData = compCtx.getImageData(0, 0, w, h)

        // 4. Create Diff Canvas & Heatmap Canvas
        const diffCanvas = document.createElement('canvas')
        diffCanvas.width = w
        diffCanvas.height = h
        const diffCtx = diffCanvas.getContext('2d')
        const diffData = diffCtx.createImageData(w, h)

        const heatCanvas = document.createElement('canvas')
        heatCanvas.width = w
        heatCanvas.height = h
        const heatCtx = heatCanvas.getContext('2d')
        const heatData = heatCtx.createImageData(w, h)

        let totalDiff = 0
        let maxDiff = 0
        const totalPixels = w * h

        for (let i = 0; i < origData.data.length; i += 4) {
          const dr = Math.abs(origData.data[i] - compData.data[i])
          const dg = Math.abs(origData.data[i + 1] - compData.data[i + 1])
          const db = Math.abs(origData.data[i + 2] - compData.data[i + 2])
          const dAvg = (dr + dg + db) / 3.0

          if (dAvg > maxDiff) maxDiff = dAvg
          totalDiff += dAvg

          // Scaled difference
          const rScaled = Math.min(255, dr * scale)
          const gScaled = Math.min(255, dg * scale)
          const bScaled = Math.min(255, db * scale)
          const grayScaled = Math.min(255, Math.round(dAvg * scale))

          diffData.data[i] = rScaled
          diffData.data[i + 1] = gScaled
          diffData.data[i + 2] = bScaled
          diffData.data[i + 3] = 255

          // False-color JET heatmap
          const [jr, jg, jb] = getJetColor(grayScaled)
          heatData.data[i] = jr
          heatData.data[i + 1] = jg
          heatData.data[i + 2] = jb
          heatData.data[i + 3] = 255
        }

        diffCtx.putImageData(diffData, 0, 0)
        heatCtx.putImageData(heatData, 0, 0)

        const meanDiff = totalDiff / totalPixels
        let risk = 'low'
        let desc = 'Mức nén đồng đều, không phát hiện dấu hiệu can thiệp hoặc ghép ảnh cục bộ rõ rệt.'
        if (meanDiff > 12.0 || maxDiff > 120.0) {
          risk = 'high'
          desc = 'Phát hiện sai số nén bất thường rất cao ở các chi tiết viền. Khả năng cao có can thiệp ghép ảnh hoặc chỉnh sửa kỹ thuật số.'
        } else if (meanDiff > 5.0 || maxDiff > 70.0) {
          risk = 'medium'
          desc = 'Có chênh lệch mức nén ở một số khu vực. Cần đối chiếu kỹ các bề mặt đồng nhất.'
        }

        resolve({
          elaDataUrl: diffCanvas.toDataURL('image/png'),
          heatmapDataUrl: heatCanvas.toDataURL('image/png'),
          statistics: {
            mean_difference: parseFloat(meanDiff.toFixed(2)),
            max_difference: parseFloat(maxDiff.toFixed(1)),
            manipulation_risk: risk,
            tampering_description: desc
          }
        })
      }
      compImg.onerror = (e) => reject(new Error('Lỗi tải ảnh tái nén JPEG'))
      compImg.src = jpegDataUrl
    } catch (err) {
      reject(err)
    }
  })
}

// --- 5. ASTRONOMICAL SUNCALC & REVERSE CHRONOLOCATION (NOAA) ---
export function calculateSolarPosition(lat, lon, dateObj) {
  const rad = Math.PI / 180.0
  const deg = 180.0 / Math.PI

  // Julian Day
  const y = dateObj.getUTCFullYear()
  const m = dateObj.getUTCMonth() + 1
  const d = dateObj.getUTCDate()
  const h = dateObj.getUTCHours() + dateObj.getUTCMinutes() / 60.0 + dateObj.getUTCSeconds() / 3600.0

  let yj = y
  let mj = m
  if (mj <= 2) {
    yj -= 1
    mj += 12
  }
  const A = Math.floor(yj / 100)
  const B = 2 - A + Math.floor(A / 4)
  const jd = Math.floor(365.25 * (yj + 4716)) + Math.floor(30.6001 * (mj + 1)) + d + B - 1524.5 + h / 24.0
  const n = jd - 2451545.0 // Days since J2000.0

  // Solar coordinates
  const M = ((357.5291 + 0.98560028 * n) % 360) * rad
  const C = (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) * rad
  const L0 = (280.4665 + 0.98564736 * n) * rad
  const lambda = L0 + C
  const epsilon = (23.4393 - 0.0000004 * n) * rad

  // Declination & Right Ascension
  const sinDelta = Math.sin(epsilon) * Math.sin(lambda)
  const delta = Math.asin(sinDelta)
  const alpha = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda))

  // Greenwich Sidereal Time
  const theta0 = ((280.1600 + 360.9856235 * n) % 360) * rad
  const theta = theta0 + lon * rad
  const H = theta - alpha // Hour angle

  // Horizontal coordinates
  const phi = lat * rad
  const sinAlt = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(H)
  const alt = Math.asin(Math.max(-1.0, Math.min(1.0, sinAlt)))

  const yAz = -Math.sin(H) * Math.cos(delta)
  const xAz = Math.sin(delta) * Math.cos(phi) - Math.cos(delta) * Math.sin(phi) * Math.cos(H)
  let az = Math.atan2(yAz, xAz) * deg
  az = (az + 360.0) % 360.0

  const altitudeDeg = alt * deg
  const shadowAzDeg = (az + 180.0) % 360.0

  return {
    altitude: parseFloat(altitudeDeg.toFixed(2)),
    azimuth: parseFloat(az.toFixed(2)),
    zenith: parseFloat((90.0 - altitudeDeg).toFixed(2)),
    shadow_azimuth: parseFloat(shadowAzDeg.toFixed(2)),
    is_daylight: altitudeDeg > 0
  }
}

export function computeClientSunCalc(lat, lon, dateStr, shadowAzimuth = null, timezoneOffset = 7) {
  // Parse date
  let dateObj = new Date()
  if (dateStr) {
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      dateObj = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2], 12, 0, 0))
    }
  }

  // 1. Generate 24-hour solar trajectory curve
  const curve = []
  let maxAlt = -90
  let sunriseTime = null
  let sunsetTime = null
  let solarNoonTime = null
  let minZenith = 999

  for (let min = 0; min < 1440; min += 30) {
    const utcHours = min / 60.0 - timezoneOffset
    const stepDate = new Date(Date.UTC(
      dateObj.getUTCFullYear(),
      dateObj.getUTCMonth(),
      dateObj.getUTCDate(),
      0, min
    ))
    // Adjust for UTC query
    const utcMs = Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate()) + (min - timezoneOffset * 60) * 60000
    const queryDate = new Date(utcMs)

    const pos = calculateSolarPosition(lat, lon, queryDate)
    const localHour = Math.floor(min / 60)
    const localMin = min % 60
    const timeLabel = `${String(localHour).padStart(2, '0')}:${String(localMin).padStart(2, '0')}`

    curve.push({
      time: timeLabel,
      altitude: pos.altitude,
      azimuth: pos.azimuth,
      is_daylight: pos.is_daylight
    })

    if (pos.altitude > maxAlt) {
      maxAlt = pos.altitude
      solarNoonTime = timeLabel
    }
    if (curve.length > 1) {
      const prev = curve[curve.length - 2]
      if (prev.altitude <= 0 && pos.altitude > 0 && !sunriseTime) {
        sunriseTime = timeLabel
      }
      if (prev.altitude > 0 && pos.altitude <= 0 && !sunsetTime && min > 720) {
        sunsetTime = timeLabel
      }
    }
  }

  // 2. Reverse Chronolocation from shadow bearing
  let estimatedLocal = '12:00'
  let estimatedUtc = '05:00'
  let bestPos = null
  let timeCategory = 'Trưa (Solar Noon)'
  let targetSunAz = null

  if (shadowAzimuth !== null && shadowAzimuth !== undefined) {
    targetSunAz = (parseFloat(shadowAzimuth) + 180.0) % 360.0
    let bestScore = 999999
    let bestMinute = 720 // noon default

    // Scan every minute of local daylight
    for (let m = 300; m <= 1140; m++) { // 05:00 to 19:00
      const utcMs = Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate()) + (m - timezoneOffset * 60) * 60000
      const queryDate = new Date(utcMs)
      const p = calculateSolarPosition(lat, lon, queryDate)

      if (p.altitude > 0) {
        const azDiff = Math.abs(p.azimuth - targetSunAz)
        const angularErr = Math.min(azDiff, 360.0 - azDiff)
        if (angularErr < bestScore) {
          bestScore = angularErr
          bestMinute = m
          bestPos = p
        }
      }
    }

    const estH = Math.floor(bestMinute / 60)
    const estM = bestMinute % 60
    estimatedLocal = `${String(estH).padStart(2, '0')}:${String(estM).padStart(2, '0')}`

    if (estH < 10) timeCategory = 'Sáng sớm (Early Morning)'
    else if (estH < 11) timeCategory = 'Giữa buổi sáng (Mid Morning)'
    else if (estH <= 13) timeCategory = 'Buổi trưa (Solar Noon)'
    else if (estH < 16) timeCategory = 'Đầu giờ chiều (Afternoon)'
    else timeCategory = 'Chiều muộn / Hoàng hôn (Golden Hour)'
  } else {
    bestPos = calculateSolarPosition(lat, lon, new Date())
  }

  return {
    status: 'success',
    latitude: lat,
    longitude: lon,
    date: dateStr,
    sun_azimuth_deg: bestPos ? bestPos.azimuth : 0,
    solar_altitude_deg: bestPos ? bestPos.altitude : 0,
    zenith_deg: bestPos ? bestPos.zenith : 0,
    estimated_time_local: estimatedLocal,
    time_of_day_category: timeCategory,
    solar_events: {
      sunrise: sunriseTime || '05:30',
      solar_noon: solarNoonTime || '11:50',
      sunset: sunsetTime || '18:15',
      max_altitude_deg: parseFloat(maxAlt.toFixed(1))
    },
    solar_path_24h: curve
  }
}

// --- 6. MICRO-TEXT & OSINT ENHANCEMENT FILTERS ---
export function applyCanvasFilter(canvas, filterMode) {
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  const imgData = ctx.getImageData(0, 0, w, h)
  const d = imgData.data

  if (filterMode === 'contrast') {
    // High contrast boost & stretch
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.min(255, Math.max(0, (d[i] - 128) * 1.8 + 128))
      d[i + 1] = Math.min(255, Math.max(0, (d[i + 1] - 128) * 1.8 + 128))
      d[i + 2] = Math.min(255, Math.max(0, (d[i + 2] - 128) * 1.8 + 128))
    }
    ctx.putImageData(imgData, 0, 0)
  } else if (filterMode === 'invert') {
    // Negative invert
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 255 - d[i]
      d[i + 1] = 255 - d[i + 1]
      d[i + 2] = 255 - d[i + 2]
    }
    ctx.putImageData(imgData, 0, 0)
  } else if (filterMode === 'otsu') {
    // Otsu threshold binarization (black & white)
    const gray = new Uint8Array(w * h)
    const hist = new Int32Array(256)
    for (let i = 0; i < d.length; i += 4) {
      const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])
      gray[i / 4] = g
      hist[g]++
    }

    // Compute Otsu threshold
    let total = w * h
    let sum = 0
    for (let t = 0; t < 256; t++) sum += t * hist[t]
    let sumB = 0
    let wB = 0
    let wF = 0
    let varMax = 0
    let threshold = 128

    for (let t = 0; t < 256; t++) {
      wB += hist[t]
      if (wB === 0) continue
      wF = total - wB
      if (wF === 0) break
      sumB += t * hist[t]
      const mB = sumB / wB
      const mF = (sum - sumB) / wF
      const varBetween = wB * wF * (mB - mF) * (mB - mF)
      if (varBetween > varMax) {
        varMax = varBetween
        threshold = t
      }
    }

    for (let i = 0; i < d.length; i += 4) {
      const v = gray[i / 4] >= threshold ? 255 : 0
      d[i] = v
      d[i + 1] = v
      d[i + 2] = v
    }
    ctx.putImageData(imgData, 0, 0)
  } else if (filterMode === 'laplacian') {
    // 3x3 Laplacian edge kernel
    const copy = new Uint8ClampedArray(d)
    const kernel = [
      0, -1, 0,
      -1, 4, -1,
      0, -1, 0
    ]
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let sumR = 0, sumG = 0, sumB = 0
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * w + (x + kx)) * 4
            const weight = kernel[(ky + 1) * 3 + (kx + 1)]
            sumR += copy[idx] * weight
            sumG += copy[idx + 1] * weight
            sumB += copy[idx + 2] * weight
          }
        }
        const outIdx = (y * w + x) * 4
        d[outIdx] = Math.min(255, Math.max(0, sumR * 2 + 128))
        d[outIdx + 1] = Math.min(255, Math.max(0, sumG * 2 + 128))
        d[outIdx + 2] = Math.min(255, Math.max(0, sumB * 2 + 128))
      }
    }
    ctx.putImageData(imgData, 0, 0)
  }
}
