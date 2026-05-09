import fs from "node:fs";
import path from "node:path";
import { ethers, network } from "hardhat";

const TOKEN_SUPPLY = ethers.parseEther("10000000");
const ETH_LIQUIDITY = ethers.parseEther("1000");
const USDC_LIQUIDITY = ethers.parseUnits("3000000", 18);
const STAKING_REWARD_RATE = ethers.parseUnits("0.000001", 18);
const STAKING_REWARDS = ethers.parseEther("100000");

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();

  if (deployer === undefined) {
    throw new Error("No deployer signer available");
  }

  const demoTokenFactory = await ethers.getContractFactory("DemoToken");
  const weth = await demoTokenFactory.deploy("Demo Wrapped Ether", "dWETH", TOKEN_SUPPLY, deployer.address);
  await weth.waitForDeployment();

  const usdc = await demoTokenFactory.deploy("Demo USD Coin", "dUSDC", TOKEN_SUPPLY, deployer.address);
  await usdc.waitForDeployment();

  const routerFactory = await ethers.getContractFactory("DemoSwapRouter");
  const router = await routerFactory.deploy(await weth.getAddress(), await usdc.getAddress(), deployer.address);
  await router.waitForDeployment();

  await (await weth.approve(await router.getAddress(), ETH_LIQUIDITY)).wait();
  await (await usdc.approve(await router.getAddress(), USDC_LIQUIDITY)).wait();
  await (await router.addLiquidity(ETH_LIQUIDITY, USDC_LIQUIDITY, deployer.address)).wait();

  const stakingFactory = await ethers.getContractFactory("DemoStaking");
  const staking = await stakingFactory.deploy(
    await weth.getAddress(),
    await usdc.getAddress(),
    STAKING_REWARD_RATE,
    deployer.address,
  );
  await staking.waitForDeployment();
  await (await usdc.transfer(await staking.getAddress(), STAKING_REWARDS)).wait();

  const deployment = {
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    network: network.name,
    demoWeth: await weth.getAddress(),
    demoUsdc: await usdc.getAddress(),
    demoSwapRouter: await router.getAddress(),
    demoStaking: await staking.getAddress(),
  };

  const outputPath = path.resolve(__dirname, "../../../packages/blockchain/src/deployments.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(deployment, null, 2)}\n`);

  console.log("Demo DEX deployed", deployment);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
