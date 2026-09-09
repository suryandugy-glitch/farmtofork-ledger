# Features Added

## Frontend Updates
- Added temperature and humidity fields to the product stage form
- Updated the stages table to display temperature and humidity columns
- Integrated with backend API to fetch and add stages
- Added loading states for API calls
- Added toast notifications for user feedback (success, error, info)
- Updated form handling to convert date to Unix timestamp for backend
- Added axios dependency for HTTP requests

## Backend Updates
- Created Express server with CORS and JSON middleware
- Integrated Web3.js to interact with the FarmToForkLedger smart contract
- Added endpoints:
  - GET /stages/:productId - Retrieve all stages for a product
  - POST /stages - Add a new stage to the product
- Added helper functions to format temperature and humidity (contract stores values multiplied by 100)
- Added transaction signing using Hardhat's default private key (for development)
- Added health check endpoint
- Added .env file for configuration

## Smart Contract
- Already updated to include:
  - temperature (uint256, in Celsius * 100)
  - humidity (uint256, in percentage * 100)
  - ipfsHash (bytes32, for storing IPFS hash of detailed data)

## How to Run
1. Start the local Ethereum network, deploy contract, and start both backend and frontend:
   - Windows: run.bat
   - macOS/Linux: run.sh

2. The application will be available at:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

## Notes
- The backend uses the first account from Hardhat node (unlocked) for transaction signing
- In production, you would want to use a more secure method for handling private keys
- The IPFS hash field is currently set to a default empty value; in a real implementation, you would upload data to IPFS and use the resulting hash