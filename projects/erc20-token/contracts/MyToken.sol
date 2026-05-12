// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyToken
 * @notice 一个可铸造、可销毁的 ERC20 代币
 *
 * 功能：
 * - 标准 ERC20 接口（transfer, approve, transferFrom）
 * - owner 可铸造新代币（mint）
 * - 任何持币者可销毁自己的代币（burn）
 * - Transfer/Approval 事件（ERC20 标准自带）
 */
contract MyToken is ERC20, Ownable {
    constructor(
        string memory name_,
        string memory symbol_,
        address initialOwner
    ) ERC20(name_, symbol_) Ownable(initialOwner) {}

    /**
     * @notice 铸造新代币（仅 owner 可调用）
     * @param to 接收地址
     * @param amount 铸造数量（wei 单位）
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice 销毁自己的代币（任何持币者可调用）
     * @param amount 销毁数量（wei 单位）
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
