import styles from "@/styles/Home.module.css";

import type {
  OperationAnalysis,
  OperationLog,
  RoomId
} from "@/lib/openclaw/types";

interface ActivityPanelProps {
  analysis: OperationAnalysis | null;
  operations: OperationLog[];
  activeRoom: RoomId | "all";
  selectedAgentId: string;
}

const roomNames: Record<RoomId, string> = {
  workstations: "工位区",
  meeting: "会议室",
  gym: "健身房",
  restaurant: "餐厅"
};

const riskClassNames = {
  low: styles.badgeLow,
  medium: styles.badgeMedium,
  high: styles.badgeHigh
};

function formatTime(timestamp: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

export function ActivityPanel({
  analysis,
  operations,
  activeRoom,
  selectedAgentId
}: ActivityPanelProps) {
  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.eyebrow}>OpenClaw Feed</p>
          <h2 className={styles.panelTitle}>实时操作流</h2>
        </div>
        <span className={styles.panelHint}>
          {activeRoom === "all" ? "全楼层" : roomNames[activeRoom]}
        </span>
      </div>

      <div className={styles.kpiRow}>
        <div className={styles.kpiItem}>
          <span className={styles.kpiLabel}>成功率</span>
          <strong>{analysis?.successRate ?? "--"}%</strong>
        </div>
        <div className={styles.kpiItem}>
          <span className={styles.kpiLabel}>高风险</span>
          <strong>{analysis?.riskCounts.high ?? 0}</strong>
        </div>
        <div className={styles.kpiItem}>
          <span className={styles.kpiLabel}>失败</span>
          <strong>{analysis?.totals.failed ?? 0}</strong>
        </div>
      </div>

      <div className={styles.warningStack}>
        {(analysis?.warnings ?? []).slice(0, 3).map((warning) => (
          <div className={styles.warningCard} key={`${warning.title}-${warning.detail}`}>
            <div className={styles.warningHeader}>
              <span className={`${styles.badge} ${riskClassNames[warning.level]}`}>
                {warning.level}
              </span>
              <strong>{warning.title}</strong>
            </div>
            <p>{warning.detail}</p>
          </div>
        ))}
      </div>

      <div className={styles.feedList}>
        {operations.map((operation) => {
          const isFocused = selectedAgentId === operation.agentId;

          return (
            <article
              className={`${styles.feedItem} ${
                isFocused ? styles.feedItemFocused : ""
              }`}
              key={operation.id}
            >
              <div className={styles.feedMeta}>
                <span>{formatTime(operation.timestamp)}</span>
                <span>{roomNames[operation.room]}</span>
              </div>
              <div className={styles.feedTitleRow}>
                <strong className={styles.feedTitle}>{operation.agentId}</strong>
                <span className={`${styles.badge} ${riskClassNames[operation.risk]}`}>
                  {operation.success ? "ok" : "fail"}
                </span>
              </div>
              <p className={styles.feedDetail}>{operation.detail}</p>
              <div className={styles.feedMeta}>
                <span>{operation.file}</span>
                <span>{operation.durationSec}s</span>
              </div>
            </article>
          );
        })}

        {operations.length === 0 ? (
          <div className={styles.emptyState}>当前筛选下没有操作记录。</div>
        ) : null}
      </div>
    </div>
  );
}
