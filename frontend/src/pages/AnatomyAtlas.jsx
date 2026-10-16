import React, { useState, useMemo, useRef, useEffect } from 'react'
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
  Eye,
  Bone
} from 'lucide-react'

// Bộ Cơ Sở Dữ Liệu Giải Phẫu Y Khoa Toàn Diện (Bilingual VN - Latin - EN)
// Chuẩn hóa theo 9 Hệ Cơ Quan trong Atlas 3D
export const ANATOMY_SYSTEMS = [
  {
    id: 'regions',
    name: 'Các Vùng Cơ Thể Người',
    latin: 'Partes corporis humani',
    english: 'Regions of human body',
    icon: 'Compass',
    color: '#38bdf8',
    count: '8 vùng',
    description: 'Phân chia cơ thể người theo các vùng không gian giải phẫu định khu phục vụ thăm khám lâm sàng và phẫu thuật.',
    organs: [
      {
        name: 'Vùng Đầu & Cổ',
        latin: 'Caput et Collum',
        english: 'Head and Neck',
        location: 'Phần trên cùng cơ thể',
        clinical: 'Chứa não bộ, các giác quan (mắt, tai, mũi, miệng) và các bó mạch cảnh, dây thần kinh sọ. Tam giác cổ là mốc quan trọng trong phẫu thuật tuyến giáp và mở khí quản.',
        keyStructures: ['Vòm sọ (Calvaria)', 'Hốc mắt (Orbita)', 'Ổ miệng & Hầu', 'Tam giác cảnh (Carotid triangle)', 'Hố trên đòn']
      },
      {
        name: 'Lồng Ngực & Trung Thất',
        latin: 'Thorax & Mediastinum',
        english: 'Thoracic Cage & Mediastinum',
        location: 'Giữa cổ và cơ hoành',
        clinical: 'Bao bọc tim, phổi, thực quản và khí quản. Trung thất trước, giữa, sau là vị trí thường gặp của u tuyến ức, u hạch hoặc phình động mạch chủ ngực.',
        keyStructures: ['Thành ngực trước (Xương ức & Sụn sườn)', 'Khoang màng phổi (Cavitas pleuralis)', 'Trung thất giữa (Chứa tim)', 'Trung thất sau (Thực quản, ĐMC ngực)']
      },
      {
        name: 'Vùng Bụng & 9 Phân Khu',
        latin: 'Abdomen (Regiones abdominales)',
        english: 'Abdomen & 9 Regions',
        location: 'Giữa cơ hoành và đường liên gai chậu trước trên',
        clinical: 'Phân chia 9 vùng: Thượng vị (dạ dày, tụy), Hạ sườn phải (gan, mật), Hố chậu phải (ruột thừa, manh tràng). Giúp định vị cơ quan đau cấp cứu bụng ngoại khoa.',
        keyStructures: ['Vùng thượng vị (Epigastrium)', 'Hạ sườn phải & trái (Hypochondrium)', 'Vùng quanh rốn (Umbilical)', 'Hố chậu phải (Điểm McBurney ruột thừa)']
      },
      {
        name: 'Vùng Chậu Hông & Đáy Chậu',
        latin: 'Pelvis & Perineum',
        english: 'Pelvis & Perineum',
        location: 'Dưới hốc bụng, giới hạn bởi khung chậu',
        clinical: 'Chứa bàng quang, trực tràng, cơ quan sinh dục trong. Đáy chậu có hoành niệu dục và hoành chậu hông, dễ tổn thương rách khi sinh đẻ.',
        keyStructures: ['Chậu hông bé (True pelvis)', 'Hoành chậu hông (Cơ nâng hậu môn)', 'Tam giác niệu dục', 'Trực tràng & Bàng quang']
      },
      {
        name: 'Vùng Lưng & Cột Sống',
        latin: 'Dorsum & Columna vertebralis',
        english: 'Back & Vertebral Region',
        location: 'Mặt sau thân mình',
        clinical: 'Bảo vệ tủy sống. Rãnh sống hai bên chứa cơ dựng sống. Tam giác thắt lưng Petit là điểm yếu thành bụng sau có thể xảy ra thoát vị.',
        keyStructures: ['Đường giữa gai sống', 'Vùng bả vai (Regio scapularis)', 'Tam giác thắt lưng (Lumbar triangle)', 'Vùng cùng cụt']
      },
      {
        name: 'Chi Trên (Nách, Cánh tay, Bàn tay)',
        latin: 'Membrum superius',
        english: 'Upper Limb',
        location: 'Khớp vai đến các đầu ngón tay',
        clinical: 'Hõm nách chứa đám rối thần kinh cánh tay và bó mạch nách. Hõm lào giải phẫu vùng cổ tay liên quan gãy xương thuyền. Hội chứng ống cổ tay chèn ép thần kinh giữa.',
        keyStructures: ['Hố nách (Axilla)', 'Rãnh nhị đầu trong và ngoài', 'Hố khuỷu (Cubital fossa)', 'Ống cổ tay (Carpal tunnel)', 'Gan tay & Mu tay']
      },
      {
        name: 'Chi Dưới (Mông, Đùi, Bàn chân)',
        latin: 'Membrum inferius',
        english: 'Lower Limb',
        location: 'Khớp háng đến các ngón chân',
        clinical: 'Tam giác đùi Scarpa chứa động mạch, tĩnh mạch và thần kinh đùi (vị trí chọc dò mạch máu can thiệp tim mạch). Hố khoeo sau gối chứa bó mạch khoeo.',
        keyStructures: ['Vùng mông (Regio glutealis - vị trí tiêm bắp an toàn 1/4 trên ngoài)', 'Tam giác đùi (Femoral triangle)', 'Hố khoeo (Popliteal fossa)', 'Mắt cá trong & Mắt cá ngoài']
      }
    ]
  },
  {
    id: 'muscular',
    name: 'Hệ Cơ Bắp',
    latin: 'Systema musculare',
    english: 'Muscular system',
    icon: 'Activity',
    color: '#ef4444',
    count: '600+ cơ',
    description: 'Hơn 600 cơ vân tạo lực vận động, duy trì tư thế, sinh nhiệt và hỗ trợ tuần hoàn tĩnh mạch trở về tim.',
    organs: [
      {
        name: 'Cơ Vùng Đầu & Mặt (Cơ Biểu Cảm & Cơ Nhai)',
        latin: 'Musculi capitis & faciei',
        english: 'Facial & Masticatory Muscles',
        location: 'Vùng đầu mặt',
        clinical: 'Cơ bám da mặt do Dây TK VII chi phối (liệt mặt ngoại biên Bell gây méo miệng, mắt nhắm không kín). Cơ cắn và cơ thái dương do Dây TK V3 chi phối tạo lực nghiền nhai thức ăn.',
        keyStructures: ['Cơ cắn (Masseter - cơ khỏe nhất theo tỷ lệ)', 'Cơ thái dương (Temporalis)', 'Cơ vòng mắt (Orbicularis oculi)', 'Cơ vòng miệng (Orbicularis oris)', 'Cơ mút (Buccinator)']
      },
      {
        name: 'Cơ Vùng Cổ (Cơ Ức Đòn Chũm & Dưới Móng)',
        latin: 'Musculi colli',
        english: 'Neck Muscles',
        location: 'Vùng cổ trước và bên',
        clinical: 'Cơ ức đòn chũm (SCM) co một bên làm nghiêng đầu về cùng bên và quay mặt sang đối diện (tật vẹo cổ bẩm sinh Torticollis). Chia cổ thành tam giác cổ trước và sau.',
        keyStructures: ['Cơ ức đòn chũm (Sternocleidomastoid)', 'Cơ bậc thang trước, giữa, sau (Scalene)', 'Cơ vai móng & ức móng', 'Cơ bám da cổ (Platysma)']
      },
      {
        name: 'Cơ Lồng Ngực & Cơ Hoành Hô Hấp',
        latin: 'Musculi thoracis & Diaphragma',
        english: 'Thoracic Muscles & Diaphragm',
        location: 'Lồng ngực và ngăn cách ngực - bụng',
        clinical: 'Cơ hoành là cơ hô hấp chính, do dây thần kinh hoành (C3-C5) chi phối. Thoát vị hoành làm các tạng bụng chui lên lồng ngực ép tim phổi. Cơ ngực lớn tạo hình thành ngực trước.',
        keyStructures: ['Cơ hoành (Diaphragm - 3 lỗ: ĐMC, Tĩnh mạch chủ, Thực quản)', 'Cơ ngực lớn (Pectoralis major)', 'Cơ ngực bé', 'Cơ liên sườn ngoài & trong (Hít vào & thở ra gắng sức)']
      },
      {
        name: 'Cơ Thành Bụng (Cơ Thẳng & Cơ Chéo)',
        latin: 'Musculi abdominis',
        english: 'Abdominal Wall Muscles',
        location: 'Mặt trước và hai bên ổ bụng',
        clinical: 'Tạo áp lực ổ bụng khi thở ra, rặn đẻ, đại tiện. Đường trắng giữa (Linea alba) là đường mổ bụng kinh điển ít chảy máu. Ống bẹn là nơi xảy ra thoát vị bẹn thường gặp.',
        keyStructures: ['Cơ thẳng bụng (Rectus abdominis - 6 múi)', 'Cơ chéo bụng ngoài & trong', 'Cơ ngang bụng (Transversus abdominis)', 'Ống bẹn (Inguinal canal)']
      },
      {
        name: 'Cơ Vùng Lưng & Gáy',
        latin: 'Musculi dorsi',
        english: 'Back Muscles',
        location: 'Mặt sau thân mình',
        clinical: 'Cơ thang nâng vai và ngửa đầu. Cơ lưng rộng kéo cánh tay ra sau. Khối cơ dựng sống giữ cột sống thẳng đứng, dễ bị co cứng gây đau thắt lưng cơ năng.',
        keyStructures: ['Cơ thang (Trapezius)', 'Cơ lưng rộng (Latissimus dorsi)', 'Cơ dựng sống (Erector spinae)', 'Cơ trám lớn & bé']
      },
      {
        name: 'Cơ Chi Trên (Cơ Delta & Cơ Cánh Tay)',
        latin: 'Musculi membri superioris',
        english: 'Upper Limb Muscles',
        location: 'Vai, cánh tay, cẳng tay và bàn tay',
        clinical: 'Cơ delta là nơi tiêm bắp an toàn phổ biến. Cơ nhị đầu cánh tay gấp cẳng tay (dây TK cơ bì). Cơ tam đầu duỗi cẳng tay (dây TK quay). Rách chóp xoay vai gây hạn chế giang tay.',
        keyStructures: ['Cơ delta (Deltoid)', 'Cơ nhị đầu cánh tay (Biceps brachii)', 'Cơ tam đầu cánh tay (Triceps brachii)', 'Chóp xoay (Rotator cuff: Trên gai, dưới gai, tròn bé, dưới vai)']
      },
      {
        name: 'Cơ Chi Dưới (Cơ Mông & Đùi)',
        latin: 'Musculi membri inferioris',
        english: 'Lower Limb Muscles',
        location: 'Khung chậu, đùi, cẳng chân',
        clinical: 'Cơ mông lớn giúp duỗi háng khi leo cầu thang. Cơ tứ đầu đùi duỗi gối (phản xạ gân bánh chè L3-L4). Gân gót Achilles là gân to nhất cơ thể, dễ đứt khi vận động mạnh đột ngột.',
        keyStructures: ['Cơ mông lớn (Gluteus maximus)', 'Cơ tứ đầu đùi (Quadriceps femoris)', 'Cơ may (Sartorius - cơ dài nhất cơ thể)', 'Cơ tam đầu cẳng chân & Gân Achilles']
      }
    ]
  },
  {
    id: 'skeletal',
    name: 'Hệ Xương',
    latin: 'Systema skeletale',
    english: 'Skeletal system',
    icon: 'Bone',
    color: '#f59e0b',
    count: '206 xương',
    description: 'Bộ khung nâng đỡ cơ thể gồm 206 xương, bảo vệ các tạng trọng yếu và là kho dự trữ canxi của cơ thể.',
    organs: [
      {
        name: 'Hộp Sọ & Khối Xương Mặt',
        latin: 'Cranium & Ossa faciei',
        english: 'Skull & Facial Bones',
        location: 'Vùng đầu',
        clinical: 'Bảo vệ não bộ và các giác quan. Chấn thương sọ não (TBI) cần lưu ý điểm yếu Pterion (nơi có động mạch màng não giữa đi qua gây máu tụ ngoài màng cứng).',
        keyStructures: ['Xương trán (Frontal bone)', 'Xương đỉnh (Parietal bone)', 'Xương thái dương (Temporal bone)', 'Xương chẩm (Occipital bone)', 'Xương bướm (Sphenoid)', 'Xương hàm dưới (Mandible)']
      },
      {
        name: 'Cột Sống (33-34 đốt sống)',
        latin: 'Columna vertebralis',
        english: 'Vertebral Column',
        location: 'Trục giữa lưng',
        clinical: 'Chứa tủy sống. Gồm 7 đốt sống cổ (C1 Atlas, C2 Axis), 12 đốt ngực (T1-T12), 5 đốt thắt lưng (L1-L5), 5 đốt cùng (S1-S5) và xương cụt. Thoát vị đĩa đệm hay gặp nhất ở L4-L5 và L5-S1 chèn ép dây TK tọa.',
        keyStructures: ['Đốt đội C1 (Atlas)', 'Đốt trục C2 (Axis)', 'Đốt sống thắt lưng L1-L5', 'Xương cùng (Sacrum)', 'Đĩa đệm gian đốt sống (Intervertebral disc)']
      },
      {
        name: 'Lồng Ngực & Xương Sườn',
        latin: 'Thorax & Costae',
        english: 'Thoracic Cage & Ribs',
        location: 'Vùng ngực',
        clinical: 'Gồm xương ức và 12 đôi xương sườn (7 sườn thật, 3 sườn giả, 2 sườn cụt lơ lửng). Góc ức Louis là mốc đếm khoang liên sườn 2 khi nghe tim và chọc dò tràn khí màng phổi.',
        keyStructures: ['Cán xương ức (Manubrium)', 'Góc ức Louis (Sternal angle)', 'Thân xương ức (Body of sternum)', 'Mũi kiếm (Xiphoid process)', '12 đôi xương sườn']
      },
      {
        name: 'Đai Vai & Xương Chi Trên',
        latin: 'Cingulum pectorale & Membrum superius',
        english: 'Pectoral Girdle & Upper Limb Bones',
        location: 'Vai, cánh tay, cẳng tay và bàn tay',
        clinical: 'Xương đòn là xương hay bị gãy nhất trong chấn thương té ngã chống tay. Khớp vai dễ trật ra trước. Đầu dưới xương quay gãy Pouteau-Colles tạo hình dạng "cái thìa bạt".',
        keyStructures: ['Xương đòn (Clavicle)', 'Xương bả vai (Scapula)', 'Xương cánh tay (Humerus)', 'Xương quay (Radius)', 'Xương trụ (Ulna)', '8 xương cổ tay']
      },
      {
        name: 'Đai Chậu & Xương Chi Dưới',
        latin: 'Pelvis & Membrum inferius',
        english: 'Pelvic Girdle & Lower Limb Bones',
        location: 'Khung chậu và chân',
        clinical: 'Xương đùi là xương dài và chịu lực lớn nhất cơ thể. Gãy cổ xương đùi ở người cao tuổi loãng xương dễ hoại tử chỏm xương đùi do đứt nhánh mạch mũ.',
        keyStructures: ['Xương chậu (Xương cánh chậu, mu, ngồi)', 'Xương đùi (Femur & Cổ xương đùi)', 'Xương bánh chè (Patella)', 'Xương chày (Tibia)', 'Xương mác (Fibula)', 'Xương gót & sên']
      }
    ]
  },
  {
    id: 'joints',
    name: 'Khớp & Dây Chằng',
    latin: 'Systema articulare',
    english: 'Joints',
    icon: 'Layers',
    color: '#14b8a6',
    count: '3 loại khớp',
    description: 'Hệ thống liên kết xương gồm khớp hoạt dịch (cử động linh hoạt), khớp sụn (bán động) và khớp sợi (bất động).',
    organs: [
      {
        name: 'Khớp Hoạt Dịch Biên Độ Rộng (Khớp Vai & Khớp Háng)',
        latin: 'Articulatio humeri & coxae',
        english: 'Shoulder & Hip Ball-and-Socket Joints',
        location: 'Đai vai và khung chậu',
        clinical: 'Khớp vai có ổ chảo nông nên dễ trật khớp nhất. Khớp háng là khớp chịu tải lớn nhất cơ thể, có sụn viền ổ cối và dây chằng chỏm đùi.',
        keyStructures: ['Ổ chảo xương bả vai (Glenoid cavity)', 'Sụn viền ổ chảo', 'Ổ cối xương chậu (Acetabulum)', 'Dây chằng chỏm xương đùi']
      },
      {
        name: 'Khớp Phức Hợp (Khớp Gối & Khớp Cổ Chân)',
        latin: 'Articulatio genus & talocruralis',
        english: 'Knee & Ankle Complex Joints',
        location: 'Giữa đùi và cẳng chân, cẳng chân và bàn chân',
        clinical: 'Dây chằng chéo trước (ACL) ngăn mâm chày trượt ra trước (dấu hiệu ngăn kéo trước dương tính khi đứt ACL). Sụn chêm trong hình chữ C dễ rách hơn sụn chêm ngoài hình chữ O.',
        keyStructures: ['Dây chằng chéo trước (ACL)', 'Dây chằng chéo sau (PCL)', 'Sụn chêm trong & ngoài (Meniscus)', 'Dây chằng bên chày & bên mác (MCL & LCL)']
      },
      {
        name: 'Khớp Bản Lề & Khớp Trục (Khớp Khuỷu & Cột Sống)',
        latin: 'Articulatio cubiti & articulatio atlantoaxialis',
        english: 'Elbow Hinge Joint & Atlantoaxial Pivot Joint',
        location: 'Khuỷu tay và khớp đội trục cổ',
        clinical: 'Khớp C1-C2 (Atlas-Axis) giúp đầu quay trái phải quanh mỏm nha. Trật khớp C1-C2 chèn ép hành não đe dọa ngừng thở ngay lập tức.',
        keyStructures: ['Mỏm nha xương trục (Dens of Axis)', 'Dây chằng ngang đốt đội', 'Khớp cánh tay - trụ (Gấp duỗi khuỷu)', 'Khớp quay - trụ gần (Sấp ngửa)']
      }
    ]
  },
  {
    id: 'cardiovascular',
    name: 'Hệ Tim Mạch & Tuần Hoàn',
    latin: 'Systema cardiovasculare',
    english: 'Cardiovascular system',
    icon: 'HeartPulse',
    color: '#e11d48',
    count: 'Tim & Mạch máu',
    description: 'Bơm tim và mạng lưới động mạch, tĩnh mạch vận chuyển oxy, dưỡng chất và hormone đi nuôi toàn cơ thể.',
    organs: [
      {
        name: 'Quả Tim (4 Buồng & 4 Bộ Van)',
        latin: 'Cor (Atria & Ventriculi)',
        english: 'Heart & Cardiac Valves',
        location: 'Trung thất giữa lồng ngực, lệch sang trái',
        clinical: 'Tâm thất trái thành dày nhất (12-15mm) để bơm máu nuôi toàn thân. Hẹp hở van 2 lá hoặc van động mạch chủ gây suy tim. Nhồi máu cơ tim cấp do tắc nhánh ĐM vành LAD.',
        keyStructures: ['Tâm thất trái (Left ventricle)', 'Tâm nhĩ phải & trái', 'Van 2 lá (Mitral valve)', 'Van 3 lá (Tricuspid)', 'Động mạch vành trái & phải']
      },
      {
        name: 'Cung Động Mạch Chủ & Nhánh Nuôi Não',
        latin: 'Arcus aortae & Arteriae carotides',
        english: 'Aortic Arch & Carotid Arteries',
        location: 'Xuất phát từ tâm thất trái uốn cong lên nền cổ',
        clinical: '3 nhánh chính: Thân tay đầu, ĐM cảnh chung trái, ĐM dưới đòn trái. Phình tách thành động mạch chủ (Aortic dissection) là cấp cứu tử vong rất cao.',
        keyStructures: ['Động mạch chủ lên (Ascending aorta)', 'Cung động mạch chủ', 'Động mạch cảnh chung (Carotid)', 'Động mạch dưới đòn']
      },
      {
        name: 'Hệ Tĩnh Mạch Chủ & Tĩnh Mạch Cửa Gan',
        latin: 'Vena cava & Vena portae hepatis',
        english: 'Vena Cava & Portal Vein System',
        location: 'Dọc ổ bụng và ngực đổ về tâm nhĩ phải',
        clinical: 'Tĩnh mạch cửa gom máu từ toàn bộ ruột non, dạ dày về gan khử độc. Xơ gan làm tăng áp lực tĩnh mạch cửa gây giãn vỡ tĩnh mạch thực quản xuất huyết tiêu hóa ồ ạt.',
        keyStructures: ['Tĩnh mạch chủ trên (SVC)', 'Tĩnh mạch chủ dưới (IVC)', 'Tĩnh mạch cửa gan (Portal vein)', 'Vòng nối gánh - chủ quanh thực quản và rốn']
      }
    ]
  },
  {
    id: 'visceral',
    name: 'Hệ Nội Tạng',
    latin: 'Systemata visceralia',
    english: 'Visceral systems',
    icon: 'Activity',
    color: '#10b981',
    count: 'Hô hấp, Tiêu hóa, Tiết niệu',
    description: 'Các cơ quan tạng đảm nhận các chức năng sống: trao đổi khí (hô hấp), chuyển hóa dinh dưỡng (tiêu hóa), bài tiết và lọc máu (tiết niệu).',
    organs: [
      {
        name: 'Hệ Hô Hấp: Hai Lá Phổi & Khí Quản',
        latin: 'Pulmones & Trachea',
        english: 'Lungs & Tracheobronchial Tree',
        location: 'Khoang lồng ngực hai bên trung thất',
        clinical: 'Phổi phải có 3 thùy, phổi trái có 2 thùy và có khuyết tim. Dị vật đường thở thường rơi vào phế quản chính bên phải vì to hơn, dốc hơn và thẳng góc hơn.',
        keyStructures: ['Phổi phải (Thùy trên, giữa, dưới)', 'Phổi trái (Thùy trên, dưới)', 'Khí quản (Trachea - 16-20 vòng sụn)', 'Phế quản chính phải & trái', 'Cựa phế quản (Carina)']
      },
      {
        name: 'Hệ Tiêu Hóa: Dạ Dày, Gan & Mật',
        latin: 'Gaster, Hepar & Vesica biliaris',
        english: 'Stomach, Liver & Gallbladder',
        location: 'Tầng trên mạc treo đại tràng ngang',
        clinical: 'Gan chia 8 phân thùy theo Couinaud dựa trên phân nhánh tĩnh mạch cửa. Điểm túi mật Murphy đau khi viêm túi mật cấp. Loét dạ dày hay gặp ở bờ cong nhỏ do Helicobacter pylori.',
        keyStructures: ['Dạ dày (Tâm vị, đáy vị, thân vị, môn vị)', 'Gan (8 hạ phân thùy Couinaud)', 'Túi mật & Ống mật chủ', 'Tụy (Đầu, thân, đuôi tụy)']
      },
      {
        name: 'Hệ Tiêu Hóa: Ruột Non, Ruột Già & Ruột Thừa',
        latin: 'Intestinum tenue & Intestinum crassum',
        english: 'Small & Large Intestine, Appendix',
        location: 'Toàn bộ khoang bụng dưới gan và dạ dày',
        clinical: 'Ruột non dài 6m là nơi hấp thu dưỡng chất chủ yếu. Ruột thừa xuất phát từ đáy manh tràng, viêm ruột thừa cấp gây đau hố chậu phải (điểm McBurney) cần mổ sớm.',
        keyStructures: ['Tá tràng (Duodenum - Khung tá tụy)', 'Hỗng tràng & Hồi tràng', 'Manh tràng & Ruột thừa (Appendix)', 'Đại tràng lên, ngang, xuống, sigma', 'Trực tràng & Hậu môn']
      },
      {
        name: 'Hệ Tiết Niệu: Thận & Bàng Quang',
        latin: 'Renes & Vesica urinaria',
        english: 'Kidneys, Ureters & Bladder',
        location: 'Sau phúc mạc hai bên cột sống thắt lưng',
        clinical: 'Mỗi thận chứa 1 triệu Nephron lọc 180 lít huyết tương/ngày. Niệu quản có 3 chỗ hẹp sinh lý (nối bể thận, vắt qua bó mạch chậu, cắm bàng quang) là nơi sỏi dễ kẹt nhất.',
        keyStructures: ['Vỏ thận & Tủy thận', 'Bể thận (Renal pelvis)', 'Niệu quản (3 chỗ hẹp)', 'Bàng quang (Tam giác bàng quang Lieutaud)', 'Niệu đạo']
      }
    ]
  },
  {
    id: 'nervous',
    name: 'Hệ Thần Kinh & Giác Quan',
    latin: 'Systema nervosum & Organa sensuum',
    english: 'Nervous system & Sense organs',
    icon: 'Brain',
    color: '#8b5cf6',
    count: 'TKTW & 12 Đôi Dây Sọ',
    description: 'Hệ thống điều khiển tối cao, xử lý nhận thức, phản xạ, vận động và tiếp nhận kích thích môi trường thông qua ngũ quan.',
    organs: [
      {
        name: 'Đại Não & Vỏ Não 4 Thùy',
        latin: 'Cerebrum (Cortex cerebri)',
        english: 'Cerebrum & Cerebral Cortex',
        location: 'Hộp sọ tầng trên',
        clinical: 'Thùy trán (vận động, tính cách), Thùy đỉnh (cảm giác soma), Thùy thái dương (trí nhớ, thính giác), Thùy chẩm (vỏ não thị giác). Vùng Broca điều khiển phát âm, vùng Wernicke hiểu ngôn ngữ.',
        keyStructures: ['Thùy trán (Frontal lobe)', 'Thùy đỉnh (Parietal lobe)', 'Thùy thái dương (Temporal lobe)', 'Thùy chẩm (Occipital lobe)', 'Thể chai (Corpus callosum)']
      },
      {
        name: 'Tiểu Não & Thân Não (Trung Tâm Sinh Mệnh)',
        latin: 'Cerebellum & Truncus encephali',
        english: 'Cerebellum & Brainstem',
        location: 'Hố sọ sau',
        clinical: 'Tiểu não phối hợp thăng bằng. Thân não gồm Cuống não, Cầu não, Hành não. Hành não chứa trung tâm hô hấp và vận mạch, tổn thương tụt kẹt hành não gây ngừng thở tử vong ngay.',
        keyStructures: ['Tiểu não (Bán cầu tiểu não & Thùy nhộng Vermis)', 'Cuống não (Midbrain)', 'Cầu não (Pons)', 'Hành não (Medulla oblongata)', 'Não thất IV']
      },
      {
        name: '12 Đôi Dây Thần Kinh Sọ (I - XII)',
        latin: 'Nervi craniales I - XII',
        english: '12 Cranial Nerves',
        location: 'Xuất phát từ não chui qua các lỗ nền sọ',
        clinical: 'Dây III (Vận nhãn - liệt gây sụp mi, giãn đồng tử). Dây VII (Thần kinh mặt - liệt mặt). Dây X (Dây lang thang - chi phối phó giao cảm tim, phổi, tiêu hóa).',
        keyStructures: ['Dây I (Khứu giác) & II (Thị giác)', 'Dây III, IV, VI (Vận động cơ nhãn cầu)', 'Dây V (Tam thoa - cảm giác mặt & cơ nhai)', 'Dây VII (Mặt)', 'Dây X (Lang thang Vagus)']
      },
      {
        name: 'Cơ Quan Thị Giác & Thính Giác',
        latin: 'Organum visus & Organum auditus',
        english: 'Eye & Ear Sense Organs',
        location: 'Hốc mắt và xương thái dương',
        clinical: 'Võng mạc chuyển đổi ánh sáng thành tín hiệu thần kinh truyền qua dây II. Ốc tai và tiền đình phụ trách nghe và giữ thăng bằng cơ thể.',
        keyStructures: ['Nhãn cầu (Giác mạc, Thể thủy tinh, Võng mạc)', 'Thần kinh thị giác (Dây II)', 'Màng nhĩ & Chuỗi xương con (Búa, đe, bàn đạp)', 'Ốc tai & Các ống bán khuyên']
      }
    ]
  },
  {
    id: 'lymphoid',
    name: 'Cơ Quan Bạch Huyết & Miễn Dịch',
    latin: 'Organa lymphoidea',
    english: 'Lymphoid organs',
    icon: 'Sparkles',
    color: '#06b6d4',
    count: 'Lách, Tuyến ức, Hạch',
    description: 'Hệ thống phòng vệ cơ thể chống nhiễm trùng, lọc tế bào lạ và hồi lưu dịch kẽ mô về tuần hoàn chung.',
    organs: [
      {
        name: 'Quả Lách (Lách / Tỳ)',
        latin: 'Lien / Splen',
        english: 'Spleen',
        location: 'Hạ sườn trái, nấp sau xương sườn 9-11',
        clinical: 'Tạng miễn dịch lớn nhất, lọc máu và tiêu hủy hồng cầu già kiệt. Chấn thương ngực bụng kín vỡ lách gây xuất huyết nội ồ ạt nguy kịch.',
        keyStructures: ['Tủy đỏ (Lọc máu, giữ hồng cầu)', 'Tủy trắng (Chứa tế bào lympho T và B)', 'Động mạch lách (Đi ngoằn ngoèo trên bờ trên tụy)', 'Rốn lách']
      },
      {
        name: 'Tuyến Ức & Ống Ngực Bạch Huyết',
        latin: 'Thymus & Ductus thoracicus',
        english: 'Thymus & Thoracic Duct',
        location: 'Trung thất trước trên và dọc cột sống ngực',
        clinical: 'Tuyến ức là nơi biệt hóa lympho T (hoạt động mạnh ở trẻ em, teo mỡ ở người lớn). Ống ngực dẫn 3/4 dịch bạch huyết cơ thể đổ vào góc tĩnh mạch cảnh - dưới đòn trái.',
        keyStructures: ['Tuyến ức (Thymus)', 'Ống ngực (Thoracic duct)', 'Bể dưỡng trấp Pecquet', 'Hạch bạch huyết vùng nách, bẹn, cổ']
      }
    ]
  },
  {
    id: 'attachments',
    name: 'Nguyên Ủy & Bám Tận Cơ',
    latin: 'Origines & Insertiones musculorum',
    english: 'Muscle attachments',
    icon: 'Layers',
    color: '#64748b',
    count: 'Gân & Điểm bám xương',
    description: 'Các vị trí bám giải phẫu của cơ vào khung xương tạo nên hệ thống đòn bẩy cơ sinh học của cơ thể người.',
    organs: [
      {
        name: 'Điểm Bám Cơ Đai Vai & Cánh Tay',
        latin: 'Insertiones cinguli pectoralis',
        english: 'Shoulder & Arm Attachments',
        location: 'Xương đòn, xương bả vai và xương cánh tay',
        clinical: 'Củ lớn và củ bé xương cánh tay là điểm bám của 4 cơ chóp xoay vai. Rách điểm bám gân cơ trên gai là nguyên nhân hàng đầu gây đau vai mạn tính.',
        keyStructures: ['Củ lớn xương cánh tay (Greater tubercle)', 'Củ bé (Lesser tubercle)', 'Mỏm cùng vai & Mỏm quạ', 'Lồi củ delta']
      },
      {
        name: 'Điểm Bám Vùng Khung Chậu & Khớp Háng',
        latin: 'Insertiones pelvis & femoris',
        english: 'Pelvis & Hip Muscle Attachments',
        location: 'Cánh chậu, ụ ngồi và xương đùi',
        clinical: 'Mấu chuyển lớn và mấu chuyển nhỏ xương đùi là mốc giải phẫu cốt tử khi nắn chỉnh gãy xương hoặc phẫu thuật thay khớp háng nhân tạo.',
        keyStructures: ['Mấu chuyển lớn xương đùi (Greater trochanter)', 'Mấu chuyển nhỏ (Lesser trochanter)', 'Gai chậu trước trên (ASIS)', 'Ụ ngồi (Ischial tuberosity)']
      },
      {
        name: 'Gân Gót Achilles & Cân Gan Chân',
        latin: 'Tendo calcaneus & Aponeurosis plantaris',
        english: 'Achilles Tendon & Plantar Fascia',
        location: 'Mặt sau cổ chân và lòng bàn chân',
        clinical: 'Gân gót Achilles bám vào củ xương gót, chịu lực gấp 3-4 lần trọng lượng cơ thể khi chạy nhảy. Viêm cân gan chân gây đau nhói gót chân khi bước bước đầu tiên buổi sáng.',
        keyStructures: ['Gân gót Achilles (Cơ bụng chân + Cơ dép)', 'Củ xương gót (Calcaneus)', 'Cân gan chân (Plantar aponeurosis)', 'Dải chậu chày (Iliotibial band)']
      }
    ]
  }
]

