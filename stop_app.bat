@echo off
setlocal enabledelayedexpansion
title Stop Yoga Studio Admin Dashboard
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

if not "%1"=="/silent" (
    echo ==============================================================
    echo          STOPPING YOGA STUDIO ADMIN DASHBOARD
    echo ==============================================================
    echo.
)

:: 1. Graceful shutdown and process termination via stop_server.mjs
if not "%ADMIN_DIR%"=="" (
    if exist "%ADMIN_DIR%\stop_server.mjs" (
        if "%1"=="/silent" (
            node "%ADMIN_DIR%\stop_server.mjs" >nul 2>&1
        ) else (
            node "%ADMIN_DIR%\stop_server.mjs"
        )
    )
)

if not "%1"=="/silent" (
    echo.
    echo ==============================================================
    echo [SUCCESS] Yoga Studio servers stopped successfully.
    echo ==============================================================
    echo.
    timeout /t 3 >nul 2>&1
)
exit /b 0
