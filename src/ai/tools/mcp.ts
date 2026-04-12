import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import {
  Experimental_StdioMCPTransport,
  type StdioConfig,
} from "@ai-sdk/mcp/mcp-stdio";
import type { ToolSet } from "ai";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import z from "zod";
import { createLogger } from "../../etc/log";

const log = createLogger("ai:tools:mcp");
const MCP_CONFIG_PATH = resolve(process.cwd(), "mcp.config.json");

const rawServerConfigSchema = z.object({
  transport: z.enum(["stdio", "http", "sse"]).optional(),
  disabled: z.boolean().optional(),
  command: z.string().trim().min(1).optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  cwd: z.string().trim().min(1).optional(),
  url: z.string().trim().min(1).optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

const rawConfigSchema = z.object({
  mcpServers: z.record(z.string(), rawServerConfigSchema).default({}),
});

type RawServerConfig = z.infer<typeof rawServerConfigSchema>;

type NormalizedServerConfig =
  | ({
      transport: "stdio";
    } & StdioConfig)
  | {
      transport: "http" | "sse";
      url: string;
      headers?: Record<string, string>;
    };

let cachedSignature: string | null = null;
let cachedTools: ToolSet = {};
let cachedClients: MCPClient[] = [];
let loadingPromise: Promise<ToolSet> | null = null;

function normalizeServerConfig(
  serverName: string,
  config: RawServerConfig,
): NormalizedServerConfig | null {
  if (config.disabled) {
    return null;
  }

  const transport = config.transport ?? (config.command ? "stdio" : undefined);
  if (!transport) {
    throw new Error(`MCP server "${serverName}" 缺少 transport 或 command`);
  }

  if (transport === "stdio") {
    if (!config.command) {
      throw new Error(`MCP server "${serverName}" 缺少 command`);
    }
    return {
      transport,
      command: config.command,
      args: config.args,
      env: config.env,
      cwd: config.cwd,
    };
  }

  if (!config.url) {
    throw new Error(`MCP server "${serverName}" 缺少 url`);
  }

  return {
    transport,
    url: config.url,
    headers: config.headers,
  };
}

function sanitizeToolSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function namespaceTools(
  serverName: string,
  toolSet: Record<string, any>,
): ToolSet {
  const nextToolSet: ToolSet = {};
  const safeServerName = sanitizeToolSegment(serverName);

  for (const [toolName, toolDefinition] of Object.entries(toolSet)) {
    const namespacedToolName = `mcp_${safeServerName}__${sanitizeToolSegment(toolName)}`;
    nextToolSet[namespacedToolName] = {
      ...toolDefinition,
      description:
        `[MCP/${serverName}/${toolName}] ${toolDefinition.description || ""}`.trim(),
    };
  }

  return nextToolSet;
}

async function closeClients(clients: MCPClient[]) {
  await Promise.allSettled(clients.map((client) => client.close()));
}

async function readConfigFile() {
  try {
    return await readFile(MCP_CONFIG_PATH, "utf8");
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function buildMcpToolsFromRawConfig(rawConfigText: string | null) {
  if (!rawConfigText) {
    return {
      tools: {} as ToolSet,
      clients: [] as MCPClient[],
    };
  }

  const parsedJson = JSON.parse(rawConfigText);
  const config = rawConfigSchema.parse(parsedJson);
  const nextTools: ToolSet = {};
  const nextClients: MCPClient[] = [];

  for (const [serverName, rawServerConfig] of Object.entries(
    config.mcpServers,
  )) {
    const normalizedServerConfig = normalizeServerConfig(
      serverName,
      rawServerConfig,
    );
    if (!normalizedServerConfig) {
      continue;
    }

    try {
      const client = await createMCPClient({
        name: "agent.zhangjiluo.com",
        version: "1.0.0",
        transport:
          normalizedServerConfig.transport === "stdio"
            ? new Experimental_StdioMCPTransport(normalizedServerConfig)
            : {
                type: normalizedServerConfig.transport,
                url: normalizedServerConfig.url,
                headers: normalizedServerConfig.headers,
              },
        onUncaughtError(error) {
          log.e(`MCP server ${serverName} 运行异常`, error);
        },
      });
      const serverTools = await client.tools();
      Object.assign(
        nextTools,
        namespaceTools(serverName, serverTools as Record<string, any>),
      );
      nextClients.push(client);
      log.i(
        `MCP server ${serverName} 已连接`,
        Object.keys(serverTools).length,
        "个工具",
      );
    } catch (error) {
      log.e(`MCP server ${serverName} 连接失败`, error);
    }
  }

  return {
    tools: nextTools,
    clients: nextClients,
  };
}

export async function getMcpTools() {
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    const rawConfigText = await readConfigFile();
    const nextSignature = rawConfigText ?? "__EMPTY__";

    if (nextSignature === cachedSignature) {
      return cachedTools;
    }

    try {
      const { tools, clients } =
        await buildMcpToolsFromRawConfig(rawConfigText);
      await closeClients(cachedClients);
      cachedSignature = nextSignature;
      cachedClients = clients;
      cachedTools = tools;
      log.i("MCP 配置加载成功", Object.keys(cachedTools).length, "个工具");
      return cachedTools;
    } catch (error) {
      log.e("MCP 配置加载失败", error);
      return cachedTools;
    }
  })();

  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}
