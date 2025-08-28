import express from "express";
import dotenv from "dotenv";
import nftRouter from "./routes/nft";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/nft", nftRouter);

const port = Number(process.env.PORT || 3000);
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

export default app;


