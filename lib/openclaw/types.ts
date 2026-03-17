export type RoomId = "workstations" | "gym" | "restaurant" | "meeting" | "study";
export type AgentStatus =
  | "working"
  | "idle"
  | "meeting"
  | "training"
  | "eating"
  | "offline";
export type RiskLevel = "low" | "medium" | "high";
export type OperationType =
  | "task"
  | "move"
  | "meeting"
  | "training"
  | "meal"
  | "warning"
  | "system";
export type Accessory = "visor" | "cap" | "headset" | "badge";
export type AgentHeading = "north" | "south" | "east" | "west";

export interface RoomSummary {
  id: RoomId;
  name: string;
  description: string;
  capacity: number;
  color: string;
  anchor: {
    x: number;
    y: number;
  };
}

export interface AvatarStyle {
  body: string;
  accent: string;
  skin: string;
  accessory: Accessory;
  label: string;
}

export interface ModelBinding {
  key: string;
  label: string;
  driver: string;
  endpoint: string;
  model: string;
  snapshotFile: string;
  operationsPattern: string;
  notes: string;
}

export interface AgentState {
  id: string;
  name: string;
  room: RoomId;
  position: {
    x: number;
    y: number;
  };
  action: string;
  status: AgentStatus;
  target?: string;
  energy: number;
  focus: number;
  lastSeen: string;
  modelBindingKey?: string;
  style: AvatarStyle;
  binding?: ModelBinding | null;
}

export interface RenderedAgentState extends AgentState {
  previousPosition: {
    x: number;
    y: number;
  };
  visualPosition: {
    x: number;
    y: number;
  };
  heading: AgentHeading;
  isMoving: boolean;
}

export interface BindingGuide {
  driver: string;
  worldFile: string;
  bindingsFile: string;
  operationsDir: string;
  nextStep: string;
}

export interface WorldSnapshot {
  updatedAt: string;
  source: string;
  adapter: string;
  rooms: RoomSummary[];
  agents: AgentState[];
  highlights: string[];
  bindingGuide: BindingGuide;
}

export interface OperationLog {
  id: string;
  agentId: string;
  timestamp: string;
  type: OperationType;
  room: RoomId;
  detail: string;
  file: string;
  durationSec: number;
  success: boolean;
  risk: RiskLevel;
}

export interface AnalysisWarning {
  level: RiskLevel;
  title: string;
  detail: string;
}

export interface OperationAnalysis {
  totals: {
    total: number;
    successful: number;
    failed: number;
  };
  roomCounts: Record<RoomId, number>;
  riskCounts: Record<RiskLevel, number>;
  warnings: AnalysisWarning[];
  quietAgents: string[];
  successRate: number;
}
