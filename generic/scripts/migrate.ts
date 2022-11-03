import { ethers } from "hardhat";

async function main() {
  const List = await ethers.getContractFactory("StringList");
  const list = await List.attach("0x4b09a3A8CF7F0aab1DC8A9D931C10958295E42b3");

  const pois = await getPois();
  console.log(`Creating ${pois.length} points of interests:`);

  for(var i=0; i < pois.length; i++) {
    console.log(`Adding ${pois[i]}`);
    await list.add(pois[i]);
  }

  // Transfer ownership to DAO Committee Gnosis Safe
  await list.transferOwnership("0xB08E3e7cc815213304d884C88cA476ebC50EaAB2");
}

async function getPois() {
  let res = await fetch("https://peer.decentraland.org/lambdas/contracts/pois");
  return await res.json();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
