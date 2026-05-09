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
    await expect(
      router.addLiquidity(ethers.parseEther("100"), ethers.parseEther("300000"), owner.address),
    ).to.emit(router, "Mint");

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

  it("mints and burns liquidity shares", async () => {
    const [owner, provider] = await ethers.getSigners();
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

    await token0.transfer(provider.address, ethers.parseEther("10"));
    await token1.transfer(provider.address, ethers.parseEther("30000"));
    await token0.connect(provider).approve(await router.getAddress(), ethers.parseEther("10"));
    await token1.connect(provider).approve(await router.getAddress(), ethers.parseEther("30000"));

    await router
      .connect(provider)
      .addLiquidity(ethers.parseEther("10"), ethers.parseEther("30000"), provider.address);

    const shares = await router.balanceOf(provider.address);
    expect(shares).to.be.gt(0n);

    await expect(router.connect(provider).removeLiquidity(shares / 2n, 0, 0, provider.address)).to.emit(
      router,
      "Burn",
    );
    expect(await router.balanceOf(provider.address)).to.equal(shares - shares / 2n);
  });
});
