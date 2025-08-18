@echo off
echo Starting Traffic Camera Monitor...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Dependencies not found. Running installation...
    echo.
    call install.bat
    if %errorlevel% neq 0 (
        echo Installation failed. Cannot start application.
        pause
        exit /b 1
    )
)

echo Starting application...
echo.
npm start

if %errorlevel% neq 0 (
    echo.
    echo Application exited with error code %errorlevel%
    echo.
    pause
)
