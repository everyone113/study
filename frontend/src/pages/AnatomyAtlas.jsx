import React, { useState, useMemo, useRef } from 'react'
import {
  HeartPulse,
  Activity,
  BookOpen,
  Layers,
  Search,
  Sparkles,
  Plus,
  Check,
  ExternalLink,
  Maximize2,
  Minimize2,
  RotateCcw,
  FileText,
  Brain,
  Stethoscope,
  X,
  ChevronRight,
  Info,
  Compass,
  Eye
} from 'lucide-react'

// Comprehensive Vietnamese Medical Anatomy Database
const ANATOMY_SYSTEMS = [
  {
    id: 'skeletal',
    name: 'Hệ Xương & Khớp',
    latin: 'Systema skeletale',
    english: 'Skeletal System',
    icon: 'Bone',
    color: '#f59e0b',
    description: 'Bộ khung nâng đỡ cơ thể gồm 206 xương, bảo vệ các tạng và là điểm bám của các cơ.',
    organs: [
      {
        name: 'Hộp Sọ & Khối Xương Mặt',
        latin: 'Cranium & Ossa faciei',
        english: 'Skull & Facial Bones',
        location: 'Vùng đầu',
        clinical: 'Bảo vệ não bộ và các giác quan. Chấn thương sọ não (TBI) cần lưu ý điểm yếu Pterion (nơi có động mạch màng não giữa đi qua).',
        keyStructures: ['Xương trán (Frontal bone)', 'Xương đỉnh (Parietal bone)', 'Xương thái dương (Temporal bone)', 'Xương chẩm (Occipital bone)', 'Xương hàm dưới (Mandible)']
      },
      {
        name: 'Cột Sống (33-34 đốt sống)',
        latin: 'Columna vertebralis',
        english: 'Vertebral Column',
        location: 'Trục giữa lưng',
        clinical: 'Chứa tủy sống. Gồm 7 đốt sống cổ (C1-C7, C1 gọi là đốt Atlas, C2 là Axis), 12 đốt ngực (T1-T12), 5 đốt thắt lưng (L1-L5), 5 đốt cùng (S1-S5) và 4-5 đốt cụt. Thường gặp thoát vị đĩa đệm vùng L4-L5, L5-S1.',
        keyStructures: ['Đốt đội C1 (Atlas)', 'Đốt trục C2 (Axis)', 'Đốt sống thắt lưng L1-L5', 'Xương cùng (Sacrum)', 'Đĩa đệm gian đốt sống']
      },
      {
        name: 'Lồng Ngực & Xương Sườn',
        latin: 'Thorax & Costae',
        english: 'Thoracic Cage & Ribs',
        location: 'Vùng ngực',
        clinical: 'Gồm xương ức và 12 đôi xương sườn (7 sườn thật nối trực tiếp xương ức, 3 sườn giả nối qua sụn sườn 7, 2 sườn cụt lơ lửng). Bảo vệ tim và 2 lá phổi.',
        keyStructures: ['Cán xương ức (Manubrium)', 'Thân xương ức (Body of sternum)', 'Mũi kiếm (Xiphoid process)', 'Góc ức Louis (mốc đếm khoang liên sườn 2)']
      },
      {
        name: 'Chi Trên & Đai Vai',
        latin: 'Membrum superius',
        english: 'Upper Limb & Pectoral Girdle',
        location: 'Tay và khớp vai',
        clinical: 'Xương đòn là xương hay bị gãy nhất trong chấn thương. Khớp vai là khớp có biên độ vận động lớn nhất cơ thể nên dễ trật khớp nhất.',
        keyStructures: ['Xương đòn (Clavicle)', 'Xương bả vai (Scapula)', 'Xương cánh tay (Humerus)', 'Xương quay (Radius)', 'Xương trụ (Ulna)']
      },
      {
        name: 'Chi Dưới & Khung Chậu',
        latin: 'Membrum inferius & Pelvis',
        english: 'Lower Limb & Pelvis',
        location: 'Khung chậu và chân',
        clinical: 'Xương đùi là xương dài và chắc nhất cơ thể. Gãy cổ xương đùi thường gặp ở người cao tuổi loãng xương. Khớp gối có dây chằng chéo trước (ACL) và sụn chêm hay tổn thương khi chơi thể thao.',
        keyStructures: ['Xương chậu (Hip bone)', 'Xương đùi (Femur)', 'Xương bánh chè (Patella)', 'Xương chày (Tibia)', 'Xương mác (Fibula)']
      }
    ]
  },
  {
    id: 'cardiovascular',
    name: 'Hệ Tim Mạch & Tuần Hoàn',
    latin: 'Systema cardiovasculare',
    english: 'Cardiovascular System',
    icon: 'HeartPulse',
    color: '#ef4444',
    description: 'Hệ thống bơm và vận chuyển oxy, chất dinh dưỡng qua tim, động mạch và tĩnh mạch đến tế bào.',
    organs: [
      {
        name: 'Quả Tim (4 buồng & 4 van)',
        latin: 'Cor',
        english: 'Heart',
        location: 'Trung thất giữa lồng ngực, lệch sang trái',
        clinical: 'Nặng khoảng 250-300g. 2 tâm nhĩ (hút máu về), 2 tâm thất (bơm máu đi). Van 3 lá (nhĩ-thất phải), van 2 lá (nhĩ-thất trái). Nhồi máu cơ tim do tắc động mạch vành.',
        keyStructures: ['Tâm thất trái (Left ventricle - thành dày nhất)', 'Tâm thất phải', 'Tâm nhĩ trái & phải', 'Van 2 lá (Mitral valve)', 'Động mạch vành (Coronary artery)']
      },
      {
        name: 'Cung Động Mạch Chủ',
        latin: 'Arcus aortae',
        english: 'Aortic Arch',
        location: 'Xuất phát từ tâm thất trái uốn cong lên trên',
        clinical: 'Động mạch lớn nhất cơ thể, chịu áp lực máu cao nhất (huyết áp tâm thu). Cho ra 3 nhánh chính cấp máu lên đầu và tay: Thân tay đầu, Động mạch cảnh chung trái, Động mạch dưới đòn trái.',
        keyStructures: ['Động mạch chủ lên', 'Cung động mạch chủ', 'Động mạch cảnh chung (Carotid)', 'Động mạch chủ ngực & bụng']
      },
      {
        name: 'Hệ Tĩnh Mạch Chủ & Tĩnh Mạch Cửa',
        latin: 'Vena cava & Vena portae',
        english: 'Vena Cava & Portal Vein',
        location: 'Dọc ổ bụng và ngực đổ về tâm nhĩ phải',
        clinical: 'Tĩnh mạch chủ trên (SVC) gom máu nửa trên cơ thể, tĩnh mạch chủ dưới (IVC) gom máu nửa dưới. Tĩnh mạch cửa đưa máu từ ống tiêu hóa về gan lọc độc tố trước khi vào tuần hoàn chung.',
        keyStructures: ['Tĩnh mạch chủ trên (SVC)', 'Tĩnh mạch chủ dưới (IVC)', 'Tĩnh mạch cửa gan (Portal vein)', 'Tĩnh mạch cảnh trong']
      }
    ]
  },
  {
    id: 'nervous',
    name: 'Hệ Thần Kinh',
    latin: 'Systema nervosum',
    english: 'Nervous System',
    icon: 'Brain',
    color: '#8b5cf6',
    description: 'Hệ thống điều khiển trung ương và ngoại vi, xử lý tín hiệu cảm giác và vận động.',
    organs: [
      {
        name: 'Đại Não & Vỏ Não',
        latin: 'Cerebrum',
        english: 'Cerebrum',
        location: 'Hộp sọ tầng trên',
        clinical: 'Chia 2 bán cầu não (nối nhau qua thể chai) và 4 thùy: Thùy trán (tư duy, vận động), Thùy đỉnh (cảm giác), Thùy thái dương (nghe, trí nhớ), Thùy chẩm (thị giác). Đột quỵ thường do nhồi máu hoặc xuất huyết não.',
        keyStructures: ['Thùy trán (Frontal lobe)', 'Thùy thái dương (Temporal lobe)', 'Thùy chẩm (Occipital lobe)', 'Vùng Broca & Wernicke (Ngôn ngữ)']
      },
      {
        name: 'Tiểu Não & Thân Não',
        latin: 'Cerebellum & Truncus encephali',
        english: 'Cerebellum & Brainstem',
        location: 'Hố sọ sau',
        clinical: 'Tiểu não giữ thăng bằng và phối hợp động tác tinh vi. Thân não (Cuống não, Cầu não, Hành não) chứa trung tâm sinh mệnh điều hòa nhịp tim và nhịp thở.',
        keyStructures: ['Tiểu não (Cerebellum)', 'Cầu não (Pons)', 'Hành não (Medulla oblongata - trung tâm hô hấp)', 'Cuống não']
      },
      {
        name: '12 Đôi Dây Thần Kinh Sọ',
        latin: 'Nervi craniales I-XII',
        english: '12 Cranial Nerves',
        location: 'Xuất phát từ não bộ chui qua các lỗ sọ',
        clinical: 'Dây VII (dây thần kinh mặt) tổn thương gây liệt mặt ngoại biên (liệt Bell). Dây X (dây mê tẩu/lang thang) chi phối đối giao cảm tim, phổi, tiêu hóa.',
        keyStructures: ['Dây I: Khứu giác', 'Dây II: Thị giác', 'Dây V: Tam thoa', 'Dây VII: Vận động mặt', 'Dây X: Dây thần kinh lang thang']
      }
    ]
  },
  {
    id: 'respiratory',
    name: 'Hệ Hô Hấp',
    latin: 'Systema respiratorium',
    english: 'Respiratory System',
    icon: 'Activity',
    color: '#06b6d4',
    description: 'Trao đổi khí O2 và CO2 giữa môi trường và máu thông qua phổi và đường dẫn khí.',
    organs: [
      {
        name: 'Hai Lá Phổi & Cây Phế Quản',
        latin: 'Pulmones & Arbor bronchialis',
        english: 'Lungs & Bronchial Tree',
        location: 'Khoang lồng ngực 2 bên tim',
        clinical: 'Phổi phải có 3 thùy (trên, giữa, dưới) ngăn cách bởi khe chếch và khe ngang. Phổi trái có 2 thùy (trên, dưới) và có khuyết tim. Đơn vị trao đổi khí là khoảng 300-500 triệu phế nang.',
        keyStructures: ['Phổi phải (3 thùy)', 'Phổi trái (2 thùy + khuyết tim)', 'Khí quản (Trachea)', 'Phế quản chính (Carina)', 'Phế nang (Alveoli)']
      },
      {
        name: 'Thanh Quản & Khí Quản',
        latin: 'Larynx & Trachea',
        english: 'Larynx & Trachea',
        location: 'Vùng cổ trước',
        clinical: 'Thanh quản là cơ quan phát âm, chứa dây thanh âm và sụn nắp thanh môn (Epiglottis - ngăn thức ăn lọt vào đường thở khi nuốt). Khí quản gồm 16-20 vòng sụn chữ C.',
        keyStructures: ['Sụn giáp (Trái táo Adam)', 'Sụn nắp thanh môn (Epiglottis)', 'Dây thanh âm (Vocal cords)', 'Vòng sụn khí quản']
      }
    ]
  },
  {
    id: 'digestive',
    name: 'Hệ Tiêu Hóa',
    latin: 'Systema digestorium',
    english: 'Digestive System',
    icon: 'Layers',
    color: '#10b981',
    description: 'Tiêu hóa thức ăn, hấp thu dưỡng chất và đào thải chất cặn bã.',
    organs: [
      {
        name: 'Dạ Dày (Bao tử)',
        latin: 'Gaster / Ventriculus',
        english: 'Stomach',
        location: 'Hạ sườn trái và vùng thượng vị',
        clinical: 'Hình chữ J, thể tích 1-1.5 lít. Tiết acid HCl và enzyme Pepsin. Loét dạ dày tá tràng hay xảy ra ở bờ cong nhỏ và hành tá tràng do vi khuẩn Helicobacter pylori.',
        keyStructures: ['Tâm vị (Cardia)', 'Đáy vị (Fundus)', 'Thân vị (Body)', 'Hang môn vị (Antrum)', 'Cơ thắt môn vị (Pylorus)']
      },
      {
        name: 'Gan & Túi Mật',
        latin: 'Hepar & Vesica biliaris',
        english: 'Liver & Gallbladder',
        location: 'Hạ sườn phải, dưới vòm hoành phải',
        clinical: 'Tuyến lớn nhất cơ thể (nặng ~1.5kg). Phân chia 8 hạ phân thùy theo Couinaud. Gan sản xuất mật, khử độc, tổng hợp albumin và các yếu tố đông máu. Túi mật dự trữ và cô đặc dịch mật.',
        keyStructures: ['Thùy gan phải & trái', 'Tĩnh mạch cửa gan', 'Túi mật (Gallbladder)', 'Ống mật chủ (Common bile duct)']
      },
      {
        name: 'Ruột Non, Ruột Già & Ruột Thừa',
        latin: 'Intestinum tenue & crassum',
        english: 'Small & Large Intestine',
        location: 'Khoang ổ bụng',
        clinical: 'Ruột non dài ~6m (tá tràng, hỗng tràng, hồi tràng - nơi hấp thu dinh dưỡng chính). Ruột thừa nằm ở đáy manh tràng vùng hố chậu phải (điểm đau McBurney trong viêm ruột thừa cấp).',
        keyStructures: ['Tá tràng (Duodenum)', 'Hỗng tràng & Hồi tràng', 'Manh tràng (Cecum)', 'Ruột thừa (Appendix)', 'Đại tràng sigma & Trực tràng']
      }
    ]
  },
  {
    id: 'urinary',
    name: 'Hệ Tiết Niệu',
    latin: 'Systema urinarium',
    english: 'Urinary System',
    icon: 'Sparkles',
    color: '#3b82f6',
    description: 'Lọc máu, cân bằng nước điện giải, bài tiết chất độc và nước tiểu.',
    organs: [
      {
        name: 'Hai Quả Thận',
        latin: 'Renes',
        english: 'Kidneys',
        location: 'Sau phúc mạc hai bên cột sống thắt lưng',
        clinical: 'Thận phải nằm thấp hơn thận trái ~1-2cm do bị gan đè. Mỗi thận có khoảng 1 triệu nephron (đơn vị lọc máu). Tiết hormone Erythropoietin kích thích tủy xương tạo hồng cầu.',
        keyStructures: ['Vỏ thận (Cortex)', 'Tủy thận & Tháp Malpighi', 'Đài bể thận (Renal pelvis)', 'Động mạch thận', 'Nephron']
      },
      {
        name: 'Niệu Quản, Bàng Quang & Niệu Đạo',
        latin: 'Ureter, Vesica urinaria & Urethra',
        english: 'Ureters, Bladder & Urethra',
        location: 'Hố chậu và vùng đáy chậu',
        clinical: 'Niệu quản dài ~25cm có 3 chỗ hẹp sinh lý (nơi nối bể thận, nơi bắt chéo bó mạch chậu, nơi cắm vào bàng quang) là vị trí hay bị kẹt sỏi niệu quản.',
        keyStructures: ['Niệu quản (3 chỗ hẹp sinh lý)', 'Bàng quang (Dung tích ~400-500ml)', 'Tam giác bàng quang Lieutaud', 'Niệu đạo']
      }
    ]
  }
]

