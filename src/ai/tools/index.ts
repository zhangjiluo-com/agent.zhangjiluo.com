import { tool, ToolLoopAgent, type ToolSet } from "ai";
import { exec } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { promisify } from "node:util";
import z from "zod";
import { createLogger } from "../../etc/log";
import { event } from "../../gateway/event";
import { EVENT_ID_AI_TASK_DISPATCH } from "../../etc/constants";
import { addTask, endTask } from "../task";
import { getMcpTools } from "./mcp";

const TOOL_WORKSPACE_ROOT = resolve(process.cwd());
const execAsync = promisify(exec);
const log = createLogger("ai:tools");

function toSafeAbsolutePath(inputPath: string) {
  const resolvedPath = resolve(TOOL_WORKSPACE_ROOT, inputPath);
  // if (
  //   resolvedPath !== TOOL_WORKSPACE_ROOT &&
  //   !resolvedPath.startsWith(`${TOOL_WORKSPACE_ROOT}${sep}`)
  // ) {
  //   throw new Error("Path is outside workspace root");
  // }
  return resolvedPath;
}

const listDirectoryTool = tool({
  description: "List the contents of a directory",
  inputSchema: z.object({
    path: z.string().describe("The path to the directory to list"),
  }),
  async execute(input) {
    const targetPath = toSafeAbsolutePath(input.path || ".");
    const entries = await readdir(targetPath, { withFileTypes: true });
    return {
      path: targetPath,
      entries: entries.map((entry) => ({
        name: entry.name,
        type: entry.isDirectory()
          ? "directory"
          : entry.isFile()
            ? "file"
            : "unknown",
      })),
    };
  },
});

const readFileAsTextTool = tool({
  description: "Read a file as text content",
  inputSchema: z.object({
    path: z.string().describe("The path to the file to read"),
    startChar: z
      .number()
      .int()
      .min(0)
      .describe("The start position (character index) to read from")
      .optional()
      .default(0),
    maxChars: z
      .number()
      .int()
      .min(1)
      .max(200000)
      .describe("The maximum number of characters to read")
      .optional()
      .default(5000),
  }),
  async execute(input) {
    try {
      const targetPath = toSafeAbsolutePath(input.path);
      const text = await readFile(targetPath, "utf8");
      const endChar = input.startChar + input.maxChars;
      return {
        result: "success",
        path: targetPath,
        content: text.slice(input.startChar, endChar),
        startChar: input.startChar,
        truncated: text.length > endChar,
        totalChars: text.length,
      };
    } catch (error) {
      return {
        result: "failed",
        path: input.path,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

const writeTextFileTool = tool({
  description:
    "Write text content to a file, file will be created if it doesn't exist",
  inputSchema: z.object({
    path: z.string().describe("The path to the file to write"),
    content: z.string().describe("The content to write to the file"),
  }),
  async execute(input) {
    const targetPath = toSafeAbsolutePath(input.path);
    try {
      await mkdir(dirname(targetPath), { recursive: true });
      await writeFile(targetPath, input.content, "utf8");
      return {
        result: "success",
        path: targetPath,
      };
    } catch (error) {
      return {
        result: "failed",
        path: targetPath,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

export const commandTool = tool({
  description: "Run a shell command on the system by node child_process.exec",
  inputSchema: z.object({
    command: z.string().trim().describe("The command to run"),
  }),
  async execute(input) {
    const startTime = Date.now();
    log.i("即将执行命令", input);
    try {
      const { stdout, stderr } = await execAsync(input.command, {
        // timeout: 10_000,
        encoding: "utf-8",
      });
      log.i("执行命令耗时:", Math.floor((Date.now() - startTime) / 1000), "秒");
      return {
        result: "success",
        command: input.command,
        stdout,
        stderr,
      };
    } catch (e: any) {
      log.e(
        "执行命令失败:",
        e,
        "耗时:",
        Math.floor((Date.now() - startTime) / 1000),
        "秒",
      );
      return {
        result: "failed",
        command: input.command,
        stdout: (e.stdout || "").substring(0, 2000),
        stderr: (e.stderr || e.message).substring(0, 2000),
        exit_code: e.status ?? 1,
      };
    }
  },
});

const taskDispatchTool = tool({
  description: `Dispatch a task to a async task agent which has empty memory.
  The async agent can use below tools to complete the task:

  - **command**: ${commandTool.description}

  If the task cannot be completed using the above tools, do not use this tool.
  Once the task end, system will notify the you as user message.
  Once task submit success, you can tell user.
`,
  inputSchema: z.object({
    name: z.string().trim().describe("The name of the task"),
    description: z
      .string()
      .trim()
      .min(1)
      .max(2000)
      .describe(
        "The description of the task, along with sufficient and accurate context",
      ),
  }),
  async execute(input, context) {
    try {
      if (!context.experimental_context) {
        return {
          result: "failed",
          reason: "系统异常, 无法派发任务",
        };
      }
      const taskId = addTask(input, context.experimental_context);
      return {
        result: "success",
        taskId,
      };
    } catch (error) {
      return {
        result: "failed",
        // task: input.task,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

export const taskResultSubmitTool = tool({
  description: `Submit a task result to system`,
  inputSchema: z.object({
    // taskId: z.string().trim().describe("The task id"),
    isCompleted: z.boolean().describe("Whether the task is completed"),
    result: z
      .string()
      .trim()
      .describe(
        "The task result completed simple description or failed reason",
      ),
  }),
  async execute(input, context) {
    try {
      endTask({
        // experimental_context 这里放 当前目标 task 对象
        taskId: (context.experimental_context as any).id,
        // taskId: input.taskId,
        isCompleted: input.isCompleted,
        result: input.result,
      });
      return {
        result: "success",
      };
    } catch (error) {
      return {
        result: "failed",
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

export const localTools = {
  task_dispatch: taskDispatchTool,
};

export async function getAssistantTools(): Promise<ToolSet> {
  return {
    ...localTools,
    ...(await getMcpTools()),
  };
}

export async function getAsyncTaskTools(): Promise<ToolSet> {
  return {
    command: commandTool,
    task_result_submit: taskResultSubmitTool,
    ...(await getMcpTools()),
  };
}
