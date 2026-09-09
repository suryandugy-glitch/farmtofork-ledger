#!/bin/bash

# FarmToFork Ledger - One Click Run Script for macOS/Linux
# Enhanced version with better error handling

echo
echo "=============================================================="
echo "    FarmToFork Ledger - One Click Setup (Enhanced)"
echo "=============================================================="
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "[ERROR] Node.js is not installed."
    echo "Please install Node.js from https://nodejs.org/"
    echo
    read -n 1 -s -r -p "Press any key to exit..."
    exit 1
fi

# Get Node.js version
NODE_VERSION=$(node --version)
echo "[INFO] Node.js version: $NODE_VERSION"

# Check if we are in the right directory
if [ ! -f "hardhat.config.js" ]; then
    echo "[ERROR] Please run this script from the root of the FarmToFork Ledger project."
    echo "Current directory: $(pwd)"
    echo "Expected to find: hardhat.config.js"
    echo
    read -n 1 -s -r -p "Press any key to exit..."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null
then
    echo "[ERROR] npm is not available. Please reinstall Node.js."
    echo
    read -n 1 -s -r -p "Press any key to exit..."
    exit 1
fi

# Function to check if a port is in use
check_port() {
    PORT_TO_CHECK=$1
    if nc -z localhost "$PORT_TO_CHECK" 2>/dev/null; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for a port with timeout
wait_for_port() {
    PORT=$1
    TIMEOUT=$2
    START_TIME=$(date +%s)

    while true; do
        if check_port "$PORT"; then
            return 0  # Port is ready
        fi

        CURRENT_TIME=$(date +%s)
        ELAPSED=$((CURRENT_TIME - START_TIME))

        if [ $ELAPSED -ge $TIMEOUT ]; then
            return 1  # Timeout
        fi

        sleep 1
    done
}

# Function to display service information
display_service_info() {
    echo
    echo "[SUCCESS] All services have been initiated!"
    echo
    echo "=============================================================="
    echo "    Service Information:"
    echo "=============================================================="
    echo "[INFO] Hardhat Node:   Local Ethereum blockchain"
    echo "[INFO]                 Check its window for blockchain logs"
    echo "[INFO] Backend:        API server running at http://localhost:5000"
    echo "[INFO] Frontend:       React application running at http://localhost:5173"
    echo
    echo "[INFO] To stop all services, simply close the respective windows."
    echo "[INFO] Each service runs in its own window/tab for easy monitoring."
    echo
    echo "[INFO] Application Features:"
    echo "[INFO]  - Track product journey from farm to fork"
    echo "[INFO]  - Record temperature and humidity at each stage"
    echo "[INFO]  - Store detailed data on IPFS (via hash)"
    echo "[INFO]  - Multi-language support (English, Hindi, Bengali)"
    echo "[INFO]  - Dark/Light mode with system preference detection"
    echo "[INFO]  - Toast notifications for user feedback"
    echo "[INFO]  - Export/Refresh functionality"
    echo "[INFO]  - Form validation and copy-to-clipboard for product IDs"
    echo
    echo "[INFO] Tip: If a service fails to start, check its respective window for error messages."
    echo
}

# Start local Ethereum network in a new window/tab
echo "[INFO] Starting local Ethereum network (Hardhat Node)..."

# Detect terminal emulator for opening new windows/tabs
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript -e 'tell application "Terminal" to do script "cd '\''$(pwd)'\'' && echo \"==============================================================\" && echo \"    Hardhat Node - Local Ethereum Blockchain\" && echo \"==============================================================\" && echo \"[INFO] Starting Hardhat node...\" && echo \"[INFO] This may take a moment to initialize...\" && echo && npx hardhat node"' &
    HARDHAT_PID=$!
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - try different terminal emulators
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd '$(pwd)'; echo '=============================================================='; echo '    Hardhat Node - Local Ethereum Blockchain'; echo '=============================================================='; echo '[INFO] Starting Hardhat node...'; echo '[INFO] This may take a moment to initialize...'; echo; npx hardhat node; echo; echo '[INFO] Hardhat node has stopped. Press Enter to close...'; read" &
        HARDHAT_PID=$!
    elif command -v konsole &> /dev/null; then
        konsole -e bash -c "cd '$(pwd)'; echo '=============================================================='; echo '    Hardhat Node - Local Ethereum Blockchain'; echo '=============================================================='; echo '[INFO] Starting Hardhat node...'; echo '[INFO] This may take a moment to initialize...'; echo; npx hardhat node; echo; echo '[INFO] Hardhat node has stopped. Press Enter to close...'; read" &
        HARDHAT_PID=$!
    elif command -v xterm &> /dev/null; then
        xterm -e bash -c "cd '$(pwd)'; echo '=============================================================='; echo '    Hardhat Node - Local Ethereum Blockchain'; echo '=============================================================='; echo '[INFO] Starting Hardhat node...'; echo '[INFO] This may take a moment to initialize...'; echo; npx hardhat node; echo; echo '[INFO] Hardhat node has stopped. Press Enter to close...'; read" &
        HARDHAT_PID=$!
    else
        # Fallback to background process
        echo "[WARNING] No supported terminal emulator found. Running Hardhat node in background."
        cd "$(pwd)"
        npx hardhat node &
        HARDHAT_PID=$!
    fi
else
    # Fallback
    echo "[WARNING] Unsupported OS. Running Hardhat node in background."
    cd "$(pwd)"
    npx hardhat node &
    HARDHAT_PID=$!
fi

# Wait for the node to start (check if port 8545 is available)
echo "[INFO] Waiting for Ethereum node to start (max 30 seconds)..."
if wait_for_port 8545 30; then
    echo "[SUCCESS] Ethereum node is ready on port 8545!"
else
    echo "[WARNING] Timeout waiting for Ethereum node to start."
    echo "[INFO] The node may still be starting in the background. Continuing anyway..."
fi

# Deploy the contract
echo
echo "[INFO] Deploying smart contract..."
DEPLOY_OUTPUT=$(npx hardhat run scripts/deploy.js --network localhost 2>&1)
DEPLOY_EXIT_CODE=$?

echo "$DEPLOY_OUTPUT"

if [ $DEPLOY_EXIT_CODE -ne 0 ]; then
    echo
    echo "[ERROR] Contract deployment failed."
    echo "[INFO] Possible causes:"
    echo "[INFO] 1. Hardhat node not ready yet"
    echo "[INFO] 2. Network connection issues"
    echo "[INFO] 3. Compilation errors"
    echo
    echo "[INFO] Troubleshooting steps:"
    echo "[INFO] 1. Wait a bit longer for the Hardhat node to initialize"
    echo "[INFO] 2. Check the Hardhat Node window for errors"
    echo "[INFO] 3. Try deploying manually later with:"
    echo "[INFO]      npx hardhat run scripts/deploy.js --network localhost"
    echo
    read -n 1 -s -r -p "Press any key to continue anyway..."
else
    echo "[SUCCESS] Contract deployed successfully."
    # Extract contract address from output if possible
    CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -iE "Deployed to|contract address|0x[a-f0-9]{40}" | head -1)
    if [ -n "$CONTRACT_ADDRESS" ]; then
        echo "[INFO] Contract address: $CONTRACT_ADDRESS"
    fi
