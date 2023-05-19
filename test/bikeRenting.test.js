const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Bike Renting Unit Test", () => {
      let deployer, accounts, bikeRenting;
      beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(["bikeRenting"]);
        bikeRenting = await ethers.getContract("BikeRenting");
      });

      describe("Constructor", () => {
        it("Initializes correctly", async () => {
          console.log("its constructor");
          const amount = await bikeRenting.getAmount();
          const extraAmount = await bikeRenting.getExtraAmount();
          assert.equal(amount.toString(), "1");
          assert.equal(extraAmount.toString(), "1");
        });
      });

      describe("RentBike", () => {
        it("reverts when not sent enough amount", async () => {
          expect(bikeRenting.rentBike()).to.be.revertedWith(
            "BikeRenting__payWithExtraAmount"
          );
        });
        it("emits an event", async () => {
          const amount = await bikeRenting.getAmount();
          const extraAmount = await bikeRenting.getExtraAmount();
          expect(bikeRenting.rentBike({ value: amount + extraAmount })).to.emit(
            "BikeRented"
          );
        });
        it("gets the bike status", async () => {
          expect(bikeRenting.getBikeStatus()).to.be.revertedWith(
            "BikeRenting__AlreadyOnRent"
          );
        });
        it("reverts when there is no money", async () => {
          expect(bikeRenting.withdraw()).to.be.revertedWith(
            "BikeRenting__TransferFailed"
          );

          const endingBalance = await bikeRenting.provider.getBalance(
            bikeRenting.address
          );
          console.log(endingBalance);
          assert.equal(endingBalance, 0);
        });

        it("withdraw Eth from contract", async () => {
          const amount = await bikeRenting.getAmount();
          const extraAmount = await bikeRenting.getExtraAmount();

          const rent = await bikeRenting.rentBike(10, "", {
            value: amount + extraAmount,
          });

          const startingContractBalance = await bikeRenting.provider.getBalance(
            bikeRenting.address
          );
          const startingDeployerBalance = await bikeRenting.provider.getBalance(
            deployer.address
          );

          // Act
          const txResponse = await bikeRenting.withdraw();
          const txReceipt = await txResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = txReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice).toString();

          const endingContractBalance = await bikeRenting.provider.getBalance(
            bikeRenting.address
          );
          const endingDeployerBalance = await bikeRenting.provider.getBalance(
            deployer.address
          );
          // console.log("starting Contract balance => ", startingContractBalance.toString());
          // console.log("ending Contract balance => ", endingDeployerBalance.toString());
          // console.log("starting Deployer balance => ", startingDeployerBalance.toString());
          // console.log("ending Deployer balance => ", endingDeployerBalance.toString());
          // console.log("Gas Cost => ", gasCost);

          // console.log("Adding startingContractBalance with deployerBalance => ",startingContractBalance.add(startingDeployerBalance).toString());
          // console.log("Adding endingDeployerBalance with gasCost => ",endingDeployerBalance.add(gasCost).toString());

          // Assert
          // assert.equal(endingDeployerBalance, 0);
          assert.equal(
            startingContractBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString() - extraAmount
          );
        });
      });
      describe("GetExtraPaymentBack", () => {
        it("reverts when caller is not the owner of money", async () => {
          expect(bikeRenting.getExtraPaymentBack()).to.be.revertedWith(
            "BikeRenting__YouAreNotTheOwnerOfThisMoney"
          );
        });
      });
    });
