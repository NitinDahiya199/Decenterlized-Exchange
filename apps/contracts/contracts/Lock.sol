// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/** @dev Placeholder contract so `hardhat compile` succeeds; replace with DEX modules later. */
contract Lock {
    uint256 public immutable unlockTime;
    address payable public owner;

    event Withdrawal(uint256 amount, uint256 when);

    constructor(uint256 _unlockTime) payable {
        require(block.timestamp < _unlockTime, "Unlock time not in future");
        unlockTime = _unlockTime;
        owner = payable(msg.sender);
    }

    function withdraw() external {
        require(block.timestamp >= unlockTime, "Not yet");
        require(msg.sender == owner, "Not owner");
        emit Withdrawal(address(this).balance, block.timestamp);
        owner.transfer(address(this).balance);
    }
}
