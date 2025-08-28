import { Request, Response } from "express";
import { getContract } from "../utils/contract";

export async function contractAddressController(_req: Request, res: Response) {
  const address = process.env.CONTRACT_ADDRESS || null;
  return res.json({ address });
}

export async function mintNftController(req: Request, res: Response) {
  try {
    const { to, tokenURI } = req.body as { to: string; tokenURI: string };
    if (!to || !tokenURI) return res.status(400).json({ error: "Missing to or tokenURI" });

    const contract = await getContract();
    const tx = await contract.mint(to, tokenURI);
    const receipt = await tx.wait();
    return res.json({ txHash: receipt?.hash ?? tx.hash });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Mint failed" });
  }
}

export async function burnNftController(req: Request, res: Response) {
  try {
    const { tokenId } = req.body as { tokenId: string | number };
    if (tokenId === undefined || tokenId === null) return res.status(400).json({ error: "Missing tokenId" });

    const contract = await getContract();
    const tx = await contract.burn(BigInt(tokenId));
    const receipt = await tx.wait();
    return res.json({ txHash: receipt?.hash ?? tx.hash });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Burn failed" });
  }
}


