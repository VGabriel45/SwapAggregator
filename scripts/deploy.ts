const { ethers } = require("hardhat");
import {Contract, ContractFactory} from "ethers";

async function main() {
  const AggregatorContract: ContractFactory = await ethers.getContractFactory("Aggregator");
  const aggregator: Contract = await AggregatorContract.deploy();  

  await aggregator.deployed();

  console.log(`Aggregator deployed at address ${aggregator.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});