export default function AnatomyAtlas({ setCurrentTab }) {
  const [selectedSystem, setSelectedSystem] = useState('skeletal')
  const [selectedOrgan, setSelectedOrgan] = useState(ANATOMY_SYSTEMS[0].organs[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('split') // 'split' | 'fullscreen_3d' | 'guide_only'
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [copiedNotice, setCopiedNotice] = useState(null)
  const iframeRef = useRef(null)

  // Current active system object
  const currentSystemObj = useMemo(() => {
    return ANATOMY_SYSTEMS.find(s => s.id === selectedSystem) || ANATOMY_SYSTEMS[0]
  }, [selectedSystem])

  // Filtered organs across all systems based on search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null
    const q = searchQuery.toLowerCase().trim()
    const results = []
    ANATOMY_SYSTEMS.forEach(sys => {
      sys.organs.forEach(org => {
        if (
          org.name.toLowerCase().includes(q) ||
          org.latin.toLowerCase().includes(q) ||
          org.english.toLowerCase().includes(q) ||
          org.clinical.toLowerCase().includes(q) ||
          org.keyStructures.some(k => k.toLowerCase().includes(q))
        ) {
          results.push({ ...org, systemName: sys.name, systemId: sys.id, systemColor: sys.color })
        }
      })
    })
    return results
  }, [searchQuery])

  // Add anatomical structure directly into study flashcards (local storage)
  const handleAddToFlashcard = (organ) => {
    try {
      const saved = localStorage.getItem('studymedia_flashcards')
      const cards = saved ? JSON.parse(saved) : []
      const newCard = {
        id: Date.now(),
        deck_name: 'Giải Phẫu Y Khoa',
        front: `${organ.name} (${organ.english})`,
        back: `Thuật ngữ Latin: ${organ.latin}\nVị trí: ${organ.location}\nÝ nghĩa lâm sàng: ${organ.clinical}\nCấu trúc chính: ${organ.keyStructures.join(', ')}`,
        created_at: new Date().toISOString()
      }
      localStorage.setItem('studymedia_flashcards', JSON.stringify([newCard, ...cards]))
      setCopiedNotice('Đã thêm vào bộ Thẻ Flashcard Y Khoa!')
      setTimeout(() => setCopiedNotice(null), 3000)
    } catch (e) {
      console.warn(e)
    }
  }

  // Add structure into study notes / deadline
  const handleAddToNotes = (organ) => {
    try {
      const saved = localStorage.getItem('studymedia_notes')
      const notes = saved ? JSON.parse(saved) : []
      const newNote = {
        id: Date.now(),
        title: `Ôn tập: ${organ.name} (${organ.latin})`,
        content: `Môn: Giải Phẫu Học Y Khoa\nCấu trúc: ${organ.keyStructures.join(' - ')}\nLâm sàng cần nhớ: ${organ.clinical}`,
        subject_id: null,
        subject_name: 'Giải Phẫu Học',
        subject_code: 'ANAT101',
        remind_at: null,
        deadline: null,
        priority: 'high',
        tag: 'Thi cử',
        is_completed: 0,
        created_at: new Date().toISOString()
      }
      localStorage.setItem('studymedia_notes', JSON.stringify([newNote, ...notes]))
      setCopiedNotice('Đã thêm ghi chú ôn tập giải phẫu!')
      setTimeout(() => setCopiedNotice(null), 3000)
    } catch (e) {
      console.warn(e)
    }
  }

  const reloadIframe = () => {
    setIframeLoaded(false)
    if (iframeRef.current) {
      iframeRef.current.src = 'https://svitylo.com/3d-anatomy-atlas'
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Atlas Giải Phẫu Học 3D • Y Khoa
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold font-mono">
                Svitylo 3D WebGL
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Mô hình 3D người tương tác thời gian thực với hơn 4.400 cấu trúc • Tra cứu song ngữ Anh - Việt - Latinh
            </p>
          </div>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'split'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Song song (3D + Tra cứu)
            </button>
            <button
              onClick={() => setViewMode('fullscreen_3d')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'fullscreen_3d'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Toàn cảnh 3D</span>
            </button>
            <button
              onClick={() => setViewMode('guide_only')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'guide_only'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cẩm nang giải phẫu
            </button>
          </div>

          <a
            href="https://svitylo.com/3d-anatomy-atlas"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
            title="Mở toàn màn hình tab độc lập"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tab mới</span>
          </a>
        </div>
      </div>

      {/* Copied notification alert */}
      {copiedNotice && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>{copiedNotice}</span>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        {/* 3D WebGL Model Viewport */}
        {viewMode !== 'guide_only' && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-7 xl:col-span-7' : 'w-full'}`}>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col h-[650px] lg:h-[780px]">
              {/* 3D Viewer Toolbar */}
              <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between z-10 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-xs font-semibold text-white">
                    3D Anatomy Canvas (WebGL2)
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    • Chuột trái: Xoay | Chuột phải/2 ngón: Di chuyển | Cuộn: Phóng to
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={reloadIframe}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    title="Nạp lại mô hình 3D"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode(viewMode === 'fullscreen_3d' ? 'split' : 'fullscreen_3d')}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    title={viewMode === 'fullscreen_3d' ? 'Thu nhỏ' : 'Mở rộng'}
                  >
                    {viewMode === 'fullscreen_3d' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Iframe Loading Overlay */}
              {!iframeLoaded && (
                <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-slate-950 text-center p-6">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 animate-bounce">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white text-base mb-1">Đang khởi tạo mô hình 3D Atlas...</h3>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    Tải dữ liệu hình học 3D (3 triệu đa giác, nén meshopt). Lần đầu tải mất vài giây tùy tốc độ mạng.
                  </p>
                </div>
              )}

              {/* Responsive Embedded Iframe */}
              <iframe
                ref={iframeRef}
                src="https://svitylo.com/3d-anatomy-atlas"
                onLoad={() => setIframeLoaded(true)}
                title="Svitylo 3D Anatomy Atlas"
                className="w-full h-full flex-1 border-0 bg-slate-950"
                allow="accelerometer; camera; gyroscope; web-share; fullscreen"
                loading="eager"
              />
            </div>
          </div>
        )}

        {/* Vietnamese Medical Handbook & Search Panel */}
        {viewMode !== 'fullscreen_3d' && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-5 xl:col-span-5' : 'w-full max-w-5xl mx-auto'}`}>
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-5 flex flex-col h-[650px] lg:h-[780px]">
              {/* Search Bar */}
              <div>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tra cứu: Tim, Xương đùi, Femur, Não, Dây VII..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* System Category Tabs (if not searching) */}
              {!searchQuery && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {ANATOMY_SYSTEMS.map(sys => {
                    const isSelected = selectedSystem === sys.id
                    return (
                      <button
                        key={sys.id}
                        onClick={() => {
                          setSelectedSystem(sys.id)
                          setSelectedOrgan(sys.organs[0])
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: sys.color }}
                        ></span>
                        <span>{sys.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Organ List / Search Results */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {searchQuery ? (
                  // Search Results
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Kết quả tìm kiếm ({searchResults?.length || 0})
                    </div>
                    {searchResults && searchResults.length > 0 ? (
                      searchResults.map((org, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedOrgan(org)}
                          className="p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 cursor-pointer transition-all hover:scale-[1.01]"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-700 text-rose-300">
                              {org.systemName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono italic">
                              {org.latin}
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-sm">{org.name}</h4>
                          <p className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                            {org.clinical}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-slate-500 text-xs">
                        Không tìm thấy cấu trúc giải phẫu nào khớp với từ khóa "{searchQuery}".
                      </div>
                    )}
                  </div>
                ) : (
                  // Detailed Inspector for Selected System
                  <div className="space-y-4">
                    {/* System Summary Banner */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-800/40 border border-slate-700/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{currentSystemObj.name}</span>
                        <span className="text-[11px] text-rose-400 font-mono italic">{currentSystemObj.latin}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {currentSystemObj.description}
                      </p>
                    </div>

                    {/* Organs Selection Cards */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Các Cơ Quan Trọng Điểm ({currentSystemObj.organs.length})
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {currentSystemObj.organs.map((org, i) => {
                          const isCur = selectedOrgan?.name === org.name
                          return (
                            <button
                              key={i}
                              onClick={() => setSelectedOrgan(org)}
                              className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                                isCur
                                  ? 'bg-rose-950/40 border-rose-500/40 text-white shadow-sm'
                                  : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-300'
                              }`}
                            >
                              <div>
                                <div className="font-bold text-xs text-white flex items-center gap-1.5">
                                  <span>{org.name}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono italic mt-0.5">
                                  {org.latin} • {org.english}
                                </div>
                              </div>
                              <ChevronRight className={`w-4 h-4 transition-transform ${isCur ? 'text-rose-400 translate-x-1' : 'text-slate-500'}`} />
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Deep Clinical Detail of Selected Organ */}
                    {selectedOrgan && (
                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                        <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                          <div>
                            <h3 className="font-extrabold text-base text-rose-300">
                              {selectedOrgan.name}
                            </h3>
                            <div className="text-xs text-slate-400 font-mono">
                              <b>Latin:</b> {selectedOrgan.latin} | <b>English:</b> {selectedOrgan.english}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              <b>Vị trí:</b> {selectedOrgan.location}
                            </div>
                          </div>
                        </div>

                        {/* Clinical notes */}
                        <div>
                          <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>Ý Nghĩa Lâm Sàng & Bệnh Học (Clinical Relevance):</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                            {selectedOrgan.clinical}
                          </p>
                        </div>

                        {/* Key structures */}
                        <div>
                          <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5 mb-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            <span>Các Cấu Trúc Giải Phẫu Chính Cần Thuộc:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedOrgan.keyStructures.map((item, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300 font-medium"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Quick action buttons for medical students */}
                        <div className="pt-2 flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleAddToFlashcard(selectedOrgan)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold border border-purple-500/30 transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Tạo Thẻ Flashcard</span>
                          </button>
                          <button
                            onClick={() => handleAddToNotes(selectedOrgan)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Lưu vào Sổ Ghi Chú</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
