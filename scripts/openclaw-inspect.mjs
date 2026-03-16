import fs from "fs/promises";
import path from "path";

const root = process.cwd();
const operationsDir = process.argv[2]
  ? path.resolve(root, process.argv[2])
  : path.join(root, "data", "openclaw", "operations");

const requiredKeys = [
  "id",
  "agentId",
  "timestamp",
  "type",
  "room",
  "detail",
  "file",
  "durationSec",
  "success",
  "risk"
];

function flatten(payload) {
  return Array.isArray(payload) ? payload : [payload];
}

async function readOperationFiles() {
  const entries = await fs.readdir(operationsDir);
  const files = entries.filter((entry) => entry.endsWith(".json")).sort();

  const logs = [];
  for (const fileName of files) {
    const fullPath = path.join(operationsDir, fileName);
    const raw = await fs.readFile(fullPath, "utf8");
    const payload = JSON.parse(raw);
    flatten(payload).forEach((item) => {
      logs.push({
        ...item,
        __fileName: fileName
      });
    });
  }

  return logs;
}

function validate(logs) {
  const issues = [];
  const riskCounter = { low: 0, medium: 0, high: 0 };
  const roomCounter = {};

  for (const log of logs) {
    for (const key of requiredKeys) {
      if (!(key in log)) {
        issues.push(`${log.__fileName}: ${log.id ?? "unknown"} 缺少字段 ${key}`);
      }
    }

    if (typeof log.durationSec !== "number" || log.durationSec <= 0) {
      issues.push(`${log.__fileName}: ${log.id} 的 durationSec 非法`);
    }

    if (typeof log.detail !== "string" || !log.detail.trim()) {
      issues.push(`${log.__fileName}: ${log.id} 的 detail 为空`);
    }

    if (riskCounter[log.risk] !== undefined) {
      riskCounter[log.risk] += 1;
    }

    roomCounter[log.room] = (roomCounter[log.room] ?? 0) + 1;
  }

  return { issues, riskCounter, roomCounter };
}

async function main() {
  const logs = await readOperationFiles();
  const { issues, riskCounter, roomCounter } = validate(logs);
  const failed = logs.filter((log) => !log.success).length;
  const successRate =
    logs.length === 0 ? 100 : Math.round(((logs.length - failed) / logs.length) * 100);

  console.log("OpenClaw inspection");
  console.log(`目录: ${operationsDir}`);
  console.log(`文件条目: ${logs.length}`);
  console.log(`成功率: ${successRate}%`);
  console.log(`风险统计: low=${riskCounter.low}, medium=${riskCounter.medium}, high=${riskCounter.high}`);
  console.log(`房间统计: ${Object.entries(roomCounter).map(([room, count]) => `${room}=${count}`).join(", ")}`);

  if (issues.length) {
    console.error("\n发现问题:");
    issues.forEach((issue) => console.error(`- ${issue}`));
    process.exitCode = 1;
    return;
  }

  console.log("\n未发现结构性问题。");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
