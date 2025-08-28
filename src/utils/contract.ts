import { ethers } from "ethers";
import dotenv from "dotenv";
import abiJson from "../../artifacts/contracts/GameItem.sol/GameItem.json";

dotenv.config();

export function getProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.RPC_URL || process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
  return new ethers.JsonRpcProvider(rpcUrl);
}

export async function getWallet(): Promise<ethers.Wallet> {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY is required");
  return new ethers.Wallet(pk, getProvider());
}

export async function getContract() {
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) throw new Error("CONTRACT_ADDRESS is required");
  const wallet = await getWallet();
  return new ethers.Contract(address, abiJson.abi, wallet);
}


