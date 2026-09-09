@echo off
echo Starting FarmToFork Ledger...
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
    )

REM Check if we are in the right directory
if not exist "hardhat.config.js" (
    echo Please run this script from the root of the FarmToFork Ledger project.
    pause
    exit /b 1
    )

REM Start local Ethereum network in a new window
echo Starting local Ethereum network...
start "" "Hardhat Node" cmd /k "npx hardhat node"

REM Wait for the node to start
timeout /t 5 > nul

REM Deploy the contract
echo Deploying contract...
npx hardhat run scripts/deploy.js --network localhost
if %errorlevel% neq 0 (
    echo Contract deployment failed. Check the hardhat node window for errors.
    pause
    exit /b 1
    )
echo Contract deployed successfully.
echo.

REM Start backend in a new window
echo Starting backend...
start "" "Backend" cmd /k "cd backend && npm start"

REM Wait for backend to start
timeout /t 3 > nul

REM Start frontend in a new window
echo Starting frontend...
start "" "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services have been started!
echo.
echo Check the opened windows for logs:
echo   - Hardhat Node: local Ethereum blockchain
echo   - Backend: API server
echo   - Frontend: React application
echo.
echo To stop all services, close the respective windows.
echo.
pause
exit