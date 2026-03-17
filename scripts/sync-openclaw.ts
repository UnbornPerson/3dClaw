#!/usr/bin/env ts-node

/**
 * Sync script to fetch OpenClaw session data and update world.json
 * 
 * Usage: npm run sync:openclaw
 * 
 * Or run directly: npx ts-node scripts/sync-openclaw.ts
 */

import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const PROJECT_DIR = process.cwd();
const WORLD_FILE = path.join(PROJECT_DIR, "data", "openclaw", "world.json");

interface Agent {
  id: string;
  name: string;
  room: string;
  position: { x: number; y: number };
  action: string;
  status: string;
  target: string;
  energy: number;
  focus: number;
  lastSeen: string;
  modelBindingKey: string;
  style: {
    body: string;
    accent: string;
    skin: string;
    accessory: string;
    label: string;
  };
}

interface WorldData {
  updatedAt: string;
  source: string;
  highlights: string[];
  rooms: Array<{
    id: string;
    name: string;
    description: string;
    capacity: number;
    color: string;
    anchor: { x: number; y: number };
  }>;
  agents: Agent[];
}

async function getOpenClawSessions(): Promise<any> {
  try {
    const { stdout } = await execAsync("openclaw sessions --json", {
      timeout: 10000
    });
    return JSON.parse(stdout);
  } catch (error) {
    console.error("Failed to get OpenClaw sessions:", error);
    return null;
  }
}

async function getOpenClawStatus(): Promise<any> {
  try {
    // Get gateway status
    const { stdout } = await execAsync("openclaw status --json 2>/dev/null || echo '{}'", {
      timeout: 10000
    });
    return JSON.parse(stdout);
  } catch (error) {
    console.error("Failed to get OpenClaw status:", error);
    return null;
  }
}

function generateWorldFromSessions(sessions: any[], status: any): WorldData {
  const now = new Date().toISOString();
  
  // Default rooms
  const rooms = [
    { id: "workstations", name: "办公区", description: "核心执行与排班区域", capacity: 8, color: "#c96b3f", anchor: { x: 57, y: 50 } },
    { id: "meeting", name: "会议室", description: "策略评审与联动决策", capacity: 4, color: "#4b7a78", anchor: { x: 14, y: 15 } },
    { id: "study", name: "学习区", description: "资料查阅与自主学习", capacity: 4, color: "#8c6bb1", anchor: { x: 14, y: 80 } },
    { id: "gym", name: "健身房", description: "恢复训练与动作校准", capacity: 3, color: "#6b8a48", anchor: { x: 95, y: 15 } },
    { id: "restaurant", name: "休息室", description: "能量补给与放松休息", capacity: 5, color: "#b2834e", anchor: { x: 95, y: 84 } }
  ];

  // Generate agents from sessions
  const agents: Agent[] = [];
  
  if (sessions && sessions.length > 0) {
    sessions.forEach((session, index) => {
      const roomTypes = ["workstations", "meeting", "gym", "restaurant"];
      const statuses = ["working", "idle", "meeting", "eating", "training"];
      const colors = ["#dc5f42", "#3c76b2", "#1e9082", "#cf6b4b", "#637c3d", "#8546a7"];
      
      agents.push({
        id: session.key || `agent-${index}`,
        name: session.key?.split(":").pop() || `Agent ${index + 1}`,
        room: roomTypes[index % roomTypes.length],
        position: { x: 20 + (index * 10), y: 30 + (index * 8) },
        action: session.kind === "direct" ? "与用户对话中" : "处理任务",
        status: session.kind === "direct" ? "working" : statuses[index % statuses.length],
        target: session.key || "default-task",
        energy: Math.floor(Math.random() * 40) + 60,
        focus: Math.floor(Math.random() * 40) + 60,
        lastSeen: now,
        modelBindingKey: "lobster.alpha",
        style: {
          body: colors[index % colors.length],
          accent: "#ffffff",
          skin: "#f3d1b0",
          accessory: index % 2 === 0 ? "headset" : "visor",
          label: session.kind === "direct" ? "Active" : "Background"
        }
      });
    });
  }

  // If no sessions, add demo agent with random movement
  if (agents.length === 0) {
    // Random room positions
    const roomPositions: Record<string, {x: number, y: number}> = {
      workstations: { x: 20 + Math.random() * 20, y: 20 + Math.random() * 20 },
      meeting: { x: 65 + Math.random() * 15, y: 15 + Math.random() * 15 },
      gym: { x: 15 + Math.random() * 15, y: 65 + Math.random() * 20 },
      restaurant: { x: 65 + Math.random() * 20, y: 60 + Math.random() * 20 }
    };
    const roomTypes = ["workstations", "meeting", "gym", "restaurant"] as const;
    const statuses = ["working", "idle", "meeting", "eating", "training"] as const;
    const actions = ["处理任务中", "等待任务", "会议中", "用餐中", "训练中"];
    const randomRoom = roomTypes[Math.floor(Math.random() * roomTypes.length)];
    const pos = roomPositions[randomRoom];
    
    agents.push({
      id: "demo-agent",
      name: "摸鱼的锅铲",
      room: randomRoom,
      position: { x: Math.round(pos.x * 10) / 10, y: Math.round(pos.y * 10) / 10 },
      action: actions[Math.floor(Math.random() * actions.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      target: "demo-task",
      energy: Math.floor(Math.random() * 30) + 70,
      focus: Math.floor(Math.random() * 30) + 70,
      lastSeen: now,
      modelBindingKey: "lobster.alpha",
      style: {
        body: "#dc5f42",
        accent: "#173e63",
        skin: "#f3d1b0",
        accessory: "headset",
        label: "摸鱼"
      }
    });
  }

  const highlights = [
    `当前有 ${agents.length} 个代理正在活动`,
    sessions && sessions.length > 0 ? "已连接到 OpenClaw 实时数据" : "运行在演示模式"
  ];

  return {
    updatedAt: now,
    source: "openclaw-live",
    highlights,
    rooms,
    agents
  };
}

async function main() {
  console.log("🔄 Syncing with OpenClaw...");
  
  try {
    // Fetch OpenClaw data
    const [sessions, status] = await Promise.all([
      getOpenClawSessions(),
      getOpenClawStatus()
    ]);
    
    console.log("📊 Sessions:", sessions?.length || 0);
    console.log("📊 Gateway:", status?.Gateway || "unknown");
    
    // Generate world data
    const worldData = generateWorldFromSessions(sessions, status);
    
    // Write to world.json
    await fs.writeFile(WORLD_FILE, JSON.stringify(worldData, null, 2), "utf8");
    
    console.log("✅ World data updated:", WORLD_FILE);
    console.log("👥 Agents:", worldData.agents.length);
    console.log("🏠 Rooms:", worldData.rooms.length);
    
  } catch (error) {
    console.error("❌ Sync failed:", error);
    process.exit(1);
  }
}

main();
