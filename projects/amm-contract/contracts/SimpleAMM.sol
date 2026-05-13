// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SimpleAMM
 * @notice 恒定乘积做市商 x * y = k，支持双代币池
 *
 * 功能：
 * - addLiquidity：添加流动性，获得 LP 代币
 * - removeLiquidity：销毁 LP 代币，取回流动性
 * - swap：代币兑换（0.3% 手续费）
 *
 * 公式：
 * - k = reserveA * reserveB（恒定乘积）
 * - Δout = reserveOut * (Δin * 997/1000) / (reserveIn + Δin * 997/1000)
 */
contract SimpleAMM is ERC20 {
    using SafeERC20 for IERC20;

    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;

    uint256 public reserveA;
    uint256 public reserveB;

    uint256 public constant FEE_NUMERATOR = 997;
    uint256 public constant FEE_DENOMINATOR = 1000;

    event LiquidityAdded(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 shares
    );
    event LiquidityRemoved(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 shares
    );
    event Swapped(
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(address _tokenA, address _tokenB) ERC20("AMM-LP", "LP") {
        require(_tokenA != _tokenB, "Identical tokens");
        // 合约内部按地址排序，外部无需关心顺序
        if (_tokenA < _tokenB) {
            tokenA = IERC20(_tokenA);
            tokenB = IERC20(_tokenB);
        } else {
            tokenA = IERC20(_tokenB);
            tokenB = IERC20(_tokenA);
        }
    }

    // ── 添加流动性 ──────────────────────────────────────

    function addLiquidity(
        uint256 amountADesired,
        uint256 amountBDesired
    ) external returns (uint256 amountA, uint256 amountB, uint256 shares) {
        if (reserveA == 0 && reserveB == 0) {
            // 首次添加：接受任意比例
            amountA = amountADesired;
            amountB = amountBDesired;
            shares = _sqrt(amountA * amountB);
        } else {
            // 按当前比例计算最优输入量
            uint256 amountBOptimal = (amountADesired * reserveB) / reserveA;
            if (amountBOptimal <= amountBDesired) {
                amountA = amountADesired;
                amountB = amountBOptimal;
            } else {
                amountA = (amountBDesired * reserveA) / reserveB;
                amountB = amountBDesired;
            }
            shares = _min(
                (amountA * totalSupply()) / reserveA,
                (amountB * totalSupply()) / reserveB
            );
        }

        require(shares > 0, "Zero shares minted");

        tokenA.safeTransferFrom(msg.sender, address(this), amountA);
        tokenB.safeTransferFrom(msg.sender, address(this), amountB);

        _mint(msg.sender, shares);
        _updateReserves();

        emit LiquidityAdded(msg.sender, amountA, amountB, shares);
    }

    // ── 移除流动性 ──────────────────────────────────────

    function removeLiquidity(
        uint256 shares
    ) external returns (uint256 amountA, uint256 amountB) {
        require(shares > 0, "Zero shares");
        require(shares <= balanceOf(msg.sender), "Insufficient LP balance");

        amountA = (reserveA * shares) / totalSupply();
        amountB = (reserveB * shares) / totalSupply();

        require(amountA > 0 && amountB > 0, "Zero output");

        _burn(msg.sender, shares);

        reserveA -= amountA;
        reserveB -= amountB;

        tokenA.safeTransfer(msg.sender, amountA);
        tokenB.safeTransfer(msg.sender, amountB);

        emit LiquidityRemoved(msg.sender, amountA, amountB, shares);
    }

    // ── 兑换 ────────────────────────────────────────────

    function swap(
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut) {
        require(amountIn > 0, "Zero amount");

        bool isTokenA = tokenIn == address(tokenA);
        require(isTokenA || tokenIn == address(tokenB), "Invalid token");

        uint256 reserveIn = isTokenA ? reserveA : reserveB;
        uint256 reserveOut = isTokenA ? reserveB : reserveA;

        // 0.3% 手续费
        uint256 amountInWithFee = (amountIn * FEE_NUMERATOR) / FEE_DENOMINATOR;
        amountOut =
            (reserveOut * amountInWithFee) /
            (reserveIn + amountInWithFee);

        require(amountOut >= minAmountOut, "Insufficient output");
        require(amountOut < reserveOut, "Insufficient liquidity");

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(isTokenA ? address(tokenB) : address(tokenA)).safeTransfer(
            msg.sender,
            amountOut
        );

        _updateReserves();

        emit Swapped(
            msg.sender,
            tokenIn,
            isTokenA ? address(tokenB) : address(tokenA),
            amountIn,
            amountOut
        );
    }

    // ── 查询 ────────────────────────────────────────────

    function getAmountOut(
        address tokenIn,
        uint256 amountIn
    ) public view returns (uint256) {
        bool isTokenA = tokenIn == address(tokenA);
        require(isTokenA || tokenIn == address(tokenB), "Invalid token");

        uint256 reserveIn = isTokenA ? reserveA : reserveB;
        uint256 reserveOut = isTokenA ? reserveB : reserveA;

        uint256 amountInWithFee = (amountIn * FEE_NUMERATOR) / FEE_DENOMINATOR;
        return (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);
    }

    // ── 内部 ────────────────────────────────────────────

    function _updateReserves() internal {
        reserveA = tokenA.balanceOf(address(this));
        reserveB = tokenB.balanceOf(address(this));
    }

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
