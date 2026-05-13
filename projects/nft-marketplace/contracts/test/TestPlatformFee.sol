// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../abstract/PlatformFee.sol";

contract TestPlatformFee is PlatformFee {
    constructor(uint256 _initialFee) PlatformFee(_initialFee) {}

    function addFees(uint256 amount) external {
        accumulatedFees += amount;
    }
}
