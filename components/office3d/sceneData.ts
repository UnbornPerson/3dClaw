import type { AgentHeading, RoomId } from "@/lib/openclaw/types";

export interface ZoneDefinition {
  room: RoomId;
  label: string;
  center: [number, number];
  size: [number, number];
  fill: string;
  border: string;
}

export interface FurnitureDefinition {
  id: string;
  kind:
    | "desk"
    | "chair"
    | "screen"
    | "server"
    | "sofa"
    | "counter"
    | "divider"
    | "locker"
    | "bench"
    | "plant"
    | "meetingTable"
    | "stool";
  room: RoomId;
  position: [number, number];
  size?: [number, number, number];
  rotation?: number;
  color: string;
  accent?: string;
}

export interface SeatAnchor {
  position: [number, number, number];
  rotation: number;
}

export const roomDisplayNames: Record<RoomId, string> = {
  meeting: "会议室",
  workstations: "办公区",
  restaurant: "休息室",
  gym: "健身房",
  study: "学习区"
};

export const floorSize = {
  width: 24,
  depth: 14,
  wallHeight: 3.8
} as const;

const interiorPadding = {
  x: 1.6,
  z: 1.2
} as const;

export const zoneDefinitions: ZoneDefinition[] = [
  {
    room: "meeting",
    label: "",
    center: [-7.5, -4],
    size: [8, 5],
    fill: "#a5d6ea",
    border: "#559dc8"
  },
  {
    room: "study",
    label: "",
    center: [-7.5, 3.5],
    size: [8, 6],
    fill: "#dfccf1",
    border: "#9b78cb"
  },
  {
    room: "workstations",
    label: "",
    center: [1.5, 0],
    size: [10, 13],
    fill: "#b8e2ef",
    border: "#68afd1"
  },
  {
    room: "restaurant",
    label: "",
    center: [9.5, 4],
    size: [5, 5],
    fill: "#b1d0e6",
    border: "#5d86cb"
  },
  {
    room: "gym",
    label: "",
    center: [9.5, -4],
    size: [5, 5],
    fill: "#b9e3d6",
    border: "#72aa80"
  }
];

const workstationRows: Array<[number, number]> = [
  // Pod 1 (Left)
  [-1.5, -2.2],
  [1.0, -2.2],
  [-1.5, 1.2],
  [1.0, 1.2],
  // Pod 2 (Right)
  [4.5, -2.2],
  [7.0, -2.2],
  [4.5, 1.2],
  [7.0, 1.2]
];

export const workstationSeatAnchors: SeatAnchor[] = workstationRows.map(([x, z]) => ({
  position: [x + 0.1, 0, z + 0.82],
  rotation: -Math.PI / 2
}));

