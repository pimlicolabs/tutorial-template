import "dotenv/config"
import { writeFileSync } from "fs"
import { toSafeSmartAccount } from "permissionless/accounts"
import { Hex, createPublicClient, getContract, http } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { sepolia, baseSepolia } from "viem/chains"
import { createPimlicoClient } from "permissionless/clients/pimlico"
import {  createBundlerClient, entryPoint07Address } from "viem/account-abstraction"
import { createSmartAccountClient } from "permissionless"

import {
	getAddress,
	maxUint256,
	parseAbi,
} from "viem";
import {
	EntryPointVersion,
} from "viem/account-abstraction";

import { encodeFunctionData, parseAbiItem } from "viem"

console.log("Hello world!")