require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const FUJI_RPC_URL = process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
const AVALANCHE_RPC_URL = process.env.AVALANCHE_RPC_URL || "https://api.avax.network/ext/bc/C/rpc";

const accounts = PRIVATE_KEY ? [PRIVATE_KEY] : [];

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    version: "0.8.26",
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    hardhat: {},
    fuji: { url: FUJI_RPC_URL, accounts },
    avalanche: { url: AVALANCHE_RPC_URL, accounts }
  },
  paths: {
    sources: "blockchain/contracts",
    tests: "backend/tests",
    cache: "blockchain/cache",
    artifacts: "blockchain/artifacts"
  }
};

module.exports = config;


