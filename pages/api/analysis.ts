import type { NextApiRequest, NextApiResponse } from "next";

import { openClawProvider } from "@/lib/openclaw/provider";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const analysis = await openClawProvider.getAnalysis();
    return res.status(200).json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
