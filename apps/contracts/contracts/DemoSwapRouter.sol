// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract DemoSwapRouter is Ownable {
    IERC20 public immutable token0;
    IERC20 public immutable token1;
    uint256 public reserve0;
    uint256 public reserve1;

    event LiquidityAdded(address indexed provider, uint256 amount0, uint256 amount1);
    event Swap(address indexed sender, address indexed tokenIn, uint256 amountIn, uint256 amountOut, address indexed to);

    constructor(address token0_, address token1_, address owner_) Ownable(owner_) {
        require(token0_ != address(0), "token0 zero");
        require(token1_ != address(0), "token1 zero");
        require(token0_ != token1_, "same token");
        token0 = IERC20(token0_);
        token1 = IERC20(token1_);
    }

    function addLiquidity(uint256 amount0, uint256 amount1) external onlyOwner {
        require(amount0 > 0 && amount1 > 0, "zero amount");
        token0.transferFrom(msg.sender, address(this), amount0);
        token1.transferFrom(msg.sender, address(this), amount1);
        reserve0 += amount0;
        reserve1 += amount1;
        emit LiquidityAdded(msg.sender, amount0, amount1);
    }

    function getAmountOut(address tokenIn, uint256 amountIn) public view returns (uint256 amountOut) {
        require(amountIn > 0, "zero amount");
        bool zeroForOne = tokenIn == address(token0);
        require(zeroForOne || tokenIn == address(token1), "unsupported token");

        (uint256 reserveIn, uint256 reserveOut) = zeroForOne ? (reserve0, reserve1) : (reserve1, reserve0);
        require(reserveIn > 0 && reserveOut > 0, "no liquidity");

        uint256 amountInWithFee = amountIn * 997;
        amountOut = (amountInWithFee * reserveOut) / ((reserveIn * 1000) + amountInWithFee);
    }

    function swapExactTokensForTokens(
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin,
        address to
    ) external returns (uint256 amountOut) {
        require(to != address(0), "to zero");
        bool zeroForOne = tokenIn == address(token0);
        require(zeroForOne || tokenIn == address(token1), "unsupported token");

        IERC20 input = zeroForOne ? token0 : token1;
        IERC20 output = zeroForOne ? token1 : token0;
        amountOut = getAmountOut(tokenIn, amountIn);
        require(amountOut >= amountOutMin, "slippage");

        input.transferFrom(msg.sender, address(this), amountIn);
        output.transfer(to, amountOut);

        if (zeroForOne) {
            reserve0 += amountIn;
            reserve1 -= amountOut;
        } else {
            reserve1 += amountIn;
            reserve0 -= amountOut;
        }

        emit Swap(msg.sender, tokenIn, amountIn, amountOut, to);
    }
}
