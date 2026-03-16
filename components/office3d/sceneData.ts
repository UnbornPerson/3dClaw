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
  meeting: "会议区",
  workstations: "工位区",
  restaurant: "餐厅",
  gym: "训练区"
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
    center: [-4.8, -3.3],
    size: [8.4, 4.2],
    fill: "#ead6a5",
    border: "#c89d55"
  },
  {
    room: "workstations",
    label: "",
    center: [-2.6, 1.4],
    size: [11.4, 5.6],
    fill: "#efe2b8",
    border: "#d1af68"
  },
  {
    room: "restaurant",
    label: "",
    center: [7.1, -2.8],
    size: [5.3, 4.3],
    fill: "#e6d0b1",
    border: "#cb865d"
  },
  {
    room: "gym",
    label: "",
    center: [7.1, 2.8],
    size: [5.2, 4.2],
    fill: "#d6e3b9",
    border: "#80aa72"
  }
];

const workstationRows: Array<[number, number]> = [
  [-6.7, 0.1],
  [-4.1, 0.1],
  [-1.5, 0.1],
  [-6.7, 2.5],
  [-4.1, 2.5],
  [-1.5, 2.5]
];

export const workstationSeatAnchors: SeatAnchor[] = workstationRows.map(([x, z]) => ({
  position: [x + 0.1, 0, z + 0.88],
  rotation: -Math.PI / 2
}));

export const furnitureDefinitions: FurnitureDefinition[] = [
  {
    id: "meeting-table",
    kind: "meetingTable",
    room: "meeting",
    position: [-4.8, -3.35],
    size: [3.8, 0.36, 2.2],
    color: "#bf8559",
    accent: "#7d4f31"
  },
  {
    id: "meeting-divider",
    kind: "divider",
    room: "meeting",
    position: [0.1, -0.72],
    size: [0.22, 1.15, 6.1],
    color: "#d6d4d2"
  },
  {
    id: "meeting-plant",
    kind: "plant",
    room: "meeting",
    position: [-8.8, -1.9],
    color: "#5fa282",
    accent: "#81614d"
  },
  {
    id: "server-a",
    kind: "server",
    room: "workstations",
    position: [-10.2, 0.2],
    size: [1.1, 2.6, 1.1],
    color: "#273148",
    accent: "#74d4cf"
  },
  {
    id: "server-b",
    kind: "server",
    room: "workstations",
    position: [-10.2, 2.2],
    size: [1.1, 2.6, 1.1],
    color: "#273148",
    accent: "#74d4cf"
  },
  {
    id: "restaurant-divider",
    kind: "divider",
    room: "restaurant",
    position: [4.45, -0.1],
    size: [6.5, 1.15, 0.2],
    rotation: Math.PI / 2,
    color: "#d6d4d2"
  },
  {
    id: "counter",
    kind: "counter",
    room: "restaurant",
    position: [9.6, -4.4],
    size: [1.1, 1.0, 3.2],
    color: "#bb805a",
    accent: "#8a5a3f"
  },
  {
    id: "sofa-a",
    kind: "sofa",
    room: "restaurant",
    position: [6.5, -1.65],
    size: [3.4, 0.8, 1.2],
    color: "#6d75ad",
    accent: "#4d557f"
  },
  {
    id: "sofa-b",
    kind: "sofa",
    room: "restaurant",
    position: [8.8, -2.95],
    size: [1.2, 0.8, 3.1],
    color: "#6d75ad",
    accent: "#4d557f"
  },
  {
    id: "restaurant-stool-a",
    kind: "stool",
    room: "restaurant",
    position: [8.7, -4.3],
    color: "#edc780"
  },
  {
    id: "restaurant-stool-b",
    kind: "stool",
    room: "restaurant",
    position: [8.7, -3.25],
    color: "#edc780"
  },
  {
    id: "gym-bench",
    kind: "bench",
    room: "gym",
    position: [6.2, 2.9],
    size: [2.3, 0.58, 1.0],
    color: "#4d9f83",
    accent: "#2d6f5d"
  },
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
    color: "#59a47b",
    accent: "#85624d"
  },
  ...workstationRows.flatMap(([x, z], index) => [
    {
      id: `desk-${index}`,
      kind: "desk" as const,
      room: "workstations" as const,
      position: [x, z] as [number, number],
      size: [1.8, 0.18, 0.95] as [number, number, number],
      color: "#c89864",
      accent: "#915f3d"
    },
    {
      id: `chair-${index}`,
      kind: "chair" as const,
      room: "workstations" as const,
      position: [x + 0.1, z + 0.95] as [number, number],
      size: [0.62, 0.6, 0.62] as [number, number, number],
      color: "#697194",
      accent: "#4e5671"
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
