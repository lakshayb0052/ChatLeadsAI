@echo off
echo ==========================================
echo    ChatLeads AI - One Click Launcher
echo ==========================================
echo.

echo [1/3] Starting Backend (FastAPI)...
start "ChatLeads Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --port 8000"

echo [2/3] Starting WhatsApp Service (Baileys)...
start "ChatLeads WhatsApp" cmd /k "cd /d %~dp0services\whatsapp && npm start"

echo [3/3] Starting Frontend (Next.js)...
start "ChatLeads Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo All services are launching! 
echo 1. Scan the QR code in the 'ChatLeads WhatsApp' window.
echo 2. Open http://localhost:3000 in your browser.
echo.
pause
