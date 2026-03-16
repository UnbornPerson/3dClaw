import type { GetServerSideProps } from "next";
import Head from "next/head";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ActivityPanel } from "@/components/ActivityPanel";
import { AvatarCustomizer } from "@/components/AvatarCustomizer";
import { IsometricOffice } from "@/components/IsometricOffice";
import styles from "@/styles/Home.module.css";

import type {
  AgentHeading,
  AvatarStyle,
  OperationAnalysis,
  OperationLog,
  RenderedAgentState,
  RoomId,
  WorldSnapshot
} from "@/lib/openclaw/types";
import { openClawConfig } from "@/lib/openclaw/config";
import { openClawProvider } from "@/lib/openclaw/provider";

interface WorldApiPayload {
  snapshot: WorldSnapshot;
  analysis: OperationAnalysis;
  pollIntervalMs: number;
}

interface OperationsApiPayload {
  operations: OperationLog[];
}

interface HomePageProps {
  initialSnapshot: WorldSnapshot | null;
  initialAnalysis: OperationAnalysis | null;
  initialOperations: OperationLog[];
  initialPollIntervalMs: number;
  initialError?: string;
}

const roomNames: Record<RoomId, string> = {
  workstations: "工位区",
  meeting: "会议室",
  gym: "健身房",
  restaurant: "餐厅"
};

const roomFilters: Array<{ id: RoomId | "all"; label: string }> = [
  { id: "all", label: "全楼层" },
  { id: "workstations", label: "工位区" },
  { id: "meeting", label: "会议室" },
  { id: "gym", label: "健身房" },
  { id: "restaurant", label: "餐厅" }
];

const statusDots = {
  working: "#35b57d",
  idle: "#f1b24a",
  meeting: "#56c6cc",
  training: "#77c065",
  eating: "#d88c55",
  offline: "#75645f"
};

const MOTION_DURATION_MS = 1100;

function formatUpdateTime(timestamp?: string): string {
  if (!timestamp) {
    return "--";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(timestamp));
}

function getHeading(
  from: { x: number; y: number },
  to: { x: number; y: number }
): AgentHeading {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx >= 0 ? "east" : "west";
  }

  return dy >= 0 ? "south" : "north";
}

