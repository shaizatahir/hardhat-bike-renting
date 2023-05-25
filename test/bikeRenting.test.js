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
          //assert.equal(bikeRenting.getOwner(), deployer.address);
        });

        describe("ListBike", () => {
          const bikeModel = 1;
          const bikeColor = "red";
          it("list bikes", async () => {
            await bikeRenting.listBikes(bikeModel, bikeColor);
            // Checking Is bike get listed
            const listedBike = await bikeRenting.getBike(bikeModel);
            // console.log("listedBike => ", listedBike);
            // console.log("bikeModel => ", listedBike.bikeStatus);
            // console.log("bikeColor => ", listedBike.color);
            assert.equal(listedBike.bikeStatus, 0);
            assert.equal(listedBike.color, bikeColor);
          });
          it("emits an event", async () => {
            expect(bikeRenting.listBikes(bikeModel, bikeColor)).to.emit(
              "BikeListed"
            );
          });
        });
        describe("RentBike", () => {
          const bikeModel = 1;
          const bikeColor = "red";
          it("should rent a bike when payment is correct", async () => {
            const rentAmount = await bikeRenting.getAmount();
            const extraAmount = await bikeRenting.getExtraAmount();
            const totalAmount = rentAmount.toNumber() + extraAmount.toNumber();
            // List a bike for renting
            await bikeRenting.listBikes(bikeModel, bikeColor);

            // Rent the bike with correct payment
            const rentTx = await bikeRenting.rentBike(bikeModel, bikeColor, {
              value: totalAmount,
            });

            // Retrieve the rented bike from the contract
            const rentedBike = await bikeRenting.getBike(bikeModel);

            // Assert that the bike status and rentee have been updated correctly
            assert.equal(rentedBike.bikeStatus, 1, "Incorrect bike status");
            assert.equal(rentedBike.color, bikeColor, "Incorrect bike color");
          });
          it("emits an event", async () => {
            const rentAmount = await bikeRenting.getAmount();
            const extraAmount = await bikeRenting.getExtraAmount();
            const totalAmount = rentAmount.toNumber() + extraAmount.toNumber();
            expect(
              bikeRenting.rentBike(bikeModel, bikeColor, { value: totalAmount })
            ).to.emit("BikeRented");
          });
          it("should revert when payment amount is incorrect", async () => {
            const rentAmount = await bikeRenting.getAmount();
            const extraAmount = await bikeRenting.getExtraAmount();
            const incorrectAmount = rentAmount + extraAmount + 1;
            expect(
              bikeRenting.rentBike(bikeModel, bikeColor, {
                value: incorrectAmount,
              })
            ).to.be.revertedWith("Incorrect payment amount");
          });
          it("should revert when trying to rent an already rented bike", async () => {
            const rentAmount = await bikeRenting.getAmount();
            const extraAmount = await bikeRenting.getExtraAmount();
            const totalAmount = rentAmount.toNumber() + extraAmount.toNumber();
            await bikeRenting.rentBike(bikeModel, bikeColor, {
              value: totalAmount,
            });
            expect(
              bikeRenting.rentBike(bikeModel, bikeColor, { value: totalAmount })
            ).to.be.revertedWith("Bike not available for rent");
          });
          it("should return a rented bike", async () => {
            const rentAmount = await bikeRenting.getAmount();
            const extraAmount = await bikeRenting.getExtraAmount();
            const totalAmount = rentAmount.toNumber() + extraAmount.toNumber();
            await bikeRenting.rentBike(bikeModel, bikeColor, {
              value: totalAmount,
            });
            // Return the rented bike to the owner
            const returnTx = await bikeRenting.returnBikeToOwner(bikeModel);
            // Retrieve the returned bike from the contract
            const returnedBike = await bikeRenting.getBike(bikeModel);

            assert.equal(returnedBike.bikeStatus, 0);
            assert.equal(returnedBike.bikeRentee, 0);

            // extra payment back to owner...
          });
          it("should revert when trying to return an available bike", async () => {
            expect(bikeRenting.returnBikeToOwner(bikeModel)).to.be.revertedWith(
              "Bike not rented"
            );
          });
        });
        describe("Withdraw", () => {
          it("withdraw Eth from contract", async () => {
            const rentAmount = await bikeRenting.getAmount();
            const extraAmount = await bikeRenting.getExtraAmount();
            const totalAmount = rentAmount.toNumber() + extraAmount.toNumber();

            await bikeRenting.rentBike(10, "red", {
              value: totalAmount,
            });

            const startingContractBalance =
              await bikeRenting.provider.getBalance(bikeRenting.address);
            const startingDeployerBalance =
              await bikeRenting.provider.getBalance(deployer.address);

            // Act
            const txResponse = await bikeRenting.withdraw();
            const txReceipt = await txResponse.wait(1);
            const gasCost = txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice);

            const endingContractBalance = await bikeRenting.provider.getBalance(
              bikeRenting.address
            );
            const endingDeployerBalance = await bikeRenting.provider.getBalance(
              deployer.address
            );

            const expectedEndingDeployerBalance = startingDeployerBalance
              .add(startingContractBalance)
              .sub(gasCost)
              .sub(extraAmount);

            assert.equal(
              endingDeployerBalance.toString(),
              expectedEndingDeployerBalance.toString()
            );
          });
        });
      });
    });