export default function AnatomyAtlas({ setCurrentTab }) {
  const [selectedSystem, setSelectedSystem] = useState('skeletal')
  const [selectedOrgan, setSelectedOrgan] = useState(ANATOMY_SYSTEMS[2].organs[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('split') // 'split' | 'fullscreen_3d' | 'guide_only'
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [copiedNotice, setCopiedNotice] = useState(null)
  const iframeRef = useRef(null)

  // Listen to 3D selections inside the native iframe
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data && e.data.type === 'ANATOMY_SELECT' && e.data.ids && e.data.ids.length > 0) {
        const id = e.data.ids[0]
        // Check if ID matches any system or organ
        for (const sys of ANATOMY_SYSTEMS) {
          if (id.startsWith(sys.id) || id === sys.id) {
            setSelectedSystem(sys.id)
            const organMatch = sys.organs.find(o =>
              id.toLowerCase().includes(o.english.toLowerCase().split(' ')[0]) ||
              o.keyStructures.some(k => id.toLowerCase().includes(k.toLowerCase().split(' ')[0]))
            )
            if (organMatch) {
              setSelectedOrgan(organMatch)
            }
            break
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Current active system object
  const currentSystemObj = useMemo(() => {
    return ANATOMY_SYSTEMS.find(s => s.id === selectedSystem) || ANATOMY_SYSTEMS[2]
  }, [selectedSystem])

  // Filtered organs across all systems based on general search
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

  // Add structure into study notes
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
      iframeRef.current.src = '/atlas/index.html'
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
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                🇻🇳 Tiếng Việt Tích Hợp Sẵn
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Mô hình 3D người tương tác thời gian thực • Tra cứu song ngữ Y Khoa (Việt - Anh - Latinh)
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
            href="/atlas/index.html"
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
                    • Chuột trái: Xoay | Chuột phải: Di chuyển | Cuộn: Thu phóng
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30">
                    Ngôn ngữ: Tiếng Việt 🇻🇳
                  </span>
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
                  <h3 className="font-bold text-white text-base mb-1">Đang khởi tạo mô hình 3D Atlas…</h3>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    Nạp hình học 3D cơ thể người và danh pháp Y khoa tiếng Việt.
                  </p>
                </div>
              )}

              {/* Responsive Embedded Iframe - Self-hosted with Native Vietnamese */}
              <iframe
                ref={iframeRef}
                src="/atlas/index.html"
                onLoad={() => setIframeLoaded(true)}
                title="Atlas Giải Phẫu Học 3D Y Khoa"
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
