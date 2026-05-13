// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

/**
 * @title VoteToken
 * @notice 治理投票代币，支持委托投票（ERC20Votes）
 *
 * 核心功能：
 * - 标准 ERC20（可铸造）
 * - 委托投票：将投票权委托给自己或他人
 * - 投票权快照：每次转账自动更新投票权
 */
contract VoteToken is ERC20, ERC20Permit, ERC20Votes {
    constructor() ERC20("VoteToken", "VOTE") ERC20Permit("VoteToken") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    // ── OZ v5 必需的重写 ───────────────────────────────

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(
        address owner
    ) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
