@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title FOODLOOP STOPPER

echo [FoodLoop] Stopping FoodLoop development processes...
set "ROOT=%~dp0"

if exist "%ROOT%.foodloop-backend.pid" for /f "usebackq delims=" %%P in ("%ROOT%.foodloop-backend.pid") do taskkill /PID %%P /T /F >nul 2>&1
if exist "%ROOT%.foodloop-frontend.pid" for /f "usebackq delims=" %%P in ("%ROOT%.foodloop-frontend.pid") do taskkill /PID %%P /T /F >nul 2>&1
del /q "%ROOT%.foodloop-backend.pid" "%ROOT%.foodloop-frontend.pid" >nul 2>&1

echo.
echo FoodLoop servers stopped.
timeout /t 2 /nobreak >nul
exit /b 0
