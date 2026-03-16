import styles from "@/styles/Home.module.css";

import type { Accessory, AgentState, AvatarStyle } from "@/lib/openclaw/types";

interface AvatarCustomizerProps {
  agent: AgentState | null;
  onStyleChange: (patch: Partial<AvatarStyle>) => void;
  onNameChange?: (name: string) => void;
  onReset: () => void;
}

const accessoryOptions: Array<{ value: Accessory; label: string }> = [
  { value: "headset", label: "耳机" },
  { value: "visor", label: "护目镜" },
  { value: "cap", label: "帽子" },
  { value: "badge", label: "胸牌" }
];

export function AvatarCustomizer({
  agent,
  onStyleChange,
  onNameChange,
  onReset
}: AvatarCustomizerProps) {
  if (!agent) {
    return (
      <div className={styles.panelCard}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Avatar</p>
            <h2 className={styles.panelTitle}>人物样式</h2>
          </div>
        </div>
        <div className={styles.emptyState}>选择一个龙虾角色后可修改外观样式。</div>
      </div>
    );
  }

  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.eyebrow}>Avatar</p>
          <h2 className={styles.panelTitle}>人物样式</h2>
        </div>
        <button className={styles.secondaryButton} onClick={onReset} type="button">
          重置
        </button>
      </div>

      <div className={styles.agentSummary}>
        <div>
          <strong>{agent.name}</strong>
          <p>{agent.action}</p>
        </div>
        <span className={styles.agentRoom}>{agent.style.label}</span>
      </div>

      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>代号 / 昵称</span>
          <input
            className={styles.fieldControl}
            onChange={(event) => onNameChange?.(event.target.value)}
            type="text"
            value={agent.name}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>机体主色</span>
          <input
            className={styles.colorInput}
            onChange={(event) => onStyleChange({ body: event.target.value })}
            type="color"
            value={agent.style.body}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>点缀颜色</span>
          <input
            className={styles.colorInput}
            onChange={(event) => onStyleChange({ accent: event.target.value })}
            type="color"
            value={agent.style.accent}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>头部颜色</span>
          <input
            className={styles.colorInput}
            onChange={(event) => onStyleChange({ skin: event.target.value })}
            type="color"
            value={agent.style.skin}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>配件</span>
          <select
            className={styles.fieldControl}
            onChange={(event) =>
              onStyleChange({ accessory: event.target.value as Accessory })
            }
            value={agent.style.accessory}
          >
            {accessoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>显示标签</span>
          <input
            className={styles.fieldControl}
            onChange={(event) => onStyleChange({ label: event.target.value })}
            type="text"
            value={agent.style.label}
          />
        </label>
      </div>

      <div className={styles.progressGroup}>
        <div className={styles.progressItem}>
          <div className={styles.progressMeta}>
            <span>能量</span>
            <strong>{agent.energy}%</strong>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFillWarm} style={{ width: `${agent.energy}%` }} />
          </div>
        </div>

        <div className={styles.progressItem}>
          <div className={styles.progressMeta}>
            <span>专注度</span>
            <strong>{agent.focus}%</strong>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFillCool} style={{ width: `${agent.focus}%` }} />
          </div>
        </div>
      </div>

      <div className={styles.bindingCard}>
        <p className={styles.bindingLabel}>模型绑定</p>
        <strong>{agent.binding?.label ?? "未绑定模型"}</strong>
        <p>{agent.binding?.notes ?? "在 model-bindings.json 中为该角色补充模型配置。"}</p>
        <div className={styles.bindingMeta}>
          <span>{agent.binding?.model ?? "bind-your-model"}</span>
          <span>{agent.binding?.endpoint ?? "http://localhost:7788"}</span>
        </div>
      </div>
    </div>
  );
}
