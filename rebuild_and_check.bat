@echo off
cd /d C:\Users\Zenn\.gemini\antigravity\scratch\dune-imperium-tracker

REM Clear caches
if exist dist rmdir /s /q dist
if exist node_modules\.vite rmdir /s /q node_modules\.vite

REM Touch all changed files
copy /b src\components\VPTrackingView.jsx +,,
copy /b src\components\SetupWizard.jsx +,,
copy /b src\App.jsx +,,

REM Build
call npm run build

REM Verify
echo Verifying...
powershell -Command "if (Select-String -Path 'dist\assets\*.js' -Pattern 'Choose Colours' -Quiet) { Write-Host 'OK: Colour step' } else { Write-Host 'MISSING: Colour step' }"
powershell -Command "if (Select-String -Path 'dist\assets\*.js' -Pattern 'Player Colour' -Quiet) { Write-Host 'OK: Player Colour header' } else { Write-Host 'MISSING: Player Colour header' }"
powershell -Command "if (Select-String -Path 'dist\assets\*.js' -Pattern 'TRACK_SPACES' -Quiet) { Write-Host 'OK: Score track' } else { Write-Host 'MISSING: Score track' }"
