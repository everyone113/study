import os
import sys
import time
import shutil
import tempfile
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any

JDK21_BIN = Path(r"C:\Users\admin\AppData\Local\Programs\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin")

def get_java_executables() -> tuple[str, str]:
    javac = shutil.which("javac")
    java = shutil.which("java")
    if not javac and JDK21_BIN.exists():
        candidate_javac = JDK21_BIN / "javac.exe"
        if candidate_javac.exists():
            javac = str(candidate_javac)
    if JDK21_BIN.exists():
        candidate_java = JDK21_BIN / "java.exe"
        if candidate_java.exists():
            java = str(candidate_java)
    return javac or "javac", java or "java"

def get_cpp_compiler() -> Optional[str]:
    for cmd in ["g++", "clang++", "cl"]:
        found = shutil.which(cmd)
        if found:
            return found
    common_paths = [
        r"C:\MinGW\bin\g++.exe",
        r"C:\msys64\ucrt64\bin\g++.exe",
        r"C:\msys64\mingw64\bin\g++.exe",
        r"D:\MinGW\bin\g++.exe",
    ]
    for p in common_paths:
        if os.path.exists(p):
            return p
    return None

async def execute_code(language: str, code: str, stdin: str = "", timeout_sec: int = 8) -> Dict[str, Any]:
    lang = language.lower().strip()
    start_time = time.time()

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)

        if lang in ["py", "python"]:
            file_path = temp_path / "main.py"
            file_path.write_text(code, encoding="utf-8")
            cmd = [sys.executable, str(file_path)]

            try:
                proc = subprocess.run(
                    cmd,
                    input=stdin,
                    capture_output=True,
                    text=True,
                    timeout=timeout_sec,
                    cwd=str(temp_path)
                )
                exec_time = int((time.time() - start_time) * 1000)
                return {
                    "status": "success" if proc.returncode == 0 else "runtime_error",
                    "stdout": proc.stdout,
                    "stderr": proc.stderr,
                    "exit_code": proc.returncode,
                    "execution_time_ms": exec_time
                }
            except subprocess.TimeoutExpired:
                return {
                    "status": "timeout",
                    "stdout": "",
                    "stderr": f"Lỗi: Quá thời gian thực thi cho phép ({timeout_sec} giây). Có thể code bị lặp vô tận.",
                    "exit_code": -1,
                    "execution_time_ms": timeout_sec * 1000
                }

        elif lang == "java":
            javac, java = get_java_executables()
            file_path = temp_path / "Main.java"
            file_path.write_text(code, encoding="utf-8")

            # 1. Compile
            compile_res = subprocess.run(
                [javac, "Main.java"],
                capture_output=True,
                text=True,
                cwd=str(temp_path)
            )
            if compile_res.returncode != 0:
                exec_time = int((time.time() - start_time) * 1000)
                return {
                    "status": "compile_error",
                    "stdout": "",
                    "stderr": compile_res.stderr or compile_res.stdout,
                    "exit_code": compile_res.returncode,
                    "execution_time_ms": exec_time
                }

            # 2. Run
            try:
                proc = subprocess.run(
                    [java, "Main"],
                    input=stdin,
                    capture_output=True,
                    text=True,
                    timeout=timeout_sec,
                    cwd=str(temp_path)
                )
                exec_time = int((time.time() - start_time) * 1000)
                return {
                    "status": "success" if proc.returncode == 0 else "runtime_error",
                    "stdout": proc.stdout,
                    "stderr": proc.stderr,
                    "exit_code": proc.returncode,
                    "execution_time_ms": exec_time
                }
            except subprocess.TimeoutExpired:
                return {
                    "status": "timeout",
                    "stdout": "",
                    "stderr": f"Lỗi: Quá thời gian thực thi cho phép ({timeout_sec}s).",
                    "exit_code": -1,
                    "execution_time_ms": timeout_sec * 1000
                }

        elif lang in ["cpp", "c++", "c"]:
            compiler = get_cpp_compiler()
            if not compiler:
                return {
                    "status": "config_info",
                    "stdout": "",
                    "stderr": "Chưa tìm thấy MinGW/G++ trên máy. Bạn có thể cài đặt bằng lệnh: winget install -e --id MSYS2.MSYS2 hoặc cài MinGW vào ổ D.",
                    "exit_code": 1,
                    "execution_time_ms": 0
                }

            ext = ".cpp" if lang in ["cpp", "c++"] else ".c"
            src_file = temp_path / f"main{ext}"
            exe_file = temp_path / "main.exe"
            src_file.write_text(code, encoding="utf-8")

            # 1. Compile
            compile_res = subprocess.run(
                [compiler, "-O2", str(src_file), "-o", str(exe_file)],
                capture_output=True,
                text=True,
                cwd=str(temp_path)
            )
            if compile_res.returncode != 0:
                exec_time = int((time.time() - start_time) * 1000)
                return {
                    "status": "compile_error",
                    "stdout": "",
                    "stderr": compile_res.stderr or compile_res.stdout,
                    "exit_code": compile_res.returncode,
                    "execution_time_ms": exec_time
                }

            # 2. Run
            try:
                proc = subprocess.run(
                    [str(exe_file)],
                    input=stdin,
                    capture_output=True,
                    text=True,
                    timeout=timeout_sec,
                    cwd=str(temp_path)
                )
                exec_time = int((time.time() - start_time) * 1000)
                return {
                    "status": "success" if proc.returncode == 0 else "runtime_error",
                    "stdout": proc.stdout,
                    "stderr": proc.stderr,
                    "exit_code": proc.returncode,
                    "execution_time_ms": exec_time
                }
            except subprocess.TimeoutExpired:
                return {
                    "status": "timeout",
                    "stdout": "",
                    "stderr": f"Lỗi: Quá thời gian thực thi ({timeout_sec}s).",
                    "exit_code": -1,
                    "execution_time_ms": timeout_sec * 1000
                }

        else:
            return {
                "status": "unsupported",
                "stdout": "",
                "stderr": f"Ngôn ngữ '{language}' chưa được hỗ trợ. Vui lòng chọn Java, C++ hoặc Python.",
                "exit_code": -1,
                "execution_time_ms": 0
            }

