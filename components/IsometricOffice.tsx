import dynamic from "next/dynamic";

import styles from "@/styles/Office.module.css";

import type { AgentState, RoomId, RoomSummary } from "@/lib/openclaw/types";

import { roomDisplayNames } from "@/components/office3d/sceneData";

interface IsometricOfficeProps {
  rooms: RoomSummary[];
  agents: AgentState[];
  activeRoom: RoomId | "all";
  selectedAgentId: string;
  firstPersonMode?: boolean;
  onSelectAgent: (agentId: string) => void;
}

const OfficeScene = dynamic(
  () => import("@/components/office3d/OfficeScene").then((module) => module.OfficeScene),
  {
    loading: () => <div className={styles.canvasFallback}>Loading 3D office...</div>,
    ssr: false
  }
);

export function IsometricOffice({
  rooms,
  agents,
  activeRoom,
  selectedAgentId,
  firstPersonMode,
  onSelectAgent
}: IsometricOfficeProps) {
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) ?? agents[0] ?? null;
  const visibleAgents =
    activeRoom === "all"
      ? agents
      : agents.filter((agent) => agent.room === activeRoom);
  const activeRoomLabel =
    activeRoom === "all"
      ? "全楼层"
      : rooms.find((room) => room.id === activeRoom)?.name ?? roomDisplayNames[activeRoom];

  return (
    <div className={styles.stage}>
      <div className={styles.stageGlow} />
      <div className={styles.canvasMount}>
        <OfficeScene
          activeRoom={activeRoom}
          agents={agents}
          onSelectAgent={onSelectAgent}
          rooms={rooms}
          selectedAgentId={selectedAgentId}
          firstPersonMode={firstPersonMode}
        />
      </div>

      <div className={styles.sceneHud}>
        <div className={styles.hudCard}>
          <span className={styles.hudCaption}>Room View</span>
          <strong>{activeRoomLabel}</strong>
          <div className={styles.hudStats}>
            <span className={styles.hudStat}>
              <em>{visibleAgents.length}</em>
              units
            </span>
            <span className={styles.hudStat}>
              <em>{rooms.length}</em>
              zones
            </span>
          </div>
        </div>
        <div className={styles.hudTicker}>
          <span className={styles.hudCaption}>Selected Unit</span>
          <strong>{selectedAgent?.name ?? "No unit"}</strong>
          <p>
            {selectedAgent
              ? `${roomDisplayNames[selectedAgent.room]} / ${selectedAgent.status}`
              : "拖拽旋转、滚轮缩放，选择一只龙虾查看位置和动作。"}
          </p>
        </div>
      </div>

    </div>
  );
}
