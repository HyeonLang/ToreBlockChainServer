import { Router } from "express";
import { apiKeyAuth } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";
import { 
  v1MintController,
  v1TransferController,
  v1BurnController,
  v1GetOneController,
  v1ListByWalletController
} from "../v1/controllers";

const v1 = Router();

v1.use(apiKeyAuth, rateLimit);

// POST /v1/nfts/mint
v1.post("/nfts/mint", v1MintController);

// PATCH /v1/nfts/:nftId/transfer
v1.patch("/nfts/:nftId/transfer", v1TransferController);

// DELETE /v1/nfts/:nftId
v1.delete("/nfts/:nftId", v1BurnController);

// GET /v1/nfts/:nftId
v1.get("/nfts/:nftId", v1GetOneController);

// GET /v1/wallets/:walletAddress/nfts
v1.get("/wallets/:walletAddress/nfts", v1ListByWalletController);

export default v1;