fi

# Start backend in a new window/tab
echo
echo "[INFO] Starting backend API server..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript -e 'tell application "Terminal" to do script "cd '\''$(pwd)'\''/backend && echo \"==============================================================\" && echo \"    Backend API Server\" && echo \"==============================================================\" && echo \"[INFO] Checking backend dependencies...\" && if [ ! -d \"node_modules\" ]; then echo \"[INFO] Installing backend dependencies (this may take a moment)...\" && npm install; fi && echo && echo \"[INFO] Starting backend server...\" && echo \"[INFO] API will be available at: http://localhost:5000\" && echo \"[INFO] Health check endpoint: http://localhost:5000/health\" && echo && npm start"' &
    BACKEND_PID=$!
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd '$(pwd)'/backend; echo '=============================================================='; echo '    Backend API Server'; echo '=============================================================='; echo '[INFO] Checking backend dependencies...'; if [ ! -d \"node_modules\" ]; then echo '[INFO] Installing backend dependencies (this may take a moment)...' && npm install; fi; echo; echo '[INFO] Starting backend server...'; echo '[INFO] API will be available at: http://localhost:5000'; echo '[INFO] Health check endpoint: http://localhost:5000/health'; echo; npm start; echo; echo '[INFO] Backend server has stopped. Press Enter to close...'; read" &
        BACKEND_PID=$!
    elif command -v konsole &> /dev/null; then
        konsole -e bash -c "cd '$(pwd)'/backend; echo '=============================================================='; echo '    Backend API Server'; echo '=============================================================='; echo '[INFO] Checking backend dependencies...'; if [ ! -d \"node_modules\" ]; then echo '[INFO] Installing backend dependencies (this may take a moment)...' && npm install; fi; echo; echo '[INFO] Starting backend server...'; echo '[INFO] API will be available at: http://localhost:5000'; echo '[INFO] Health check endpoint: http://localhost:5000/health'; echo; npm start; echo; echo '[INFO] Backend server has stopped. Press Enter to close...'; read" &
        BACKEND_PID=$!
    elif command -v xterm &> /dev/null; then
        xterm -e bash -c "cd '$(pwd)'/backend; echo '=============================================================='; echo '    Backend API Server'; echo '=============================================================='; echo '[INFO] Checking backend dependencies...'; if [ ! -d \"node_modules\" ]; then echo '[INFO] Installing backend dependencies (this may take a moment)...' && npm install; fi; echo; echo '[INFO] Starting backend server...'; echo '[INFO] API will be available at: http://localhost:5000'; echo '[INFO] Health check endpoint: http://localhost:5000/health'; echo; npm start; echo; echo '[INFO] Backend server has stopped. Press Enter to close...'; read" &
        BACKEND_PID=$!
    else
        # Fallback to background process
        echo "[WARNING] No supported terminal emulator found. Running backend in background."
        cd "$(pwd)"/backend
        if [ ! -d "node_modules" ]; then
            echo "[INFO] Installing backend dependencies..."
            npm install
        fi
        echo "[INFO] Starting backend server..."
        echo "[INFO] API will be available at: http://localhost:5000"
        npm start &
        BACKEND_PID=$!
        cd "$(pwd)"
    fi
else
    # Fallback
    echo "[WARNING] Unsupported OS. Running backend in background."
    cd "$(pwd)"/backend
    if [ ! -d "node_modules" ]; then
        echo "[INFO] Installing backend dependencies..."
        npm install
    fi
    echo "[INFO] Starting backend server..."
    echo "[INFO] API will be available at: http://localhost:5000"
    npm start &
    BACKEND_PID=$!
    cd "$(pwd)"
fi

# Wait for backend to start
echo "[INFO] Waiting for backend to start (max 20 seconds)..."
if wait_for_port 5000 20; then
    echo "[SUCCESS] Backend API is ready on port 5000!"
else
    echo "[WARNING] Timeout waiting for backend to start."
    echo "[INFO] The backend may still be starting in the background. Continuing anyway..."
fi

# Start frontend in a new window/tab
echo
echo "[INFO] Starting frontend application..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript -e 'tell application "Terminal" to do script "cd '\''$(pwd)'\''/frontend && echo \"==============================================================\" && echo \"    Frontend Application\" && echo \"==============================================================\" && echo \"[INFO] Checking frontend dependencies...\" && if [ ! -d \"node_modules\" ]; then echo \"[INFO] Installing frontend dependencies (this may take a moment)...\" && npm install; fi && echo && echo \"[INFO] Starting frontend development server...\" && echo \"[INFO] Application will be available at: http://localhost:5173\" && echo && npm run dev"' &
    FRONTEND_PID=$!
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd '$(pwd)'/frontend; echo '=============================================================='; echo '    Frontend Application'; echo '=============================================================='; echo '[INFO] Checking frontend dependencies...'; if [ ! -d \"node_modules\" ]; then echo '[INFO] Installing frontend dependencies (this may take a moment)...' && npm install; fi; echo; echo '[INFO] Starting frontend development server...'; echo '[INFO] Application will be available at: http://localhost:5173'; echo; npm run dev; echo; echo '[INFO] Frontend application has stopped. Press Enter to close...'; read" &
        FRONTEND_PID=$!
    elif command -v konsole &> /dev/null; then
        konsole -e bash -c "cd '$(pwd)'/frontend; echo '=============================================================='; echo '    Frontend Application'; echo '=============================================================='; echo '[INFO] Checking frontend dependencies...'; if [ ! -d \"node_modules\" ]; then echo '[INFO] Installing frontend dependencies (this may take a moment)...' && npm install; fi; echo; echo '[INFO] Starting frontend development server...'; echo '[INFO] Application will be available at: http://localhost:5173'; echo; npm run dev; echo; echo '[INFO] Frontend application has stopped. Press Enter to close...'; read" &
        FRONTEND_PID=$!
    elif command -v xterm &> /dev/null; then
        xterm -e bash -c "cd '$(pwd)'/frontend; echo '=============================================================='; echo '    Frontend Application'; echo '=============================================================='; echo '[INFO] Checking frontend dependencies...'; if [ ! -d \"node_modules\" ]; then echo '[INFO] Installing frontend dependencies (this may take a moment)...' && npm install; fi; echo; echo '[INFO] Starting frontend development server...'; echo '[INFO] Application will be available at: http://localhost:5173'; echo; npm run dev; echo; echo '[INFO] Frontend application has stopped. Press Enter to close...'; read" &
        FRONTEND_PID=$!
    else
        # Fallback to background process
        echo "[WARNING] No supported terminal emulator found. Running frontend in background."
        cd "$(pwd)"/frontend
        if [ ! -d "node_modules" ]; then
            echo "[INFO] Installing frontend dependencies..."
            npm install
        fi
        echo "[INFO] Starting frontend development server..."
        echo "[INFO] Application will be available at: http://localhost:5173"
        npm run dev &
        FRONTEND_PID=$!
        cd "$(pwd)"
    fi
else
    # Fallback
    echo "[WARNING] Unsupported OS. Running frontend in background."
    cd "$(pwd)"/frontend
    if [ ! -d "node_modules" ]; then
        echo "[INFO] Installing frontend dependencies..."
        npm install
    fi
    echo "[INFO] Starting frontend development server..."
    echo "[INFO] Application will be available at: http://localhost:5173"
    npm run dev &
    FRONTEND_PID=$!
    cd "$(pwd)"
fi

# Wait for frontend to start and then open browser
echo "[INFO] Waiting for frontend to start (max 30 seconds)..."
if wait_for_port 5173 30; then
    echo "[SUCCESS] Frontend is ready on port 5173!"
    echo "[INFO] Opening application in default browser..."

    # Open browser based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "http://localhost:5173"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v xdg-open &> /dev/null; then
            xdg-open "http://localhost:5173"
        elif command -v gnome-open &> /dev/null; then
            gnome-open "http://localhost:5173"
        else
            echo "[INFO] Please open http://localhost:5173 in your browser"
        fi
    fi
else
    echo "[WARNING] Timeout waiting for frontend to start."
    echo "[INFO] You can manually open: http://localhost:5173"
fi

# Display service information
display_service_info

# Wait for user to press enter before exiting
echo "Press Enter to exit this setup window..."
read

# Note: We don't kill the background processes here as they're running in separate terminals
# The user can close those terminals to stop the services
exit 0