#!/bin/bash

# FarmToFork Ledger - One Click Run Script for macOS/Linux

echo "Starting FarmToFork Ledger..."

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if we are in the right directory
if [ ! -f "hardhat.config.js" ]; then
    echo "Please run this script from the root of the FarmToFork Ledger project."
    exit 1
fi

# Start local Ethereum network in the background
echo "Starting local Ethereum network..."
npx hardhat node &
HARDHAT_PID=$!

# Wait for the node to start
sleep 5

# Deploy the contract
echo "Deploying contract..."
CONTRACT_ADDRESS=$(npx hardhat run scripts/deploy.js --network localhost)
if [ $? -ne 0 ]; then
    echo "Contract deployment failed. Check the hardhat node logs."
    kill $HARDHAT_PID
    exit 1
fi
echo "Contract deployed at: $CONTRACT_ADDRESS"

# Start backend in the background
echo "Starting backend..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend in the background
echo "Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo
echo "All services have been started!"
echo
echo "Check the logs in the terminal windows (or background jobs)."
echo "To stop all services, run: kill $HARDHAT_PID $BACKEND_PID $FRONTEND_PID"
echo "Or simply close this terminal and the background processes will be terminated."

# Wait for any of the processes to exit (so the script doesn't exit immediately)
wait -n

# If one process exits, we might want to terminate the others
echo "One of the services has stopped. Shutting down..."
kill $HARDHAT_PID 2>/dev/null
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null

exit 0