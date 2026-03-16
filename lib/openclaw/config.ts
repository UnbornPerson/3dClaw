import path from "path";

import type { RiskLevel, RoomId } from "@/lib/openclaw/types";

export const roomOrder: RoomId[] = [
  "workstations",
  "meeting",
  "gym",
  "restaurant"
];

export const openClawConfig = {
  driverName: "openclaw-file-bridge",
  dataDir: path.join(process.cwd(), "data", "openclaw"),
  worldFile: path.join(process.cwd(), "data", "openclaw", "world.json"),
  bindingsFile: path.join(
    process.cwd(),
    "data",
    "openclaw",
    "model-bindings.json"
  ),
  operationsDir: path.join(process.cwd(), "data", "openclaw", "operations"),
  pollIntervalMs: 4000,
  defaultOperationLimit: 14
};

export const emptyRoomCounts = (): Record<RoomId, number> => ({
  workstations: 0,
  meeting: 0,
  gym: 0,
  restaurant: 0
});

export const emptyRiskCounts = (): Record<RiskLevel, number> => ({
  low: 0,
  medium: 0,
  high: 0
});
