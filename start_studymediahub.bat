@echo off
title StudyMediaHub - Personal Student & Media Suite
color 0b

echo ========================================================
echo        STUDYMEDIAHUB - PERSONAL STUDENT ^& MEDIA SUITE
echo ========================================================
echo.
echo [1/3] Khoi dong Backend FastAPI tai cong 8000...
cd /d "%~dp0backend"
start "StudyMediaHub Backend" /min cmd /c "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo [2/3] Khoi dong Frontend tai cong 5173...
cd /d "%~dp0frontend"
start "StudyMediaHub Frontend" /min cmd /c "npx vite --host 0.0.0.0 --port 5173"

echo [3/3] Dang mo trinh duyet...
timeout /t 3 >nul
start http://localhost:5173

echo.
echo ========================================================
echo [OK] He thong da khoi dong thanh cong!
echo - Tren may tinh: http://localhost:5173
echo - Tren dien thoai: Mo muc 'Ket noi Mobile' trong ung dung de quet ma QR.
echo.
echo Nhan phim bat ky de thu nho cua so nay...
echo ========================================================
pause >nul
