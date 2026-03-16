import { promises as fs } from "fs";
import path from "path";

import { analyzeOperations } from "@/lib/openclaw/analysis";
import { openClawConfig } from "@/lib/openclaw/config";
import type {
  AgentState,
  ModelBinding,
  OperationAnalysis,
  OperationLog,
  RoomId,
  WorldSnapshot
} from "@/lib/openclaw/types";

interface WorldFile {
  updatedAt: string;
  source: string;
  rooms: WorldSnapshot["rooms"];
  agents: Omit<AgentState, "binding">[];
  highlights: string[];
}

interface RawBindingsFile {
  driver: string;
  defaultEndpoint?: string;
  bindings: Record<string, Omit<ModelBinding, "key" | "driver" | "endpoint"> & {
    driver?: string;
    endpoint?: string;
  }>;
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function sortOperations(latestFirst: OperationLog[]): OperationLog[] {
  return [...latestFirst].sort((left, right) => {
    return (
      new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
    );
  });
}

export class FileOpenClawProvider {
  async getWorldSnapshot(): Promise<WorldSnapshot> {
    const [world, bindings] = await Promise.all([
      readJsonFile<WorldFile>(openClawConfig.worldFile),
      this.readBindings()
    ]);

    return {
      updatedAt: world.updatedAt,
      source: world.source,
      adapter: `${openClawConfig.driverName} / ${bindings.driver}`,
      rooms: world.rooms,
      highlights: world.highlights,
      agents: world.agents.map((agent) => ({
        ...agent,
        binding: agent.modelBindingKey
          ? bindings.bindings[agent.modelBindingKey] ?? null
          : null
      })),
      bindingGuide: {
        driver: bindings.driver,
        worldFile: path.relative(process.cwd(), openClawConfig.worldFile),
        bindingsFile: path.relative(process.cwd(), openClawConfig.bindingsFile),
        operationsDir: path.relative(process.cwd(), openClawConfig.operationsDir),
        nextStep:
          "把 model-bindings.json 里的 model 和 endpoint 替换成你的 openclaw 模型入口，操作文件按现有 JSON 结构落到 operations 目录即可。"
      }
    };
  }

  async listOperations(filters?: {
    room?: RoomId;
    agentId?: string;
    limit?: number;
  }): Promise<OperationLog[]> {
    const operations = await this.readOperations();
    const filtered = operations.filter((operation) => {
      const roomMatch = filters?.room ? operation.room === filters.room : true;
      const agentMatch = filters?.agentId
        ? operation.agentId === filters.agentId
        : true;
      return roomMatch && agentMatch;
    });

    if (!filters?.limit) {
      return filtered;
    }

    return filtered.slice(0, filters.limit);
  }

  async getAnalysis(): Promise<OperationAnalysis> {
    const [snapshot, operations] = await Promise.all([
      this.getWorldSnapshot(),
      this.listOperations()
    ]);
    return analyzeOperations(operations, snapshot.agents);
  }

  private async readBindings(): Promise<{
    driver: string;
    bindings: Record<string, ModelBinding>;
  }> {
    const raw = await readJsonFile<RawBindingsFile>(openClawConfig.bindingsFile);
    const bindings = Object.entries(raw.bindings).reduce<
      Record<string, ModelBinding>
    >((result, [key, binding]) => {
      result[key] = {
        key,
        label: binding.label,
        driver: binding.driver ?? raw.driver,
        endpoint: binding.endpoint ?? raw.defaultEndpoint ?? "http://localhost:7788",
        model: binding.model,
        snapshotFile: binding.snapshotFile,
        operationsPattern: binding.operationsPattern,
        notes: binding.notes
      };
      return result;
    }, {});

    return {
      driver: raw.driver,
      bindings
    };
  }

  private async readOperations(): Promise<OperationLog[]> {
    const entries = await fs.readdir(openClawConfig.operationsDir);
    const files = entries.filter((entry) => entry.endsWith(".json")).sort();
    const batches = await Promise.all(
      files.map(async (fileName) => {
        const filePath = path.join(openClawConfig.operationsDir, fileName);
        const payload = await readJsonFile<OperationLog | OperationLog[]>(filePath);
        const items = Array.isArray(payload) ? payload : [payload];

        return items.map((item, index) => ({
          ...item,
          file: item.file || `${fileName}#${index + 1}`
        }));
      })
    );

    return sortOperations(batches.flat());
  }
}
