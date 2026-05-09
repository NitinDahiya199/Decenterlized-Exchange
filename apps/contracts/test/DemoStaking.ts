import { expect } from "chai";
import { ethers } from "hardhat";
import type { DemoStaking, DemoToken } from "../typechain-types";

describe("DemoStaking", () => {
  it("stakes, accrues, claims, and withdraws", async () => {
    const [owner, staker] = await ethers.getSigners();
    const tokenFactory = await ethers.getContractFactory("DemoToken");
    const stakeToken = (await tokenFactory.deploy(
      "Demo Wrapped Ether",
      "dWETH",
      ethers.parseEther("1000000"),
      owner.address,
    )) as unknown as DemoToken;
    const rewardToken = (await tokenFactory.deploy(
      "Demo USD Coin",
      "dUSDC",
      ethers.parseEther("1000000"),
      owner.address,
    )) as unknown as DemoToken;
    const stakingFactory = await ethers.getContractFactory("DemoStaking");
    const staking = (await stakingFactory.deploy(
      await stakeToken.getAddress(),
      await rewardToken.getAddress(),
      ethers.parseUnits("0.000001", 18),
      owner.address,
    )) as unknown as DemoStaking;

    await rewardToken.transfer(await staking.getAddress(), ethers.parseEther("1000"));
    await stakeToken.transfer(staker.address, ethers.parseEther("10"));
    await stakeToken.connect(staker).approve(await staking.getAddress(), ethers.parseEther("1"));

    await expect(staking.connect(staker).stake(ethers.parseEther("1"))).to.emit(staking, "Staked");
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine", []);

    expect(await staking.earned(staker.address)).to.be.gt(0n);
    await expect(staking.connect(staker).claim()).to.emit(staking, "RewardPaid");
    await expect(staking.connect(staker).withdraw(ethers.parseEther("1"))).to.emit(staking, "Withdrawn");
    expect(await staking.balanceOf(staker.address)).to.equal(0n);
  });
});
