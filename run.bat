@echo off
:: FarmToFork Ledger - One Click Setup Script
:: Enhanced version with better error handling, auto-browser opening, and improved UX

:: Enable delayed variable expansion for better error handling
setlocal EnableDelayedExpansion

:: Reset error colors
echo.
echo ==============================================================
echo    FarmToFork Ledger - One Click Setup (Enhanced)
echo ==============================================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo Please install Node.js from https://nodejs.org/
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

:: Get Node.js version
for /f "tokens=*" %%v in ('node --version') do set NODE_VERSION=%%v
echo [INFO] Node.js version: %NODE_VERSION%

:: Check if we are in the right directory
if not exist "hardhat.config.js" (
    echo [ERROR] Please run this script from the root of the FarmToFork Ledger project.
    echo Current directory: %cd%
    echo Expected to find: hardhat.config.js
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

:: Check if npm is available
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not available. Please reinstall Node.js.
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

:: Function to check if a port is in use
:check_port
set PORT_TO_CHECK=%1
set PORT_FOUND=false
for /f "tokens=*" %%a in ('netstat -ano ^| findstr :%PORT_TO_CHECK% 2^>nul') do set PORT_FOUND=true
goto :eof

:: Function to wait for a port with timeout
:wait_for_port
set PORT=%1
set TIMEOUT=%2
set START_TIME=%TIME%
set /a ELAPSED=0
:wait_loop
call :check_port %PORT%
if "%PORT_FOUND%"=="true" (
    goto :port_ready
) else (
    set /a ELAPSED=%TIME%-%START_TIME%
    if %ELAPSED% GEQ %TIMEOUT% (
        goto :port_timeout
    ) else (
        timeout /t 1 > nul
        goto :wait_loop
    )
)
goto :eof

:port_ready
set PORT_READY=true
goto :eof

:port_timeout
set PORT_READY=false
goto :eof

:: Start local Ethereum network in a new window
echo [INFO] Starting local Ethereum network (Hardhat Node)...
start "" "Hardhat Node - FarmToFork Ledger" cmd /k "
    echo.
    echo ==============================================================
    echo    Hardhat Node - Local Ethereum Blockchain
    echo ==============================================================
    echo.
    echo [INFO] Starting Hardhat node...
    echo [INFO] This may take a moment to initialize...
    echo.
    npx hardhat node
    echo.
    echo [INFO] Hardhat node has stopped. This window will close in 10 seconds...
    timeout /t 10 > nul
"

:: Wait for the node to start (check if port 8545 is available)
echo [INFO] Waiting for Ethereum node to start (max 30 seconds)...
set /a START_TIME=%TIME%
call :wait_for_port 8545 30
if "%PORT_READY%"=="true" (
    echo [SUCCESS] Ethereum node is ready on port 8545!
) else (
    echo [WARNING] Timeout waiting for Ethereum node to start.
    echo [INFO] The node may still be starting in the background. Continuing anyway...
)

:: Deploy the contract
echo.
echo [INFO] Deploying smart contract...
set DEPLOY_OUTPUT=
for /f "usebackq delims=" %%a in (`npx hardhat run scripts/deploy.js --network localhost 2^>^&1`) do (
    echo %%a
    set DEPLOY_OUTPUT=!DEPLOY_OUTPUT!%%a
)
if errorlevel 1 (
    echo.
    echo [ERROR] Contract deployment failed.
    echo [INFO] Possible causes:
    echo [INFO] 1. Hardhat node not ready yet
    echo [INFO] 2. Network connection issues
    echo [INFO] 3. Compilation errors
    echo.
    echo [INFO] Troubleshooting steps:
    echo [INFO] 1. Wait a bit longer for the Hardhat node to initialize
    echo [INFO] 2. Check the Hardhat Node window for errors
    echo [INFO] 3. Try deploying manually later with:
    echo [INFO]      npx hardhat run scripts/deploy.js --network localhost
    echo.
    echo Press any key to continue anyway...
    pause >nul
) else (
    echo [SUCCESS] Contract deployed successfully.
    :: Extract contract address from output if possible
    for /f "tokens=*" %%a in ('echo !DEPLOY_OUTPUT! ^| findstr /i "Deployed to\|contract address\|0x"') do set CONTRACT_ADDRESS=%%a
    if defined CONTRACT_ADDRESS (
        echo [INFO] Contract address: !CONTRACT_ADDRESS!
    )
)

:: Start backend in a new window
echo.
echo [INFO] Starting backend API server...
start "" "Backend API - FarmToFork Ledger" cmd /k "
    echo.
    echo ==============================================================
    echo    Backend API Server
    echo ==============================================================
    echo.
    cd backend
    echo [INFO] Checking backend dependencies...
    if not exist node_modules (
        echo [INFO] Installing backend dependencies (this may take a moment)...
        npm install
        if errorlevel 1 (
            echo [ERROR] Failed to install backend dependencies.
            echo [INFO] This window will close in 15 seconds...
            timeout /t 15 > nul
            exit /b 1
        )
    )
    echo.
    echo [INFO] Starting backend server...
    echo [INFO] API will be available at: http://localhost:5000
    echo [INFO] Health check endpoint: http://localhost:5000/health
    echo.
    npm start
    echo.
    echo [INFO] Backend server has stopped. This window will close in 10 seconds...
    timeout /t 10 > nul
"

:: Wait for backend to start
echo [INFO] Waiting for backend to start (max 20 seconds)...
set /a START_TIME=%TIME%
call :wait_for_port 5000 20
if "%PORT_READY%"=="true" (
    echo [SUCCESS] Backend API is ready on port 5000!
) else (
    echo [WARNING] Timeout waiting for backend to start.
    echo [INFO] The backend may still be starting in the background. Continuing anyway...
)

:: Start frontend in a new window
echo.
echo [INFO] Starting frontend application...
start "" "Frontend App - FarmToFork Ledger" cmd /k "
    echo.
    echo ==============================================================
    echo    Frontend Application
    echo ==============================================================
    echo.
    cd ..\frontend
    echo [INFO] Checking frontend dependencies...
    if not exist node_modules (
        echo [INFO] Installing frontend dependencies (this may take a moment)...
        npm install
        if errorlevel 1 (
            echo [ERROR] Failed to install frontend dependencies.
            echo [INFO] This window will close in 15 seconds...
            timeout /t 15 > nul
            exit /b 1
        )
    )
    echo.
    echo [INFO] Starting frontend development server...
    echo [INFO] Application will be available at: http://localhost:5173
    echo.
    npm run dev
    echo.
    echo [INFO] Frontend application has stopped. This window will close in 10 seconds...
    timeout /t 10 > nul
"

:: Wait for frontend to start and then open browser
echo [INFO] Waiting for frontend to start (max 30 seconds)...
set /a START_TIME=%TIME%
call :wait_for_port 5173 30
if "%PORT_READY%"=="true" (
    echo [SUCCESS] Frontend is ready on port 5173!
    echo [INFO] Opening application in default browser...
    start "" "http://localhost:5173"
) else (
    echo [WARNING] Timeout waiting for frontend to start.
    echo [INFO] You can manually open: http://localhost:5173
)

echo.
echo [SUCCESS] All services have been initiated!
echo.
echo ==============================================================
echo    Service Information:
echo ==============================================================
echo [INFO] Hardhat Node:   Local Ethereum blockchain
echo [INFO]                 Check its window for blockchain logs
echo [INFO] Backend:        API server running at http://localhost:5000
echo [INFO] Frontend:       React application running at http://localhost:5173
echo.
echo [INFO] To stop all services, simply close the respective windows.
echo [INFO] Each service runs in its own window for easy monitoring.
echo.
echo [INFO] Application Features:
echo [INFO]  - Track product journey from farm to fork
echo [INFO]  - Record temperature and humidity at each stage
echo [INFO]  - Store detailed data on IPFS (via hash)
echo [INFO]  - Multi-language support (English, Hindi, Bengali)
echo [INFO]  - Dark/Light mode with system preference detection
echo [INFO]  - Toast notifications for user feedback
echo [INFO]  - Export/Refresh functionality
echo [INFO]  - Form validation and copy-to-clipboard for product IDs
echo.
echo [INFO] Tip: If a service fails to start, check its respective window for error messages.
echo.
echo Press any key to exit this setup window...
pause >nul
endlocal
exit