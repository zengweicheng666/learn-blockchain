// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title Counter
 * @notice 一个简单的计数器合约，用于学习 Solidity 基础
 *
 * 功能：
 * - increment()  计数器 +1
 * - decrement()  计数器 -1（不可低于 0）
 * - reset()      计数器归零
 * - getCount()   查看当前计数
 *
 * 事件：
 * - CountChanged(uint newCount)  每次计数变化时触发
 */

contract Counter {
    // ── 状态变量 ───────────────────────────────────────
    uint256 private count;

    // ── 事件 ────────────────────────────────────────────
    event CountChanged(uint256 newCount);

    // ── 构造函数 ──────────────────────────────────────
    constructor() {
        count = 0;
    }

    // ── 写函数 ─────────────────────────────────────────
    function increment() external {
        count += 1;
        emit CountChanged(count);
    }

    function decrement() external {
        require(count > 0, "Counter: 不能低于 0");
        count -= 1;
        emit CountChanged(count);
    }

    function reset() external {
        count = 0;
        emit CountChanged(count);
    }

    // ── 读函数 ─────────────────────────────────────────
    function getCount() external view returns (uint256) {
        return count;
    }
}
