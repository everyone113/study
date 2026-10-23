import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sliders,
  CloudRain,
  Coffee,
  Keyboard,
  Waves,
  Activity,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCcw
} from 'lucide-react'
import {
  soundscapeEngine,
  SOUNDSCAPE_CHANNELS,
  SOUNDSCAPE_PRESETS
} from '../../utils/soundscapeAudioEngine'

const CHANNEL_ICONS = {
  rain: CloudRain,
  cafe: Coffee,
  keyboard: Keyboard,
  waves: Waves,
  alpha: Activity,
}

const CHANNEL_COLORS = {
  rain: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  cafe: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  keyboard: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  waves: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  alpha: 'text-violet-400 border-violet-500/30 bg-violet-500/10',
}

export default function SoundscapePlayer({ isOpen, onClose }) {
  const [engineState, setEngineState] = useState(() => soundscapeEngine.getState())
  const [expanded, setExpanded] = useState(false)
  const [activePreset, setActivePreset] = useState('deep_study')

  useEffect(() => {
    const unsubscribe = soundscapeEngine.subscribe((nextState) => {
      setEngineState(nextState)
    })
    return () => unsubscribe()
  }, [])

  if (!isOpen) return null

  const { isPlaying, masterVolume, volumes, mutes } = engineState

  const handleTogglePlay = () => {
    soundscapeEngine.toggle()
  }

  const handleMasterVolumeChange = (e) => {
    const val = parseFloat(e.target.value)
    soundscapeEngine.setMasterVolume(val)
  }

  const handleChannelVolumeChange = (channelId, e) => {
    const val = parseFloat(e.target.value)
    soundscapeEngine.setChannelVolume(channelId, val)
  }

  const handleToggleMute = (channelId) => {
    soundscapeEngine.toggleChannelMute(channelId)
  }

  const handleSelectPreset = (presetKey) => {
    setActivePreset(presetKey)
    soundscapeEngine.applyPreset(presetKey)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 right-6 z-40 w-96 max-w-[calc(100vw-32px)] bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-2xl text-slate-100 overflow-hidden ring-1 ring-white/10"
    >
      {/* Top Header / Bar */}
      <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-500/40 animate-pulse'
              : 'bg-slate-800 text-slate-400'
          }`}>
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Bộ Hòa Âm Tập Trung</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-semibold border border-violet-500/30">
                Web Audio
              </span>
            </div>
            <div className="text-[10px] text-slate-400">5 kênh âm thanh không gian procedural</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
            title={expanded ? 'Thu gọn mixer' : 'Mở rộng 5 kênh'}
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
            title="Đóng bảng âm thanh"
          >
            <span className="text-sm font-bold">✕</span>
          </button>
        </div>
      </div>

      {/* Main Playback & Master Volume Bar */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          {/* Master Play / Pause Button */}
          <button
            onClick={handleTogglePlay}
            className={`w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all cursor-pointer shrink-0 shadow-lg ${
              isPlaying
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 shadow-violet-600/40 ring-2 ring-violet-400/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isPlaying ? 'Tạm dừng tất cả âm thanh' : 'Bật hòa âm không gian'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          {/* Master Volume Slider */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Âm lượng tổng (Master)</span>
              <span className="text-violet-400 font-mono font-bold">{Math.round(masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={handleMasterVolumeChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
          </div>
        </div>

        {/* Quick Presets Pills */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-0.5">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Gợi ý tâm trạng (Presets)</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {Object.entries(SOUNDSCAPE_PRESETS).map(([key, preset]) => {
              const isSelected = activePreset === key && isPlaying
              return (
                <button
                  key={key}
                  onClick={() => handleSelectPreset(key)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 font-semibold'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                  }`}
                >
                  {preset.name.split(' (')[0]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Expandable 5-Channel Mixer */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="pt-2 border-t border-slate-800/80 space-y-2.5 overflow-hidden"
            >
              <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                <span>Bộ Trộn 5 Kênh Độc Lập</span>
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
              </div>

              {Object.entries(SOUNDSCAPE_CHANNELS).map(([chKey, channel]) => {
                const Icon = CHANNEL_ICONS[chKey] || Volume2
                const vol = volumes[chKey] ?? 0.5
                const isMuted = mutes[chKey]
                const colorClasses = CHANNEL_COLORS[chKey] || 'text-slate-400'

                return (
                  <div
                    key={chKey}
                    className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/70 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-lg border ${colorClasses}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-slate-200 text-[11px]">
                          {channel.name.split(' (')[0]}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                          {isMuted ? 'Mute' : `${Math.round(vol * 100)}%`}
                        </span>
                        <button
                          onClick={() => handleToggleMute(chKey)}
                          className={`p-1 rounded-lg transition-colors ${
                            isMuted
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                          title={isMuted ? 'Bật lại kênh này' : 'Tắt tiếng kênh này'}
                        >
                          {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      disabled={isMuted}
                      value={vol}
                      onChange={(e) => handleChannelVolumeChange(chKey, e)}
                      className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${
                        isMuted ? 'bg-slate-800 opacity-40' : 'bg-slate-800 accent-violet-400'
                      }`}
                    />
                  </div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
