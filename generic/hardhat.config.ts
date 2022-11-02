import { HardhatUserConfig } from "hardhat/config";

import "@nomiclabs/hardhat-etherscan";
import "@nomicfoundation/hardhat-toolbox";

const ALCHEMY_API_KEY = "";
const MATIC_PRIVATE_KEY = "";
const ETHERSCAN_KEY = "";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    matic: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [MATIC_PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY,
  }
};

export default config;
