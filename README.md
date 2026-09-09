# FarmToFork Ledger

A blockchain-based supply chain tracking system for agricultural products, built for transparency from farm to fork.

## 🌟 Features

- **Blockchain Traceability**: Records every stage of a product's journey on the Ethereum blockchain
- **Multi-language Support**: English, Hindi, Bengali (easily extensible)
- **Dark/Light Mode**: With system preference detection and persistence
- **Modern UI**: Built with React, Vite, and Tailwind CSS
- **Animations**: Smooth transitions using Framer Motion
- **Accessibility**: ARIA labels, focus management, color contrast
- **Real-time Updates**: View product stages as they're added
- **Data Export**: Export stage data for reporting
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

- **Smart Contract**: Solidity contract (`FarmToForkLedger.sol`) for storing product stage hashes
- **Backend**: Node.js/Express API for interacting with the smart contract
- **Frontend**: React/Vite interface for farmers and consumers
- **Blockchain Development**: Hardhat setup for local testing and deployment

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/suryandugy-glitch/farmtofork-ledger.git
   cd farmtofork-ledger
   ```

2. Install dependencies for all parts:
   ```bash
   # Root directory
   npm install
   
   # Backend
   cd backend && npm install
   
   # Frontend
   cd frontend && npm install
   ```

### Running the Project

1. Start a local Ethereum network:
   ```bash
   npx hardhat node
   ```

2. Deploy the smart contract (in a new terminal):
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```
   *Note: You'll need to create a deploy.js script in the scripts folder*

3. Start the backend server (in a new terminal):
   ```bash
   cd backend && node server.js
   ```

4. Start the frontend development server (in a new terminal):
   ```bash
   cd frontend && npm run dev
   ```

5. Open your browser to `http://localhost:5173` to use the application.

## 📁 Project Structure

```
farmtofork-ledger/
├── contracts/                 # Smart contracts
│   └── FarmToForkLedger.sol   # Main Solidity contract
├── backend/                   # Node.js/Express backend
│   ├── server.js              # Main server file
│   ├── package.json           # Backend dependencies
│   └── .env                   # Environment variables
├── frontend/                  # React/Vite frontend
│   ├── src/                   # Source code
│   │   ├── App.jsx            # Main application component
│   │   ├── i18n.js            # Internationalization setup
│   │   ├── locales/           # Translation files (en, hi, bn)
│   │   ├── index.css          # Global styles and animations
│   │   └── main.jsx           # Entry point
│   ├── public/                # Static assets
│   ├── package.json           # Frontend dependencies
│   └── vite.config.js         # Vite configuration
├── hardhat.config.js          # Hardhat configuration
├── README.md                  # This file
└── package.json               # Root package.json
```

## 🔧 Smart Contract

The `FarmToForkLedger.sol` contract provides:
- `addStageHash(productId, stageHash)`: Add a stage hash for a product
- `getStageHashes(productId)`: Retrieve all stage hashes for a product
- `getStageCount(productId)`: Get the number of stages for a product

## 🌐 API Endpoints (Backend)

The backend provides RESTful endpoints for:
- `GET /api/stages/:productId`: Get all stages for a product
- `POST /api/stages`: Add a new stage
- `GET /api/products`: List all products
- *(Additional endpoints can be added as needed)*

## 🌍 Internationalization

The frontend supports multiple languages:
- English (en) - default
- Hindi (hi)
- Bengali (bn)

To add a new language:
1. Create a new JSON file in `frontend/src/locales/` (e.g., `es.json` for Spanish)
2. Add the translation object to `frontend/src/i18n.js`
3. The language selector in the navbar will automatically include the new language

## 🎨 Themes

The application automatically detects the user's system preference for dark/light mode and allows manual toggling via the navbar. The preference is saved in localStorage.

## 💡 Hackathon Ready

This project is designed to be easily extensible for hackathons:
- Add more data fields to stages (temperature, humidity, GPS coordinates)
- Integrate with IPFS/Filecoin for storing large data files
- Add smart contract functions for payments or penalties
- Implement user authentication and roles (farmer, processor, retailer, consumer)
- Add QR code scanning for product identification
- Generate PDF reports of product journeys

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by blockchain supply chain solutions
- Built with Hardhat, React, Vite, Tailwind CSS, and Framer Motion
- Icons and illustrations from open-source resources