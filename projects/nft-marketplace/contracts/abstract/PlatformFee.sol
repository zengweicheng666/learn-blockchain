// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract PlatformFee is Ownable {
    uint256 public platformFee;
    uint256 public accumulatedFees;
    uint256 public constant MAX_FEE = 1000; // max 10%

    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address indexed recipient, uint256 amount);

    constructor(uint256 _initialFee) Ownable(msg.sender) {
        require(_initialFee <= MAX_FEE, "Fee too high");
        platformFee = _initialFee;
    }

    function calculateFee(uint256 amount) public view returns (uint256 feeAmount, uint256 netAmount) {
        feeAmount = (amount * platformFee) / 10000;
        netAmount = amount - feeAmount;
    }

    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= MAX_FEE, "Fee too high");
        uint256 oldFee = platformFee;
        platformFee = _newFee;
        emit PlatformFeeUpdated(oldFee, _newFee);
    }

    function withdrawFees() external onlyOwner {
        uint256 amount = accumulatedFees;
        accumulatedFees = 0;
        payable(owner()).transfer(amount);
        emit FeesWithdrawn(owner(), amount);
    }

    receive() external payable {}
}
