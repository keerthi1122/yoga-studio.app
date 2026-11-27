@echo off
setlocal enabledelayedexpansion
title Create Yoga Studio Desktop Shortcuts

set "PATH=%SystemRoot%\System32;%SystemRoot%;%SystemRoot%\System32\Wbem;%SystemRoot%\System32\WindowsPowerShell\v1.0\;%PATH%"

echo ==============================================================
echo       CREATING 1-CLICK DESKTOP SHORTCUTS FOR YOGA STUDIO      
echo ==============================================================
echo.

set "TARGET_DIR=%~dp0"

call "%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -Command "try { $wsh = New-Object -ComObject WScript.Shell; $desktop = $wsh.SpecialFolders.Item('Desktop'); if (-not $desktop) { $desktop = Join-Path $env:USERPROFILE 'Desktop'; } if (-not (Test-Path $desktop -ErrorAction SilentlyContinue)) { exit 1; } $s1 = $wsh.CreateShortcut((Join-Path $desktop 'Yoga Studio - Start.lnk')); $s1.TargetPath = (Join-Path '%TARGET_DIR%' 'start_app.vbs'); $s1.WorkingDirectory = '%TARGET_DIR%'; $s1.Description = 'Start Yoga Studio Dev Server'; $s1.Save(); $s2 = $wsh.CreateShortcut((Join-Path $desktop 'Yoga Studio - Stop.lnk')); $s2.TargetPath = (Join-Path '%TARGET_DIR%' 'stop_app.vbs'); $s2.WorkingDirectory = '%TARGET_DIR%'; $s2.Description = 'Stop Yoga Studio Server'; $s2.Save(); exit 0; } catch { exit 1; }"

if %ERRORLEVEL% EQU 0 goto :success
goto :notice

:success
echo [SUCCESS] Desktop shortcuts created successfully:
echo   1. Yoga Studio - Start  (Launches app silently and opens browser)
echo   2. Yoga Studio - Stop   (Stops server cleanly)
echo.
echo You can now access your Yoga Studio app straight from your Windows Desktop anytime!
goto :end

:notice
echo [NOTICE] Desktop folder could not be written directly in this environment.
echo To create shortcuts manually:
echo   Right-click 'start_app.vbs' -^> Send to -^> Desktop (create shortcut)
echo   Right-click 'stop_app.vbs'  -^> Send to -^> Desktop (create shortcut)

:end
echo.
if not "%1"=="/silent" pause
