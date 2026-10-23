import React, { useState } from 'react'
import {
  FileText,
  Camera,
  MapPin,
  Fingerprint,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  Info,
  Clock,
  Layers,
  Crosshair
} from 'lucide-react'

export default function MetadataInspector({ metadata, fileInfo }) {
  const [copiedKey, setCopiedKey] = useState(null)

  const handleCopy = (text, key) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const camera = metadata?.camera || metadata?.exif || {}
  const gps = metadata?.gps || {}
  const fingerprint = metadata?.fingerprint || {}
  const tampering = metadata?.tampering_indicators || {}
  const info = fileInfo || metadata?.file_info || {}

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return (
    <div className="space-y-6">
      {/* 1. Tampering & Integrity Advisory Banner */}
      {tampering.software_detected && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-300 flex items-start gap-3 backdrop-blur-md">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-amber-200 uppercase tracking-wider flex items-center gap-2">
              <span>Cảnh Báo Giám Định Số: Phát Hiện Can Thiệp Phần Mềm Đồ Họa</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                {tampering.software_name || camera.software || 'Photoshop'}
              </span>
            </div>
            <p className="text-slate-300">
              Tệp hình ảnh chứa chữ ký phần mềm biên tập đồ họa. Các chi tiết, màu sắc hoặc nội dung có thể đã qua chỉnh sửa, tẩy xóa hoặc ghép lớp.
            </p>
          </div>
        </div>
      )}

      {/* 2. File Digital Fingerprint & Cryptographic Summary Card */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Tổng Quan Tệp & Băm Mật Mã (Hash)</h3>
              <p className="text-xs text-slate-400">Định danh bất biến xác thực tính toàn vẹn của tệp</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
            {info.format || 'JPEG'} • {info.mode || 'RGB'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="text-slate-500 mb-1">Tên tệp</div>
            <div className="font-mono text-slate-200 font-semibold truncate" title={metadata?.filename}>
              {metadata?.filename || 'chua_dat_ten.jpg'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="text-slate-500 mb-1">Kích thước ảnh</div>
            <div className="font-mono text-slate-200 font-semibold">
              {info.width ? `${info.width} × ${info.height} px` : 'N/A'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="text-slate-500 mb-1">Dung lượng tệp</div>
            <div className="font-mono text-slate-200 font-semibold">
              {formatFileSize(info.size_bytes)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="text-slate-500 mb-1">Trạng thái EXIF</div>
            <div className="flex items-center gap-1.5 font-semibold">
              {camera.has_exif ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Có EXIF
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Bị Lột / Không có
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cryptographic Hashes */}
        <div className="space-y-2 pt-1 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400 font-mono w-14">MD5:</span>
              <span className="font-mono text-slate-300 break-all">{info.md5 || 'Đang tính toán...'}</span>
            </div>
            {info.md5 && (
              <button
                onClick={() => handleCopy(info.md5, 'md5')}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Sao chép MD5"
              >
                {copiedKey === 'md5' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400 font-mono w-14">SHA-256:</span>
              <span className="font-mono text-cyan-300 break-all">{info.sha256 || 'Đang tính toán...'}</span>
            </div>
            {info.sha256 && (
              <button
                onClick={() => handleCopy(info.sha256, 'sha256')}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Sao chép SHA-256"
              >
                {copiedKey === 'sha256' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Camera & Optical Exposure Table */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Thiết Bị Chụp & Thông Số Phơi Sáng (EXIF)</h3>
              <p className="text-xs text-slate-400">Thông tin quang học ống kính, tốc độ màn trập và cảm biến</p>
            </div>
          </div>
          {camera.software && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              tampering.software_detected
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {camera.software}
            </span>
          )}
        </div>

        {camera.has_exif ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="text-slate-500 mb-1">Nhà sản xuất (Make)</div>
              <div className="font-semibold text-slate-200">{camera.make || 'Không xác định'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="text-slate-500 mb-1">Mẫu máy (Model)</div>
              <div className="font-semibold text-slate-200">{camera.model || 'Không xác định'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="text-slate-500 mb-1">Ống kính (Lens)</div>
              <div className="font-semibold text-slate-200 truncate" title={camera.lens_model}>
                {camera.lens_model || 'Tiêu chuẩn theo máy'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="text-slate-500 mb-1">Thời gian chụp gốc</div>
              <div className="font-mono text-cyan-300 font-semibold">{camera.datetime_original || 'N/A'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="text-slate-500 mb-1">Tốc độ màn trập</div>
              <div className="font-mono text-slate-200 font-semibold">{camera.exposure_time || 'N/A'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="text-slate-500 mb-1">Độ mở khẩu (Aperture)</div>
              <div className="font-mono text-slate-200 font-semibold">{camera.f_number || 'N/A'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="text-slate-500 mb-1">Độ nhạy ISO</div>
              <div className="font-mono text-slate-200 font-semibold">{camera.iso || 'N/A'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="text-slate-500 mb-1">Tiêu cự (Focal Length)</div>
              <div className="font-mono text-slate-200 font-semibold">{camera.focal_length || 'N/A'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="text-slate-500 mb-1">Đèn Flash</div>
              <div className="font-semibold text-slate-200">{camera.flash || 'Không bật'}</div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-400">
            <Camera className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
            <p>Không tìm thấy siêu dữ liệu EXIF trong tệp này.</p>
            <p className="text-slate-500 text-[11px] mt-1">
              Ảnh tải từ Facebook, Messenger, Zalo hoặc Telegram thường được hệ thống tự động loại bỏ EXIF để bảo mật người dùng.
            </p>
          </div>
        )}
      </div>

      {/* 4. GPS Geolocation & Map Integration */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Vị Trí Địa Lý Thực Địa (GPS Coordinates)</h3>
              <p className="text-xs text-slate-400">Tọa độ vệ tinh định vị điểm chụp ảnh thực tế</p>
            </div>
          </div>
          {gps.has_gps && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              GPS Đã Xác Thực
            </span>
          )}
        </div>

        {gps.has_gps ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="text-slate-500 mb-1">Vĩ độ (Latitude)</div>
                <div className="font-mono text-emerald-400 font-bold text-sm">
                  {gps.latitude?.toFixed(6)}°
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="text-slate-500 mb-1">Kinh độ (Longitude)</div>
                <div className="font-mono text-emerald-400 font-bold text-sm">
                  {gps.longitude?.toFixed(6)}°
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="text-slate-500 mb-1">Độ cao (Altitude)</div>
                <div className="font-mono text-slate-200 font-semibold text-sm">
                  {gps.altitude ? `${gps.altitude} m` : 'Không ghi nhận'}
                </div>
              </div>
            </div>

            {/* Embedded OpenStreetMap Preview */}
            <div className="rounded-xl overflow-hidden border border-slate-800 h-64 bg-slate-950 relative">
              <iframe
                title="GPS Location Map"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${gps.longitude - 0.008}%2C${gps.latitude - 0.005}%2C${gps.longitude + 0.008}%2C${gps.latitude + 0.005}&layer=mapnik&marker=${gps.latitude}%2C${gps.longitude}`}
                className="w-full h-full opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>

            {/* 1-Click External Map Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href={gps.google_maps_url || `https://www.google.com/maps?q=${gps.latitude},${gps.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Mở trong Google Maps</span>
              </a>
              <a
                href={gps.osm_url || `https://www.openstreetmap.org/?mlat=${gps.latitude}&mlon=${gps.longitude}#map=16/${gps.latitude}/${gps.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer border border-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Mở trong OpenStreetMap</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-400">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
            <p>Tệp không chứa tọa độ GPS.</p>
            <p className="text-slate-500 text-[11px] mt-1">
              Nếu bạn biết địa điểm chụp hoặc muốn ước lượng giờ chụp qua bóng nắng, bạn có thể nhập tọa độ thủ công tại tab "Bóng Nắng (Chrono-Solar)".
            </p>
          </div>
        )}
      </div>

      {/* 5. Digital Fingerprint Decoder (OSINT Social Media Patterns) */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Giải Mã Dấu Vết Số Tên Tệp (Filename OSINT)</h3>
              <p className="text-xs text-slate-400">Thuật toán bóc tách cấu trúc đặt tên từ Facebook, Telegram, Zalo</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            fingerprint.matched
              ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
              : 'bg-slate-800 text-slate-400'
          }`}>
            {fingerprint.platform || 'Chuẩn'}
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Quy chuẩn định danh:</span>
              <span className="font-mono text-purple-300 font-bold">
                {fingerprint.pattern_name || 'Định dạng tên tệp thông thường'}
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {fingerprint.description || 'Không phát hiện quy chuẩn mã hóa ID hoặc mốc thời gian đặc thù từ mạng xã hội.'}
            </p>
          </div>

          {/* Extracted Platform Details */}
          {(fingerprint.photo_id || fingerprint.user_id || fingerprint.unix_timestamp) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fingerprint.photo_id && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
                  <div>
                    <div className="text-slate-500 mb-1">Mã định danh ảnh (Photo ID)</div>
                    <div className="font-mono text-cyan-300 font-bold">{fingerprint.photo_id}</div>
                  </div>
                  <button
                    onClick={() => handleCopy(fingerprint.photo_id, 'photoid')}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
                    title="Sao chép Photo ID"
                  >
                    {copiedKey === 'photoid' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {fingerprint.user_id && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
                  <div>
                    <div className="text-slate-500 mb-1">Mã tài khoản (User ID)</div>
                    <div className="font-mono text-purple-300 font-bold">{fingerprint.user_id}</div>
                  </div>
                  <button
                    onClick={() => handleCopy(fingerprint.user_id, 'userid')}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
                    title="Sao chép User ID"
                  >
                    {copiedKey === 'userid' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {fingerprint.extracted_datetime && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 col-span-full">
                  <div className="text-slate-500 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Thời gian giải mã từ tên tệp (Decoded Timestamp)</span>
                  </div>
                  <div className="font-mono text-amber-300 font-bold text-sm">
                    {fingerprint.extracted_datetime}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OSINT Direct Links */}
          {fingerprint.osint_links && fingerprint.osint_links.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Liên kết truy vết trực tiếp (OSINT URLs):
              </div>
              <div className="flex flex-wrap gap-2">
                {fingerprint.osint_links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono border border-slate-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{link}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