export const furnitureDefinitions: FurnitureDefinition[] = [
  {
    id: "meeting-table",
    kind: "meetingTable",
    room: "meeting",
    position: [-7.5, -4],
    size: [4.2, 0.36, 2.4],
    color: "#5985bf",
    accent: "#314f7d"
  },
  {
    id: "meeting-partition",
    kind: "divider",
    room: "meeting",
    position: [-3.5, -3.5],
    size: [0.15, 2.8, 6],
    color: "#a5d6ea"
  },
  {
    id: "study-partition",
    kind: "divider",
    room: "study",
    position: [-3.5, 3.5],
    size: [0.15, 2.8, 6],
    color: "#dfccf1"
  },
  {
    id: "study-table-a",
    kind: "desk",
    room: "study",
    position: [-7.5, 5.2],
    size: [6, 0.15, 0.8],
    color: "#83a9d6",
    accent: "#4d6b91"
  },
  {
    id: "study-bookshelf-a",
    kind: "screen",
    room: "study",
    position: [-10.8, 4.5],
    size: [0.8, 2.8, 0.4],
    color: "#4e6071",
    accent: "#dc5f42"
  },
  {
    id: "study-bookshelf-b",
    kind: "screen",
    room: "study",
    position: [-10.8, 2.5],
    size: [0.8, 2.8, 0.4],
    color: "#4e6071",
    accent: "#dc5f42"
  },
  {
    id: "server-a",
    kind: "server",
    room: "workstations",
    position: [-1.8, 5.2],
    size: [0.9, 2.6, 0.9],
    color: "#273148",
    accent: "#74d4cf"
  },
  {
    id: "server-b",
    kind: "server",
    room: "workstations",
    position: [0.2, 5.2],
    size: [0.9, 2.6, 0.9],
    color: "#273148",
    accent: "#74d4cf"
  },
  {
    id: "lounge-sofa",
    kind: "sofa",
    room: "restaurant",
    position: [9.5, 4.5],
    size: [3.5, 0.8, 1.2],
    color: "#6d75ad",
    accent: "#4d557f"
  },
  {
    id: "gym-bench",
    kind: "bench",
    room: "gym",
    position: [9.5, -4.5],
    size: [2.5, 0.58, 1.0],
    color: "#4d839f",
    accent: "#2d5d6f"
  },
  {
    id: "restaurant-stool-a",
    kind: "stool",
    room: "restaurant",
    position: [8.7, -4.3],
    color: "#80c7ed"
  },
  {
    id: "restaurant-stool-b",
    kind: "stool",
    room: "restaurant",
    position: [8.7, -3.25],
    color: "#80c7ed"
  },
  {
    id: "gym-bench",
    kind: "bench",
    room: "gym",
    position: [6.2, 2.9],
    size: [2.3, 0.58, 1.0],
    color: "#4d839f",
    accent: "#2d5d6f"
  },
  // Meeting Room Chairs
  { id: "meeting-chair-1", kind: "chair", room: "meeting", position: [-9, -4], rotation: 0, color: "#698194" },
  { id: "meeting-chair-2", kind: "chair", room: "meeting", position: [-6, -4], rotation: 0, color: "#698194" },
  { id: "meeting-chair-3", kind: "chair", room: "meeting", position: [-9, -2.5], rotation: Math.PI, color: "#698194" },
  { id: "meeting-chair-4", kind: "chair", room: "meeting", position: [-6, -2.5], rotation: Math.PI, color: "#698194" },
  // Study Area Chairs
  { id: "study-chair-1", kind: "chair", room: "study", position: [-8.5, 5], rotation: 0, color: "#698194" },
  { id: "study-chair-2", kind: "chair", room: "study", position: [-6.5, 5], rotation: 0, color: "#698194" },
  {
    id: "gym-locker",
    kind: "locker",
    room: "gym",
    position: [9.35, 3.3],
    size: [1.0, 2.1, 1.1],
    color: "#707891",
    accent: "#cfe4f5"
  },
  {
    id: "gym-plant",
    kind: "plant",
    room: "gym",
    position: [8.8, 1.0],
    color: "#597ba4",
    accent: "#4d6285"
  },
  ...workstationRows.flatMap(([x, z], index) => [
    {
      id: `desk-${index}`,
      kind: "desk" as const,
      room: "workstations" as const,
      position: [x, z] as [number, number],
      size: [1.8, 0.18, 0.95] as [number, number, number],
      color: "#6498c8",
      accent: "#3d5f91"
    },
    {
      id: `chair-${index}`,
      kind: "chair" as const,
      room: "workstations" as const,
      position: [x + 0.1, z + 0.95] as [number, number],
      size: [0.62, 0.6, 0.62] as [number, number, number],
      color: "#698194",
      accent: "#4e6071"
    },
    {
      id: `screen-${index}`,
      kind: "screen" as const,
      room: "workstations" as const,
      position: [x + 0.45, z - 0.08] as [number, number],
      size: [0.52, 0.65, 0.16] as [number, number, number],
      color: "#79d8d0",
      accent: "#182130"
    }
  ])
];

export function getRoomOpacity(activeRoom: RoomId | "all", room: RoomId): number {
  return activeRoom === "all" || activeRoom === room ? 1 : 0.22;
}

export function toFloorPosition(position: { x: number; y: number }): [number, number, number] {
  const x =
    -floorSize.width / 2 +
    interiorPadding.x +
    (position.x / 100) * (floorSize.width - interiorPadding.x * 2);
  const z =
    -floorSize.depth / 2 +
    interiorPadding.z +
    (position.y / 100) * (floorSize.depth - interiorPadding.z * 2);

  return [x, 0, z];
}

export function roomAnchorToWorld(anchor: { x: number; y: number }): [number, number, number] {
  const [x, y, z] = toFloorPosition(anchor);
  return [x, y + 0.04, z];
}

export function headingToRotation(heading: AgentHeading): number {
  switch (heading) {
    case "north":
      return -Math.PI / 2;
    case "south":
      return Math.PI / 2;
    case "west":
      return Math.PI;
    case "east":
    default:
      return 0;
  }
}
