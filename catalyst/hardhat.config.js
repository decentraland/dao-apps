require("dotenv").config();

require("@1hive/hardhat-aragon");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-web3");
require("hardhat-deploy");
require("hardhat-gas-reporter");
require("solidity-coverage");

const { node_url, accounts } = require("./utils/network");

process.removeAllListeners("warning");
module.exports = {
  solidity: {
    version: "0.4.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000,
      },
    },
  },
  aragon: {
    appEnsName: "catalyst.open.aragonpm.eth",
    appContractName: "CatalystApp",
    appRoles: [
      {
        name: "Add Remove catalyst",
        id: "MODIFY_ROLE",
        params: [],
      },
    ],
  },
  networks: {
    hardhat: {
      // process.env.HARDHAT_FORK will specify the network that the fork is made from.
      // this line ensure the use of the corresponding accounts
      accounts: accounts(process.env.HARDHAT_FORK),
      forking: process.env.HARDHAT_FORK
        ? {
            url: node_url(process.env.HARDHAT_FORK),
            blockNumber: process.env.HARDHAT_FORK_NUMBER
              ? parseInt(process.env.HARDHAT_FORK_NUMBER)
              : undefined,
          }
        : undefined,
    },
    localhost: {
      url: node_url("localhost"),
      accounts: accounts(),
      ensRegistry: "0x4E065c622d584Fbe5D9078C3081840155FA69581",
    },
    mainnet: {
      url: node_url("mainnet"),
      accounts: accounts("mainnet"),
    },
    rinkeby: {
      url: node_url("rinkeby"),
      accounts: accounts("rinkeby"),
      ensRegistry: "0x98Df287B6C145399Aaa709692c8D308357bC085D",
    },
    ropsten: {
      url: node_url("ropsten"),
      accounts: accounts("ropsten"),
      ensRegistry: "0x6afe2cacee211ea9179992f89dc61ff25c61e923",
    },
    xdai: {
      url: node_url("xdai"),
      accounts: accounts("xdai"),
      ensRegistry: "0xaafca6b0c89521752e559650206d7c925fd0e530",
    },
    polygon: {
      url: node_url("polygon"),
      accounts: accounts("polygon"),
      ensRegistry: "0x4E065c622d584Fbe5D9078C3081840155FA69581",
    },
    frame: {
      url: "http://localhost:1248",
      httpHeaders: { origin: "hardhat" },
    },
  },
  ipfs: {
    pinata: {
      key: process.env.PINATA_KEY || "",
      secret: process.env.PINATA_SECRET_KEY || "",
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
  },
  mocha: {
    timeout: 0,
  },
  external: process.env.HARDHAT_FORK
    ? {
        contracts: [
          {
            artifacts: "node_modules/@aragon/os/build/contracts",
          },
        ],
        deployments: {
          // process.env.HARDHAT_FORK will specify the network that the fork is made from.
          // these lines allow it to fetch the deployments from the network being forked from both for node and deploy task
          hardhat: ["deployments/" + process.env.HARDHAT_FORK],
          localhost: ["deployments/" + process.env.HARDHAT_FORK],
        },
      }
    : {
        contracts: [
          {
            artifacts: "node_modules/@aragon/os/build/contracts",
          },
        ],
      },
};
