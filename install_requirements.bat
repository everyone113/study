@echo off
title Cai dat Dependencies cho StudyMediaHub
color 0a

echo Dang cai dat thu vien Python Backend...
cd /d "%~dp0backend"
python -m pip install -r requirements.txt aiosqlite gTTS pytest

echo.
echo Dang cai dat thu vien Node Frontend...
cd /d "%~dp0frontend"
call npm install

echo.
echo ========================================
echo Cai dat hoan tat! Ban co the chay start_studymediahub.bat
echo ========================================
pause
