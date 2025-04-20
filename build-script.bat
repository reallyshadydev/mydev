@echo off
setlocal enabledelayedexpansion

:: Remove existing directories if they exist
if exist .next rmdir /s /q .next
if exist .cache rmdir /s /q .cache

:: Create required directories
if not exist build mkdir build
if not exist scripts\compiled mkdir scripts\compiled

:: Run Next.js build and export
call npx next build
if errorlevel 1 exit /b %errorlevel%
call npx next export
if errorlevel 1 exit /b %errorlevel%

:: Move _next to next
if exist out\_next (
    move out\_next out\next
)

:: Replace "/_next/" with "/next/" in all .html files
for %%F in (out\*.html) do (
    powershell -Command "(Get-Content \"%%F\") -replace '/_next/', '/next/' | Set-Content \"%%F\""
)

:: Move exported HTML files to build folder
move out\*.html build

:: Run script compilation
call yarn build-scripts
if errorlevel 1 exit /b %errorlevel%

:: Ensure build\scripts exists before copying
if not exist build\scripts mkdir build\scripts

:: Sync compiled scripts to the build/scripts folder
if exist scripts\compiled (
    xcopy scripts\compiled\* build\scripts\ /s /e /y /i
    rmdir /s /q scripts\compiled
)

:: Sync Next.js static assets
if exist out\next (
    xcopy out\next\* build\next\ /s /e /y /i
)

:: Remove the out directory
if exist out rmdir /s /q out

:: Sync public assets to the build folder
if exist public (
    xcopy public\* build\ /s /e /y /i
)

endlocal
exit /b 0
