// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LiquidStaking is ERC20, Ownable {
    uint256 public totalEthStaked;
    uint256 public apr;
    uint256 public lastYieldTimestamp;

    event Staked(address indexed user, uint256 ethAmount, uint256 stEthAmount);
    event Unstaked(address indexed user, uint256 stEthAmount, uint256 ethAmount);
    event YieldAccrued(uint256 yieldAmount, uint256 newTotalEthStaked);

    constructor(address _owner) ERC20("Staked ETH", "stETH") Ownable(_owner) {
        apr = 500;
        lastYieldTimestamp = block.timestamp;
    }

    function getExchangeRate() public view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) return 1e18;
        return (totalEthStaked * 1e18) / supply;
    }

    function stake() public payable {
        require(msg.value > 0, "Zero deposit");

        uint256 supply = totalSupply();
        uint256 shares;
        if (supply == 0) {
            shares = msg.value;
        } else {
            shares = (msg.value * supply) / totalEthStaked;
        }

        _mint(msg.sender, shares);
        totalEthStaked += msg.value;

        emit Staked(msg.sender, msg.value, shares);
    }

    function unstake(uint256 stEthAmount) external {
        require(stEthAmount > 0, "Zero amount");
        require(balanceOf(msg.sender) >= stEthAmount, "Insufficient stETH");

        uint256 ethAmount = (stEthAmount * totalEthStaked) / totalSupply();
        _burn(msg.sender, stEthAmount);
        totalEthStaked -= ethAmount;

        payable(msg.sender).transfer(ethAmount);

        emit Unstaked(msg.sender, stEthAmount, ethAmount);
    }

    function accrueYield() external {
        uint256 timeElapsed = block.timestamp - lastYieldTimestamp;
        if (timeElapsed == 0) return;

        uint256 yieldAmount = (totalEthStaked * apr * timeElapsed) / (10000 * 365 days);
        if (yieldAmount == 0) return;

        totalEthStaked += yieldAmount;
        lastYieldTimestamp = block.timestamp;

        emit YieldAccrued(yieldAmount, totalEthStaked);
    }

    function setApr(uint256 _apr) external onlyOwner {
        apr = _apr;
    }

    receive() external payable {
        stake();
    }
}
