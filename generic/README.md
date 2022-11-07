# Generic String List

This project has been used to deploy a [Point of Interest list](https://polygonscan.com/address/0xFEC09d5C192aaf7Ec7E2C89Cc8D3224138391B2E) in Polygon network.


Try running some of the following tasks:

```shell
npx hardhat test
npx hardhat run scripts/deploy.ts --network matic
npx hardhat verify --network matic DEPLOYED_ADDRESS "Points of Interest"
npx hardhat run scripts/migrate.ts --network matic

npx hardhat help
```
