@echo off
setlocal enabledelayedexpansion
title Yoga Studio - Cloud ^& Temporary Deployment

set "PATH=%SystemRoot%\System32;%SystemRoot%;%SystemRoot%\System32\Wbem;%SystemRoot%\System32\WindowsPowerShell\v1.0\;%PATH%"

:: Locate admin_dashboard and root
set "ADMIN_DIR="
set "ROOT_DIR="
if exist "%~dp0admin_dashboard\package.json" (
    set "ADMIN_DIR=%~dp0admin_dashboard"
    set "ROOT_DIR=%~dp0"
) else if exist "%~dp0yoga-studio.app-main\admin_dashboard\package.json" (
    set "ADMIN_DIR=%~dp0yoga-studio.app-main\admin_dashboard"
    set "ROOT_DIR=%~dp0yoga-studio.app-main"
) else if exist "%~dp0..\admin_dashboard\package.json" (
    set "ADMIN_DIR=%~dp0..\admin_dashboard"
    set "ROOT_DIR=%~dp0..\"
)

echo ==============================================================
echo       YOGA STUDIO ADMIN DASHBOARD - CLOUD / TEMPORARY DEPLOY   
echo ==============================================================
echo.

:: Step 1: Choose deployment mode
echo Choose deployment mode:
echo   [1] Temporary Firebase Preview Channel - Expires in 7 days
echo   [2] Live Production Firebase Hosting - https://gvya-yoga-f3c9f.web.app
echo   [3] Instant Public Web Tunnel - Cloudflare Quick Tunnel
echo   [4] Local or LAN Persistent Server - http://localhost:4173/
echo.
set /p DEPLOY_CHOICE="Enter 1, 2, 3, or 4 (Default: 1): "
if "%DEPLOY_CHOICE%"=="" set "DEPLOY_CHOICE=1"

:: Handle Option 3 (Cloudflare Tunnel)
if "%DEPLOY_CHOICE%"=="3" (
    echo.
    echo ==============================================================
    echo Starting Cloudflare Quick Tunnel on https://localhost:5173 ...
    echo [Make sure dev server is running via start_app.bat or start_app.vbs]
    echo ==============================================================
    npx --yes cloudflared tunnel --url https://localhost:5173
    pause
    exit /b 0
)

:: Handle Option 4 (Local/LAN preview)
if "%DEPLOY_CHOICE%"=="4" (
    cd /d "%~dp0"
    if exist "start_preview.bat" (
        call start_preview.bat
    ) else (
        cd /d "%ADMIN_DIR%"
        call node serve_production.mjs
    )
    exit /b 0
)

:: Step 2: Build the production bundle
echo.
echo [1/2] Building production bundle in %ADMIN_DIR%...
cd /d "%ADMIN_DIR%"
call npm run build
if !ERRORLEVEL! NEQ 0 (
    echo [ERROR] Production build failed. Please resolve build errors.
    pause
    exit /b 1
)
echo [SUCCESS] Production build generated in dist/
echo.

:: Step 3: Check Firebase CLI
echo [2/2] Checking Firebase CLI...
cd /d "%ROOT_DIR%"

set "FB_CMD="
where firebase >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    set "FB_CMD=firebase"
) else (
    where npx >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        set "FB_CMD=npx --yes firebase-tools"
    )
)

if "%FB_CMD%"=="" (
    echo [NOTICE] Firebase CLI is not installed or not in PATH.
    echo.
    echo To install and login to Firebase:
    echo   1. Run: npm install -g firebase-tools
    echo   2. Run: firebase login
    echo   3. Re-run this script [deploy_firebase.bat]
    echo.
    echo In the meantime, you can run start_preview.bat for instant local/LAN hosting!
    echo.
    pause
    exit /b 0
)

if "%DEPLOY_CHOICE%"=="1" (
    echo.
    echo Deploying to temporary preview channel - 7 days...
    call %FB_CMD% hosting:channel:deploy preview --expires 7d
) else (
    echo.
    echo Deploying to live production hosting...
    call %FB_CMD% deploy --only hosting
)

echo.
echo ==============================================================
echo Deployment completed! Check the URL above to view your app.
echo ==============================================================
pause
