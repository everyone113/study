import json
import unicodedata

def build_vietnamese_font(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    c = data['c']
    
    # Map common punctuation
    punct_map = {
        8220: 34, # “ -> "
        8221: 34, # ” -> "
        8216: 39, # ‘ -> '
        8217: 39, # ’ -> '
        8212: 45, # — -> -
        8211: 45, # – -> -
        8230: 46, # … -> .
    }
    for special, base in punct_map.items():
        if str(base) in c:
            c[str(special)] = c[str(base)]

    # Comprehensive Vietnamese vowel mappings
    vn_chars = 'áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ'
    vn_chars_upper = vn_chars.upper()
    
    for ch in vn_chars + vn_chars_upper:
        code = str(ord(ch))
        # Find base ascii
        nfd = unicodedata.normalize('NFD', ch)
        base_char = nfd[0]
        if ch == 'đ': 
            base_char = 'd'
        elif ch == 'Đ': 
            base_char = 'D'
        
        base_code = str(ord(base_char))
        if base_code in c:
            c[code] = c[base_code]

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f)
    print(f'Successfully updated {json_path} - total characters: {len(c)}')

if __name__ == '__main__':
    build_vietnamese_font('public/fonts/vara/SatisfySL.json')
    build_vietnamese_font('public/fonts/vara/Parisienne.json')
    build_vietnamese_font('public/fonts/vara/PacificoSLO.json')
