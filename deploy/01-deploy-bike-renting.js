const { network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const { ethers } = require("ethers");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("----------------------------------");

  const amount = 1;
  const ExtraAmount = 1;

  const bikeRenting = await deploy("BikeRenting", {
    from: deployer,
    args: [amount, ExtraAmount],
    log: true,
    waitConfirmations: network.config.blockConfirmation || 1,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.POLYGONSCAN_API_KEY
  ) {
    log("Verifying...");
    await verify(bikeRenting.address, args);
  }
  log("---------------Deploying BikeRenting---------------");
};
module.exports.tags = ["all", "bikeRenting"];
