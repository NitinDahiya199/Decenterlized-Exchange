// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract DemoSwapRouter is Ownable {
    IERC20 public immutable token0;
    IERC20 public immutable token1;
    uint256 public reserve0;
    uint256 public reserve1;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    event LiquidityAdded(address indexed provider, uint256 amount0, uint256 amount1, uint256 shares, address indexed to);
    event LiquidityRemoved(address indexed provider, uint256 amount0, uint256 amount1, uint256 shares, address indexed to);
    event Mint(address indexed sender, uint256 amount0, uint256 amount1, uint256 shares, address indexed to);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, uint256 shares, address indexed to);
    event Swap(address indexed sender, address indexed tokenIn, uint256 amountIn, uint256 amountOut, address indexed to);

    constructor(address token0_, address token1_, address owner_) Ownable(owner_) {
        require(token0_ != address(0), "token0 zero");
        require(token1_ != address(0), "token1 zero");
        require(token0_ != token1_, "same token");
        token0 = IERC20(token0_);
        token1 = IERC20(token1_);
    }

    function addLiquidity(uint256 amount0, uint256 amount1, address to) external returns (uint256 shares) {
        require(to != address(0), "to zero");
        require(amount0 > 0 && amount1 > 0, "zero amount");

        if (totalSupply == 0) {
            shares = _sqrt(amount0 * amount1);
        } else {
            shares = _min((amount0 * totalSupply) / reserve0, (amount1 * totalSupply) / reserve1);
        }
        require(shares > 0, "zero shares");

        token0.transferFrom(msg.sender, address(this), amount0);
        token1.transferFrom(msg.sender, address(this), amount1);
        reserve0 += amount0;
        reserve1 += amount1;
        totalSupply += shares;
        balanceOf[to] += shares;

        emit LiquidityAdded(msg.sender, amount0, amount1, shares, to);
        emit Mint(msg.sender, amount0, amount1, shares, to);
    }

    function removeLiquidity(
        uint256 shares,
        uint256 amount0Min,
        uint256 amount1Min,
        address to
    ) external returns (uint256 amount0, uint256 amount1) {
        require(to != address(0), "to zero");
        require(shares > 0, "zero shares");
        require(balanceOf[msg.sender] >= shares, "insufficient shares");

        amount0 = (shares * reserve0) / totalSupply;
        amount1 = (shares * reserve1) / totalSupply;
        require(amount0 >= amount0Min && amount1 >= amount1Min, "slippage");

        balanceOf[msg.sender] -= shares;
        totalSupply -= shares;
        reserve0 -= amount0;
        reserve1 -= amount1;

        token0.transfer(to, amount0);
        token1.transfer(to, amount1);

        emit LiquidityRemoved(msg.sender, amount0, amount1, shares, to);
        emit Burn(msg.sender, amount0, amount1, shares, to);
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

    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }

    function _sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = (y / 2) + 1;
            while (x < z) {
                z = x;
                x = ((y / x) + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
