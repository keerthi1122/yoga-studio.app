@echo off
setlocal enabledelayedexpansion
title Yoga Studio Admin Dashboard Launcher

:: Ensure Windows system utilities are in PATH
set "PATH=%SystemRoot%\System32;%SystemRoot%;%SystemRoot%\System32\Wbem;%SystemRoot%\System32\WindowsPowerShell\v1.0\;%PATH%"

:: Locate admin_dashboard directory
set "ADMIN_DIR="
if exist "%~dp0admin_dashboard\package.json" (
    set "ADMIN_DIR=%~dp0admin_dashboard"
) else if exist "%~dp0yoga-studio.app-main\admin_dashboard\package.json" (
    set "ADMIN_DIR=%~dp0yoga-studio.app-main\admin_dashboard"
) else if exist "%~dp0..\admin_dashboard\package.json" (
    set "ADMIN_DIR=%~dp0..\admin_dashboard"
)

if "%ADMIN_DIR%"=="" (
    echo ==============================================================
    echo [ERROR] Could not locate admin_dashboard directory!
    echo Looked in:
    echo   - %~dp0admin_dashboard
    echo   - %~dp0yoga-studio.app-main\admin_dashboard
    echo ==============================================================
    if not "%1"=="/silent" pause
    exit /b 1
)

:: Verify Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ==============================================================
    echo [ERROR] Node.js is not found in your system PATH!
    echo Please install Node.js from https://nodejs.org/ and restart.
    echo ==============================================================
    if not "%1"=="/silent" pause
    exit /b 1
)

:: Silent background mode handler (invoked by start_app.vbs)
if "%1"=="/silent" (
    cd /d "%ADMIN_DIR%"
    node run_dev.mjs
    exit /b 0
)

:: Interactive mode: check if server is already running on port 5173
if exist "%ADMIN_DIR%\check_port.mjs" (
    node "%ADMIN_DIR%\check_port.mjs" 5173 >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo ==============================================================
        echo [INFO] Yoga Studio server is ALREADY running on https://localhost:5173/
        echo [INFO] Opening in your web browser now...
        echo ==============================================================
        start https://localhost:5173/
        echo.
        echo Server is currently active in the background.
        echo To stop the server anytime, run: stop_app.bat
        echo.
        echo Press any key to close this window...
        pause >nul
        exit /b 0
    )
)

:: Interactive start
echo ==============================================================
echo      YOGA STUDIO ADMIN DASHBOARD - INSTANT ACCESS LAUNCHER    
echo ==============================================================
echo   Server URL:  https://localhost:5173/
echo   Live Reload: Active (Edits in src/ will update instantly)
echo   To Stop:     Run stop_app.bat or press Ctrl+C in this window
echo ==============================================================
echo.
echo Starting Vite development server and opening your browser...
echo.

cd /d "%ADMIN_DIR%"
call node run_dev.mjs --open
