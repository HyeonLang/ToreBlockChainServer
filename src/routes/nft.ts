import { Router } from "express";
import { burnNftController, contractAddressController, mintNftController } from "../controllers/nftController";

const router = Router();

router.get("/address", contractAddressController);
router.post("/mint", mintNftController);
router.post("/burn", burnNftController);

export default router;


