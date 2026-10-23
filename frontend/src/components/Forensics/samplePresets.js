/**
 * Forensic Sample Presets
 * Enables 1-click testing of all forensic studio capabilities without needing to find files.
 */

// Generate a high-resolution canvas image for each preset
function createSampleCanvas(width, height, drawFn) {
  if (typeof document === 'undefined') return ''
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  drawFn(ctx, width, height)
  return canvas.toDataURL('image/jpeg', 0.92)
}

// 1. Chợ Bến Thành (GPS & EXIF)
function drawBenThanh(ctx, w, h) {
  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6)
  skyGrad.addColorStop(0, '#0284c7')
  skyGrad.addColorStop(0.7, '#38bdf8')
  skyGrad.addColorStop(1, '#bae6fd')
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, w, h * 0.6)

  // Ground / plaza
  const groundGrad = ctx.createLinearGradient(0, h * 0.6, 0, h)
  groundGrad.addColorStop(0, '#334155')
  groundGrad.addColorStop(1, '#1e293b')
  ctx.fillStyle = groundGrad
  ctx.fillRect(0, h * 0.6, w, h * 0.4)

  // Clock Tower building
  ctx.fillStyle = '#fef08a' // Cream yellow facade
  ctx.fillRect(w * 0.35, h * 0.25, w * 0.3, h * 0.45)

  // Red pyramid roof
  ctx.fillStyle = '#dc2626'
  ctx.beginPath()
  ctx.moveTo(w * 0.32, h * 0.25)
  ctx.lineTo(w * 0.5, h * 0.1)
  ctx.lineTo(w * 0.68, h * 0.25)
  ctx.closePath()
  ctx.fill()

  // Spire
  ctx.fillStyle = '#e2e8f0'
  ctx.fillRect(w * 0.49, h * 0.05, w * 0.02, h * 0.06)

  // Clock face
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(w * 0.5, h * 0.35, w * 0.06, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = '#0f172a'
  ctx.stroke()

  // Clock hands (pointing to 11:35)
  ctx.beginPath()
  ctx.moveTo(w * 0.5, h * 0.35)
  ctx.lineTo(w * 0.49, h * 0.31)
  ctx.moveTo(w * 0.5, h * 0.35)
  ctx.lineTo(w * 0.53, h * 0.38)
  ctx.stroke()

  // Arch entrance
  ctx.fillStyle = '#0f172a'
  ctx.beginPath()
  ctx.arc(w * 0.5, h * 0.6, w * 0.08, Math.PI, 0)
  ctx.lineTo(w * 0.58, h * 0.7)
  ctx.lineTo(w * 0.42, h * 0.7)
  ctx.closePath()
  ctx.fill()

  // Watermark text in bottom corner
  ctx.font = 'bold 14px monospace'
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.fillText('Ben Thanh Market, HCMC (10.7725° N, 106.6980° E) • Sony A7R IV', 20, h - 20)
}

// 2. Manipulated License Plate (ELA Anomaly)
function drawManipulatedPlate(ctx, w, h) {
  // Dark garage background
  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#0f172a')
  bg.addColorStop(1, '#020617')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // Motorbike rear silhouette
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.roundRect(w * 0.2, h * 0.15, w * 0.6, h * 0.7, 24)
  ctx.fill()

  // Authentic dirty mudguard texture
  for (let i = 0; i < 400; i++) {
    const nx = w * 0.2 + Math.random() * w * 0.6
    const ny = h * 0.15 + Math.random() * h * 0.7
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(51, 65, 85, 0.4)' : 'rgba(30, 41, 59, 0.6)'
    ctx.fillRect(nx, ny, 2, 2)
  }

  // License plate bracket
  ctx.fillStyle = '#090d16'
  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.roundRect(w * 0.28, h * 0.35, w * 0.44, h * 0.32, 12)
  ctx.fill()
  ctx.stroke()

  // White reflective plate surface
  ctx.fillStyle = '#f8fafc'
  ctx.beginPath()
  ctx.roundRect(w * 0.3, h * 0.37, w * 0.4, h * 0.28, 8)
  ctx.fill()

  // Authentic upper line: "59 - P1"
  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 36px "Courier New", monospace'
  ctx.textAlign = 'center'
  ctx.fillText('59 - P1', w * 0.5, h * 0.46)

  // Spliced/pasted lower line: "999.99" (sharp, high contrast composite intended to trigger high ELA)
  // Drawn with artificial glow/sharp edge characteristic of Photoshop cut-and-paste
  ctx.fillStyle = '#000000'
  ctx.font = '900 44px Arial, sans-serif'
  ctx.fillText('999.99', w * 0.5, h * 0.59)

  ctx.textAlign = 'left'
  ctx.font = '13px monospace'
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.fillText('[ELA TEST]: Lower plate digits "999.99" pasted from higher resolution composite', 20, h - 20)
}

