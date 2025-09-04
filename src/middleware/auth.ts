import { Request, Response, NextFunction } from "express";

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const configuredKey = process.env.API_KEY;
  if (!configuredKey) {
    return next();
  }

  const providedKey = req.header("x-api-key");
  if (!providedKey || providedKey !== configuredKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}


