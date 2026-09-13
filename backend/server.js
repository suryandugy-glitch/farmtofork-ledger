require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Web3 } = require('web3');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Web3 setup
let web3;
let contract;

// Load contract artifacts
const loadContract = () => {
  try {
    // Assuming the hardhat artifacts are in the root directory's artifacts folder
    const artifactsPath = path.resolve(__dirname, '..', 'artifacts', 'contracts', 'FarmToForkLedger.sol', 'FarmToForkLedger.json');
    if (!fs.existsSync(artifactsPath)) {
      console.warn(`Contract artifacts not found at ${artifactsPath}`);
      return false;
    }

    const { abi } = JSON.parse(fs.readFileSync(artifactsPath, 'utf8'));

    // Get contract address from deployment or environment
    const contractAddress = process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Default to first account in Hardhat node

    // In web3 4.x, we create a Web3 instance with the provider URL
    web3 = new Web3(process.env.RPC_URL || 'http://127.0.0.1:8545');
    contract = new web3.eth.Contract(abi, contractAddress);

    console.log(`Contract loaded at address: ${contractAddress}`);
    return true;
  } catch (error) {
    console.error('Failed to load contract:', error);
    return false;
  }
};

// Load contract on startup
const contractLoaded = loadContract();

// Helper to format temperature and humidity from contract (which stores *100)
const formatValue = (value) => {
  return parseFloat(value) / 100;
};

// Helper to parse temperature and humidity for contract (multiply by 100)
const parseValue = (value) => {
  return Math.round(parseFloat(value) * 100);
};

// GET /stages/:productId - Get all stages for a product
app.get('/stages/:productId', async (req, res) => {
  try {
    if (!contractLoaded) {
      return res.status(500).json({ error: 'Contract not loaded' });
    }

    const { productId } = req.params;
    const stages = await contract.methods.getStages(productId).call();

    // Format the stages for frontend
    const formattedStages = stages.map((stage, index) => ({
      id: index.toString(), // Using index as ID for simplicity
      productId,
      timestamp: Number(stage.timestamp), // Convert BigInt to number
      location: stage.location,
      notes: stage.notes,
      temperature: formatValue(stage.temperature),
      humidity: formatValue(stage.humidity),
      ipfsHash: stage.ipfsHash
    }));

    res.json(formattedStages);
  } catch (error) {
    console.error('Error fetching stages:', error);
    res.status(500).json({ error: 'Failed to fetch stages' });
  }
});

// POST /stages - Add a new stage
app.post('/stages', async (req, res) => {
  try {
    if (!contractLoaded) {
      return res.status(500).json({ error: 'Contract not loaded' });
    }

    const { productId, location, notes, temperature, humidity, ipfsHash } = req.body;

    // Validate required fields
    if (!productId || !location || !notes || temperature === undefined || humidity === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Parse temperature and humidity to integers (multiplied by 100)
    const tempInt = parseValue(temperature);
    const humidInt = parseValue(humidity);

    // Note: In a real app, you would need to sign the transaction with a private key.
    // For simplicity, we're using the first account from the Hardhat node (which is unlocked).
    // In production, you would use a wallet or middleware like metamask or ethers.js with signers.
    const accounts = await web3.eth.getAccounts();
    const fromAddress = accounts[0];

    const tx = contract.methods.addStage(
      productId,
      location,
      notes,
      tempInt,
      humidInt,
      ipfsHash || '0x0000000000000000000000000000000000000000000000000000000000000000' // default empty bytes32
    );

    const gas = await tx.estimateGas({ from: fromAddress });
    const gasPrice = await web3.eth.getGasPrice();
    const txData = tx.encodeABI();
    const txCount = await web3.eth.getTransactionCount(fromAddress);

    const signedTx = await web3.eth.accounts.signTransaction({
      from: fromAddress,
      to: contract.options.address,
      data: txData,
      gas,
      gasPrice,
      nonce: txCount
    }, process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'); // Hardhat default private key

    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    // Emit event or return success
    res.json({ success: true, transactionHash: receipt.transactionHash });
  } catch (error) {
    console.error('Error adding stage:', error);
    res.status(500).json({ error: 'Failed to add stage' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', contractLoaded });
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});