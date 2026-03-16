import type { NextApiRequest, NextApiResponse } from "next";

import { openClawConfig, roomOrder } from "@/lib/openclaw/config";
import { openClawProvider } from "@/lib/openclaw/provider";
import type { RoomId } from "@/lib/openclaw/types";

function getRoomValue(value: string | string[] | undefined): RoomId | undefined {
  if (!value || Array.isArray(value)) {
    return undefined;
  }

  return roomOrder.includes(value as RoomId) ? (value as RoomId) : undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const limitValue = Array.isArray(req.query.limit)
      ? req.query.limit[0]
      : req.query.limit;
    const limit = limitValue ? Number(limitValue) : openClawConfig.defaultOperationLimit;

    const operations = await openClawProvider.listOperations({
      room: getRoomValue(req.query.room),
      agentId: Array.isArray(req.query.agentId)
        ? req.query.agentId[0]
        : req.query.agentId,
      limit: Number.isFinite(limit) ? limit : openClawConfig.defaultOperationLimit
    });

    return res.status(200).json({ operations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
