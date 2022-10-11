import { ethers } from "hardhat";

async function main() {
  const List = await ethers.getContractFactory("StringList");
  const list = await List.deploy("Points of Interests");

  await list.deployed();

  console.log(`List deployed to ${list.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
