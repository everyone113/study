import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Terminal,
  Play,
  RotateCcw,
  BookMarked,
  CheckCircle,
  AlertTriangle,
  Clock,
  Copy,
  ChevronDown
} from 'lucide-react'

const FALLBACK_SNIPPETS = {
  java: [
    {
      id: 'java_hello',
      title: 'Hello World & Scanner',
      description: 'Cú pháp cơ bản và nhập xuất dữ liệu trong Java',
      code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("Xin chào! Hãy nhập tên của bạn:");
        String name = sc.hasNextLine() ? sc.nextLine() : "Sinh viên";
        System.out.println("Chào mừng " + name + " đến với StudyMediaHub!");
    }
}`
    },
    {
      id: 'java_oop',
      title: 'Lập trình Hướng đối tượng (OOP)',
      description: 'Ví dụ về Kế thừa, Đóng gói và Đa hình trong Java',
      code: `class SinhVien {
    private String mssv;
    private String hoTen;
    private double diemGpa;

    public SinhVien(String mssv, String hoTen, double diemGpa) {
        this.mssv = mssv;
        this.hoTen = hoTen;
        this.diemGpa = diemGpa;
    }

    public void hienThi() {
        System.out.println("MSSV: " + mssv + " | Họ tên: " + hoTen + " | GPA: " + diemGpa);
    }
}

public class Main {
    public static void main(String[] args) {
        SinhVien sv1 = new SinhVien("B21DCCN001", "Nguyễn Văn An", 3.75);
        SinhVien sv2 = new SinhVien("B21DCCN002", "Trần Thị Mai", 3.90);
        sv1.hienThi();
        sv2.hienThi();
    }
}`
    },
    {
      id: 'java_collections',
      title: 'ArrayList & Sắp xếp Object',
      description: 'Sử dụng Collections.sort và Comparator trong Java',
      code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> numbers = new ArrayList<>(Arrays.asList(42, 15, 88, 3, 99, 21));
        System.out.println("Mảng ban đầu: " + numbers);
        
        Collections.sort(numbers);
        System.out.println("Sau khi sắp xếp tăng dần: " + numbers);
        
        numbers.sort(Collections.reverseOrder());
        System.out.println("Sau khi sắp xếp giảm dần: " + numbers);
    }
}`
    }
  ],
  cpp: [
    {
      id: 'cpp_hello',
      title: 'Hello World & Nhập Xuất',
      description: 'Cú pháp cin, cout chuẩn trong C++',
      code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    cout << "Xin chao cac lap trinh vien C++!" << endl;
    return 0;
}`
    },
    {
      id: 'cpp_stl',
      title: 'STL Vector, Map & Sort',
      description: 'Cấu trúc dữ liệu Vector và Map trong STL',
      code: `#include <iostream>
#include <vector>
#include <algorithm>
#include <map>
using namespace std;

int main() {
    vector<int> a = {50, 10, 40, 20, 30};
    sort(a.begin(), a.end());
    
    cout << "Day da sap xep: ";
    for (int x : a) cout << x << " ";
    cout << endl;

    map<string, int> scores;
    scores["C++"] = 10;
    scores["Java"] = 9;
    scores["Python"] = 10;

    cout << "Diem mon C++: " << scores["C++"] << endl;
    return 0;
}`
    }
  ],
  python: [
    {
      id: 'py_basics',
      title: 'Cấu trúc dữ liệu & List Comprehension',
      description: 'Ôn tập Dict, List, Set và Lambda',
      code: `numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
squares = [x**2 for x in numbers if x % 2 == 0]
print("Bình phương các số chẵn:", squares)

students = [
    {"name": "An", "gpa": 3.8},
    {"name": "Bình", "gpa": 3.2},
    {"name": "Châu", "gpa": 3.95}
]
sorted_students = sorted(students, key=lambda s: s["gpa"], reverse=True)
print("Xếp hạng GPA:", sorted_students)`
    }
  ]
}

export default function CodePlayground() {
  const [language, setLanguage] = useState('java')
  const [code, setCode] = useState('')
  const [stdin, setStdin] = useState('')
  const [output, setOutput] = useState(null)
  const [loading, setLoading] = useState(false)
  const [snippets, setSnippets] = useState(FALLBACK_SNIPPETS)
  const [selectedSnippet, setSelectedSnippet] = useState(FALLBACK_SNIPPETS.java[0])

  useEffect(() => {
    fetchSnippets()
  }, [])

  useEffect(() => {
    if (snippets && snippets[language] && Array.isArray(snippets[language]) && snippets[language].length > 0) {
      setCode(snippets[language][0].code)
      setSelectedSnippet(snippets[language][0])
    }
  }, [language, snippets])

  const fetchSnippets = async () => {
    try {
      const res = await axios.get('/api/code/snippets')
      if (res.data && typeof res.data === 'object' && !Array.isArray(res.data) && typeof res.data !== 'string') {
        setSnippets(res.data)
        if (res.data.java && Array.isArray(res.data.java) && res.data.java.length > 0) {
          setCode(res.data.java[0].code)
          setSelectedSnippet(res.data.java[0])
        }
      }
    } catch (err) {
      console.warn('Backend offline or static mode, using fallback snippets:', err.message)
    }
  }

  const handleRunCode = async () => {
    setLoading(true)
    setOutput(null)
    try {
      const res = await axios.post('/api/code/run', {
        language,
        code,
        stdin
      })
      setOutput(res.data)
    } catch (err) {
      setOutput({
        status: 'error',
        stdout: '',
        stderr: err.response?.data?.detail || err.message,
        execution_time_ms: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSnippet = (snip) => {
    setSelectedSnippet(snip)
    setCode(snip.code)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Phòng Lập Trình & Ôn Code
            </h2>
            <p className="text-xs text-slate-400">
              Biên dịch & chạy trực tiếp Java (JDK 21), C++ và Python trên máy tính
            </p>
          </div>
        </div>

        {/* Language selector & Run button */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            {['java', 'cpp', 'python'].map(l => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`px-3.5 py-1.5 rounded-lg uppercase tracking-wider transition-colors ${
                  language === l
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {l === 'cpp' ? 'C++' : l}
              </button>
            ))}
          </div>

          <button
            onClick={handleRunCode}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
          >
            <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Đang chạy...' : 'Chạy Code (Run)'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace (Editor + Cheat sheets) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left: Cheat sheets list */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col h-[520px]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
            <BookMarked className="w-4 h-4 text-amber-400" />
            <span>Cheat Sheet & Bài Mẫu</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {(snippets[language] || []).map(snip => (
              <button
                key={snip.id}
                onClick={() => handleSelectSnippet(snip)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                  selectedSnippet?.id === snip.id
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold mb-1">{snip.title}</div>
                <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {snip.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Code Editor & Terminal */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          {/* Code Textarea */}
          <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex-1 flex flex-col min-h-[340px]">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono font-semibold">
                {language === 'java' ? 'Main.java (JDK 21)' : (language === 'cpp' ? 'main.cpp (C++)' : 'main.py (Python 3)')}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="hover:text-white flex items-center gap-1 text-[11px]"
              >
                <Copy className="w-3 h-3" />
                <span>Sao chép</span>
              </button>
            </div>

            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck="false"
              className="flex-1 w-full bg-slate-950 p-4 font-mono text-xs md:text-sm text-amber-100/90 leading-relaxed focus:outline-none resize-none selection:bg-amber-500/30 selection:text-white"
              rows={16}
            />
          </div>

          {/* Stdin input (if needed) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Dữ liệu đầu vào tiêu chuẩn (Standard Input / Scanner / cin) - Tùy chọn:
            </label>
            <input
              type="text"
              placeholder="Nhập tham số hoặc dữ liệu test ở đây nếu chương trình có lệnh input..."
              value={stdin}
              onChange={e => setStdin(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Terminal Output */}
          {output && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden p-4 font-mono text-xs shadow-xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${output.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                  <span className="font-bold text-slate-300">Terminal Output</span>
                  <span className="text-[10px] text-slate-500">
                    ({output.execution_time_ms}ms)
                  </span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  output.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {output.status} (code {output.exit_code})
                </span>
              </div>

              {output.stdout && (
                <div className="text-emerald-400 whitespace-pre-wrap leading-relaxed py-1">
                  {output.stdout}
                </div>
              )}

              {output.stderr && (
                <div className="text-rose-400 whitespace-pre-wrap leading-relaxed py-1">
                  {output.stderr}
                </div>
              )}

              {!output.stdout && !output.stderr && (
                <div className="text-slate-500 italic">
                  Chương trình chạy xong nhưng không in ra kết quả nào.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
