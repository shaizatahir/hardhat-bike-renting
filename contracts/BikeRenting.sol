// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

error BikeRenting__NotOwner();
error BikeRenting__payWithExtraAmount();
error BikeRenting__TransferFailed();
error BikeRenting__AlreadyOnRent();
error BikeRenting__YouAreNotTheOwnerOfThisMoney();


contract BikeRenting {
    event BikeRented(
        address indexed rentee,
        uint256 bike_Model, 
        string bike_color, 
        uint256 rentAmount, 
        Status bike_status
        );

    struct Bike {
        string color;
        address bikeRentee;
        Status bikeStatus;
    }
    enum Status {
        Available,
        OnRent
    }
    Status private s_status;

    mapping(uint256 => Bike) private s_bikes;
 
    mapping(address => uint256) private s_amountTransfer;

    uint256 internal immutable i_amount;
    uint256 internal immutable i_extraAmount;
    address public immutable i_owner;

     modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert BikeRenting__NotOwner();
        }
        _;
    }

    constructor(uint256 amount, uint256 extraAmount) {
        i_amount = amount;
        i_extraAmount = extraAmount;
        i_owner = msg.sender;
        
    }
    
    function rentBike(uint256 bikeModel, string memory bikeColor) public payable {

        if(msg.value <= i_amount){
            revert BikeRenting__payWithExtraAmount();
        }

        Bike storage BikeToRent = s_bikes[bikeModel];
        if(BikeToRent.bikeStatus == Status.OnRent){
            revert BikeRenting__AlreadyOnRent();
        }

        s_bikes[bikeModel] = Bike(bikeColor, msg.sender, Status.OnRent);
        s_amountTransfer[i_owner] += msg.value; 
        emit BikeRented(msg.sender, bikeModel, bikeColor, i_amount, Status.OnRent);
    }


    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount - (i_extraAmount)}("");
        if(!success){
            revert BikeRenting__TransferFailed();
        }
    }

    function getExtraPaymentBack(address payable rentee, uint256 bikeModel ) public payable {
        Bike storage paymentBackToRentee = s_bikes[bikeModel];
        if(paymentBackToRentee.bikeRentee == rentee){
            (bool success, ) = rentee.call{value: i_extraAmount}("");
        }else {
            revert BikeRenting__YouAreNotTheOwnerOfThisMoney();
        }
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getBike(uint256 bikeModel) public view returns(Bike memory){
        return s_bikes[bikeModel];
    }

    function getBalance() public view returns(uint256) {
        return address(this).balance;
    }

    function getAmount() public view returns(uint256) {
        return i_amount;
    }

    function getExtraAmount() public view returns(uint256) {
        return i_extraAmount;
    }

    function getBikeStatus(uint256 bikeModel) public view returns(Bike memory) {
        return s_bikes[bikeModel];
    }
}