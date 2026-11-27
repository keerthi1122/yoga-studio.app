@echo off
setlocal enabledelayedexpansion
title Yoga Studio Production Preview Server

set "PATH=%SystemRoot%\System32;%SystemRoot%;%SystemRoot%\System32\Wbem;%SystemRoot%\System32\WindowsPowerShell\v1.0\;%PATH%"

set "ADMIN_DIR="
if exist "%~dp0admin_dashboard\package.json" (
    set "ADMIN_DIR=%~dp0admin_dashboard"
) else if exist "%~dp0yoga-studio.app-main\admin_dashboard\package.json" (
    set "ADMIN_DIR=%~dp0yoga-studio.app-main\admin_dashboard"
) else if exist "%~dp0..\admin_dashboard\package.json" (
    set "ADMIN_DIR=%~dp0..\admin_dashboard"
)

if "%ADMIN_DIR%"=="" (
    echo [ERROR] Could not locate admin_dashboard directory!
    if not "%1"=="/silent" pause
    exit /b 1
)

cd /d "%ADMIN_DIR%"

:: Check if dist exists, otherwise build it
if not exist "dist\index.html" (
    if not "%1"=="/silent" (
        echo [INFO] Production build not found. Building now [tsc ^&^& vite build]...
        call npm run build
        if !ERRORLEVEL! NEQ 0 (
            echo [ERROR] Build failed! Check errors above.
            pause
            exit /b 1
        )
    ) else (
        call npm run build >nul 2>&1
        if !ERRORLEVEL! NEQ 0 exit /b 1
    )
)

:: Check if port 4173 is already running
if exist "check_port.mjs" (
    node "check_port.mjs" 4173 >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        if "%1"=="/silent" (
            exit /b 0
        )
        echo ==============================================================
        echo [INFO] Production server is ALREADY running on http://localhost:4173/
        echo [INFO] Opening in your web browser now...
        echo ==============================================================
        start http://localhost:4173/
        pause
        exit /b 0
    )
)

:: Silent background mode handler (invoked by start_preview.vbs)
if "%1"=="/silent" (
    call node serve_production.mjs
    exit /b 0
)

:: Interactive mode
echo ==============================================================
echo     YOGA STUDIO ADMIN DASHBOARD - PRODUCTION PREVIEW SERVER   
echo ==============================================================
echo [INFO] Launching persistent production server...
echo [INFO] Server URL: http://localhost:4173/
echo [INFO] Opening your web browser...
echo.

start "" "http://localhost:4173/"
call node serve_production.mjs
