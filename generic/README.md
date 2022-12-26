# Generic String List

This project has been used to deploy:
*  [Point of Interest list](https://polygonscan.com/address/0xFEC09d5C192aaf7Ec7E2C89Cc8D3224138391B2E) in Matic network.
*  [Point of Interest list](https://mumbai.polygonscan.com/address/0x08E5a5288D6bBa9383724C57175C03A37fe83A2A) in Mumbai network (testnet).


Try running some of the following tasks:

```shell
npx hardhat test
npx hardhat run scripts/deploy.ts --network matic
npx hardhat verify --network matic DEPLOYED_ADDRESS "Points of Interest"
npx hardhat run scripts/migrate.ts --network matic

npx hardhat help
```
