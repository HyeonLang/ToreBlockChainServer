import { Request, Response } from "express";
import { getContract } from "../utils/contract";

function isAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export async function v1MintController(req: Request, res: Response) {
  try {
    const { walletAddress, contractAddress, itemInfo } = req.body as {
      walletAddress?: string;
      contractAddress?: string;
      itemInfo?: { tokenURI?: string } & Record<string, unknown>;
    };

    if (!walletAddress || !isAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid walletAddress" });
    }

    const tokenURI = itemInfo?.tokenURI;
    if (!tokenURI || typeof tokenURI !== "string") {
      return res.status(400).json({ error: "Invalid itemInfo.tokenURI" });
    }

    const contract = await getContract();
    if (contractAddress && contract.target?.toString().toLowerCase() !== contractAddress.toLowerCase()) {
      return res.status(400).json({ error: "Mismatched contractAddress" });
    }

    const tx = await contract.mint(walletAddress, tokenURI);
    const receipt = await tx.wait();

    let tokenId: number | null = null;
    if (receipt?.logs) {
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === "Transfer") {
            tokenId = Number(parsed.args?.[2]);
            break;
          }
        } catch {}
      }
    }

    return res.json({ nftId: tokenId?.toString() ?? null, success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Mint failed" });
  }
}

export async function v1TransferController(req: Request, res: Response) {
  try {
    const { nftId } = req.params as { nftId: string };
    const { fromWalletAddress, toWalletAddress, contractAddress } = req.body as {
      fromWalletAddress?: string;
      toWalletAddress?: string;
      contractAddress?: string;
    };

    if (!nftId || Number.isNaN(Number(nftId))) {
      return res.status(400).json({ error: "Invalid nftId" });
    }
    if (!fromWalletAddress || !isAddress(fromWalletAddress)) {
      return res.status(400).json({ error: "Invalid fromWalletAddress" });
    }
    if (!toWalletAddress || !isAddress(toWalletAddress)) {
      return res.status(400).json({ error: "Invalid toWalletAddress" });
    }

    const contract = await getContract();
    if (contractAddress && contract.target?.toString().toLowerCase() !== contractAddress.toLowerCase()) {
      return res.status(400).json({ error: "Mismatched contractAddress" });
    }

    const tx = await contract.transferFrom(fromWalletAddress, toWalletAddress, BigInt(nftId));
    await tx.wait();
    return res.json({ nftId, success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Transfer failed" });
  }
}

export async function v1BurnController(req: Request, res: Response) {
  try {
    const { nftId } = req.params as { nftId: string };
    const { walletAddress, contractAddress } = req.body as {
      walletAddress?: string;
      contractAddress?: string;
    };

    if (!nftId || Number.isNaN(Number(nftId))) {
      return res.status(400).json({ error: "Invalid nftId" });
    }
    if (walletAddress && !isAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid walletAddress" });
    }

    const contract = await getContract();
    if (contractAddress && contract.target?.toString().toLowerCase() !== contractAddress.toLowerCase()) {
      return res.status(400).json({ error: "Mismatched contractAddress" });
    }

    const tx = await contract.burn(BigInt(nftId));
    await tx.wait();
    return res.json({ nftId, success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Burn failed" });
  }
}

export async function v1GetOneController(req: Request, res: Response) {
  try {
    const { nftId } = req.params as { nftId: string };
    if (!nftId || Number.isNaN(Number(nftId))) {
      return res.status(400).json({ error: "Invalid nftId" });
    }

    const contract = await getContract();
    try {
      const [owner, tokenURI] = await Promise.all([
        contract.ownerOf(BigInt(nftId)),
        contract.tokenURI(BigInt(nftId))
      ]);
      return res.json({ exists: true, ownerAddress: owner, contractAddress: contract.target?.toString() ?? null, tokenURI });
    } catch (inner) {
      return res.json({ exists: false });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Query failed" });
  }
}

export async function v1ListByWalletController(req: Request, res: Response) {
  try {
    const { walletAddress } = req.params as { walletAddress: string };
    if (!walletAddress || !isAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid walletAddress" });
    }

    const contract = await getContract();
    const nextIdBn: bigint = await contract.nextTokenId();
    const maxId = Number(nextIdBn);

    const nfts: Array<{ nftId: string; contractAddress: string | null; itemInfo?: { tokenURI: string } }> = [];
    for (let id = 1; id <= maxId; id += 1) {
      try {
        const owner: string = await contract.ownerOf(BigInt(id));
        if (owner.toLowerCase() === walletAddress.toLowerCase()) {
          const tokenURI: string = await contract.tokenURI(BigInt(id));
          nfts.push({ nftId: String(id), contractAddress: contract.target?.toString() ?? null, itemInfo: { tokenURI } });
        }
      } catch {}
    }
    return res.json({ nfts, success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "List failed" });
  }
}



