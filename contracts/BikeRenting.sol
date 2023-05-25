// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

contract BikeRenting {
    event BikeListed(uint256 bikeModel, string bikeColor);
    event BikeRented(
        address indexed rentee,
        uint256 bikeModel, 
        string bikeColor, 
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
    

    mapping(uint256 => Bike) private s_bikes;
 
    mapping(address => uint256) private s_amountTransfer;

    uint256 internal immutable i_rentAmount;
    uint256 internal immutable i_extraAmount;
    address public immutable i_owner;
    uint256 public storeExtraAmount;


     modifier onlyOwner() {
        require(msg.sender == i_owner, "BikeRenting__NotOwner");
        _;
    }

    constructor(uint256 rentAmount, uint256 extraAmount) {
        require(rentAmount > 0, "Invalid rent amount");
        require(extraAmount > 0, "Invalid extra amount");
        i_rentAmount = rentAmount;
        i_extraAmount = extraAmount;
        i_owner = msg.sender;
        
    }
    function listBikes(uint256 bikeModel, string memory bikeColor) external onlyOwner {
        require(bikeModel > 0, "Invalid bike model");
        s_bikes[bikeModel] = Bike(bikeColor, i_owner, Status.Available);

        // bike listed event
        emit BikeListed(bikeModel, bikeColor);
    }
    
    function rentBike(uint256 bikeModel, string memory bikeColor) public payable {
    uint256 totalAmount = i_rentAmount + i_extraAmount;
    require(msg.value == totalAmount, "Incorrect payment amount");
    
    Bike storage bikeToRent = s_bikes[bikeModel];
    //require(bikeToRent.bikeStatus != Status.OnRent, "Bike already rented");
    require(bikeToRent.bikeStatus == Status.Available, "Bike not available for rent");
    
    bikeToRent.color = bikeColor;
    bikeToRent.bikeRentee = msg.sender;
    bikeToRent.bikeStatus = Status.OnRent;
    
    storeExtraAmount += i_extraAmount;
    s_amountTransfer[i_owner] += msg.value; 
    emit BikeRented(msg.sender, bikeModel, bikeColor, i_rentAmount, Status.OnRent);
    }

    function returnBikeToOwner(uint256 bikeModel) public {
        Bike storage bikeToReturn = s_bikes[bikeModel];
        require(bikeToReturn.bikeStatus == Status.OnRent, "Bike not rented");

        bikeToReturn.bikeStatus = Status.Available;
        bikeToReturn.bikeRentee = address(0);

        payable(msg.sender).transfer(i_extraAmount);
    }


    function withdraw() public onlyOwner {
    uint256 amount = address(this).balance - storeExtraAmount;
    require(amount > 0, "Insufficient balance");

    (bool success, ) = payable(msg.sender).call{value: amount}("");
    require(success, "Transfer failed");
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
        return i_rentAmount;
    }

    function getExtraAmount() public view returns(uint256) {
        return i_extraAmount;
    }

    function getBikeStatus(uint256 bikeModel) public view returns(Status) {
        return s_bikes[bikeModel].bikeStatus;
    }
}
