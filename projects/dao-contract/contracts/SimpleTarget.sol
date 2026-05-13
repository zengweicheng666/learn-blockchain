// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title SimpleTarget
 * @notice DAO 治理的目标合约，只有 DAO 可以修改其状态
 */
contract SimpleTarget {
    address public dao;
    uint256 public value;

    constructor(address _dao) {
        dao = _dao;
    }

    function setValue(uint256 _value) external {
        require(msg.sender == dao, "Only DAO");
        value = _value;
    }
}
