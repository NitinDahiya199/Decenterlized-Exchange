// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract DemoStaking is Ownable {
    IERC20 public immutable stakeToken;
    IERC20 public immutable rewardToken;
    uint256 public rewardRate;
    uint256 public totalStaked;

    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public lastUpdate;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 rewardRate);

    constructor(address stakeToken_, address rewardToken_, uint256 rewardRate_, address owner_) Ownable(owner_) {
        require(stakeToken_ != address(0), "stake zero");
        require(rewardToken_ != address(0), "reward zero");
        stakeToken = IERC20(stakeToken_);
        rewardToken = IERC20(rewardToken_);
        rewardRate = rewardRate_;
    }

    function earned(address account) public view returns (uint256) {
        uint256 elapsed = block.timestamp - lastUpdate[account];
        return rewards[account] + (balanceOf[account] * rewardRate * elapsed) / 1e18;
    }

    function stake(uint256 amount) external {
        require(amount > 0, "zero amount");
        _checkpoint(msg.sender);
        stakeToken.transferFrom(msg.sender, address(this), amount);
        balanceOf[msg.sender] += amount;
        totalStaked += amount;
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "zero amount");
        require(balanceOf[msg.sender] >= amount, "insufficient stake");
        _checkpoint(msg.sender);
        balanceOf[msg.sender] -= amount;
        totalStaked -= amount;
        stakeToken.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function claim() external returns (uint256 reward) {
        _checkpoint(msg.sender);
        reward = rewards[msg.sender];
        require(reward > 0, "no reward");
        rewards[msg.sender] = 0;
        rewardToken.transfer(msg.sender, reward);
        emit RewardPaid(msg.sender, reward);
    }

    function setRewardRate(uint256 rewardRate_) external onlyOwner {
        rewardRate = rewardRate_;
        emit RewardRateUpdated(rewardRate_);
    }

    function _checkpoint(address account) private {
        rewards[account] = earned(account);
        lastUpdate[account] = block.timestamp;
    }
}
