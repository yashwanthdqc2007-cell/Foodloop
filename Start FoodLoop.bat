@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title FOODLOOP MVP LAUNCHER

set "ROOT=%~dp0"
set "BACKEND_URL=http://localhost:5000/api/health"
set "FRONTEND_URL=http://127.0.0.1:5173"

echo ========================================
echo        FOODLOOP MVP LAUNCHER
echo ========================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$b=Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue; if($b){exit 0}else{exit 1}" >nul 2>&1
set "BACKEND_IN_USE=%errorlevel%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$f=Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue; if($f){exit 0}else{exit 1}" >nul 2>&1
set "FRONTEND_IN_USE=%errorlevel%"

if "%BACKEND_IN_USE%"=="0" if "%FRONTEND_IN_USE%"=="0" goto already_running
if "%BACKEND_IN_USE%"=="0" goto backend_port_error
if "%FRONTEND_IN_USE%"=="0" goto frontend_port_error

echo [1/3] Starting backend...
start "FoodLoop Backend" cmd /k "cd /d ""%ROOT%server"" && npm start"

echo [FoodLoop] Waiting for backend...
set "BACKEND_READY=0"
for /L %%N in (1,1,30) do (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "try {$r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 '%BACKEND_URL%'; if($r.StatusCode -eq 200){exit 0}} catch {}; exit 1" >nul 2>&1
    if not errorlevel 1 (
        set "BACKEND_READY=1"
        goto backend_ready
    )
    timeout /t 1 /nobreak >nul
)

echo.
echo Backend failed to start.
echo Check the "FoodLoop Backend" terminal.
pause
exit /b 1

:backend_ready
echo [FoodLoop] Backend is ready!
powershell -NoProfile -ExecutionPolicy Bypass -Command "$c=Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if($c){$c.OwningProcess | Set-Content -NoNewline '%ROOT%.foodloop-backend.pid'}"
echo.
echo [2/3] Starting frontend...
start "FoodLoop Frontend" cmd /k "cd /d ""%ROOT%client"" && npm run dev -- --host 127.0.0.1"

echo [FoodLoop] Waiting for frontend...
set "FRONTEND_READY=0"
for /L %%N in (1,1,30) do (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "try {$r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 '%FRONTEND_URL%'; if($r.StatusCode -eq 200){exit 0}} catch {}; exit 1" >nul 2>&1
    if not errorlevel 1 (
        set "FRONTEND_READY=1"
        goto frontend_ready
    )
    timeout /t 1 /nobreak >nul
)

echo.
echo Frontend failed to start.
echo Check the "FoodLoop Frontend" terminal.
pause
exit /b 1

:frontend_ready
echo [FoodLoop] Frontend is ready!
powershell -NoProfile -ExecutionPolicy Bypass -Command "$c=Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if($c){$c.OwningProcess | Set-Content -NoNewline '%ROOT%.foodloop-frontend.pid'}"
echo.
echo [3/3] Opening FoodLoop...
start "" "%FRONTEND_URL%"
echo.
echo ========================================
echo        FOODLOOP IS READY!
echo ========================================
echo.
echo Frontend: %FRONTEND_URL%
echo Backend:  http://localhost:5000
echo.
echo ========================================
timeout /t 3 /nobreak >nul
exit /b 0

:already_running
echo FoodLoop is already running.
echo Opening %FRONTEND_URL%...
start "" "%FRONTEND_URL%"
timeout /t 2 /nobreak >nul
exit /b 0

:backend_port_error
echo Backend port 5000 is already in use.
echo Stop the conflicting process, then run this launcher again.
pause
exit /b 1

:frontend_port_error
echo Frontend port 5173 is already in use.
echo Stop the conflicting process, then run this launcher again.
pause
exit /b 1
