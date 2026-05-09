// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiquidityBox } from "./liquidity-box";
import { StakingBox } from "./staking-box";

const writeContractAsync = vi.fn();

vi.mock("wagmi", () => ({
  useAccount: () => ({
    address: "0x1111111111111111111111111111111111111111",
    isConnected: true,
  }),
  useReadContract: () => ({ data: 1_000_000_000_000_000_000n }),
  useWaitForTransactionReceipt: () => ({ isLoading: false, isSuccess: false }),
  useWriteContract: () => ({
    writeContractAsync,
    data: undefined,
    isPending: false,
    error: null,
  }),
}));

vi.mock("@dex-terminal/blockchain", () => ({
  demoStakingAbi: [],
  demoSwapRouterAbi: [],
  erc20Abi: [],
  getDemoDexAddresses: () => ({
    demoWeth: "0x1111111111111111111111111111111111111111",
    demoUsdc: "0x2222222222222222222222222222222222222222",
    demoSwapRouter: "0x3333333333333333333333333333333333333333",
    demoStaking: "0x4444444444444444444444444444444444444444",
  }),
}));

describe("liquidity and staking widgets", () => {
  beforeEach(() => {
    writeContractAsync.mockResolvedValue("0xhash");
    writeContractAsync.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("approves both pool tokens before adding liquidity", async () => {
    render(createElement(LiquidityBox));

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => expect(writeContractAsync).toHaveBeenCalledTimes(2));
    expect(writeContractAsync.mock.calls[0]?.[0]).toMatchObject({
      functionName: "approve",
    });
    expect(writeContractAsync.mock.calls[1]?.[0]).toMatchObject({
      functionName: "approve",
    });
  });

  it("submits an add liquidity transaction", async () => {
    render(createElement(LiquidityBox));

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(writeContractAsync).toHaveBeenCalledWith(expect.objectContaining({ functionName: "addLiquidity" })));
  });

  it("submits stake, withdraw, and claim transactions", async () => {
    render(createElement(StakingBox));

    fireEvent.click(screen.getByRole("button", { name: "Stake" }));
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    fireEvent.click(screen.getByRole("button", { name: "Claim" }));

    await waitFor(() => expect(writeContractAsync).toHaveBeenCalledWith(expect.objectContaining({ functionName: "stake" })));
    expect(writeContractAsync).toHaveBeenCalledWith(expect.objectContaining({ functionName: "withdraw" }));
    expect(writeContractAsync).toHaveBeenCalledWith(expect.objectContaining({ functionName: "claim" }));
  });
});