// 3. Hanoi Flagpole & Shadow (Chrono-Solar)
function drawFlagpoleShadow(ctx, w, h) {
  // Sunlit stone courtyard
  const courtGrad = ctx.createLinearGradient(0, 0, w, h)
  courtGrad.addColorStop(0, '#94a3b8')
  courtGrad.addColorStop(1, '#64748b')
  ctx.fillStyle = courtGrad
  ctx.fillRect(0, 0, w, h)

  // Pavement stone grid
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 1
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  // Flagpole Base Center
  const baseX = w * 0.55
  const baseY = h * 0.35

  // CAST SHADOW: angle ~205° (South-South-West)
  // Length ~ 260px
  const shadowAngleRad = (205 - 90) * (Math.PI / 180) // canvas angle from x-axis
  const shadowLength = h * 0.45
  const tipX = baseX + Math.cos(shadowAngleRad) * shadowLength
  const tipY = baseY + Math.sin(shadowAngleRad) * shadowLength

  // Shadow polygon
  ctx.fillStyle = 'rgba(15, 23, 42, 0.72)'
  ctx.beginPath()
  ctx.moveTo(baseX - 10, baseY)
  ctx.lineTo(tipX - 2, tipY)
  ctx.lineTo(tipX + 2, tipY)
  ctx.lineTo(baseX + 10, baseY)
  ctx.closePath()
  ctx.fill()

  // Flag shadow flutter at the tip
  ctx.beginPath()
  ctx.arc(tipX, tipY, 18, 0, Math.PI * 2)
  ctx.fill()

  // Vertical Flagpole Base (Tiered Pedestal)
  ctx.fillStyle = '#475569'
  ctx.beginPath()
  ctx.arc(baseX, baseY, 28, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#cbd5e1'
  ctx.beginPath()
  ctx.arc(baseX, baseY, 16, 0, Math.PI * 2)
  ctx.fill()

  // Pole upright standing
  ctx.fillStyle = '#f8fafc'
  ctx.beginPath()
  ctx.arc(baseX, baseY, 8, 0, Math.PI * 2)
  ctx.fill()

  // Target crosshair guides
  ctx.strokeStyle = '#38bdf8'
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(baseX, baseY)
  ctx.lineTo(tipX, tipY)
  ctx.stroke()
  ctx.setLineDash([])

  // Labels
  ctx.font = 'bold 13px sans-serif'
  ctx.fillStyle = '#38bdf8'
  ctx.fillText('← Chân cột (Base Point)', baseX + 35, baseY + 5)
  ctx.fillStyle = '#f43f5e'
  ctx.fillText('← Đỉnh bóng (Shadow Tip ~205°)', tipX - 190, tipY + 15)

  ctx.font = '13px monospace'
  ctx.fillStyle = '#ffffff'
  ctx.fillText('Hà Nội Flagpole (21.0313° N, 105.8402° E) • Thước đo: Kéo từ chân cột đến đỉnh bóng', 20, h - 20)
}

// 4. Micro-Text Receipt & QR
function drawMicroTextReceipt(ctx, w, h) {
  // Wood table background
  ctx.fillStyle = '#451a03'
  ctx.fillRect(0, 0, w, h)

  // Paper receipt
  ctx.fillStyle = '#fefce8' // Slightly aged yellow receipt paper
  ctx.beginPath()
  ctx.roundRect(w * 0.22, h * 0.08, w * 0.56, h * 0.84, 8)
  ctx.fill()

  // Store header
  ctx.fillStyle = '#1e293b'
  ctx.textAlign = 'center'
  ctx.font = 'bold 20px "Courier New", monospace'
  ctx.fillText('TRUNG TÂM GIÁM ĐỊNH TƯ PHÁP', w * 0.5, h * 0.16)
  ctx.font = '12px "Courier New", monospace'
  ctx.fillText('Số 19 Đường Tri Thức, Quận 1, TP. HCM', w * 0.5, h * 0.20)
  ctx.fillText('ĐT: (028) 3822-FORENSICS', w * 0.5, h * 0.23)

  // Divider
  ctx.fillText('------------------------------------------------', w * 0.5, h * 0.26)

  // Small blurred serial numbers and details
  ctx.font = '12px "Courier New", monospace'
  ctx.textAlign = 'left'
  const leftX = w * 0.26
  ctx.fillText('MÃ HỒ SƠ:     FSS-2024-9988-VN', leftX, h * 0.31)
  ctx.fillText('NGÀY THỤ LÝ:  15/05/2024 14:30:00', leftX, h * 0.35)
  ctx.fillText('ĐỐI TƯỢNG:    TÀI LIỆU KỸ THUẬT SỐ', leftX, h * 0.39)
  ctx.fillText('THIẾT BỊ THU: SONY ILCE-7RM4 (SERIAL: #490182)', leftX, h * 0.43)
  ctx.fillText('TỌA ĐỘ GPS:   10.7725° N, 106.6980° E', leftX, h * 0.47)

  // Blurred micro-text section (small font 9px with reduced opacity)
  ctx.fillStyle = '#64748b'
  ctx.font = '8px "Courier New", monospace'
  ctx.fillText('SERIAL CHIP: 8A4F-99B2-C019-E441-FF02 (DÙNG BỘ LỌC OTSU ĐỂ SOI RÕ)', leftX, h * 0.54)
  ctx.fillText('MÃ BẢO MẬT:  SEC-HASH-SHA256-7F912048A109928371BCFE', leftX, h * 0.58)

  // Barcode representation
  ctx.fillStyle = '#0f172a'
  const barY = h * 0.65
  for (let bx = leftX; bx < w * 0.74; bx += 4) {
    const barWidth = (bx % 3 === 0) ? 3 : 1
    ctx.fillRect(bx, barY, barWidth, 40)
  }
  ctx.textAlign = 'center'
  ctx.font = '11px monospace'
  ctx.fillText('* 9 8 7 6 5 4 3 2 1 0 *', w * 0.5, barY + 56)

  ctx.textAlign = 'left'
  ctx.font = '13px monospace'
  ctx.fillStyle = '#ffffff'
  ctx.fillText('[OSINT / MICRO-TEXT]: Bật bộ lọc Otsu hoặc Tương phản cao để đọc dòng chữ vi mô mờ', 20, h - 20)
}

export const FORENSIC_PRESETS = [
  {
    id: 'preset_benthanh',
    title: 'Chợ Bến Thành (EXIF & GPS)',
    shortDesc: 'Ảnh phong cảnh có đầy đủ EXIF, Model Sony A7R IV & Tọa độ GPS Chợ Bến Thành.',
    filename: 'DSC04892_BenThanh_HCMC.jpg',
    category: 'exif',
    badge: 'EXIF / GPS',
    badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    mockData: {
      has_exif: true,
      camera: {
        make: 'Sony',
        model: 'ILCE-7RM4 (A7R IV)',
        lens_model: 'FE 35mm F1.4 GM',
        software: 'ILCE-7RM4 v1.20',
        datetime_original: '2024:05:15 11:35:20',
        exposure_time: '1/1000 s',
        f_number: 'f/2.8',
        iso: 100,
        focal_length: '35.0 mm',
        flash: 'Flash did not fire',
        white_balance: 'Auto (Daylight)'
      },
      gps: {
        has_gps: true,
        latitude: 10.7725,
        longitude: 106.6980,
        altitude: 12.5,
        google_maps_url: 'https://www.google.com/maps?q=10.7725,106.6980',
        osm_url: 'https://www.openstreetmap.org/?mlat=10.7725&mlon=106.6980#map=16/10.7725/106.6980'
      },
      fingerprint: {
        matched: false,
        platform: 'Máy ảnh Chuyên Dụng (Sony Alpha)',
        pattern_name: 'Sony Raw/JPEG Standard',
        unix_timestamp: 1715747720,
        extracted_datetime: '15/05/2024 11:35:20 (Giờ địa phương GMT+7)',
        osint_links: []
      },
      tampering_indicators: {
        software_detected: false,
        exif_scrubbed: false,
        warnings: ['Ảnh gốc trực tiếp từ máy ảnh Sony. Không phát hiện can thiệp phần mềm đồ họa.']
      }
    },
    getImageDataUrl: () => createSampleCanvas(800, 600, drawBenThanh)
  },
  {
    id: 'preset_ela_anomaly',
    title: 'Biển Số Ghép (Dị Thường ELA)',
    shortDesc: 'Ảnh nghi vấn can thiệp Photoshop: biển số 999.99 ghép vào xe, sai số nén ELA bất thường.',
    filename: 'tampered_license_plate_59P1.jpg',
    category: 'ela',
    badge: 'Cắt Ghép ELA',
    badgeColor: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
    mockData: {
      has_exif: true,
      camera: {
        make: 'Apple',
        model: 'iPhone 15 Pro Max',
        lens_model: 'iPhone 15 Pro Max back triple camera 6.76mm f/1.78',
        software: 'Adobe Photoshop 2024 (Windows)',
        datetime_original: '2024:04:10 18:20:10',
        exposure_time: '1/60 s',
        f_number: 'f/1.8',
        iso: 400,
        focal_length: '24.0 mm',
        flash: 'Off'
      },
      gps: {
        has_gps: true,
        latitude: 10.7584,
        longitude: 106.6698,
        altitude: 8.0,
        google_maps_url: 'https://www.google.com/maps?q=10.7584,106.6698',
        osm_url: 'https://www.openstreetmap.org/?mlat=10.7584&mlon=106.6698#map=16/10.7584/106.6698'
      },
      fingerprint: {
        matched: false,
        platform: 'Điện Thoại Thông Minh',
        pattern_name: 'Photoshop Export'
      },
      tampering_indicators: {
        software_detected: true,
        software_name: 'Adobe Photoshop 2024 (Windows)',
        exif_scrubbed: false,
        warnings: [
          'CẢNH BÁO: Tệp đã được lưu hoặc chỉnh sửa bằng Adobe Photoshop 2024.',
          'Dị thường nén ELA: Khu vực biển số số 999.99 có tần số lượng tử hóa khác biệt với thân xe.'
        ]
      }
    },
    getImageDataUrl: () => createSampleCanvas(800, 600, drawManipulatedPlate)
  },
  {
    id: 'preset_solar_shadow',
    title: 'Cột Cờ & Bóng Đổ (Chrono-Solar)',
    shortDesc: 'Vật thể đứng thẳng đổ bóng góc ~205°. Phù hợp kiểm tra thước đo bóng và ước tính giờ chụp.',
    filename: 'flagpole_shadow_hanoi_205deg.jpg',
    category: 'solar',
    badge: 'Bóng Nắng',
    badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    initialShadowAngle: 205.0,
    initialCoords: { lat: 21.0313, lon: 105.8402, date: '2024-05-15' },
    mockData: {
      has_exif: true,
      camera: {
        make: 'Canon',
        model: 'Canon EOS R6 Mark II',
        lens_model: 'RF24-105mm F4 L IS USM',
        software: 'Digital Photo Professional',
        datetime_original: '2024:05:15 11:37:00',
        exposure_time: '1/2000 s',
        f_number: 'f/8.0',
        iso: 100,
        focal_length: '50.0 mm'
      },
      gps: {
        has_gps: true,
        latitude: 21.0313,
        longitude: 105.8402,
        altitude: 18.0,
        google_maps_url: 'https://www.google.com/maps?q=21.0313,105.8402',
        osm_url: 'https://www.openstreetmap.org/?mlat=21.0313&mlon=105.8402#map=16/21.0313/105.8402'
      },
      fingerprint: {
        matched: false,
        platform: 'Canon EOS Digital'
      },
      tampering_indicators: {
        software_detected: false,
        warnings: ['Ảnh phong cảnh chuẩn thiên văn, bóng đổ rõ nét thích hợp phân tích Chronolocation.']
      }
    },
    getImageDataUrl: () => createSampleCanvas(800, 600, drawFlagpoleShadow)
  },
  {
    id: 'preset_fb_fingerprint',
    title: 'Facebook CDN Hash (Fingerprint)',
    shortDesc: 'Tên tệp Facebook CDN: trích xuất User ID, Photo ID và thời gian upload dù EXIF đã bị lột.',
    filename: '1021482910398402_2049182049182049_1715783400_n.jpg',
    category: 'fingerprint',
    badge: 'Facebook CDN',
    badgeColor: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    mockData: {
      has_exif: false,
      camera: { has_exif: false },
      gps: { has_gps: false },
      fingerprint: {
        matched: true,
        platform: 'Facebook',
        pattern_name: 'Facebook CDN Classic Hash',
        photo_id: '2049182049182049',
        user_id: '1021482910398402',
        unix_timestamp: 1715783400,
        iso_datetime: '2024-05-15T14:30:00.000Z',
        extracted_datetime: '15/05/2024 21:30:00 (GMT+7)',
        confidence: 'high',
        osint_links: [
          'https://www.facebook.com/photo.php?fbid=2049182049182049',
          'https://www.facebook.com/1021482910398402'
        ],
        description: 'Định dạng tải về từ máy chủ CDN Facebook. Bóc tách được User ID (1021482910398402) và Photo ID (2049182049182049).'
      },
      tampering_indicators: {
        software_detected: false,
        exif_scrubbed: true,
        warnings: [
          'Ảnh không có siêu dữ liệu EXIF (đã bị mạng xã hội Facebook lột sạch để bảo vệ quyền riêng tư).',
          'Dấu vết số: Phục hồi thành công User ID, Photo ID và mốc thời gian tải lên thông qua cấu trúc tên tệp.'
        ]
      }
    },
    getImageDataUrl: () => createSampleCanvas(800, 600, drawBenThanh)
  },
  {
    id: 'preset_micro_text',
    title: 'Hồ Sơ Giám Định & Chữ Vi Mô',
    shortDesc: 'Văn bản có dòng chữ vi mô mờ và mã vạch. Sử dụng kính lúp và bộ lọc Otsu để soi rõ.',
    filename: 'forensics_case_dossier_microtext.png',
    category: 'osint',
    badge: 'Micro-Text OSINT',
    badgeColor: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
    mockData: {
      has_exif: false,
      camera: { has_exif: false },
      gps: { has_gps: false },
      fingerprint: {
        matched: false,
        platform: 'Tài liệu quét (Scanner / Document)'
      },
      tampering_indicators: {
        software_detected: false,
        warnings: ['Tài liệu văn bản vi mô. Khuyến nghị sử dụng bộ lọc Binarization (Otsu) và Kính lúp Loupe 4x-8x.']
      }
    },
    getImageDataUrl: () => createSampleCanvas(800, 600, drawMicroTextReceipt)
  }
]
