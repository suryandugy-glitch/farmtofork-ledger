const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const FarmToForkLedger = await hre.ethers.getContractFactory("FarmToForkLedger");
  const farmToForkLedger = await FarmToForkLedger.deploy();

  await farmToForkLedger.deployed();

  const address = farmToForkLedger.address;
  console.log("FarmToForkLedger deployed to:", address);

  // Write the address to .contract-address in the root
  const rootPath = path.resolve(__dirname, '..');
  const contractAddressPath = path.join(rootPath, '.contract-address');
  fs.writeFileSync(contractAddressPath, address, { encoding: 'utf8' });

  return address;
}

main()
  .then(address => {
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });