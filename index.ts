import dotenv from "dotenv";
import { getAccountNonce } from "permissionless";
import {
  UserOperation,
  bundlerActions,
  getSenderAddress,
} from "permissionless";
import { pimlicoBundlerActions } from "permissionless/actions/pimlico";
import { Address, Hash, createClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { goerli } from "viem/chains";
import {
  EIP712_SAFE_OPERATION_TYPE,
  SAFE_ADDRESSES_MAP,
  encodeCallData,
  getAccountInitCode,
} from "./utils/safe";
import { generateTransferCallData } from "./utils/erc20";

// DEFINE THE CONSTANTS
const privateKey = "<Your-Private-Key"; // replace this with a private key you generate!
const apiKey = "<Pimlico-API-Key>"; // replace with your Pimlico API key

const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

const chain = "goerli";

if (apiKey === undefined) {
  throw new Error(
    "Please replace the `apiKey` env variable with your Pimlico API key"
  );
}

if (privateKey.match(/GENERATED_PRIVATE_KEY/)) {
  throw new Error(
    "Please replace the `privateKey` variable with a newly generated private key. You can use `generatePrivateKey()` for this"
  );
}

const signer = privateKeyToAccount(privateKey as Hash);

const bundlerClient = createClient({
  transport: http(`https://api.pimlico.io/v1/${chain}/rpc?apikey=${apiKey}`),
  chain: goerli,
})
  .extend(bundlerActions)
  .extend(pimlicoBundlerActions);

const publicClient = createPublicClient({
  transport: http("https://rpc.ankr.com/eth_goerli"),
  chain: goerli,
});

const submitUserOperation = async (userOperation: UserOperation) => {
  const userOperationHash = await bundlerClient.sendUserOperation({
    userOperation,
    entryPoint: ENTRY_POINT_ADDRESS,
  });
  console.log(`UserOperation submitted. Hash: ${userOperationHash}`);

  console.log("Querying for receipts...");
  const receipt = await bundlerClient.waitForUserOperationReceipt({
    hash: userOperationHash,
  });
  console.log(
    `Receipt found!\nTransaction hash: ${receipt.receipt.transactionHash}`
  );
};

const erc20PaymasterAddress = "0xEc43912D8C772A0Eba5a27ea5804Ba14ab502009";
const usdcTokenAddress = "0x07865c6E87B9F70255377e024ace6630C1Eaa37F";
// from safe-deployments
const multiSendAddress = "0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526";

const initCode = await getAccountInitCode({
  owner: signer.address,
  addModuleLibAddress: SAFE_ADDRESSES_MAP["1.4.1"][5].ADD_MODULES_LIB_ADDRESS,
  safe4337ModuleAddress:
    SAFE_ADDRESSES_MAP["1.4.1"][5].SAFE_4337_MODULE_ADDRESS,
  safeProxyFactoryAddress:
    SAFE_ADDRESSES_MAP["1.4.1"][5].SAFE_PROXY_FACTORY_ADDRESS,
  safeSingletonAddress: SAFE_ADDRESSES_MAP["1.4.1"][5].SAFE_SINGLETON_ADDRESS,
  saltNonce: 2n,
  erc20TokenAddress: usdcTokenAddress,
  multiSendAddress,
  paymasterAddress: erc20PaymasterAddress,
});

const senderAddress = await getSenderAddress(publicClient, {
  initCode,
  entryPoint: ENTRY_POINT_ADDRESS,
});
console.log("Counterfactual sender address:", senderAddress);

// Fetch USDC balance of sender

const senderUsdcBalance = await publicClient.readContract({
  abi: [
    {
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "balance", type: "uint256" }],
      type: "function",
      stateMutability: "view",
    },
  ],
  address: usdcTokenAddress,
  functionName: "balanceOf",
  args: [senderAddress],
});

console.log(
  "Smart Account USDC Balance:",
  Number(senderUsdcBalance / 1000000n)
);

const gasPriceResult = await bundlerClient.getUserOperationGasPrice();

const newNonce = await getAccountNonce(publicClient, {
  entryPoint: ENTRY_POINT_ADDRESS,
  sender: senderAddress,
});

export const signUserOperation = async (userOperation: UserOperation) => {
  const signatures = [
    {
      signer: signer.address,
      data: await signer.signTypedData({
        domain: {
          chainId: 5,
          verifyingContract:
            SAFE_ADDRESSES_MAP["1.4.1"][5].SAFE_4337_MODULE_ADDRESS,
        },
        types: EIP712_SAFE_OPERATION_TYPE,
        primaryType: "SafeOp",
        message: {
          safe: senderAddress,
          callData: userOperation.callData,
          nonce: userOperation.nonce,
          preVerificationGas: userOperation.preVerificationGas,
          verificationGasLimit: userOperation.verificationGasLimit,
          callGasLimit: userOperation.callGasLimit,
          maxFeePerGas: userOperation.maxFeePerGas,
          maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas,
          entryPoint: ENTRY_POINT_ADDRESS,
        },
      }),
    },
  ];

  signatures.sort((left, right) =>
    left.signer.toLowerCase().localeCompare(right.signer.toLowerCase())
  );

  let signatureBytes: Address = "0x";
  for (const sig of signatures) {
    signatureBytes += sig.data.slice(2);
  }

  return signatureBytes;
};

const contractCode = await publicClient.getBytecode({ address: senderAddress });

if (contractCode) {
  console.log(
    "The Safe is already deployed. Sending 1 USDC from the Safe to itself."
  );
} else {
  console.log(
    "Deploying a new Safe and transfering 1 USDC to itself in one tx"
  );
}

const sponsoredUserOperation: UserOperation = {
  sender: senderAddress,
  nonce: newNonce,
  initCode: contractCode ? "0x" : initCode,
  // Send 1 USDC to the Safe itself
  callData: encodeCallData({
    to: usdcTokenAddress,
    data: generateTransferCallData(senderAddress, 1000000n),
    value: 0n,
  }),
  callGasLimit: 100_000n, // hardcode it for now at a high value
  verificationGasLimit: 500_000n, // hardcode it for now at a high value
  preVerificationGas: 50_000n, // hardcode it for now at a high value
  maxFeePerGas: gasPriceResult.fast.maxFeePerGas,
  maxPriorityFeePerGas: gasPriceResult.fast.maxPriorityFeePerGas,
  paymasterAndData: erc20PaymasterAddress, // to use the erc20 paymaster, put its address in the paymasterAndData field
  signature: "0x",
};

sponsoredUserOperation.signature = await signUserOperation(
  sponsoredUserOperation
);

await submitUserOperation(sponsoredUserOperation);
