import { Address, encodeFunctionData } from "viem";

export const generateApproveCallData = (paymasterAddress: Address) => {
  const approveData = encodeFunctionData({
    abi: [
      {
        inputs: [
          { name: "_spender", type: "address" },
          { name: "_value", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ name: "", type: "bool" }],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    args: [
      paymasterAddress,
      0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
    ],
  });

  return approveData;
};

export const generateTransferCallData = (to: Address, value: bigint) => {
  const transferData = encodeFunctionData({
    abi: [
      {
        inputs: [
          { name: "_to", type: "address" },
          { name: "_value", type: "uint256" },
        ],
        name: "transfer",
        outputs: [{ name: "", type: "bool" }],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    args: [to, value],
  });

  return transferData;
};
