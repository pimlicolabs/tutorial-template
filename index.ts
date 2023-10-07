import dotenv from "dotenv"
import { getAccountNonce } from "permissionless"
import { UserOperation, bundlerActions, getSenderAddress, getUserOperationHash, GetUserOperationReceiptReturnType } from "permissionless"
import { pimlicoBundlerActions, pimlicoPaymasterActions } from "permissionless/actions/pimlico"
import { Address, Hash, concat, createClient, createPublicClient, encodeFunctionData, http, Hex } from "viem"
import { generatePrivateKey, privateKeyToAccount, signMessage } from "viem/accounts"
import { lineaTestnet, polygonMumbai } from "viem/chains"

console.log("Hello world!")