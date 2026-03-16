import dynamic from "next/dynamic";

import styles from "@/styles/Office.module.css";

import type { RenderedAgentState, RoomId, RoomSummary } from "@/lib/openclaw/types";

import { roomDisplayNames } from "@/components/office3d/sceneData";

interface IsometricOfficeProps {
  rooms: RoomSummary[];
  agents: RenderedAgentState[];
  activeRoom: RoomId | "all";
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
}

const OfficeScene = dynamic(
  () => import("@/components/office3d/OfficeScene").then((module) => module.OfficeScene),
  {
    loading: () => <div className={styles.canvasFallback}>Loading 3D office...</div>,
    ssr: false
  }
);

const toolDockItems = [
  { id: "map", label: "MAP", meta: "房间" },
  { id: "ops", label: "OPS", meta: "任务" },
  { id: "unit", label: "UNIT", meta: "龙虾" }
] as const;

export function IsometricOffice({
  rooms,
  agents,
  activeRoom,
  selectedAgentId,
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
              ? `${roomDisplayNames[selectedAgent.room]} / ${
                  selectedAgent.isMoving ? "moving" : selectedAgent.status
                }`
              : "拖拽旋转、滚轮缩放，选择一只龙虾查看位置和动作。"}
          </p>
        </div>
      </div>

      <div className={styles.toolDock}>
        {toolDockItems.map((item, index) => (
          <button
            className={`${styles.toolButton} ${index === 0 ? styles.toolButtonActive : ""}`}
            key={item.id}
            type="button"
          >
            <span className={styles.toolIndex}>{`0${index + 1}`}</span>
            <span className={styles.toolMeta}>
              <strong>{item.label}</strong>
              <small>{item.meta}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
