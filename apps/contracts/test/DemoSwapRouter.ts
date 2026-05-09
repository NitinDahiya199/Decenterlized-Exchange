import { expect } from "chai";
import { ethers } from "hardhat";
import type { DemoSwapRouter, DemoToken } from "../typechain-types";

describe("DemoSwapRouter", () => {
  it("swaps exact input tokens against the single pool", async () => {
    const [owner, trader] = await ethers.getSigners();
    const tokenFactory = await ethers.getContractFactory("DemoToken");
    const token0 = (await tokenFactory.deploy(
      "Demo Wrapped Ether",
      "dWETH",
      ethers.parseEther("1000000"),
      owner.address,
    )) as unknown as DemoToken;
    const token1 = (await tokenFactory.deploy(
      "Demo USD Coin",
      "dUSDC",
      ethers.parseEther("1000000"),
      owner.address,
    )) as unknown as DemoToken;
    const routerFactory = await ethers.getContractFactory("DemoSwapRouter");
    const router = (await routerFactory.deploy(
      await token0.getAddress(),
      await token1.getAddress(),
      owner.address,
    )) as unknown as DemoSwapRouter;

    await token0.approve(await router.getAddress(), ethers.parseEther("100"));
    await token1.approve(await router.getAddress(), ethers.parseEther("300000"));
    await router.addLiquidity(ethers.parseEther("100"), ethers.parseEther("300000"));

    await token0.transfer(trader.address, ethers.parseEther("1"));
    await token0.connect(trader).approve(await router.getAddress(), ethers.parseEther("1"));

    const expectedOut = await router.getAmountOut(await token0.getAddress(), ethers.parseEther("1"));
    await expect(
      router
        .connect(trader)
        .swapExactTokensForTokens(await token0.getAddress(), ethers.parseEther("1"), expectedOut, trader.address),
    ).to.emit(router, "Swap");

    expect(await token1.balanceOf(trader.address)).to.equal(expectedOut);
  });
});
