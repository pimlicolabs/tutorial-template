import {
    SimpleAccountFactory__factory,
    EntryPoint__factory,
    SimpleAccount__factory,
    EntryPoint,
    UserOperationStruct
} from "@account-abstraction/contracts"
import { ethers, BigNumber, Wallet } from "ethers"
import { getERC20Paymaster, ERC20, ERC20__factory } from "@pimlico/erc20-paymaster"

console.log("Hello world!")