SNIPPETS = {
    "java": [
        {
            "id": "java_hello",
            "title": "Hello World & Scanner",
            "description": "Cú pháp cơ bản và nhập xuất dữ liệu trong Java",
            "code": """import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("Xin chào! Hãy nhập tên của bạn:");
        String name = sc.hasNextLine() ? sc.nextLine() : "Sinh viên";
        System.out.println("Chào mừng " + name + " đến với StudyMediaHub!");
    }
}"""
        },
        {
            "id": "java_oop",
            "title": "Lập trình Hướng đối tượng (OOP)",
            "description": "Ví dụ về Kế thừa (Inheritance), Đóng gói (Encapsulation) và Đa hình (Polymorphism)",
            "code": """class SinhVien {
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
}"""
        },
        {
            "id": "java_collections",
            "title": "ArrayList & Sắp xếp Object",
            "description": "Sử dụng Collections.sort và Comparator trong Java",
            "code": """import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> numbers = new ArrayList<>(Arrays.asList(42, 15, 88, 3, 99, 21));
        System.out.println("Mảng ban đầu: " + numbers);
        
        Collections.sort(numbers);
        System.out.println("Sau khi sắp xếp tăng dần: " + numbers);
        
        numbers.sort(Collections.reverseOrder());
        System.out.println("Sau khi sắp xếp giảm dần: " + numbers);
    }
}"""
        }
    ],
    "cpp": [
        {
            "id": "cpp_hello",
            "title": "Hello World & Nhập Xuất",
            "description": "Cú pháp cin, cout chuẩn trong C++",
            "code": """#include <iostream>
#include <string>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    cout << "Xin chao cac lap trinh vien C++!" << endl;
    return 0;
}"""
        },
        {
            "id": "cpp_stl",
            "title": "STL Vector, Map & Sort",
            "description": "Cấu trúc dữ liệu Vector và Map trong STL",
            "code": """#include <iostream>
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
}"""
        }
    ],
    "python": [
        {
            "id": "py_basics",
            "title": "Cấu trúc dữ liệu & List Comprehension",
            "description": "Ôn tập Dict, List, Set và Lambda",
            "code": """numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
squares = [x**2 for x in numbers if x % 2 == 0]
print("Bình phương các số chẵn:", squares)

students = [
    {"name": "An", "gpa": 3.8},
    {"name": "Bình", "gpa": 3.2},
    {"name": "Châu", "gpa": 3.95}
]
sorted_students = sorted(students, key=lambda s: s["gpa"], reverse=True)
print("Xếp hạng GPA:", sorted_students)
"""
        }
    ]
}
