@echo off
echo ====================================
echo Traffic Camera Monitor Setup
echo ====================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available
    echo Please reinstall Node.js
    echo.
    pause
    exit /b 1
)

echo npm version:
npm --version
echo.

echo Installing dependencies...
echo.

REM Install dependencies
npm install

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies
    echo Please check your internet connection and try again
    echo.
    pause
    exit /b 1
)

echo.
echo ====================================
echo Installation completed successfully!
echo ====================================
echo.
echo To start the application:
echo   npm start
echo.
echo To start in development mode:
echo   npm run dev
echo.
echo To build for production:
echo   npm run build
echo.
pause