function mix(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

export default function HomePage({
  initialSnapshot,
  initialAnalysis,
  initialOperations,
  initialPollIntervalMs,
  initialError = ""
}: HomePageProps) {
  const [snapshot, setSnapshot] = useState<WorldSnapshot | null>(initialSnapshot);
  const [analysis, setAnalysis] = useState<OperationAnalysis | null>(initialAnalysis);
  const [operations, setOperations] = useState<OperationLog[]>(initialOperations);
  const [activeRoom, setActiveRoom] = useState<RoomId | "all">("all");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [styleOverrides, setStyleOverrides] = useState<
    Record<string, Partial<AvatarStyle>>
  >({});
  const [loading, setLoading] = useState(!initialSnapshot);
  const [error, setError] = useState(initialError);
  const [pollIntervalMs, setPollIntervalMs] = useState(initialPollIntervalMs);
  const [sceneAgents, setSceneAgents] = useState<RenderedAgentState[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const sceneAgentsRef = useRef<RenderedAgentState[]>([]);

  useEffect(() => {
    sceneAgentsRef.current = sceneAgents;
  }, [sceneAgents]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const cached = window.localStorage.getItem("claw-style-overrides");
    if (!cached) {
      return;
    }

    try {
      setStyleOverrides(JSON.parse(cached));
    } catch {
      window.localStorage.removeItem("claw-style-overrides");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      "claw-style-overrides",
      JSON.stringify(styleOverrides)
    );
  }, [styleOverrides]);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setLoading(true);

      try {
        const roomQuery = activeRoom === "all" ? "" : `&room=${activeRoom}`;
        const [worldResponse, operationsResponse] = await Promise.all([
          fetch("/api/world"),
          fetch(`/api/operations?limit=14${roomQuery}`)
        ]);

        if (!worldResponse.ok || !operationsResponse.ok) {
          throw new Error("无法读取 openclaw 数据源。");
        }

        const worldPayload = (await worldResponse.json()) as WorldApiPayload;
        const operationsPayload =
          (await operationsResponse.json()) as OperationsApiPayload;

        if (isCancelled) {
          return;
        }

        setSnapshot(worldPayload.snapshot);
        setAnalysis(worldPayload.analysis);
        setOperations(operationsPayload.operations);
        setPollIntervalMs(worldPayload.pollIntervalMs);
        setSelectedAgentId((current) => {
          const exists = worldPayload.snapshot.agents.some(
            (agent) => agent.id === current
          );
          return exists ? current : worldPayload.snapshot.agents[0]?.id ?? "";
        });
        setError("");
      } catch (loadError) {
        if (isCancelled) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : "读取数据时发生未知错误。"
        );
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadData();
    const timer = window.setInterval(loadData, pollIntervalMs);

    return () => {
      isCancelled = true;
      window.clearInterval(timer);
    };
  }, [activeRoom, pollIntervalMs]);

  const agents = useMemo(
    () =>
      snapshot
        ? snapshot.agents.map((agent) => ({
            ...agent,
            style: {
              ...agent.style,
              ...(styleOverrides[agent.id] ?? {})
            }
          }))
        : [],
    [snapshot, styleOverrides]
  );

  useEffect(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (agents.length === 0) {
      setSceneAgents([]);
      return;
    }

    const currentById = new Map(sceneAgentsRef.current.map((agent) => [agent.id, agent]));
    const prepared = agents.map((agent) => {
      const previous = currentById.get(agent.id);
      const startPosition = previous
        ? { ...previous.visualPosition }
        : { ...agent.position };
      const moved =
        Math.abs(agent.position.x - startPosition.x) > 0.08 ||
        Math.abs(agent.position.y - startPosition.y) > 0.08;

      return {
        ...agent,
        previousPosition: startPosition,
        visualPosition: startPosition,
        heading: previous ? getHeading(startPosition, agent.position) : "south",
        isMoving: moved
      };
    });

    if (sceneAgentsRef.current.length === 0) {
      setSceneAgents(
        prepared.map((agent) => ({
          ...agent,
          previousPosition: { ...agent.position },
          visualPosition: { ...agent.position },
          isMoving: false
        }))
      );
      return;
    }

    setSceneAgents(prepared);

    const animationStart = window.performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - animationStart) / MOTION_DURATION_MS);

      setSceneAgents(
        prepared.map((agent) => ({
          ...agent,
          visualPosition: {
            x: mix(agent.previousPosition.x, agent.position.x, progress),
            y: mix(agent.previousPosition.y, agent.position.y, progress)
          },
          isMoving: agent.isMoving && progress < 0.999
        }))
      );

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(tick);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [agents]);

  const selectedAgent =
    agents.find((agent) => agent.id === selectedAgentId) ?? agents[0] ?? null;

  const onlineAgents = agents.filter((agent) => agent.status !== "offline");
  const busyAgents = agents.filter((agent) =>
    ["working", "meeting", "training"].includes(agent.status)
  );

  function updateSelectedAgentStyle(patch: Partial<AvatarStyle>) {
    if (!selectedAgent) {
      return;
    }

    setStyleOverrides((current) => ({
      ...current,
      [selectedAgent.id]: {
        ...current[selectedAgent.id],
        ...patch
      }
    }));
  }

  function resetSelectedAgentStyle() {
    if (!selectedAgent) {
      return;
    }

    setStyleOverrides((current) => {
      const next = { ...current };
      delete next[selectedAgent.id];
      return next;
    });
  }

  return (
    <>
      <Head>
        <title>3D Claw Office</title>
        <meta
          content="基于 openclaw 绑定的龙虾办公空间可视化面板。"
          name="description"
        />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
      </Head>

      <main className={styles.page}>
        <div className={styles.appShell}>
          <aside className={styles.navRail}>
            <div className={styles.navBrand}>C</div>
            <button className={`${styles.navButton} ${styles.navButtonActive}`} type="button">
              HQ
            </button>
            <button className={styles.navButton} type="button">
              OP
            </button>
            <button className={styles.navButton} type="button">
              GM
            </button>
            <button className={styles.navButton} type="button">
              ME
            </button>
            <button className={styles.navButton} type="button">
              LG
            </button>
          </aside>

          <div className={styles.workspace}>
            <header className={styles.topBar}>
              <div className={styles.commandDeck}>
                <div className={styles.commandHead}>
                  <div>
                    <p className={styles.eyebrow}>Lobster Headquarters</p>
                    <h1 className={styles.commandTitle}>Command Board</h1>
                  </div>
                  <div className={styles.commandMeta}>
                    <span className={styles.secondaryPill}>
                      {loading ? "同步中..." : `更新 ${formatUpdateTime(snapshot?.updatedAt)}`}
                    </span>
                    <span className={styles.primaryPill}>
                      在线 {onlineAgents.length} / 忙碌 {busyAgents.length}
                    </span>
                  </div>
                </div>

                <div className={styles.agentStrip}>
                  {agents.map((agent) => (
                    <button
                      className={`${styles.agentChip} ${
                        selectedAgentId === agent.id ? styles.agentChipActive : ""
                      }`}
                      key={agent.id}
                      onClick={() => setSelectedAgentId(agent.id)}
                      style={
                        {
                          ["--dot-color" as "--dot-color"]: statusDots[agent.status]
                        } as CSSProperties
                      }
                      type="button"
                    >
                      <span className={styles.agentChipDot} />
                      <span className={styles.agentChipMeta}>
                        <strong>{agent.name}</strong>
                        <span>{roomNames[agent.room]}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.topWidgets}>
                <article className={styles.statusCard}>
                  <span className={styles.statusLabel}>Agents</span>
                  <strong className={styles.statusValue}>{onlineAgents.length}</strong>
                  <p>场景内在线单位</p>
                </article>

                <article className={styles.statusCard}>
                  <span className={styles.statusLabel}>Ops</span>
                  <strong className={styles.statusValue}>
                    {analysis?.successRate ?? "--"}%
                  </strong>
                  <p>最近动作成功率</p>
                </article>

                <article className={styles.statusCard}>
                  <span className={styles.statusLabel}>Busy</span>
                  <strong className={styles.statusValue}>{busyAgents.length}</strong>
                  <p>工作中或移动中</p>
                </article>

                <article className={styles.statusCard}>
                  <span className={styles.statusLabel}>Alert</span>
                  <strong className={styles.statusValue}>
                    {analysis?.riskCounts.high ?? 0}
                  </strong>
                  <p>高风险动作</p>
                </article>
              </div>
            </header>

            {error ? <div className={styles.errorBanner}>{error}</div> : null}

            <div className={styles.sceneToolbar}>
              <div className={styles.roomSelector}>
                {roomFilters.map((room) => {
                  const roomCount =
                    room.id === "all"
                      ? agents.length
                      : agents.filter((agent) => agent.room === room.id).length;

                  return (
                    <button
                      className={`${styles.roomButton} ${
                        activeRoom === room.id ? styles.roomButtonActive : ""
                      }`}
                      key={room.id}
                      onClick={() => setActiveRoom(room.id)}
                      type="button"
                    >
                      <span>{room.label}</span>
                      <strong>{roomCount}</strong>
                    </button>
                  );
                })}
              </div>

              <div className={styles.inlineMeta}>
                <span className={styles.primaryPill}>
                  驱动 {snapshot?.bindingGuide.driver ?? "openclaw"}
                </span>
                <span className={styles.secondaryPill}>
                  最近更新 {formatUpdateTime(snapshot?.updatedAt)}
                </span>
                <span className={styles.secondaryPill}>
                  {loading ? "同步中..." : activeRoom === "all" ? "全楼层" : roomNames[activeRoom]}
                </span>
              </div>
            </div>

            <div className={styles.contentGrid}>
              <section className={styles.scenePanel}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.eyebrow}>World View</p>
                    <h2 className={styles.panelTitle}>单体 3D 办公室</h2>
                  </div>
                  <span className={styles.panelHint}>网页端可部署场景</span>
                </div>

                <IsometricOffice
                  activeRoom={activeRoom}
                  agents={sceneAgents}
                  onSelectAgent={setSelectedAgentId}
                  rooms={snapshot?.rooms ?? []}
                  selectedAgentId={selectedAgentId}
                />

                <div className={styles.bottomBar}>
                  {(snapshot?.highlights ?? []).slice(0, 4).map((item) => (
                    <span className={styles.smallStat} key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </section>

              <aside className={styles.inspectorColumn}>
                <div className={styles.panelCard}>
                  <div className={styles.panelHeader}>
                    <div>
                      <p className={styles.eyebrow}>Binding</p>
                      <h2 className={styles.panelTitle}>模型接入</h2>
                    </div>
                    <span className={styles.panelHint}>只改绑定即可</span>
                  </div>

                  <div className={styles.bindingGuide}>
                    <div>
                      <span className={styles.bindingLabel}>世界快照</span>
                      <code>{snapshot?.bindingGuide.worldFile ?? "data/openclaw/world.json"}</code>
                    </div>
                    <div>
                      <span className={styles.bindingLabel}>模型映射</span>
                      <code>
                        {snapshot?.bindingGuide.bindingsFile ??
                          "data/openclaw/model-bindings.json"}
                      </code>
                    </div>
                    <div>
                      <span className={styles.bindingLabel}>动作文件</span>
                      <code>
                        {snapshot?.bindingGuide.operationsDir ??
                          "data/openclaw/operations"}
                      </code>
                    </div>
                  </div>

                  <p className={styles.helperText}>
                    {snapshot?.bindingGuide.nextStep ??
                      "把 openclaw 输出映射成当前 JSON 结构即可开始可视化。"}
                  </p>
                  <code className={styles.command}>npm run inspect:openclaw</code>
                </div>

                <ActivityPanel
                  activeRoom={activeRoom}
                  analysis={analysis}
                  operations={operations}
                  selectedAgentId={selectedAgentId}
                />

                <AvatarCustomizer
                  agent={selectedAgent}
                  onReset={resetSelectedAgentStyle}
                  onStyleChange={updateSelectedAgentStyle}
                />
              </aside>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async () => {
  try {
    const [initialSnapshot, initialAnalysis, initialOperations] = await Promise.all([
      openClawProvider.getWorldSnapshot(),
      openClawProvider.getAnalysis(),
      openClawProvider.listOperations({
        limit: openClawConfig.defaultOperationLimit
      })
    ]);

    return {
      props: {
        initialSnapshot,
        initialAnalysis,
        initialOperations,
        initialPollIntervalMs: openClawConfig.pollIntervalMs
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "无法读取 openclaw 数据。";

    return {
      props: {
        initialSnapshot: null,
        initialAnalysis: null,
        initialOperations: [],
        initialPollIntervalMs: openClawConfig.pollIntervalMs,
        initialError: message
      }
    };
  }
};
