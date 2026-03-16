import { emptyRiskCounts, emptyRoomCounts } from "@/lib/openclaw/config";
import type {
  AgentState,
  AnalysisWarning,
  OperationAnalysis,
  OperationLog
} from "@/lib/openclaw/types";

const IDLE_WARNING_MINUTES = 20;

function getMinutesSince(isoTimestamp: string): number {
  const now = Date.now();
  const target = new Date(isoTimestamp).getTime();
  return Math.max(0, Math.round((now - target) / 60000));
}

export function analyzeOperations(
  operations: OperationLog[],
  agents: AgentState[]
): OperationAnalysis {
  const roomCounts = emptyRoomCounts();
  const riskCounts = emptyRiskCounts();
  const warnings: AnalysisWarning[] = [];
  const quietAgents: string[] = [];
  const failureCounter = new Map<string, number>();

  operations.forEach((operation) => {
    roomCounts[operation.room] += 1;
    riskCounts[operation.risk] += 1;

    if (!operation.success) {
      failureCounter.set(
        operation.agentId,
        (failureCounter.get(operation.agentId) ?? 0) + 1
      );
    }

    if (!operation.detail.trim()) {
      warnings.push({
        level: "medium",
        title: "检测到空操作描述",
        detail: `${operation.id} 缺少 detail 字段，建议检查 openclaw 输出格式。`
      });
    }

    if (operation.durationSec <= 0) {
      warnings.push({
        level: "medium",
        title: "检测到异常耗时",
        detail: `${operation.id} 的 durationSec 小于等于 0，文件可能已损坏。`
      });
    }
  });

  agents.forEach((agent) => {
    const idleMinutes = getMinutesSince(agent.lastSeen);
    const isQuiet =
      (agent.status === "idle" || agent.status === "offline") &&
      idleMinutes >= IDLE_WARNING_MINUTES;

    if (isQuiet) {
      quietAgents.push(agent.name);
      warnings.push({
        level: "medium",
        title: "长时间静默",
        detail: `${agent.name} 已安静 ${idleMinutes} 分钟，建议检查模型是否卡住。`
      });
    }
  });

  failureCounter.forEach((count, agentId) => {
    if (count >= 2) {
      warnings.push({
        level: "high",
        title: "连续失败动作",
        detail: `${agentId} 在最近记录里有 ${count} 次失败动作，需要排查底层驱动或模型绑定。`
      });
    }
  });

  const total = operations.length;
  const failed = operations.filter((operation) => !operation.success).length;

  return {
    totals: {
      total,
      successful: total - failed,
      failed
    },
    roomCounts,
    riskCounts,
    warnings: warnings.slice(0, 6),
    quietAgents,
    successRate: total === 0 ? 100 : Math.round(((total - failed) / total) * 100)
  };
}
