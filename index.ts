import { GetUserOperationReceiptReturnType, UserOperation, bundlerActions, getUserOperationHash } from "permissionless"
import { Address, Hex, concat, createClient, createPublicClient, encodeFunctionData, http } from "viem"
import { lineaTestnet } from "viem/chains"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { pimlicoBundlerActions, pimlicoPaymasterActions } from "permissionless/actions/pimlico"

console.log("Hello world!")