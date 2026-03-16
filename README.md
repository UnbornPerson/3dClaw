# 3D Claw Office

一个可部署到网站上的 `openclaw` 龙虾办公空间可视化项目。当前版本已经包含：

- 可视化 office 场景：工位区、会议室、健身房、餐厅
- 龙虾角色状态面板与在线操作流
- 人物外观修改：机体颜色、点缀色、配件、标签
- `openclaw` 文件适配层：读取世界快照、模型绑定、操作日志
- 动作文件检测工具：快速检查 `operations` 目录是否有结构错误

## 运行

```bash
npm install
npm run dev
```

生产部署：

```bash
npm run build
npm run start
```

适合部署到支持 Node 的平台，例如 Vercel、Railway、Render 或你自己的服务器。

## 你后续主要要改的地方

1. 在 [data/openclaw/model-bindings.json](/Users/guogai/MyWork/3dClaw/data/openclaw/model-bindings.json) 里把 `model` 和 `endpoint` 换成你的真实 `openclaw` 模型入口。
2. 在 [data/openclaw/world.json](/Users/guogai/MyWork/3dClaw/data/openclaw/world.json) 里维护龙虾角色、房间位置、当前动作和样式。
3. 把真实动作文件按当前 JSON 结构写到 [data/openclaw/operations](/Users/guogai/MyWork/3dClaw/data/openclaw/operations) 目录。

## API

- `GET /api/world`：返回当前 world snapshot + 分析结果
- `GET /api/operations`：返回操作流，支持 `room`、`agentId`、`limit`
- `GET /api/analysis`：返回日志分析结果

## 检测工具

检查动作文件目录：

```bash
npm run inspect:openclaw
```

也可以传入自定义目录：

```bash
npm run inspect:openclaw -- ./your/openclaw/operations
```

## 数据结构说明

### `world.json`

- `rooms`：四个区域的元信息
- `agents`：角色状态、位置、样式、绑定 key
- `highlights`：首页摘要

### `model-bindings.json`

- `driver`：底层驱动名称
- `bindings`：角色到模型的映射
- `endpoint`：模型服务地址
- `model`：模型名称或 ID

### `operations/*.json`

每条操作至少包含：

- `id`
- `agentId`
- `timestamp`
- `type`
- `room`
- `detail`
- `file`
- `durationSec`
- `success`
- `risk`

## 绑定建议

如果你的 `openclaw` 底层不是直接输出这套 JSON，可以在 [lib/openclaw/fileProvider.ts](/Users/guogai/MyWork/3dClaw/lib/openclaw/fileProvider.ts) 里替换读取逻辑，只保留返回的 `WorldSnapshot` 和 `OperationLog` 结构不变，前端就不需要再改。
